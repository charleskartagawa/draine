import * as THREE from 'three';

export class Forest {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Progression states
    this.clues = {
      campfire: false,
      ribbon: false,
      stoneMarker: false
    };
    this.shrineDiscovered = false;
    this.gateReached = false;
    this.gateOpen = false;
    this.gateOpening = false;
    this.gateAngle = 0;

    // Materials
    this.initMaterials();

    // Environment Construction
    this.buildGround();
    this.buildTrails();
    this.buildTrees();
    this.buildBouldersAndLogs();

    // Clue 1: Old Campfire
    this.buildCampfire();

    // Clue 2: Ribbon on Branch
    this.buildRibbon();

    // Clue 3: Stone Marker
    this.buildStoneMarker();

    // The Hidden Shrine
    this.buildHiddenShrine();

    // The Gates of Hell
    this.buildGatesOfHell();

    // Objective Indicator (Downward guide arrow)
    this.buildIndicator();
  }

  initMaterials() {
    this.barkMat = new THREE.MeshStandardMaterial({
      color: 0x2b221c,
      roughness: 0.95,
      flatShading: true
    });

    this.pineFoliage1 = new THREE.MeshStandardMaterial({
      color: 0x1f2e1e, // Deep moonlit pine
      roughness: 0.9,
      flatShading: true
    });

    this.pineFoliage2 = new THREE.MeshStandardMaterial({
      color: 0x263725, // Soft cool green
      roughness: 0.88,
      flatShading: true
    });

    this.bushMat = new THREE.MeshStandardMaterial({
      color: 0x243322,
      roughness: 0.92,
      flatShading: true
    });

    this.rockMat = new THREE.MeshStandardMaterial({
      color: 0x3d4742,
      roughness: 0.92,
      flatShading: true
    });

    // Brighter moonlit path so player can clearly see where to walk
    this.pathStoneMat = new THREE.MeshStandardMaterial({
      color: 0x5a6962, // Clear moonlit stone pavers
      roughness: 0.88,
      flatShading: true
    });

    this.ribbonClothMat = new THREE.MeshStandardMaterial({
      color: 0xb89ec8, // Delicate lavender cloth catching moonlight
      roughness: 0.5,
      flatShading: true
    });

    // Dark basalt stone for Gates of Hell
    this.basaltMat = new THREE.MeshStandardMaterial({
      color: 0x19181a, // Dark volcanic stone
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true
    });

    this.ironMat = new THREE.MeshStandardMaterial({
      color: 0x262428,
      roughness: 0.6,
      metalness: 0.4,
      flatShading: true
    });

    this.emberMat = new THREE.MeshStandardMaterial({
      color: 0xe65c2b,
      emissive: 0xc43c12,
      emissiveIntensity: 0.85,
      roughness: 0.4
    });
  }

  buildGround() {
    // Proportioned forest terrain covering the trail (x: -16 to 16, z: 8 to -62)
    const floorGeo = new THREE.PlaneGeometry(34, 74, 32, 36);
    floorGeo.rotateX(-Math.PI / 2);
    floorGeo.translate(0, 0, -27);

    const pos = floorGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const distFromCenter = Math.hypot(x, z + 27);
      const elev =
        (Math.sin(x * 0.08) * Math.cos(z * 0.08) * 0.3 +
          Math.sin(x * 0.04 + z * 0.05) * 0.35) *
        Math.min(1, Math.max(0, (distFromCenter - 3) / 8));
      pos.setY(i, elev);
    }
    floorGeo.computeVertexNormals();

    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x242e23, // Damp dark-green forest floor
      roughness: 0.95,
      flatShading: true
    });

    this.floor = new THREE.Mesh(floorGeo, floorMat);
    this.floor.receiveShadow = true;
    this.group.add(this.floor);
  }

  buildTrails() {
    const trailGroup = new THREE.Group();
    const paverGeo = new THREE.CylinderGeometry(0.55, 0.65, 0.07, 6);

    const placePaver = (x, z, s = 1.0) => {
      const paver = new THREE.Mesh(paverGeo, this.pathStoneMat);
      paver.position.set(x, 0.04, z);
      paver.scale.set(s, 1, s * 0.88);
      paver.rotation.y = (x * 3.7 + z * 5.1) % Math.PI;
      paver.receiveShadow = true;
      trailGroup.add(paver);
    };

    // 1. Entrance trail: from z = 6 down to z = -7
    for (let z = 6; z >= -7; z -= 1.6) {
      placePaver(0, z, 1.2);
      placePaver(0.5, z + 0.3, 0.8);
    }

    // 2. Fork towards West Nook (Clue 1: Campfire at x = -8.5, z = -10)
    const campfireTrail = [
      [-1.5, -7.5], [-3.2, -8.2], [-5.0, -8.8], [-6.8, -9.4], [-8.5, -10]
    ];
    campfireTrail.forEach(([x, z]) => placePaver(x, z, 1.0));

    // 3. Central winding path continuing down to z = -16
    for (let z = -8; z >= -16; z -= 1.7) {
      const cx = Math.sin(z * 0.3) * 0.8;
      placePaver(cx, z, 1.15);
      placePaver(cx - 0.5, z + 0.2, 0.8);
    }

    // 4. Trail towards East Nook (Clue 2: Ribbon at x = 7.5, z = -18)
    const ribbonTrail = [
      [1.5, -16.5], [3.2, -17.0], [5.0, -17.5], [6.8, -17.8], [7.5, -18]
    ];
    ribbonTrail.forEach(([x, z]) => placePaver(x, z, 0.95));

    // 5. Trail leading deeper to West Grove (Clue 3: Stone Marker at x = -6.5, z = -27)
    const markerTrail = [
      [0.2, -19], [-1.2, -21], [-2.8, -23], [-4.6, -25], [-6.5, -27]
    ];
    markerTrail.forEach(([x, z]) => placePaver(x, z, 1.0));

    // 6. Trail continuing towards Hidden Shrine at x = 3.5, z = -37
    const shrineTrail = [
      [0, -26], [1.2, -28.5], [2.2, -31], [3.0, -34], [3.5, -37]
    ];
    shrineTrail.forEach(([x, z]) => placePaver(x, z, 1.1));

    // 7. Grand Avenue from Shrine (z = -40) straight to The Gates of Hell (z = -60)
    for (let z = -40; z >= -59; z -= 1.8) {
      const x = 0;
      placePaver(x - 0.7, z, 1.1);
      placePaver(x + 0.7, z, 1.1);
      placePaver(x, z + 0.3, 0.9);
    }

    this.group.add(trailGroup);
  }

  buildTrees() {
    const treeGroup = new THREE.Group();

    const createPine = (x, z, s = 1.0, dark = false) => {
      const tree = new THREE.Group();
      const folMat = dark ? this.pineFoliage1 : this.pineFoliage2;

      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.36, 3.2, 5),
        this.barkMat
      );
      trunk.position.y = 1.6;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      tree.add(trunk);

      const tiers = [
        { y: 3.0, r: 1.8, h: 2.3 },
        { y: 4.3, r: 1.4, h: 1.9 },
        { y: 5.4, r: 0.95, h: 1.5 },
        { y: 6.3, r: 0.5, h: 1.1 }
      ];

      tiers.forEach((t) => {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(t.r, t.h, 6), folMat);
        cone.position.y = t.y;
        cone.castShadow = true;
        cone.receiveShadow = true;
        tree.add(cone);
      });

      tree.scale.set(s, s, s);
      tree.position.set(x, 0, z);
      tree.rotation.y = (x * 4.3 + z * 2.7) % Math.PI;
      return tree;
    };

    // Framing tree clusters creating clearings and winding corridors
    const treeCoords = [
      // Outer West border
      [-4.0, 5.0, 1.1], [-5.5, 0.5, 1.2], [-6.5, -4.5, 1.3],
      [-13.0, -9.0, 1.4], [-12.5, -15.0, 1.3], [-11.0, -22.0, 1.3],
      [-11.5, -30.0, 1.4], [-9.0, -38.0, 1.3], [-6.5, -46.0, 1.4],
      [-5.5, -55.0, 1.5],

      // Outer East border
      [4.2, 5.2, 1.1], [5.5, 1.0, 1.2], [6.5, -4.0, 1.3],
      [11.5, -9.0, 1.3], [12.0, -17.0, 1.4], [11.0, -24.0, 1.3],
      [10.5, -32.0, 1.4], [9.0, -40.0, 1.3], [6.5, -48.0, 1.4],
      [5.5, -55.0, 1.5],

      // Inner divider between Campfire and Central Path
      [-4.5, -12.0, 1.2], [-5.0, -16.0, 1.3], [-4.0, -20.0, 1.1],

      // Inner divider between Central Path and East Ribbon Nook
      [4.5, -12.5, 1.2], [5.0, -16.0, 1.3], [4.0, -21.0, 1.2],

      // Dividers around North groves
      [-2.5, -28.0, 1.3], [-3.0, -33.0, 1.3],
      [-2.0, -42.0, 1.4], [2.0, -42.0, 1.4]
    ];

    treeCoords.forEach(([x, z, s], idx) => {
      treeGroup.add(createPine(x, z, s, idx % 2 === 0));
    });

    this.group.add(treeGroup);
  }

  buildBouldersAndLogs() {
    const propGroup = new THREE.Group();
    const rockGeo = new THREE.DodecahedronGeometry(1.0, 0);

    const rockPlacements = [
      [-3.2, 2.5, [1.1, 0.8, 1.0], 0.5],
      [3.5, -1.0, [1.2, 0.9, 1.1], 1.2],
      [-7.0, -7.0, [1.3, 0.8, 1.0], 2.1], // Near campfire
      [8.5, -16.0, [1.5, 1.0, 1.2], 0.8], // Near ribbon nook
      [-8.0, -28.0, [1.4, 1.1, 1.3], 1.5], // Near stone marker
      [6.5, -34.0, [1.3, 0.9, 1.1], 2.4]  // Near shrine
    ];

    rockPlacements.forEach(([x, z, s, r]) => {
      const rock = new THREE.Mesh(rockGeo, this.rockMat);
      rock.scale.set(s[0], s[1], s[2]);
      rock.position.set(x, s[1] * 0.45, z);
      rock.rotation.set(r * 0.3, r, r * 0.2);
      rock.castShadow = true;
      rock.receiveShadow = true;
      propGroup.add(rock);
    });

    // Fallen tree log near campfire
    const logGeo = new THREE.CylinderGeometry(0.25, 0.3, 3.2, 6);
    const sitLog = new THREE.Mesh(logGeo, this.barkMat);
    sitLog.rotation.z = Math.PI / 2;
    sitLog.rotation.y = 0.4;
    sitLog.position.set(-8.5, 0.26, -8.2);
    sitLog.castShadow = true;
    sitLog.receiveShadow = true;
    propGroup.add(sitLog);

    this.group.add(propGroup);
  }

  // --------------------------------------------------------------------------
  // CLUE 1: OLD CAMPFIRE (x = -8.5, z = -10.5)
  // --------------------------------------------------------------------------
  buildCampfire() {
    this.campfireGroup = new THREE.Group();
    this.campfireGroup.position.set(-8.5, 0, -10.5);

    // Stone ring
    const stoneRingGeo = new THREE.DodecahedronGeometry(0.24, 0);
    for (let i = 0; i < 9; i++) {
      const angle = (i / 9) * Math.PI * 2;
      const stone = new THREE.Mesh(stoneRingGeo, this.rockMat);
      stone.position.set(Math.cos(angle) * 0.75, 0.12, Math.sin(angle) * 0.75);
      stone.scale.set(1.0, 0.8, 1.0);
      stone.castShadow = true;
      this.campfireGroup.add(stone);
    }

    // Charred ash bed
    const ashGeo = new THREE.CylinderGeometry(0.65, 0.7, 0.08, 8);
    const ashMat = new THREE.MeshStandardMaterial({ color: 0x1f1f1e, roughness: 0.95 });
    const ash = new THREE.Mesh(ashGeo, ashMat);
    ash.position.y = 0.04;
    this.campfireGroup.add(ash);

    // Crossed charred firewood
    const woodGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.9, 5);
    const charMat = new THREE.MeshStandardMaterial({ color: 0x241d1a, roughness: 0.9 });

    const w1 = new THREE.Mesh(woodGeo, charMat);
    w1.rotation.set(0.2, 0.4, 0.6);
    w1.position.set(0, 0.15, 0);
    this.campfireGroup.add(w1);

    const w2 = new THREE.Mesh(woodGeo, charMat);
    w2.rotation.set(-0.3, 1.2, -0.5);
    w2.position.set(0, 0.15, 0);
    this.campfireGroup.add(w2);

    // Gentle warm glowing embers (faint, not an inferno)
    const emberGeo = new THREE.DodecahedronGeometry(0.12, 0);
    const ember = new THREE.Mesh(emberGeo, this.emberMat);
    ember.position.set(0.05, 0.14, 0);
    this.campfireGroup.add(ember);

    this.campfireLight = new THREE.PointLight(0xe87938, 0.9, 4.0);
    this.campfireLight.position.set(0, 0.35, 0);
    this.campfireGroup.add(this.campfireLight);

    this.group.add(this.campfireGroup);
  }

  // --------------------------------------------------------------------------
  // CLUE 2: RIBBON (x = 7.5, z = -18)
  // --------------------------------------------------------------------------
  buildRibbon() {
    this.ribbonGroup = new THREE.Group();
    this.ribbonGroup.position.set(7.5, 0, -18);

    // Low shrub holding ribbon
    const bushGeo = new THREE.DodecahedronGeometry(0.7, 0);
    const bush = new THREE.Mesh(bushGeo, this.bushMat);
    bush.position.y = 0.45;
    bush.castShadow = true;
    this.ribbonGroup.add(bush);

    // Slender wooden branch
    const branch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.06, 0.8, 4),
      this.barkMat
    );
    branch.rotation.set(0.3, 0.4, 0.6);
    branch.position.set(0.1, 0.6, 0.1);
    this.ribbonGroup.add(branch);

    // Fluttering lavender ribbon
    this.ribbonMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.1, 0.02),
      this.ribbonClothMat
    );
    this.ribbonMesh.position.set(0.32, 0.82, 0.18);
    this.ribbonMesh.rotation.set(0.2, 0.5, 0.3);
    this.ribbonMesh.castShadow = true;
    this.ribbonGroup.add(this.ribbonMesh);

    // Subtle moonlit glint
    this.ribbonLight = new THREE.PointLight(0xc9b8db, 0.8, 3.2);
    this.ribbonLight.position.set(0.35, 0.95, 0.2);
    this.ribbonGroup.add(this.ribbonLight);

    this.group.add(this.ribbonGroup);
  }

  // --------------------------------------------------------------------------
  // CLUE 3: STONE MARKER (x = -6.5, z = -27)
  // --------------------------------------------------------------------------
  buildStoneMarker() {
    this.stoneMarkerGroup = new THREE.Group();
    this.stoneMarkerGroup.position.set(-6.5, 0, -27);

    // Weathered standing marker stone
    const markerGeo = new THREE.BoxGeometry(0.7, 1.9, 0.45);
    const marker = new THREE.Mesh(markerGeo, this.rockMat);
    marker.position.y = 0.95;
    marker.rotation.y = 0.35;
    marker.castShadow = true;
    marker.receiveShadow = true;
    this.stoneMarkerGroup.add(marker);

    // Ancient carved symbol plaque
    const runeGeo = new THREE.BoxGeometry(0.3, 0.42, 0.06);
    const runeMat = new THREE.MeshStandardMaterial({
      color: 0x768f84, // Patina rune
      roughness: 0.4,
      metalness: 0.3
    });
    const rune = new THREE.Mesh(runeGeo, runeMat);
    rune.position.set(0, 1.1, 0.24);
    rune.rotation.y = 0.35;
    this.stoneMarkerGroup.add(rune);

    // Base support stones
    const b1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42, 0), this.rockMat);
    b1.position.set(0.4, 0.2, 0.25);
    this.stoneMarkerGroup.add(b1);

    this.group.add(this.stoneMarkerGroup);
  }

  // --------------------------------------------------------------------------
  // THE HIDDEN SHRINE (x = 3.5, z = -37)
  // --------------------------------------------------------------------------
  buildHiddenShrine() {
    this.shrineGroup = new THREE.Group();
    this.shrineGroup.position.set(3.5, 0, -37);

    // Octagonal stone dais/platform
    const daisGeo = new THREE.CylinderGeometry(2.4, 2.7, 0.35, 8);
    const dais = new THREE.Mesh(daisGeo, this.rockMat);
    dais.position.y = 0.18;
    dais.receiveShadow = true;
    this.shrineGroup.add(dais);

    // Four corner guardian monoliths
    const cornerPillars = [
      [-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]
    ];
    cornerPillars.forEach(([px, pz]) => {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.0, 0.4), this.rockMat);
      p.position.set(px, 1.0, pz);
      p.castShadow = true;
      p.receiveShadow = true;
      this.shrineGroup.add(p);
    });

    // Central ancient altar table
    const altar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.8), this.rockMat);
    altar.position.set(0, 0.6, 0);
    altar.castShadow = true;
    altar.receiveShadow = true;
    this.shrineGroup.add(altar);

    // Mysterious carved relic on altar
    const relicMat = new THREE.MeshStandardMaterial({
      color: 0x937da6,
      emissive: 0x6d5082,
      emissiveIntensity: 0.6,
      roughness: 0.3
    });
    const relic = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 0), relicMat);
    relic.position.set(0, 1.15, 0);
    this.shrineGroup.add(relic);

    // Twin stone lanterns with warm amber glow
    const lanternLight1 = new THREE.PointLight(0xf2cf8a, 1.2, 5.0);
    lanternLight1.position.set(-1.0, 1.2, 0);
    this.shrineGroup.add(lanternLight1);

    const lanternLight2 = new THREE.PointLight(0xf2cf8a, 1.2, 5.0);
    lanternLight2.position.set(1.0, 1.2, 0);
    this.shrineGroup.add(lanternLight2);

    this.group.add(this.shrineGroup);
  }

  // --------------------------------------------------------------------------
  // THE GATES OF HELL (x = 0, z = -60)
  // --------------------------------------------------------------------------
  buildGatesOfHell() {
    this.hellGateGroup = new THREE.Group();
    this.hellGateGroup.position.set(0, 0, -60);

    // Giant towering basalt pillars (height 7.5m, imposing presence)
    const pillarGeo = new THREE.BoxGeometry(1.4, 7.5, 1.4);

    const leftCol = new THREE.Mesh(pillarGeo, this.basaltMat);
    leftCol.position.set(-3.2, 3.75, 0);
    leftCol.castShadow = true;
    leftCol.receiveShadow = true;
    this.hellGateGroup.add(leftCol);

    const rightCol = new THREE.Mesh(pillarGeo, this.basaltMat);
    rightCol.position.set(3.2, 3.75, 0);
    rightCol.castShadow = true;
    rightCol.receiveShadow = true;
    this.hellGateGroup.add(rightCol);

    // Massive arched header crossbeam
    const headerGeo = new THREE.BoxGeometry(8.2, 1.2, 1.6);
    const header = new THREE.Mesh(headerGeo, this.basaltMat);
    header.position.set(0, 7.6, 0);
    header.castShadow = true;
    header.receiveShadow = true;
    this.hellGateGroup.add(header);

    // Iron gate crest & arch spikes
    const spikeGeo = new THREE.ConeGeometry(0.35, 1.4, 4);
    for (let x = -2.8; x <= 2.8; x += 1.4) {
      const spike = new THREE.Mesh(spikeGeo, this.ironMat);
      spike.position.set(x, 8.8, 0);
      this.hellGateGroup.add(spike);
    }

    // Twin swinging heavy iron gate doors: left and right
    this.gateLeft = new THREE.Group();
    this.gateLeft.position.set(-2.5, 0, 0); // hinge at left column

    const doorGeo = new THREE.BoxGeometry(2.4, 5.8, 0.15);
    const leftDoorMesh = new THREE.Mesh(doorGeo, this.ironMat);
    leftDoorMesh.position.set(1.2, 3.2, 0);
    leftDoorMesh.castShadow = true;
    this.gateLeft.add(leftDoorMesh);

    // Decorative vertical iron bars & spikes on left door
    for (let bx = 0.3; bx <= 2.2; bx += 0.45) {
      const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 6.0, 0.08), this.ironMat);
      vBar.position.set(bx, 3.3, 0.09);
      this.gateLeft.add(vBar);
    }
    this.hellGateGroup.add(this.gateLeft);

    this.gateRight = new THREE.Group();
    this.gateRight.position.set(2.5, 0, 0); // hinge at right column

    const rightDoorMesh = new THREE.Mesh(doorGeo, this.ironMat);
    rightDoorMesh.position.set(-1.2, 3.2, 0);
    rightDoorMesh.castShadow = true;
    this.gateRight.add(rightDoorMesh);

    for (let bx = -0.3; bx >= -2.2; bx -= 0.45) {
      const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 6.0, 0.08), this.ironMat);
      vBar.position.set(bx, 3.3, 0.09);
      this.gateRight.add(vBar);
    }
    this.hellGateGroup.add(this.gateRight);

    // Twin stone braziers at entrance
    const brazierGeo = new THREE.CylinderGeometry(0.5, 0.35, 1.2, 6);
    const b1 = new THREE.Mesh(brazierGeo, this.basaltMat);
    b1.position.set(-2.2, 0.6, 2.5);
    this.hellGateGroup.add(b1);

    const b2 = new THREE.Mesh(brazierGeo, this.basaltMat);
    b2.position.set(2.2, 0.6, 2.5);
    this.hellGateGroup.add(b2);

    // Soft ominous ember glow at gate base
    this.gateLightLeft = new THREE.PointLight(0xd94e28, 1.6, 8.0);
    this.gateLightLeft.position.set(-2.2, 1.4, 2.5);
    this.hellGateGroup.add(this.gateLightLeft);

    this.gateLightRight = new THREE.PointLight(0xd94e28, 1.6, 8.0);
    this.gateLightRight.position.set(2.2, 1.4, 2.5);
    this.hellGateGroup.add(this.gateLightRight);

    this.group.add(this.hellGateGroup);
  }

  openGate() {
    this.gateOpen = true;
    this.gateOpening = true;
    if (this.gateLightLeft) this.gateLightLeft.intensity = 3.8;
    if (this.gateLightRight) this.gateLightRight.intensity = 3.8;
  }

  allCluesFound() {
    return this.clues.campfire && this.clues.ribbon && this.clues.stoneMarker;
  }

  getElevation(x, z) {
    const distFromCenter = Math.hypot(x, z + 27);
    const elev =
      (Math.sin(x * 0.08) * Math.cos(z * 0.08) * 0.3 +
        Math.sin(x * 0.04 + z * 0.05) * 0.35) *
      Math.min(1, Math.max(0, (distFromCenter - 3) / 8));
    return Math.max(0, elev);
  }

  buildIndicator() {
    this.indicator = new THREE.Group();

    // 3D downward pointing arrow
    const coneGeo = new THREE.ConeGeometry(0.28, 0.6, 5);
    const arrowMat = new THREE.MeshStandardMaterial({
      color: 0x5dc4f5,
      emissive: 0x2277bb,
      emissiveIntensity: 0.8,
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
      color: 0x88ddff,
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
    // Animate Hell Gate doors swinging open when unlocked
    if (this.gateOpening && this.gateLeft && this.gateRight) {
      const targetAngle = Math.PI * 0.52;
      this.gateAngle += 1.8 * delta;
      if (this.gateAngle >= targetAngle) {
        this.gateAngle = targetAngle;
        this.gateOpening = false;
      }
      this.gateLeft.rotation.y = this.gateAngle;
      this.gateRight.rotation.y = -this.gateAngle;
    }

    // Subtle breathing pulse on ribbon
    if (!this.clues.ribbon && this.ribbonMesh) {
      this.ribbonMesh.rotation.z += 0.5 * delta;
    }

    // Guide arrow pointing to active chapter 2 objective
    if (this.indicator) {
      this.indicatorTime += delta * 3.5;
      let targetPos = null;
      if (!this.clues.campfire) {
        targetPos = { x: -8.5, y: 1.8, z: -10.5 };
      } else if (!this.clues.ribbon) {
        targetPos = { x: 7.5, y: 2.2, z: -18.0 };
      } else if (!this.clues.stoneMarker) {
        targetPos = { x: -6.5, y: 2.0, z: -27.0 };
      } else if (!this.shrineDiscovered) {
        targetPos = { x: 3.5, y: 2.4, z: -37.0 };
      } else if (!this.gateReached) {
        targetPos = { x: 0, y: 3.0, z: -57.0 };
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

  setVisible(visible) {
    this.group.visible = visible;
  }
}
