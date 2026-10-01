import { getLanguage, t } from './i18n.js';

/**
 * GirlDayEnding — The emotional Girl Day reveal screen and final message.
 * Presented on a clean dark screen with sequential cinematic reveals.
 */
export class GirlDayEnding {
  constructor(onRestart) {
    this.onRestart = onRestart;
    this.createUI();
  }

  createUI() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'girlday-overlay';
    this.overlay.className = 'girlday-overlay hidden';
    this.overlay.innerHTML = `
      <div class="girlday-content" id="girlday-content">
        <!-- Stage 1: The Reveal -->
        <div class="girlday-stage" id="girlday-stage1">
          <div class="girlday-date" id="gd-date">01.10.2026</div>
          <div class="girlday-title" id="gd-title">HAPPY GIRL DAY</div>
          <div class="girlday-name" id="gd-name">DRAINE</div>
          <div class="girlday-from" id="gd-from">Dari Charles.</div>
          <button class="girlday-next-btn" id="gd-btn-read">Lanjut Baca &rarr;</button>
        </div>

        <!-- Stage 2: Final Personal Message -->
        <div class="girlday-stage hidden" id="girlday-stage2">
          <div class="girlday-letter" id="gd-letter">
            <p class="gd-line" id="gdl-1"></p>
            <p class="gd-line" id="gdl-2"></p>
            <p class="gd-line" id="gdl-3"></p>
            <p class="gd-line" id="gdl-4"></p>
            <p class="gd-line gd-highlight" id="gdl-5">Happy Girl Day, Draine.</p>
            <div class="gd-heart" id="gdl-heart">❤️</div>
          </div>
          <button class="girlday-restart-btn" id="gd-btn-restart">MAIN DARI AWAL</button>
        </div>
      </div>
    `;
    document.body.appendChild(this.overlay);

    this.stage1 = this.overlay.querySelector('#girlday-stage1');
    this.stage2 = this.overlay.querySelector('#girlday-stage2');
    this.btnRead = this.overlay.querySelector('#gd-btn-read');
    this.btnRestart = this.overlay.querySelector('#gd-btn-restart');

    // Stage 1 elements
    this.elDate = this.overlay.querySelector('#gd-date');
    this.elTitle = this.overlay.querySelector('#gd-title');
    this.elName = this.overlay.querySelector('#gd-name');
    this.elFrom = this.overlay.querySelector('#gd-from');

    // Stage 2 elements
    this.l1 = this.overlay.querySelector('#gdl-1');
    this.l2 = this.overlay.querySelector('#gdl-2');
    this.l3 = this.overlay.querySelector('#gdl-3');
    this.l4 = this.overlay.querySelector('#gdl-4');
    this.l5 = this.overlay.querySelector('#gdl-5');

    this.btnRead.addEventListener('click', () => {
      this.showStage2();
    });

    this.btnRestart.addEventListener('click', () => {
      this.close();
      if (this.onRestart) {
        this.onRestart();
      }
    });
  }

  updateTexts() {
    const isEn = getLanguage() === 'en';
    this.elFrom.textContent = isEn ? 'From Charles.' : 'Dari Charles.';
    this.btnRead.innerHTML = isEn ? 'Continue &rarr;' : 'Lanjut Baca &rarr;';
    this.btnRestart.textContent = isEn ? 'START OVER' : 'MAIN LAGI DARI AWAL';

    if (isEn) {
      this.l1.textContent = '"I could\'ve just said Happy Girl Day."';
      this.l2.textContent = '"But where\'s the fun in that?"';
      this.l3.textContent = '"So I made you solve your way through a garden, a forest, hell, and a prison..."';
      this.l4.textContent = '"...just so I could say one thing."';
      this.l5.textContent = 'Happy Girl Day, Draine.';
    } else {
      this.l1.textContent = '"Bisa aja sih aku cuma bilang Happy Girl\'s Day lewat chat."';
      this.l2.textContent = '"Tapi mana serunya kalau cuma gitu?"';
      this.l3.textContent = '"Makanya aku bikin kamu bertualang lewat taman, hutan, gerbang api, dan penjara kata..."';
      this.l4.textContent = '"...cuma buat bilang satu hal."';
      this.l5.textContent = 'Happy Girl Day, Draine.';
    }
  }

  show() {
    this.updateTexts();
    this.overlay.classList.remove('hidden');
    this.stage1.classList.remove('hidden');
    this.stage2.classList.add('hidden');

    // Reset opacities
    this.elDate.style.opacity = '0';
    this.elTitle.style.opacity = '0';
    this.elName.style.opacity = '0';
    this.elFrom.style.opacity = '0';
    this.btnRead.style.opacity = '0';

    // Cinematic step-by-step reveal
    setTimeout(() => {
      this.elDate.style.transition = 'opacity 1.2s ease';
      this.elDate.style.opacity = '1';
    }, 600);

    setTimeout(() => {
      this.elTitle.style.transition = 'opacity 1.4s ease';
      this.elTitle.style.opacity = '1';
    }, 1800);

    setTimeout(() => {
      this.elName.style.transition = 'opacity 1.6s ease, transform 1.6s ease';
      this.elName.style.opacity = '1';
    }, 3200);

    setTimeout(() => {
      this.elFrom.style.transition = 'opacity 1.2s ease';
      this.elFrom.style.opacity = '1';
    }, 4600);

    setTimeout(() => {
      this.btnRead.style.transition = 'opacity 1.0s ease';
      this.btnRead.style.opacity = '1';
    }, 5600);
  }

  showStage2() {
    this.stage1.classList.add('hidden');
    this.stage2.classList.remove('hidden');

    const lines = [
      this.l1,
      this.l2,
      this.l3,
      this.l4,
      this.l5,
      this.overlay.querySelector('#gdl-heart'),
      this.btnRestart
    ];

    lines.forEach((l) => {
      l.style.opacity = '0';
      l.style.transform = 'translateY(8px)';
    });

    // Animate lines sequentially with pauses
    const delays = [400, 1800, 3400, 5200, 6800, 7800, 8800];
    delays.forEach((delay, idx) => {
      setTimeout(() => {
        if (lines[idx]) {
          lines[idx].style.transition = 'opacity 1.2s ease, transform 1.2s ease';
          lines[idx].style.opacity = '1';
          lines[idx].style.transform = 'translateY(0)';
        }
      }, delay);
    });
  }

  close() {
    this.overlay.classList.add('hidden');
  }
}
