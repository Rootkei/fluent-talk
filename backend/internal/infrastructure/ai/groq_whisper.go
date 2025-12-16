package ai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"

	"chat-app/internal/infrastructure/config"
)

// WhisperResponse represents the response from Groq Whisper API
type WhisperResponse struct {
	Text string `json:"text"`
}

// GroqWhisperClient handles audio transcription using Groq Whisper API
type GroqWhisperClient struct {
	apiKey  string
	baseURL string
	client  *http.Client
}

// NewGroqWhisperClient creates a new Groq Whisper client
func NewGroqWhisperClient(cfg *config.Config) *GroqWhisperClient {
	return &GroqWhisperClient{
		apiKey:  cfg.GroqAPIKey,
		baseURL: "https://api.groq.com/openai/v1/audio/transcriptions",
		client:  &http.Client{},
	}
}

// TranscribeAudio transcribes audio using Groq Whisper API
func (c *GroqWhisperClient) TranscribeAudio(audioData []byte, filename string) (string, error) {
	// Create multipart form
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// Add audio file
	part, err := writer.CreateFormFile("file", filename)
	if err != nil {
		return "", fmt.Errorf("failed to create form file: %w", err)
	}

	if _, err := part.Write(audioData); err != nil {
		return "", fmt.Errorf("failed to write audio data: %w", err)
	}

	// Add model parameter
	if err := writer.WriteField("model", "whisper-large-v3"); err != nil {
		return "", fmt.Errorf("failed to write model field: %w", err)
	}

	// Add language parameter for English
	if err := writer.WriteField("language", "en"); err != nil {
		return "", fmt.Errorf("failed to write language field: %w", err)
	}

	// Add response format
	if err := writer.WriteField("response_format", "json"); err != nil {
		return "", fmt.Errorf("failed to write response_format field: %w", err)
	}

	if err := writer.Close(); err != nil {
		return "", fmt.Errorf("failed to close writer: %w", err)
	}

	// Create request
	req, err := http.NewRequest("POST", c.baseURL, body)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	// Send request
	resp, err := c.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	// Read response
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	// Check status code
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("API error (status %d): %s", resp.StatusCode, string(respBody))
	}

	// Parse response
	var whisperResp WhisperResponse
	if err := json.Unmarshal(respBody, &whisperResp); err != nil {
		return "", fmt.Errorf("failed to parse response: %w", err)
	}

	return whisperResp.Text, nil
}
