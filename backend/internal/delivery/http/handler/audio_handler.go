package handler

import (
	"encoding/json"
	"io"
	"log"
	"net/http"

	"chat-app/internal/infrastructure/ai"
)

// AudioHandler handles audio transcription requests
type AudioHandler struct {
	whisperClient *ai.GroqWhisperClient
}

// NewAudioHandler creates a new audio handler
func NewAudioHandler(whisperClient *ai.GroqWhisperClient) *AudioHandler {
	return &AudioHandler{
		whisperClient: whisperClient,
	}
}

// TranscribeResponse represents the transcription response
type TranscribeResponse struct {
	Text    string `json:"text"`
	Success bool   `json:"success"`
	Error   string `json:"error,omitempty"`
}

// HandleTranscribe handles audio transcription requests
func (h *AudioHandler) HandleTranscribe(w http.ResponseWriter, r *http.Request) {
	// Set CORS headers
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	// Handle preflight
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Only allow POST
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse multipart form (max 10MB)
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		log.Printf("Failed to parse multipart form: %v", err)
		h.sendError(w, "Failed to parse form data", http.StatusBadRequest)
		return
	}

	// Get audio file
	file, header, err := r.FormFile("audio")
	if err != nil {
		log.Printf("Failed to get audio file: %v", err)
		h.sendError(w, "No audio file provided", http.StatusBadRequest)
		return
	}
	defer file.Close()

	log.Printf("Received audio file: %s (%d bytes)", header.Filename, header.Size)

	// Read audio data
	audioData, err := io.ReadAll(file)
	if err != nil {
		log.Printf("Failed to read audio data: %v", err)
		h.sendError(w, "Failed to read audio file", http.StatusInternalServerError)
		return
	}

	// Transcribe using Groq Whisper
	log.Printf("Transcribing audio with Groq Whisper API...")
	text, err := h.whisperClient.TranscribeAudio(audioData, header.Filename)
	if err != nil {
		log.Printf("Transcription failed: %v", err)
		h.sendError(w, "Transcription failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	log.Printf("Transcription successful: %s", text)

	// Send response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(TranscribeResponse{
		Text:    text,
		Success: true,
	})
}

func (h *AudioHandler) sendError(w http.ResponseWriter, message string, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(TranscribeResponse{
		Success: false,
		Error:   message,
	})
}
