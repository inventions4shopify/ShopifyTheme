document.addEventListener('DOMContentLoaded', () => {
  const galleries = document.querySelectorAll('.product_gallery');

  if (!galleries.length) return;

  galleries.forEach((gallery) => {
    // =====================================
    // ELEMENTS
    // =====================================

    const slider = gallery.querySelector('.product_gallery_main_slider');

    const track = gallery.querySelector('.product_gallery_main_track');

    const slides = [...gallery.querySelectorAll('.product_gallery_main_slide')];

    const thumbnails = [
      ...gallery.querySelectorAll('.product_gallery_thumbnail'),
    ];

    const thumbnailTrack = gallery.querySelector(
      '.product_gallery_thumbnail_track'
    );

    const prevButton = gallery.querySelector(
      '.product_gallery_arrow_prev'
    );

    const nextButton = gallery.querySelector(
      '.product_gallery_arrow_next'
    );

    const zoomType = gallery.dataset.zoomType || 'none';

    const hoverZoomStyle =
      gallery.dataset.hoverZoomStyle || 'same_image';

    const isVertical = gallery.classList.contains(
      'product_gallery--vertical'
    );

    // =====================================
    // STATE
    // =====================================

    let currentIndex = 0;

    // =====================================
    // MATCH VERTICAL THUMB HEIGHT
    // =====================================

    function setVerticalThumbnailHeight() {
      if (!isVertical) return;

      const mainSliderHeight = slider.offsetHeight;

      const thumbnailWrapper = gallery.querySelector(
        '.product_gallery_thumbnail_wrapper'
      );

      // thumbnailWrapper.style.height = `${mainSliderHeight}px`;
    }

    setVerticalThumbnailHeight();

    window.addEventListener(
      'resize',
      setVerticalThumbnailHeight
    );

    // =====================================
    // UPDATE SLIDER
    // =====================================

    function updateSlider(index, animate = true) {
      if (index < 0) {
        index = slides.length - 1;
      }

      if (index >= slides.length) {
        index = 0;
      }

      currentIndex = index;

      const sliderWidth = slider.offsetWidth;

      track.style.transition = animate
        ? 'transform 0.4s ease'
        : 'none';

      track.style.transform = `translate3d(-${
        sliderWidth * index
      }px,0,0)`;

      thumbnails.forEach((thumb) => {
        thumb.classList.remove('active');
      });

      if (thumbnails[index]) {
        thumbnails[index].classList.add('active');

        thumbnails[index].scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        });
      }
    }

    // =====================================
    // ARROWS
    // =====================================

    if (nextButton) {
      nextButton.addEventListener('click', () => {
        updateSlider(currentIndex + 1);
      });
    }

    if (prevButton) {
      prevButton.addEventListener('click', () => {
        updateSlider(currentIndex - 1);
      });
    }

    // =====================================
    // THUMBNAILS
    // =====================================

    thumbnails.forEach((thumbnail) => {
      thumbnail.addEventListener('click', () => {
        updateSlider(Number(thumbnail.dataset.index));
      });
    });

    // =====================================
    // MAIN SLIDER SWIPE / DRAG
    // =====================================

    let startX = 0;
    let startY = 0;

    let currentX = 0;

    let isPointerDown = false;
    let isDragging = false;
    let isScrolling = false;

    let movedDistance = 0;

    let currentTranslate = 0;
    let prevTranslate = 0;

    let raf = null;

    const dragThreshold = 8;

    const swipeThreshold = 60;

    const sliderWidth = () => slider.offsetWidth;

    // ---------------------------------
    // START
    // ---------------------------------

    const startDrag = (x, y) => {
      startX = x;

      startY = y;

      currentX = x;

      movedDistance = 0;

      isPointerDown = true;

      isDragging = false;

      isScrolling = false;

      prevTranslate = -(currentIndex * sliderWidth());

      track.style.transition = 'none';
    };

    // ---------------------------------
    // MOVE
    // ---------------------------------

    const moveDrag = (x, y) => {
      if (!isPointerDown) return;

      const diffX = x - startX;

      const diffY = y - startY;

      if (!isDragging && !isScrolling) {
        if (
          Math.abs(diffX) < dragThreshold &&
          Math.abs(diffY) < dragThreshold
        ) {
          return;
        }

        if (Math.abs(diffY) > Math.abs(diffX)) {
          isScrolling = true;

          return;
        }

        isDragging = true;

        slider.classList.add('dragging');
      }

      if (isScrolling) return;

      movedDistance = Math.abs(diffX);

      let translate = prevTranslate + diffX;

      const maxTranslate = 0;

      const minTranslate =
        -(sliderWidth() * (slides.length - 1));

      if (translate > maxTranslate) {
        translate *= 0.35;
      }

      if (translate < minTranslate) {
        const extra = translate - minTranslate;

        translate = minTranslate + extra * 0.35;
      }

      currentTranslate = translate;

      cancelAnimationFrame(raf);

      raf = requestAnimationFrame(() => {
        track.style.transform = `translate3d(${translate}px,0,0)`;
      });
    };

    // ---------------------------------
    // END
    // ---------------------------------

    const endDrag = () => {
      if (!isPointerDown) return;

      isPointerDown = false;

      slider.classList.remove('dragging');

      if (!isDragging) {
        isScrolling = false;

        return;
      }

      const movedBy = currentX - startX;

      if (movedBy < -swipeThreshold) {
        currentIndex += 1;
      }

      if (movedBy > swipeThreshold) {
        currentIndex -= 1;
      }

      updateSlider(currentIndex, true);
    };

    // ---------------------------------
    // TOUCH EVENTS
    // ---------------------------------

    slider.addEventListener(
      'touchstart',
      (event) => {
        const touch = event.touches[0];

        startDrag(touch.clientX, touch.clientY);
      },
      { passive: true }
    );

    slider.addEventListener(
      'touchmove',
      (event) => {
        const touch = event.touches[0];

        currentX = touch.clientX;

        moveDrag(touch.clientX, touch.clientY);
      },
      { passive: true }
    );

    slider.addEventListener('touchend', endDrag);

    // ---------------------------------
    // MOUSE EVENTS
    // ---------------------------------

    slider.addEventListener('mousedown', (event) => {
      if (event.button !== 0) return;

      startDrag(event.clientX, event.clientY);
    });

    window.addEventListener('mousemove', (event) => {
      if (!isPointerDown) return;

      currentX = event.clientX;

      moveDrag(event.clientX, event.clientY);
    });

    window.addEventListener('mouseup', endDrag);

    // ---------------------------------
    // PREVENT IMAGE DRAG
    // ---------------------------------

    slider.addEventListener('dragstart', (event) => {
      event.preventDefault();
    });

    // ---------------------------------
    // PREVENT CLICK AFTER DRAG
    // ---------------------------------

    slider.addEventListener(
      'click',
      (event) => {
        if (movedDistance > 10) {
          event.preventDefault();

          event.stopPropagation();
        }
      },
      true
    );

    // =====================================
    // THUMBNAIL DRAG
    // =====================================

    if (thumbnailTrack) {
      let isThumbDragging = false;

      let thumbStartPosition = 0;

      let thumbScrollPosition = 0;

      let dragMoved = false;

      thumbnailTrack.addEventListener(
        'mousedown',
        (e) => {
          isThumbDragging = true;

          dragMoved = false;

          thumbnailTrack.classList.add('dragging');

          thumbStartPosition = isVertical
            ? e.pageY
            : e.pageX;

          thumbScrollPosition = isVertical
            ? thumbnailTrack.scrollTop
            : thumbnailTrack.scrollLeft;

          e.preventDefault();
        }
      );

      window.addEventListener('mouseup', () => {
        isThumbDragging = false;

        thumbnailTrack.classList.remove('dragging');
      });

      window.addEventListener('mousemove', (e) => {
        if (!isThumbDragging) return;

        e.preventDefault();

        const currentPosition = isVertical
          ? e.pageY
          : e.pageX;

        const walk =
          (currentPosition - thumbStartPosition) * 1.2;

        if (Math.abs(walk) > 5) {
          dragMoved = true;
        }

        if (isVertical) {
          thumbnailTrack.scrollTop =
            thumbScrollPosition - walk;
        } else {
          thumbnailTrack.scrollLeft =
            thumbScrollPosition - walk;
        }
      });

      thumbnails.forEach((thumbnail) => {
        thumbnail.addEventListener(
          'click',
          (e) => {
            if (dragMoved) {
              e.preventDefault();

              e.stopPropagation();
            }
          },
          true
        );
      });
    }

    // =====================================
    // MAGNIFIER ZOOM
    // =====================================

    if (
      zoomType === 'hover' &&
      hoverZoomStyle === 'magnifier'
    ) {
      slides.forEach((slide) => {
        const img = slide.querySelector('img');

        if (!img) return;

        slide.addEventListener('mouseenter', () => {
          img.style.transition = 'none';

          img.style.transform = 'scale(2)';
        });

        slide.addEventListener('mousemove', (e) => {
          const rect = slide.getBoundingClientRect();

          const x = e.clientX - rect.left;

          const y = e.clientY - rect.top;

          const xPercent = (x / rect.width) * 100;

          const yPercent = (y / rect.height) * 100;

          img.style.transformOrigin = `${xPercent}% ${yPercent}%`;
        });

        slide.addEventListener('mouseleave', () => {
          img.style.transition = 'transform 0.3s ease';

          img.style.transform = 'scale(1)';

          img.style.transformOrigin = 'center center';
        });
      });
    }

    // =====================================
    // PREVIEW WINDOW ZOOM
    // =====================================

    if (
      zoomType === 'hover' &&
      hoverZoomStyle === 'preview_window'
    ) {
      const preview = gallery.querySelector(
        '.product_gallery_zoom_preview'
      );

      const previewImage = gallery.querySelector(
        '.product_gallery_zoom_preview_image'
      );

      if (preview && previewImage) {
        slides.forEach((slide) => {
          const lens = document.createElement('div');

          lens.className = 'product_gallery_zoom_lens';

          slide.appendChild(lens);

          slide.addEventListener('mouseenter', () => {
            preview.classList.add('active');

            lens.classList.add('active');

            previewImage.style.backgroundImage = `url(${slide.dataset.full})`;

            previewImage.style.backgroundSize = '200%';
          });

          slide.addEventListener('mouseleave', () => {
            preview.classList.remove('active');

            lens.classList.remove('active');
          });

          slide.addEventListener(
            'mousemove',
            (event) => {
              const rect =
                slide.getBoundingClientRect();

              const x = event.clientX - rect.left;

              const y = event.clientY - rect.top;

              const percentX =
                (x / rect.width) * 100;

              const percentY =
                (y / rect.height) * 100;

              lens.style.left = `${
                x - lens.offsetWidth / 2
              }px`;

              lens.style.top = `${
                y - lens.offsetHeight / 2
              }px`;

              previewImage.style.backgroundPosition = `${percentX}% ${percentY}%`;
            }
          );
        });
      }
    }

    // =====================================
    // LIGHTBOX
    // =====================================

    
    if (zoomType === 'lightbox') {
      const lightbox =
        gallery.parentElement.querySelector(
          '.product_lightbox'
        );

      if (lightbox) {
        const closeBtn = lightbox.querySelector(
          '.product_lightbox_close'
        );

        const overlay = lightbox.querySelector(
          '.product_lightbox_overlay'
        );

        const thumbnailsLB = [
          ...lightbox.querySelectorAll(
            '.product_lightbox_thumbnail'
          ),
        ];

        const imageItems = [
          ...lightbox.querySelectorAll(
            '.product_lightbox_image_item'
          ),
        ];

        const imagesWrapper = lightbox.querySelector(
          '.product_lightbox_images'
        );

        function openLightbox(index) {
          lightbox.hidden = false;

          document.body.style.overflow = 'hidden';

          scrollToImage(index);
        }

        function closeLightbox() {
          lightbox.hidden = true;

          document.body.style.overflow = '';
        }

        function scrollToImage(index) {
          const target = imageItems[index];

          if (!target) return;

          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });

          updateActiveThumbnail(index);
        }

        function updateActiveThumbnail(index) {
          thumbnailsLB.forEach((thumb) => {
            thumb.classList.remove('active');
          });

          if (thumbnailsLB[index]) {
            thumbnailsLB[index].classList.add(
              'active'
            );

            thumbnailsLB[index].scrollIntoView({
              behavior: 'smooth',
              block: 'nearest',
            });
          }
        }

        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                const index = Number(
                  entry.target.dataset.index
                );

                updateActiveThumbnail(index);
              }
            });
          },
          {
            root: imagesWrapper,
            threshold: 0.4,
          }
        );

        imageItems.forEach((item) => {
          observer.observe(item);
        });

        slides.forEach((slide, index) => {
          slide.addEventListener('click', () => {
            openLightbox(index);
          });
        });

        thumbnailsLB.forEach((thumbnail) => {
          thumbnail.addEventListener('click', () => {
            scrollToImage(
              Number(thumbnail.dataset.index)
            );
          });
        });

        closeBtn?.addEventListener(
          'click',
          closeLightbox
        );

        overlay?.addEventListener(
          'click',
          closeLightbox
        );

        document.addEventListener(
          'keydown',
          (e) => {
            if (
              e.key === 'Escape' &&
              !lightbox.hidden
            ) {
              closeLightbox();
            }
          }
        );
      }
    }

    // =====================================
    // INIT
    // =====================================

    updateSlider(0, false);
  });
});