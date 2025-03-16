package routes

import (
	"net/http"

	"firebase.google.com/go/v4/db"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// SetupRouter sets up the routes for the application
func SetupRouter(pgDB *gorm.DB, fbDB *db.Client) *gin.Engine {
	r := gin.Default()

	// Middleware
	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	// // Serve static files
	// r.Static("/static", "./static")

	// // Load HTML templates
	// r.LoadHTMLGlob("templates/*")

	// Public routes
	r.GET("/", homeHandler)
	r.GET("/health", healthCheckHandler)

	// Group API routes
	// api := r.Group("/api")
	// {
	// api.GET("/canvases", listCanvasesHandler)

	// Protected routes (will add auth middleware later)
	// api.Use(authMiddleware())
	// {
	//     api.POST("/canvas", createCanvasHandler)
	//     api.GET("/canvas/:id", getCanvasHandler)
	//     api.POST("/canvas/:id/pixel", updatePixelHandler)
	// }
	// }

	return r
}

// healthCheckHandler returns a simple 200 OK response
func healthCheckHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"message": "Server is running",
	})
}

// Placeholder for home handler
func homeHandler(c *gin.Context) {
	c.HTML(http.StatusOK, "index.html", gin.H{
		"title": "r/place Clone",
	})
}

// Placeholder for list canvases handler
func listCanvasesHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"canvases": []string{}, // Will fetch from database later
	})
}
