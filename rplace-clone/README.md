# r/place Clone

## Description

Ce projet est une application web inspirée de r/place, permettant aux utilisateurs connectés de créer des canvases collaboratifs. Les utilisateurs peuvent créer un canvas, rejoindre un canvas existant et interagir avec celui-ci en temps réel. L'application utilise PostgreSQL pour la gestion des données, Redis pour la gestion des bitmaps, et est déployée avec Docker.

## Fonctionnalités

- Création de canvases par des utilisateurs connectés.
- Possibilité pour d'autres utilisateurs de rejoindre un canvas.
- Interface mobile-first pour une expérience utilisateur optimale sur tous les appareils.
- Mises à jour en temps réel des canvases via WebSocket.
- Gestion des utilisateurs, y compris l'inscription et la connexion.

## Technologies Utilisées

- **Backend**: Golang
- **Base de données**: PostgreSQL
- **Cache**: Redis
- **Containerisation**: Docker
- **Frontend**: HTML, CSS, JavaScript

## Installation

### Prérequis

- Go (version 1.17 ou supérieure)
- PostgreSQL
- Redis
- Docker

### Étapes d'installation

1. Clonez le dépôt :

   ```bash
   git clone <url-du-dépôt>
   cd rplace-clone
   ```

2. Configurez votre base de données PostgreSQL et Redis.

3. Modifiez le fichier `config/database.go` pour inclure vos informations de connexion.

4. Construisez et exécutez les conteneurs Docker :

   ```bash
   docker-compose up --build
   ```

5. Accédez à l'application via `http://localhost:8080`.

## Utilisation

- Inscrivez-vous ou connectez-vous pour accéder aux fonctionnalités de création et de gestion des canvases.
- Créez un nouveau canvas ou rejoignez un canvas existant pour commencer à collaborer.

## Tests

Des tests unitaires sont inclus pour les contrôleurs et les modèles. Vous pouvez les exécuter avec la commande suivante :

```bash
go test ./...
```

## Contribuer

Les contributions sont les bienvenues ! Veuillez soumettre une demande de tirage pour toute fonctionnalité ou correction de bogue.

## License

Ce projet est sous licence MIT. Veuillez consulter le fichier LICENSE pour plus de détails.