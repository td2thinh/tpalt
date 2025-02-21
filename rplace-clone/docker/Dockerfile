FROM golang:1.17

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers go.mod et go.sum
COPY go.mod go.sum ./

# Installer les dépendances
RUN go mod download

# Copier le reste des fichiers
COPY . .

# Compiler l'application
RUN go build -o main .

# Exposer le port
EXPOSE 8080

# Commande pour exécuter l'application
CMD ["./main"]