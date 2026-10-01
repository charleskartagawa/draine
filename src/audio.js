/**
 * AudioManager — Handles background music playback and smooth crossfades
 * for opening and Chapters 1 to 4.
 */

const TRACKS = {
  opening: '/models/opening game.mp3',
  chapter1: '/models/chapter 1.mp3',
  chapter2: '/models/chapter 2.mp3',
  chapter3: '/models/chapter 3.mp3',
  chapter4: '/models/chapter 4.mp3'
};

export class AudioManager {
  constructor() {
    this.currentKey = null;
    this.currentAudio = null;
    this.fadeInterval = null;
    this.isMuted = false;
    this.masterVolume = 0.65;
    this.hasUserInteracted = false;
    this.pendingTrack = null;

    this.createMuteButton();
    this.setupUserUnlock();
  }

  setupUserUnlock() {
    const unlock = () => {
      if (this.hasUserInteracted) return;
      this.hasUserInteracted = true;

      // Remove one-time unlock listeners
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);

      // Play pending track if queued before user gesture
      if (this.pendingTrack) {
        const track = this.pendingTrack;
        this.pendingTrack = null;
        this.playTrack(track);
      }
    };

    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
  }

  createMuteButton() {
    this.btn = document.createElement('button');
    this.btn.id = 'sound-toggle-btn';
    this.btn.className = 'sound-toggle-btn';
    this.btn.setAttribute('aria-label', 'Toggle Sound');
    this.btn.innerHTML = `<span class="sound-icon">🔊</span>`;
    document.body.appendChild(this.btn);

    const toggle = (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.toggleMute();
    };

    this.btn.addEventListener('click', toggle);
    this.btn.addEventListener('touchstart', toggle, { passive: false });
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    const icon = this.btn.querySelector('.sound-icon');

    if (this.isMuted) {
      if (this.currentAudio) {
        this.currentAudio.volume = 0;
      }
      this.btn.classList.add('muted');
      if (icon) icon.textContent = '🔇';
    } else {
      if (this.currentAudio) {
        this.currentAudio.volume = this.masterVolume;
      }
      this.btn.classList.remove('muted');
      if (icon) icon.textContent = '🔊';

      // If user unmuted and nothing is currently playing, start current track
      if (this.currentAudio && this.currentAudio.paused) {
        this.currentAudio.play().catch(() => {});
      }
    }
  }

  playTrack(key, fadeDuration = 1200) {
    if (!TRACKS[key]) return;
    if (this.currentKey === key && this.currentAudio && !this.currentAudio.paused) {
      return; // Already playing this track
    }

    if (!this.hasUserInteracted) {
      this.pendingTrack = key;
      return;
    }

    this.currentKey = key;
    const nextSrc = encodeURI(TRACKS[key]);
    const nextAudio = new Audio(nextSrc);
    nextAudio.loop = true;
    nextAudio.volume = 0;

    const prevAudio = this.currentAudio;
    this.currentAudio = nextAudio;

    const playPromise = nextAudio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.crossfade(prevAudio, nextAudio, fadeDuration);
        })
        .catch((err) => {
          console.warn('[AudioManager] Play blocked by browser policy:', err);
          this.pendingTrack = key;
        });
    }
  }

  crossfade(prevAudio, nextAudio, duration = 1200) {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    const steps = 24;
    const stepTime = duration / steps;
    let step = 0;
    const targetVolume = this.isMuted ? 0 : this.masterVolume;

    this.fadeInterval = setInterval(() => {
      step++;
      const progress = Math.min(1, step / steps);

      if (!this.isMuted) {
        nextAudio.volume = targetVolume * progress;
        if (prevAudio) {
          prevAudio.volume = Math.max(0, targetVolume * (1 - progress));
        }
      }

      if (progress >= 1) {
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;
        if (prevAudio) {
          prevAudio.pause();
          prevAudio.src = '';
        }
      }
    }, stepTime);
  }

  stopTrack(duration = 800) {
    if (!this.currentAudio) return;
    const audio = this.currentAudio;
    this.currentAudio = null;
    this.currentKey = null;

    const steps = 16;
    const stepTime = duration / steps;
    const startVol = audio.volume;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      const progress = Math.min(1, step / steps);
      audio.volume = Math.max(0, startVol * (1 - progress));

      if (progress >= 1) {
        clearInterval(interval);
        audio.pause();
        audio.src = '';
      }
    }, stepTime);
  }
}
