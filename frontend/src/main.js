import { ChatService } from '../application/services/ChatService.js';
import { WebSocketClient } from '../infrastructure/websocket/WebSocketClient.js';
import { ConnectionStatus } from '../domain/repositories/IWebSocketRepository.js';
import { MessageSender } from '../domain/entities/Message.js';
import { UI_TEXT } from '../shared/constants/constants.js';

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
