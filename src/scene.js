import * as THREE from 'three';

export class WorldScene {
  constructor(canvasContainer) {
    this.container = canvasContainer;

    // 1. Scene & Atmosphere (Default: Bright, pleasant Garden day)
    this.scene = new THREE.Scene();
    const skyColor = 0x8ebbd9; // Gentle, clear daytime blue sky
    this.scene.background = new THREE.Color(skyColor);
    this.scene.fog = new THREE.Fog(skyColor, 28, 92);

    // 2. Camera (Third-person perspective)
    this.camera = new THREE.PerspectiveCamera(
      48,
      window.innerWidth / window.innerHeight,
      0.1,
      500
    );
    this.camera.position.set(0, 4.2, 7);

    // 3. Renderer with filmic tone mapping and soft shadow maps
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.02; // Bright and clear
    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting Setup
    this.setupLighting();

    // 5. Low-Poly Garden Ground
    this.setupGround();

    // 6. Responsive Resize Handling
    window.addEventListener('resize', () => this.onWindowResize());
  }

  setupLighting() {
    // Soft sky ambient light
    this.ambientLight = new THREE.AmbientLight(0x90a8b8, 0.75);
    this.scene.add(this.ambientLight);

    // Sky & ground bounce hemisphere light
    this.hemiLight = new THREE.HemisphereLight(0xc8e0f4, 0x5d7350, 0.65);
    this.hemiLight.position.set(0, 40, 0);
    this.scene.add(this.hemiLight);

    // Directional sunlight: warm, bright, clear shadows
    this.dirLight = new THREE.DirectionalLight(0xfff2d6, 1.45);
    this.dirLight.position.set(18, 26, 16);
    this.dirLight.castShadow = true;

    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 80;
    this.dirLight.shadow.radius = 2.0;

    const shadowRange = 24;
    this.dirLight.shadow.camera.left = -shadowRange;
    this.dirLight.shadow.camera.right = shadowRange;
    this.dirLight.shadow.camera.top = shadowRange;
    this.dirLight.shadow.camera.bottom = -shadowRange;
    this.dirLight.shadow.bias = -0.0004;

    this.scene.add(this.dirLight);
  }

  setupGround() {
    // Proportioned ground for Chapter 1 Garden (fits garden fences x: -10 to 10, z: 8 to -28)
    const segments = 32;
    const groundGeo = new THREE.PlaneGeometry(26, 42, segments, segments);
    groundGeo.rotateX(-Math.PI / 2);
    groundGeo.translate(0, 0, -10);

    const positions = groundGeo.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);

      const distFromCenter = Math.hypot(x, z + 10);
      const roughnessFactor = Math.min(1, Math.max(0, (distFromCenter - 3) / 7));

      const y =
        (Math.sin(x * 0.12) * Math.cos(z * 0.12) * 0.18 +
          Math.sin(x * 0.05 + z * 0.06) * 0.2) *
        roughnessFactor;

      positions.setY(i, y);
    }

    groundGeo.computeVertexNormals();

    // Pleasant, readable meadow green
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x4e6b45,
      roughness: 0.88,
      metalness: 0.02,
      flatShading: true
    });

    this.ground = new THREE.Mesh(groundGeo, groundMat);
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  setAtmosphere(mode) {
    if (mode === 'hellgate') {
      const hellSky = 0x110a09; // Very dark charcoal, slightly warm
      this.scene.background.setHex(hellSky);
      this.scene.fog.color.setHex(0x1e0e08); // Warm dark ember fog
      this.scene.fog.near = 16;
      this.scene.fog.far = 72;

      if (this.ambientLight) {
        // Much brighter ambient so the scene is readable without a flashlight
        this.ambientLight.color.setHex(0x9a6848); // Warm amber-stone
        this.ambientLight.intensity = 1.4;
      }
      if (this.hemiLight) {
        this.hemiLight.color.setHex(0x5c3520); // Warm ember sky
        this.hemiLight.groundColor.setHex(0x3a1e10); // Lava bounce light
        this.hemiLight.intensity = 1.0;
      }
      if (this.dirLight) {
        this.dirLight.color.setHex(0xff8844); // Warm volcanic "sun" from the side
        this.dirLight.intensity = 1.6;
        this.dirLight.position.set(12, 20, 10);
      }
      this.renderer.toneMappingExposure = 1.2;
      if (this.ground) this.ground.visible = false;
    } else if (mode === 'prison') {
      // Ancient subterranean dungeon: dark stone, desaturated slate-blue, warm torch accents
      const prisonSky = 0x0c0f14;
      this.scene.background.setHex(prisonSky);
      this.scene.fog.color.setHex(0x11161d);
      this.scene.fog.near = 14;
      this.scene.fog.far = 58;

      if (this.ambientLight) {
        this.ambientLight.color.setHex(0x404a58);
        this.ambientLight.intensity = 1.0;
      }
      if (this.hemiLight) {
        this.hemiLight.color.setHex(0x384452);
        this.hemiLight.groundColor.setHex(0x181e26);
        this.hemiLight.intensity = 0.8;
      }
      if (this.dirLight) {
        this.dirLight.color.setHex(0xffaa66);
        this.dirLight.intensity = 0.9;
        this.dirLight.position.set(10, 20, 10);
      }
      this.renderer.toneMappingExposure = 1.15;
      if (this.ground) this.ground.visible = false;
    } else if (mode === 'forest') {
      // Moonlit night atmosphere: clear, visible, atmospheric, NOT pitch-black
      const moonNightSky = 0x182436; // Deep indigo-blue night sky
      this.scene.background.setHex(moonNightSky);
      this.scene.fog.color.setHex(moonNightSky);
      this.scene.fog.near = 18;
      this.scene.fog.far = 72; // Wide comfortable visibility

      if (this.ambientLight) {
        this.ambientLight.color.setHex(0x3e526c); // Cool moonlight ambient fill
        this.ambientLight.intensity = 0.72; // Ensures ground & Charles are clearly visible
      }
      if (this.hemiLight) {
        this.hemiLight.color.setHex(0x4a6482);
        this.hemiLight.groundColor.setHex(0x202824);
        this.hemiLight.intensity = 0.58;
      }
      if (this.dirLight) {
        this.dirLight.color.setHex(0xd6e6f8); // Cool silver-blue moonlight
        this.dirLight.intensity = 1.15;
        this.dirLight.position.set(16, 24, 14);
      }
      this.renderer.toneMappingExposure = 0.98;
      if (this.ground) this.ground.visible = false;
    } else {
      // Pleasant, bright daytime Garden atmosphere
      const gardenSky = 0x8ebbd9;
      this.scene.background.setHex(gardenSky);
      this.scene.fog.color.setHex(gardenSky);
      this.scene.fog.near = 28;
      this.scene.fog.far = 92;

      if (this.ambientLight) {
        this.ambientLight.color.setHex(0x90a8b8);
        this.ambientLight.intensity = 0.75;
      }
      if (this.hemiLight) {
        this.hemiLight.color.setHex(0xc8e0f4);
        this.hemiLight.groundColor.setHex(0x5d7350);
        this.hemiLight.intensity = 0.65;
      }
      if (this.dirLight) {
        this.dirLight.color.setHex(0xfff2d6);
        this.dirLight.intensity = 1.45;
        this.dirLight.position.set(18, 26, 16);
      }
      this.renderer.toneMappingExposure = 1.02;
      if (this.ground) this.ground.visible = true;
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
