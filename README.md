# r/Place Clone with Custom Canvases

A collaborative pixel art platform inspired by Reddit's r/Place, where users can create and join custom canvases to draw collaboratively in real-time.

## Features

- Create and join custom-sized pixel art canvases
- Browse public canvases with real-time preview updates
- Draw pixels collaboratively with other users
- Real-time updates using Firebase Realtime Database
- Authentication via Google Sign-in

## Tech Stack

- Frontend: React with Vite
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

## Project Structure

- `/src/components` - Reusable UI components
- `/src/pages` - Main page components
- `/src/firebase` - Firebase configuration and utilities
- `/src/hooks` - Custom React hooks

## Firebase Setup

This project uses Firebase for authentication, database, and storage. 
The Firebase configuration is already set up in the project, but if you want to use your own Firebase project, update the configuration in `src/firebase/config.js`.

## License

MIT