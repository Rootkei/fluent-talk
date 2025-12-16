package logger

import (
	"log"
	"os"
)

// Logger provides structured logging
type Logger struct {
	*log.Logger
}

// New creates a new logger
func New() *Logger {
	return &Logger{
		Logger: log.New(os.Stdout, "", log.LstdFlags),
	}
}

// Info logs an info message
func (l *Logger) Info(msg string) {
	l.Printf("[INFO] %s", msg)
}

// Error logs an error message
func (l *Logger) Error(msg string) {
	l.Printf("[ERROR] %s", msg)
}

// Fatal logs a fatal message and exits
func (l *Logger) Fatal(msg string) {
	l.Fatalf("[FATAL] %s", msg)
}
