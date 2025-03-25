# r/Place Clone with Custom Canvases

A collaborative pixel art platform inspired by Reddit's r/Place, where users can create and join custom canvases to draw collaboratively in real-time.

## Features

- Create and join custom-sized pixel art canvases
- Browse public canvases with real-time preview updates
- Draw pixels collaboratively with other users
- Real-time updates using Firebase Realtime Database
- Authentication via Google Sign-in

## Tech Stack

- Frontend: React with Vite, React-Konva
- Styling: Tailwind CSS
- Backend: Firebase
  - Authentication: Firebase Auth
  - Canvas Metadata: Firestore
  - Pixel Data: Realtime Database

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd r-place-clone
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Deployment

### Using Docker

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd tpalt
   ```

2. Create a `.env` file based on the example:
   ```bash
   cp .env.example .env
   ```

3. Fill in your Firebase configuration in the `.env` file:
   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
   VITE_FIREBASE_DATABASE_URL=your-database-url
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

4. Build and run the Docker container:
   ```bash
   docker build -t r-place-clone .
   docker run -p 80:80 r-place-clone
   ```

## Project Structure

- `/src/components` - Reusable UI components
- `/src/pages` - Main page components
- `/src/firebase` - Firebase configuration and utilities
- `/src/hooks` - Custom React hooks

## Firebase Setup

This project uses Firebase for authentication, database, and storage. 
The Firebase configuration is set up to use environment variables for secure deployment.

## License

MIT