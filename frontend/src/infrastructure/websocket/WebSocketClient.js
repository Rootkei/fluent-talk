import { IWebSocketRepository, ConnectionStatus } from '../../domain/repositories/IWebSocketRepository.js';
import { CONFIG } from '../../shared/constants/constants.js';

export class WebSocketClient extends IWebSocketRepository {
    constructor() {
        super();
        this.ws = null;
        this.status = ConnectionStatus.DISCONNECTED;
        this.messageCallbacks = [];
        this.statusCallbacks = [];
        this.reconnectInterval = null;
    }

    connect() {
        this.#closeExisting();
        this.#updateStatus(ConnectionStatus.CONNECTING);

        try {
            this.ws = new WebSocket(CONFIG.WS_URL);

            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.#updateStatus(ConnectionStatus.CONNECTED);
                this.#clearReconnect();
            };

            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.messageCallbacks.forEach(cb => cb(data));
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.#updateStatus(ConnectionStatus.ERROR);
            };

            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                this.#updateStatus(ConnectionStatus.DISCONNECTED);
                this.#scheduleReconnect();
            };
        } catch (error) {
            console.error('Failed to connect:', error);
            this.#updateStatus(ConnectionStatus.ERROR);
        }
    }

    disconnect() {
        this.#clearReconnect();
        this.#closeExisting();
    }

    send(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
            return true;
        }
        return false;
    }

    onMessage(callback) {
        this.messageCallbacks.push(callback);
    }

    onStatusChange(callback) {
        this.statusCallbacks.push(callback);
    }

    getStatus() {
        return this.status;
    }

    #closeExisting() {
        if (this.ws) {
            this.ws.onclose = null;
            this.ws.onerror = null;
            this.ws.onmessage = null;
            this.ws.onopen = null;
            if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
                this.ws.close();
            }
            this.ws = null;
        }
    }

    #clearReconnect() {
        if (this.reconnectInterval) {
            clearInterval(this.reconnectInterval);
            this.reconnectInterval = null;
        }
    }

    #scheduleReconnect() {
        if (!this.reconnectInterval) {
            this.reconnectInterval = setInterval(() => {
                console.log('Attempting to reconnect...');
                this.connect();
            }, CONFIG.RECONNECT_INTERVAL);
        }
    }

    #updateStatus(newStatus) {
        this.status = newStatus;
        this.statusCallbacks.forEach(cb => cb(newStatus));
    }
}
