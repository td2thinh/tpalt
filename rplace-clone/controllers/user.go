package controllers

import (
	"encoding/json"
	"net/http"
	"rplace-clone/models"

	"github.com/gorilla/sessions"
)

var store = sessions.NewCookieStore([]byte("your-secret-key"))

// RegisterUser gère l'inscription (GET affiche le formulaire, POST traite les données)
func RegisterUser(w http.ResponseWriter, r *http.Request) {
	session, _ := store.Get(r, "session-name")
	if session.Values["user_id"] != nil {
		http.Redirect(w, r, "/", http.StatusSeeOther)
		return
	}

	if r.Method == http.MethodGet {
		http.ServeFile(w, r, "./views/register.html")
		return
	}

	// Pour POST, on lit depuis le formulaire
	r.ParseForm()
	username := r.FormValue("username")
	password := r.FormValue("password")
	if username == "" || password == "" {
		http.Error(w, "Nom d'utilisateur et mot de passe requis", http.StatusBadRequest)
		return
	}

	var user models.User
	user.Username = username
	user.Password = password

	if err := user.Create(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	session, _ = store.Get(r, "session-name")
	session.Values["user_id"] = user.ID
	session.Save(r, w)
	http.Redirect(w, r, "/", http.StatusSeeOther)
}

// LoginUser gère la connexion (GET affiche le formulaire, POST traite l'authentification)
func LoginUser(w http.ResponseWriter, r *http.Request) {
	session, _ := store.Get(r, "session-name")
	if session.Values["user_id"] != nil {
		http.Redirect(w, r, "/", http.StatusSeeOther)
		return
	}

	if r.Method == http.MethodGet {
		http.ServeFile(w, r, "./views/login.html")
		return
	}

	r.ParseForm()
	username := r.FormValue("username")
	password := r.FormValue("password")
	if username == "" || password == "" {
		http.Error(w, "Nom d'utilisateur et mot de passe requis", http.StatusBadRequest)
		return
	}

	var user models.User
	user.Username = username
	user.Password = password

	authUser, err := user.Authenticate()
	if err != nil {
		http.Error(w, "Identifiants invalides", http.StatusUnauthorized)
		return
	}

	session, _ = store.Get(r, "session-name")
	session.Values["user_id"] = authUser.ID
	session.Save(r, w)
	http.Redirect(w, r, "/", http.StatusSeeOther)
}

// LogoutUser déconnecte l'utilisateur
func LogoutUser(w http.ResponseWriter, r *http.Request) {
	session, _ := store.Get(r, "session-name")
	delete(session.Values, "user_id")
	session.Save(r, w)
	http.Redirect(w, r, "/", http.StatusSeeOther)
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

func ServerRegisterUser(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		http.ServeFile(w, r, "./views/register.html")
		return
	}

	r.ParseForm()
	username := r.FormValue("username")
	password := r.FormValue("password")
	if username == "" || password == "" {
		http.Error(w, "Nom d'utilisateur et mot de passe requis", http.StatusBadRequest)
		return
	}

	var user models.User
	user.Username = username
	user.Password = password

	if err := user.Create(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	session, _ := store.Get(r, "session-name")
	session.Values["user_id"] = user.ID
	session.Save(r, w)
	http.Redirect(w, r, "/", http.StatusSeeOther)
}
