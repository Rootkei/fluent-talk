// WebSocket connection
let ws = null;
let reconnectInterval = null;
const WS_URL = 'ws://localhost:8080/ws';

// DOM elements
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const micButton = document.getElementById('micButton');
const speakerButton = document.getElementById('speakerButton');
const voiceStatus = document.getElementById('voiceStatus');

// Voice recognition
let recognition = null;
let isRecording = false;
let isSpeakerMuted = false;
let speechSynthesis = window.speechSynthesis;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    connectWebSocket();
    setupEventListeners();
    initVoiceChat();
});

// WebSocket connection
function connectWebSocket() {
    // Close existing connection if any
    if (ws) {
        ws.onclose = null; // Remove onclose handler to prevent reconnect loop
        ws.onerror = null;
        ws.onmessage = null;
        ws.onopen = null;
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
            ws.close();
        }
        ws = null;
    }

    // Clear any existing reconnect interval
    if (reconnectInterval) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
    }

    try {
        updateStatus('connecting', 'Đang kết nối...');
        ws = new WebSocket(WS_URL);

        ws.onopen = () => {
            console.log('WebSocket connected');
            updateStatus('connected', 'Đã kết nối');
            sendButton.disabled = false;
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            handleIncomingMessage(message);
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            updateStatus('disconnected', 'Lỗi kết nối');
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected');
            updateStatus('disconnected', 'Mất kết nối');
            sendButton.disabled = true;

            // Auto reconnect only if not already reconnecting
            if (!reconnectInterval) {
                reconnectInterval = setInterval(() => {
                    console.log('Attempting to reconnect...');
                    connectWebSocket();
                }, 5000);
            }
        };
    } catch (error) {
        console.error('Failed to connect:', error);
        updateStatus('disconnected', 'Không thể kết nối');
    }
}

// Update connection status
function updateStatus(status, text) {
    statusDot.className = `status-dot ${status}`;
    statusText.textContent = text;
}

// Setup event listeners
function setupEventListeners() {
    // Send button click
    sendButton.addEventListener('click', sendMessage);

    // Enter key to send (Shift+Enter for new line)
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Auto-resize textarea
    messageInput.addEventListener('input', () => {
        messageInput.style.height = 'auto';
        messageInput.style.height = messageInput.scrollHeight + 'px';
    });

    // Enable/disable send button based on input
    messageInput.addEventListener('input', () => {
        const hasContent = messageInput.value.trim().length > 0;
        const isConnected = ws && ws.readyState === WebSocket.OPEN;
        sendButton.disabled = !hasContent || !isConnected;
    });
}

// Send message
function sendMessage() {
    const content = messageInput.value.trim();

    if (!content || !ws || ws.readyState !== WebSocket.OPEN) {
        return;
    }

    // Remove welcome message if exists
    const welcomeMessage = document.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }

    const message = {
        type: 'message',
        content: content,
        sender: 'user'
    };

    // Send to server
    ws.send(JSON.stringify(message));

    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';
    sendButton.disabled = true;
    messageInput.focus();
}

// Handle incoming messages
function handleIncomingMessage(message) {
    if (message.sender === 'user') {
        displayMessage(message.content, 'user');
    } else if (message.sender === 'ai') {
        removeTypingIndicator();
        displayMessage(message.content, 'ai');
    } else if (message.type === 'error') {
        removeTypingIndicator();
        displayMessage(message.content, 'error');
    }

    // Show typing indicator for AI response
    if (message.sender === 'user') {
        showTypingIndicator();
    }
}

// Display message in chat
function displayMessage(content, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';

    if (sender === 'user') {
        avatar.textContent = '👤';
    } else if (sender === 'ai') {
        avatar.textContent = '🤖';
    } else {
        avatar.textContent = '⚠️';
    }

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);

    messagesContainer.appendChild(messageDiv);
    scrollToBottom();

    // Speak AI response if not muted
    if (sender === 'ai' && !isSpeakerMuted) {
        speakText(content);
    }
}

// Show typing indicator
function showTypingIndicator() {
    // Remove existing typing indicator if any
    removeTypingIndicator();

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

    messagesContainer.appendChild(typingDiv);
    scrollToBottom();
}

// Remove typing indicator
function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Scroll to bottom of messages
function scrollToBottom() {
    messagesContainer.scrollTo({
        top: messagesContainer.scrollHeight,
        behavior: 'smooth'
    });
}

// ========== VOICE CHAT FUNCTIONS ==========

// Initialize voice chat
function initVoiceChat() {
    // Check browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.warn('Speech recognition not supported');
        micButton.disabled = true;
        micButton.title = 'Trình duyệt không hỗ trợ nhận diện giọng nói';
        return;
    }

    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();

    recognition.lang = 'vi-VN'; // Vietnamese
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    // Recognition event handlers
    recognition.onstart = () => {
        isRecording = true;
        micButton.classList.add('recording');
        voiceStatus.style.display = 'flex';
        console.log('Voice recognition started');
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('Recognized:', transcript);

        // Set the transcript to input
        messageInput.value = transcript;
        messageInput.style.height = 'auto';
        messageInput.style.height = messageInput.scrollHeight + 'px';

        // Auto-send the message
        setTimeout(() => {
            sendMessage();
        }, 500);
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        stopRecording();

        if (event.error === 'no-speech') {
            console.log('No speech detected');
        } else if (event.error === 'not-allowed') {
            alert('Vui lòng cho phép truy cập microphone để sử dụng tính năng này.');
        }
    };

    recognition.onend = () => {
        stopRecording();
    };

    // Microphone button click
    micButton.addEventListener('click', toggleRecording);

    // Speaker button click
    speakerButton.addEventListener('click', toggleSpeaker);
}

// Toggle voice recording
function toggleRecording() {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

// Start voice recording
function startRecording() {
    if (!recognition) {
        alert('Tính năng nhận diện giọng nói không khả dụng trên trình duyệt này.');
        return;
    }

    try {
        recognition.start();
    } catch (error) {
        console.error('Failed to start recognition:', error);
    }
}

// Stop voice recording
function stopRecording() {
    if (recognition && isRecording) {
        recognition.stop();
    }
    isRecording = false;
    micButton.classList.remove('recording');
    voiceStatus.style.display = 'none';
}

// Toggle speaker (mute/unmute)
function toggleSpeaker() {
    isSpeakerMuted = !isSpeakerMuted;

    if (isSpeakerMuted) {
        speakerButton.classList.add('muted');
        speakerButton.title = 'Bật giọng nói AI';
        // Stop any ongoing speech
        speechSynthesis.cancel();
    } else {
        speakerButton.classList.remove('muted');
        speakerButton.title = 'Tắt giọng nói AI';
    }
}

// Speak text using Text-to-Speech
function speakText(text) {
    if (!speechSynthesis || isSpeakerMuted) {
        return;
    }

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN'; // Vietnamese
    utterance.rate = 1.0; // Normal speed
    utterance.pitch = 1.0; // Normal pitch
    utterance.volume = 1.0; // Full volume

    // Try to find a Vietnamese voice
    const voices = speechSynthesis.getVoices();
    const vietnameseVoice = voices.find(voice => voice.lang.startsWith('vi'));
    if (vietnameseVoice) {
        utterance.voice = vietnameseVoice;
    }

    utterance.onstart = () => {
        console.log('Speaking:', text.substring(0, 50) + '...');
    };

    utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
    };

    speechSynthesis.speak(utterance);
}

// Load voices (some browsers need this)
if (speechSynthesis) {
    speechSynthesis.onvoiceschanged = () => {
        speechSynthesis.getVoices();
    };
}

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            connectWebSocket();
        }
    } else {
        // Stop recording when page is hidden
        if (isRecording) {
            stopRecording();
        }
    }
});
