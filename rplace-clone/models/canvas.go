package models

import (
	"database/sql"
	"time"
)

type Canvas struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	Width     int       `json:"width"`
	Height    int       `json:"height"`
	Bitmap    []byte    `json:"bitmap"`
	CreatedAt time.Time `json:"created_at"`
}

type CanvasModel struct {
	DB *sql.DB
}

func (m *CanvasModel) CreateCanvas(userID, width, height int, bitmap []byte) (Canvas, error) {
	var canvas Canvas
	query := `INSERT INTO canvases (user_id, width, height, bitmap) VALUES ($1, $2, $3, $4) RETURNING id, created_at`
	err := m.DB.QueryRow(query, userID, width, height, bitmap).Scan(&canvas.ID, &canvas.CreatedAt)
	if err != nil {
		return canvas, err
	}
	canvas.UserID = userID
	canvas.Width = width
	canvas.Height = height
	canvas.Bitmap = bitmap
	return canvas, nil
}

func (m *CanvasModel) GetCanvas(id int) (Canvas, error) {
	var canvas Canvas
	query := `SELECT id, user_id, width, height, bitmap, created_at FROM canvases WHERE id = $1`
	err := m.DB.QueryRow(query, id).Scan(&canvas.ID, &canvas.UserID, &canvas.Width, &canvas.Height, &canvas.Bitmap, &canvas.CreatedAt)
	if err != nil {
		return canvas, err
	}
	return canvas, nil
}

func (m *CanvasModel) UpdateCanvasBitmap(id int, bitmap []byte) error {
	query := `UPDATE canvases SET bitmap = $1 WHERE id = $2`
	_, err := m.DB.Exec(query, bitmap, id)
	return err
}

// Create est une méthode factice permettant de créer un canvas
func (m *CanvasModel) Create(canvas *Canvas) error {
	// Affectation d'un ID simulé et la date de création
	canvas.ID = 1
	canvas.CreatedAt = time.Now()
	return nil
}

// Déclaration du type PixelUpdate pour la mise à jour des pixels via WebSocket
type PixelUpdate struct {
	X     int    `json:"x"`
	Y     int    `json:"y"`
	Color string `json:"color"`
}
