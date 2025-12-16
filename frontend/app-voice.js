// Bundled Voice Chat Application
// Voice-first conversation with AI using Web Speech API

// ========== Domain Layer ==========

// Voice Message Entity
class VoiceMessage {
    constructor(text, sender, timestamp = new Date()) {
        this.text = text;
        this.sender = sender;
        this.timestamp = timestamp;
    }

    static fromText(text, sender) {
        return new VoiceMessage(text, sender);
    }

    validate() {
        if (!this.text || this.text.trim() === '') {
            throw new Error('Voice message text cannot be empty');
        }
        return true;
    }
}

const VoiceSender = {
    USER: 'user',
    AI: 'ai'
};

const VoiceState = {
    IDLE: 'idle',
    LISTENING: 'listening',
    SPEAKING: 'speaking',
    PROCESSING: 'processing'
};

// ========== Configuration ==========

const CONFIG = {
    WS_URL: 'ws://localhost:8080/ws',
    RECONNECT_INTERVAL: 5000,
    VOICE_LANG: 'vi-VN',
    SPEECH_RATE: 1.0,
    SPEECH_PITCH: 1.0,
    SPEECH_VOLUME: 1.0
};

const UI_TEXT = {
    STATUS: {
        IDLE: 'Nhấn mic để bắt đầu',
        LISTENING: '🎤 Đang nghe...',
        SPEAKING: '🔊 AI đang nói...',
        PROCESSING: '⏳ Đang xử lý...',
        CONNECTED: 'Đã kết nối',
        DISCONNECTED: 'Mất kết nối'
    }
};

// ========== Infrastructure Layer ==========

// WebSocket Client (simplified)
class WebSocketClient {
    constructor() {
        this.ws = null;
        this.messageCallbacks = [];
        this.statusCallbacks = [];
        this.reconnectInterval = null;
    }

    connect() {
        if (this.ws) {
            this.ws.close();
        }

        try {
            this.ws = new WebSocket(CONFIG.WS_URL);

            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.statusCallbacks.forEach(cb => cb('connected'));
                if (this.reconnectInterval) {
                    clearInterval(this.reconnectInterval);
                    this.reconnectInterval = null;
                }
            };

            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.messageCallbacks.forEach(cb => cb(data));
            };

            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                this.statusCallbacks.forEach(cb => cb('disconnected'));
                this.scheduleReconnect();
            };
        } catch (error) {
            console.error('WebSocket error:', error);
        }
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

    scheduleReconnect() {
        if (!this.reconnectInterval) {
            this.reconnectInterval = setInterval(() => {
                console.log('Reconnecting...');
                this.connect();
            }, CONFIG.RECONNECT_INTERVAL);
        }
    }
}

// Web Speech Voice
class WebSpeechVoice {
    constructor() {
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.state = VoiceState.IDLE;

        this.speechRecognizedCallbacks = [];
        this.stateChangeCallbacks = [];

        this.initRecognition();
    }

    initRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.error('Speech Recognition not supported');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.lang = CONFIG.VOICE_LANG;
        this.recognition.continuous = true;
        this.recognition.interimResults = false;

        this.recognition.onstart = () => {
            console.log('Listening...');
            this.updateState(VoiceState.LISTENING);
        };

        this.recognition.onresult = (event) => {
            const last = event.results.length - 1;
            const transcript = event.results[last][0].transcript;
            console.log('Recognized:', transcript);
            this.speechRecognizedCallbacks.forEach(cb => cb(transcript));
        };

        this.recognition.onerror = (event) => {
            console.error('Recognition error:', event.error);
            if (event.error === 'no-speech') {
                this.startListening();
            }
        };

        this.recognition.onend = () => {
            if (this.state === VoiceState.LISTENING) {
                this.recognition.start();
            }
        };
    }

    startListening() {
        if (!this.recognition) return;

        try {
            this.updateState(VoiceState.LISTENING);
            this.recognition.start();
        } catch (error) {
            console.log('Already listening');
        }
    }

    stopListening() {
        if (this.recognition) {
            this.updateState(VoiceState.IDLE);
            this.recognition.stop();
        }
    }

    speak(text) {
        if (!this.synthesis) return;

        this.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = CONFIG.VOICE_LANG;
        utterance.rate = CONFIG.SPEECH_RATE;
        utterance.pitch = CONFIG.SPEECH_PITCH;
        utterance.volume = CONFIG.SPEECH_VOLUME;

        const voices = this.synthesis.getVoices();
        const vietnameseVoice = voices.find(v => v.lang.startsWith('vi'));
        if (vietnameseVoice) {
            utterance.voice = vietnameseVoice;
        }

        utterance.onstart = () => {
            this.updateState(VoiceState.SPEAKING);
        };

        utterance.onend = () => {
            this.updateState(VoiceState.IDLE);
        };

        this.synthesis.speak(utterance);
    }

    stopSpeaking() {
        if (this.synthesis) {
            this.synthesis.cancel();
            this.updateState(VoiceState.IDLE);
        }
    }

    onSpeechRecognized(callback) {
        this.speechRecognizedCallbacks.push(callback);
    }

    onStateChange(callback) {
        this.stateChangeCallbacks.push(callback);
    }

    updateState(newState) {
        this.state = newState;
        this.stateChangeCallbacks.forEach(cb => cb(newState));
    }

    getState() {
        return this.state;
    }
}

// ========== Application Layer ==========

class VoiceController {
    constructor() {
        // Initialize services
        this.wsClient = new WebSocketClient();
        this.voice = new WebSpeechVoice();

        // State
        this.isActive = false;
        this.conversationHistory = [];

        // DOM elements
        this.micButton = document.getElementById('micButton');
        this.statusText = document.getElementById('statusText');
        this.statusDot = document.getElementById('statusDot');
        this.transcript = document.getElementById('transcript');
        this.conversationLog = document.getElementById('conversationLog');

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupServiceHandlers();
        this.wsClient.connect();
    }

    setupEventListeners() {
        this.micButton.addEventListener('click', () => this.toggleConversation());
    }

    setupServiceHandlers() {
        // Handle recognized speech
        this.voice.onSpeechRecognized((text) => {
            this.handleUserSpeech(text);
        });

        // Handle voice state changes
        this.voice.onStateChange((state) => {
            this.updateUI(state);
        });

        // Handle WebSocket messages
        this.wsClient.onMessage((data) => {
            this.handleAIResponse(data);
        });

        // Handle WebSocket status
        this.wsClient.onStatusChange((status) => {
            console.log('WebSocket status:', status);
        });
    }

    toggleConversation() {
        if (this.isActive) {
            this.stopConversation();
        } else {
            this.startConversation();
        }
    }

    startConversation() {
        this.isActive = true;
        this.micButton.classList.add('active');
        this.voice.startListening();
        this.addToLog('system', 'Bắt đầu cuộc trò chuyện. Hãy nói gì đó...');
    }

    stopConversation() {
        this.isActive = false;
        this.micButton.classList.remove('active');
        this.voice.stopListening();
        this.voice.stopSpeaking();
        this.addToLog('system', 'Kết thúc cuộc trò chuyện.');
    }

    handleUserSpeech(text) {
        console.log('User said:', text);
        this.transcript.textContent = text;
        this.addToLog('user', text);

        // Send to backend
        const message = {
            type: 'message',
            content: text,
            sender: 'user'
        };

        this.wsClient.send(message);
        this.updateUI(VoiceState.PROCESSING);
    }

    handleAIResponse(data) {
        if (data.sender === 'ai') {
            console.log('AI said:', data.content);
            this.addToLog('ai', data.content);

            // Speak the AI response
            this.voice.speak(data.content);
        }
    }

    updateUI(state) {
        const statusMap = {
            [VoiceState.IDLE]: { text: UI_TEXT.STATUS.IDLE, class: 'idle' },
            [VoiceState.LISTENING]: { text: UI_TEXT.STATUS.LISTENING, class: 'listening' },
            [VoiceState.SPEAKING]: { text: UI_TEXT.STATUS.SPEAKING, class: 'speaking' },
            [VoiceState.PROCESSING]: { text: UI_TEXT.STATUS.PROCESSING, class: 'processing' }
        };

        const status = statusMap[state] || statusMap[VoiceState.IDLE];
        this.statusText.textContent = status.text;
        this.statusDot.className = `status-dot ${status.class}`;
    }

    addToLog(sender, text) {
        const entry = document.createElement('div');
        entry.className = `log-entry ${sender}`;

        const icon = sender === 'user' ? '👤' : (sender === 'ai' ? '🤖' : 'ℹ️');
        const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

        entry.innerHTML = `
            <span class="log-icon">${icon}</span>
            <span class="log-time">${time}</span>
            <span class="log-text">${text}</span>
        `;

        this.conversationLog.appendChild(entry);
        this.conversationLog.scrollTop = this.conversationLog.scrollHeight;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new VoiceController();
});
