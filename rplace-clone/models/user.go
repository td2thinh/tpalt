package models

import (
	"database/sql"
	"errors"
	"log"
	"net/http"

	"rplace-clone/config"

	"github.com/gorilla/sessions"
	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Password string `json:"password"` // stocke le hash du mot de passe
}

// CreateUser crée un nouvel utilisateur en hachant le mot de passe
func CreateUser(db *sql.DB, username, password string) (User, error) {
	var user User
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return user, err
	}
	err = db.QueryRow("INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id", username, string(hash)).Scan(&user.ID)
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

// Create insère l'utilisateur en hachant le mot de passe
func (u *User) Create() error {
	db := sqlDB() // fonction locale récupérant la DB
	hash, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	query := "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id"
	err = db.QueryRow(query, u.Username, string(hash)).Scan(&u.ID)
	if err != nil {
		log.Println("Erreur lors de la création de l'utilisateur:", err)
		return err
	}
	return nil
}

// Authenticate vérifie que le nom d'utilisateur et le mot de passe correspondent via bcrypt
func (u *User) Authenticate() (User, error) {
	db := sqlDB()
	var user User
	query := "SELECT id, username, password FROM users WHERE username = $1"
	err := db.QueryRow(query, u.Username).Scan(&user.ID, &user.Username, &user.Password)
	if err != nil {
		return user, err
	}
	// Comparaison du hash stocké et du mot de passe fourni
	if bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(u.Password)) != nil {
		return user, errors.New("mot de passe invalide")
	}
	return user, nil
}

// GetByID récupère un utilisateur par son ID depuis la base de données
func (u *User) GetByID() error {
	db := sqlDB()
	query := "SELECT id, username, password FROM users WHERE id = $1"
	return db.QueryRow(query, u.ID).Scan(&u.ID, &u.Username, &u.Password)
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

// sqlDB est une fonction utilitaire qui récupère la connexion DB
func sqlDB() *sql.DB {
	return config.GetDB()
}
