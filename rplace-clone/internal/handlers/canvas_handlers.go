package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"rplace-clone/internal/models"
)

// CanvasHandler handles canvas-related requests
type CanvasHandler struct {
	DB *gorm.DB
}

// NewCanvasHandler creates a new canvas handler
func NewCanvasHandler(db *gorm.DB) *CanvasHandler {
	return &CanvasHandler{
		DB: db,
	}
}

// CreateCanvasRequest represents the request body for canvas creation
type CreateCanvasRequest struct {
	Name        string `json:"name" binding:"required,min=3,max=100"`
	Width       int    `json:"width" binding:"required,min=10,max=1000"`
	Height      int    `json:"height" binding:"required,min=10,max=1000"`
	Description string `json:"description"`
	IsPublic    bool   `json:"is_public"`
}

// CreateCanvas handles canvas creation
func (h *CanvasHandler) CreateCanvas(c *gin.Context) {
	var req CreateCanvasRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	// Create new canvas
	canvas := models.Canvas{
		Name:        req.Name,
		Width:       req.Width,
		Height:      req.Height,
		CreatorID:   userID.(uint),
		Description: req.Description,
		IsPublic:    req.IsPublic,
	}

	// Save canvas to database
	if err := h.DB.Create(&canvas).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create canvas"})
		return
	}

	// Return the created canvas
	c.JSON(http.StatusCreated, gin.H{
		"message": "Canvas created successfully",
		"canvas":  canvas,
	})
}

// GetCanvas handles retrieving a specific canvas
func (h *CanvasHandler) GetCanvas(c *gin.Context) {
	// Get canvas ID from URL
	canvasID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid canvas ID"})
		return
	}

	// Find canvas in database
	var canvas models.Canvas
	if err := h.DB.First(&canvas, canvasID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "canvas not found"})
		return
	}

	// Check if canvas is public or if user is the creator
	if !canvas.IsPublic {
		userID, exists := c.Get("user_id")
		if !exists || userID.(uint) != canvas.CreatorID {
			c.JSON(http.StatusForbidden, gin.H{"error": "you don't have permission to view this canvas"})
			return
		}
	}

	// Return the canvas
	c.JSON(http.StatusOK, gin.H{
		"canvas": canvas,
	})
}

// ListCanvases handles retrieving all public canvases and user's private canvases
func (h *CanvasHandler) ListCanvases(c *gin.Context) {
	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")

	var canvases []models.Canvas
	query := h.DB.Where("is_public = ?", true)

	// If user is authenticated, include their private canvases
	if exists {
		query = query.Or("creator_id = ?", userID)
	}

	// Execute query
	if err := query.Find(&canvases).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch canvases"})
		return
	}

	// Return the canvases
	c.JSON(http.StatusOK, gin.H{
		"canvases": canvases,
	})
}

// UpdatePixelRequest represents the request body for pixel updates
type UpdatePixelRequest struct {
	X     int    `json:"x" binding:"required,min=0"`
	Y     int    `json:"y" binding:"required,min=0"`
	Color string `json:"color" binding:"required,len=7"` // Hex color code (#RRGGBB)
}

// UpdatePixel handles updating a pixel on a canvas
func (h *CanvasHandler) UpdatePixel(c *gin.Context) {
	var req UpdatePixelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get canvas ID from URL
	canvasID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid canvas ID"})
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	// Find canvas in database
	var canvas models.Canvas
	if err := h.DB.First(&canvas, canvasID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "canvas not found"})
		return
	}

	// Check if pixel coordinates are within canvas bounds
	if req.X >= canvas.Width || req.Y >= canvas.Height {
		c.JSON(http.StatusBadRequest, gin.H{"error": "pixel coordinates out of bounds"})
		return
	}

	// Create or update pixel
	pixel := models.Pixel{
		CanvasID: uint(canvasID),
		UserID:   userID.(uint),
		X:        req.X,
		Y:        req.Y,
		Color:    req.Color,
	}

	// Use upsert operation (create if not exists, update if exists)
	result := h.DB.Where("canvas_id = ? AND x = ? AND y = ?", canvasID, req.X, req.Y).
		Assign(models.Pixel{UserID: userID.(uint), Color: req.Color}).
		FirstOrCreate(&pixel)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update pixel"})
		return
	}

	// Return success
	c.JSON(http.StatusOK, gin.H{
		"message": "Pixel updated successfully",
		"pixel":   pixel,
	})
}

// GetCanvasPixels handles retrieving all pixels for a canvas
func (h *CanvasHandler) GetCanvasPixels(c *gin.Context) {
	// Get canvas ID from URL
	canvasID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid canvas ID"})
		return
	}

	// Find canvas in database
	var canvas models.Canvas
	if err := h.DB.First(&canvas, canvasID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "canvas not found"})
		return
	}

	// Check if canvas is public or if user is the creator
	if !canvas.IsPublic {
		userID, exists := c.Get("user_id")
		if !exists || userID.(uint) != canvas.CreatorID {
			c.JSON(http.StatusForbidden, gin.H{"error": "you don't have permission to view this canvas"})
			return
		}
	}

	// Get all pixels for the canvas
	var pixels []models.Pixel
	if err := h.DB.Where("canvas_id = ?", canvasID).Find(&pixels).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch pixels"})
		return
	}

	// Return the pixels
	c.JSON(http.StatusOK, gin.H{
		"pixels": pixels,
	})
}
