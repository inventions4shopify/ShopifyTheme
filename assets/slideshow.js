class SlideshowSection extends HTMLElement {
  connectedCallback() {
    if (this._initialized) return;
    this._initialized = true;

    this.slider = this.querySelector('.cms-slideshow-main');
    this.nextBtn = this.querySelector('.cms-slideshow-next');
    this.prevBtn = this.querySelector('.cms-slideshow-prev');
    this.dots = [...this.querySelectorAll('.cms-slideshow-dot button')];
    this.slides = [...this.querySelectorAll('.cms-slideshow-slide')];
    this.progressEl = this.querySelector('.cms-autoplay-progress');
    this.currentCounter = this.querySelector('.cms-current-slide');
    this.totalCounter = this.querySelector('.cms-total-slides');

    this.currentSlide = 0;
    this.totalSlides = this.slides.length;

    this.autoplayEnabled = this.dataset.autoplay === 'true';
    this.autoplayTime = (parseInt(this.dataset.autoplaySpeed, 10) || 4) * 1000;

    this.autoplayTimeout = null;
    this.progressAnimation = null;
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    this.onNextClick = () => this.nextSlide();
    this.onPrevClick = () => this.prevSlide();
    this.dotHandlers = this.dots.map((dot, index) => () => this.goToSlide(index));
    this.onTouchStart = (e) => {
      this.startX = e.touches[0].clientX;
      this.endX = this.startX;
    };
    this.onTouchMove = (e) => {
      this.endX = e.touches[0].clientX;
    };
    this.onTouchEnd = () => {
      const diff = this.startX - this.endX;
      if (diff > 50) this.nextSlide();
      if (diff < -50) this.prevSlide();
    };

    if (!this.totalSlides) return;

    if (this.totalCounter) {
      this.totalCounter.textContent = String(this.totalSlides).padStart(2, '0');
    }

    this.nextBtn?.addEventListener('click', this.onNextClick, { signal });
    this.prevBtn?.addEventListener('click', this.onPrevClick, { signal });
    this.dots.forEach((dot, index) => {
      dot.addEventListener('click', this.dotHandlers[index], { signal });
    });
    this.slider?.addEventListener('touchstart', this.onTouchStart, { signal });
    this.slider?.addEventListener('touchmove', this.onTouchMove, { signal });
    this.slider?.addEventListener('touchend', this.onTouchEnd, { signal });

    this.updateSlides();
    this.updateCounter();

    if (this.autoplayEnabled) {
      this.startAutoplay();
    }
  }

  disconnectedCallback() {
    this._initialized = false;
    this.abortController?.abort();
    clearTimeout(this.autoplayTimeout);
    cancelAnimationFrame(this.progressAnimation);
  }

  setProgress(deg) {
    if (!this.progressEl) return;
    this.progressEl.style.setProperty('--progress', deg + 'deg');
  }

  startProgressBar() {
    if (!this.progressEl) return;

    const start = performance.now();

    const animate = (now) => {
      const elapsed = now - start;
      const percent = Math.min(elapsed / this.autoplayTime, 1);

      this.setProgress(percent * 360);

      if (percent < 1) {
        this.progressAnimation = requestAnimationFrame(animate);
      }
    };

    this.progressAnimation = requestAnimationFrame(animate);
  }

  resetProgress() {
    cancelAnimationFrame(this.progressAnimation);
    this.setProgress(0);
  }

  updateCounter() {
    if (this.currentCounter) {
      this.currentCounter.textContent = String(this.currentSlide + 1).padStart(2, '0');
    }
  }

  updateSlides(direction = 'next') {
    this.slides.forEach((slide, index) => {
      slide.classList.remove(
        'active',
        'slide-out-left',
        'slide-out-right',
        'slide-in-right',
        'slide-in-left'
      );

      if (index === this.currentSlide) {
        slide.classList.add('active');
        slide.classList.add(direction === 'next' ? 'slide-in-right' : 'slide-in-left');
      } else {
        slide.classList.add(direction === 'next' ? 'slide-out-left' : 'slide-out-right');
      }
    });

    this.dots.forEach((dot) => dot.classList.remove('active'));

    if (this.dots[this.currentSlide]) {
      this.dots[this.currentSlide].classList.add('active');
    }

    if (this.prevBtn) {
      const atStart = this.currentSlide === 0 && !this.autoplayEnabled;
      this.prevBtn.disabled = atStart;
      this.prevBtn.classList.toggle('disabled', atStart);
    }

    if (this.nextBtn) {
      const atEnd = this.currentSlide === this.totalSlides - 1 && !this.autoplayEnabled;
      this.nextBtn.disabled = atEnd;
      this.nextBtn.classList.toggle('disabled', atEnd);
    }
  }

  startAutoplay() {
    clearTimeout(this.autoplayTimeout);

    this.resetProgress();
    this.startProgressBar();

    this.autoplayTimeout = setTimeout(() => {
      if (this.currentSlide < this.totalSlides - 1) {
        this.currentSlide++;
        this.updateSlides('next');
      } else {
        this.currentSlide = 0;
        this.updateSlides('next');
      }

      this.updateCounter();

      if (this.autoplayEnabled) {
        this.startAutoplay();
      }
    }, this.autoplayTime);
  }

  nextSlide() {
    if (this.currentSlide >= this.totalSlides - 1) {
      if (this.autoplayEnabled) {
        this.currentSlide = 0;
      } else {
        return;
      }
    } else {
      this.currentSlide++;
    }

    this.updateSlides('next');
    this.updateCounter();

    if (this.autoplayEnabled) this.startAutoplay();
  }

  prevSlide() {
    if (this.currentSlide <= 0) {
      if (this.autoplayEnabled) {
        this.currentSlide = this.totalSlides - 1;
      } else {
        return;
      }
    } else {
      this.currentSlide--;
    }

    this.updateSlides('prev');
    this.updateCounter();

    if (this.autoplayEnabled) this.startAutoplay();
  }

  goToSlide(index) {
    if (index === this.currentSlide) return;

    const direction = index > this.currentSlide ? 'next' : 'prev';

    this.currentSlide = index;
    this.updateSlides(direction);
    this.updateCounter();

    if (this.autoplayEnabled) this.startAutoplay();
  }
}

if (!customElements.get('slideshow-section')) {
  customElements.define('slideshow-section', SlideshowSection);
}
