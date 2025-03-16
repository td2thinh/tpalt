package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config holds the application configuration
type Config struct {
	DBConnString string
	JWTSecret    string
	FirebaseURL  string
}

func getEnv(key, defaultValue string) string {
	value, exists := os.LookupEnv(key)
	if !exists {
		return defaultValue
	}
	return value
}

// LoadConfig loads the application configuration from environment variables
func LoadConfig() (*Config, error) {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}
	// TODO: Actually have ENV file
	return &Config{
		DBConnString: getEnv("DB_CONN_STRING", "postgresql://goplace_owner:npg_GuJfdK6SVxU7@ep-restless-sunset-a2qw5ay6-pooler.eu-central-1.aws.neon.tech/goplace?sslmode=require"),
		JWTSecret:    getEnv("JWT_SECRET", "668e3a21cddb5334ea8ff433aab2af473286359437719a096d9ca1f586657ed9"),
		FirebaseURL:  getEnv("FIREBASE_CREDS", "https://goplace-f33c9-default-rtdb.europe-west1.firebasedatabase.app/"),
	}, nil
}
