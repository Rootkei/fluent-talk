import { AudioRecorder } from '../audio/AudioRecorder.js';

export const VoiceState = {
    IDLE: 'idle',
    RECORDING: 'recording',
    UPLOADING: 'uploading',
    SPEAKING: 'speaking'
};

export class GroqWhisperVoice {
    constructor(backendURL = 'http://localhost:8080') {
        this.backendURL = backendURL;
        this.audioRecorder = new AudioRecorder();
        this.synthesis = window.speechSynthesis;
        this.state = VoiceState.IDLE;

        // Callbacks
        this.speechRecognizedCallbacks = [];
        this.stateChangeCallbacks = [];
        this.errorCallbacks = [];

        this.setupRecorderHandlers();
    }

    setupRecorderHandlers() {
        this.audioRecorder.onStop(async (audioBlob) => {
            await this.uploadAndTranscribe(audioBlob);
        });

        this.audioRecorder.onError((error) => {
            console.error('Recorder error:', error);
            this.errorCallbacks.forEach(cb => cb(error));
            this.updateState(VoiceState.IDLE);
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
            console.log('📤 Uploading audio...', audioBlob.size, 'bytes');

            // Create form data
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');

            // Upload to backend
            const response = await fetch(`${this.backendURL}/api/transcribe`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.text) {
                console.log('✅ Transcription:', data.text);
                this.speechRecognizedCallbacks.forEach(cb => cb(data.text));
                this.updateState(VoiceState.IDLE);
            } else {
                throw new Error(data.error || 'Transcription failed');
            }
        } catch (error) {
            console.error('Upload/transcription error:', error);
            this.errorCallbacks.forEach(cb => cb(error));
            this.updateState(VoiceState.IDLE);
        }
    }

    speak(text) {
        if (!this.synthesis) return;

        this.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'vi-VN';
        utterance.rate = 1.0;

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

    onError(callback) {
        this.errorCallbacks.push(callback);
    }

    updateState(newState) {
        this.state = newState;
        console.log('Voice state:', newState);
        this.stateChangeCallbacks.forEach(cb => cb(newState));
    }

    getState() {
        return this.state;
    }
}
