class AfterBeforeSection extends HTMLElement {
  connectedCallback() {
    if (this._initialized) return;
    this._initialized = true;

    this.abortController = new AbortController();
    const { signal } = this.abortController;

    this.slider = this.querySelector('.slider-range');
    this.beforeWrapper = this.querySelector('.before-image-wrapper');
    this.dividerLine = this.querySelector('.divider-line');
    this.handle = this.querySelector('.divider-handle');

    if (!this.slider || !this.beforeWrapper || !this.dividerLine || !this.handle) return;

    this.updateSlider(this.slider.value);

    this.slider.addEventListener('input', () => {
      this.updateSlider(this.slider.value);
    }, { signal });
  }

  disconnectedCallback() {
    this._initialized = false;
    this.abortController?.abort();
  }

  updateSlider(value) {
    this.beforeWrapper.style.width = value + '%';
    this.dividerLine.style.left = value + '%';
    this.handle.style.left = value + '%';
  }
}

if (!customElements.get('after-before-section')) {
  customElements.define('after-before-section', AfterBeforeSection);
}
