package db

import (
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var database *gorm.DB

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
