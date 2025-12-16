export class AudioRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.stream = null;
        this.isRecording = false;

        // Callbacks
        this.onDataAvailableCallbacks = [];
        this.onStopCallbacks = [];
        this.onErrorCallbacks = [];
    }

    async startRecording() {
        try {
            // Request microphone access
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });

            // Create MediaRecorder
            const options = { mimeType: 'audio/webm;codecs=opus' };
            this.mediaRecorder = new MediaRecorder(this.stream, options);

            this.audioChunks = [];

            // Handle data available
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                    this.onDataAvailableCallbacks.forEach(cb => cb(event.data));
                }
            };

            // Handle stop
            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                this.onStopCallbacks.forEach(cb => cb(audioBlob));
                this.cleanup();
            };

            // Handle error
            this.mediaRecorder.onerror = (error) => {
                console.error('MediaRecorder error:', error);
                this.onErrorCallbacks.forEach(cb => cb(error));
            };

            // Start recording
            this.mediaRecorder.start(1000); // Collect data every 1 second
            this.isRecording = true;

            console.log('🎤 Recording started');
            return true;
        } catch (error) {
            console.error('Failed to start recording:', error);
            this.onErrorCallbacks.forEach(cb => cb(error));
            return false;
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            console.log('⏹️ Recording stopped');
        }
    }

    cleanup() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }

    onDataAvailable(callback) {
        this.onDataAvailableCallbacks.push(callback);
    }

    onStop(callback) {
        this.onStopCallbacks.push(callback);
    }

    onError(callback) {
        this.onErrorCallbacks.push(callback);
    }

    getIsRecording() {
        return this.isRecording;
    }
}
