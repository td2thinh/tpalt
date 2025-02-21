package config

import (
	"database/sql"
	"log"

	_ "github.com/lib/pq"
)

var db *sql.DB

func InitDB(dataSourceName string) {
	var err error
	// Utilisez "=" et non ":=" pour ne pas créer de variable locale pour "db"
	db, err = sql.Open("postgres", dataSourceName)
	if err != nil {
		log.Fatal("Error connecting to the database: ", err)
	}

	if err = db.Ping(); err != nil {
		log.Fatal("Database is unreachable: ", err)
	}
	log.Println("Database connected: ", db)

	// Exécution des migrations (création des tables si elles n'existent pas)
	migrationQueries := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY,
			username TEXT NOT NULL UNIQUE,
			password TEXT NOT NULL
		);`,
		`CREATE TABLE IF NOT EXISTS canvases (
			id SERIAL PRIMARY KEY,
			user_id INT NOT NULL,
			width INT NOT NULL,
			height INT NOT NULL,
			bitmap BYTEA,
			created_at TIMESTAMP NOT NULL DEFAULT NOW(),
			FOREIGN KEY (user_id) REFERENCES users(id)
		);`,
	}

	for _, query := range migrationQueries {
		if _, err := db.Exec(query); err != nil {
			log.Fatal("Erreur lors de l'exécution des migrations : ", err)
		}
	}

	// Insertion d'un utilisateur par défaut pour garantir un id valide lors de la création d'un canvas
	defaultUserQuery := `
		INSERT INTO users (username, password)
		VALUES ('default', 'defaultpassword')
		ON CONFLICT (username) DO NOTHING;
	`
	if _, err := db.Exec(defaultUserQuery); err != nil {
		log.Fatal("Erreur lors de l'insertion de l'utilisateur par défaut : ", err)
	}
}

func GetDB() *sql.DB {
	log.Println("database : ", db)
	return db
}
