import { SendMessageUseCase } from '../usecases/SendMessageUseCase.js';
import { ConnectWebSocketUseCase } from '../usecases/ConnectWebSocketUseCase.js';
import { Message } from '../../domain/entities/Message.js';

export class ChatService {
    constructor(wsRepository) {
        this.wsRepository = wsRepository;
        this.sendMessageUseCase = new SendMessageUseCase(wsRepository);
        this.connectUseCase = new ConnectWebSocketUseCase(wsRepository);
        this.messageHandlers = [];
    }

    connect() {
        this.connectUseCase.execute();
        this.wsRepository.onMessage((data) => {
            const message = Message.fromJSON(data);
            this.messageHandlers.forEach(handler => handler(message));
        });
    }

    disconnect() {
        this.connectUseCase.disconnect();
    }

    sendMessage(content) {
        return this.sendMessageUseCase.execute(content);
    }

    onMessage(handler) {
        this.messageHandlers.push(handler);
    }

    onStatusChange(handler) {
        this.wsRepository.onStatusChange(handler);
    }

    getStatus() {
        return this.wsRepository.getStatus();
    }
}
