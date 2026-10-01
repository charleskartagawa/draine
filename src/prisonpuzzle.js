import { getLanguage, t } from './i18n.js';

/**
 * PrisonPuzzle — The Final Mathematical Puzzle in Chapter IV: The Prison.
 * The player decodes six mathematical expressions into the word: D R A I N E
 * Using the encoding: A = 1, B = 2, C = 3 ... Z = 26
 */
export class PrisonPuzzle {
  constructor(onComplete) {
    this.onComplete = onComplete;
    this.currentQuestion = 0;
    this.isOpen = false;
    this.isCompleted = false;
    this.isProcessing = false; // Prevents race condition / spam skips

    // Six equations leading to DRAINE
    this.questions = [
      {
        display: 'ln(e⁴)',
        answer: '4',
        letter: 'D',
        hint: '4 → D'
      },
      {
        display: '3 × 6',
        answer: '18',
        letter: 'R',
        hint: '18 → R'
      },
      {
        display: '∫₀^∞ e⁻ˣ dx',
        answer: '1',
        letter: 'A',
        hint: '1 → A'
      },
      {
        display: '√81',
        answer: '9',
        letter: 'I',
        hint: '9 → I'
      },
      {
        display: '1 + 2 + 3 + 4 + 4',
        answer: '14',
        letter: 'N',
        hint: '14 → N'
      },
      {
        display: '10 / 2',
        answer: '5',
        letter: 'E',
        hint: '5 → E'
      }
    ];

    this.solvedLetters = ['', '', '', '', '', ''];

    this.createUI();
  }

  createUI() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'prison-puzzle-overlay';
    this.overlay.className = 'math-puzzle-overlay prison-puzzle-overlay hidden';
    this.overlay.innerHTML = `
      <div class="math-puzzle-frame prison-puzzle-frame">
        <div class="math-puzzle-header">
          <span class="math-puzzle-label" id="prison-header-label">THE FINAL SEAL</span>
          <span class="math-puzzle-progress"><span id="prison-lock-word">LOCK</span> <span id="prison-q-num">1</span> / 6</span>
        </div>

        <div class="prison-cipher-hint">
          A = 1 &nbsp;·&nbsp; B = 2 &nbsp;·&nbsp; C = 3 &nbsp;…&nbsp; Z = 26
        </div>

        <!-- 6 Symbol slots -->
        <div class="prison-slots-row" id="prison-slots-row">
          <div class="prison-slot" data-index="0">?</div>
          <div class="prison-slot" data-index="1">?</div>
          <div class="prison-slot" data-index="2">?</div>
          <div class="prison-slot" data-index="3">?</div>
          <div class="prison-slot" data-index="4">?</div>
          <div class="prison-slot" data-index="5">?</div>
        </div>

        <div class="math-puzzle-divider"></div>

        <div class="math-puzzle-body">
          <div class="math-equation prison-equation" id="prison-equation">ln(e⁴) = ?</div>
          <div class="math-input-row">
            <input
              type="text"
              id="prison-input"
              class="math-input prison-input"
              placeholder="Jawaban"
              maxlength="30"
              autocomplete="off"
              spellcheck="false"
            />
            <button id="prison-submit-btn" class="math-submit-btn prison-submit-btn" type="button">Buka Kunci</button>
          </div>
          <div id="prison-feedback" class="math-feedback prison-feedback"></div>

          <!-- Non-clickable hint box so player must manually type "charles ganteng" -->
          <div id="prison-cheat-hint" class="math-cheat-hint">
            Gatau jawabannya? Ketik "charles ganteng"
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(this.overlay);

    this.headerLabelEl = this.overlay.querySelector('#prison-header-label');
    this.lockWordEl = this.overlay.querySelector('#prison-lock-word');
    this.inputEl = this.overlay.querySelector('#prison-input');
    this.equationEl = this.overlay.querySelector('#prison-equation');
    this.feedbackEl = this.overlay.querySelector('#prison-feedback');
    this.qNumEl = this.overlay.querySelector('#prison-q-num');
    this.submitBtn = this.overlay.querySelector('#prison-submit-btn');
    this.cheatHintEl = this.overlay.querySelector('#prison-cheat-hint');
    this.slots = this.overlay.querySelectorAll('.prison-slot');

    // Enter key handling
    this.inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === 'NumpadEnter') {
        e.preventDefault();
        e.stopPropagation();
        this.handleSubmit();
      }
      e.stopPropagation();
    });

    this.inputEl.addEventListener('keyup', (e) => e.stopPropagation());

    // Live cheat detector — triggers only when typed by the player
    this.inputEl.addEventListener('input', () => {
      if (this.isProcessing) return;
      const val = this.inputEl.value.trim().toLowerCase();
      if (val === 'charles ganteng' || val === 'charlesganteng') {
        this.revealAnswerKey();
      }
    });

    this.submitBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleSubmit();
    });

    this.submitBtn.addEventListener('touchstart', (e) => {
      e.stopPropagation();
    }, { passive: true });
  }

  updateTexts() {
    const isEn = getLanguage() === 'en';
    if (this.headerLabelEl) {
      this.headerLabelEl.textContent = isEn ? 'THE FINAL SEAL' : 'SEGEL TERAKHIR';
    }
    if (this.lockWordEl) {
      this.lockWordEl.textContent = isEn ? 'LOCK' : 'KUNCI';
    }
    if (this.submitBtn) {
      this.submitBtn.textContent = isEn ? 'Unlock' : 'Buka Kunci';
    }
    if (this.inputEl) {
      this.inputEl.placeholder = isEn ? 'Answer' : 'Jawaban';
    }
    if (this.cheatHintEl) {
      this.cheatHintEl.textContent = isEn
        ? 'Don\'t know the answer? Type "charles ganteng"'
        : 'Gatau jawabannya? Ketik "charles ganteng"';
    }
  }

  open() {
    if (this.isCompleted) return;
    this.currentQuestion = 0;
    this.isOpen = true;
    this.isProcessing = false;
    this.solvedLetters = ['', '', '', '', '', ''];
    this.slots.forEach((s) => {
      s.textContent = '?';
      s.classList.remove('slot-solved', 'slot-active');
    });

    this.updateTexts();
    this.overlay.classList.remove('hidden');
    this.showQuestion(0);
    setTimeout(() => {
      this.inputEl.focus();
    }, 100);
  }

  close() {
    this.isOpen = false;
    this.isProcessing = false;
    this.overlay.classList.add('hidden');
    this.feedbackEl.textContent = '';
    this.inputEl.value = '';
    this.inputEl.blur();
  }

  showQuestion(index) {
    const q = this.questions[index];
    this.equationEl.textContent = `${q.display} = ?`;
    this.qNumEl.textContent = index + 1;
    this.inputEl.value = '';
    this.feedbackEl.textContent = '';
    this.feedbackEl.className = 'math-feedback prison-feedback';

    // Highlight active slot
    this.slots.forEach((s, idx) => {
      if (idx === index) {
        s.classList.add('slot-active');
      } else {
        s.classList.remove('slot-active');
      }
    });

    this.equationEl.classList.remove('equation-animate');
    void this.equationEl.offsetWidth;
    this.equationEl.classList.add('equation-animate');

    setTimeout(() => {
      this.inputEl.focus();
    }, 50);
  }

  handleSubmit() {
    if (this.isProcessing) return;

    const raw = this.inputEl.value.trim().toLowerCase();
    const q = this.questions[this.currentQuestion];

    if (!raw) return;

    if (raw === 'charles ganteng' || raw === 'charlesganteng' || raw === 'charles') {
      this.revealAnswerKey();
      return;
    }

    if (raw === q.answer.toLowerCase()) {
      this.onCorrect();
    } else {
      this.onWrong();
    }
  }

  revealAnswerKey() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    const q = this.questions[this.currentQuestion];
    this.inputEl.value = q.answer;
    const prefix = getLanguage() === 'en' ? 'Answer Key' : 'Kunci Jawaban';
    this.feedbackEl.textContent = `${prefix}: ${q.answer} → ${q.letter} ✨`;
    this.feedbackEl.className = 'math-feedback math-correct math-cheat-revealed';

    setTimeout(() => {
      this.onCorrect(true);
    }, 1100);
  }

  onCorrect(fromCheat = false) {
    this.isProcessing = true;
    const q = this.questions[this.currentQuestion];
    const isFinal = this.currentQuestion === this.questions.length - 1;

    // Reveal letter in slot
    this.solvedLetters[this.currentQuestion] = q.letter;
    const activeSlot = this.slots[this.currentQuestion];
    if (activeSlot) {
      activeSlot.textContent = q.letter;
      activeSlot.classList.remove('slot-active');
      activeSlot.classList.add('slot-solved');
    }

    this.feedbackEl.textContent = `${q.answer} → ${q.letter}`;
    this.feedbackEl.className = 'math-feedback math-correct prison-correct';

    if (isFinal) {
      this.isCompleted = true;
      // All 6 solved: show DRAINE & "That's her name."
      setTimeout(() => {
        this.equationEl.textContent = 'D  R  A  I  N  E';
        this.equationEl.classList.add('draine-glow');
        this.feedbackEl.textContent = getLanguage() === 'en' ? "That's her name." : "Itu namanya.";
        this.feedbackEl.className = 'math-feedback prison-reveal-name';
        this.submitBtn.style.display = 'none';
        this.inputEl.style.display = 'none';

        setTimeout(() => {
          this.close();
          if (this.onComplete) {
            this.onComplete();
          }
        }, 2200);
      }, 700);
    } else {
      setTimeout(() => {
        this.currentQuestion++;
        this.showQuestion(this.currentQuestion);
        this.isProcessing = false;
      }, 750);
    }
  }

  onWrong() {
    this.feedbackEl.textContent = getLanguage() === 'en' ? 'Incorrect symbol.' : 'Jawaban salah, coba lagi!';
    this.feedbackEl.className = 'math-feedback math-wrong';

    this.inputEl.classList.remove('input-shake');
    void this.inputEl.offsetWidth;
    this.inputEl.classList.add('input-shake');
    this.inputEl.value = '';

    setTimeout(() => {
      this.inputEl.focus();
    }, 50);
  }
}
