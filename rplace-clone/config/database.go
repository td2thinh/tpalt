package config

import (
	"database/sql"
	"log"

	_ "github.com/lib/pq"
)

var db *sql.DB

func InitDB(dataSourceName string) {
	var err error
	db, err = sql.Open("postgres", dataSourceName)
	if err != nil {
		log.Fatal("Error connecting to the database: ", err)
	}

	if err = db.Ping(); err != nil {
		log.Fatal("Database is unreachable: ", err)
	}
}

func GetDB() *sql.DB {
	return db
}
