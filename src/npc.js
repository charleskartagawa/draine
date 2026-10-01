import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class NPC {
  constructor({
    scene,
    name = 'NPC',
    modelUrl,
    position = new THREE.Vector3(0, 0, 0),
    rotationY = 0,
    scale = 0.7,
    interactionRadius = 3.5,
    dialogue = '...'
  }) {
    this.scene = scene;
    this.name = name;
    this.modelUrl = modelUrl;
    this.interactionRadius = interactionRadius;
    this.dialogue = dialogue;

    this.group = new THREE.Group();
    this.group.position.copy(position);
    this.group.rotation.y = rotationY;
    this.defaultRotation = rotationY;

    // Contact shadow at ground level
    const shadowGeo = new THREE.CircleGeometry(0.45, 24);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.22,
      depthWrite: false
    });
    this.shadowContact = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowContact.rotation.x = -Math.PI / 2;
    this.shadowContact.position.y = 0.02;
    this.group.add(this.shadowContact);

    this.scene.add(this.group);

    this.mixer = null;
    this.isLoaded = false;

    this.loadModel(scale);
  }

  get position() {
    return this.group.position;
  }

  loadModel(scale) {
    const loader = new GLTFLoader();

    loader.load(
      this.modelUrl,
      (gltf) => {
        this.model = gltf.scene;
        this.model.scale.set(scale, scale, scale);
        this.model.position.set(0, 0, 0);

        this.model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        this.group.add(this.model);

        // Idle animation support
        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(this.model);

          const idleClip =
            gltf.animations.find((c) => /^idle$/i.test(c.name)) ||
            gltf.animations.find((c) => /idle/i.test(c.name)) ||
            gltf.animations[0];

          if (idleClip) {
            const idleAction = this.mixer.clipAction(idleClip);
            idleAction.play();
          }
        }

        this.isLoaded = true;
      },
      undefined,
      (err) => {
        console.error(`Failed to load NPC (${this.name}) model from ${this.modelUrl}:`, err);
      }
    );
  }

  isPlayerInRange(playerPosition) {
    if (!playerPosition) return false;
    const dx = this.group.position.x - playerPosition.x;
    const dz = this.group.position.z - playerPosition.z;
    const distSq = dx * dx + dz * dz;
    return distSq <= this.interactionRadius * this.interactionRadius;
  }

  update(delta, playerPosition) {
    if (this.mixer) {
      this.mixer.update(delta);
    }

    // When player is nearby, gently turn to face player
    if (playerPosition && this.isPlayerInRange(playerPosition)) {
      const dx = playerPosition.x - this.group.position.x;
      const dz = playerPosition.z - this.group.position.z;
      const targetAngle = Math.atan2(dx, dz);

      let diff = targetAngle - this.group.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;

      this.group.rotation.y += diff * Math.min(1, 4 * delta);
    } else {
      // Gently return to original facing angle
      let diff = this.defaultRotation - this.group.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;

      this.group.rotation.y += diff * Math.min(1, 2 * delta);
    }
  }
}
