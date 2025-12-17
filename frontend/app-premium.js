// Premium Voice Chat with 2D Animated Avatar + Groq Whisper API
// Grok AI Style with 2D character animations

// ========== Configuration ==========

const CONFIG = {
    WS_URL: 'ws://localhost:8080/ws',
    BACKEND_URL: 'http://localhost:8080',
    RECONNECT_INTERVAL: 5000,
    SPEECH_RATE: 1.0
};

const UI_TEXT = {
    STATUS: {
        IDLE: 'Click mic to start',
        RECORDING: '🎤 Recording...',
        UPLOADING: '📤 Processing...',
        SPEAKING: '🔊 AI speaking...',
        LOADING: 'Loading...'
    }
};

const VoiceState = {
    IDLE: 'idle',
    RECORDING: 'recording',
    UPLOADING: 'uploading',
    SPEAKING: 'speaking'
};

// ========== Audio Recorder with VAD ==========

class AudioRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.stream = null;
        this.isRecording = false;
        this.onStopCallbacks = [];
        this.onErrorCallbacks = [];
        this.onSpeechDetectedCallbacks = [];
        this.onSilenceDetectedCallbacks = [];

        // VAD (Voice Activity Detection)
        this.audioContext = null;
        this.analyser = null;
        this.silenceTimeout = null;
        this.isSpeaking = false;
        this.SILENCE_THRESHOLD = -50; // dB
        this.SILENCE_DURATION = 3000; // 3 seconds
    }

    async startRecording() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });

            const options = { mimeType: 'audio/webm;codecs=opus' };
            this.mediaRecorder = new MediaRecorder(this.stream, options);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                this.onStopCallbacks.forEach(cb => cb(audioBlob));
                this.cleanup();
            };

            this.mediaRecorder.onerror = (error) => {
                this.onErrorCallbacks.forEach(cb => cb(error));
            };

            this.mediaRecorder.start();
            this.isRecording = true;

            // Start VAD
            this.startVAD();

            return true;
        } catch (error) {
            this.onErrorCallbacks.forEach(cb => cb(error));
            return false;
        }
    }

    startVAD() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;

        const source = this.audioContext.createMediaStreamSource(this.stream);
        source.connect(this.analyser);

        this.monitorAudio();
    }

    monitorAudio() {
        if (!this.isRecording) return;

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);

        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        const volume = 20 * Math.log10(average / 255);

        if (volume > this.SILENCE_THRESHOLD) {
            if (!this.isSpeaking) {
                this.isSpeaking = true;
                console.log('🗣️ Speech detected');
                this.onSpeechDetectedCallbacks.forEach(cb => cb());
            }

            if (this.silenceTimeout) {
                clearTimeout(this.silenceTimeout);
            }

            this.silenceTimeout = setTimeout(() => {
                this.handleSilence();
            }, this.SILENCE_DURATION);
        }

        requestAnimationFrame(() => this.monitorAudio());
    }

    handleSilence() {
        if (this.isSpeaking) {
            console.log('🤫 Silence detected - auto stopping');
            this.isSpeaking = false;
            this.onSilenceDetectedCallbacks.forEach(cb => cb());
            this.stopRecording();
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;

            if (this.silenceTimeout) {
                clearTimeout(this.silenceTimeout);
                this.silenceTimeout = null;
            }
        }
    }

    cleanup() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        this.isSpeaking = false;
    }

    onStop(callback) {
        this.onStopCallbacks.push(callback);
    }

    onError(callback) {
        this.onErrorCallbacks.push(callback);
    }

    onSpeechDetected(callback) {
        this.onSpeechDetectedCallbacks.push(callback);
    }

    onSilenceDetected(callback) {
        this.onSilenceDetectedCallbacks.push(callback);
    }
}

// ========== Groq Whisper Voice ==========

class GroqWhisperVoice {
    constructor(backendURL) {
        this.backendURL = backendURL;
        this.audioRecorder = new AudioRecorder();
        this.synthesis = window.speechSynthesis;
        this.state = VoiceState.IDLE;
        this.speechRecognizedCallbacks = [];
        this.stateChangeCallbacks = [];
        this.speechDetectedCallbacks = [];

        this.setupRecorderHandlers();
    }

    setupRecorderHandlers() {
        this.audioRecorder.onStop(async (audioBlob) => {
            await this.uploadAndTranscribe(audioBlob);
        });

        this.audioRecorder.onError((error) => {
            console.error('Recorder error:', error);
            this.updateState(VoiceState.IDLE);
        });

        this.audioRecorder.onSpeechDetected(() => {
            console.log('🗣️ User started speaking');
            this.speechDetectedCallbacks.forEach(cb => cb());

            if (this.state === VoiceState.SPEAKING) {
                console.log('⏸️ Interrupting AI');
                this.synthesis.cancel();
                this.updateState(VoiceState.RECORDING);
            }
        });

        this.audioRecorder.onSilenceDetected(() => {
            console.log('🤫 User stopped speaking - auto sending');
        });
    }

    async startListening() {
        const success = await this.audioRecorder.startRecording();
        if (success) {
            this.updateState(VoiceState.RECORDING);
        }
    }

    stopListening() {
        this.audioRecorder.stopRecording();
    }

    async uploadAndTranscribe(audioBlob) {
        try {
            this.updateState(VoiceState.UPLOADING);
            console.log('📤 Uploading', audioBlob.size, 'bytes');

            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');

            const response = await fetch(`${this.backendURL}/api/transcribe`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success && data.text) {
                console.log('✅ Transcription:', data.text);
                this.speechRecognizedCallbacks.forEach(cb => cb(data.text));
                this.updateState(VoiceState.IDLE);
            } else {
                throw new Error(data.error || 'Transcription failed');
            }
        } catch (error) {
            console.error('Transcription error:', error);
            this.updateState(VoiceState.IDLE);
        }
    }

    speak(text) {
        if (!this.synthesis) return;

        this.synthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = CONFIG.SPEECH_RATE || 1.0;

        const voices = this.synthesis.getVoices();

        // Get voice gender preference from controller
        const preferredGender = window.voiceController?.voiceGender || 'female';

        // Filter English voices by gender
        let selectedVoice;
        if (preferredGender === 'male') {
            // Try to find male voice (usually contains 'Male' or specific names)
            selectedVoice = voices.find(v =>
                v.lang.startsWith('en') &&
                (v.name.includes('Male') || v.name.includes('David') || v.name.includes('James'))
            );
        } else {
            // Try to find female voice
            selectedVoice = voices.find(v =>
                v.lang.startsWith('en') &&
                (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Victoria'))
            );
        }

        // Fallback to any English voice
        if (!selectedVoice) {
            selectedVoice = voices.find(v => v.lang.startsWith('en'));
        }

        if (selectedVoice) utterance.voice = selectedVoice;

        utterance.onstart = () => this.updateState(VoiceState.SPEAKING);
        utterance.onend = () => this.updateState(VoiceState.IDLE);

        this.synthesis.speak(utterance);
    }

    onSpeechRecognized(callback) {
        this.speechRecognizedCallbacks.push(callback);
    }

    onSpeechDetected(callback) {
        this.speechDetectedCallbacks.push(callback);
    }

    onStateChange(callback) {
        this.stateChangeCallbacks.push(callback);
    }

    updateState(newState) {
        this.state = newState;
        this.stateChangeCallbacks.forEach(cb => cb(newState));
    }
}

// ========== 2D Avatar System ==========

class Avatar2D {
    constructor(container) {
        this.container = container;
        this.currentState = 'idle';
        this.isAnimating = false;

        this.states = {
            idle: 'assets/images/avatar-idle.png',
            listening: 'assets/images/avatar-listening.png',
            talking: 'assets/images/avatar-talking.png'
        };

        this.init();
    }

    init() {
        this.avatarElement = document.createElement('div');
        this.avatarElement.className = 'avatar-2d-container';

        this.avatarImage = document.createElement('img');
        this.avatarImage.className = 'avatar-2d-image';
        this.avatarImage.src = this.states.idle;
        this.avatarImage.alt = 'AI Assistant Avatar';

        this.avatarElement.appendChild(this.avatarImage);
        this.container.appendChild(this.avatarElement);

        this.preloadImages();
        this.startFloatingAnimation();
    }

    preloadImages() {
        Object.values(this.states).forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }

    setState(state) {
        if (this.states[state] && this.currentState !== state) {
            this.currentState = state;

            this.avatarImage.style.opacity = '0';

            setTimeout(() => {
                this.avatarImage.src = this.states[state];
                this.avatarImage.style.opacity = '1';
            }, 200);
        }
    }

    startTalking() {
        this.isAnimating = true;
        this.animateTalking();
    }

    stopTalking() {
        this.isAnimating = false;
        this.setState('idle');
    }

    startListening() {
        this.setState('listening');
    }

    animateTalking() {
        if (!this.isAnimating) return;

        const interval = 200 + Math.random() * 200;

        this.setState('talking');

        setTimeout(() => {
            if (this.isAnimating) {
                this.setState('idle');
                setTimeout(() => {
                    this.animateTalking();
                }, interval / 2);
            }
        }, interval);
    }

    startFloatingAnimation() {
        this.avatarElement.style.animation = 'avatarFloat 3s ease-in-out infinite';
    }
}

// ========== WebSocket Client ==========

class WebSocketClient {
    constructor() {
        this.ws = null;
        this.messageCallbacks = [];
        this.reconnectInterval = null;
    }

    connect() {
        if (this.ws) this.ws.close();

        try {
            this.ws = new WebSocket(CONFIG.WS_URL);

            this.ws.onopen = () => {
                console.log('WebSocket connected');
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

    scheduleReconnect() {
        if (!this.reconnectInterval) {
            this.reconnectInterval = setInterval(() => {
                this.connect();
            }, CONFIG.RECONNECT_INTERVAL);
        }
    }
}

// ========== Main Controller ==========

class PremiumVoiceController {
    constructor() {
        this.wsClient = new WebSocketClient();
        this.voice = new GroqWhisperVoice(CONFIG.BACKEND_URL);

        this.isActive = false;
        this.userScrolled = false;

        // UI Elements
        this.micButton = document.getElementById('micButton');
        this.statusText = document.getElementById('statusText');
        this.statusDot = document.getElementById('statusDot');
        this.chatMessages = document.getElementById('chatMessages');
        this.interimTranscript = document.getElementById('interimTranscript');
        this.voiceLevelContainer = document.getElementById('voiceLevelContainer');
        this.voiceLevelFill = document.getElementById('voiceLevelFill');
        this.waveformCanvas = document.getElementById('waveformCanvas');
        this.scrollBottomBtn = document.getElementById('scrollBottomBtn');

        // Waveform setup
        this.waveformCtx = this.waveformCanvas.getContext('2d');
        this.waveformData = [];

        // Sound effects
        this.sounds = {
            start: this.createBeep(800, 0.1, 0.1),
            stop: this.createBeep(400, 0.1, 0.1),
            error: this.createBeep(200, 0.2, 0.15)
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupServiceHandlers();
        this.wsClient.connect();

        // Mobile optimizations
        this.setupMobileOptimizations();

        setTimeout(() => {
            this.micButton.disabled = false;
            this.updateUI(VoiceState.IDLE);
            // Empty state will show instead of system message
        }, 1000);
    }

    setupMobileOptimizations() {
        // Prevent zoom on double-tap for mic button
        this.micButton.addEventListener('touchend', (e) => {
            e.preventDefault();
        });

        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.scrollToBottom();
            }, 300);
        });

        // Prevent pull-to-refresh on mobile
        document.body.addEventListener('touchmove', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });

        // Handle viewport resize (keyboard open/close)
        let lastHeight = window.innerHeight;
        window.addEventListener('resize', () => {
            const currentHeight = window.innerHeight;
            if (currentHeight < lastHeight) {
                // Keyboard opened
                this.scrollToBottom();
            }
            lastHeight = currentHeight;
        });
    }

    setupEventListeners() {
        // Mic button click
        this.micButton.addEventListener('click', () => {
            this.toggleConversation();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Space to toggle mic
            if (e.code === 'Space' && !e.repeat && e.target.tagName !== 'INPUT') {
                e.preventDefault();
                this.toggleConversation();
            }
            // Escape to stop
            if (e.code === 'Escape' && this.isActive) {
                this.stopConversation();
            }
        });

        // Scroll detection
        this.chatMessages.addEventListener('scroll', () => {
            const isAtBottom = this.chatMessages.scrollHeight - this.chatMessages.scrollTop <= this.chatMessages.clientHeight + 50;
            this.userScrolled = !isAtBottom;

            if (isAtBottom) {
                this.scrollBottomBtn.style.display = 'none';
            }
        });

        // Scroll to bottom button
        this.scrollBottomBtn.addEventListener('click', () => {
            this.scrollToBottom();
        });
    }

    setupServiceHandlers() {
        this.voice.onSpeechRecognized((text) => {
            this.hideInterimTranscript();
            this.handleUserSpeech(text);
        });

        this.voice.onSpeechDetected(() => {
            this.updateUI(VoiceState.RECORDING);
            this.showInterimTranscript('Listening...');
        });

        this.voice.onStateChange((state) => {
            this.updateUI(state);

            // Show/hide visualizers
            if (state === VoiceState.RECORDING) {
                this.startVisualizers();
            } else {
                this.stopVisualizers();
            }

            if (state === VoiceState.IDLE && this.isActive) {
                setTimeout(() => {
                    if (this.isActive) {
                        this.voice.startListening();
                    }
                }, 500);
            }
        });

        this.wsClient.onMessage((data) => {
            this.handleAIResponse(data);
        });

        // Setup voice level monitoring
        this.voice.audioRecorder.onVolumeChange = (volume) => {
            this.updateVoiceLevel(volume);
        };
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
        this.playSound('start');
        this.addMessage('system', '🎤 Listening... Speak now!');
    }

    stopConversation() {
        this.isActive = false;
        this.micButton.classList.remove('active');
        this.voice.stopListening();
        this.playSound('stop');
        this.hideInterimTranscript();
        this.stopVisualizers();
        this.addMessage('system', '⏹️ Stopped listening');
    }

    handleUserSpeech(text) {
        this.addMessage('user', text);

        // Show typing indicator
        this.showTypingIndicator();

        const message = {
            type: 'message',
            content: text,
            sender: 'user'
        };

        if (!this.wsClient.send(message)) {
            this.showError('Failed to send message. Please check connection.');
            this.removeTypingIndicator();
        }
    }

    handleAIResponse(data) {
        if (data.sender === 'ai') {
            const content = data.content;

            // Remove typing indicator if exists
            this.removeTypingIndicator();

            // Display with HTML (for phrase highlighting)
            this.addMessage('ai', content);

            // Strip HTML tags for speech (avoid reading markup)
            const textOnly = content.replace(/<[^>]*>/g, '').replace(/\*\*/g, '');
            this.voice.speak(textOnly);
        }
    }

    updateUI(state) {
        const statusMap = {
            [VoiceState.IDLE]: { text: UI_TEXT.STATUS.IDLE, class: 'idle' },
            [VoiceState.RECORDING]: { text: UI_TEXT.STATUS.RECORDING, class: 'recording' },
            [VoiceState.UPLOADING]: { text: UI_TEXT.STATUS.UPLOADING, class: 'uploading' },
            [VoiceState.SPEAKING]: { text: UI_TEXT.STATUS.SPEAKING, class: 'speaking' }
        };

        const status = statusMap[state] || statusMap[VoiceState.IDLE];
        this.statusText.textContent = status.text;
        this.statusDot.className = `status-dot ${status.class}`;
    }

    addMessage(type, text) {
        const bubble = document.createElement('div');
        bubble.className = `message-bubble ${type}`;

        const content = document.createElement('div');
        content.className = 'message-content';

        // Use innerHTML for AI messages (to support phrase highlighting)
        // Use textContent for user/system messages (safer)
        if (type === 'ai') {
            content.innerHTML = text;
        } else {
            content.textContent = text;
        }

        // Add timestamp for user and AI messages
        if (type === 'user' || type === 'ai') {
            const timestamp = document.createElement('span');
            timestamp.className = 'message-timestamp';
            timestamp.textContent = new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
            content.appendChild(timestamp);
        }

        bubble.appendChild(content);
        this.chatMessages.appendChild(bubble);

        // Auto scroll or show button
        if (!this.userScrolled) {
            this.scrollToBottom();
        } else {
            this.scrollBottomBtn.style.display = 'block';
        }
    }

    // === UX Feature Methods ===

    showInterimTranscript(text) {
        this.interimTranscript.style.display = 'block';
        this.interimTranscript.querySelector('.interim-text').textContent = text;
    }

    hideInterimTranscript() {
        this.interimTranscript.style.display = 'none';
    }

    showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'message-bubble ai typing-bubble';
        indicator.id = 'typingIndicator';
        indicator.innerHTML = `
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        this.chatMessages.appendChild(indicator);
        this.scrollToBottom();
    }

    removeTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }

    updateVoiceLevel(volume) {
        if (this.voiceLevelFill) {
            const percentage = Math.min(100, Math.max(0, volume * 100));
            this.voiceLevelFill.style.width = percentage + '%';
        }
    }

    startVisualizers() {
        this.voiceLevelContainer.style.display = 'flex';
        this.waveformCanvas.style.display = 'block';
        this.animateWaveform();
    }

    stopVisualizers() {
        this.voiceLevelContainer.style.display = 'none';
        this.waveformCanvas.style.display = 'none';
        this.voiceLevelFill.style.width = '0%';
    }

    animateWaveform() {
        if (!this.isActive) return;

        const ctx = this.waveformCtx;
        const canvas = this.waveformCanvas;
        const width = canvas.width = 300;
        const height = canvas.height = 60;

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = 'rgba(79, 172, 254, 0.3)';
        ctx.strokeStyle = '#4facfe';
        ctx.lineWidth = 2;

        // Generate waveform
        ctx.beginPath();
        for (let i = 0; i < width; i++) {
            const y = height / 2 + Math.sin(i * 0.1 + Date.now() * 0.01) * 20 * Math.random();
            if (i === 0) ctx.moveTo(i, y);
            else ctx.lineTo(i, y);
        }
        ctx.stroke();

        requestAnimationFrame(() => this.animateWaveform());
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        this.scrollBottomBtn.style.display = 'none';
        this.userScrolled = false;
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            ⚠️ ${message}
            <button class="retry-button" onclick="location.reload()">Retry</button>
        `;
        this.chatMessages.appendChild(errorDiv);
        this.playSound('error');
        this.scrollToBottom();
    }

    createBeep(frequency, duration, volume) {
        return () => {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            gainNode.gain.value = volume;

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        };
    }

    playSound(type) {
        if (this.sounds[type]) {
            this.sounds[type]();
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.voiceController = new PremiumVoiceController();
});
