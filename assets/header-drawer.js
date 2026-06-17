class HeaderDrawer extends HTMLElement {
  connectedCallback() {
    if (this._initialized) return;
    this._initialized = true;

    this.openBtn = this.querySelector('[data-dm-open]');
    this.panels = this.querySelectorAll('[data-dm-panel]');

    this.abortController = new AbortController();
    const { signal } = this.abortController;

    if (this.openBtn) {
      this.openBtn.addEventListener('click', () => this.open(), { signal });
    }

    this.querySelectorAll('[data-dm-close]').forEach((btn) => {
      btn.addEventListener('click', () => this.close(), { signal });
    });

    this.querySelectorAll('[data-dm-to]').forEach((btn) => {
      btn.addEventListener('click', () => this.goTo(btn.getAttribute('data-dm-to')), { signal });
    });

    this.querySelectorAll('[data-dm-back]').forEach((btn) => {
      btn.addEventListener('click', () => this.goTo(btn.getAttribute('data-dm-back')), { signal });
    });

    this._onKey = (e) => {
      if (e.key === 'Escape') this.close();
    };
    document.addEventListener('keydown', this._onKey, { signal });
  }

  disconnectedCallback() {
    this._initialized = false;
    this.abortController?.abort();
    clearTimeout(this._resetTimeout);
  }

  open() {
    this.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    if (this.openBtn) this.openBtn.setAttribute('aria-expanded', 'true');
  }

  close() {
    this.classList.remove('is-open');
    document.body.style.overflow = '';
    if (this.openBtn) this.openBtn.setAttribute('aria-expanded', 'false');
    clearTimeout(this._resetTimeout);
    this._resetTimeout = setTimeout(() => this.reset(), 280);
  }

  reset() {
    this.panels.forEach((panel) => {
      if (panel.getAttribute('data-dm-panel') !== 'root') {
        panel.classList.remove('is-active');
      }
    });
  }

  goTo(id) {
    this.panels.forEach((panel) => {
      const name = panel.getAttribute('data-dm-panel');
      if (name === 'root') return;
      panel.classList.toggle('is-active', name === id);
    });
  }
}

if (!customElements.get('header-drawer')) {
  customElements.define('header-drawer', HeaderDrawer);
}
