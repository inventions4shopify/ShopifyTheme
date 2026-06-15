class VideoSection extends HTMLElement {
  connectedCallback() {
    if (this._initialized) return;

    this.video = this.querySelector('.custom-video-element');
    this.playBtn = this.querySelector('.custom-video-play-btn');

    if (!this.video || !this.playBtn) return;

    this._initialized = true;
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    this.syncPlayButton = () => {
      this.playBtn.classList.toggle('hidden', !this.video.paused && !this.video.ended);
    };

    if (this.video.autoplay) {
      this.playBtn.classList.add('hidden');
    } else {
      this.playBtn.classList.remove('hidden');
    }

    this.playBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.video.play().catch(() => {});
    }, { signal });

    this.video.addEventListener('click', () => {
      if (this.video.paused || this.video.ended) {
        this.video.play().catch(() => {});
      } else {
        this.video.pause();
      }
    }, { signal });

    this.video.addEventListener('play', this.syncPlayButton, { signal });
    this.video.addEventListener('pause', this.syncPlayButton, { signal });
    this.video.addEventListener('ended', this.syncPlayButton, { signal });
  }

  disconnectedCallback() {
    this._initialized = false;
    this.abortController?.abort();
  }
}

if (!customElements.get('video-section')) {
  customElements.define('video-section', VideoSection);
}
