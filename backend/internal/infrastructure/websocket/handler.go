package websocket

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"

	"chat-app/internal/domain/entity"
	"chat-app/internal/infrastructure/config"
	"chat-app/internal/usecase/chat"
	hubUseCase "chat-app/internal/usecase/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for development
	},
}

// Handler handles WebSocket connections
type Handler struct {
	hub         *hubUseCase.Hub
	chatUseCase *chat.ChatUseCase
	config      *config.Config
}

// NewHandler creates a new WebSocket handler
func NewHandler(hub *hubUseCase.Hub, chatUseCase *chat.ChatUseCase, cfg *config.Config) *Handler {
	return &Handler{
		hub:         hub,
		chatUseCase: chatUseCase,
		config:      cfg,
	}
}

// ServeWS handles WebSocket requests from clients
func (h *Handler) ServeWS(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade error:", err)
		return
	}

	// Create client entity
	clientEntity := entity.NewClient(r.RemoteAddr, conn)

	// Create client handler
	client := NewClient(clientEntity, h.hub, h.chatUseCase, h.config)

	// Register client
	h.hub.Register(clientEntity)

	// Start read and write pumps
	go client.WritePump()
	go client.ReadPump()
}
