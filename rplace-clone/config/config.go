package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config holds the application configuration
type Config struct {
	DBConnString  string
	JWTSecret     string
	JWTExpiration string
}

var config *Config

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
		log.Println("Warning: Error loading .env file, using environment variables")
	}

	return &Config{
		DBConnString:  getEnv("DB_CONN_STRING", "postgresql://goplace_owner:npg_BjWIhr7YxA9Z@ep-autumn-term-a2ll8hw0-pooler.eu-central-1.aws.neon.tech/goplace?sslmode=require"),
		JWTSecret:     getEnv("JWT_SECRET", "4a22c05459aa256790870ff46418c6f88a3cba6810bdd480b28b12b665b2f679"),
		JWTExpiration: getEnv("JWT_EXPIRATION", "24h"),
	}, nil
}

// GetConfig returns the application configuration
func GetConfig() *Config {
	return config
}
