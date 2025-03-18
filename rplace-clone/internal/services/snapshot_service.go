package services

import (
	"fmt"
	"image"
	"image/color"
	"image/png"
	"log"
	"os"
	"path/filepath"
	"sync"
	"time"

	"gorm.io/gorm"

	"rplace-clone/internal/models"
)

// SnapshotService handles canvas snapshot operations
type SnapshotService struct {
	db            *gorm.DB
	canvasService *CanvasService
	snapshotDir   string
	mutex         sync.Mutex
	// Channel to signal shutdown
	shutdown chan struct{}
}

// NewSnapshotService creates a new snapshot service
func NewSnapshotService(db *gorm.DB, canvasService *CanvasService, snapshotDir string) (*SnapshotService, error) {
	// Create snapshot directory if it doesn't exist
	if err := os.MkdirAll(snapshotDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create snapshot directory: %w", err)
	}

	service := &SnapshotService{
		db:            db,
		canvasService: canvasService,
		snapshotDir:   snapshotDir,
		shutdown:      make(chan struct{}),
	}

	// Start background task
	go service.periodicSnapshots()

	return service, nil
}

// Shutdown stops all background tasks
func (s *SnapshotService) Shutdown() {
	close(s.shutdown)
}

// CreateSnapshot creates a snapshot of a canvas
func (s *SnapshotService) CreateSnapshot(canvasID string) (*models.CanvasSnapshot, error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	// Get canvas
	canvas, err := s.canvasService.GetCanvas(canvasID)
	if err != nil {
		return nil, fmt.Errorf("failed to get canvas: %w", err)
	}

	// Create PNG image
	img, err := s.createPNGFromCanvas(canvas)
	if err != nil {
		return nil, fmt.Errorf("failed to create PNG: %w", err)
	}

	// Generate filename
	timestamp := time.Now().Format("20060102-150405")
	filename := fmt.Sprintf("%s-%s.png", canvasID, timestamp)
	filepath := filepath.Join(s.snapshotDir, filename)

	// Save PNG to file
	if err := s.savePNG(img, filepath); err != nil {
		return nil, fmt.Errorf("failed to save PNG: %w", err)
	}

	// Create snapshot record in database
	snapshot := models.CanvasSnapshot{
		CanvasID:   canvas.ID,
		ImagePath:  filename,
		SnapshotAt: time.Now(),
	}

	if err := s.db.Create(&snapshot).Error; err != nil {
		// Try to delete the file if database insert fails
		os.Remove(filepath)
		return nil, fmt.Errorf("failed to create snapshot record: %w", err)
	}

	log.Printf("Created snapshot for canvas %s: %s", canvasID, filename)
	return &snapshot, nil
}

// GetLatestSnapshot gets the latest snapshot for a canvas
func (s *SnapshotService) GetLatestSnapshot(canvasID string) (*models.CanvasSnapshot, error) {
	var canvas models.Canvas
	if err := s.db.Where("uuid = ?", canvasID).First(&canvas).Error; err != nil {
		return nil, fmt.Errorf("canvas not found: %w", err)
	}

	var snapshot models.CanvasSnapshot
	if err := s.db.Where("canvas_id = ?", canvas.ID).Order("snapshot_at DESC").First(&snapshot).Error; err != nil {
		return nil, fmt.Errorf("no snapshot found: %w", err)
	}

	return &snapshot, nil
}

// GetSnapshotPath gets the full path to a snapshot file
func (s *SnapshotService) GetSnapshotPath(filename string) string {
	return filepath.Join(s.snapshotDir, filename)
}

// createPNGFromCanvas creates a PNG image from a canvas
func (s *SnapshotService) createPNGFromCanvas(canvas *models.Canvas) (*image.RGBA, error) {
	size := canvas.Size
	img := image.NewRGBA(image.Rect(0, 0, size, size))

	// Fill with pixels from canvas
	for y := 0; y < size; y++ {
		for x := 0; x < size; x++ {
			// Parse hex color
			hexColor := canvas.Pixels[y][x]
			if len(hexColor) < 7 {
				hexColor = "#FFFFFF" // Default to white if invalid
			}

			var r, g, b uint8
			fmt.Sscanf(hexColor[1:], "%02x%02x%02x", &r, &g, &b)
			img.Set(x, y, color.RGBA{r, g, b, 255})
		}
	}

	return img, nil
}

// savePNG saves an image to a PNG file
func (s *SnapshotService) savePNG(img *image.RGBA, filepath string) error {
	file, err := os.Create(filepath)
	if err != nil {
		return err
	}
	defer file.Close()

	return png.Encode(file, img)
}

// periodicSnapshots periodically creates snapshots of all canvases
func (s *SnapshotService) periodicSnapshots() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			s.createSnapshotsForAllCanvases()
		case <-s.shutdown:
			s.createSnapshotsForAllCanvases() // Create snapshots on shutdown
			return
		}
	}
}

// createSnapshotsForAllCanvases creates snapshots for all canvases
func (s *SnapshotService) createSnapshotsForAllCanvases() {
	// Get all canvases
	canvases, err := s.canvasService.ListCanvases()
	if err != nil {
		log.Printf("Error listing canvases for snapshots: %v", err)
		return
	}

	// Create snapshot for each canvas
	for _, canvas := range canvases {
		_, err := s.CreateSnapshot(canvas.UUID)
		if err != nil {
			log.Printf("Error creating snapshot for canvas %s: %v", canvas.UUID, err)
		}
	}
}
