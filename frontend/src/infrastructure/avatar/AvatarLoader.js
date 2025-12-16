import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class AvatarLoader {
    constructor(scene) {
        this.scene = scene;
        this.loader = new GLTFLoader();
        this.avatar = null;
        this.mixer = null;
    }

    async loadAvatar(modelPath) {
        return new Promise((resolve, reject) => {
            this.loader.load(
                modelPath,
                (gltf) => {
                    this.avatar = gltf.scene;

                    // Setup avatar
                    this.avatar.position.set(0, 0, 0);
                    this.avatar.scale.set(1, 1, 1);

                    // Enable shadows
                    this.avatar.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });

                    // Setup animation mixer if animations exist
                    if (gltf.animations && gltf.animations.length > 0) {
                        this.mixer = new THREE.AnimationMixer(this.avatar);
                    }

                    this.scene.add(this.avatar);
                    resolve({
                        model: this.avatar,
                        mixer: this.mixer,
                        animations: gltf.animations
                    });
                },
                (progress) => {
                    const percent = (progress.loaded / progress.total) * 100;
                    console.log(`Loading avatar: ${percent.toFixed(2)}%`);
                },
                (error) => {
                    console.error('Error loading avatar:', error);
                    reject(error);
                }
            );
        });
    }

    createSimpleAvatar() {
        // Create a simple avatar if no model is available
        const group = new THREE.Group();

        // Head
        const headGeometry = new THREE.SphereGeometry(0.3, 32, 32);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0xffdbac,
            roughness: 0.5,
            metalness: 0.1
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.6;
        head.castShadow = true;
        group.add(head);

        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.05, 16, 16);
        const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });

        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.1, 1.65, 0.25);
        group.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.1, 1.65, 0.25);
        group.add(rightEye);

        // Body
        const bodyGeometry = new THREE.CylinderGeometry(0.25, 0.3, 0.8, 32);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a90e2,
            roughness: 0.7,
            metalness: 0.2
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.8;
        body.castShadow = true;
        group.add(body);

        this.avatar = group;
        this.scene.add(group);

        return {
            model: group,
            mixer: null,
            animations: []
        };
    }

    getAvatar() {
        return this.avatar;
    }

    getMixer() {
        return this.mixer;
    }
}
