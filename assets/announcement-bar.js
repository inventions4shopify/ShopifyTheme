class AnnouncementBar extends HTMLElement {
  connectedCallback() {
    if (this._initialized) return;

    this.slider = this.querySelector('.announcement-slides');
    if (!this.slider) return;

    const slides = this.querySelectorAll('.announcement-slide');
    if (slides.length === 0) return;

    this._initialized = true;
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    this.nextBtn = this.querySelector('.announcement-arrow.next');
    this.prevBtn = this.querySelector('.announcement-arrow.prev');

    const firstClone = slides[0].cloneNode(true);
    const lastClone = slides[slides.length - 1].cloneNode(true);

    this.slider.appendChild(firstClone);
    this.slider.insertBefore(lastClone, slides[0]);

    this.slides = this.querySelectorAll('.announcement-slide');
    this.firstClone = firstClone;
    this.lastClone = lastClone;

    this.currentSlide = 1;
    this.totalSlides = this.slides.length;
    this.isAnimating = false;
    this.isDragging = false;
    this.startX = 0;
    this.currentTranslate = 0;

    this.slider.style.transform = `translateX(-${this.currentSlide * 100}%)`;

    this.onNextClick = () => {
      if (this.isAnimating) return;
      this.currentSlide++;
      this.updateSlider();
    };

    this.onPrevClick = () => {
      if (this.isAnimating) return;
      this.currentSlide--;
      this.updateSlider();
    };

    this.onTransitionEnd = () => {
      if (this.slides[this.currentSlide] === this.firstClone) {
        this.currentSlide = 1;
        this.updateSlider(false);
      }

      if (this.slides[this.currentSlide] === this.lastClone) {
        this.currentSlide = this.totalSlides - 2;
        this.updateSlider(false);
      }

      this.isAnimating = false;
    };

    this.dragStart = (event) => {
      if (this.isAnimating) return;

      this.isDragging = true;
      this.startX = this.getPositionX(event);
      this.slider.classList.add('dragging');
      this.currentTranslate = -this.currentSlide * this.slider.offsetWidth;
    };

    this.dragMove = (event) => {
      if (!this.isDragging) return;

      const diff = this.getPositionX(event) - this.startX;

      this.slider.style.transition = 'none';
      this.slider.style.transform = `translateX(${this.currentTranslate + diff}px)`;
    };

    this.dragEnd = (event) => {
      if (!this.isDragging) return;

      this.isDragging = false;
      this.slider.classList.remove('dragging');

      const diff = this.getPositionX(event) - this.startX;

      if (Math.abs(diff) > 50) {
        this.currentSlide += diff < 0 ? 1 : -1;
      }

      this.updateSlider();
    };

    this.nextBtn?.addEventListener('click', this.onNextClick, { signal });
    this.prevBtn?.addEventListener('click', this.onPrevClick, { signal });
    this.slider.addEventListener('transitionend', this.onTransitionEnd, { signal });

    this.slider.addEventListener('touchstart', this.dragStart, { passive: true, signal });
    this.slider.addEventListener('touchmove', this.dragMove, { passive: true, signal });
    this.slider.addEventListener('touchend', this.dragEnd, { signal });
    this.slider.addEventListener('mousedown', this.dragStart, { signal });
    this.slider.addEventListener('mousemove', this.dragMove, { signal });
    this.slider.addEventListener('mouseup', this.dragEnd, { signal });
    this.slider.addEventListener('mouseleave', this.dragEnd, { signal });

    if (this.dataset.autoRotate === 'true') {
      const timing = parseInt(this.dataset.timing || '5', 10) * 1000;

      this.autoRotateInterval = setInterval(() => {
        if (this.isAnimating || this.isDragging) return;
        this.currentSlide++;
        this.updateSlider();
      }, timing);
    }
  }

  disconnectedCallback() {
    this._initialized = false;
    clearInterval(this.autoRotateInterval);
    this.abortController?.abort();
  }

  getPositionX(event) {
    if (event.type.includes('mouse')) {
      return event.pageX;
    }

    if (event.touches?.length > 0) {
      return event.touches[0].clientX;
    }

    if (event.changedTouches?.length > 0) {
      return event.changedTouches[0].clientX;
    }

    return 0;
  }

  updateSlider(withTransition = true) {
    if (withTransition) {
      this.isAnimating = true;
    }

    this.slider.style.transition = withTransition ? 'transform 0.5s ease' : 'none';
    this.slider.style.transform = `translateX(-${this.currentSlide * 100}%)`;
  }
}

if (!customElements.get('announcement-bar')) {
  customElements.define('announcement-bar', AnnouncementBar);
}
