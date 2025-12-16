package websocket

import (
	"log"
	"sync"

	"chat-app/internal/domain/entity"
)

// Hub manages WebSocket client connections and message broadcasting
type Hub struct {
	clients    map[*entity.Client]bool
	broadcast  chan []byte
	register   chan *entity.Client
	unregister chan *entity.Client
	mutex      sync.RWMutex
}

// NewHub creates a new Hub instance
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*entity.Client]bool),
		broadcast:  make(chan []byte),
		register:   make(chan *entity.Client),
		unregister: make(chan *entity.Client),
	}
}

// Run starts the hub's main loop
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mutex.Lock()
			h.clients[client] = true
			h.mutex.Unlock()
			log.Printf("Client %s connected. Total clients: %d", client.ID, len(h.clients))

		case client := <-h.unregister:
			h.mutex.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.Send)
			}
			h.mutex.Unlock()
			log.Printf("Client %s disconnected. Total clients: %d", client.ID, len(h.clients))

		case message := <-h.broadcast:
			h.mutex.RLock()
			// Collect clients that failed to receive the message
			var failedClients []*entity.Client
			for client := range h.clients {
				select {
				case client.Send <- message:
				default:
					failedClients = append(failedClients, client)
				}
			}
			h.mutex.RUnlock()

			// Remove failed clients with write lock
			if len(failedClients) > 0 {
				h.mutex.Lock()
				for _, client := range failedClients {
					if _, ok := h.clients[client]; ok {
						close(client.Send)
						delete(h.clients, client)
						log.Printf("Removed stale client %s. Total clients: %d", client.ID, len(h.clients))
					}
				}
				h.mutex.Unlock()
			}
		}
	}
}

// Register registers a new client
func (h *Hub) Register(client *entity.Client) {
	h.register <- client
}

// Unregister unregisters a client
func (h *Hub) Unregister(client *entity.Client) {
	h.unregister <- client
}

// Broadcast broadcasts a message to all clients
func (h *Hub) Broadcast(message []byte) {
	h.broadcast <- message
}
