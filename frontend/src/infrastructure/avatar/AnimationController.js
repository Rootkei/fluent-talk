import * as THREE from 'three';

export class AnimationController {
    constructor(avatar, mixer) {
        this.avatar = avatar;
        this.mixer = mixer;
        this.animations = new Map();
        this.currentAction = null;
        this.clock = new THREE.Clock();

        // Simple animation state
        this.isIdle = true;
        this.isTalking = false;
        this.blinkTimer = 0;
        this.breatheTimer = 0;
    }

    addAnimation(name, clip) {
        if (this.mixer) {
            const action = this.mixer.clipAction(clip);
            this.animations.set(name, action);
        }
    }

    playAnimation(name, loop = true) {
        if (!this.mixer) return;

        const action = this.animations.get(name);
        if (!action) {
            console.warn(`Animation ${name} not found`);
            return;
        }

        // Stop current animation
        if (this.currentAction && this.currentAction !== action) {
            this.currentAction.fadeOut(0.5);
        }

        // Play new animation
        action.reset();
        action.fadeIn(0.5);
        action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce);
        action.play();

        this.currentAction = action;
    }

    stopAnimation(name) {
        if (!this.mixer) return;

        const action = this.animations.get(name);
        if (action) {
            action.fadeOut(0.5);
        }
    }

    // Simple procedural animations for fallback avatar
    startIdle() {
        this.isIdle = true;
        this.isTalking = false;
    }

    startTalking() {
        this.isIdle = false;
        this.isTalking = true;
    }

    stopTalking() {
        this.isTalking = false;
        this.isIdle = true;
    }

    update() {
        const delta = this.clock.getDelta();

        // Update animation mixer if exists
        if (this.mixer) {
            this.mixer.update(delta);
        }

        // Simple procedural animations for fallback avatar
        if (!this.mixer && this.avatar) {
            this.updateProceduralAnimations(delta);
        }
    }

    updateProceduralAnimations(delta) {
        // Breathing animation
        this.breatheTimer += delta;
        const breatheScale = 1 + Math.sin(this.breatheTimer * 2) * 0.02;

        // Find body mesh
        const body = this.avatar.children.find(child =>
            child.geometry && child.geometry.type === 'CylinderGeometry'
        );
        if (body) {
            body.scale.y = breatheScale;
        }

        // Blinking animation
        this.blinkTimer += delta;
        if (this.blinkTimer > 3) {
            this.blink();
            this.blinkTimer = 0;
        }

        // Talking animation (simple jaw movement)
        if (this.isTalking) {
            const head = this.avatar.children[0];
            if (head) {
                const talkAmount = Math.sin(Date.now() * 0.02) * 0.05;
                head.scale.y = 1 + talkAmount;
            }
        }
    }

    blink() {
        // Simple blink by scaling eyes
        const eyes = this.avatar.children.filter(child =>
            child.geometry && child.geometry.type === 'SphereGeometry' && child.position.y > 1.5
        );

        eyes.forEach(eye => {
            const originalScale = eye.scale.y;
            eye.scale.y = 0.1;
            setTimeout(() => {
                eye.scale.y = originalScale;
            }, 100);
        });
    }

    setExpression(expression) {
        // Placeholder for future expression system
        console.log(`Setting expression: ${expression}`);
    }

    dispose() {
        if (this.mixer) {
            this.mixer.stopAllAction();
        }
    }
}
