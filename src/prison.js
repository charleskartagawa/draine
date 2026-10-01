import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * Prison — Chapter IV: The Prison.
 * An ancient subterranean dungeon beneath the Hell Gate.
 * Features:
 * - Dark stone corridor with prison cells (iron bars, closed doors)
 * - Open cell containing Draine's ribbon/pendant (Clue 1)
 * - Dropped cloth / path marker (Clue 2)
 * - Central chamber with antique stone pedestal & Draine's letter (Note)
 * - Massive sealed circular door with 6 symbol slots (Final Lock)
 * - Hidden Sanctuary beyond the door where Draine (Cleric) awaits
 */
export class Prison {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Clue & progression tracking
    this.clues = {
      clue1: false, // Draine's ribbon in open cell
      clue2: false, // Dropped cloth further in
      note: false   // Note on central table
    };

    this.doorOpen = false;
    this.doorOpening = false;
    this.doorSlide = 0;

    this.torches = [];
    this.runeMeshes = [];
    this.time = 0;

    // Draine (Warrior) model
    this.draineGroup = new THREE.Group();
    this.draineGroup.position.set(0, 0, -47.0);
    this.group.add(this.draineGroup);
    this.draineMixer = null;
    this.draineLoaded = false;

    // Materials
    this.initMaterials();

    // Build the dungeon environment
    this.buildCorridor();
    this.buildCells();
    this.buildCentralChamber();
    this.buildClueObjects();
    this.buildFinalDoor();
    this.buildSanctuary();
    this.buildTorches();

    // Load Draine (Warrior)
    this.loadDraine();

    // Objective Indicator (Downward guide arrow)
    this.buildIndicator();
  }

  initMaterials() {
    // Dark stone blocks
    this.wallMat = new THREE.MeshStandardMaterial({
      color: 0x2e333b,
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true
    });

    // Dark flagstone floor
    this.floorMat = new THREE.MeshStandardMaterial({
      color: 0x23272e,
      roughness: 0.85,
      metalness: 0.05,
      flatShading: true
    });

    // Flagstone accent / pathway center
    this.accentFloorMat = new THREE.MeshStandardMaterial({
      color: 0x2c323c,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true
    });

    // Heavy iron bars & brackets
    this.ironMat = new THREE.MeshStandardMaterial({
      color: 0x181a1d,
      roughness: 0.45,
      metalness: 0.85
    });

    // Old weathered wood
    this.woodMat = new THREE.MeshStandardMaterial({
      color: 0x3d3025,
      roughness: 0.85,
      metalness: 0.05
    });

    // Glowing ancient rune/seal material
    this.runeMat = new THREE.MeshStandardMaterial({
      color: 0xddbb55,
      emissive: 0xbb8822,
      emissiveIntensity: 0.4,
      roughness: 0.4
    });

    // Torch flame material
    this.flameMat = new THREE.MeshStandardMaterial({
      color: 0xffaa33,
      emissive: 0xff7711,
      emissiveIntensity: 2.2,
      roughness: 0.2
    });
  }

  // ----------------------------------------------------------------
  // Main Prison Corridor (Wide, vaulted, camera-friendly)
  // Spanning z = 16 down to z = -24, width 14.8m
  // ----------------------------------------------------------------
  buildCorridor() {
    const corridor = new THREE.Group();

    // Wide floor slabs (width 14.8m, length 40m from z = 16 to z = -24)
    const floorGeo = new THREE.BoxGeometry(14.8, 0.4, 40);
    const floor = new THREE.Mesh(floorGeo, this.floorMat);
    floor.position.set(0, -0.2, -4);
    floor.receiveShadow = true;
    corridor.add(floor);

    // Subtle center paving runner
    const runnerGeo = new THREE.BoxGeometry(5.0, 0.42, 40);
    const runner = new THREE.Mesh(runnerGeo, this.accentFloorMat);
    runner.position.set(0, -0.19, -4);
    runner.receiveShadow = true;
    corridor.add(runner);

    // Vaulted high stone arch ribs across the ceiling (at y = 6.2m, well above camera)
    for (let z = 12; z >= -24; z -= 6.0) {
      const archRib = new THREE.Group();
      archRib.position.set(0, 0, z);

      // Top horizontal transverse stone beam
      const beamGeo = new THREE.BoxGeometry(15.2, 0.55, 0.7);
      const beam = new THREE.Mesh(beamGeo, this.wallMat);
      beam.position.set(0, 6.2, 0);
      beam.castShadow = true;
      archRib.add(beam);

      // Left support column
      const leftColGeo = new THREE.BoxGeometry(0.8, 6.2, 0.8);
      const leftCol = new THREE.Mesh(leftColGeo, this.wallMat);
      leftCol.position.set(-7.0, 3.1, 0);
      leftCol.receiveShadow = true;
      archRib.add(leftCol);

      // Right support column
      const rightCol = new THREE.Mesh(leftColGeo, this.wallMat);
      rightCol.position.set(7.0, 3.1, 0);
      rightCol.receiveShadow = true;
      archRib.add(rightCol);

      corridor.add(archRib);
    }

    // Corridor sidewalls (height 6.2m, thickness 0.6m)
    const wallGeo = new THREE.BoxGeometry(0.6, 6.2, 40);

    // Left sidewall
    const leftWall = new THREE.Mesh(wallGeo, this.wallMat);
    leftWall.position.set(-7.4, 3.1, -4);
    leftWall.receiveShadow = true;
    corridor.add(leftWall);

    // Right sidewall
    const rightWall = new THREE.Mesh(wallGeo, this.wallMat);
    rightWall.position.set(7.4, 3.1, -4);
    rightWall.receiveShadow = true;
    corridor.add(rightWall);

    // Grand Entrance portal arch at z = 15.8 (spans width 15m, height 6.5m, completely open center)
    const portalTop = new THREE.Mesh(new THREE.BoxGeometry(15.2, 1.2, 0.8), this.wallMat);
    portalTop.position.set(0, 6.4, 15.6);
    corridor.add(portalTop);

    this.group.add(corridor);
  }

  // ----------------------------------------------------------------
  // Prison Cells (Spacious alcoves along the corridor sidewalls)
  // ----------------------------------------------------------------
  buildCells() {
    const cellsGroup = new THREE.Group();

    const createCell = (x, z, isOpen = false) => {
      const cell = new THREE.Group();
      cell.position.set(x, 0, z);

      // Cell floor (width 4.0m, length 4.4m)
      const cFloor = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.4, 4.4), this.floorMat);
      cFloor.position.set(0, -0.2, 0);
      cell.add(cFloor);

      // Outer wall
      const outerWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6.0, 4.4), this.wallMat);
      outerWall.position.set(x > 0 ? 2.0 : -2.0, 3.0, 0);
      cell.add(outerWall);

      // Dividers between cells
      const dividerGeo = new THREE.BoxGeometry(4.0, 6.0, 0.5);
      const divider1 = new THREE.Mesh(dividerGeo, this.wallMat);
      divider1.position.set(0, 3.0, -2.2);
      cell.add(divider1);

      const divider2 = new THREE.Mesh(dividerGeo, this.wallMat);
      divider2.position.set(0, 3.0, 2.2);
      cell.add(divider2);

      // Front iron bar frame facing the corridor
      const barFrame = new THREE.Group();
      barFrame.position.set(x > 0 ? -2.0 : 2.0, 0, 0);

      // Upper & lower horizontal rails
      const hRailGeo = new THREE.BoxGeometry(0.1, 0.12, 4.2);
      const topRail = new THREE.Mesh(hRailGeo, this.ironMat);
      topRail.position.set(0, 3.8, 0);
      barFrame.add(topRail);

      const botRail = new THREE.Mesh(hRailGeo, this.ironMat);
      botRail.position.set(0, 0.3, 0);
      barFrame.add(botRail);

      // Vertical iron bars
      const vBarGeo = new THREE.CylinderGeometry(0.04, 0.04, 3.6, 6);
      for (let bz = -1.8; bz <= 1.8; bz += 0.45) {
        // Doorway gap if open
        if (isOpen && Math.abs(bz) < 0.8) continue;
        const bar = new THREE.Mesh(vBarGeo, this.ironMat);
        bar.position.set(0, 2.05, bz);
        bar.castShadow = true;
        barFrame.add(bar);
      }

      // If open cell, swinging open barred gate door
      if (isOpen) {
        const door = new THREE.Group();
        door.position.set(0, 0, 0.8);
        door.rotation.y = x > 0 ? -1.3 : 1.3;

        const doorBarGeo = new THREE.CylinderGeometry(0.038, 0.038, 3.5, 6);
        for (let dz = 0; dz <= 1.4; dz += 0.4) {
          const dBar = new THREE.Mesh(doorBarGeo, this.ironMat);
          dBar.position.set(0, 2.05, -dz);
          door.add(dBar);
        }
        barFrame.add(door);
      }

      cell.add(barFrame);
      return cell;
    };

    // Cell 1: Closed, Left (x = -9.2, z = -4)
    cellsGroup.add(createCell(-9.2, -4, false));

    // Cell 2: Closed, Right (x = 9.2, z = -8)
    cellsGroup.add(createCell(9.2, -8, false));

    // Cell 3: OPEN CELL WITH DRAINE'S RIBBON! Left (x = -9.2, z = -13)
    this.openCell = createCell(-9.2, -13, true);
    cellsGroup.add(this.openCell);

    // Cell 4: Ajar cell, Right (x = 9.2, z = -18.2)
    cellsGroup.add(createCell(9.2, -18.2, true));

    this.group.add(cellsGroup);
  }

  // ----------------------------------------------------------------
  // Central Chamber (z = -24 down to z = -36, width 14.8m)
  // ----------------------------------------------------------------
  buildCentralChamber() {
    const chamber = new THREE.Group();

    // Chamber floor (14.8m wide, 12.4m long)
    const floorGeo = new THREE.BoxGeometry(14.8, 0.4, 12.4);
    const floor = new THREE.Mesh(floorGeo, this.floorMat);
    floor.position.set(0, -0.2, -30);
    floor.receiveShadow = true;
    chamber.add(floor);

    // Side walls (height 6.2m)
    const wallGeo = new THREE.BoxGeometry(0.6, 6.2, 12.4);
    const leftWall = new THREE.Mesh(wallGeo, this.wallMat);
    leftWall.position.set(-7.4, 3.1, -30);
    chamber.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, this.wallMat);
    rightWall.position.set(7.4, 3.1, -30);
    chamber.add(rightWall);

    // 4 High stone pillars framing the chamber
    const pillarGeo = new THREE.BoxGeometry(1.0, 6.2, 1.0);
    const pillarPositions = [
      { x: -4.5, z: -26 },
      { x: 4.5, z: -26 },
      { x: -4.5, z: -34 },
      { x: 4.5, z: -34 }
    ];

    pillarPositions.forEach((pos) => {
      const p = new THREE.Mesh(pillarGeo, this.wallMat);
      p.position.set(pos.x, 3.1, pos.z);
      p.castShadow = true;
      p.receiveShadow = true;
      chamber.add(p);
    });

    this.group.add(chamber);
  }

  // ----------------------------------------------------------------
  // Interactive Clue Objects
  // ----------------------------------------------------------------
  buildClueObjects() {
    // --------------------------------------------------------------
    // Clue 1: Draine's Ribbon in Open Cell (x = -8.2, z = -13.0)
    // --------------------------------------------------------------
    this.clue1Group = new THREE.Group();
    this.clue1Group.position.set(-8.2, 0, -13.0);

    // Stone bench/altar inside cell
    const benchGeo = new THREE.BoxGeometry(1.4, 0.7, 0.8);
    const bench = new THREE.Mesh(benchGeo, this.wallMat);
    bench.position.y = 0.35;
    bench.castShadow = true;
    this.clue1Group.add(bench);

    // Glowing pink/lavender Ribbon folded on the bench
    const ribbonGeo = new THREE.TorusGeometry(0.2, 0.055, 8, 16);
    const ribbonMat = new THREE.MeshStandardMaterial({
      color: 0xe07298,
      emissive: 0xaa2255,
      emissiveIntensity: 1.1,
      roughness: 0.3
    });
    const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbon.position.set(0, 0.76, 0);
    ribbon.rotation.x = Math.PI / 2;
    this.clue1Group.add(ribbon);

    // Soft warm accent light on the ribbon
    const ribbonLight = new THREE.PointLight(0xff99bb, 2.0, 5.5);
    ribbonLight.position.set(0, 1.1, 0);
    this.clue1Group.add(ribbonLight);

    this.group.add(this.clue1Group);

    // --------------------------------------------------------------
    // Clue 2: Dropped silken cloth / mark (x = 5.6, z = -18.2)
    // --------------------------------------------------------------
    this.clue2Group = new THREE.Group();
    this.clue2Group.position.set(5.6, 0, -18.2);

    // Cloth folded on floor
    const clothGeo = new THREE.CylinderGeometry(0.35, 0.42, 0.06, 7);
    const clothMat = new THREE.MeshStandardMaterial({
      color: 0x5a9bc8,
      emissive: 0x225588,
      emissiveIntensity: 0.8,
      roughness: 0.7
    });
    const cloth = new THREE.Mesh(clothGeo, clothMat);
    cloth.position.y = 0.04;
    cloth.rotation.y = 0.4;
    this.clue2Group.add(cloth);

    const clothLight = new THREE.PointLight(0x77bbee, 1.6, 5.0);
    clothLight.position.set(0, 0.8, 0);
    this.clue2Group.add(clothLight);

    this.group.add(this.clue2Group);

    // --------------------------------------------------------------
    // Clue 3 (Note): Antique Stone Table with Draine's Letter (x = 0, z = -29)
    // --------------------------------------------------------------
    this.noteGroup = new THREE.Group();
    this.noteGroup.position.set(0, 0, -29.0);

    // Stone pedestal / table
    const tableBase = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.9, 1.2), this.woodMat);
    tableBase.position.y = 0.45;
    tableBase.castShadow = true;
    tableBase.receiveShadow = true;
    this.noteGroup.add(tableBase);

    // Ancient handwritten parchment / letter on table
    const paperGeo = new THREE.BoxGeometry(0.6, 0.02, 0.42);
    const paperMat = new THREE.MeshStandardMaterial({
      color: 0xf5eed8,
      emissive: 0xddcc99,
      emissiveIntensity: 0.5,
      roughness: 0.4
    });
    const paper = new THREE.Mesh(paperGeo, paperMat);
    paper.position.set(0, 0.92, 0);
    paper.rotation.y = -0.15;
    this.noteGroup.add(paper);

    // Small warm candle next to the letter
    const candleGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.18, 6);
    const candleMat = new THREE.MeshStandardMaterial({ color: 0xddddcc });
    const candle = new THREE.Mesh(candleGeo, candleMat);
    candle.position.set(0.45, 1.0, 0.18);
    this.noteGroup.add(candle);

    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.07, 5), this.flameMat);
    flame.position.set(0.45, 1.12, 0.18);
    this.noteGroup.add(flame);

    const candleLight = new THREE.PointLight(0xffa544, 2.2, 7.0);
    candleLight.position.set(0.45, 1.2, 0.18);
    this.noteGroup.add(candleLight);

    this.group.add(this.noteGroup);
  }

  // ----------------------------------------------------------------
  // Final Door with 6 Symbols at z = -36
  // ----------------------------------------------------------------
  buildFinalDoor() {
    this.doorGroup = new THREE.Group();
    this.doorGroup.position.set(0, 0, -36.0);

    // Massive arch frame (opening width 6.0m, height 5.2m)
    const pillarGeo = new THREE.BoxGeometry(1.4, 6.2, 1.2);
    const leftPillar = new THREE.Mesh(pillarGeo, this.wallMat);
    leftPillar.position.set(-3.7, 3.1, 0);
    leftPillar.castShadow = true;
    this.doorGroup.add(leftPillar);

    const rightPillar = new THREE.Mesh(pillarGeo, this.wallMat);
    rightPillar.position.set(3.7, 3.1, 0);
    rightPillar.castShadow = true;
    this.doorGroup.add(rightPillar);

    const archTop = new THREE.Mesh(new THREE.BoxGeometry(8.8, 1.2, 1.2), this.wallMat);
    archTop.position.set(0, 5.6, 0);
    this.doorGroup.add(archTop);

    // Massive sliding stone doors: left and right
    const doorGeo = new THREE.BoxGeometry(3.1, 5.0, 0.4);

    this.doorLeft = new THREE.Mesh(doorGeo, this.woodMat);
    this.doorLeft.position.set(-1.55, 2.5, 0);
    this.doorLeft.castShadow = true;
    this.doorGroup.add(this.doorLeft);

    this.doorRight = new THREE.Mesh(doorGeo, this.woodMat);
    this.doorRight.position.set(1.55, 2.5, 0);
    this.doorRight.castShadow = true;
    this.doorGroup.add(this.doorRight);

    // Central circular seal ring on the doors
    const sealRingGeo = new THREE.TorusGeometry(1.5, 0.09, 8, 24);
    const sealRing = new THREE.Mesh(sealRingGeo, this.runeMat);
    sealRing.position.set(0, 2.6, 0.25);
    this.doorGroup.add(sealRing);

    // 6 Rune marker slots arranged in circle on the door
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const rx = Math.cos(angle) * 1.1;
      const ry = Math.sin(angle) * 1.1 + 2.6;

      const runeGeo = new THREE.DodecahedronGeometry(0.14, 0);
      const rune = new THREE.Mesh(runeGeo, this.runeMat.clone());
      rune.position.set(rx, ry, 0.27);
      this.doorGroup.add(rune);
      this.runeMeshes.push(rune);
    }

    // Warm glow waiting behind the door
    this.doorWarmLight = new THREE.PointLight(0xffcc77, 0, 22);
    this.doorWarmLight.position.set(0, 2.8, -2.0);
    this.doorGroup.add(this.doorWarmLight);

    this.group.add(this.doorGroup);
  }

  // ----------------------------------------------------------------
  // Final Room / Sanctuary (z = -38 down to z = -58)
  // ----------------------------------------------------------------
  buildSanctuary() {
    const sanct = new THREE.Group();

    // Floor of the sanctuary (14.8m x 22m)
    const sFloorGeo = new THREE.BoxGeometry(14.8, 0.4, 22.0);
    const sFloor = new THREE.Mesh(sFloorGeo, this.floorMat);
    sFloor.position.set(0, -0.2, -48);
    sFloor.receiveShadow = true;
    sanct.add(sFloor);

    // Back wall of sanctuary
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(14.8, 6.2, 0.6), this.wallMat);
    backWall.position.set(0, 3.1, -58.0);
    sanct.add(backWall);

    // Side walls
    const sWallGeo = new THREE.BoxGeometry(0.6, 6.2, 22.0);
    const sLeft = new THREE.Mesh(sWallGeo, this.wallMat);
    sLeft.position.set(-7.4, 3.1, -48.0);
    sanct.add(sLeft);

    const sRight = new THREE.Mesh(sWallGeo, this.wallMat);
    sRight.position.set(7.4, 3.1, -48.0);
    sanct.add(sRight);

    // Beautiful circular stone dais for Draine at (0, 0, -47)
    const daisGeo = new THREE.CylinderGeometry(2.6, 3.0, 0.2, 20);
    const daisMat = new THREE.MeshStandardMaterial({
      color: 0x484252,
      roughness: 0.7,
      metalness: 0.1
    });
    const dais = new THREE.Mesh(daisGeo, daisMat);
    dais.position.set(0, 0.1, -47.0);
    sanct.add(dais);

    // Warm overhead sanctuary skylight beam illuminating Draine
    const draineSpot = new THREE.SpotLight(0xffeedd, 3.5, 30, Math.PI / 4, 0.5, 1.0);
    draineSpot.position.set(0, 8.0, -47.0);
    draineSpot.target.position.set(0, 0, -47.0);
    sanct.add(draineSpot);
    sanct.add(draineSpot.target);

    // Ambient warm glow in sanctuary
    const sanctAmbient = new THREE.PointLight(0xffd599, 2.0, 20);
    sanctAmbient.position.set(0, 3.6, -47.0);
    sanct.add(sanctAmbient);

    this.group.add(sanct);
  }

  // ----------------------------------------------------------------
  // Wall Torches along Corridor and Chamber
  // ----------------------------------------------------------------
  buildTorches() {
    const torchPositions = [
      { x: -7.1, y: 2.8, z: 8.0 },
      { x: 7.1, y: 2.8, z: 8.0 },
      { x: -7.1, y: 2.8, z: 0.0 },
      { x: 7.1, y: 2.8, z: 0.0 },
      { x: -7.1, y: 2.8, z: -8.0 },
      { x: 7.1, y: 2.8, z: -8.0 },
      { x: -7.1, y: 2.8, z: -16.0 },
      { x: 7.1, y: 2.8, z: -16.0 },
      { x: -7.1, y: 2.8, z: -27.0 },
      { x: 7.1, y: 2.8, z: -27.0 },
      { x: -7.1, y: 2.8, z: -33.0 },
      { x: 7.1, y: 2.8, z: -33.0 }
    ];

    torchPositions.forEach((pos) => {
      const sconce = new THREE.Group();
      sconce.position.set(pos.x, pos.y, pos.z);

      // Bracket
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.4, 0.3), this.ironMat);
      sconce.add(bracket);

      // Flame
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 5), this.flameMat);
      flame.position.set(0, 0.25, 0.12);
      sconce.add(flame);

      // Flickering light
      const light = new THREE.PointLight(0xff9433, 1.8, 12.0, 1.1);
      light.position.set(0, 0.3, 0.15);
      sconce.add(light);

      this.group.add(sconce);
      this.torches.push({ light, baseIntensity: 1.8 });
    });
  }

  // ----------------------------------------------------------------
  // Load Draine 3D model (Warrior.gltf)
  // ----------------------------------------------------------------
  loadDraine() {
    const loader = new GLTFLoader();
    loader.load(
      '/models/Warrior.gltf',
      (gltf) => {
        const model = gltf.scene;
        // Scale 0.7 matches Ranger/Charles height
        model.scale.set(0.7, 0.7, 0.7);

        // Rotation 0 faces south (+Z) directly towards approaching Charles
        model.rotation.y = 0;
        model.position.set(0, 0.05, 0);

        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        this.draineModel = model;
        this.draineGroup.add(model);

        // Setup animation mixer with Idle clip
        if (gltf.animations && gltf.animations.length > 0) {
          this.draineMixer = new THREE.AnimationMixer(model);
          const idleClip =
            gltf.animations.find((a) => /idle/i.test(a.name)) ||
            gltf.animations[0];
          const action = this.draineMixer.clipAction(idleClip);
          action.play();
        }

        this.draineLoaded = true;
        console.log('[Prison] Warrior Draine model loaded successfully.');
      },
      undefined,
      (err) => {
        console.warn('[Prison] Warrior Draine model load fallback:', err);
      }
    );
  }

  // ----------------------------------------------------------------
  // Open Final Door
  // ----------------------------------------------------------------
  openFinalDoor() {
    this.doorOpen = true;
    this.doorOpening = true;

    // Flare all runes brightly
    this.runeMeshes.forEach((r) => {
      r.material.emissive.setHex(0xffeebb);
      r.material.emissiveIntensity = 2.5;
    });

    this.doorWarmLight.intensity = 5.0;
  }

  // ----------------------------------------------------------------
  // Toggle visibility of the entire chapter
  // ----------------------------------------------------------------
  setVisible(show) {
    this.group.visible = show;
  }

  // ----------------------------------------------------------------
  // Update loop
  // ----------------------------------------------------------------
  update(delta) {
    this.time += delta;

    // Advance Draine's animation mixer
    if (this.draineMixer) {
      this.draineMixer.update(delta);
    }

    // Flicker wall torches naturally
    for (let i = 0; i < this.torches.length; i++) {
      const t = this.torches[i];
      const flicker = Math.sin(this.time * 7 + i * 2.1) * 0.18 + Math.cos(this.time * 13 + i) * 0.1;
      t.light.intensity = t.baseIntensity + flicker;
    }

    // Door sliding animation
    if (this.doorOpening) {
      this.doorSlide += 2.0 * delta;
      if (this.doorSlide >= 2.8) {
        this.doorSlide = 2.8;
        this.doorOpening = false;
      }

      this.doorLeft.position.x = -1.55 - this.doorSlide;
      this.doorRight.position.x = 1.55 + this.doorSlide;
    }

    // Guide arrow pointing to active chapter 4 objective
    if (this.indicator) {
      this.indicatorTime += delta * 3.5;
      let targetPos = null;
      if (!this.clues.clue1) {
        targetPos = { x: -8.2, y: 1.5, z: -13.0 }; // Ribbon
      } else if (!this.clues.clue2) {
        targetPos = { x: 5.6, y: 1.3, z: -18.2 }; // Cloth
      } else if (!this.clues.note) {
        targetPos = { x: 0, y: 1.8, z: -29.0 }; // Note
      } else if (!this.doorOpen) {
        targetPos = { x: 0, y: 2.8, z: -35.8 }; // Final Door
      } else {
        targetPos = { x: 0, y: 2.1, z: -47.0 }; // Draine
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
      color: 0xffbb44,
      emissive: 0xdd8822,
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
      color: 0xffd577,
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
}
