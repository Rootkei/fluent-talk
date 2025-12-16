// 2D Avatar Animation System - Grok AI Style
// Replaces Three.js 3D avatar with 2D animated character

export class Avatar2D {
    constructor(container) {
        this.container = container;
        this.currentState = 'idle';
        this.isAnimating = false;

        // Avatar states
        this.states = {
            idle: 'assets/images/avatar-idle.png',
            listening: 'assets/images/avatar-listening.png',
            talking: 'assets/images/avatar-talking.png'
        };

        this.init();
    }

    init() {
        // Create avatar container
        this.avatarElement = document.createElement('div');
        this.avatarElement.className = 'avatar-2d-container';

        // Create image element
        this.avatarImage = document.createElement('img');
        this.avatarImage.className = 'avatar-2d-image';
        this.avatarImage.src = this.states.idle;
        this.avatarImage.alt = 'AI Assistant Avatar';

        this.avatarElement.appendChild(this.avatarImage);
        this.container.appendChild(this.avatarElement);

        // Preload all images
        this.preloadImages();

        // Add floating animation
        this.startFloatingAnimation();
    }

    preloadImages() {
        Object.values(this.states).forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }

    setState(state) {
        if (this.states[state] && this.currentState !== state) {
            this.currentState = state;

            // Fade transition
            this.avatarImage.style.opacity = '0';

            setTimeout(() => {
                this.avatarImage.src = this.states[state];
                this.avatarImage.style.opacity = '1';
            }, 200);
        }
    }

    startTalking() {
        this.isAnimating = true;
        this.animateTalking();
    }

    stopTalking() {
        this.isAnimating = false;
        this.setState('idle');
    }

    startListening() {
        this.setState('listening');
    }

    animateTalking() {
        if (!this.isAnimating) return;

        // Alternate between talking and idle for lip-sync effect
        const interval = 200 + Math.random() * 200; // Random interval for natural feel

        this.setState('talking');

        setTimeout(() => {
            if (this.isAnimating) {
                this.setState('idle');
                setTimeout(() => {
                    this.animateTalking();
                }, interval / 2);
            }
        }, interval);
    }

    startFloatingAnimation() {
        // Subtle floating animation
        this.avatarElement.style.animation = 'avatarFloat 3s ease-in-out infinite';
    }

    destroy() {
        if (this.container && this.avatarElement) {
            this.container.removeChild(this.avatarElement);
        }
    }
}
