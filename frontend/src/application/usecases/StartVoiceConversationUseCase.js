export class StartVoiceConversationUseCase {
    constructor(voiceRepository) {
        this.voiceRepository = voiceRepository;
    }

    execute() {
        // Start listening for voice input
        this.voiceRepository.startListening();
        return { success: true };
    }

    stop() {
        // Stop listening
        this.voiceRepository.stopListening();
        this.voiceRepository.stopSpeaking();
        return { success: true };
    }
}
