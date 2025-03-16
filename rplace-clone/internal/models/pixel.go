package models

import "time"

type Pixel struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	CanvasID  uint      `json:"canvas_id" gorm:"index"`
	Canvas    Canvas    `json:"canvas" gorm:"foreignKey:CanvasID"`
	UserID    uint      `json:"user_id" gorm:"index"`
	User      User      `json:"user" gorm:"foreignKey:UserID"`
	X         int       `json:"x" validate:"required,min=0"`
	Y         int       `json:"y" validate:"required,min=0"`
	Color     string    `json:"color" validate:"required,len=7"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
