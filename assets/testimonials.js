class TestimonialsSection extends HTMLElement {
  connectedCallback() {
    if (this._initialized) return;

    this.slider = this.querySelector('.testimonial-wrapper.is-slider');
    if (!this.slider) return;

    this._initialized = true;

    this.nextBtn = this.querySelector('.testimonial-next');
    this.prevBtn = this.querySelector('.testimonial-prev');

    this.autoplayEnabled = this.dataset.autoplay === 'true';
    this.autoplaySpeed =
      (parseInt(this.dataset.autoplaySpeed, 10) || 5) * 1000;

    this.slides = [...this.slider.querySelectorAll('.testimonial-card')];
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

    /* Buttons */
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

    /* Infinite scroll */
    this.onScroll = () => {
      if (
        this.currentIndex >= this.originalCount &&
        this.slider.scrollLeft >=
          this.originalCount * this.getScrollAmount() - 5
      ) {
        setTimeout(() => {
          this.currentIndex = 0;
          this.goToSlide(0, false);
        }, 400);
      }
    };

    /* Autoplay */
    this.onMouseEnter = () => this.stopAutoplay();
    this.onMouseLeave = () => this.startAutoplay();
    this.onTouchStart = () => this.stopAutoplay();
    this.onTouchEnd = () => this.startAutoplay();

    /* Mobile swipe */
    this.isDragging = false;
    this.startX = 0;
    this.currentX = 0;

    this.onPointerDown = (event) => {
      // Only handle touch / pen
      if (event.pointerType === 'mouse') return;

      this.isDragging = true;
      this.startX = event.clientX;
      this.currentX = event.clientX;

      this.stopAutoplay();
    };

    this.onPointerMove = (event) => {
      if (!this.isDragging) return;

      this.currentX = event.clientX;
    };

    this.onPointerUp = (event) => {
      if (!this.isDragging) return;

      this.isDragging = false;

      const endX = event.clientX;
      const diff = this.startX - endX;

      // Minimum swipe distance
      const swipeThreshold = 50;

      if (Math.abs(diff) < swipeThreshold) {
        this.startAutoplay();
        return;
      }

      if (diff > 0) {
        // Swipe left → next
        this.currentIndex++;
      } else {
        // Swipe right → previous
        if (this.currentIndex > 0) {
          this.currentIndex--;
        }
      }

      this.goToSlide(this.currentIndex);

      this.startAutoplay();
    };

    this.nextBtn?.addEventListener('click', this.onNextClick, { signal });
    this.prevBtn?.addEventListener('click', this.onPrevClick, { signal });

    this.slider.addEventListener('scroll', this.onScroll, { signal });

    /* Pointer events for mobile */
    this.slider.addEventListener('pointerdown', this.onPointerDown, {
      passive: true,
      signal,
    });

    this.slider.addEventListener('pointermove', this.onPointerMove, {
      passive: true,
      signal,
    });

    this.slider.addEventListener('pointerup', this.onPointerUp, {
      passive: true,
      signal,
    });

    this.slider.addEventListener('pointercancel', this.onPointerUp, {
      passive: true,
      signal,
    });

    if (this.autoplayEnabled) {
      this.startAutoplay();

      this.slider.addEventListener('mouseenter', this.onMouseEnter, {
        signal,
      });

      this.slider.addEventListener('mouseleave', this.onMouseLeave, {
        signal,
      });

      this.slider.addEventListener('touchstart', this.onTouchStart, {
        passive: true,
        signal,
      });

      this.slider.addEventListener('touchend', this.onTouchEnd, {
        passive: true,
        signal,
      });
    }
  }

  disconnectedCallback() {
    this._initialized = false;
    this.abortController?.abort();
    this.stopAutoplay();
  }

  getScrollAmount() {
    const card = this.slider.querySelector('.testimonial-card');

    if (!card) return 300;

    const gap =
      parseFloat(getComputedStyle(this.slider).columnGap) ||
      parseFloat(getComputedStyle(this.slider).gap) ||
      20;

    return card.offsetWidth + gap;
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
    this.autoSlide = null;
  }
}

if (!customElements.get('testimonials-section')) {
  customElements.define(
    'testimonials-section',
    TestimonialsSection
  );
}