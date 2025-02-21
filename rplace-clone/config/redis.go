package config

import (
    "context"
    "github.com/go-redis/redis/v8"
    "log"
)

var (
    rdb  *redis.Client
    ctx  = context.Background()
)

func InitRedis() {
    rdb = redis.NewClient(&redis.Options{
        Addr:     "localhost:6379", // Adresse de votre serveur Redis
        Password: "",               // Aucun mot de passe par défaut
        DB:       0,                // Utiliser la base de données par défaut
    })

    // Test de la connexion
    _, err := rdb.Ping(ctx).Result()
    if err != nil {
        log.Fatalf("Erreur de connexion à Redis: %v", err)
    }
}

func GetRedisClient() *redis.Client {
    return rdb
}