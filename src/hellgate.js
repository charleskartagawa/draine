import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class HellGate {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Gatekeeper & Gate state
    this.gatekeeper = null;
    this.gatekeeperMixer = null;
    this.gatekeeperActions = {};
    this.isGatekeeperLoaded = false;
    this.isSteppingAside = false;
    this.steppedAside = false;

    this.gateOpen = false;
    this.gateOpening = false;
    this.gateAngle = 0;

    // Materials
    this.initMaterials();

    // Environment Construction
    this.buildGroundAndLava();
    this.buildRuinedPillarsAndRocks();
    this.buildTheColossalGate();
    this.buildEmberParticles();
    this.addFillLights();
    this.loadGatekeeper();
    this.buildIndicator();
  }

  initMaterials() {
    // Dark charcoal / volcanic rock
    this.rockMat = new THREE.MeshStandardMaterial({
      color: 0x1f1d1f, // Deep charcoal stone
      roughness: 0.95,
      metalness: 0.05,
      flatShading: true
    });

    this.pillarMat = new THREE.MeshStandardMaterial({
      color: 0x1a1819, // Dark basalt
      roughness: 0.9,
      metalness: 0.08,
      flatShading: true
    });

    this.gateDoorMat = new THREE.MeshStandardMaterial({
      color: 0x221e20, // Weathered dark iron/obsidian
      roughness: 0.65,
      metalness: 0.35,
      flatShading: true
    });

    // Subtle glowing lava cracks (restrained, not cartoonish neon)
    this.lavaMat = new THREE.MeshStandardMaterial({
      color: 0x3a0802,
      emissive: 0xd94411,
      emissiveIntensity: 0.85,
      roughness: 0.3
    });

    // Faint ancient rune stone
    this.runeMat = new THREE.MeshStandardMaterial({
      color: 0x4d3326,
      emissive: 0x99481e,
      emissiveIntensity: 0.5,
      roughness: 0.4
    });
  }

  buildGroundAndLava() {
    // 1. Proportioned volcanic ground terrain (x: -14 to 14, z: 12 to -38)
    const groundGeo = new THREE.PlaneGeometry(28, 50, 28, 32);
    groundGeo.rotateX(-Math.PI / 2);
    groundGeo.translate(0, 0, -13);

    const pos = groundGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const distFromCenter = Math.hypot(x, z + 13);
      // Rough jagged ground variation with flat main pathway
      const elev =
        (Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.35 +
          Math.sin(x * 0.05 + z * 0.06) * 0.4) *
        Math.min(1, Math.max(0, (distFromCenter - 3.2) / 6));
      pos.setY(i, elev);
    }
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1c191a, // Dark stone grey / charcoal
      roughness: 0.95,
      flatShading: true
    });

    this.ground = new THREE.Mesh(groundGeo, groundMat);
    this.ground.receiveShadow = true;
    this.group.add(this.ground);

    // 2. Subtle lava crack ribbons embedded in the stone
    const crackGroup = new THREE.Group();
    const crackCoords = [
      [-4.5, -5.0, 3.2, 0.4],
      [5.2, -8.0, 3.8, -0.5],
      [-6.0, -18.0, 4.5, 0.7],
      [4.8, -20.0, 4.0, -0.3],
      [-3.5, -27.0, 3.0, 0.2],
      [3.8, -28.5, 3.2, -0.6]
    ];

    crackCoords.forEach(([cx, cz, len, rot]) => {
      const crack = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.04, len),
        this.lavaMat
      );
      crack.position.set(cx, 0.03, cz);
      crack.rotation.y = rot;
      crackGroup.add(crack);
    });

    // Faint point lights on lava cracks to give subtle underglow
    const lavaLight1 = new THREE.PointLight(0xd94411, 0.85, 6.0);
    lavaLight1.position.set(-4.5, 0.4, -5.0);
    crackGroup.add(lavaLight1);

    const lavaLight2 = new THREE.PointLight(0xd94411, 0.85, 6.0);
    lavaLight2.position.set(4.8, 0.4, -20.0);
    crackGroup.add(lavaLight2);

    this.group.add(crackGroup);
  }

  buildRuinedPillarsAndRocks() {
    const propGroup = new THREE.Group();

    // Jagged volcanic rock spires
    const rockGeo = new THREE.DodecahedronGeometry(1.2, 0);
    const rocks = [
      [-6.5, 4.0, [1.3, 2.2, 1.2], 0.4],
      [6.8, 2.0, [1.5, 2.5, 1.4], 1.1],
      [-8.5, -12.0, [1.8, 3.0, 1.6], 0.8],
      [8.8, -14.0, [2.0, 3.4, 1.7], 2.2],
      [-7.5, -24.0, [2.2, 3.8, 1.9], 1.6],
      [7.8, -25.0, [2.4, 4.0, 2.0], 0.3]
    ];

    rocks.forEach(([x, z, s, r]) => {
      const rock = new THREE.Mesh(rockGeo, this.rockMat);
      rock.scale.set(s[0], s[1], s[2]);
      rock.position.set(x, s[1] * 0.5, z);
      rock.rotation.set(r * 0.2, r, r * 0.3);
      rock.castShadow = true;
      rock.receiveShadow = true;
      propGroup.add(rock);
    });

    // Broken ancient columns along the approach path
    const colGeo = new THREE.CylinderGeometry(0.45, 0.55, 3.2, 6);
    const columns = [
      [-3.2, 0.0, 2.4, 0.0],
      [3.2, -2.0, 1.8, 0.1],
      [-3.4, -10.0, 3.0, -0.05],
      [3.4, -12.0, 2.2, 0.08],
      [-3.2, -20.0, 3.2, 0.0],
      [3.2, -20.0, 3.2, 0.0]
    ];

    columns.forEach(([x, z, h, lean]) => {
      const col = new THREE.Mesh(colGeo, this.pillarMat);
      col.scale.y = h / 3.2;
      col.position.set(x, h / 2, z);
      col.rotation.z = lean;
      col.castShadow = true;
      col.receiveShadow = true;
      propGroup.add(col);
    });

    this.group.add(propGroup);
  }

  buildTheColossalGate() {
    this.gateGroup = new THREE.Group();
    this.gateGroup.position.set(0, 0, -30);

    // Towering basalt monolithic pillars (height: 9.5m, width: 1.8m)
    const pylonGeo = new THREE.BoxGeometry(1.8, 9.5, 1.8);

    const leftPylon = new THREE.Mesh(pylonGeo, this.pillarMat);
    leftPylon.position.set(-3.8, 4.75, 0);
    leftPylon.castShadow = true;
    leftPylon.receiveShadow = true;
    this.gateGroup.add(leftPylon);

    const rightPylon = new THREE.Mesh(pylonGeo, this.pillarMat);
    rightPylon.position.set(3.8, 4.75, 0);
    rightPylon.castShadow = true;
    rightPylon.receiveShadow = true;
    this.gateGroup.add(rightPylon);

    // Colossal arched lintel stone across the top
    const lintelGeo = new THREE.BoxGeometry(9.6, 1.6, 2.2);
    const lintel = new THREE.Mesh(lintelGeo, this.pillarMat);
    lintel.position.set(0, 9.6, 0);
    lintel.castShadow = true;
    lintel.receiveShadow = true;
    this.gateGroup.add(lintel);

    // Faint glowing ancient rune stone on arch center
    const runePlate = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5, 0), this.runeMat);
    runePlate.position.set(0, 9.6, 1.15);
    this.gateGroup.add(runePlate);

    // Twin massive gate doors
    const doorWidth = 2.75;
    const doorHeight = 8.2;
    const doorGeo = new THREE.BoxGeometry(doorWidth, doorHeight, 0.4);

    // Left Door (pivoting at x = -2.85)
    this.gateLeft = new THREE.Group();
    this.gateLeft.position.set(-2.85, 0, 0);

    const doorMeshL = new THREE.Mesh(doorGeo, this.gateDoorMat);
    doorMeshL.position.set(doorWidth / 2, doorHeight / 2, 0);
    doorMeshL.castShadow = true;
    doorMeshL.receiveShadow = true;
    this.gateLeft.add(doorMeshL);

    // Iron studs & bands
    for (let by = 1.5; by <= 7.0; by += 2.2) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, 0.18, 0.46), this.pillarMat);
      band.position.set(doorWidth / 2, by, 0);
      this.gateLeft.add(band);
    }
    this.gateGroup.add(this.gateLeft);

    // Right Door (pivoting at x = 2.85)
    this.gateRight = new THREE.Group();
    this.gateRight.position.set(2.85, 0, 0);

    const doorMeshR = new THREE.Mesh(doorGeo, this.gateDoorMat);
    doorMeshR.position.set(-doorWidth / 2, doorHeight / 2, 0);
    doorMeshR.castShadow = true;
    doorMeshR.receiveShadow = true;
    this.gateRight.add(doorMeshR);

    for (let by = 1.5; by <= 7.0; by += 2.2) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, 0.18, 0.46), this.pillarMat);
      band.position.set(-doorWidth / 2, by, 0);
      this.gateRight.add(band);
    }
    this.gateGroup.add(this.gateRight);

    // Deep warm red/orange light from beyond the gate
    this.abyssLight = new THREE.PointLight(0xff4411, 0.2, 22.0);
    this.abyssLight.position.set(0, 4.0, -3.5);
    this.gateGroup.add(this.abyssLight);

    // Flame braziers in front of the gate pillars
    const b1 = this.createBrazier(-4.5, 1.2);
    const b2 = this.createBrazier(4.5, 1.2);
    this.gateGroup.add(b1);
    this.gateGroup.add(b2);

    this.group.add(this.gateGroup);
  }

  createBrazier(x, z) {
    const brazier = new THREE.Group();
    brazier.position.set(x, 0, z);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.35, 1.2, 6),
      this.pillarMat
    );
    base.position.y = 0.6;
    base.castShadow = true;
    brazier.add(base);

    const bowl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.3, 0.4, 6),
      this.pillarMat
    );
    bowl.position.y = 1.3;
    brazier.add(bowl);

    const fire = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25, 0), this.lavaMat);
    fire.position.y = 1.45;
    brazier.add(fire);

    const light = new THREE.PointLight(0xe85d22, 1.4, 9.0);
    light.position.set(0, 1.6, 0);
    brazier.add(light);

    return brazier;
  }

  buildEmberParticles() {
    const particleCount = 120;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 24;
      positions[i * 3 + 1] = Math.random() * 8;
      positions[i * 3 + 2] = -10 - Math.random() * 24;

      velocities[i * 3] = (Math.random() - 0.5) * 0.3;
      velocities[i * 3 + 1] = 0.4 + Math.random() * 0.6; // upward drift
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.emberVelocities = velocities;

    const mat = new THREE.PointsMaterial({
      color: 0xff6622,
      size: 0.12,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    this.emberParticles = new THREE.Points(geom, mat);
    this.group.add(this.emberParticles);
  }

  addFillLights() {
    // Two warm overhead fill lights to illuminate the approach path
    // They give Charles and the Gatekeeper good visibility without a handheld torch
    const fillA = new THREE.PointLight(0xdd8855, 3.0, 28);
    fillA.position.set(-2, 7, -4);
    this.group.add(fillA);

    const fillB = new THREE.PointLight(0xcc7744, 2.5, 28);
    fillB.position.set(2, 7, -16);
    this.group.add(fillB);

    // Extra warm key light near the Gatekeeper position
    const gatekeeperKey = new THREE.PointLight(0xff9966, 2.8, 14);
    gatekeeperKey.position.set(0, 5, -22);
    this.group.add(gatekeeperKey);
  }

  loadGatekeeper() {
    const loader = new GLTFLoader();
    const modelUrl = '/models/rogue/Rogue.gltf';

    loader.load(
      modelUrl,
      (gltf) => {
        this.gatekeeperModel = gltf.scene;

        // Slightly taller/broader than Charles (0.8 scale vs Charles' 0.7)
        this.gatekeeperModel.scale.set(0.82, 0.82, 0.82);
        this.gatekeeperModel.position.set(0, 0, 0);

        this.gatekeeperModel.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        this.gatekeeper = new THREE.Group();
        this.gatekeeper.position.set(0, 0, -22); // Stands several meters in front of the gate
        this.gatekeeper.rotation.y = 0; // Faces south towards approaching Charles
        this.gatekeeper.add(this.gatekeeperModel);

        // Ground shadow
        const shadowGeo = new THREE.CircleGeometry(0.5, 24);
        const shadowMat = new THREE.MeshBasicMaterial({
          color: 0x000000,
          transparent: true,
          opacity: 0.25,
          depthWrite: false
        });
        const shadow = new THREE.Mesh(shadowGeo, shadowMat);
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.y = 0.02;
        this.gatekeeper.add(shadow);

        this.group.add(this.gatekeeper);

        // Animations setup
        if (gltf.animations && gltf.animations.length > 0) {
          this.gatekeeperMixer = new THREE.AnimationMixer(this.gatekeeperModel);
          gltf.animations.forEach((clip) => {
            this.gatekeeperActions[clip.name] = this.gatekeeperMixer.clipAction(clip);
          });

          // Play Idle animation
          const idleAction =
            this.gatekeeperActions['Idle'] ||
            this.gatekeeperActions['Attacking_Idle'] ||
            Object.values(this.gatekeeperActions)[0];

          if (idleAction) {
            idleAction.play();
            this.currentGatekeeperAction = idleAction;
          }
        }

        this.isGatekeeperLoaded = true;
      },
      undefined,
      (err) => {
        console.error('Failed to load Gatekeeper (Rogue.gltf):', err);
      }
    );
  }

  // Gatekeeper stepping aside after the mathematical trial
  stepAside() {
    if (!this.gatekeeper || this.isSteppingAside || this.steppedAside) return;
    this.isSteppingAside = true;

    // Switch to Walk animation
    if (this.gatekeeperMixer && this.gatekeeperActions['Walk']) {
      if (this.currentGatekeeperAction) {
        this.currentGatekeeperAction.fadeOut(0.2);
      }
      const walk = this.gatekeeperActions['Walk'];
      walk.reset().fadeIn(0.2).play();
      this.currentGatekeeperAction = walk;
    }
  }

  openGate() {
    this.gateOpen = true;
    this.gateOpening = true;
  }

  update(delta) {
    // 1. Update Gatekeeper animation & movement aside
    if (this.gatekeeperMixer) {
      this.gatekeeperMixer.update(delta);
    }

    if (this.isSteppingAside && !this.steppedAside) {
      const targetX = 3.2;
      const stepSpeed = 2.0;

      // Face walking direction
      this.gatekeeper.rotation.y = THREE.MathUtils.lerp(
        this.gatekeeper.rotation.y,
        Math.PI / 2,
        8 * delta
      );
      this.gatekeeper.position.x += stepSpeed * delta;

      if (this.gatekeeper.position.x >= targetX) {
        this.gatekeeper.position.x = targetX;
        this.gatekeeper.rotation.y = 0; // Turn back to face Charles
        this.isSteppingAside = false;
        this.steppedAside = true;

        // Return to Idle
        if (this.gatekeeperMixer && this.gatekeeperActions['Idle']) {
          if (this.currentGatekeeperAction) {
            this.currentGatekeeperAction.fadeOut(0.25);
          }
          const idle = this.gatekeeperActions['Idle'];
          idle.reset().fadeIn(0.25).play();
          this.currentGatekeeperAction = idle;
        }
      }
    }

    // 2. Heavy Gate Opening Animation
    if (this.gateOpening) {
      const targetAngle = Math.PI * 0.52;
      this.gateAngle += 0.8 * delta; // Heavy, slow opening

      if (this.gateAngle >= targetAngle) {
        this.gateAngle = targetAngle;
        this.gateOpening = false;
      }

      this.gateLeft.rotation.y = -this.gateAngle;
      this.gateRight.rotation.y = this.gateAngle;

      // Increase warm abyss light emerging from beyond the gate
      if (this.abyssLight) {
        this.abyssLight.intensity = THREE.MathUtils.lerp(
          this.abyssLight.intensity,
          2.6,
          2 * delta
        );
      }
    }

    // 3. Update floating ember particles
    if (this.emberParticles) {
      const pos = this.emberParticles.geometry.attributes.position;
      const count = pos.count;
      for (let i = 0; i < count; i++) {
        let y = pos.getY(i) + this.emberVelocities[i * 3 + 1] * delta;
        let x = pos.getX(i) + this.emberVelocities[i * 3] * delta;

        // Reset if reached ceiling
        if (y > 9.5) {
          y = 0.2;
          x = (Math.random() - 0.5) * 22;
        }

        pos.setY(i, y);
        pos.setX(i, x);
      }
      pos.needsUpdate = true;
    }

    // 4. Update guide arrow indicator
    if (this.indicator) {
      this.indicatorTime += delta * 3.5;
      let targetPos = null;
      if (!this.steppedAside) {
        targetPos = { x: 0, y: 5.5, z: -22.0 }; // Gatekeeper (well above NPC head)
      } else if (!this.gateOpen) {
        targetPos = { x: 0, y: 3.2, z: -27.0 }; // Gates of Hell
      } else {
        targetPos = { x: 0, y: 2.4, z: -32.0 }; // Beyond the gate
      }

      if (targetPos) {
        this.indicator.visible = true;
        this.indicator.position.x = targetPos.x;
        this.indicator.position.z = targetPos.z;
        this.indicator.position.y = targetPos.y + Math.sin(this.indicatorTime) * 0.18;
        this.indicator.rotation.y += 1.5 * delta;
      } else {
        this.indicator.visible = false;
      }
    }
  }

  buildIndicator() {
    this.indicator = new THREE.Group();

    // 3D downward pointing arrow
    const coneGeo = new THREE.ConeGeometry(0.28, 0.6, 5);
    const arrowMat = new THREE.MeshStandardMaterial({
      color: 0xff6622,
      emissive: 0xcc3300,
      emissiveIntensity: 0.9,
      roughness: 0.3,
      flatShading: true
    });
    const arrow = new THREE.Mesh(coneGeo, arrowMat);
    arrow.rotation.x = Math.PI;
    arrow.position.y = 0.3;
    this.indicator.add(arrow);

    // Subtle floating diamond halo
    const haloGeo = new THREE.RingGeometry(0.2, 0.32, 6);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xff8844,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 0.7;
    this.indicator.add(halo);

    this.indicatorTime = 0;
    this.group.add(this.indicator);
  }

  setVisible(visible) {
    this.group.visible = visible;
  }
}
