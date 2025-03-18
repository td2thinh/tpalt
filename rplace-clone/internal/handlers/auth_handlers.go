package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"rplace-clone/config"
	"rplace-clone/internal/auth"
	"rplace-clone/internal/models"
)

// AuthHandler handles authentication-related requests
type AuthHandler struct {
	DB         *gorm.DB
	JWTService *auth.JWTService
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(db *gorm.DB, jwtService *auth.JWTService) *AuthHandler {
	return &AuthHandler{
		DB:         db,
		JWTService: jwtService,
	}
}

// RegisterRequest represents the request body for user registration
type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=32"`
	Password string `json:"password" binding:"required,min=6"`
}

// LoginRequest represents the request body for user login
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// AuthResponse represents the response for authentication requests
type AuthResponse struct {
	Token     string       `json:"token"`
	User      *models.User `json:"user"`
	ExpiresIn int64        `json:"expires_in"` // Expiration time in seconds
}

// Register handles user registration
func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if username already exists
	var existingUser models.User
	result := h.DB.Where("username = ?", req.Username).First(&existingUser)
	if result.RowsAffected > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "username already exists"})
		return
	}

	// Create new user
	user := models.User{
		Username: req.Username,
	}

	// Set password (this will hash it)
	if err := user.SetPassword(req.Password); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	// Save user to database
	if err := h.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
		return
	}

	// Generate JWT token
	token, err := h.JWTService.GenerateToken(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	duration, _ := time.ParseDuration(config.GetConfig().JWTExpiration)

	// Return user and token
	c.JSON(http.StatusCreated, AuthResponse{
		Token:     token,
		User:      &user,
		ExpiresIn: int64(duration.Seconds()),
	})
}

// Login handles user login
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Find user by username
	var user models.User
	result := h.DB.Where("username = ?", req.Username).First(&user)
	if result.Error != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid username or password"})
		return
	}

	// Check password
	if err := user.CheckPassword(req.Password); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid username or password"})
		return
	}

	// Generate JWT token
	token, err := h.JWTService.GenerateToken(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	duration, _ := time.ParseDuration(config.GetConfig().JWTExpiration)

	// Return user and token
	c.JSON(http.StatusCreated, AuthResponse{
		Token:     token,
		User:      &user,
		ExpiresIn: int64(duration.Seconds()),
	})
}
