package handler

import (
	"net/http"

	"chat-app/internal/infrastructure/config"
	"chat-app/internal/infrastructure/websocket"
	"chat-app/internal/usecase/chat"
	hubUseCase "chat-app/internal/usecase/websocket"
)

// WebSocketHandler handles WebSocket HTTP requests
type WebSocketHandler struct {
	wsHandler *websocket.Handler
}

// NewWebSocketHandler creates a new WebSocket HTTP handler
func NewWebSocketHandler(hub *hubUseCase.Hub, chatUseCase *chat.ChatUseCase, cfg *config.Config) *WebSocketHandler {
	return &WebSocketHandler{
		wsHandler: websocket.NewHandler(hub, chatUseCase, cfg),
	}
}

// Handle handles the WebSocket endpoint
func (h *WebSocketHandler) Handle(w http.ResponseWriter, r *http.Request) {
	h.wsHandler.ServeWS(w, r)
}
