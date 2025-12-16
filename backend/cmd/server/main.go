package main

import (
	"log"
	"net/http"

	"chat-app/internal/delivery/http/handler"
	"chat-app/internal/infrastructure/ai"
	"chat-app/internal/infrastructure/config"
	"chat-app/internal/usecase/chat"
	"chat-app/internal/usecase/websocket"
	"chat-app/pkg/logger"
)

func main() {
	// Initialize logger
	appLogger := logger.New()
	appLogger.Info("Starting chat application...")

	// Load configuration
	cfg := config.Load()

	// Initialize AI client
	aiClient := ai.NewGroqClient(cfg)

	// Initialize use cases
	chatUseCase := chat.NewChatUseCase(aiClient)
	hub := websocket.NewHub()

	// Start hub
	go hub.Run()

	// Initialize handlers
	wsHandler := handler.NewWebSocketHandler(hub, chatUseCase, cfg)
	healthHandler := handler.NewHealthHandler()

	// Setup routes
	http.HandleFunc("/ws", wsHandler.Handle)
	http.HandleFunc("/health", healthHandler.Handle)

	// Start server
	appLogger.Info("Server starting on port " + cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, nil); err != nil {
		log.Fatal("ListenAndServe error:", err)
	}
}
