class MarqueeSection extends HTMLElement {
  connectedCallback() {
    if (this._initialized) return;

    this.track = this.querySelector('.marquee-track');
    if (!this.track) return;

    this._initialized = true;

    [...this.track.children].forEach((item) => {
      this.track.appendChild(item.cloneNode(true));
    });

    this.position = 0;
    this.speed = 1;
    this.animationFrame = null;

    this.abortController = new AbortController();
    const { signal } = this.abortController;

    this.animate = () => {
      this.position -= this.speed;
      if (Math.abs(this.position) >= this.track.scrollWidth / 2) {
        this.position = 0;
      }
      this.track.style.transform = `translateX(${this.position}px)`;
      this.animationFrame = requestAnimationFrame(this.animate);
    };

    this.onMouseEnter = () => {
      cancelAnimationFrame(this.animationFrame);
    };

    this.onMouseLeave = () => {
      this.animate();
    };

    this.animate();

    this.track.addEventListener('mouseenter', this.onMouseEnter, { signal });
    this.track.addEventListener('mouseleave', this.onMouseLeave, { signal });
  }

  disconnectedCallback() {
    this._initialized = false;
    cancelAnimationFrame(this.animationFrame);
    this.abortController?.abort();
  }
}

if (!customElements.get('marquee-section')) {
  customElements.define('marquee-section', MarqueeSection);
}
