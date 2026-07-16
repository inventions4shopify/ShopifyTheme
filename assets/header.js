class SiteHeader extends HTMLElement {
  connectedCallback() {
    if (this._initialized) return;
    this._initialized = true;

    this.mode = this.dataset.sticky || 'none';
    this.host = this.closest('.shopify-section') || this;

    this.updateHeaderHeight = () => {
      if (this.mode === 'none' || this.classList.contains('is-hidden')) {
        document.documentElement.style.setProperty('--tps-header-height', '0px');
        return;
      }

      document.documentElement.style.setProperty('--tps-header-height', `${this.offsetHeight}px`);
    };

    if (this.mode !== 'none') {
      this.host.classList.add('header-sticky-host');
      this.updateHeaderHeight();

      this.abortController = new AbortController();
      const { signal } = this.abortController;

      window.addEventListener('resize', this.updateHeaderHeight, { passive: true, signal });

      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => this.updateHeaderHeight());
        this.resizeObserver.observe(this);
      }
    } else {
      document.documentElement.style.setProperty('--tps-header-height', '0px');
    }

    if (this.mode !== 'reduce' && this.mode !== 'scroll-up') return;

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
      this.updateHeaderHeight();
    };

    window.addEventListener('scroll', this.onScroll, { passive: true, signal: this.abortController.signal });
  }

  disconnectedCallback() {
    this._initialized = false;
    this.abortController?.abort();
    this.resizeObserver?.disconnect();
  }
}

if (!customElements.get('site-header')) {
  customElements.define('site-header', SiteHeader);
}

class HeaderSearch extends HTMLElement {
  connectedCallback() {
    if (this._initialized) return;
    this._initialized = true;

    this.modal = this.querySelector('[data-search-modal]');
    this.openBtn = this.querySelector('[data-search-open]');
    this.input = this.querySelector('input[type="search"]');

    if (this.openBtn) {
      this.openBtn.addEventListener('click', () => this.open());
    }

    this.querySelectorAll('[data-search-close]').forEach((btn) => {
      btn.addEventListener('click', () => this.close());
    });

    this._onKey = (event) => {
      if (event.key === 'Escape') this.close();
    };
  }

  open() {
    if (!this.modal) return;
    this.modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    if (this.openBtn) this.openBtn.setAttribute('aria-expanded', 'true');
    document.addEventListener('keydown', this._onKey);
    setTimeout(() => {
      if (this.input) this.input.focus();
    }, 120);
  }

  close() {
    if (!this.modal) return;
    this.modal.classList.remove('is-open');
    document.body.style.overflow = '';
    if (this.openBtn) this.openBtn.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', this._onKey);
  }

  disconnectedCallback() {
    this._initialized = false;
    document.removeEventListener('keydown', this._onKey);
  }
}

if (!customElements.get('header-search')) {
  customElements.define('header-search', HeaderSearch);
}
