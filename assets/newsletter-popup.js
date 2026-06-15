class NewsletterPopupSection extends HTMLElement {
  connectedCallback() {
    if (this._initialized) return;
    this._initialized = true;

    this.popup = this.querySelector('[data-newsletter-popup]');
    this.overlay = this.querySelector('[data-newsletter-overlay]');
    this.closeBtn = this.querySelector('[data-newsletter-close]');

    if (!this.popup || !this.overlay) return;

    this.abortController = new AbortController();
    const { signal } = this.abortController;

    this.showOnce = this.dataset.showOnce === 'true';
    this.sessionKey = `newsletter-popup-${this.dataset.sectionId}`;
    this.triggerType = this.dataset.triggerType || 'delay';

    this.onCloseClick = () => this.closePopup();
    this.closeBtn?.addEventListener('click', this.onCloseClick, { signal });
    this.overlay.addEventListener('click', this.onCloseClick, { signal });

    this.initTrigger(signal);
  }

  disconnectedCallback() {
    this._initialized = false;
    clearTimeout(this.delayTimeout);
    this.abortController?.abort();
  }

  shouldShow() {
    if (!this.showOnce) return true;
    return !sessionStorage.getItem(this.sessionKey);
  }

  markShown() {
    if (this.showOnce) {
      sessionStorage.setItem(this.sessionKey, 'true');
    }
  }

  openPopup() {
    if (!this.shouldShow()) return;
    this.popup.classList.add('active');
    this.overlay.classList.add('active');
    this.markShown();
  }

  closePopup() {
    this.popup.classList.remove('active');
    this.overlay.classList.remove('active');
  }

  initTrigger(signal) {
    switch (this.triggerType) {
      case 'delay':
        this.delayTimeout = setTimeout(
          () => this.openPopup(),
          parseInt(this.dataset.delay || '5000', 10)
        );
        break;

      case 'scroll':
        this.popupOpened = false;
        this.onScroll = () => {
          if (this.popupOpened) return;

          const docHeight = document.body.scrollHeight - window.innerHeight;
          const scrollPercent = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
          const threshold = parseInt(this.dataset.scrollPercentage || '40', 10);

          if (scrollPercent >= threshold) {
            this.openPopup();
            this.popupOpened = true;
          }
        };
        window.addEventListener('scroll', this.onScroll, { passive: true, signal });
        break;

      case 'exit':
        this.exitShown = false;
        this.onMouseLeave = (e) => {
          if (this.exitShown) return;
          if (e.clientY <= 0) {
            this.openPopup();
            this.exitShown = true;
          }
        };
        document.addEventListener('mouseleave', this.onMouseLeave, { signal });
        break;
    }
  }
}

if (!customElements.get('newsletter-popup-section')) {
  customElements.define('newsletter-popup-section', NewsletterPopupSection);
}
