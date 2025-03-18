package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"rplace-clone/config"
	"rplace-clone/internal/models"
	"rplace-clone/internal/routes"
	"rplace-clone/internal/services"
	socketio "rplace-clone/internal/socketio"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var (
	database        *gorm.DB
	socketManager   *socketio.Manager
	canvasService   *services.CanvasService
	snapshotService *services.SnapshotService
)

// InitPostgres initializes the Postgres database connection
func InitPostgres(dsn string) error {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return err
	}

	database = db
	return nil
}

// GetDB returns the initialized Postgres database connection
func GetDB() *gorm.DB {
	return database
}

func main() {
	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Initialize Postgres
	if err := InitPostgres(cfg.DBConnString); err != nil {
		log.Fatalf("Failed to initialize Postgres: %v", err)
	}

	// Migrate the database
	if err := database.AutoMigrate(&models.User{}, &models.Canvas{}, &models.CanvasSnapshot{}); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	// Setup router using Gin
	router := routes.SetupRouter(GetDB())

	// Start server
	srv := &http.Server{
		Addr:    ":8080",
		Handler: router,
	}

	// Start server in a goroutine so that it doesn't block
	go func() {
		log.Println("Starting server on :8080")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	// Shutdown services
	if canvasService != nil {
		canvasService.Shutdown()
	}
	if snapshotService != nil {
		snapshotService.Shutdown()
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server shutdown failed: %v", err)
	}

	log.Println("Server gracefully stopped")
}
