// Integrated Voice Chat with 3D Avatar
// Uses Three.js for 3D rendering and Web Speech API for voice

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

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
        LOADING: 'Đang tải avatar...'
    }
};

const VoiceState = {
    IDLE: 'idle',
    LISTENING: 'listening',
    SPEAKING: 'speaking',
    PROCESSING: 'processing'
};

// ========== Three.js Avatar System ==========

class AvatarSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.avatar = null;
        this.controls = null;
        this.clock = new THREE.Clock();
        this.breatheTimer = 0;
        this.blinkTimer = 0;
        this.isTalking = false;

        this.init();
    }

    init() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            50,
            this.canvas.clientWidth / this.canvas.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 1.6, 3);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        });
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;

        // Lights
        this.setupLights();

        // Controls
        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 5;
        this.controls.maxPolarAngle = Math.PI / 2;

        // Create simple avatar
        this.createSimpleAvatar();

        // Handle resize
        window.addEventListener('resize', () => this.onResize());

        // Start animation loop
        this.animate();
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7.5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        const fillLight = new THREE.DirectionalLight(0x4a90e2, 0.3);
        fillLight.position.set(-5, 5, -5);
        this.scene.add(fillLight);

        const rimLight = new THREE.DirectionalLight(0xff6b9d, 0.2);
        rimLight.position.set(0, 5, -10);
        this.scene.add(rimLight);
    }

    createSimpleAvatar() {
        const group = new THREE.Group();

        // Head
        const headGeometry = new THREE.SphereGeometry(0.3, 32, 32);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0xffdbac,
            roughness: 0.5,
            metalness: 0.1
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.6;
        head.castShadow = true;
        head.name = 'head';
        group.add(head);

        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.05, 16, 16);
        const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });

        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.1, 1.65, 0.25);
        leftEye.name = 'leftEye';
        group.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.1, 1.65, 0.25);
        rightEye.name = 'rightEye';
        group.add(rightEye);

        // Mouth (for talking animation)
        const mouthGeometry = new THREE.SphereGeometry(0.08, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const mouthMaterial = new THREE.MeshStandardMaterial({ color: 0xff6b9d });
        const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
        mouth.position.set(0, 1.5, 0.28);
        mouth.rotation.x = Math.PI;
        mouth.name = 'mouth';
        group.add(mouth);

        // Body
        const bodyGeometry = new THREE.CylinderGeometry(0.25, 0.3, 0.8, 32);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a90e2,
            roughness: 0.7,
            metalness: 0.2
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.8;
        body.castShadow = true;
        body.name = 'body';
        group.add(body);

        this.avatar = group;
        this.scene.add(group);
    }

    startTalking() {
        this.isTalking = true;
    }

    stopTalking() {
        this.isTalking = false;
        // Reset mouth
        const mouth = this.avatar.getObjectByName('mouth');
        if (mouth) {
            mouth.scale.y = 1;
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = this.clock.getDelta();
        this.updateAnimations(delta);

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    updateAnimations(delta) {
        if (!this.avatar) return;

        // Breathing
        this.breatheTimer += delta;
        const breatheScale = 1 + Math.sin(this.breatheTimer * 2) * 0.02;
        const body = this.avatar.getObjectByName('body');
        if (body) {
            body.scale.y = breatheScale;
        }

        // Blinking
        this.blinkTimer += delta;
        if (this.blinkTimer > 3) {
            this.blink();
            this.blinkTimer = 0;
        }

        // Talking animation
        if (this.isTalking) {
            const mouth = this.avatar.getObjectByName('mouth');
            if (mouth) {
                const talkAmount = Math.abs(Math.sin(Date.now() * 0.015));
                mouth.scale.y = 0.5 + talkAmount * 0.5;
            }

            const head = this.avatar.getObjectByName('head');
            if (head) {
                const headBob = Math.sin(Date.now() * 0.01) * 0.02;
                head.position.y = 1.6 + headBob;
            }
        }
    }

    blink() {
        const leftEye = this.avatar.getObjectByName('leftEye');
        const rightEye = this.avatar.getObjectByName('rightEye');

        if (leftEye && rightEye) {
            leftEye.scale.y = 0.1;
            rightEye.scale.y = 0.1;
            setTimeout(() => {
                leftEye.scale.y = 1;
                rightEye.scale.y = 1;
            }, 100);
        }
    }

    onResize() {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
}

// ========== Voice System (same as before) ==========

class WebSocketClient {
    constructor() {
        this.ws = null;
        this.messageCallbacks = [];
        this.statusCallbacks = [];
        this.reconnectInterval = null;
    }

    connect() {
        if (this.ws) this.ws.close();

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
                this.connect();
            }, CONFIG.RECONNECT_INTERVAL);
        }
    }
}

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
        if (!SpeechRecognition) return;

        this.recognition = new SpeechRecognition();
        this.recognition.lang = CONFIG.VOICE_LANG;
        this.recognition.continuous = true;
        this.recognition.interimResults = false;

        this.recognition.onstart = () => {
            this.updateState(VoiceState.LISTENING);
        };

        this.recognition.onresult = (event) => {
            const last = event.results.length - 1;
            const transcript = event.results[last][0].transcript;
            this.speechRecognizedCallbacks.forEach(cb => cb(transcript));
        };

        this.recognition.onerror = (event) => {
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

// ========== Main Controller ==========

class VoiceAvatarController {
    constructor() {
        // Initialize systems
        this.avatarSystem = new AvatarSystem(document.getElementById('avatarCanvas'));
        this.wsClient = new WebSocketClient();
        this.voice = new WebSpeechVoice();

        this.isActive = false;

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

        // Enable mic button after avatar loads
        setTimeout(() => {
            this.micButton.disabled = false;
            this.updateUI(VoiceState.IDLE);
            this.addToLog('system', 'Avatar sẵn sàng! Nhấn mic để bắt đầu.');
        }, 1000);
    }

    setupEventListeners() {
        this.micButton.addEventListener('click', () => this.toggleConversation());
    }

    setupServiceHandlers() {
        this.voice.onSpeechRecognized((text) => {
            this.handleUserSpeech(text);
        });

        this.voice.onStateChange((state) => {
            this.updateUI(state);

            // Sync avatar with voice state
            if (state === VoiceState.SPEAKING) {
                this.avatarSystem.startTalking();
            } else {
                this.avatarSystem.stopTalking();
            }
        });

        this.wsClient.onMessage((data) => {
            this.handleAIResponse(data);
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
        this.addToLog('system', 'Bắt đầu cuộc trò chuyện...');
    }

    stopConversation() {
        this.isActive = false;
        this.micButton.classList.remove('active');
        this.voice.stopListening();
        this.avatarSystem.stopTalking();
        this.addToLog('system', 'Kết thúc cuộc trò chuyện.');
    }

    handleUserSpeech(text) {
        this.transcript.textContent = text;
        this.addToLog('user', text);

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
            this.addToLog('ai', data.content);
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
    new VoiceAvatarController();
});
