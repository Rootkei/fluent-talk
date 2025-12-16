// Bundled version for file:// protocol compatibility
// This file combines all modules into one to avoid CORS issues

// ========== Domain Layer ==========

// Message Entity
class Message {
    constructor(type, content, sender, timestamp = new Date()) {
        this.type = type;
        this.content = content;
        this.sender = sender;
        this.timestamp = timestamp;
    }

    static fromJSON(json) {
        return new Message(
            json.type,
            json.content,
            json.sender,
            json.timestamp ? new Date(json.timestamp) : new Date()
        );
    }

    toJSON() {
        return {
            type: this.type,
            content: this.content,
            sender: this.sender,
            timestamp: this.timestamp.toISOString()
        };
    }

    validate() {
        if (!this.content || this.content.trim() === '') {
            throw new Error('Message content cannot be empty');
        }
        if (!this.sender) {
            throw new Error('Message sender cannot be empty');
        }
        return true;
    }
}

const MessageType = {
    TEXT: 'message',
    ERROR: 'error'
};

const MessageSender = {
    USER: 'user',
    AI: 'ai',
    SYSTEM: 'system'
};

// Connection Status
const ConnectionStatus = {
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    ERROR: 'error'
};

// ========== Configuration ==========

const CONFIG = {
    WS_URL: 'ws://localhost:8080/ws',
    RECONNECT_INTERVAL: 5000,
    MESSAGE_MAX_LENGTH: 5000
};

const UI_TEXT = {
    STATUS: {
        CONNECTING: 'Đang kết nối...',
        CONNECTED: 'Đã kết nối',
        DISCONNECTED: 'Mất kết nối',
        ERROR: 'Lỗi kết nối'
    },
    PLACEHOLDER: 'Nhập tin nhắn...',
    WELCOME: 'Xin chào! Tôi là AI assistant. Hãy hỏi tôi bất cứ điều gì!'
};

// ========== Infrastructure Layer ==========

// WebSocket Client
class WebSocketClient {
    constructor() {
        this.ws = null;
        this.status = ConnectionStatus.DISCONNECTED;
        this.messageCallbacks = [];
        this.statusCallbacks = [];
        this.reconnectInterval = null;
    }

    connect() {
        this.#closeExisting();
        this.#updateStatus(ConnectionStatus.CONNECTING);

        try {
            this.ws = new WebSocket(CONFIG.WS_URL);

            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.#updateStatus(ConnectionStatus.CONNECTED);
                this.#clearReconnect();
            };

            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.messageCallbacks.forEach(cb => cb(data));
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.#updateStatus(ConnectionStatus.ERROR);
            };

            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                this.#updateStatus(ConnectionStatus.DISCONNECTED);
                this.#scheduleReconnect();
            };
        } catch (error) {
            console.error('Failed to connect:', error);
            this.#updateStatus(ConnectionStatus.ERROR);
        }
    }

    disconnect() {
        this.#clearReconnect();
        this.#closeExisting();
    }

    send(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
            return true;
        }
        return false;
    }

    onMessage(callback) {
        this.messageCallbacks.push(callback);
    }

    onStatusChange(callback) {
        this.statusCallbacks.push(callback);
    }

    getStatus() {
        return this.status;
    }

    #closeExisting() {
        if (this.ws) {
            this.ws.onclose = null;
            this.ws.onerror = null;
            this.ws.onmessage = null;
            this.ws.onopen = null;
            if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
                this.ws.close();
            }
            this.ws = null;
        }
    }

    #clearReconnect() {
        if (this.reconnectInterval) {
            clearInterval(this.reconnectInterval);
            this.reconnectInterval = null;
        }
    }

    #scheduleReconnect() {
        if (!this.reconnectInterval) {
            this.reconnectInterval = setInterval(() => {
                console.log('Attempting to reconnect...');
                this.connect();
            }, CONFIG.RECONNECT_INTERVAL);
        }
    }

    #updateStatus(newStatus) {
        this.status = newStatus;
        this.statusCallbacks.forEach(cb => cb(newStatus));
    }
}

// ========== Application Layer ==========

// Send Message Use Case
class SendMessageUseCase {
    constructor(wsRepository) {
        this.wsRepository = wsRepository;
    }

    execute(content) {
        const message = new Message(MessageType.TEXT, content, MessageSender.USER);
        message.validate();

        const success = this.wsRepository.send(message.toJSON());
        return { success, message };
    }
}

// Connect WebSocket Use Case
class ConnectWebSocketUseCase {
    constructor(wsRepository) {
        this.wsRepository = wsRepository;
    }

    execute() {
        this.wsRepository.connect();
    }

    disconnect() {
        this.wsRepository.disconnect();
    }
}

// Chat Service
class ChatService {
    constructor(wsRepository) {
        this.wsRepository = wsRepository;
        this.sendMessageUseCase = new SendMessageUseCase(wsRepository);
        this.connectUseCase = new ConnectWebSocketUseCase(wsRepository);
        this.messageHandlers = [];
    }

    connect() {
        this.connectUseCase.execute();
        this.wsRepository.onMessage((data) => {
            const message = Message.fromJSON(data);
            this.messageHandlers.forEach(handler => handler(message));
        });
    }

    disconnect() {
        this.connectUseCase.disconnect();
    }

    sendMessage(content) {
        return this.sendMessageUseCase.execute(content);
    }

    onMessage(handler) {
        this.messageHandlers.push(handler);
    }

    onStatusChange(handler) {
        this.wsRepository.onStatusChange(handler);
    }

    getStatus() {
        return this.wsRepository.getStatus();
    }
}

// ========== Presentation Layer ==========

// Chat Controller
class ChatController {
    constructor() {
        // Initialize services
        const wsClient = new WebSocketClient();
        this.chatService = new ChatService(wsClient);

        // DOM elements
        this.messagesContainer = document.getElementById('messagesContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.statusDot = document.getElementById('statusDot');
        this.statusText = document.getElementById('statusText');

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupServiceHandlers();
        this.chatService.connect();
    }

    setupEventListeners() {
        this.sendButton.addEventListener('click', () => this.handleSendMessage());

        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });

        this.messageInput.addEventListener('input', () => {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = this.messageInput.scrollHeight + 'px';
            this.updateSendButton();
        });
    }

    setupServiceHandlers() {
        this.chatService.onMessage((message) => {
            this.handleIncomingMessage(message);
        });

        this.chatService.onStatusChange((status) => {
            this.updateStatus(status);
        });
    }

    handleSendMessage() {
        const content = this.messageInput.value.trim();
        if (!content) return;

        const result = this.chatService.sendMessage(content);
        if (result.success) {
            this.messageInput.value = '';
            this.messageInput.style.height = 'auto';
            this.updateSendButton();
            this.messageInput.focus();
        }
    }

    handleIncomingMessage(message) {
        // Remove welcome message if exists
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }

        if (message.sender === MessageSender.USER) {
            this.displayMessage(message.content, 'user');
            this.showTypingIndicator();
        } else if (message.sender === MessageSender.AI) {
            this.removeTypingIndicator();
            this.displayMessage(message.content, 'ai');
        } else if (message.type === 'error') {
            this.removeTypingIndicator();
            this.displayMessage(message.content, 'error');
        }
    }

    displayMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = sender === 'user' ? '👤' : (sender === 'ai' ? '🤖' : '⚠️');

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    showTypingIndicator() {
        this.removeTypingIndicator();

        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.id = 'typingIndicator';

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = '🤖';

        const dotsDiv = document.createElement('div');
        dotsDiv.className = 'typing-dots';
        dotsDiv.innerHTML = '<span></span><span></span><span></span>';

        typingDiv.appendChild(avatar);
        typingDiv.appendChild(dotsDiv);
        this.messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    removeTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }

    updateStatus(status) {
        const statusClass = status.toLowerCase();
        const statusTextMap = {
            [ConnectionStatus.CONNECTING]: UI_TEXT.STATUS.CONNECTING,
            [ConnectionStatus.CONNECTED]: UI_TEXT.STATUS.CONNECTED,
            [ConnectionStatus.DISCONNECTED]: UI_TEXT.STATUS.DISCONNECTED,
            [ConnectionStatus.ERROR]: UI_TEXT.STATUS.ERROR
        };

        this.statusDot.className = `status-dot ${statusClass}`;
        this.statusText.textContent = statusTextMap[status] || status;
        this.updateSendButton();
    }

    updateSendButton() {
        const hasContent = this.messageInput.value.trim().length > 0;
        const isConnected = this.chatService.getStatus() === ConnectionStatus.CONNECTED;
        this.sendButton.disabled = !hasContent || !isConnected;
    }

    scrollToBottom() {
        this.messagesContainer.scrollTo({
            top: this.messagesContainer.scrollHeight,
            behavior: 'smooth'
        });
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ChatController();
});
