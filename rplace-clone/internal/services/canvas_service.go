package services

import (
	"errors"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"rplace-clone/internal/models"
	"rplace-clone/internal/socketio"
)

// CanvasService handles canvas operations
type CanvasService struct {
	db            *gorm.DB
	socketManager *socketio.Manager
	canvasMutex   sync.RWMutex
	// Map of canvas ID to canvas data
	canvasCache map[string]*CanvasData
	// Channel to signal shutdown
	shutdown chan struct{}
}

// CanvasData represents a canvas in memory
type CanvasData struct {
	Canvas      models.Canvas
	LastUpdated time.Time
	Mutex       sync.RWMutex
	IsDirty     bool // Whether the canvas has been modified since last save
}

// NewCanvasService creates a new canvas service
func NewCanvasService(db *gorm.DB, socketManager *socketio.Manager) *CanvasService {
	service := &CanvasService{
		db:            db,
		socketManager: socketManager,
		canvasCache:   make(map[string]*CanvasData),
		shutdown:      make(chan struct{}),
	}

	// Start background tasks
	go service.periodicSave()
	go service.updateActiveUsers()

	return service
}

// Shutdown stops all background tasks
func (s *CanvasService) Shutdown() {
	close(s.shutdown)
}

// CreateCanvas creates a new canvas
func (s *CanvasService) CreateCanvas(name, description string, size int, creatorID uint) (*models.Canvas, error) {
	// Validate size
	if size < 10 || size > 1000 {
		return nil, errors.New("invalid canvas size")
	}

	// Generate UUID for the canvas
	canvasUUID := uuid.New().String()

	// Initialize pixel grid
	pixels := make(models.PixelGrid, size)
	for i := range pixels {
		pixels[i] = make([]string, size)
		for j := range pixels[i] {
			pixels[i][j] = "#FFFFFF" // Default white color
		}
	}

	// Create canvas in database
	canvas := models.Canvas{
		UUID:        canvasUUID,
		Name:        name,
		Description: description,
		Size:        size,
		CreatorID:   creatorID,
		Pixels:      pixels,
	}

	if err := s.db.Create(&canvas).Error; err != nil {
		return nil, err
	}

	// Add to cache
	s.canvasMutex.Lock()
	s.canvasCache[canvasUUID] = &CanvasData{
		Canvas:      canvas,
		LastUpdated: time.Now(),
		IsDirty:     false,
	}
	s.canvasMutex.Unlock()

	return &canvas, nil
}

// GetCanvas retrieves a canvas by ID
func (s *CanvasService) GetCanvas(canvasID string) (*models.Canvas, error) {
	// Check cache first
	s.canvasMutex.RLock()
	cachedCanvas, exists := s.canvasCache[canvasID]
	s.canvasMutex.RUnlock()

	if exists {
		cachedCanvas.Mutex.RLock()
		canvas := cachedCanvas.Canvas
		cachedCanvas.Mutex.RUnlock()

		// Update active users count
		canvas.ActiveUsers = s.socketManager.GetActiveUsersCount(canvasID)

		return &canvas, nil
	}

	// Not in cache, fetch from database
	var canvas models.Canvas
	if err := s.db.Where("uuid = ?", canvasID).First(&canvas).Error; err != nil {
		return nil, err
	}

	// Add to cache
	s.canvasMutex.Lock()
	s.canvasCache[canvasID] = &CanvasData{
		Canvas:      canvas,
		LastUpdated: time.Now(),
		IsDirty:     false,
	}
	s.canvasMutex.Unlock()

	// Update active users count
	canvas.ActiveUsers = s.socketManager.GetActiveUsersCount(canvasID)

	return &canvas, nil
}

// ListCanvases retrieves all canvases
func (s *CanvasService) ListCanvases() ([]models.Canvas, error) {
	var canvases []models.Canvas
	if err := s.db.Find(&canvases).Error; err != nil {
		return nil, err
	}

	// Update active users count for each canvas
	for i := range canvases {
		canvases[i].ActiveUsers = s.socketManager.GetActiveUsersCount(canvases[i].UUID)
	}

	return canvases, nil
}

// UpdatePixel updates a pixel on a canvas
func (s *CanvasService) UpdatePixel(canvasID string, x, y int, color string, userID uint) error {
	// Get canvas from cache or load it
	s.canvasMutex.RLock()
	cachedCanvas, exists := s.canvasCache[canvasID]
	s.canvasMutex.RUnlock()

	if !exists {
		// Load canvas from database
		_, err := s.GetCanvas(canvasID)
		if err != nil {
			return err
		}

		s.canvasMutex.RLock()
		cachedCanvas = s.canvasCache[canvasID]
		s.canvasMutex.RUnlock()

		if cachedCanvas == nil {
			return errors.New("failed to load canvas")
		}
	}

	// Validate coordinates
	cachedCanvas.Mutex.RLock()
	size := cachedCanvas.Canvas.Size
	cachedCanvas.Mutex.RUnlock()

	if x < 0 || x >= size || y < 0 || y >= size {
		return errors.New("invalid pixel coordinates")
	}

	// Update pixel in memory
	cachedCanvas.Mutex.Lock()
	cachedCanvas.Canvas.Pixels[y][x] = color
	cachedCanvas.LastUpdated = time.Now()
	cachedCanvas.IsDirty = true
	cachedCanvas.Mutex.Unlock()

	// Use the socket manager to broadcast the update
	s.socketManager.UpdateCanvasInMemory(canvasID, x, y, color)

	return nil
}

// SaveCanvasToDatabase saves a canvas from memory to the database
func (s *CanvasService) SaveCanvasToDatabase(canvasID string) error {
	s.canvasMutex.RLock()
	cachedCanvas, exists := s.canvasCache[canvasID]
	s.canvasMutex.RUnlock()

	if !exists {
		return errors.New("canvas not found in cache")
	}

	cachedCanvas.Mutex.RLock()
	canvas := cachedCanvas.Canvas
	isDirty := cachedCanvas.IsDirty
	cachedCanvas.Mutex.RUnlock()

	// Only save if dirty
	if !isDirty {
		return nil
	}

	// Save to database
	if err := s.db.Model(&models.Canvas{}).Where("uuid = ?", canvasID).Update("pixels", canvas.Pixels).Error; err != nil {
		return err
	}

	// Mark as clean
	cachedCanvas.Mutex.Lock()
	cachedCanvas.IsDirty = false
	cachedCanvas.Mutex.Unlock()

	log.Printf("Saved canvas %s to database", canvasID)
	return nil
}

// periodicSave periodically saves all dirty canvases to the database
func (s *CanvasService) periodicSave() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			s.saveAllDirtyCanvases()
		case <-s.shutdown:
			s.saveAllDirtyCanvases() // Save all canvases on shutdown
			return
		}
	}
}

// saveAllDirtyCanvases saves all dirty canvases to the database
func (s *CanvasService) saveAllDirtyCanvases() {
	s.canvasMutex.RLock()
	canvasIDs := make([]string, 0, len(s.canvasCache))
	for id, data := range s.canvasCache {
		data.Mutex.RLock()
		if data.IsDirty {
			canvasIDs = append(canvasIDs, id)
		}
		data.Mutex.RUnlock()
	}
	s.canvasMutex.RUnlock()

	for _, id := range canvasIDs {
		if err := s.SaveCanvasToDatabase(id); err != nil {
			log.Printf("Error saving canvas %s: %v", id, err)
		}
	}
}

// updateActiveUsers periodically updates active users count for all canvases
func (s *CanvasService) updateActiveUsers() {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			s.canvasMutex.RLock()
			for id := range s.canvasCache {
				s.socketManager.BroadcastActiveUsers(id)
			}
			s.canvasMutex.RUnlock()
		case <-s.shutdown:
			return
		}
	}
}
