import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Player {
  constructor(scene) {
    this.scene = scene;
    this.name = 'Charles';
    this.speed = 6.0;
    this.velocity = new THREE.Vector3();
    this.targetRotation = Math.PI; // Initial orientation: facing forward (-Z)

    this.group = new THREE.Group();
    this.group.rotation.y = this.targetRotation;
    this.group.position.set(0, 0, 0);


    // Subtle soft shadow circle at feet
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

    // Animation state
    this.mixer = null;
    this.actions = {};
    this.currentAction = null;
    this.currentActionName = '';
    this.idleActionName = null;
    this.walkActionName = null;
    this.isLoaded = false;

    // Load Ranger GLTF model
    this.loadModel();
  }

  get position() {
    return this.group.position;
  }

  loadModel() {
    const loader = new GLTFLoader();
    const modelUrl = '/models/ranger/Ranger.gltf';

    loader.load(
      modelUrl,
      (gltf) => {
        this.model = gltf.scene;

        // Scale appropriately (~2.0 Three.js units tall)
        this.model.scale.set(0.7, 0.7, 0.7);
        this.model.position.set(0, 0, 0);

        // Configure shadows for all meshes in the model
        this.model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        this.group.add(this.model);

        // Inspect and setup animation clips
        this.setupAnimations(gltf.animations);
        this.isLoaded = true;
      },
      undefined,
      (error) => {
        console.error('Error loading Ranger model:', error);
      }
    );
  }

  setupAnimations(clips) {
    if (!clips || clips.length === 0) {
      console.warn('No animation clips found in Ranger model.');
      return;
    }

    console.log(
      'Available Ranger animations:',
      clips.map((c) => c.name)
    );

    this.mixer = new THREE.AnimationMixer(this.model);

    clips.forEach((clip) => {
      this.actions[clip.name] = this.mixer.clipAction(clip);
    });

    // Detect idle and walking clips
    const idleClip =
      clips.find((c) => /^idle$/i.test(c.name)) ||
      clips.find((c) => /idle/i.test(c.name));

    const walkClip =
      clips.find((c) => /^walk$/i.test(c.name)) ||
      clips.find((c) => /walk/i.test(c.name)) ||
      clips.find((c) => /run/i.test(c.name));

    if (idleClip) this.idleActionName = idleClip.name;
    if (walkClip) this.walkActionName = walkClip.name;

    // Start with idle animation
    if (this.idleActionName && this.actions[this.idleActionName]) {
      this.playAction(this.idleActionName);
    }
  }

  playAction(name) {
    if (this.currentActionName === name) return;

    const nextAction = this.actions[name];
    if (!nextAction) return;

    const prevAction = this.currentAction;
    if (prevAction) {
      prevAction.fadeOut(0.2);
    }

    nextAction.reset().fadeIn(0.2).play();
    this.currentAction = nextAction;
    this.currentActionName = name;
  }

  /**
   * Play a one-shot (non-looping) animation clip, then return to idle.
   * Returns false if the clip isn't found.
   */
  playOneShot(name, onFinish = null) {
    const action = this.actions[name];
    if (!action) return false;

    if (this.currentAction && this.currentActionName !== name) {
      this.currentAction.fadeOut(0.25);
    }

    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.reset().fadeIn(0.2).play();
    this.currentAction = action;
    this.currentActionName = name;
    this._oneShotActive = true;

    // Listen for finish event
    const onFinished = (e) => {
      if (e.action !== action) return;
      this.mixer.removeEventListener('finished', onFinished);
      this._oneShotActive = false;
      // Return to idle
      if (this.idleActionName) {
        this.currentActionName = ''; // Force re-play
        this.playAction(this.idleActionName);
      }
      if (onFinish) onFinish();
    };
    this.mixer.addEventListener('finished', onFinished);
    return true;
  }

  /** Returns all available animation clip names */
  getActionNames() {
    return Object.keys(this.actions);
  }

  update(delta, inputDirection) {
    const isMoving = inputDirection.x !== 0 || inputDirection.z !== 0;

    // 1. Manage animations (don't interrupt active one-shot clips)
    if (this.isLoaded && this.mixer) {
      if (!this._oneShotActive) {
        if (isMoving && this.walkActionName) {
          this.playAction(this.walkActionName);
        } else if (!isMoving && this.idleActionName) {
          this.playAction(this.idleActionName);
        }
      }
      this.mixer.update(delta);
    }

    // 2. Velocity and smooth movement interpolation
    const targetVelocityX = inputDirection.x * this.speed;
    const targetVelocityZ = inputDirection.z * this.speed;
    const smoothFactor = 1 - Math.exp(-12 * delta);

    this.velocity.x += (targetVelocityX - this.velocity.x) * smoothFactor;
    this.velocity.z += (targetVelocityZ - this.velocity.z) * smoothFactor;

    this.group.position.x += this.velocity.x * delta;
    this.group.position.z += this.velocity.z * delta;

    // 3. Update character facing direction when moving
    if (isMoving) {
      this.targetRotation = Math.atan2(inputDirection.x, inputDirection.z);
    }

    // Shortest-path angle lerping to avoid full 360 spin
    let angleDiff = this.targetRotation - this.group.rotation.y;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    this.group.rotation.y += angleDiff * Math.min(1, 16 * delta);
  }
}
