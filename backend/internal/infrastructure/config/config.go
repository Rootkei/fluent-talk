package config

import (
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
)

// Config holds application configuration
type Config struct {
	Port           string
	GroqAPIKey     string
	GroqModel      string
	WriteWait      time.Duration
	PongWait       time.Duration
	PingPeriod     time.Duration
	MaxMessageSize int64
}

// Load loads configuration from environment variables
func Load() *Config {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	return &Config{
		Port:           port,
		GroqAPIKey:     os.Getenv("GROQ_API_KEY"),
		GroqModel:      "llama-3.3-70b-versatile",
		WriteWait:      10 * time.Second,
		PongWait:       60 * time.Second,
		PingPeriod:     54 * time.Second, // (PongWait * 9) / 10
		MaxMessageSize: 512 * 1024,       // 512KB
	}
}
