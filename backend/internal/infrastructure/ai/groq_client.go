package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"chat-app/internal/infrastructure/config"
)

// GroqClient implements AIRepository for Groq API
type GroqClient struct {
	apiKey string
	model  string
	client *http.Client
}

// GroqRequest represents a request to Groq API
type GroqRequest struct {
	Model    string        `json:"model"`
	Messages []GroqMessage `json:"messages"`
	Stream   bool          `json:"stream"`
}

// GroqMessage represents a message in Groq API
type GroqMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// GroqResponse represents a response from Groq API
type GroqResponse struct {
	Choices []struct {
		Message GroqMessage `json:"message"`
	} `json:"choices"`
}

// NewGroqClient creates a new Groq API client
func NewGroqClient(cfg *config.Config) *GroqClient {
	return &GroqClient{
		apiKey: cfg.GroqAPIKey,
		model:  cfg.GroqModel,
		client: &http.Client{},
	}
}

// GetResponse sends a message to Groq and returns the AI response
func (g *GroqClient) GetResponse(ctx context.Context, userMessage string) (string, error) {
	if g.apiKey == "" {
		return "", fmt.Errorf("GROQ_API_KEY not set")
	}

	reqBody := GroqRequest{
		Model: g.model,
		Messages: []GroqMessage{
			{
				Role:    "system",
				Content: "You are a helpful and friendly AI assistant. Provide concise and helpful responses.",
			},
			{
				Role:    "user",
				Content: userMessage,
			},
		},
		Stream: false,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.groq.com/openai/v1/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+g.apiKey)

	resp, err := g.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("Groq API error: %s", string(body))
	}

	var groqResp GroqResponse
	if err := json.Unmarshal(body, &groqResp); err != nil {
		return "", err
	}

	if len(groqResp.Choices) == 0 {
		return "", fmt.Errorf("no response from Groq")
	}

	return groqResp.Choices[0].Message.Content, nil
}
