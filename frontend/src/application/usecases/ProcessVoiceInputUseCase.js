import { VoiceMessage, VoiceSender } from '../../domain/entities/VoiceMessage.js';

export class ProcessVoiceInputUseCase {
    constructor(chatService) {
        this.chatService = chatService;
    }

    async execute(recognizedText) {
        // Create voice message from recognized text
        const voiceMessage = VoiceMessage.fromText(recognizedText, VoiceSender.USER);
        voiceMessage.validate();

        // Send to chat service (which sends to backend via WebSocket)
        const result = this.chatService.sendMessage(recognizedText);

        return {
            success: result.success,
            message: voiceMessage
        };
    }
}
