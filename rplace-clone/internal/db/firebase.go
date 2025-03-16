package db

import (
	"context"
	"fmt"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/db"
	"google.golang.org/api/option"
)

var client *db.Client

func InitFirebase(ctx context.Context, firebaseURL string, credentialsPath string) error {
	conf := &firebase.Config{
		DatabaseURL: firebaseURL,
	}
	opt := option.WithCredentialsFile(credentialsPath)

	app, err := firebase.NewApp(ctx, conf, opt)
	if err != nil {
		return fmt.Errorf("initializing app: %w", err)
	}

	client, err = app.Database(ctx)
	if err != nil {
		return fmt.Errorf("initializing database client: %w", err)
	}

	return nil
}

// GetClient returns the initialized Firebase client
func GetClient() *db.Client {
	return client
}
