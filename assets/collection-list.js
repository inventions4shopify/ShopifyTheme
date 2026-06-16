class CollectionListSection extends HTMLElement {
  connectedCallback() {
    if (this._initialized) return;

    this.slider = this.querySelector('.collection-grid.is-slider');
    if (!this.slider) return;

    this._initialized = true;

    this.nextBtn = this.querySelector('.collection-grid-next');
    this.prevBtn = this.querySelector('.collection-grid-prev');

    this.autoplayEnabled = this.dataset.autoplay === 'true';
    this.autoplaySpeed = (parseInt(this.dataset.autoplaySpeed, 10) || 5) * 1000;

    this.slides = [...this.slider.querySelectorAll('.collection-card')];
    if (!this.slides.length) return;

    this.slides.forEach((slide) => {
      const clone = slide.cloneNode(true);
      clone.classList.add('clone');
      this.slider.appendChild(clone);
    });

    this.currentIndex = 0;
    this.originalCount = this.slides.length;

    this.abortController = new AbortController();
    const { signal } = this.abortController;

    this.onNextClick = () => {
      this.currentIndex++;
      this.goToSlide(this.currentIndex);
    };

    this.onPrevClick = () => {
      if (this.currentIndex > 0) {
        this.currentIndex--;
        this.goToSlide(this.currentIndex);
      }
    };

    this.onScroll = () => {
      if (
        this.currentIndex >= this.originalCount &&
        this.slider.scrollLeft >= this.originalCount * this.getScrollAmount() - 5
      ) {
        setTimeout(() => {
          this.currentIndex = 0;
          this.goToSlide(0, false);
        }, 400);
      }
    };

    this.onMouseEnter = () => this.stopAutoplay();
    this.onMouseLeave = () => this.startAutoplay();
    this.onTouchStart = () => this.stopAutoplay();
    this.onTouchEnd = () => this.startAutoplay();

    this.nextBtn?.addEventListener('click', this.onNextClick, { signal });
    this.prevBtn?.addEventListener('click', this.onPrevClick, { signal });
    this.slider.addEventListener('scroll', this.onScroll, { signal });

    if (this.autoplayEnabled) {
      this.startAutoplay();
      this.slider.addEventListener('mouseenter', this.onMouseEnter, { signal });
      this.slider.addEventListener('mouseleave', this.onMouseLeave, { signal });
      this.slider.addEventListener('touchstart', this.onTouchStart, { passive: true, signal });
      this.slider.addEventListener('touchend', this.onTouchEnd, { passive: true, signal });
    }
  }

  disconnectedCallback() {
    this._initialized = false;
    this.abortController?.abort();
    this.stopAutoplay();
  }

  getScrollAmount() {
    const card = this.slider.querySelector('.collection-card');
    return card ? card.offsetWidth + 20 : 300;
  }

  goToSlide(index, smooth = true) {
    this.slider.scrollTo({
      left: index * this.getScrollAmount(),
      behavior: smooth ? 'smooth' : 'auto',
    });
  }

  startAutoplay() {
    if (!this.autoplayEnabled) return;

    this.stopAutoplay();

    this.autoSlide = setInterval(() => {
      this.currentIndex++;
      this.goToSlide(this.currentIndex);
    }, this.autoplaySpeed);
  }

  stopAutoplay() {
    clearInterval(this.autoSlide);
  }
}

if (!customElements.get('collection-list-section')) {
  customElements.define('collection-list-section', CollectionListSection);
}
