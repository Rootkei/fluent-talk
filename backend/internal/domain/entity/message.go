package entity

import (
	"errors"
	"time"
)

// MessageType represents the type of message
type MessageType string

const (
	MessageTypeText  MessageType = "message"
	MessageTypeError MessageType = "error"
)

// Message represents a chat message entity
type Message struct {
	Type      MessageType `json:"type"`
	Content   string      `json:"content"`
	Sender    string      `json:"sender"`
	Timestamp time.Time   `json:"timestamp"`
}

// NewMessage creates a new message with validation
func NewMessage(msgType MessageType, content, sender string) (*Message, error) {
	if content == "" {
		return nil, errors.New("message content cannot be empty")
	}
	if sender == "" {
		return nil, errors.New("message sender cannot be empty")
	}

	return &Message{
		Type:      msgType,
		Content:   content,
		Sender:    sender,
		Timestamp: time.Now(),
	}, nil
}

// Validate validates the message
func (m *Message) Validate() error {
	if m.Content == "" {
		return errors.New("message content cannot be empty")
	}
	if m.Sender == "" {
		return errors.New("message sender cannot be empty")
	}
	return nil
}
