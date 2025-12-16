import { Message, MessageType, MessageSender } from '../../domain/entities/Message.js';

export class SendMessageUseCase {
    constructor(wsRepository) {
        this.wsRepository = wsRepository;
    }

    execute(content) {
        const message = new Message(MessageType.TEXT, content, MessageSender.USER);
        message.validate();

        const success = this.wsRepository.send(message.toJSON());
        return { success, message };
    }
}
