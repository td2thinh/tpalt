package controllers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"rplace-clone/config"
	"rplace-clone/models"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{}

// CanvasController utilise une instance réelle de CanvasModel initialisée avec la DB.
type CanvasController struct {
	canvases models.CanvasModel
}

// NewCanvasController crée un CanvasController avec la connexion DB.
func NewCanvasController() *CanvasController {
	return &CanvasController{
		canvases: models.CanvasModel{
			DB: config.GetDB(), // connexion réelle à la base de données
		},
	}
}

// CreateCanvasHandler gère la création d'un canvas.
// Il supporte à la fois une soumission en JSON (cas API) et une soumission classique (formulaire HTML).
func (cc *CanvasController) CreateCanvasHandler(w http.ResponseWriter, r *http.Request) {
	// Détermination de l'ID de l'utilisateur connecté
	userID := 1 // TODO

	// Si Content-Type est JSON, décodage JSON
	if r.Header.Get("Content-Type") == "application/json" {
		var canvas models.Canvas
		if err := json.NewDecoder(r.Body).Decode(&canvas); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		canvas.UserID = userID
		// Appel de la méthode réelle de création
		createdCanvas, err := cc.canvases.CreateCanvas(canvas.UserID, canvas.Width, canvas.Height, canvas.Bitmap)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(createdCanvas)
		return
	}

	// Sinon, on traite une soumission depuis un formulaire
	if err := r.ParseForm(); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	widthStr := r.FormValue("width")
	heightStr := r.FormValue("height")
	if widthStr == "" || heightStr == "" {
		http.Error(w, "La largeur et la hauteur sont requises", http.StatusBadRequest)
		return
	}
	width, err := strconv.Atoi(widthStr)
	if err != nil {
		http.Error(w, "Largeur invalide", http.StatusBadRequest)
		return
	}
	height, err := strconv.Atoi(heightStr)
	if err != nil {
		http.Error(w, "Hauteur invalide", http.StatusBadRequest)
		return
	}
	// Création du canvas en appelant la méthode réelle
	canvas, err := cc.canvases.CreateCanvas(userID, width, height, nil)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	// Redirection vers la page du canvas créé
	http.Redirect(w, r, "/canvas/view/"+strconv.Itoa(canvas.ID), http.StatusSeeOther)
}

// GetCanvasHandler récupère un canvas réel depuis la base de données
func (cc *CanvasController) GetCanvasHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr, ok := vars["id"]
	if !ok {
		http.Error(w, "ID manquant", http.StatusBadRequest)
		return
	}
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "ID invalide", http.StatusBadRequest)
		return
	}
	canvas, err := cc.canvases.GetCanvas(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(canvas)
}

// JoinCanvasHandler laisse la logique de jointure à implémenter selon les besoins réels.
// Ici, nous vérifions l'existence du canvas et renvoyons un statut OK.
func (cc *CanvasController) JoinCanvasHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr, ok := vars["id"]
	if !ok {
		http.Error(w, "ID manquant", http.StatusBadRequest)
		return
	}
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "ID invalide", http.StatusBadRequest)
		return
	}
	// Vérifier que le canvas existe
	_, err = cc.canvases.GetCanvas(id)
	if err != nil {
		http.Error(w, "Canvas non trouvé: "+err.Error(), http.StatusNotFound)
		return
	}
	// Ici, vous pouvez enregistrer la jointure dans la base de données si besoin.
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Jointure réussie"))
}

// updateBitmap simule la mise à jour du bitmap en affectant la couleur au pixel (x,y).
// On considère ici bitmap stocké en RGB (3 octets par pixel). Si bitmap est nil, on l'initialise.
func updateBitmap(bitmap []byte, x, y int, colorStr string, width, height int) []byte {
	// Initialiser le bitmap s'il est vide
	if bitmap == nil || len(bitmap) == 0 {
		bitmap = make([]byte, width*height*3)
	}
	// Lire la couleur au format "#RRGGBB"
	var r, g, b uint8
	if _, err := fmt.Sscanf(colorStr, "#%02x%02x%02x", &r, &g, &b); err != nil {
		return bitmap
	}
	// Calculer l'indice du pixel
	index := (y*width + x) * 3
	if index+2 < len(bitmap) {
		bitmap[index] = r
		bitmap[index+1] = g
		bitmap[index+2] = b
	}
	return bitmap
}

// HandleWebSocketHandler gère la communication en temps réel via WebSocket.
func (cc *CanvasController) HandleWebSocketHandler(w http.ResponseWriter, r *http.Request) {
	// Récupérer l'ID du canvas depuis l'URL
	vars := mux.Vars(r)
	idStr, ok := vars["id"]
	if !ok {
		http.Error(w, "ID du canvas manquant", http.StatusBadRequest)
		return
	}
	canvasID, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "ID du canvas invalide", http.StatusBadRequest)
		return
	}

	// Charger le canvas depuis la base
	canvas, err := cc.canvases.GetCanvas(canvasID)
	if err != nil {
		http.Error(w, "Canvas non trouvé: "+err.Error(), http.StatusNotFound)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		http.Error(w, "Impossible de passer en mode WebSocket", http.StatusInternalServerError)
		return
	}
	defer conn.Close()

	// Traitement des messages via WebSocket
	for {
		var msg models.PixelUpdate
		if err := conn.ReadJSON(&msg); err != nil {
			break
		}

		// Mise à jour du bitmap : on suppose que canvas.Width et canvas.Height sont définis
		canvas.Bitmap = updateBitmap(canvas.Bitmap, msg.X, msg.Y, msg.Color, canvas.Width, canvas.Height)

		// Sauvegarde du bitmap mis à jour dans la base de données
		if err := cc.canvases.UpdateCanvasBitmap(canvas.ID, canvas.Bitmap); err != nil {
			// On peut envoyer une erreur ou simplement continuer
			continue
		}

		// Mise à jour du bitmap dans Redis (utilise r.Context() pour le contexte)
		redisClient := config.GetRedisClient()
		redisKey := "canvas:" + strconv.Itoa(canvas.ID)
		if err := redisClient.Set(r.Context(), redisKey, canvas.Bitmap, 0).Err(); err != nil {
			// Gestion d'erreur optionnelle
		}

		// Diffuser la mise à jour au client actuel (vous pouvez également diffuser aux autres clients connectés)
		if err := conn.WriteJSON(msg); err != nil {
			break
		}
	}
}

// CreateCanvasPage sert la page de création de canvas
func CreateCanvasPage(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "./views/canvas_create.html")
}

// JoinCanvasPage affiche la page pour rejoindre un canvas et traite le formulaire
func JoinCanvasPage(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		http.ServeFile(w, r, "./views/canvas_join.html")
		return
	}
	if err := r.ParseForm(); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	canvasID := r.FormValue("canvas_id")
	if canvasID == "" {
		http.Error(w, "Canvas ID requis", http.StatusBadRequest)
		return
	}
	http.Redirect(w, r, "/canvas/view/"+canvasID, http.StatusSeeOther)
}

// Wrappers pour les routes
func CreateCanvas(w http.ResponseWriter, r *http.Request) {
	NewCanvasController().CreateCanvasHandler(w, r)
}

func GetCanvas(w http.ResponseWriter, r *http.Request) {
	NewCanvasController().GetCanvasHandler(w, r)
}

func JoinCanvas(w http.ResponseWriter, r *http.Request) {
	NewCanvasController().JoinCanvasHandler(w, r)
}

func HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	NewCanvasController().HandleWebSocketHandler(w, r)
}

func HomePage(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "./views/index.html")
}

func NotFound(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "./views/404.html")
}

func CreateCanvasPageHandler(w http.ResponseWriter, r *http.Request) {
	CreateCanvasPage(w, r)
}

func JoinCanvasPageHandler(w http.ResponseWriter, r *http.Request) {
	JoinCanvasPage(w, r)
}

func CanvasView(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "./views/canvas_view.html")
}
