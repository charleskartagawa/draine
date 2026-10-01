export class InputManager {
  constructor() {
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false
    };

    this.touchVector = { x: 0, z: 0 };
    this.interactPressed = false;

    // Camera orbit angles (horizontal yaw and subtle pitch tilt)
    this.cameraAngle = 0; // Radians
    this.cameraPitch = 0;

    // Desktop keyboard listeners
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));

    // Mouse drag camera orbit on desktop (Right click or Alt+Drag)
    this.setupMouseOrbit();

    // Mobile / Touch controls
    this.setupTouchControls();
  }

  onKeyDown(event) {
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      this.keys.forward = false;
      this.keys.backward = false;
      this.keys.left = false;
      this.keys.right = false;
      return;
    }

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
      event.preventDefault();
    }

    if (event.code === 'KeyE') {
      this.interactPressed = true;
    }

    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = true;
        break;
    }
  }

  onKeyUp(event) {
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = false;
        break;
    }
  }

  setupMouseOrbit() {
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    window.addEventListener('mousedown', (e) => {
      // Right click or Middle click to rotate camera on PC
      if (e.button === 2 || e.button === 1) {
        isDragging = true;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      this.cameraAngle -= dx * 0.005;
      this.cameraPitch = Math.max(-0.35, Math.min(0.45, this.cameraPitch + dy * 0.003));
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 2 || e.button === 1) {
        isDragging = false;
      }
    });

    window.addEventListener('contextmenu', (e) => {
      // Prevent context menu on canvas so right click drag feels smooth
      if (e.target.tagName === 'CANVAS') {
        e.preventDefault();
      }
    });
  }

  setupTouchControls() {
    const isTouchDevice =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.innerWidth <= 1024;

    const touchOverlay = document.createElement('div');
    touchOverlay.id = 'touch-controls';
    touchOverlay.className = isTouchDevice ? 'touch-controls' : 'touch-controls touch-hidden-desktop';
    touchOverlay.innerHTML = `
      <!-- Floating Joystick Base & Thumb -->
      <div id="joystick-base" class="joystick-base">
        <div id="joystick-thumb" class="joystick-thumb"></div>
      </div>

      <!-- Touch Action Button -->
      <button id="touch-interact-btn" class="touch-interact-btn" type="button" aria-label="Interact">
        <span class="btn-icon">&#9670;</span>
        <span class="btn-label">Interact</span>
      </button>
    `;
    document.body.appendChild(touchOverlay);

    const base = document.getElementById('joystick-base');
    const thumb = document.getElementById('joystick-thumb');
    const interactBtn = document.getElementById('touch-interact-btn');

    let joystickTouchId = null;
    let cameraTouchId = null;
    let baseCenter = { x: 0, y: 0 };
    let lastCameraX = 0;
    let lastCameraY = 0;
    const maxRadius = 46;

    // Helper: is touch inside UI elements (dialogues, modals, buttons)?
    const isInsideUI = (target) => {
      if (!target) return false;
      return target.closest('#dialogue-box, #math-puzzle-dialog, #prison-puzzle-dialog, #chapter-transition, .transition-actions');
    };

    window.addEventListener('touchstart', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (isInsideUI(touch.target)) continue;

        // Check if touching the interact button
        if (touch.target.closest('#touch-interact-btn') || touch.target.closest('#interaction-prompt')) {
          this.interactPressed = true;
          continue;
        }

        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        // LEFT REGION (bottom-left 55% width, or left side) -> FLOATING JOYSTICK
        if (touch.clientX < screenWidth * 0.52 && joystickTouchId === null) {
          joystickTouchId = touch.identifier;

          // Position joystick base exactly where finger touched
          baseCenter = { x: touch.clientX, y: touch.clientY };
          base.style.left = `${touch.clientX}px`;
          base.style.top = `${touch.clientY}px`;
          base.classList.add('active');
          thumb.style.transform = `translate(0px, 0px)`;
          this.touchVector = { x: 0, z: 0 };
        }
        // RIGHT REGION -> CAMERA ROTATION SWIPE
        else if (touch.clientX >= screenWidth * 0.48 && cameraTouchId === null) {
          cameraTouchId = touch.identifier;
          lastCameraX = touch.clientX;
          lastCameraY = touch.clientY;
        }
      }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];

        // 1. Joystick movement
        if (touch.identifier === joystickTouchId) {
          e.preventDefault();
          const dx = touch.clientX - baseCenter.x;
          const dy = touch.clientY - baseCenter.y;
          const dist = Math.hypot(dx, dy);

          let normX = 0;
          let normY = 0;
          if (dist > 0) {
            normX = dx / dist;
            normY = dy / dist;
          }

          const clampDist = Math.min(dist, maxRadius);
          const thumbX = normX * clampDist;
          const thumbY = normY * clampDist;

          thumb.style.transform = `translate(${thumbX}px, ${thumbY}px)`;

          if (dist > 6) {
            const factor = Math.min(1, (clampDist - 6) / (maxRadius - 6));
            this.touchVector = {
              x: normX * factor,
              z: normY * factor
            };
          } else {
            this.touchVector = { x: 0, z: 0 };
          }
        }

        // 2. Camera orbit swipe
        if (touch.identifier === cameraTouchId) {
          e.preventDefault();
          const dx = touch.clientX - lastCameraX;
          const dy = touch.clientY - lastCameraY;
          lastCameraX = touch.clientX;
          lastCameraY = touch.clientY;

          this.cameraAngle -= dx * 0.007;
          this.cameraPitch = Math.max(-0.35, Math.min(0.45, this.cameraPitch + dy * 0.004));
        }
      }
    }, { passive: false });

    const endTouch = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];

        if (touch.identifier === joystickTouchId) {
          joystickTouchId = null;
          base.classList.remove('active');
          thumb.style.transform = `translate(0px, 0px)`;
          this.touchVector = { x: 0, z: 0 };
        }

        if (touch.identifier === cameraTouchId) {
          cameraTouchId = null;
        }
      }
    };

    window.addEventListener('touchend', endTouch);
    window.addEventListener('touchcancel', endTouch);

    // Mobile interact button tap
    const triggerInteract = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.interactPressed = true;
    };
    interactBtn.addEventListener('touchstart', triggerInteract, { passive: false });
    interactBtn.addEventListener('click', triggerInteract);
  }

  consumeInteract() {
    if (this.interactPressed) {
      this.interactPressed = false;
      return true;
    }
    return false;
  }

  getMovementVector() {
    const raw = { x: 0, z: 0 };

    if (this.keys.forward) raw.z -= 1;
    if (this.keys.backward) raw.z += 1;
    if (this.keys.left) raw.x -= 1;
    if (this.keys.right) raw.x += 1;

    if (this.touchVector.x !== 0 || this.touchVector.z !== 0) {
      raw.x += this.touchVector.x;
      raw.z += this.touchVector.z;
    }

    const length = Math.hypot(raw.x, raw.z);
    if (length === 0) return { x: 0, z: 0 };

    const normX = raw.x / Math.max(1, length);
    const normZ = raw.z / Math.max(1, length);

    // Transform raw direction into camera-relative world direction
    const sin = Math.sin(this.cameraAngle);
    const cos = Math.cos(this.cameraAngle);

    return {
      x: normX * cos + normZ * sin,
      z: -normX * sin + normZ * cos
    };
  }
}
