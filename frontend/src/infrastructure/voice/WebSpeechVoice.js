import { IVoiceRepository, VoiceState } from '../../domain/repositories/IVoiceRepository.js';

export class WebSpeechVoice extends IVoiceRepository {
    constructor() {
        super();
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.currentUtterance = null;
        this.state = VoiceState.IDLE;

        // Callbacks
        this.speechRecognizedCallbacks = [];
        this.speakingStartCallbacks = [];
        this.speakingEndCallbacks = [];
        this.errorCallbacks = [];

        this.initRecognition();
    }

    initRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.error('Speech Recognition not supported');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'vi-VN'; // Vietnamese
        this.recognition.continuous = true; // Keep listening
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 1;

        this.recognition.onstart = () => {
            console.log('Voice recognition started');
            this.state = VoiceState.LISTENING;
        };

        this.recognition.onresult = (event) => {
            const last = event.results.length - 1;
            const transcript = event.results[last][0].transcript;

            console.log('Recognized:', transcript);
            this.speechRecognizedCallbacks.forEach(cb => cb(transcript));
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.errorCallbacks.forEach(cb => cb(event.error));

            if (event.error === 'no-speech') {
                // Restart listening
                this.startListening();
            }
        };

        this.recognition.onend = () => {
            console.log('Voice recognition ended');
            if (this.state === VoiceState.LISTENING) {
                // Auto-restart if still in listening mode
                this.recognition.start();
            } else {
                this.state = VoiceState.IDLE;
            }
        };
    }

    startListening() {
        if (!this.recognition) {
            console.error('Speech recognition not available');
            return;
        }

        try {
            this.state = VoiceState.LISTENING;
            this.recognition.start();
        } catch (error) {
            if (error.name === 'InvalidStateError') {
                // Already running, ignore
                console.log('Recognition already running');
            } else {
                console.error('Failed to start recognition:', error);
            }
        }
    }

    stopListening() {
        if (this.recognition && this.state === VoiceState.LISTENING) {
            this.state = VoiceState.IDLE;
            this.recognition.stop();
        }
    }

    onSpeechRecognized(callback) {
        this.speechRecognizedCallbacks.push(callback);
    }

    speak(text, options = {}) {
        if (!this.synthesis) {
            console.error('Speech synthesis not available');
            return;
        }

        // Stop any ongoing speech
        this.stopSpeaking();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = options.lang || 'vi-VN';
        utterance.rate = options.rate || 1.0;
        utterance.pitch = options.pitch || 1.0;
        utterance.volume = options.volume || 1.0;

        // Try to find Vietnamese voice
        const voices = this.synthesis.getVoices();
        const vietnameseVoice = voices.find(voice => voice.lang.startsWith('vi'));
        if (vietnameseVoice) {
            utterance.voice = vietnameseVoice;
        }

        utterance.onstart = () => {
            console.log('Speaking started');
            this.state = VoiceState.SPEAKING;
            this.speakingStartCallbacks.forEach(cb => cb());
        };

        utterance.onend = () => {
            console.log('Speaking ended');
            this.state = VoiceState.IDLE;
            this.currentUtterance = null;
            this.speakingEndCallbacks.forEach(cb => cb());
        };

        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event.error);
            this.errorCallbacks.forEach(cb => cb(event.error));
        };

        this.currentUtterance = utterance;
        this.synthesis.speak(utterance);
    }

    stopSpeaking() {
        if (this.synthesis && this.synthesis.speaking) {
            this.synthesis.cancel();
            this.state = VoiceState.IDLE;
            this.currentUtterance = null;
        }
    }

    onSpeakingStart(callback) {
        this.speakingStartCallbacks.push(callback);
    }

    onSpeakingEnd(callback) {
        this.speakingEndCallbacks.push(callback);
    }

    onError(callback) {
        this.errorCallbacks.push(callback);
    }

    isListening() {
        return this.state === VoiceState.LISTENING;
    }

    isSpeaking() {
        return this.state === VoiceState.SPEAKING;
    }

    getState() {
        return this.state;
    }
}
