package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// User represents a user in the system
type User struct {
	gorm.Model
	ID        uint           `json:"id" gorm:"primaryKey"`
	Username  string         `json:"username" gorm:"uniqueIndex;size:32" validate:"required,min=3,max=32"`
	Password  string         `json:"-" gorm:"size:100" validate:"required,min=6"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// UserClaims represents the JWT claims for a user
type UserClaims struct {
	UserID   uint   `json:"user_id"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

// SetPassword hashes the password and stores it in the user model
func (u *User) SetPassword(password string) error {
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Password = string(hashed)
	return nil
}

// CheckPassword verifies the provided password against the stored hash
func (u *User) CheckPassword(password string) error {
	return bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
}

// PixelGrid is a custom type for storing the canvas pixel data
type PixelGrid [][]string

// Value implements the driver.Valuer interface for PixelGrid
func (pg PixelGrid) Value() (driver.Value, error) {
	return json.Marshal(pg)
}

// Scan implements the sql.Scanner interface for PixelGrid
func (pg *PixelGrid) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(bytes, &pg)
}

// Canvas model for database storage
type Canvas struct {
	gorm.Model
	UUID        string `gorm:"uniqueIndex;not null"`
	Name        string `gorm:"not null"`
	Description string
	Size        int       `gorm:"not null"`
	CreatorID   uint      `gorm:"not null"`
	Creator     User      `gorm:"foreignKey:CreatorID"`
	Pixels      PixelGrid `gorm:"type:jsonb"`
	ActiveUsers int       `gorm:"-"` // Not stored in DB, managed in memory
}

// CanvasSnapshot stores PNG snapshots of the canvas
type CanvasSnapshot struct {
	gorm.Model
	CanvasID   uint   `gorm:"not null;index"`
	Canvas     Canvas `gorm:"foreignKey:CanvasID"`
	ImagePath  string `gorm:"not null"` // Path to stored PNG file
	SnapshotAt time.Time
}

// PixelUpdate represents a pixel placement update
type PixelUpdate struct {
	CanvasID  string    `json:"canvasId"`
	X         int       `json:"x"`
	Y         int       `json:"y"`
	Color     string    `json:"color"`
	UserID    uint      `json:"userId,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
}

// NewCanvasRequest represents a request to create a new canvas
type NewCanvasRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Size        int    `json:"size" binding:"required,min=10,max=1000"`
}
