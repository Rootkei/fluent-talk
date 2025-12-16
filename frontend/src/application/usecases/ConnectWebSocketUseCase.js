export class ConnectWebSocketUseCase {
    constructor(wsRepository) {
        this.wsRepository = wsRepository;
    }

    execute() {
        this.wsRepository.connect();
    }

    disconnect() {
        this.wsRepository.disconnect();
    }
}
