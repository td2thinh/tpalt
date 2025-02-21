package routes

import (
	"net/http"
	"rplace-clone/controllers"

	"github.com/gorilla/mux"
)

func InitializeRoutes() *mux.Router {
	router := mux.NewRouter()

	// Routes pour les utilisateurs (GET pour afficher les formulaires, POST pour soumettre les données)
	router.HandleFunc("/register", controllers.RegisterUser).Methods("GET", "POST")
	router.HandleFunc("/registerPage", controllers.ServerRegisterUser).Methods("GET")
	router.HandleFunc("/login", controllers.LoginUser).Methods("GET", "POST")
	router.HandleFunc("/loginPage", controllers.ServeLoginUser).Methods("GET")
	router.HandleFunc("/logout", controllers.LogoutUser).Methods("GET")

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
