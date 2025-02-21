package main

import (
	"log"
	"net/http"
	"os"
	"rplace-clone/routes"
)

func main() {
	// Récupération de la chaîne de connexion depuis la variable d'environnement ou utilisation d'une valeur par défaut
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://youruser:yourpassword@localhost:5432/yourdb?sslmode=disable"
	}

	// Initialisation de la base de données
	// config.InitDB(dsn)

	log.Println("dsn: ", dsn)

	// Initialisation de Redis (optionnel)
	// config.InitRedis()

	// Configuration du routeur via InitializeRoutes (à la place de ConfigureRoutes)
	router := routes.InitializeRoutes()

	log.Println("Le serveur tourne sur le port :8080")
	log.Fatal(http.ListenAndServe(":8080", router))
}
