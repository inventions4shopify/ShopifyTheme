class VideoSliderSection extends HTMLElement {
  connectedCallback() {
    if (this._initialized) return;
    this._initialized = true;

    this.abortController = new AbortController();
    const { signal } = this.abortController;

    this.initSlider(signal);
    this.initVideoControls(signal);
  }

  disconnectedCallback() {
    this._initialized = false;
    this.abortController?.abort();
  }

  initSlider(signal) {
    this.slider = this.querySelector('.js-video-slider');
    if (!this.slider) return;

    this.prevBtn = this.querySelector('.video-slider__control--prev');
    this.nextBtn = this.querySelector('.video-slider__control--next');

    let slides = Array.from(this.slider.children);
    if (slides.length < 2) return;

    this.container = this.slider.parentElement;
    this.index = 3;
    this.startX = 0;
    this.isDragging = false;
    this.startTranslate = 0;
    this.currentTranslate = 0;
    this.slideWidth = slides[0].offsetWidth;

    const firstClone = slides[0].cloneNode(true);
    const lastClone = slides[slides.length - 1].cloneNode(true);

    this.slider.appendChild(firstClone);
    this.slider.insertBefore(lastClone, slides[0]);

    this.slides = Array.from(this.slider.children);

    this.onNextClick = () => this.next();
    this.onPrevClick = () => this.prev();

    this.onMouseDown = (e) => {
      this.isDragging = true;
      this.startX = e.clientX;
      this.startTranslate = this.currentTranslate;
      this.slider.style.transition = 'none';
    };

    this.onMouseMove = (e) => {
      if (!this.isDragging) return;

      const diff = e.clientX - this.startX;
      this.slider.style.transform = `translate3d(${this.startTranslate + diff}px,0,0)`;
    };

    this.onMouseUp = (e) => {
      if (!this.isDragging) return;

      const diff = e.clientX - this.startX;

      if (Math.abs(diff) > 50) {
        diff > 0 ? this.prev() : this.next();
      } else {
        this.update(true);
      }

      this.isDragging = false;
    };

    this.onMouseLeave = () => {
      this.isDragging = false;
      this.update(true);
    };

    this.onTouchStart = (e) => {
      this.startX = e.touches[0].clientX;
    };

    this.onTouchEnd = (e) => {
      const diff = this.startX - e.changedTouches[0].clientX;

      if (Math.abs(diff) > 50) {
        diff > 0 ? this.next() : this.prev();
      }
    };

    this.nextBtn?.addEventListener('click', this.onNextClick, { signal });
    this.prevBtn?.addEventListener('click', this.onPrevClick, { signal });
    this.slider.addEventListener('mousedown', this.onMouseDown, { signal });
    this.slider.addEventListener('mousemove', this.onMouseMove, { signal });
    this.slider.addEventListener('mouseup', this.onMouseUp, { signal });
    this.slider.addEventListener('mouseleave', this.onMouseLeave, { signal });
    this.slider.addEventListener('touchstart', this.onTouchStart, { passive: true, signal });
    this.slider.addEventListener('touchend', this.onTouchEnd, { passive: true, signal });

    this.update(false);
  }

  getTranslate() {
    const containerCenter = this.container.offsetWidth / 2;
    const centerOffset = containerCenter - this.slideWidth / 2;
    return -this.index * this.slideWidth + centerOffset;
  }

  apply(animate = true) {
    this.slider.style.transition = animate ? 'transform 0.5s ease' : 'none';
    this.currentTranslate = this.getTranslate();
    this.slider.style.transform = `translate3d(${this.currentTranslate}px,0,0)`;
  }

  updateClasses() {
    this.slides.forEach((slide) => {
      slide.classList.remove(
        'center-slide',
        'previous-slide',
        'next-slide',
        'prev-outer-slide',
        'next-outer-slide'
      );
    });

    const prev = this.index - 1;
    const next = this.index + 1;
    const prev2 = this.index - 2;
    const next2 = this.index + 2;

    if (this.slides[this.index]) this.slides[this.index].classList.add('center-slide');
    if (this.slides[prev]) this.slides[prev].classList.add('previous-slide');
    if (this.slides[next]) this.slides[next].classList.add('next-slide');
    if (this.slides[prev2]) this.slides[prev2].classList.add('prev-outer-slide');
    if (this.slides[next2]) this.slides[next2].classList.add('next-outer-slide');
  }

  updateButtons() {
    const realFirst = 0;
    const realLast = this.slides.length - 1;

    if (this.prevBtn) {
      if (this.index <= realFirst) {
        this.prevBtn.setAttribute('disabled', 'true');
      } else {
        this.prevBtn.removeAttribute('disabled');
      }
    }

    if (this.nextBtn) {
      if (this.index >= realLast) {
        this.nextBtn.setAttribute('disabled', 'true');
      } else {
        this.nextBtn.removeAttribute('disabled');
      }
    }
  }

  update(animate = true) {
    this.updateClasses();
    this.apply(animate);
    this.updateButtons();
  }

  next() {
    const max = this.slides.length - 1;
    if (this.index >= max) return;

    this.index++;
    this.update(true);
  }

  prev() {
    if (this.index <= 0) return;

    this.index--;
    this.update(true);
  }

  initVideoControls(signal) {
    this.querySelectorAll('.video-slider__media').forEach((wrapper) => {
      const video = wrapper.querySelector('.video-slider__element');
      const playBtn = wrapper.querySelector('.video-slider__play-btn');

      if (!video || !playBtn) return;

      if (video.paused) {
        playBtn.classList.remove('hidden');
      } else {
        playBtn.classList.add('hidden');
      }

      playBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        video.play();
        playBtn.classList.add('hidden');
      }, { signal });

      video.addEventListener('click', () => {
        if (!video.paused) {
          video.pause();
          playBtn.classList.remove('hidden');
        }
      }, { signal });

      video.addEventListener('play', () => {
        playBtn.classList.add('hidden');
      }, { signal });

      video.addEventListener('pause', () => {
        playBtn.classList.remove('hidden');
      }, { signal });

      video.addEventListener('ended', () => {
        playBtn.classList.remove('hidden');
      }, { signal });
    });
  }
}

if (!customElements.get('video-slider-section')) {
  customElements.define('video-slider-section', VideoSliderSection);
}
