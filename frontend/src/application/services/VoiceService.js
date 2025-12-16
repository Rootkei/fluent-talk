import { ProcessVoiceInputUseCase } from '../usecases/ProcessVoiceInputUseCase.js';
import { StartVoiceConversationUseCase } from '../usecases/StartVoiceConversationUseCase.js';
import { VoiceState } from '../../domain/repositories/IVoiceRepository.js';

export class VoiceService {
    constructor(voiceRepository, chatService) {
        this.voiceRepository = voiceRepository;
        this.chatService = chatService;

        // Use cases
        this.processVoiceInputUseCase = new ProcessVoiceInputUseCase(chatService);
        this.startConversationUseCase = new StartVoiceConversationUseCase(voiceRepository);

        // Callbacks
        this.stateChangeCallbacks = [];

        this.setupVoiceHandlers();
    }

    setupVoiceHandlers() {
        // Handle recognized speech
        this.voiceRepository.onSpeechRecognized((text) => {
            console.log('Voice input:', text);
            this.processVoiceInputUseCase.execute(text);
        });

        // Handle speaking events
        this.voiceRepository.onSpeakingStart(() => {
            this.notifyStateChange(VoiceState.SPEAKING);
        });

        this.voiceRepository.onSpeakingEnd(() => {
            this.notifyStateChange(VoiceState.IDLE);
        });

        // Handle errors
        this.voiceRepository.onError((error) => {
            console.error('Voice error:', error);
        });
    }

    startConversation() {
        return this.startConversationUseCase.execute();
    }

    stopConversation() {
        return this.startConversationUseCase.stop();
    }

    speak(text, options = {}) {
        this.voiceRepository.speak(text, options);
    }

    stopSpeaking() {
        this.voiceRepository.stopSpeaking();
    }

    getState() {
        return this.voiceRepository.getState();
    }

    isListening() {
        return this.voiceRepository.isListening();
    }

    isSpeaking() {
        return this.voiceRepository.isSpeaking();
    }

    onStateChange(callback) {
        this.stateChangeCallbacks.push(callback);
    }

    notifyStateChange(state) {
        this.stateChangeCallbacks.forEach(cb => cb(state));
    }
}
