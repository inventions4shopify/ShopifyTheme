class SiteHeader extends HTMLElement {
  connectedCallback() {
    if (this._initialized) return;
    this._initialized = true;

    this.mode = this.dataset.sticky || 'none';
    this.host = this.closest('.shopify-section') || this;

    if (this.mode !== 'none') {
      this.host.classList.add('header-sticky-host');
    }

    if (this.mode !== 'reduce' && this.mode !== 'scroll-up') return;

    this.abortController = new AbortController();
    const { signal } = this.abortController;
    this.lastY = window.pageYOffset;

    this.onScroll = () => {
      const y = window.pageYOffset;

      if (this.mode === 'reduce') {
        this.classList.toggle('is-scrolled', y > 50);
      }

      if (this.mode === 'scroll-up') {
        if (y > this.lastY && y > 100) {
          this.classList.add('is-hidden');
        } else {
          this.classList.remove('is-hidden');
        }
      }

      this.lastY = y;
    };

    window.addEventListener('scroll', this.onScroll, { passive: true, signal });
  }

  disconnectedCallback() {
    this._initialized = false;
    this.abortController?.abort();
  }
}

if (!customElements.get('site-header')) {
  customElements.define('site-header', SiteHeader);
}
