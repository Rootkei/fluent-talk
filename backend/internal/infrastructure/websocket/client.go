package websocket

import (
	"context"
	"log"
	"time"

	"github.com/gorilla/websocket"

	"chat-app/internal/domain/entity"
	"chat-app/internal/infrastructure/config"
	"chat-app/internal/usecase/chat"
	hubUseCase "chat-app/internal/usecase/websocket"
)

// Client handles WebSocket client operations
type Client struct {
	entity      *entity.Client
	hub         *hubUseCase.Hub
	chatUseCase *chat.ChatUseCase
	config      *config.Config
}

// NewClient creates a new WebSocket client handler
func NewClient(
	entityClient *entity.Client,
	hub *hubUseCase.Hub,
	chatUseCase *chat.ChatUseCase,
	cfg *config.Config,
) *Client {
	return &Client{
		entity:      entityClient,
		hub:         hub,
		chatUseCase: chatUseCase,
		config:      cfg,
	}
}

// ReadPump pumps messages from the WebSocket connection to the hub
func (c *Client) ReadPump() {
	defer func() {
		c.hub.Unregister(c.entity)
		c.entity.Conn.Close()
	}()

	c.entity.Conn.SetReadDeadline(time.Now().Add(c.config.PongWait))
	c.entity.Conn.SetPongHandler(func(string) error {
		c.entity.Conn.SetReadDeadline(time.Now().Add(c.config.PongWait))
		return nil
	})
	c.entity.Conn.SetReadLimit(c.config.MaxMessageSize)

	for {
		_, message, err := c.entity.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}

		// Deserialize message
		msg, err := c.chatUseCase.DeserializeMessage(message)
		if err != nil {
			log.Printf("Error unmarshaling message: %v", err)
			continue
		}

		// Broadcast user message to all clients
		c.hub.Broadcast(message)

		// Get AI response asynchronously
		go c.handleAIResponse(msg.Content)
	}
}

// WritePump pumps messages from the hub to the WebSocket connection
func (c *Client) WritePump() {
	ticker := time.NewTicker(c.config.PingPeriod)
	defer func() {
		ticker.Stop()
		c.entity.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.entity.Send:
			c.entity.Conn.SetWriteDeadline(time.Now().Add(c.config.WriteWait))
			if !ok {
				// The hub closed the channel
				c.entity.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := c.entity.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
				log.Printf("Error writing message: %v", err)
				return
			}

		case <-ticker.C:
			c.entity.Conn.SetWriteDeadline(time.Now().Add(c.config.WriteWait))
			if err := c.entity.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// handleAIResponse processes AI response
func (c *Client) handleAIResponse(userMessage string) {
	ctx := context.Background()
	aiMsg, err := c.chatUseCase.ProcessMessage(ctx, userMessage)
	if err != nil {
		log.Printf("Error processing message: %v", err)
		return
	}

	aiJSON, err := c.chatUseCase.SerializeMessage(aiMsg)
	if err != nil {
		log.Printf("Error serializing AI message: %v", err)
		return
	}

	c.hub.Broadcast(aiJSON)
}
