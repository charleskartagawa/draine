import * as THREE from 'three';

export class Garden {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Clue tracking
    this.clues = {
      clue1: false, // Flower arrangement
      clue2: false, // Old stone
      clue3: false  // Small lantern
    };

    this.droneCollected = false;

    this.gateOpen = false;
    this.gateOpening = false;
    this.gateAngle = 0;

    // Materials
    this.initMaterials();

    // Build the environment
    this.buildFences();
    this.buildPath();
    this.buildTrees();
    this.buildRocks();
    this.buildFlowers();
    this.buildClueObjects();
    this.buildGate();
    this.buildIndicator();
  }

  initMaterials() {
    this.woodMat = new THREE.MeshStandardMaterial({
      color: 0x5a483a,
      roughness: 0.88,
      metalness: 0.05,
      flatShading: true
    });

    this.stoneMat = new THREE.MeshStandardMaterial({
      color: 0x6e7872,
      roughness: 0.9,
      metalness: 0.02,
      flatShading: true
    });

    this.foliageMat1 = new THREE.MeshStandardMaterial({
      color: 0x486b3e, // Fresh readable garden green
      roughness: 0.85,
      metalness: 0.0,
      flatShading: true
    });

    this.foliageMat2 = new THREE.MeshStandardMaterial({
      color: 0x3e5e34, // Pleasant meadow shade
      roughness: 0.85,
      metalness: 0.0,
      flatShading: true
    });

    this.pathStoneMat = new THREE.MeshStandardMaterial({
      color: 0x68736c,
      roughness: 0.9,
      metalness: 0.02,
      flatShading: true
    });

    this.lanternMetalMat = new THREE.MeshStandardMaterial({
      color: 0x2d2b29,
      roughness: 0.6,
      metalness: 0.4
    });

    this.lanternGlowMat = new THREE.MeshStandardMaterial({
      color: 0xf5d07a,
      emissive: 0xd9a84e,
      emissiveIntensity: 0.8,
      roughness: 0.3
    });
  }

  // Wooden perimeter fencing to frame the small garden
  buildFences() {
    const fenceGroup = new THREE.Group();

    const postGeo = new THREE.BoxGeometry(0.18, 1.2, 0.18);
    const railGeo = new THREE.BoxGeometry(3.0, 0.1, 0.08);

    const placeFenceSection = (x1, z1, x2, z2) => {
      const midX = (x1 + x2) / 2;
      const midZ = (z1 + z2) / 2;
      const length = Math.hypot(x2 - x1, z2 - z1);
      const angle = Math.atan2(x2 - x1, z2 - z1);

      // Post 1
      const post = new THREE.Mesh(postGeo, this.woodMat);
      post.position.set(x1, 0.6, z1);
      post.castShadow = true;
      post.receiveShadow = true;
      fenceGroup.add(post);

      // Upper rail
      const rail1 = new THREE.Mesh(railGeo, this.woodMat);
      rail1.scale.x = length / 3.0;
      rail1.position.set(midX, 0.85, midZ);
      rail1.rotation.y = angle + Math.PI / 2;
      rail1.castShadow = true;
      fenceGroup.add(rail1);

      // Lower rail
      const rail2 = rail1.clone();
      rail2.position.y = 0.45;
      fenceGroup.add(rail2);
    };

    // Left border (x = -8.5, from z = 6 to z = -26)
    for (let z = 6; z > -26; z -= 3.2) {
      placeFenceSection(-8.5, z, -8.5, z - 3.2);
    }

    // Right border (x = 8.5, from z = 6 to z = -26)
    for (let z = 6; z > -26; z -= 3.2) {
      placeFenceSection(8.5, z, 8.5, z - 3.2);
    }

    // Back entrance framing (leaving a 4m wide entrance)
    placeFenceSection(-8.5, 6, -3.0, 6);
    placeFenceSection(3.0, 6, 8.5, 6);

    // Front fence leading up to gate at z = -26
    placeFenceSection(-8.5, -26, -1.8, -26);
    placeFenceSection(1.8, -26, 8.5, -26);

    this.group.add(fenceGroup);
  }

  // Winding stone paver path leading from entrance (z = 5) to gate (z = -26)
  buildPath() {
    const pathGroup = new THREE.Group();
    const stoneGeo = new THREE.CylinderGeometry(0.55, 0.65, 0.08, 6);

    const pathPoints = [
      { x: 0, z: 5 },
      { x: -0.4, z: 2 },
      { x: 0.2, z: -1 },
      { x: -0.6, z: -4 },
      { x: -0.2, z: -7 },
      { x: 0.8, z: -10 },
      { x: 0.4, z: -13 },
      { x: -0.5, z: -16 },
      { x: -0.2, z: -19 },
      { x: 0.3, z: -22 },
      { x: 0, z: -25 }
    ];

    pathPoints.forEach((pt, i) => {
      // Main stone
      const stone = new THREE.Mesh(stoneGeo, this.pathStoneMat);
      stone.position.set(pt.x, 0.04, pt.z);
      stone.rotation.y = (i * 1.3) % Math.PI;
      stone.scale.set(1.0 + ((i % 3) * 0.1), 1, 0.9 + ((i % 2) * 0.15));
      stone.receiveShadow = true;
      pathGroup.add(stone);

      // Side companion stones
      const sideX = pt.x + ((i % 2 === 0 ? 0.7 : -0.7));
      const sideStone = new THREE.Mesh(stoneGeo, this.pathStoneMat);
      sideStone.scale.set(0.65, 0.9, 0.6);
      sideStone.position.set(sideX, 0.03, pt.z + 0.5);
      sideStone.rotation.y = (i * 0.9) % Math.PI;
      sideStone.receiveShadow = true;
      pathGroup.add(sideStone);
    });

    this.group.add(pathGroup);
  }

  // Low-poly stylized trees
  buildTrees() {
    const treeGroup = new THREE.Group();

    const createTree = (x, z, scale = 1.0, mat = this.foliageMat1) => {
      const tree = new THREE.Group();

      // Trunk
      const trunkGeo = new THREE.CylinderGeometry(0.18, 0.3, 2.2, 5);
      const trunk = new THREE.Mesh(trunkGeo, this.woodMat);
      trunk.position.y = 1.1;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      tree.add(trunk);

      // Tier 1 foliage
      const f1Geo = new THREE.ConeGeometry(1.6, 2.2, 6);
      const f1 = new THREE.Mesh(f1Geo, mat);
      f1.position.y = 2.4;
      f1.castShadow = true;
      f1.receiveShadow = true;
      tree.add(f1);

      // Tier 2 foliage
      const f2Geo = new THREE.ConeGeometry(1.2, 1.8, 6);
      const f2 = new THREE.Mesh(f2Geo, mat);
      f2.position.y = 3.4;
      f2.castShadow = true;
      f2.receiveShadow = true;
      tree.add(f2);

      // Tier 3 foliage
      const f3Geo = new THREE.ConeGeometry(0.75, 1.3, 5);
      const f3 = new THREE.Mesh(f3Geo, mat);
      f3.position.y = 4.2;
      f3.castShadow = true;
      tree.add(f3);

      tree.scale.set(scale, scale, scale);
      tree.position.set(x, 0, z);
      tree.rotation.y = (x * 3 + z * 5) % Math.PI;
      return tree;
    };

    // Tree placements along garden edges
    const treeLocations = [
      { x: -6.5, z: 3.5, s: 1.1, m: this.foliageMat1 },
      { x: -7.0, z: -3.0, s: 1.25, m: this.foliageMat2 },
      { x: -6.0, z: -11.0, s: 1.15, m: this.foliageMat1 },
      { x: -6.8, z: -17.5, s: 1.3, m: this.foliageMat2 },
      { x: -5.5, z: -23.5, s: 1.05, m: this.foliageMat1 },

      { x: 6.8, z: 2.0, s: 1.2, m: this.foliageMat2 },
      { x: 6.2, z: -5.5, s: 1.1, m: this.foliageMat1 },
      { x: 7.2, z: -12.0, s: 1.3, m: this.foliageMat2 },
      { x: 5.8, z: -19.0, s: 1.15, m: this.foliageMat1 },
      { x: 6.5, z: -24.0, s: 1.2, m: this.foliageMat2 }
    ];

    treeLocations.forEach((loc) => {
      treeGroup.add(createTree(loc.x, loc.z, loc.s, loc.m));
    });

    this.group.add(treeGroup);
  }

  // Low-poly faceted rocks
  buildRocks() {
    const rockGroup = new THREE.Group();
    const rockGeo = new THREE.DodecahedronGeometry(0.8, 0);

    const rockPlacements = [
      { x: -4.5, z: 1.0, s: [0.8, 0.6, 0.7], r: 0.4 },
      { x: 5.2, z: -1.0, s: [1.1, 0.8, 0.9], r: 1.2 },
      { x: -5.5, z: -8.0, s: [1.3, 0.9, 1.1], r: 2.1 },
      { x: 4.8, z: -9.5, s: [0.9, 0.7, 0.8], r: 0.9 },
      { x: 3.5, z: -17.0, s: [1.2, 0.85, 1.0], r: 1.7 },
      { x: -5.2, z: -21.0, s: [1.0, 0.7, 0.85], r: 2.6 }
    ];

    rockPlacements.forEach((loc) => {
      const rock = new THREE.Mesh(rockGeo, this.stoneMat);
      rock.scale.set(loc.s[0], loc.s[1], loc.s[2]);
      rock.position.set(loc.x, loc.s[1] * 0.45, loc.z);
      rock.rotation.set(loc.r * 0.3, loc.r, loc.r * 0.2);
      rock.castShadow = true;
      rock.receiveShadow = true;
      rockGroup.add(rock);
    });

    this.group.add(rockGroup);
  }

  // Subtle low-poly flower patches
  buildFlowers() {
    const flowerGroup = new THREE.Group();

    const flowerColors = [0x9d8bb0, 0xb88892, 0xd2cbb3]; // Muted lavender, dusty rose, pale cream
    const petalGeo = new THREE.ConeGeometry(0.12, 0.22, 5);
    const stemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.35, 3);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x3d4b38, roughness: 0.9 });

    const flowerPatches = [
      { x: -2.2, z: 1.5 },
      { x: 2.5, z: -3.5 },
      { x: -3.0, z: -10.5 },
      { x: 2.8, z: -16.0 },
      { x: -2.4, z: -22.5 }
    ];

    flowerPatches.forEach((patch, patchIdx) => {
      const patchMat = new THREE.MeshStandardMaterial({
        color: flowerColors[patchIdx % flowerColors.length],
        roughness: 0.8,
        flatShading: true
      });

      for (let f = 0; f < 5; f++) {
        const singleFlower = new THREE.Group();
        const offsetX = (Math.sin(f * 2.3) * 0.45);
        const offsetZ = (Math.cos(f * 2.3) * 0.45);

        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.y = 0.17;
        singleFlower.add(stem);

        const petals = new THREE.Mesh(petalGeo, patchMat);
        petals.position.y = 0.32;
        petals.rotation.x = Math.PI;
        singleFlower.add(petals);

        singleFlower.position.set(patch.x + offsetX, 0, patch.z + offsetZ);
        flowerGroup.add(singleFlower);
      }
    });

    this.group.add(flowerGroup);
  }

  // Build the 3 distinct interactive clue objects
  buildClueObjects() {
    // ----------------------------------------------------
    // Clue 1: Flower Arrangement (x = -4.2, z = -5.8)
    // ----------------------------------------------------
    this.clue1Group = new THREE.Group();
    this.clue1Group.position.set(-4.2, 0, -5.8);

    // Stone basin/planter base
    const basinGeo = new THREE.CylinderGeometry(0.7, 0.5, 0.45, 7);
    const basin = new THREE.Mesh(basinGeo, this.stoneMat);
    basin.position.y = 0.22;
    basin.castShadow = true;
    basin.receiveShadow = true;
    this.clue1Group.add(basin);

    // Muted blue/lavender flowers inside basin
    const blueFlowerMat = new THREE.MeshStandardMaterial({
      color: 0x8a9bb8, // Muted soft dusk-blue
      roughness: 0.7,
      flatShading: true
    });
    for (let i = 0; i < 7; i++) {
      const flower = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.14, 0),
        blueFlowerMat
      );
      const angle = (i / 7) * Math.PI * 2;
      flower.position.set(Math.cos(angle) * 0.35, 0.48, Math.sin(angle) * 0.35);
      flower.castShadow = true;
      this.clue1Group.add(flower);
    }
    this.group.add(this.clue1Group);

    // ----------------------------------------------------
    // Clue 2: Old Inscribed Stone (x = 4.8, z = -13.5)
    // ----------------------------------------------------
    this.clue2Group = new THREE.Group();
    this.clue2Group.position.set(4.8, 0, -13.5);

    // Standing monolith
    const monolithGeo = new THREE.BoxGeometry(0.65, 1.8, 0.45);
    const monolith = new THREE.Mesh(monolithGeo, this.stoneMat);
    monolith.position.y = 0.9;
    monolith.rotation.y = 0.25;
    monolith.rotation.z = -0.05; // slight natural lean
    monolith.castShadow = true;
    monolith.receiveShadow = true;
    this.clue2Group.add(monolith);

    // Mysterious carved rune marker on stone
    const runePlateGeo = new THREE.BoxGeometry(0.28, 0.4, 0.05);
    const runeMat = new THREE.MeshStandardMaterial({
      color: 0x8ca89a, // Muted seafoam/patina
      roughness: 0.5,
      metalness: 0.2
    });
    const rune = new THREE.Mesh(runePlateGeo, runeMat);
    rune.position.set(0, 1.05, 0.24);
    rune.rotation.y = 0.25;
    rune.rotation.z = -0.05;
    this.clue2Group.add(rune);

    // Ground accent stones around base
    const baseStone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4, 0), this.stoneMat);
    baseStone.position.set(-0.35, 0.2, 0.3);
    baseStone.castShadow = true;
    this.clue2Group.add(baseStone);

    this.group.add(this.clue2Group);

    // ----------------------------------------------------
    // Clue 3: Small Lantern on Wooden Post (x = -3.8, z = -20.2)
    // ----------------------------------------------------
    this.clue3Group = new THREE.Group();
    this.clue3Group.position.set(-3.8, 0, -20.2);

    // Wooden post
    const postGeo = new THREE.CylinderGeometry(0.18, 0.22, 1.4, 5);
    const post = new THREE.Mesh(postGeo, this.woodMat);
    post.position.y = 0.7;
    post.castShadow = true;
    post.receiveShadow = true;
    this.clue3Group.add(post);

    // Lantern body
    const lantern = new THREE.Group();
    lantern.position.set(0, 1.45, 0);

    const lCap = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.2, 4), this.lanternMetalMat);
    lCap.position.y = 0.32;
    lantern.add(lCap);

    const lGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.35, 6), this.lanternGlowMat);
    lGlass.position.y = 0.12;
    lantern.add(lGlass);

    const lBase = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.32), this.lanternMetalMat);
    lBase.position.y = -0.07;
    lantern.add(lBase);

    // Soft warm lantern light
    const lanternLight = new THREE.PointLight(0xf2cf8a, 1.3, 5.5);
    lanternLight.position.set(0, 0.15, 0);
    lantern.add(lanternLight);

    this.clue3Group.add(lantern);
    this.group.add(this.clue3Group);
  }

  // Locked Garden Gate at z = -26
  buildGate() {
    this.gateGroup = new THREE.Group();
    this.gateGroup.position.set(0, 0, -26);

    const pillarGeo = new THREE.BoxGeometry(0.5, 2.5, 0.5);

    // Left Pillar
    const leftPillar = new THREE.Mesh(pillarGeo, this.stoneMat);
    leftPillar.position.set(-1.8, 1.25, 0);
    leftPillar.castShadow = true;
    leftPillar.receiveShadow = true;
    this.gateGroup.add(leftPillar);

    // Right Pillar
    const rightPillar = new THREE.Mesh(pillarGeo, this.stoneMat);
    rightPillar.position.set(1.8, 1.25, 0);
    rightPillar.castShadow = true;
    rightPillar.receiveShadow = true;
    this.gateGroup.add(rightPillar);

    // Overhead Arch / Header beam
    const headerGeo = new THREE.BoxGeometry(4.2, 0.35, 0.45);
    const header = new THREE.Mesh(headerGeo, this.woodMat);
    header.position.set(0, 2.4, 0);
    header.castShadow = true;
    this.gateGroup.add(header);

    // Left Gate Door (pivoting at x = -1.5)
    this.gateLeft = new THREE.Group();
    this.gateLeft.position.set(-1.5, 0, 0);

    const doorMeshLeft = this.createGateDoorMesh();
    doorMeshLeft.position.set(0.75, 0.9, 0);
    this.gateLeft.add(doorMeshLeft);
    this.gateGroup.add(this.gateLeft);

    // Right Gate Door (pivoting at x = 1.5)
    this.gateRight = new THREE.Group();
    this.gateRight.position.set(1.5, 0, 0);

    const doorMeshRight = this.createGateDoorMesh();
    doorMeshRight.position.set(-0.75, 0.9, 0);
    this.gateRight.add(doorMeshRight);
    this.gateGroup.add(this.gateRight);

    this.group.add(this.gateGroup);
  }

  createGateDoorMesh() {
    const door = new THREE.Group();
    const frameGeo = new THREE.BoxGeometry(1.5, 1.8, 0.08);
    const doorFrame = new THREE.Mesh(frameGeo, this.woodMat);
    doorFrame.castShadow = true;
    doorFrame.receiveShadow = true;
    door.add(doorFrame);

    // Decorative vertical slats
    for (let s = -0.5; s <= 0.5; s += 0.32) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.65, 0.1), this.woodMat);
      slat.position.x = s;
      door.add(slat);
    }

    return door;
  }

  // Open the gate smoothly
  openGate() {
    this.gateOpen = true;
    this.gateOpening = true;
  }

  allCluesFound() {
    return this.clues.clue1 && this.clues.clue2 && this.clues.clue3;
  }

  buildIndicator() {
    this.indicator = new THREE.Group();

    // 3D downward pointing arrow
    const coneGeo = new THREE.ConeGeometry(0.28, 0.6, 5);
    const arrowMat = new THREE.MeshStandardMaterial({
      color: 0xf5c25d,
      emissive: 0xda9426,
      emissiveIntensity: 0.6,
      roughness: 0.3,
      flatShading: true
    });
    const arrow = new THREE.Mesh(coneGeo, arrowMat);
    arrow.rotation.x = Math.PI; // Inverted cone points downwards
    arrow.position.y = 0.3;
    this.indicator.add(arrow);

    // Subtle floating diamond halo above the arrow
    const haloGeo = new THREE.RingGeometry(0.2, 0.32, 6);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xf5d07a,
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

  update(delta) {
    if (this.gateOpening) {
      const targetAngle = Math.PI * 0.55;
      this.gateAngle += 1.8 * delta;

      if (this.gateAngle >= targetAngle) {
        this.gateAngle = targetAngle;
        this.gateOpening = false;
      }

      this.gateLeft.rotation.y = -this.gateAngle;
      this.gateRight.rotation.y = this.gateAngle;
    }

    // Animate downward guide arrow pointing to current active objective
    if (this.indicator) {
      this.indicatorTime += delta * 3.5;

      let targetPos = null;
      if (!this.droneCollected) {
        targetPos = { x: 3.2, y: 1.8, z: -4.0 };
      } else if (!this.clues.clue1) {
        targetPos = { x: -4.2, y: 1.6, z: -5.8 };
      } else if (!this.clues.clue2) {
        targetPos = { x: 4.8, y: 2.4, z: -13.5 };
      } else if (!this.clues.clue3) {
        targetPos = { x: -3.8, y: 2.2, z: -20.2 };
      } else if (!this.gateOpen) {
        targetPos = { x: 0, y: 3.2, z: -26.0 };
      } else {
        targetPos = { x: 0, y: 1.8, z: -28.5 };
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

  // Distance helper
  getDistanceTo(x, z, playerPos) {
    return Math.hypot(playerPos.x - x, playerPos.z - z);
  }
}
