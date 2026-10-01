import { getLanguage, t } from './i18n.js';

export class MathPuzzle {
  constructor(onComplete) {
    this.onComplete = onComplete;
    this.currentQuestion = 0;
    this.answers = ['4', '9', '1'];
    this.isOpen = false;
    this.isProcessing = false;

    this.questions = [
      {
        display: 'ln(e⁴)',
        answer: '4',
        hint: 'ln(e^n) = n'
      },
      {
        display: '√81',
        answer: '9',
        hint: '? × ? = 81'
      },
      {
        display: '∫₀^∞ e⁻ˣ dx',
        answer: '1',
        hint: 'Improper integral of e^(-x)'
      }
    ];

    this.createUI();
  }

  createUI() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'math-puzzle-overlay';
    this.overlay.className = 'math-puzzle-overlay hidden';
    this.overlay.innerHTML = `
      <div class="math-puzzle-frame">
        <div class="math-puzzle-header">
          <span class="math-puzzle-label" id="math-header-label">THE GATEKEEPER'S TRIAL</span>
          <span class="math-puzzle-progress"><span id="math-progress-word">QUESTION</span> <span id="math-q-num">1</span> / 3</span>
        </div>
        <div class="math-puzzle-divider"></div>
        <div class="math-puzzle-body">
          <div class="math-equation" id="math-equation">ln(e⁴) = ?</div>
          <div class="math-input-row">
            <input
              type="text"
              id="math-input"
              class="math-input"
              placeholder="Jawaban"
              maxlength="30"
              autocomplete="off"
              spellcheck="false"
            />
            <button id="math-submit-btn" class="math-submit-btn" type="button">Confirm</button>
          </div>
          <div id="math-feedback" class="math-feedback"></div>

          <!-- Non-clickable hint box so player must manually type "charles ganteng" -->
          <div id="math-cheat-hint" class="math-cheat-hint">
            Gatau jawabannya? Ketik "charles ganteng"
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(this.overlay);

    this.headerLabelEl = this.overlay.querySelector('#math-header-label');
    this.progressWordEl = this.overlay.querySelector('#math-progress-word');
    this.inputEl = this.overlay.querySelector('#math-input');
    this.equationEl = this.overlay.querySelector('#math-equation');
    this.feedbackEl = this.overlay.querySelector('#math-feedback');
    this.qNumEl = this.overlay.querySelector('#math-q-num');
    this.submitBtn = this.overlay.querySelector('#math-submit-btn');
    this.cheatHintEl = this.overlay.querySelector('#math-cheat-hint');

    // Keyboard submit
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
      this.headerLabelEl.textContent = isEn ? "THE GATEKEEPER'S TRIAL" : "UJIAN PENJAGA GERBANG";
    }
    if (this.progressWordEl) {
      this.progressWordEl.textContent = isEn ? "QUESTION" : "PERTANYAAN";
    }
    if (this.submitBtn) {
      this.submitBtn.textContent = isEn ? "Confirm" : "Kirim";
    }
    if (this.inputEl) {
      this.inputEl.placeholder = isEn ? "Answer" : "Jawaban";
    }
    if (this.cheatHintEl) {
      this.cheatHintEl.textContent = isEn
        ? 'Don\'t know the answer? Type "charles ganteng"'
        : 'Gatau jawabannya? Ketik "charles ganteng"';
    }
  }

  open() {
    this.currentQuestion = 0;
    this.isOpen = true;
    this.isProcessing = false;
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
    this.feedbackEl.className = 'math-feedback';

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
    this.feedbackEl.textContent = `${prefix}: ${q.answer} ✨`;
    this.feedbackEl.className = 'math-feedback math-correct math-cheat-revealed';

    setTimeout(() => {
      this.onCorrect(true);
    }, 1100);
  }

  onCorrect(fromCheat = false) {
    this.isProcessing = true;
    const isLast = this.currentQuestion === this.questions.length - 1;

    this.feedbackEl.textContent = getLanguage() === 'en' ? 'Correct.' : 'Benar!';
    this.feedbackEl.className = 'math-feedback math-correct';

    if (isLast) {
      setTimeout(() => {
        this.close();
        if (this.onComplete) this.onComplete();
      }, 1200);
    } else {
      setTimeout(() => {
        this.currentQuestion++;
        this.showQuestion(this.currentQuestion);
        this.isProcessing = false;
      }, 900);
    }
  }

  onWrong() {
    this.feedbackEl.textContent = getLanguage() === 'en' ? 'Try again.' : 'Coba lagi!';
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
