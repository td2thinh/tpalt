package config

import (
	"context"
	"log"

	"github.com/go-redis/redis/v8"
)

var (
	rdb *redis.Client
	ctx = context.Background()
)

func InitRedis() {
	opt, _ := redis.ParseURL("rediss://default:AUZLAAIjcDFiOTI1Y2Y2YmMyZGQ0YjZiOTA0Zjk4OWUzZDFlY2RiZXAxMA@adjusted-seagull-17995.upstash.io:6379")
	rdb = redis.NewClient(opt) // Modification ici : assignation à la variable globale

	// Test de la connexion
	_, err := rdb.Ping(ctx).Result()
	if err != nil {
		log.Fatalf("Erreur de connexion à Redis: %v", err)
	}
}

func GetRedisClient() *redis.Client {
	return rdb
}
