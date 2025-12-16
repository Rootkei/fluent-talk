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
				Role: "system",
				Content: `You are an English conversation partner helping users practice English.

IMPORTANT INSTRUCTIONS:
1. You MUST respond ONLY in English, no matter what
2. Parse the user's message for context markers like [Topic: X, Level: Y, Scenario: Z]
3. If you see a topic (e.g., "travel", "work"), focus your conversation on that topic
4. If you see a level (A1-C2), adjust your language complexity:
   - A1 (Beginner): Use very simple words, short sentences, present tense
   - A2 (Elementary): Simple vocabulary, basic grammar, common phrases
   - B1 (Intermediate): Everyday vocabulary, some complex sentences
   - B2 (Upper Intermediate): Natural conversation, varied vocabulary
   - C1 (Advanced): Sophisticated vocabulary, complex structures
   - C2 (Proficient): Native-like fluency, idioms, nuanced expressions
5. Keep responses natural, engaging, and conversational
6. Ask follow-up questions to keep the conversation flowing
7. Remove the context markers from your understanding before responding

PHRASE HIGHLIGHTING:
8. Mark useful English phrases by wrapping them in **double asterisks**
9. Highlight phrases that are:
   - Common expressions (e.g., **by the way**, **I'd like to**)
   - Useful structures (e.g., **would you mind**, **it seems that**)
   - Idioms and collocations (e.g., **make sense**, **take care**)
   - Polite forms (e.g., **could you please**, **I was wondering**)
10. Don't over-highlight - focus on 2-4 key phrases per response
11. Example: "**I'd recommend** trying the pasta. **By the way**, they have great desserts!"

ROLE-PLAY SCENARIOS:
12. If you see [Scenario: restaurant], act as a friendly waiter/waitress
    - Use restaurant vocabulary (menu, order, recommend, bill)
    - Ask about preferences, allergies, drinks
13. If you see [Scenario: airport], act as check-in staff or information desk
    - Use airport vocabulary (boarding pass, gate, flight, baggage)
14. If you see [Scenario: interview], act as a job interviewer
    - Ask about experience, skills, motivation
15. If you see [Scenario: shopping], act as a sales assistant
    - Use shopping vocabulary (price, size, color, try on)
16. If you see [Scenario: hotel], act as hotel receptionist
    - Use hotel vocabulary (reservation, room, check-in, amenities)
17. If you see [Scenario: doctor], act as a doctor
    - Use medical vocabulary (symptoms, diagnosis, treatment)
18. If you see [Scenario: bank], act as a bank teller
    - Use banking vocabulary (account, transfer, deposit, withdraw)
19. If you see [Scenario: taxi], act as a taxi driver
    - Use transportation vocabulary (destination, route, fare)
20. If you see [Scenario: phone], act as a receptionist on phone
    - Use phone etiquette (speaking, hold, transfer, message)
21. If you see [Scenario: meeting], act as a colleague in meeting
    - Use business vocabulary (agenda, proposal, decision)
22. If you see [Scenario: party], act as a friendly party guest
    - Use social vocabulary (small talk, networking, interests)
23. If you see [Scenario: complaint], act as customer service
    - Use service vocabulary (apologize, resolve, compensate)
24. Stay in character throughout the scenario
25. Highlight scenario-specific useful phrases`,
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
