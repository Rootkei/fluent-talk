package repository

import "context"

// AIRepository defines the interface for AI service interactions
type AIRepository interface {
	// GetResponse sends a message to the AI and returns the response
	GetResponse(ctx context.Context, userMessage string) (string, error)
}
