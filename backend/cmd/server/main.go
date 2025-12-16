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

	// Initialize AI clients
	aiClient := ai.NewGroqClient(cfg)
	whisperClient := ai.NewGroqWhisperClient(cfg)

	// Initialize use cases
	chatUseCase := chat.NewChatUseCase(aiClient)
	hub := websocket.NewHub()

	// Start hub
	go hub.Run()

	// Initialize handlers
	wsHandler := handler.NewWebSocketHandler(hub, chatUseCase, cfg)
	healthHandler := handler.NewHealthHandler()
	audioHandler := handler.NewAudioHandler(whisperClient)

	// Setup routes
	http.HandleFunc("/ws", wsHandler.Handle)
	http.HandleFunc("/health", healthHandler.Handle)
	http.HandleFunc("/api/transcribe", audioHandler.HandleTranscribe)

	// Start server
	appLogger.Info("Server starting on port " + cfg.Port)
	appLogger.Info("Endpoints: /ws, /health, /api/transcribe")
	if err := http.ListenAndServe(":"+cfg.Port, nil); err != nil {
		log.Fatal("ListenAndServe error:", err)
	}
}
