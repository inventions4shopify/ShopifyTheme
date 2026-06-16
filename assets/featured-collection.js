const MOBILE_MQ = window.matchMedia('(max-width: 749px)');

class FeaturedCollectionSlider extends HTMLElement {
  connectedCallback() {
    if (this._initialized) return;

    this.track = this.querySelector('[data-fc-track]');
    if (!this.track) return;

    this._initialized = true;

    this.prev = this.querySelector('[data-fc-prev]');
    this.next = this.querySelector('[data-fc-next]');
    this.arrows = this.querySelector('[data-fc-arrows]');
    this.mode = this.dataset.fcMode || 'always';

    this.abortController = new AbortController();
    const { signal } = this.abortController;

    this.isDown = false;
    this.ticking = false;

    this.onPrevClick = () => {
      this.track.scrollBy({ left: -this.page(), behavior: 'smooth' });
    };

    this.onNextClick = () => {
      this.track.scrollBy({ left: this.page(), behavior: 'smooth' });
    };

    this.onScroll = () => {
      if (this.ticking) return;
      this.ticking = true;
      requestAnimationFrame(() => {
        this.updateArrows();
        this.ticking = false;
      });
    };

    this.onMouseDown = (e) => {
      if (!this.isActive()) return;
      this.isDown = true;
      this.startX = e.pageX;
      this.startScroll = this.track.scrollLeft;
      this.track.style.cursor = 'grabbing';
    };

    this.onMouseUp = () => {
      this.isDown = false;
      this.track.style.cursor = '';
    };

    this.onMouseMove = (e) => {
      if (!this.isDown) return;
      e.preventDefault();
      this.track.scrollLeft = this.startScroll - (e.pageX - this.startX);
    };

    this.onResize = () => {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        if (!this.isActive()) this.track.scrollLeft = 0;
        this.updateArrows();
      }, 150);
    };

    this.onMediaChange = () => {
      if (!this.isActive()) this.track.scrollLeft = 0;
      this.updateArrows();
    };

    this.prev?.addEventListener('click', this.onPrevClick, { signal });
    this.next?.addEventListener('click', this.onNextClick, { signal });
    this.track.addEventListener('scroll', this.onScroll, { signal });
    this.track.addEventListener('mousedown', this.onMouseDown, { signal });
    window.addEventListener('mouseup', this.onMouseUp, { signal });
    this.track.addEventListener('mousemove', this.onMouseMove, { signal });
    window.addEventListener('resize', this.onResize, { signal });

    if (this.mode === 'mobile') {
      if (MOBILE_MQ.addEventListener) {
        MOBILE_MQ.addEventListener('change', this.onMediaChange);
      } else if (MOBILE_MQ.addListener) {
        MOBILE_MQ.addListener(this.onMediaChange);
      }
    }

    this.updateArrows();
  }

  disconnectedCallback() {
    this._initialized = false;
    this.abortController?.abort();
    clearTimeout(this.resizeTimeout);

    if (this.mode === 'mobile') {
      if (MOBILE_MQ.removeEventListener) {
        MOBILE_MQ.removeEventListener('change', this.onMediaChange);
      } else if (MOBILE_MQ.removeListener) {
        MOBILE_MQ.removeListener(this.onMediaChange);
      }
    }
  }

  isActive() {
    if (this.mode === 'always') return true;
    return MOBILE_MQ.matches;
  }

  page() {
    return this.track.clientWidth;
  }

  updateArrows() {
    if (!this.isActive()) {
      if (this.arrows) this.arrows.style.display = 'none';
      return;
    }

    if (this.arrows) this.arrows.style.display = '';

    const max = this.track.scrollWidth - this.track.clientWidth - 1;
    if (this.prev) this.prev.disabled = this.track.scrollLeft <= 1;
    if (this.next) this.next.disabled = this.track.scrollLeft >= max;
  }
}

if (!customElements.get('featured-collection-slider')) {
  customElements.define('featured-collection-slider', FeaturedCollectionSlider);
}
