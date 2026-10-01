import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * BusterDrone — Flying companion drone hovering above and to the upper-right of Charles.
 * Emits a wide, bright spotlight and ambient fill to illuminate dark areas.
 * Must be collected in Chapter 1 from its pedestal in the garden before it follows Charles.
 */
export class BusterDrone {
  constructor(scene) {
    this.scene = scene;

    // Root group for the drone in world space
    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Drone state
    this.isCollected = false;
    this.lightEnabled = true;
    this.time = 0;

    // Pedestal / resting position in Chapter 1 Garden (on the right path)
    this.restPosition = new THREE.Vector3(3.2, 0.85, -4.0);
    this.group.position.copy(this.restPosition);

    // Target hover offset relative to player (local to player's rotation)
    // +X is to player's right, +Y is above shoulder/head, +Z is slightly back
    this.hoverOffset = new THREE.Vector3(0.95, 2.05, 0.25);

    // Animation & meshes
    this.mesh = null;
    this.mixer = null;
    this.turbines = [];
    this.lensMesh = null;

    // Ground pedestal mesh in Garden (drawn when not collected)
    this.pedestalGroup = new THREE.Group();
    this.pedestalGroup.position.copy(this.restPosition);
    this.pedestalGroup.position.y = 0;
    this.scene.add(this.pedestalGroup);
    this._buildPedestal();

    // ----------------------------------------------------------------
    // High-tech wide spotlight & fill lighting (Ultra-bright & wide)
    // ----------------------------------------------------------------
    // Wide searchlight beam (angle ~ 78°, high intensity, gentle decay)
    this.spot = new THREE.SpotLight(0xfffcf0, 0, 75, Math.PI / 2.3, 0.45, 0.8);
    this.spot.castShadow = false;
    this.scene.add(this.spot);

    this.spotTarget = new THREE.Object3D();
    this.scene.add(this.spotTarget);
    this.spot.target = this.spotTarget;

    // Secondary wide ambient fill point light (illuminates immediate surroundings)
    this.fillLight = new THREE.PointLight(0xfff5e0, 0, 26, 0.9);
    this.fillLight.castShadow = false;
    this.scene.add(this.fillLight);

    // Downward ground lantern pool around Charles
    this.groundLight = new THREE.PointLight(0xfffaea, 0, 16, 1.0);
    this.groundLight.castShadow = false;
    this.scene.add(this.groundLight);

    // Soft beacon light when resting on pedestal
    this.beaconLight = new THREE.PointLight(0x44ccee, 2.0, 7.0);
    this.beaconLight.position.set(0, 0.8, 0);
    this.pedestalGroup.add(this.beaconLight);

    // Target light intensity
    this._targetSpotIntensity = 0;
    this._targetFillIntensity = 0;
    this._targetGroundIntensity = 0;

    // Build instant stylized fallback mesh so something is immediately visible
    this._buildFallbackMesh();

    // Load actual Buster Drone GLTF model
    this._loadGLTF();
  }

  // ----------------------------------------------------------------
  // Pedestal / Landing Pad in Chapter 1 Garden
  // ----------------------------------------------------------------
  _buildPedestal() {
    // Octagonal stone landing base
    const baseGeo = new THREE.CylinderGeometry(0.75, 0.9, 0.25, 8);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x3d4348,
      roughness: 0.85,
      metalness: 0.2,
      flatShading: true
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.125;
    base.receiveShadow = true;
    this.pedestalGroup.add(base);

    // Tech rim ring
    const ringGeo = new THREE.TorusGeometry(0.68, 0.04, 8, 24);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x2288bb,
      emissive: 0x0099dd,
      emissiveIntensity: 0.8,
      roughness: 0.3
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.26;
    this.pedestalGroup.add(ring);

    // Holographic glowing indicator ring above pedestal
    const haloGeo = new THREE.RingGeometry(0.4, 0.52, 16);
    this.pedestalHaloMat = new THREE.MeshBasicMaterial({
      color: 0x44ddff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65
    });
    this.pedestalHalo = new THREE.Mesh(haloGeo, this.pedestalHaloMat);
    this.pedestalHalo.rotation.x = -Math.PI / 2;
    this.pedestalHalo.position.y = 0.3;
    this.pedestalGroup.add(this.pedestalHalo);
  }

  // ----------------------------------------------------------------
  // Fallback Sci-Fi Drone Mesh (while GLTF loads)
  // ----------------------------------------------------------------
  _buildFallbackMesh() {
    this.fallbackGroup = new THREE.Group();

    // Main fuselage sphere / capsule
    const bodyGeo = new THREE.SphereGeometry(0.24, 16, 12);
    bodyGeo.scale(1.2, 0.7, 1.4);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x2a313d,
      metalness: 0.75,
      roughness: 0.35
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    this.fallbackGroup.add(body);

    // Glowing front camera eye / searchlight lens
    const eyeGeo = new THREE.SphereGeometry(0.08, 12, 12);
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0x66ddff,
      emissive: 0x00c4ff,
      emissiveIntensity: 2.2,
      roughness: 0.1
    });
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(0, -0.02, 0.3);
    this.fallbackGroup.add(eye);

    // Wings / Thruster pods
    const wingGeo = new THREE.BoxGeometry(0.32, 0.05, 0.16);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x3e4756, metalness: 0.8 });

    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    leftWing.position.set(-0.35, 0.02, -0.05);
    leftWing.rotation.z = 0.2;
    this.fallbackGroup.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeo, wingMat);
    rightWing.position.set(0.35, 0.02, -0.05);
    rightWing.rotation.z = -0.2;
    this.fallbackGroup.add(rightWing);

    this.mesh = this.fallbackGroup;
    this.group.add(this.mesh);
  }

  // ----------------------------------------------------------------
  // Load the Buster Drone GLTF model
  // ----------------------------------------------------------------
  _loadGLTF() {
    const loader = new GLTFLoader();
    loader.load(
      '/models/drone/scene.gltf',
      (gltf) => {
        // Remove fallback mesh
        if (this.fallbackGroup) {
          this.group.remove(this.fallbackGroup);
          this.fallbackGroup = null;
        }

        const model = gltf.scene;

        // Traverse and remove non-drone environment nodes (Scheibe, Boden, Env, Himmel)
        const toRemove = [];
        model.traverse((child) => {
          const n = (child.name || '').toLowerCase();
          if (
            n.includes('scheibe') ||
            n.includes('boden') ||
            n.includes('env') ||
            n.includes('himmel')
          ) {
            toRemove.push(child);
          } else {
            // Track turbine blades for manual spinning if needed
            if (n.includes('turb_blade') || n.includes('turbine')) {
              this.turbines.push(child);
            }
            if (n.includes('lens')) {
              this.lensMesh = child;
              if (child.material) {
                child.material.emissive = new THREE.Color(0x00ccff);
                child.material.emissiveIntensity = 2.0;
              }
            }
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = false;
            }
          }
        });

        toRemove.forEach((child) => {
          if (child.parent) {
            child.parent.remove(child);
          }
        });

        // Compute drone-only bounding box to center and scale cleanly
        const box = new THREE.Box3().setFromObject(model);
        const center = new THREE.Vector3();
        const size = new THREE.Vector3();
        box.getCenter(center);
        box.getSize(size);

        // Center model pivot
        model.position.sub(center);

        // Container pivot for proper orientation & scale
        const pivot = new THREE.Group();
        pivot.add(model);

        // Target drone dimension: approx 0.62 meters
        const maxDim = Math.max(size.x, size.y, size.z) || 1.0;
        const scaleFactor = 0.62 / maxDim;
        pivot.scale.set(scaleFactor, scaleFactor, scaleFactor);

        // In the model, the lens points along +Z.
        this.mesh = pivot;
        this.group.add(this.mesh);

        // Setup GLTF animation mixer (Start_Liftoff or idle)
        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(model);
          const clip = gltf.animations.find((a) => a.name.includes('Liftoff')) || gltf.animations[0];
          const action = this.mixer.clipAction(clip);
          action.setLoop(THREE.LoopRepeat);
          action.play();
        }

        console.log('[BusterDrone] 3D Model loaded successfully. Turbines:', this.turbines.length);
      },
      undefined,
      (err) => {
        console.warn('[BusterDrone] GLTF load failed, keeping fallback:', err.message ?? err);
      }
    );
  }

  // ----------------------------------------------------------------
  // Collect the drone (called when player interacts in Chapter 1)
  // ----------------------------------------------------------------
  collect(instant = false) {
    this.isCollected = true;
    this.pedestalGroup.visible = false;
    this.beaconLight.visible = false;

    // Turn on the wide illumination
    this.setLightEnabled(true);
  }

  // ----------------------------------------------------------------
  // Reset drone (e.g. when restarting Chapter 1)
  // ----------------------------------------------------------------
  reset() {
    this.isCollected = false;
    this.pedestalGroup.visible = true;
    this.beaconLight.visible = true;
    this.group.position.copy(this.restPosition);
    this.group.rotation.set(0, 0, 0);
    this.setLightEnabled(false);
  }

  // ----------------------------------------------------------------
  // Toggle spotlight beam
  // ----------------------------------------------------------------
  setLightEnabled(enabled) {
    this.lightEnabled = enabled;
    if (enabled && this.isCollected) {
      this._targetSpotIntensity = 32.0;   // Powerful wide beam
      this._targetFillIntensity = 9.0;    // Broad ambient fill
      this._targetGroundIntensity = 6.0;  // Ground pool light
      this.spot.visible = true;
      this.fillLight.visible = true;
      this.groundLight.visible = true;
    } else {
      this._targetSpotIntensity = 0;
      this._targetFillIntensity = 0;
      this._targetGroundIntensity = 0;
    }
  }

  // ----------------------------------------------------------------
  // Update called every frame
  // ----------------------------------------------------------------
  update(delta, playerPos, playerRotationY = 0, isMoving = false) {
    this.time += delta;

    // Advance GLTF animation mixer if active
    if (this.mixer) {
      this.mixer.update(delta);
    }

    // Spin turbines manually as extra visual effect
    if (this.turbines.length > 0) {
      const spinSpeed = (this.isCollected ? 24.0 : 6.0) * delta;
      for (const t of this.turbines) {
        t.rotation.y += spinSpeed;
      }
    }

    // ================================================================
    // STATE 1: Uncollected (Resting on Garden Pedestal in Chapter 1)
    // ================================================================
    if (!this.isCollected) {
      // Gentle idle hover oscillation right above pedestal
      const hoverY = this.restPosition.y + Math.sin(this.time * 2.2) * 0.06;
      this.group.position.set(this.restPosition.x, hoverY, this.restPosition.z);

      // Slow majestic 360° showcase rotation
      this.group.rotation.y = this.time * 0.75;
      this.group.rotation.x = 0;
      this.group.rotation.z = 0;

      // Pulse pedestal halo opacity and beacon light
      if (this.pedestalHaloMat) {
        this.pedestalHaloMat.opacity = 0.5 + Math.sin(this.time * 3.0) * 0.3;
      }
      this.beaconLight.intensity = 1.4 + Math.sin(this.time * 3.5) * 0.6;

      // Ensure main searchlights remain off while docked
      this.spot.intensity = 0;
      this.spot.visible = false;
      this.fillLight.intensity = 0;
      this.fillLight.visible = false;
      this.groundLight.intensity = 0;
      this.groundLight.visible = false;
      return;
    }

    // ================================================================
    // STATE 2: Collected (Flying above and to the upper-right of Charles)
    // ================================================================
    if (playerPos) {
      // Calculate target world position relative to Charles's facing orientation
      // hoverOffset: X = right (+0.95), Y = up (+2.05), Z = slightly behind (+0.25)
      const rotatedOffset = this.hoverOffset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), playerRotationY);

      // Add gentle dynamic hover bobbing & sway
      const bobY = Math.sin(this.time * 2.8) * 0.08;
      const bobSide = Math.cos(this.time * 1.6) * 0.04;
      rotatedOffset.y += bobY;
      rotatedOffset.x += bobSide;

      const targetPos = playerPos.clone().add(rotatedOffset);

      // Smooth lag / flying interpolation
      const followLerp = 1 - Math.exp(-7.5 * delta);
      this.group.position.lerp(targetPos, followLerp);

      // Drone rotation: faces the same direction as Charles
      const targetRotationY = playerRotationY;
      const rotLerp = 1 - Math.exp(-8.0 * delta);

      // Shortest angle lerp
      let diff = (targetRotationY - this.group.rotation.y) % (Math.PI * 2);
      if (diff > Math.PI) diff -= Math.PI * 2;
      if (diff < -Math.PI) diff += Math.PI * 2;
      this.group.rotation.y += diff * rotLerp;

      // Forward pitch tilt when moving forward
      const targetPitch = isMoving ? 0.16 : Math.sin(this.time * 1.8) * 0.03;
      this.group.rotation.x = THREE.MathUtils.lerp(this.group.rotation.x, targetPitch, 1 - Math.exp(-6.0 * delta));

      // Gentle roll sway
      this.group.rotation.z = THREE.MathUtils.lerp(
        this.group.rotation.z,
        Math.sin(this.time * 2.0) * 0.05,
        1 - Math.exp(-5.0 * delta)
      );
    }

    // ================================================================
    // LIGHTING: Wide, bright searchlight aiming forward & down
    // ================================================================
    const lerpSpeed = 1 - Math.exp(-8.0 * delta);
    this.spot.intensity = THREE.MathUtils.lerp(this.spot.intensity, this._targetSpotIntensity, lerpSpeed);
    this.fillLight.intensity = THREE.MathUtils.lerp(this.fillLight.intensity, this._targetFillIntensity, lerpSpeed);
    this.groundLight.intensity = THREE.MathUtils.lerp(this.groundLight.intensity, this._targetGroundIntensity, lerpSpeed);

    if (this.spot.intensity > 0.05) {
      this.spot.visible = true;
      this.fillLight.visible = true;
      this.groundLight.visible = true;

      // Position spotlight and fill light at the drone
      this.spot.position.copy(this.group.position);
      this.fillLight.position.copy(this.group.position).add(new THREE.Vector3(0, -0.2, 0));

      if (playerPos) {
        this.groundLight.position.set(playerPos.x, playerPos.y + 1.2, playerPos.z);
      }

      // Calculate forward direction from drone's current world rotation
      const forwardDir = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.group.rotation.y);

      // Target point: 18m ahead and slightly downward onto the ground/path
      this.spotTarget.position.copy(this.group.position)
        .addScaledVector(forwardDir, 18.0);
      this.spotTarget.position.y = Math.max(0.3, this.group.position.y - 1.6);
      this.spotTarget.updateMatrixWorld();
    } else {
      this.spot.visible = false;
      this.fillLight.visible = false;
      this.groundLight.visible = false;
    }
  }

  // Cleanup if needed
  dispose() {
    this.scene.remove(this.group);
    this.scene.remove(this.pedestalGroup);
    this.scene.remove(this.spot);
    this.scene.remove(this.spotTarget);
    this.scene.remove(this.fillLight);
    this.scene.remove(this.groundLight);
  }
}
