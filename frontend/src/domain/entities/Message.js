// Message entity
export class Message {
    constructor(type, content, sender, timestamp = new Date()) {
        this.type = type;
        this.content = content;
        this.sender = sender;
        this.timestamp = timestamp;
    }

    static fromJSON(json) {
        return new Message(
            json.type,
            json.content,
            json.sender,
            json.timestamp ? new Date(json.timestamp) : new Date()
        );
    }

    toJSON() {
        return {
            type: this.type,
            content: this.content,
            sender: this.sender,
            timestamp: this.timestamp.toISOString()
        };
    }

    validate() {
        if (!this.content || this.content.trim() === '') {
            throw new Error('Message content cannot be empty');
        }
        if (!this.sender) {
            throw new Error('Message sender cannot be empty');
        }
        return true;
    }
}

export const MessageType = {
    TEXT: 'message',
    ERROR: 'error'
};

export const MessageSender = {
    USER: 'user',
    AI: 'ai',
    SYSTEM: 'system'
};
