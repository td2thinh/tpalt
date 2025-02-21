package routes

import (
	"net/http"
	"rplace-clone/controllers"

	"github.com/gorilla/mux"
)

func InitializeRoutes() *mux.Router {
	router := mux.NewRouter()

	// Routes pour les utilisateurs
	router.HandleFunc("/register", controllers.RegisterUser).Methods("GET", "POST")
	router.HandleFunc("/login", controllers.LoginUser).Methods("GET", "POST")
	router.HandleFunc("/logout", controllers.LogoutUser).Methods("GET")

	// Routes pour les canvases
	// Page pour créer un canvas
	router.HandleFunc("/canvas/create", controllers.CreateCanvasPageHandler).Methods("GET")
	// POST pour créer un canvas (depuis le formulaire ou API)
	router.HandleFunc("/canvas", controllers.CreateCanvas).Methods("POST")
	// Afficher un canvas par ID
	router.HandleFunc("/canvas/{id}", controllers.GetCanvas).Methods("GET")
	// Page pour rejoindre un canvas
	router.HandleFunc("/canvas/join", controllers.JoinCanvasPageHandler).Methods("GET", "POST")
	// Route pour rejoindre un canvas (POST depuis API)
	router.HandleFunc("/canvas/{id}/join", controllers.JoinCanvas).Methods("POST")

	// Route pour afficher le canvas collaboratif
	router.HandleFunc("/canvas/view/{id}", controllers.CanvasView).Methods("GET")

	// Route pour gérer les WebSocket
	router.HandleFunc("/ws/canvas/{id}", controllers.HandleWebSocket).Methods("GET")

	// Route pour la page d'accueil
	router.HandleFunc("/", controllers.HomePage).Methods("GET")

	// Route pour les pages non trouvées
	router.NotFoundHandler = http.HandlerFunc(controllers.NotFound)

	return router
}
