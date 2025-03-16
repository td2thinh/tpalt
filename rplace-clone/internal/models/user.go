package models

import "time"

type User struct {
	ID           int       `json:"id"`
	Username     string    `json:"username" validate:"required,min=3,max=32"`
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
