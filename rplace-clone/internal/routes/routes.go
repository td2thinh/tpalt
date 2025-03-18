package routes

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"rplace-clone/config"
	"rplace-clone/internal/auth"
	"rplace-clone/internal/handlers"
	"rplace-clone/internal/middleware"
	"rplace-clone/internal/services"
	socketio "rplace-clone/internal/socketio"
)

// SetupRouter sets up the routes for the application
func SetupRouter(pgDB *gorm.DB) *gin.Engine {
	r := gin.Default()

	// Middleware
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(middleware.CORSMiddleware())

	// Create snapshot directory
	snapshotDir := "./snapshots"
	if err := os.MkdirAll(snapshotDir, 0755); err != nil {
		panic(err)
	}

	// Initialize Socket.IO
	socketManager, err := socketio.NewManager(pgDB)
	if err != nil {
		panic(err)
	}

	// Initialize services
	canvasService := services.NewCanvasService(pgDB, socketManager)
	snapshotService, err := services.NewSnapshotService(pgDB, canvasService, snapshotDir)
	if err != nil {
		panic(err)
	}

	// Initialize JWT service
	cfg, err := config.LoadConfig()
	if err != nil {
		panic(err)
	}
	jwtService, _ := auth.NewJWTService(cfg.JWTSecret, cfg.JWTExpiration)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(pgDB, jwtService)
	canvasHandler := handlers.NewCanvasHandler(pgDB, canvasService, snapshotService)

	// Serve static files
	r.Static("/static", "./static")
	r.Static("/snapshots", snapshotDir)

	// Set up Socket.IO server with CORS handling
	socketHandler := socketManager.Server()

	// Helper function to set CORS headers for Socket.IO
	setSocketIOCorsHeaders := func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		if origin == "" {
			origin = "*"
		}

		c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")
	}

	// Handle Socket.IO routes
	r.GET("/socket.io/*any", func(c *gin.Context) {
		setSocketIOCorsHeaders(c)
		socketHandler.ServeHTTP(c.Writer, c.Request)
	})

	r.POST("/socket.io/*any", func(c *gin.Context) {
		setSocketIOCorsHeaders(c)
		socketHandler.ServeHTTP(c.Writer, c.Request)
	})

	r.OPTIONS("/socket.io/*any", func(c *gin.Context) {
		setSocketIOCorsHeaders(c)
		c.AbortWithStatus(204)
	})

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
		api.GET("/canvas/:id", canvasHandler.GetCanvas)
		api.GET("/canvas/:id/pixels", canvasHandler.GetCanvasPixels)
		api.GET("/canvas/:id/snapshot", canvasHandler.GetCanvasSnapshot)
		api.GET("/snapshot/:id", canvasHandler.ServeCanvasSnapshot)

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
			protected.POST("/canvas/:id/pixel", canvasHandler.UpdatePixel)
			protected.POST("/canvas/:id/snapshot", canvasHandler.CreateCanvasSnapshot)
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
