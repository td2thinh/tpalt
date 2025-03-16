package models

import (
	"time"
)

type Canvas struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Name        string    `json:"name" validate:"required,min=3,max=100"`
	Width       int       `json:"width" validate:"required,min=10,max=1000"`
	Height      int       `json:"height" validate:"required,min=10,max=1000"`
	CreatorID   uint      `json:"creator_id"`
	Creator     User      `json:"creator" gorm:"foreignKey:CreatorID"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	Description string    `json:"description"`
	IsPublic    bool      `json:"is_public" gorm:"default:false"`
}
