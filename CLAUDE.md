# CLAUDE.md - Project Guidelines

## Project Description

Project Title: Reddit r/Place Clone with Custom Canvases

Tech Stack:

    Frontend: React, Tailwind CSS for styling

    Backend: Firebase (Firestore, Realtime Database, Authentication)

Project Overview:

We are building a collaborative pixel art platform inspired by r/Place, where users can:

    Create & join custom canvases

    Browse public canvases with real-time preview updates

    Draw pixels collaboratively with real-time updates

    Authenticate via Google Sign-in

Core Features & Firebase Usage:

1.  Canvas Management (Firestore)

    Users can create new canvases (Firestore stores metadata).

    Each canvas has:

        Unique ID, name, size (e.g., 100x100, 500x500).

        Public/private visibility.

    Firestore stores canvas metadata:

    {
    "canvasId": "example123",
    "name": "My Artboard",
    "size": [100, 100],
    "public": true,
    "createdBy": "user123",
    "createdAt": 1710950400
    }

2.  Pixel Drawing (Realtime Database)

    Each canvas’ pixel data is stored in Firebase Realtime Database:

    {
    "canvases": {
    "example123": {
    "pixels": {
    "0,0": "#FFFFFF",
    "0,1": "#FF0000"
    },
    "updatedAt": 1710950400
    }
    }
    }

    Users update pixels in real time, and others instantly see changes via Firebase Realtime Database listeners.

3.  Canvas Discovery & Previews (Firestore + Realtime Database)

    Firestore stores a list of canvases with metadata.

    Realtime Database provides a real-time preview by fetching recently updated pixels (no need for Firebase Storage).

    Example:

        The preview is dynamically generated from the most active pixels instead of storing images.

4.  Authentication (Firebase Auth)

    Google Sign-in via Firebase Authentication.

    Track user activity & contributions using Firebase UID.

Here is my firebase config:
const firebaseConfig = {

apiKey: "AIzaSyDf4XaY5tRthfcIy5ssjcAKlCYgB7ZkMjU",

authDomain: "goplace-f33c9.firebaseapp.com",

databaseURL: "https://goplace-f33c9-default-rtdb.europe-west1.firebasedatabase.app",

projectId: "goplace-f33c9",

storageBucket: "goplace-f33c9.firebasestorage.app",

messagingSenderId: "978391795944",

appId: "1:978391795944:web:342789484e502bfb19a15d"

};

## Build/Test/Lint Commands

- Build: `npm run build`
- Lint: `npm run lint`
- Test (all): `npm run test`
- Test (single): `npm run test -- -t "test name"`
- Type check: `npm run typecheck`

## Code Style Guidelines

- **Formatting**: Use Prettier with default settings
- **Naming**: camelCase for variables/functions, PascalCase for classes/components
- **Imports**: Group and order - 1) External libs 2) Internal modules 3) Types/interfaces
- **Error Handling**: Use try/catch blocks with specific error types
- **Types**: Prefer explicit typing over 'any', use interfaces for objects
- **Comments**: JSDoc for public APIs, inline comments for complex logic only
- **State Management**: Use React hooks pattern, avoid global state when possible

Update this file as project conventions evolve.
