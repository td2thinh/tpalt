package main

import (
	"fmt"
	"net/http"
	"path/filepath"
)

func main() {
	// API routes
	http.HandleFunc("/health", healthCheckHandler)

	// Static files
	http.Handle("/static/",
		http.StripPrefix("/static/", http.FileServer(http.Dir("../../static"))))

	// HTML templates
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, filepath.Join("../../templates", "index.html"))
	})

	fmt.Println("Starting server on :8080")
	http.ListenAndServe(":8080", nil)
}
