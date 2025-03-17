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

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(pgDB, jwtService)
	canvasHandler := handlers.NewCanvasHandler(pgDB)

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

		// Public API routes - list public canvases
		api.GET("/canvases", canvasHandler.ListCanvases)

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

			// Canvas routes
			protected.POST("/canvas", canvasHandler.CreateCanvas)
			protected.GET("/canvas/:id", canvasHandler.GetCanvas)
			protected.GET("/canvas/:id/pixels", canvasHandler.GetCanvasPixels)
			protected.POST("/canvas/:id/pixel", canvasHandler.UpdatePixel)
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
