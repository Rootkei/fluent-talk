// Voice Message Entity
export class VoiceMessage {
    constructor(text, sender, timestamp = new Date(), audioData = null) {
        this.text = text;
        this.sender = sender; // 'user' or 'ai'
        this.timestamp = timestamp;
        this.audioData = audioData; // Optional: audio blob/buffer
    }

    static fromText(text, sender) {
        return new VoiceMessage(text, sender);
    }

    validate() {
        if (!this.text || this.text.trim() === '') {
            throw new Error('Voice message text cannot be empty');
        }
        if (!this.sender) {
            throw new Error('Voice message sender cannot be empty');
        }
        return true;
    }

    toJSON() {
        return {
            text: this.text,
            sender: this.sender,
            timestamp: this.timestamp.toISOString()
        };
    }
}

export const VoiceSender = {
    USER: 'user',
    AI: 'ai'
};
