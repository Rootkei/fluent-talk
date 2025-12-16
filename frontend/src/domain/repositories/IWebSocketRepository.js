// WebSocket Repository Interface
export class IWebSocketRepository {
    connect() {
        throw new Error('Method not implemented');
    }

    disconnect() {
        throw new Error('Method not implemented');
    }

    send(message) {
        throw new Error('Method not implemented');
    }

    onMessage(callback) {
        throw new Error('Method not implemented');
    }

    onStatusChange(callback) {
        throw new Error('Method not implemented');
    }

    getStatus() {
        throw new Error('Method not implemented');
    }
}

export const ConnectionStatus = {
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    ERROR: 'error'
};
