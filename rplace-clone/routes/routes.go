package routes

import (
	"net/http"
	"rplace-clone/controllers"

	"github.com/gorilla/mux"
)

func InitializeRoutes() *mux.Router {
	router := mux.NewRouter()

	// Routes pour les utilisateurs
	router.HandleFunc("/register", controllers.RegisterUser).Methods("POST")
	router.HandleFunc("/login", controllers.LoginUser).Methods("POST")

	// Routes pour les canvases
	router.HandleFunc("/canvas", controllers.CreateCanvas).Methods("POST")
	router.HandleFunc("/canvas/{id}", controllers.GetCanvas).Methods("GET")
	router.HandleFunc("/canvas/{id}/join", controllers.JoinCanvas).Methods("POST")

	// Route pour gérer les WebSocket
	router.HandleFunc("/ws/canvas/{id}", controllers.HandleWebSocket).Methods("GET")

	// Route pour la page d'accueil
	router.HandleFunc("/", controllers.HomePage).Methods("GET")

	// Route pour les pages non trouvées
	router.NotFoundHandler = http.HandlerFunc(controllers.NotFound)

	return router
}
