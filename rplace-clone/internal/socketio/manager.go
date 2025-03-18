package socketio

import (
	"log"
	"sync"
	"time"

	socketio "github.com/googollee/go-socket.io"
	"gorm.io/gorm"

	"rplace-clone/internal/models"
)

// Manager handles Socket.IO connections and events
type Manager struct {
	server      *socketio.Server
	db          *gorm.DB
	canvasMutex sync.RWMutex
	// Map of canvas ID to active users count
	activeUsers map[string]map[string]bool // Map of canvas ID to map of socket ID to bool
	// Map of socket ID to user info
	connectedUsers map[string]*ConnectedUser
}

// ConnectedUser represents a connected user
type ConnectedUser struct {
	SocketID  string
	UserID    uint
	Username  string
	CanvasID  string // Current canvas the user is viewing
	LastPing  time.Time
	Connected bool
}

// NewManager creates a new Socket.IO manager
func NewManager(db *gorm.DB) (*Manager, error) {
	// Create a new Socket.IO server
	server := socketio.NewServer(nil)

	manager := &Manager{
		server:         server,
		db:             db,
		activeUsers:    make(map[string]map[string]bool),
		connectedUsers: make(map[string]*ConnectedUser),
	}

	// Set up event handlers
	server.OnConnect("/", func(s socketio.Conn) error {
		s.SetContext("")
		log.Println("Client connected:", s.ID())
		manager.connectedUsers[s.ID()] = &ConnectedUser{
			SocketID:  s.ID(),
			Connected: true,
			LastPing:  time.Now(),
		}
		return nil
	})

	server.OnError("/", func(s socketio.Conn, e error) {
		log.Println("Error:", e)
	})

	server.OnDisconnect("/", func(s socketio.Conn, reason string) {
		log.Println("Client disconnected:", s.ID(), reason)
		manager.handleDisconnect(s.ID())
	})

	// Authentication event
	server.OnEvent("/", "authenticate", func(s socketio.Conn, token string) {
		manager.handleAuthentication(s, token)
	})

	// Join canvas event
	server.OnEvent("/", "join_canvas", func(s socketio.Conn, canvasID string) {
		manager.handleJoinCanvas(s, canvasID)
	})

	// Leave canvas event
	server.OnEvent("/", "leave_canvas", func(s socketio.Conn) {
		manager.handleLeaveCanvas(s)
	})

	// Place pixel event
	server.OnEvent("/", "place_pixel", func(s socketio.Conn, x int, y int, color string) {
		manager.handlePlacePixel(s, x, y, color)
	})

	// Ping event to keep connection alive and track active users
	server.OnEvent("/", "ping", func(s socketio.Conn) {
		if user, exists := manager.connectedUsers[s.ID()]; exists {
			user.LastPing = time.Now()
		}
	})

	// Start a goroutine to clean up inactive users
	go manager.cleanupInactiveUsers()

	return manager, nil
}

// Server returns the Socket.IO server
func (m *Manager) Server() *socketio.Server {
	return m.server
}

// handleAuthentication authenticates a user
func (m *Manager) handleAuthentication(s socketio.Conn, token string) {
	// TODO: Implement JWT validation
	// For now, just acknowledge the authentication
	s.Emit("authenticated", map[string]interface{}{
		"status": "success",
	})
}

// handleJoinCanvas handles a user joining a canvas
func (m *Manager) handleJoinCanvas(s socketio.Conn, canvasID string) {
	user, exists := m.connectedUsers[s.ID()]
	if !exists {
		s.Emit("error", "Not authenticated")
		return
	}

	// Leave previous canvas if any
	if user.CanvasID != "" {
		m.handleLeaveCanvas(s)
	}

	// Join the canvas room
	s.Join(canvasID)
	user.CanvasID = canvasID

	// Update active users for this canvas
	m.canvasMutex.Lock()
	if _, exists := m.activeUsers[canvasID]; !exists {
		m.activeUsers[canvasID] = make(map[string]bool)
	}
	m.activeUsers[canvasID][s.ID()] = true
	activeCount := len(m.activeUsers[canvasID])
	m.canvasMutex.Unlock()

	// Broadcast active users count to all clients in this canvas
	m.server.BroadcastToRoom("", canvasID, "active_users", activeCount)

	// Send confirmation to the client
	s.Emit("joined_canvas", map[string]interface{}{
		"canvasID":    canvasID,
		"activeUsers": activeCount,
	})

	log.Printf("User %s joined canvas %s. Active users: %d", s.ID(), canvasID, activeCount)
}

// handleLeaveCanvas handles a user leaving a canvas
func (m *Manager) handleLeaveCanvas(s socketio.Conn) {
	user, exists := m.connectedUsers[s.ID()]
	if !exists || user.CanvasID == "" {
		return
	}

	canvasID := user.CanvasID

	// Leave the canvas room
	s.Leave(canvasID)

	// Update active users for this canvas
	m.canvasMutex.Lock()
	if users, exists := m.activeUsers[canvasID]; exists {
		delete(users, s.ID())
		activeCount := len(users)

		// Broadcast active users count to all clients in this canvas
		m.server.BroadcastToRoom("", canvasID, "active_users", activeCount)

		log.Printf("User %s left canvas %s. Active users: %d", s.ID(), canvasID, activeCount)
	}
	m.canvasMutex.Unlock()

	// Clear the canvas ID from the user
	user.CanvasID = ""
}

// handleDisconnect handles a user disconnecting
func (m *Manager) handleDisconnect(socketID string) {
	user, exists := m.connectedUsers[socketID]
	if !exists {
		return
	}

	// If the user was in a canvas, update active users
	if user.CanvasID != "" {
		m.canvasMutex.Lock()
		if users, exists := m.activeUsers[user.CanvasID]; exists {
			delete(users, socketID)
			activeCount := len(users)

			// Broadcast active users count to all clients in this canvas
			m.server.BroadcastToRoom("", user.CanvasID, "active_users", activeCount)

			log.Printf("User %s disconnected from canvas %s. Active users: %d", socketID, user.CanvasID, activeCount)
		}
		m.canvasMutex.Unlock()
	}

	// Remove the user from connected users
	delete(m.connectedUsers, socketID)
}

// handlePlacePixel handles a pixel placement
func (m *Manager) handlePlacePixel(s socketio.Conn, x int, y int, color string) {
	user, exists := m.connectedUsers[s.ID()]
	if !exists || user.CanvasID == "" {
		s.Emit("error", "Not in a canvas")
		return
	}

	// Create a pixel update
	update := models.PixelUpdate{
		CanvasID:  user.CanvasID,
		X:         x,
		Y:         y,
		Color:     color,
		UserID:    user.UserID,
		CreatedAt: time.Now(),
	}

	// Broadcast the pixel update to all clients in this canvas
	m.server.BroadcastToRoom("", user.CanvasID, "pixel_update", update)

	// TODO: Update the canvas in memory
	// This will be implemented in the canvas service
}

// BroadcastActiveUsers broadcasts the active users count for a canvas
func (m *Manager) BroadcastActiveUsers(canvasID string) {
	m.canvasMutex.RLock()
	defer m.canvasMutex.RUnlock()

	if users, exists := m.activeUsers[canvasID]; exists {
		activeCount := len(users)
		m.server.BroadcastToRoom("", canvasID, "active_users", activeCount)
	}
}

// GetActiveUsersCount returns the number of active users for a canvas
func (m *Manager) GetActiveUsersCount(canvasID string) int {
	m.canvasMutex.RLock()
	defer m.canvasMutex.RUnlock()

	if users, exists := m.activeUsers[canvasID]; exists {
		return len(users)
	}
	return 0
}

// cleanupInactiveUsers periodically removes inactive users
func (m *Manager) cleanupInactiveUsers() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		now := time.Now()
		inactiveTimeout := 2 * time.Minute

		for socketID, user := range m.connectedUsers {
			if now.Sub(user.LastPing) > inactiveTimeout {
				log.Printf("Cleaning up inactive user: %s", socketID)
				m.handleDisconnect(socketID)
			}
		}
	}
}

// UpdateCanvasInMemory updates a canvas pixel in memory
func (m *Manager) UpdateCanvasInMemory(canvasID string, x, y int, color string) error {
	// This will be called by the canvas service
	// For now, just broadcast the update
	update := models.PixelUpdate{
		CanvasID:  canvasID,
		X:         x,
		Y:         y,
		Color:     color,
		CreatedAt: time.Now(),
	}

	m.server.BroadcastToRoom("", canvasID, "pixel_update", update)
	return nil
}
