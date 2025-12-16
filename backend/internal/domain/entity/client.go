package entity

import (
	"github.com/gorilla/websocket"
)

// Client represents a WebSocket client entity
type Client struct {
	ID   string
	Conn *websocket.Conn
	Send chan []byte
}

// NewClient creates a new client
func NewClient(id string, conn *websocket.Conn) *Client {
	return &Client{
		ID:   id,
		Conn: conn,
		Send: make(chan []byte, 256),
	}
}
