package chat

import (
	"context"
	"encoding/json"
	"log"

	"chat-app/internal/domain/entity"
	"chat-app/internal/domain/repository"
)

// ChatUseCase handles chat business logic
type ChatUseCase struct {
	aiRepo repository.AIRepository
}

// NewChatUseCase creates a new ChatUseCase
func NewChatUseCase(aiRepo repository.AIRepository) *ChatUseCase {
	return &ChatUseCase{
		aiRepo: aiRepo,
	}
}

// ProcessMessage processes a user message and returns AI response
func (uc *ChatUseCase) ProcessMessage(ctx context.Context, userMessage string) (*entity.Message, error) {
	// Get AI response
	aiResponse, err := uc.aiRepo.GetResponse(ctx, userMessage)
	if err != nil {
		log.Printf("Error getting AI response: %v", err)
		return entity.NewMessage(entity.MessageTypeError,
			"Sorry, I couldn't process your message. Please try again.",
			"system")
	}

	// Create AI message
	return entity.NewMessage(entity.MessageTypeText, aiResponse, "ai")
}

// SerializeMessage converts a message to JSON bytes
func (uc *ChatUseCase) SerializeMessage(msg *entity.Message) ([]byte, error) {
	return json.Marshal(msg)
}

// DeserializeMessage converts JSON bytes to a message
func (uc *ChatUseCase) DeserializeMessage(data []byte) (*entity.Message, error) {
	var msg entity.Message
	if err := json.Unmarshal(data, &msg); err != nil {
		return nil, err
	}
	return &msg, nil
}
