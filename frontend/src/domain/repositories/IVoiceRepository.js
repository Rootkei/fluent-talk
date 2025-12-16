// Voice Repository Interface
export class IVoiceRepository {
    // Speech Recognition (Input)
    startListening() {
        throw new Error('Method not implemented');
    }

    stopListening() {
        throw new Error('Method not implemented');
    }

    onSpeechRecognized(callback) {
        throw new Error('Method not implemented');
    }

    // Speech Synthesis (Output)
    speak(text, options = {}) {
        throw new Error('Method not implemented');
    }

    stopSpeaking() {
        throw new Error('Method not implemented');
    }

    onSpeakingStart(callback) {
        throw new Error('Method not implemented');
    }

    onSpeakingEnd(callback) {
        throw new Error('Method not implemented');
    }

    // Status
    isListening() {
        throw new Error('Method not implemented');
    }

    isSpeaking() {
        throw new Error('Method not implemented');
    }
}

export const VoiceState = {
    IDLE: 'idle',
    LISTENING: 'listening',
    SPEAKING: 'speaking',
    PROCESSING: 'processing'
};
