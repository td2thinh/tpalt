package models

import (
	"database/sql"
	"log"
	"net/http"

	"github.com/gorilla/sessions"
)

type User struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Password string `json:"password"` // Stocker le mot de passe de manière sécurisée
}

// CreateUser crée un nouvel utilisateur dans la base de données
func CreateUser(db *sql.DB, username, password string) (User, error) {
	var user User
	err := db.QueryRow("INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id", username, password).Scan(&user.ID)
	if err != nil {
		log.Println("Erreur lors de la création de l'utilisateur:", err)
		return user, err
	}
	user.Username = username
	return user, nil
}

// GetUser récupère un utilisateur par son ID
func GetUser(db *sql.DB, id int) (User, error) {
	var user User
	err := db.QueryRow("SELECT id, username FROM users WHERE id = $1", id).Scan(&user.ID, &user.Username)
	if err != nil {
		log.Println("Erreur lors de la récupération de l'utilisateur:", err)
		return user, err
	}
	return user, nil
}

// GetUserByUsername récupère un utilisateur par son nom d'utilisateur
func GetUserByUsername(db *sql.DB, username string) (User, error) {
	var user User
	err := db.QueryRow("SELECT id, username FROM users WHERE username = $1", username).Scan(&user.ID, &user.Username)
	if err != nil {
		log.Println("Erreur lors de la récupération de l'utilisateur par nom d'utilisateur:", err)
		return user, err
	}
	return user, nil
}

// Create crée un utilisateur de manière factice
func (u *User) Create() error {
	// Simuler la création d'un utilisateur avec un ID fixe
	u.ID = 1
	return nil
}

// Authenticate simule l'authentification de l'utilisateur
func (u *User) Authenticate() (User, error) {
	// Retourner l'utilisateur avec un ID défini
	u.ID = 1
	return *u, nil
}

// GetByID simule la récupération d'un utilisateur par son ID
func (u *User) GetByID() error {
	// Pour ce template, nous ne faisons rien.
	return nil
}

var store = sessions.NewCookieStore([]byte("your-secret-key")) // Remplacez par une clé secrète sécurisée

// RegisterUser gère l'affichage du formulaire d'inscription (GET)
// et le traitement du formulaire (POST)
func RegisterUser(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		http.ServeFile(w, r, "./views/register.html")
		return
	}

	// Pour POST : lecture des valeurs du formulaire
	// Vérifiez d'abord que les valeurs ont été parsé
	r.ParseForm()
	username := r.FormValue("username")
	password := r.FormValue("password")
	if username == "" || password == "" {
		http.Error(w, "Nom d'utilisateur et mot de passe requis", http.StatusBadRequest)
		return
	}

	var user User
	user.Username = username
	user.Password = password

	// Création factice de l'utilisateur (remplacez par votre logique réelle)
	if err := user.Create(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Création d'une session et enregistrement de l'ID utilisateur
	session, _ := store.Get(r, "session-name")
	session.Values["user_id"] = user.ID
	session.Save(r, w)

	// Redirection vers la page d'accueil
	http.Redirect(w, r, "/", http.StatusSeeOther)
}

// LoginUser gère l'affichage du formulaire de connexion (GET)
// et le traitement du formulaire (POST)
func LoginUser(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		http.ServeFile(w, r, "./views/login.html")
		return
	}

	// Pour POST : lecture des valeurs du formulaire
	r.ParseForm()
	username := r.FormValue("username")
	password := r.FormValue("password")
	if username == "" || password == "" {
		http.Error(w, "Nom d'utilisateur et mot de passe requis", http.StatusBadRequest)
		return
	}

	var user User
	user.Username = username
	user.Password = password

	// Authentification factice (à remplacer par une logique réelle)
	authUser, err := user.Authenticate()
	if err != nil {
		http.Error(w, "Identifiants invalides", http.StatusUnauthorized)
		return
	}

	session, _ := store.Get(r, "session-name")
	session.Values["user_id"] = authUser.ID
	session.Save(r, w)

	// Redirection vers la page d'accueil
	http.Redirect(w, r, "/", http.StatusSeeOther)
}

// LogoutUser déconnecte l'utilisateur et redirige vers la page d'accueil
func LogoutUser(w http.ResponseWriter, r *http.Request) {
	session, _ := store.Get(r, "session-name")
	delete(session.Values, "user_id")
	session.Save(r, w)
	http.Redirect(w, r, "/", http.StatusSeeOther)
}
