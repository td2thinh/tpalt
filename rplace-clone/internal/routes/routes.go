package routes

import (
	"net/http"

	"firebase.google.com/go/v4/db"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"rplace-clone/config"
	"rplace-clone/internal/auth"
	"rplace-clone/internal/handlers"
)

// SetupRouter sets up the routes for the application
func SetupRouter(pgDB *gorm.DB, fbDB *db.Client) *gin.Engine {
	r := gin.Default()

	// Middleware
	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	r.Static("/static", "./static")

	// Initialize JWT service
	cfg, _ := config.LoadConfig()
	jwtService, _ := auth.NewJWTService(cfg.JWTSecret, cfg.JWTExpiration)

	// Initialize auth handler
	authHandler := handlers.NewAuthHandler(pgDB, jwtService)

	// Public routes
	r.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "Welcome to r/place Clone API",
		})
	})
	r.GET("/health", healthCheckHandler)

	// Group API routes
	api := r.Group("/api")
	{
		// Auth routes
		api.POST("/auth/register", authHandler.Register)
		api.POST("/auth/login", authHandler.Login)

		// Public API routes
		api.GET("/canvases", listCanvasesHandler)

		// Protected routes
		protected := api.Group("")
		protected.Use(auth.AuthMiddleware(jwtService))
		{
			// Test route for authentication
			protected.GET("/me", func(c *gin.Context) {
				userID, _ := c.Get("user_id")
				username, _ := c.Get("username")

				c.JSON(http.StatusOK, gin.H{
					"user_id":  userID,
					"username": username,
					"message":  "You are authenticated!",
				})
			})

			protected.POST("/canvas", createCanvasHandler)
			protected.GET("/canvas/:id", getCanvasHandler)
			protected.POST("/canvas/:id/pixel", updatePixelHandler)
		}
	}

	return r
}

// healthCheckHandler returns a simple 200 OK response
func healthCheckHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"message": "Server is running",
	})
}

// Placeholder for list canvases handler
func listCanvasesHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"canvases": []string{}, // Will fetch from database later
	})
}

// Placeholder for create canvas handler
func createCanvasHandler(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{
		"message": "Not implemented yet",
	})
}

// Placeholder for get canvas handler
func getCanvasHandler(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{
		"message": "Not implemented yet",
	})
}

// Placeholder for update pixel handler
func updatePixelHandler(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{
		"message": "Not implemented yet",
	})
}
