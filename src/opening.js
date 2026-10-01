import * as THREE from 'three';
import { setLanguage, getLanguage, t } from './i18n.js';

export class OpeningManager {
  constructor({ world, player, onStartGame }) {
    this.world = world;
    this.player = player;
    this.onStartGame = onStartGame;

    this.isActive = false;
    this.hasUnlockedNext = false;
    this.selectedLang = 'id';

    // Pulled back camera position to give room for speech bubble & show Charles waist-up
    // Charles stands at (0, 0, 4) in the Garden
    this.closeCamPos = new THREE.Vector3(0, 1.85, 7.8);
    this.closeCamTarget = new THREE.Vector3(0, 1.25, 4.0);

    // Gameplay camera target
    this.gameCamOffset = new THREE.Vector3(0, 3.6, 5.8);
    this.gameLookOffset = new THREE.Vector3(0, 1.15, 0);

    this.createUI();
  }

  createUI() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'opening-overlay';
    this.overlay.className = 'opening-overlay hidden';
    this.overlay.innerHTML = `
      <!-- Speech bubble floating directly above Charles -->
      <div class="charles-speech-bubble" id="charles-speech-bubble">
        <div class="bubble-header">
          <span class="bubble-avatar-dot"></span>
          <span class="bubble-speaker">CHARLES</span>
        </div>
        <div class="bubble-body" id="bubble-greeting-text">
          "Hi. Kenalin, aku Charles."
        </div>
        <div class="bubble-tail"></div>
      </div>

      <!-- Translucent reply card at the bottom -->
      <div class="opening-reply-card" id="opening-reply-card">
        <div class="reply-header">
          <span class="reply-title" id="reply-title">Balas Sapaan Charles:</span>
        </div>

        <!-- Step 1: Input greeting -->
        <div class="opening-input-wrapper" id="opening-input-wrapper">
          <input
            type="text"
            id="opening-input"
            class="opening-input"
            placeholder='Ketik "Hi Juga Charles"...'
            autocomplete="off"
            spellcheck="false"
          />
          <div class="opening-input-feedback" id="opening-input-feedback">
            Ketik persis <strong>"Hi Juga Charles"</strong> untuk membalas
          </div>
        </div>

        <!-- Step 2: Language Selection & Next button (hidden until greeting is typed) -->
        <div class="opening-stage2 hidden" id="opening-stage2">
          <p class="opening-subresponse" id="opening-subresponse">
            Senang bertemu denganmu! Sebelum kita mulai, pilih bahasamu dulu ya:
          </p>

          <div class="opening-lang-group">
            <button type="button" class="lang-btn active" data-lang="id" id="lang-btn-id">
              <span class="lang-flag">🇮🇩</span>
              <span class="lang-title">Bahasa Indonesia</span>
            </button>
            <button type="button" class="lang-btn" data-lang="en" id="lang-btn-en">
              <span class="lang-flag">🇬🇧</span>
              <span class="lang-title">English</span>
            </button>
          </div>

          <button type="button" class="opening-next-btn" id="opening-next-btn">
            MULAI PETUALANGAN &rarr;
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);

    this.bubbleEl = this.overlay.querySelector('#charles-speech-bubble');
    this.bubbleText = this.overlay.querySelector('#bubble-greeting-text');
    this.replyCard = this.overlay.querySelector('#opening-reply-card');
    this.replyTitle = this.overlay.querySelector('#reply-title');
    this.inputWrapper = this.overlay.querySelector('#opening-input-wrapper');
    this.inputEl = this.overlay.querySelector('#opening-input');
    this.feedbackEl = this.overlay.querySelector('#opening-input-feedback');
    this.stage2El = this.overlay.querySelector('#opening-stage2');
    this.subresponseEl = this.overlay.querySelector('#opening-subresponse');
    this.btnLangId = this.overlay.querySelector('#lang-btn-id');
    this.btnLangEn = this.overlay.querySelector('#lang-btn-en');
    this.btnNext = this.overlay.querySelector('#opening-next-btn');

    // Prevent key presses from moving Charles
    this.inputEl.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter' || e.key === 'NumpadEnter') {
        e.preventDefault();
        this.checkInputGreeting();
      }
    });
    this.inputEl.addEventListener('keyup', (e) => e.stopPropagation());

    // Live typing detection
    this.inputEl.addEventListener('input', () => {
      this.checkInputGreeting();
    });

    // Language switch buttons
    this.btnLangId.addEventListener('click', () => this.switchLanguage('id'));
    this.btnLangEn.addEventListener('click', () => this.switchLanguage('en'));

    // Next button
    this.btnNext.addEventListener('click', () => this.finishOpening());
  }

  normalizeText(str) {
    return str
      .trim()
      .toLowerCase()
      .replace(/[.,!?;:]/g, '')
      .replace(/\s+/g, ' ');
  }

  checkInputGreeting() {
    if (this.hasUnlockedNext) return;

    const val = this.normalizeText(this.inputEl.value);
    const validGreetings = [
      'hi juga charles',
      'hai juga charles',
      'halo juga charles',
      'hello juga charles'
    ];

    if (validGreetings.includes(val)) {
      this.hasUnlockedNext = true;
      this.inputEl.classList.add('input-valid');
      this.inputEl.disabled = true;

      this.feedbackEl.innerHTML = '<span class="check-icon">✓</span> Sapaan terkirim!';
      this.feedbackEl.classList.add('feedback-success');

      // Update speech bubble to show Charles responding warmly
      this.bubbleText.innerHTML = '"Senang bertemu denganmu! ✨"';
      this.bubbleEl.classList.add('bubble-pop');

      // Reveal language selection and NEXT button in reply card
      this.stage2El.classList.remove('hidden');
      this.stage2El.classList.add('fade-slide-up');

      setTimeout(() => {
        this.btnNext.focus();
      }, 200);
    }
  }

  switchLanguage(lang) {
    this.selectedLang = lang;
    setLanguage(lang);

    if (lang === 'id') {
      this.btnLangId.classList.add('active');
      this.btnLangEn.classList.remove('active');
      this.replyTitle.textContent = 'Balas Sapaan Charles:';
      this.subresponseEl.textContent =
        'Senang bertemu denganmu! Sebelum kita mulai, pilih bahasamu dulu ya:';
      this.btnNext.innerHTML = 'MULAI PETUALANGAN &rarr;';
    } else {
      this.btnLangId.classList.remove('active');
      this.btnLangEn.classList.add('active');
      this.replyTitle.textContent = 'Reply to Charles:';
      this.subresponseEl.textContent =
        'Nice to meet you! Before we begin, please select your language:';
      this.btnNext.innerHTML = 'START ADVENTURE &rarr;';
    }
  }

  start() {
    this.isActive = true;
    this.hasUnlockedNext = false;
    this.switchLanguage(this.selectedLang);

    // 1. Position Charles to face the camera lens directly
    // Charles is at (0, 0, 4) in the Garden
    this.player.position.set(0, 0, 4);
    this.player.group.rotation.y = 0; // 0 radians = facing +Z directly towards camera
    this.player.targetRotation = 0;
    this.player.velocity.set(0, 0, 0);

    // 2. Position camera nicely pulled back
    this.world.camera.position.copy(this.closeCamPos);
    this.world.camera.lookAt(this.closeCamTarget);

    // 3. Reset input & UI states
    this.bubbleText.innerHTML = '"Hi. Kenalin, aku Charles."';
    this.bubbleEl.classList.remove('bubble-pop');
    this.inputEl.value = '';
    this.inputEl.disabled = false;
    this.inputEl.classList.remove('input-valid');
    this.feedbackEl.innerHTML =
      'Ketik persis <strong>"Hi Juga Charles"</strong> untuk membalas';
    this.feedbackEl.className = 'opening-input-feedback';
    this.stage2El.classList.add('hidden');
    this.stage2El.classList.remove('fade-slide-up');

    // 4. Show overlay
    this.overlay.classList.remove('hidden');
    setTimeout(() => {
      this.overlay.classList.add('visible');
      this.inputEl.focus();
    }, 100);
  }

  finishOpening() {
    if (!this.hasUnlockedNext) return;

    setLanguage(this.selectedLang);

    // Blur input so it no longer captures keyboard events (fixes E-key / interact block)
    this.inputEl.blur();
    if (document.activeElement && document.activeElement !== document.body) {
      document.activeElement.blur();
    }

    // Immediately kill touch interception on child elements (mobile fix):
    // CSS pointer-events:none on the parent overlay doesn't affect children
    // that have their own pointer-events:auto set — so we force it inline.
    this.overlay.style.pointerEvents = 'none';
    this.replyCard.style.pointerEvents = 'none';
    this.bubbleEl.style.pointerEvents = 'none';

    // Hide UI
    this.overlay.classList.remove('visible');
    setTimeout(() => {
      this.overlay.classList.add('hidden');
    }, 500);

    // Smooth camera glide transition back to 3rd person gameplay
    const startCamPos = this.world.camera.position.clone();
    const endCamPos = this.player.position.clone().add(this.gameCamOffset);
    const startLookTarget = this.closeCamTarget.clone();
    const endLookTarget = this.player.position.clone().add(this.gameLookOffset);

    const startTime = performance.now();
    const duration = 1400; // 1.4 seconds smooth ease

    const animateTransition = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);

      this.world.camera.position.lerpVectors(startCamPos, endCamPos, ease);
      const curLook = new THREE.Vector3().lerpVectors(startLookTarget, endLookTarget, ease);
      this.world.camera.lookAt(curLook);

      if (progress < 1) {
        requestAnimationFrame(animateTransition);
      } else {
        this.isActive = false;
        if (this.onStartGame) {
          this.onStartGame(this.selectedLang);
        }
      }
    };

    requestAnimationFrame(animateTransition);
  }

  update() {
    if (!this.isActive) return;

    // Keep Charles looking directly at camera
    this.player.group.rotation.y = 0;
    this.player.targetRotation = 0;
    this.player.velocity.set(0, 0, 0);

    // Keep camera stable on his waist/chest framing
    this.world.camera.position.copy(this.closeCamPos);
    this.world.camera.lookAt(this.closeCamTarget);

    // Dynamically project Charles's head in 3D world space to 2D screen space
    if (this.bubbleEl) {
      const headPos = new THREE.Vector3(
        this.player.position.x,
        this.player.position.y + 1.82,
        this.player.position.z
      );
      headPos.project(this.world.camera);

      // Convert NDC (-1 to 1) to screen pixels
      const screenX = (headPos.x * 0.5 + 0.5) * window.innerWidth;
      const screenY = (-(headPos.y * 0.5) + 0.5) * window.innerHeight;

      // Position bubble so its tail points down towards Charles's head
      this.bubbleEl.style.left = `${Math.round(screenX)}px`;
      this.bubbleEl.style.top = `${Math.round(screenY)}px`;
    }
  }
}
