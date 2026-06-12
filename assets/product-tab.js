class ProductTabSection extends HTMLElement {
  connectedCallback() {
    if (this._initialized) return;
    this._initialized = true;

    this.tabs = this.querySelectorAll('.product-tab__tab');
    this.panes = this.querySelectorAll('.product-tab__pane');
    this.prevBtn = this.querySelector('.js-slider-prev');
    this.nextBtn = this.querySelector('.js-slider-next');

    this.abortController = new AbortController();
    const { signal } = this.abortController;

    this.isDown = false;
    this.startX = 0;
    this.slider = null;
    this.moved = 0;

    this.tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-tab');

        this.tabs.forEach((t) => t.classList.remove('active'));
        this.panes.forEach((p) => p.classList.remove('active'));

        tab.classList.add('active');
        this.querySelector(`.product-tab__pane[data-tab="${target}"]`)?.classList.add('active');
      }, { signal });
    });

    if (this.tabs.length > 0) {
      this.tabs[0].click();
    }

    this.onNextClick = () => {
      const slider = this.getActiveSlider();
      if (!slider) return;

      slider.scrollBy({
        left: this.getSlideWidth(slider),
        behavior: 'smooth',
      });
    };

    this.onPrevClick = () => {
      const slider = this.getActiveSlider();
      if (!slider) return;

      slider.scrollBy({
        left: -this.getSlideWidth(slider),
        behavior: 'smooth',
      });
    };

    this.onMouseDown = (e) => {
      this.slider = this.getActiveSlider();
      if (!this.slider) return;

      this.isDown = true;
      this.startX = e.pageX;
      this.moved = 0;
      this.slider.style.scrollBehavior = 'auto';
    };

    this.onMouseMove = (e) => {
      if (!this.isDown || !this.slider) return;
      this.moved = e.pageX - this.startX;
    };

    this.onMouseUp = () => {
      if (!this.isDown || !this.slider) return;

      this.isDown = false;

      const slideWidth = this.getSlideWidth(this.slider);

      if (Math.abs(this.moved) > 50) {
        if (this.moved < 0) {
          this.slider.scrollBy({ left: slideWidth, behavior: 'smooth' });
        } else {
          this.slider.scrollBy({ left: -slideWidth, behavior: 'smooth' });
        }
      }

      this.slider.style.scrollBehavior = 'smooth';
      this.slider = null;
    };

    this.nextBtn?.addEventListener('click', this.onNextClick, { signal });
    this.prevBtn?.addEventListener('click', this.onPrevClick, { signal });
    document.addEventListener('mousedown', this.onMouseDown, { signal });
    document.addEventListener('mousemove', this.onMouseMove, { signal });
    document.addEventListener('mouseup', this.onMouseUp, { signal });
  }

  disconnectedCallback() {
    this._initialized = false;
    this.abortController?.abort();
  }

  getActiveSlider() {
    return this.querySelector('.product-tab__pane.active .js-product-slider');
  }

  getSlideWidth(slider) {
    const slide = slider.querySelector('.js-product-slide');
    if (!slide) return 300;

    const gap = parseInt(window.getComputedStyle(slider).gap || 0, 10);
    return slide.offsetWidth + gap;
  }
}

if (!customElements.get('product-tab-section')) {
  customElements.define('product-tab-section', ProductTabSection);
}
