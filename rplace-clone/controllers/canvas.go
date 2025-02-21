package controllers

import (
	"encoding/json"
	"net/http"
	"time"

	"rplace-clone/models"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{}

type CanvasController struct {
	canvases models.CanvasModel
}

// Méthode associée à CanvasController pour créer un canvas
func (cc *CanvasController) CreateCanvasHandler(w http.ResponseWriter, r *http.Request) {
	var canvas models.Canvas
	if err := json.NewDecoder(r.Body).Decode(&canvas); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := cc.canvases.Create(&canvas); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(canvas)
}

// Méthode factice pour simuler la récupération d'un canvas
func (cc *CanvasController) GetCanvasHandler(w http.ResponseWriter, r *http.Request) {
	// Pour l'instant on simule la récupération d'un canvas avec des données statiques
	canvas := models.Canvas{
		ID:        1,
		UserID:    1,
		Width:     800,
		Height:    600,
		Bitmap:    nil,
		CreatedAt: time.Now(),
	}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(canvas)
}

// Méthode associée pour permettre de rejoindre un canvas
func (cc *CanvasController) JoinCanvasHandler(w http.ResponseWriter, r *http.Request) {
	// Implémenter la logique si besoin.
	w.WriteHeader(http.StatusOK)
}

// Méthode associée pour gérer la communication via WebSocket
func (cc *CanvasController) HandleWebSocketHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		http.Error(w, "Could not upgrade connection", http.StatusInternalServerError)
		return
	}
	defer conn.Close()

	// Traitement des messages reçus via WebSocket
	for {
		var msg models.PixelUpdate
		if err := conn.ReadJSON(&msg); err != nil {
			break
		}

		// Vous pouvez ajouter la logique de mise à jour du canvas et de diffusion aux autres clients ici.
	}
}

// ==================================================================================
// Fonctions globales utilisées par les routes qui appellent les méthodes de CanvasController

var canvasController = CanvasController{
	// Initialisation sans DB réelle pour le moment (les méthodes factices seront utilisées)
	canvases: models.CanvasModel{},
}

// CreateCanvas est le wrapper appelé par les routes à l'URL "/canvas"
func CreateCanvas(w http.ResponseWriter, r *http.Request) {
	canvasController.CreateCanvasHandler(w, r)
}

// GetCanvas est le wrapper appelé par les routes à l'URL "/canvas/{id}"
func GetCanvas(w http.ResponseWriter, r *http.Request) {
	canvasController.GetCanvasHandler(w, r)
}

// JoinCanvas est le wrapper appelé par les routes à l'URL "/canvas/{id}/join"
func JoinCanvas(w http.ResponseWriter, r *http.Request) {
	canvasController.JoinCanvasHandler(w, r)
}

// HandleWebSocket est le wrapper appelé par les routes à l'URL "/ws/canvas/{id}"
func HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	canvasController.HandleWebSocketHandler(w, r)
}

// HomePage sert le fichier index.html pour la page d'accueil
func HomePage(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "./views/index.html")
}

// NotFound sert le fichier 404.html pour les pages non trouvées
func NotFound(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "./views/404.html")
}
