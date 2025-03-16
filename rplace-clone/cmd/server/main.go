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
	"rplace-clone/internal/db"
	"rplace-clone/internal/routes"
)

func main() {
	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Initialize Firebase
	ctx := context.Background()
	if err := db.InitFirebase(ctx, cfg.FirebaseURL, cfg.FirebaseKeyPath); err != nil {
		log.Fatalf("Failed to initialize Firebase: %v", err)
	}

	// Initialize Postgres
	pgDB, err := db.NewPostgresDB(cfg.DBConnString)
	if err != nil {
		log.Fatalf("Failed to initialize Postgres: %v", err)
	}

	// Setup router using Gin
	router := routes.SetupRouter(pgDB, db.GetClient())

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

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server shutdown failed: %v", err)
	}

	log.Println("Server gracefully stopped")
}
