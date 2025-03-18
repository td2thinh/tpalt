package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"rplace-clone/internal/models"
	"rplace-clone/internal/services"
)

// CanvasHandler handles canvas-related requests
type CanvasHandler struct {
	DB              *gorm.DB
	CanvasService   *services.CanvasService
	SnapshotService *services.SnapshotService
}

// NewCanvasHandler creates a new canvas handler
func NewCanvasHandler(db *gorm.DB, canvasService *services.CanvasService, snapshotService *services.SnapshotService) *CanvasHandler {
	return &CanvasHandler{
		DB:              db,
		CanvasService:   canvasService,
		SnapshotService: snapshotService,
	}
}

// CreateCanvas handles canvas creation
func (h *CanvasHandler) CreateCanvas(c *gin.Context) {
	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// Parse request
	var req models.NewCanvasRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create canvas
	canvas, err := h.CanvasService.CreateCanvas(req.Name, req.Description, req.Size, userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Return canvas
	c.JSON(http.StatusCreated, canvas)
}

// ListCanvases handles listing all canvases
func (h *CanvasHandler) ListCanvases(c *gin.Context) {
	// Get canvases
	canvases, err := h.CanvasService.ListCanvases()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Return canvases
	c.JSON(http.StatusOK, canvases)
}

// GetCanvas handles retrieving a canvas by ID
func (h *CanvasHandler) GetCanvas(c *gin.Context) {
	// Get canvas ID from URL
	canvasID := c.Param("id")
	if canvasID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "canvas ID is required"})
		return
	}

	// Get canvas
	canvas, err := h.CanvasService.GetCanvas(canvasID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "canvas not found"})
		return
	}

	// Return canvas
	c.JSON(http.StatusOK, canvas)
}

// GetCanvasPixels handles retrieving a canvas's pixels
func (h *CanvasHandler) GetCanvasPixels(c *gin.Context) {
	// Get canvas ID from URL
	canvasID := c.Param("id")
	if canvasID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "canvas ID is required"})
		return
	}

	// Get canvas
	canvas, err := h.CanvasService.GetCanvas(canvasID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "canvas not found"})
		return
	}

	// Return pixels
	c.JSON(http.StatusOK, gin.H{
		"canvasID": canvasID,
		"size":     canvas.Size,
		"pixels":   canvas.Pixels,
	})
}

// UpdatePixel handles updating a pixel on a canvas
func (h *CanvasHandler) UpdatePixel(c *gin.Context) {
	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// Get canvas ID from URL
	canvasID := c.Param("id")
	if canvasID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "canvas ID is required"})
		return
	}

	// Parse request
	type PixelRequest struct {
		X     int    `json:"x" binding:"required"`
		Y     int    `json:"y" binding:"required"`
		Color string `json:"color" binding:"required"`
	}

	var req PixelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update pixel
	err := h.CanvasService.UpdatePixel(canvasID, req.X, req.Y, req.Color, userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Return success
	c.JSON(http.StatusOK, gin.H{"status": "success"})
}

// GetCanvasSnapshot handles retrieving the latest snapshot for a canvas
func (h *CanvasHandler) GetCanvasSnapshot(c *gin.Context) {
	// Get canvas ID from URL
	canvasID := c.Param("id")
	if canvasID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "canvas ID is required"})
		return
	}

	// Get latest snapshot
	snapshot, err := h.SnapshotService.GetLatestSnapshot(canvasID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "snapshot not found"})
		return
	}

	// Return snapshot path
	c.JSON(http.StatusOK, gin.H{
		"canvasID":   canvasID,
		"snapshotID": snapshot.ID,
		"imagePath":  snapshot.ImagePath,
		"createdAt":  snapshot.SnapshotAt,
	})
}

// ServeCanvasSnapshot serves a canvas snapshot image
func (h *CanvasHandler) ServeCanvasSnapshot(c *gin.Context) {
	// Get snapshot ID from URL
	snapshotID := c.Param("id")
	if snapshotID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "snapshot ID is required"})
		return
	}

	// Convert snapshot ID to uint
	id, err := strconv.ParseUint(snapshotID, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid snapshot ID"})
		return
	}

	// Get snapshot from database
	var snapshot models.CanvasSnapshot
	if err := h.DB.First(&snapshot, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "snapshot not found"})
		return
	}

	// Get snapshot path
	path := h.SnapshotService.GetSnapshotPath(snapshot.ImagePath)

	// Serve file
	c.File(path)
}

// CreateCanvasSnapshot handles creating a new snapshot for a canvas
func (h *CanvasHandler) CreateCanvasSnapshot(c *gin.Context) {
	// Get canvas ID from URL
	canvasID := c.Param("id")
	if canvasID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "canvas ID is required"})
		return
	}

	// Create snapshot
	snapshot, err := h.SnapshotService.CreateSnapshot(canvasID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Return snapshot
	c.JSON(http.StatusCreated, gin.H{
		"canvasID":   canvasID,
		"snapshotID": snapshot.ID,
		"imagePath":  snapshot.ImagePath,
		"createdAt":  snapshot.SnapshotAt,
	})
}
