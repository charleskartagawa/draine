import { getLanguage } from './i18n.js';

export class DialogueManager {
  constructor() {
    this.isOpen = false;
    this.onClosedCallback = null;
    this.lines = [];
    this.currentLineIndex = 0;
    this.autoDismissTimer = null;
    this._advanceLock = false; // debounce so touch + click don't double-fire
    this.createElements();
  }

  createElements() {
    // 1. Subtle, understated top-center objective banner
    this.objectiveEl = document.createElement('div');
    this.objectiveEl.id = 'objective-banner';
    this.objectiveEl.className = 'objective-banner';
    this.objectiveEl.innerHTML = `<span class="objective-marker">&#9670;</span> <span class="objective-text">Find a way through the garden.</span>`;
    document.body.appendChild(this.objectiveEl);

    // 2. Interaction prompt (Clickable / Tappable for mobile)
    this.promptEl = document.createElement('div');
    this.promptEl.id = 'interaction-prompt';
    this.promptEl.className = 'game-prompt hidden';
    this.promptEl.innerHTML = `<span class="prompt-btn">[E]</span> <span class="prompt-label">Inspect</span>`;
    document.body.appendChild(this.promptEl);

    // 3. Simple, authentic indie-game dialogue box
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const footerHint = isTouchDevice
      ? 'Tap to continue'
      : 'Tap or [E] &bull; Auto closes in 5s';
    this.dialogueBox = document.createElement('div');
    this.dialogueBox.id = 'dialogue-box';
    this.dialogueBox.className = 'game-dialogue hidden';
    this.dialogueBox.innerHTML = `
      <div class="dialogue-frame">
        <div class="dialogue-speaker">CHARLES</div>
        <p class="dialogue-text"></p>
        <div class="dialogue-footer">
          <span class="dialogue-timer-bar"></span>
          <span class="dialogue-next">${footerHint}</span>
        </div>
      </div>
    `;
    document.body.appendChild(this.dialogueBox);

    this.speakerEl = this.dialogueBox.querySelector('.dialogue-speaker');
    this.textEl = this.dialogueBox.querySelector('.dialogue-text');

    // 4. Chapter End Transition Screen with restart options
    this.transitionEl = document.createElement('div');
    this.transitionEl.id = 'chapter-transition';
    this.transitionEl.className = 'chapter-transition hidden';
    this.transitionEl.innerHTML = `
      <div class="transition-content">
        <h1 class="transition-title">CHAPTER I COMPLETE</h1>
        <div class="transition-divider"></div>
        <p class="transition-subtitle">THE SEARCH CONTINUES...</p>
        <p class="transition-extra-subtitle hidden"></p>
        <div id="transition-actions" class="transition-actions hidden">
          <button id="btn-replay-ch1" class="transition-btn">Play Chapter I</button>
          <button id="btn-replay-ch2" class="transition-btn">Play Chapter II</button>
          <button id="btn-replay-ch3" class="transition-btn">Play Chapter III</button>
          <button id="btn-replay-ch4" class="transition-btn">Play Chapter IV</button>
        </div>
      </div>
    `;
    document.body.appendChild(this.transitionEl);

    this.titleEl = this.transitionEl.querySelector('.transition-title');
    this.subEl = this.transitionEl.querySelector('.transition-subtitle');
    this.extraSubEl = this.transitionEl.querySelector('.transition-extra-subtitle');
    this.actionsEl = this.transitionEl.querySelector('#transition-actions');

    // Allow clicking dialogue to advance or close immediately
    // Use debounce so touchstart + subsequent click don't double-advance
    const advanceWithDebounce = (e) => {
      e.stopPropagation();
      if (this._advanceLock) return;
      this._advanceLock = true;
      this.advanceOrClose();
      setTimeout(() => { this._advanceLock = false; }, 400);
    };
    this.dialogueBox.addEventListener('click', advanceWithDebounce);
    this.dialogueBox.addEventListener('touchstart', advanceWithDebounce, { passive: true });
  }

  setObjective(text) {
    const textSpan = this.objectiveEl.querySelector('.objective-text');
    if (textSpan) textSpan.textContent = text;
    this.objectiveEl.classList.remove('hidden');
  }

  hideObjective() {
    this.objectiveEl.classList.add('hidden');
  }

  showPrompt(actionText = 'Inspect') {
    if (this.isOpen) {
      this.hidePrompt();
      return;
    }
    const labelSpan = this.promptEl.querySelector('.prompt-label');
    if (labelSpan) labelSpan.textContent = actionText;
    this.promptEl.classList.remove('hidden');

    const tBtn = document.getElementById('touch-interact-btn');
    if (tBtn) {
      tBtn.classList.add('highlighted');
      const tLabel = tBtn.querySelector('.btn-label');
      if (tLabel) tLabel.textContent = actionText;
    }
  }

  hidePrompt() {
    this.promptEl.classList.add('hidden');
    const tBtn = document.getElementById('touch-interact-btn');
    if (tBtn) {
      tBtn.classList.remove('highlighted');
      const tLabel = tBtn.querySelector('.btn-label');
      if (tLabel) tLabel.textContent = 'Interact';
    }
  }

  open({ speaker = 'CHARLES', text = '', onClosed = null } = {}) {
    this.speakerEl.textContent = speaker.toUpperCase();
    this.lines = Array.isArray(text) ? [...text] : [text];
    this.currentLineIndex = 0;
    this.textEl.textContent = this.lines[0] || '';
    this.onClosedCallback = onClosed;
    this.dialogueBox.classList.remove('hidden');
    this.isOpen = true;
    this.hidePrompt();

    // Dynamic bilingual footer hint
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isEn = getLanguage() === 'en';
    const footerNext = this.dialogueBox.querySelector('.dialogue-next');
    if (footerNext) {
      if (isTouchDevice) {
        footerNext.textContent = isEn ? 'Tap to continue' : 'Ketuk untuk lanjut';
      } else {
        footerNext.innerHTML = isEn
          ? 'Tap or [E] &bull; Auto closes in 5s'
          : 'Ketuk atau [E] &bull; Otomatis tutup dalam 5s';
      }
    }

    // Start 5-second auto-dismiss timer
    this.scheduleAutoDismiss();
  }

  scheduleAutoDismiss() {
    if (this.autoDismissTimer) {
      clearTimeout(this.autoDismissTimer);
    }
    this.autoDismissTimer = setTimeout(() => {
      this.advanceOrClose();
    }, 5000); // Automatically disappears in 5 seconds
  }

  advanceOrClose() {
    if (!this.isOpen) return;

    if (this.autoDismissTimer) {
      clearTimeout(this.autoDismissTimer);
      this.autoDismissTimer = null;
    }

    this.currentLineIndex++;
    if (this.lines && this.currentLineIndex < this.lines.length) {
      this.textEl.textContent = this.lines[this.currentLineIndex];
      this.scheduleAutoDismiss();
    } else {
      this.close();
    }
  }

  close() {
    if (this.autoDismissTimer) {
      clearTimeout(this.autoDismissTimer);
      this.autoDismissTimer = null;
    }

    this.dialogueBox.classList.add('hidden');
    this.isOpen = false;
    if (this.onClosedCallback) {
      const cb = this.onClosedCallback;
      this.onClosedCallback = null;
      cb();
    }
  }

  triggerChapterEnd({
    title = 'CHAPTER I COMPLETE',
    subtitle = 'THE SEARCH CONTINUES...',
    extraSubtitle = null,
    showActions = false,
    onComplete = null
  } = {}) {
    this.hidePrompt();
    this.hideObjective();

    this.titleEl.textContent = title;
    this.subEl.textContent = subtitle;

    if (extraSubtitle) {
      this.extraSubEl.textContent = extraSubtitle;
      this.extraSubEl.classList.remove('hidden');
    } else {
      this.extraSubEl.classList.add('hidden');
    }

    if (showActions) {
      this.actionsEl.classList.remove('hidden');
    } else {
      this.actionsEl.classList.add('hidden');
    }

    this.transitionEl.classList.remove('hidden');
    setTimeout(() => {
      this.transitionEl.classList.add('visible');
      if (onComplete) {
        setTimeout(onComplete, 2200);
      }
    }, 50);
  }

  hideTransition() {
    this.transitionEl.classList.remove('visible');
    setTimeout(() => {
      this.transitionEl.classList.add('hidden');
    }, 800);
  }
}
