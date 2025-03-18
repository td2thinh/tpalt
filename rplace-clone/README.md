# r/place Clone

A real-time collaborative pixel canvas inspired by Reddit's r/place, built with Go, Socket.IO, and React.

## Features

- Real-time pixel placement and updates using Socket.IO
- User authentication with JWT
- Create and join multiple canvases
- Real-time active user tracking
- Periodic canvas snapshots
- Responsive design

## Tech Stack

### Backend

- Go
- Gin Web Framework
- GORM (PostgreSQL)
- Socket.IO (go-socket.io)
- JWT Authentication

### Frontend

- React
- Vite
- Socket.IO Client
- React Router
- Axios
- React Zoom Pan Pinch

## Project Structure

```
rplace-clone/
├── cmd/                  # Application entry points
│   └── server/           # Main server application
├── config/               # Configuration
├── internal/             # Internal packages
│   ├── auth/             # Authentication
│   ├── handlers/         # HTTP handlers
│   ├── middleware/       # Middleware
│   ├── models/           # Data models
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   └── socketio/         # Socket.IO implementation
├── frontend/             # React frontend
│   ├── public/           # Static assets
│   └── src/              # React source code
│       ├── components/   # React components
│       ├── context/      # React context providers
│       ├── pages/        # Page components
│       └── services/     # API and Socket.IO services
└── snapshots/            # Canvas snapshots storage
```

## Getting Started

### Prerequisites

- Go 1.20+
- Node.js 16+
- PostgreSQL

### Backend Setup

1. Clone the repository
2. Set up environment variables in `.env` file
3. Run the server:

```bash
cd rplace-clone
go run cmd/server/main.go
```

### Frontend Setup

1. Install dependencies:

```bash
cd rplace-clone/frontend
npm install
```

2. Start the development server:

```bash
npm run dev
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user

### Canvases

- `GET /api/canvases` - List all canvases
- `GET /api/canvas/:id` - Get canvas details
- `GET /api/canvas/:id/pixels` - Get canvas pixels
- `POST /api/canvas` - Create a new canvas (authenticated)
- `POST /api/canvas/:id/pixel` - Update a pixel (authenticated)
- `GET /api/canvas/:id/snapshot` - Get latest canvas snapshot
- `POST /api/canvas/:id/snapshot` - Create a canvas snapshot (authenticated)
- `GET /api/snapshot/:id` - Serve a canvas snapshot image

## Socket.IO Events

### Client to Server

- `authenticate` - Authenticate with JWT token
- `join_canvas` - Join a canvas room
- `leave_canvas` - Leave a canvas room
- `place_pixel` - Place a pixel on the canvas
- `ping` - Keep connection alive

### Server to Client

- `authenticated` - Authentication response
- `joined_canvas` - Joined canvas confirmation
- `pixel_update` - Pixel update notification
- `active_users` - Active users count update

## License

MIT
