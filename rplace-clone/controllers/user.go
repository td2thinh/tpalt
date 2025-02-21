package controllers

import (
	"encoding/json"
	"net/http"
	"rplace-clone/models"

	"github.com/gorilla/sessions"
)

var store = sessions.NewCookieStore([]byte("your-secret-key")) // Remplacez par une clé secrète sécurisée

// RegisterUser gère l'inscription d'un nouvel utilisateur
func RegisterUser(w http.ResponseWriter, r *http.Request) {
	var user models.User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := user.Create(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(user)
}

func ServeLoginUser(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "./views/login.html")
}

func ServerRegisterUser(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "./views/register.html")
}

// LoginUser gère la connexion d'un utilisateur
func LoginUser(w http.ResponseWriter, r *http.Request) {
	var user models.User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	existingUser, err := user.Authenticate()
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	session, _ := store.Get(r, "session-name")
	session.Values["user_id"] = existingUser.ID
	session.Save(r, w)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(existingUser)
}

// LogoutUser gère la déconnexion d'un utilisateur
func LogoutUser(w http.ResponseWriter, r *http.Request) {
	session, _ := store.Get(r, "session-name")
	delete(session.Values, "user_id")
	session.Save(r, w)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode("Logged out successfully")
}

// GetCurrentUser récupère les informations de l'utilisateur connecté
func GetCurrentUser(w http.ResponseWriter, r *http.Request) {
	session, _ := store.Get(r, "session-name")
	userID, ok := session.Values["user_id"].(int)

	if !ok {
		http.Error(w, "User not logged in", http.StatusUnauthorized)
		return
	}

	user := models.User{ID: userID}
	if err := user.GetByID(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(user)
}
