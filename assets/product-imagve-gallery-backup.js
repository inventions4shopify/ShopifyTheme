
<script>
  const slideGap = 10;

  document.addEventListener('DOMContentLoaded', function () {
    const galleries = document.querySelectorAll('.product_gallery');

    galleries.forEach((gallery) => {
      const slider = gallery.querySelector('.product_gallery_main_slider');

      const track = gallery.querySelector('.product_gallery_main_track');

      const slides = gallery.querySelectorAll('.product_gallery_main_slide');

      const thumbnails = gallery.querySelectorAll('.product_gallery_thumbnail');

      const thumbnailTrack = gallery.querySelector('.product_gallery_thumbnail_track');

      const prevButton = gallery.querySelector('.product_gallery_arrow_prev');

      const nextButton = gallery.querySelector('.product_gallery_arrow_next');

      const isVertical = gallery.classList.contains('product_gallery--vertical');

      let currentIndex = 0;

      // ---------------------------------
      // MATCH VERTICAL THUMB HEIGHT
      // ---------------------------------

      function setVerticalThumbnailHeight() {
        if (!isVertical) return;

        const mainSliderHeight = slider.offsetHeight;

        const thumbnailWrapper = gallery.querySelector('.product_gallery_thumbnail_wrapper');

        // thumbnailWrapper.style.height = `${mainSliderHeight}px`;
      }

      setVerticalThumbnailHeight();

      window.addEventListener('resize', setVerticalThumbnailHeight);

      // ---------------------------------
      // UPDATE SLIDER
      // ---------------------------------

      function updateSlider(index) {
        if (index < 0) {
          index = slides.length - 1;
        }

        if (index >= slides.length) {
          index = 0;
        }

        const slideWidth = slides[0].offsetWidth + slideGap;

        track.style.transform = `translate3d(-${index * slideWidth}px, 0, 0)`;

        thumbnails.forEach((thumb) => {
          thumb.classList.remove('active');
        });

        thumbnails[index].classList.add('active');

        thumbnails[index].scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        });

        currentIndex = index;
      }

      // ---------------------------------
      // BUTTONS
      // ---------------------------------

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

      // ---------------------------------
      // THUMBNAIL CLICK
      // ---------------------------------

      thumbnails.forEach((thumbnail) => {
        thumbnail.addEventListener('click', function () {
          updateSlider(Number(this.dataset.index));
        });
      });

      // ---------------------------------
      // MAIN SLIDER SWIPE / DRAG
      // ---------------------------------

      // ---------------------------------
      // MAIN SLIDER SWIPE / DRAG
      // ---------------------------------

      let startX = 0;
      let currentX = 0;

      let isDragging = false;

      let currentTranslate = 0;
      let prevTranslate = 0;

      const sliderWidth = () => slider.offsetWidth;

      // -----------------------------
      // UPDATE POSITION
      // -----------------------------

      function setSliderPosition(value) {
        track.style.transition = 'none';

        track.style.transform = `translate3d(${value}px,0,0)`;
      }

      // -----------------------------
      // START DRAG
      // -----------------------------

      function startDrag(x) {
        isDragging = true;

        startX = x;
        currentX = x;

        const slideWidth = slides[0].offsetWidth + slideGap;

        prevTranslate = -currentIndex * slideWidth;

        track.style.transition = 'none';
      }

      // -----------------------------
      // MOVE DRAG
      // -----------------------------

      function moveDrag(x) {
        if (!isDragging) return;

        currentX = x;

        const diff = currentX - startX;

        currentTranslate = prevTranslate + diff;

        setSliderPosition(currentTranslate);
      }

      // -----------------------------
      // END DRAG
      // -----------------------------

      function endDrag() {
        if (!isDragging) return;

        isDragging = false;

        const movedBy = currentX - startX;

        if (movedBy < -50) {
          currentIndex += 1;
        }

        if (movedBy > 50) {
          currentIndex -= 1;
        }

        if (currentIndex < 0) {
          currentIndex = slides.length - 1;
        }

        if (currentIndex >= slides.length) {
          currentIndex = 0;
        }

        track.style.transition = 'transform 0.4s ease';

        const slideWidth = slides[0].offsetWidth + slideGap;

        track.style.transform = `translate3d(-${currentIndex * slideWidth}px,0,0)`;

        thumbnails.forEach((thumb) => {
          thumb.classList.remove('active');
        });

        thumbnails[currentIndex].classList.add('active');

        thumbnails[currentIndex].scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        });
      }

      // TOUCH EVENTS

      slider.addEventListener(
        'touchstart',
        (e) => {
          const activeImg = slides[currentIndex].querySelector('img');

          if (e.touches.length === 2) {
            return;
          }

          if (activeImg && activeImg.dataset.scale && Number(activeImg.dataset.scale) > 1) {
            return;
          }

          startDrag(e.touches[0].clientX);
        },
        { passive: true }
      );

      slider.addEventListener(
        'touchmove',
        (e) => {
          const activeImg = slides[currentIndex].querySelector('img');

          if (e.touches.length === 2) {
            return;
          }

          if (activeImg && activeImg.dataset.scale && Number(activeImg.dataset.scale) > 1) {
            return;
          }

          moveDrag(e.touches[0].clientX);
        },
        { passive: true }
      );

      slider.addEventListener('touchend', endDrag);

      // -----------------------------
      // DESKTOP EVENTS
      // -----------------------------

      slider.addEventListener('mousedown', (e) => {
        const enableDesktopDrag = gallery.dataset.enableDesktopDrag === 'true';

        const zoomType = gallery.dataset.zoomType || 'none';
        const hoverZoomStyle = gallery.dataset.hoverZoomStyle || '';
        const isDesktop = window.innerWidth > 991;

        if (zoomType === 'hover' && hoverZoomStyle === 'magnifier' && isDesktop) {
          return;
        }

        if (enableDesktopDrag) {
          e.preventDefault();

          startDrag(e.clientX);

          slider.style.cursor = 'grabbing';
        }
      });

      window.addEventListener('mousemove', (e) => {
        const enableDesktopDrag = gallery.dataset.enableDesktopDrag === 'true';

        if (!enableDesktopDrag) {
          return;
        }

        const zoomType = gallery.dataset.zoomType || 'none';

        const hoverZoomStyle = gallery.dataset.hoverZoomStyle || '';

        const isDesktop = window.innerWidth > 991;

        if (zoomType === 'hover' && hoverZoomStyle === 'magnifier' && isDesktop) {
          return;
        }

        if (!isDragging) return;

        moveDrag(e.clientX);
      });

      window.addEventListener('mouseup', () => {
        const enableDesktopDrag = gallery.dataset.enableDesktopDrag === 'true';

        if (!enableDesktopDrag) {
          return;
        }
        const zoomType = gallery.dataset.zoomType || 'none';

        const hoverZoomStyle = gallery.dataset.hoverZoomStyle || '';

        const isDesktop = window.innerWidth > 991;

        if (zoomType === 'hover' && hoverZoomStyle === 'magnifier' && isDesktop) {
          return;
        }

        if (!isDragging) return;

        endDrag();

        slider.style.cursor = 'grab';
      });

      // ---------------------------------
      // THUMBNAIL DRAG SCROLL
      // ---------------------------------

      let isThumbDragging = false;

      let thumbStartPosition = 0;

      let thumbScrollPosition = 0;

      let dragMoved = false;

      thumbnailTrack.addEventListener('mousedown', (e) => {
        isThumbDragging = true;

        dragMoved = false;

        thumbnailTrack.classList.add('dragging');

        thumbStartPosition = isVertical ? e.pageY : e.pageX;

        thumbScrollPosition = isVertical ? thumbnailTrack.scrollTop : thumbnailTrack.scrollLeft;

        thumbnailTrack.style.cursor = 'grabbing';

        e.preventDefault();
      });

      window.addEventListener('mouseup', () => {
        isThumbDragging = false;

        thumbnailTrack.classList.remove('dragging');

        thumbnailTrack.style.cursor = '';
      });

      window.addEventListener('mousemove', (e) => {
        if (!isThumbDragging) return;

        e.preventDefault();

        const currentPosition = isVertical ? e.pageY : e.pageX;

        const walk = (currentPosition - thumbStartPosition) * 1.2;

        if (Math.abs(walk) > 5) {
          dragMoved = true;
        }

        if (isVertical) {
          thumbnailTrack.scrollTop = thumbScrollPosition - walk;
        } else {
          thumbnailTrack.scrollLeft = thumbScrollPosition - walk;
        }
      });

      // prevent accidental click after drag
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
    });
  });
</script>

{% comment %} Below script block is for preview window zoom style, keep it if you support it. {% endcomment %}

<script>
  document.addEventListener('DOMContentLoaded', function () {
    const galleries = document.querySelectorAll('.product_gallery');

    galleries.forEach((gallery) => {
      const zoomType = gallery.dataset.zoomType || 'none';

      const hoverZoomStyle = gallery.dataset.hoverZoomStyle || 'same_image';

      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      if (isTouchDevice) return;

      if (zoomType !== 'hover' || hoverZoomStyle !== 'preview_window') {
        return;
      }

      const slides = gallery.querySelectorAll('.product_gallery_main_slide');

      const preview = gallery.querySelector('.product_gallery_zoom_preview');

      const previewImage = gallery.querySelector('.product_gallery_zoom_preview_image');

      if (!preview || !previewImage) return;

      slides.forEach((slide) => {
        const image = slide.querySelector('img');

        if (!image) return;

        // -----------------------------
        // CREATE LENS
        // -----------------------------

        const lens = document.createElement('div');

        lens.className = 'product_gallery_zoom_lens';

        slide.appendChild(lens);

        // -----------------------------
        // MOUSE ENTER
        // -----------------------------

        slide.addEventListener('mouseenter', () => {
          preview.classList.add('active');

          lens.classList.add('active');

          previewImage.style.backgroundImage = `url(${slide.dataset.full})`;

          previewImage.style.backgroundSize = '200%';
        });

        // -----------------------------
        // MOUSE LEAVE
        // -----------------------------

        slide.addEventListener('mouseleave', () => {
          preview.classList.remove('active');

          lens.classList.remove('active');
        });

        // -----------------------------
        // MOUSE MOVE
        // -----------------------------

        slide.addEventListener('mousemove', (event) => {
          const rect = slide.getBoundingClientRect();

          const x = event.clientX - rect.left;

          const y = event.clientY - rect.top;

          // percent position
          const percentX = (x / rect.width) * 100;

          const percentY = (y / rect.height) * 100;

          // move lens
          lens.style.left = `${x - lens.offsetWidth / 2}px`;

          lens.style.top = `${y - lens.offsetHeight / 2}px`;

          // move preview background
          previewImage.style.backgroundPosition = `${percentX}% ${percentY}%`;
        });
      });
    });
  });
</script>

{% comment %} Below script block Keep it if you support Magnifier zoom. {% endcomment %}

<script>
  document.addEventListener('DOMContentLoaded', () => {
    const galleries = document.querySelectorAll('.product_gallery');

    galleries.forEach((gallery) => {
      const zoomType = gallery.dataset.zoomType;
      const hoverZoomStyle = gallery.dataset.hoverZoomStyle;

      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      if (isTouchDevice) return;

      if (zoomType !== 'hover' || hoverZoomStyle !== 'magnifier') {
        return;
      }

      const slides = gallery.querySelectorAll('.product_gallery_main_slide');

      slides.forEach((slide) => {
        const img = slide.querySelector('img');

        if (!img) return;

        let isZooming = false;

        // -----------------------------
        // MOUSE ENTER
        // -----------------------------
        slide.addEventListener('mouseenter', () => {
          isZooming = true;

          img.style.transition = 'none';
          img.style.transform = 'scale(2)';
          img.style.cursor = 'zoom-in';
        });

        // -----------------------------
        // MOUSE MOVE
        // -----------------------------
        slide.addEventListener('mousemove', (e) => {
          if (!isZooming) return;

          const rect = slide.getBoundingClientRect();

          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          const xPercent = (x / rect.width) * 100;
          const yPercent = (y / rect.height) * 100;

          img.style.transformOrigin = `${xPercent}% ${yPercent}%`;
        });

        // -----------------------------
        // MOUSE LEAVE
        // -----------------------------
        slide.addEventListener('mouseleave', () => {
          isZooming = false;

          img.style.transition = 'transform 0.3s ease';

          img.style.transform = 'scale(1)';
          img.style.transformOrigin = 'center center';
        });
      });
    });
  });
</script>

{% comment %} Below script block is for Lightbox zoom style, keep it if you support it. {% endcomment %}

<script>
  document.addEventListener('DOMContentLoaded', function () {
    const galleries = document.querySelectorAll('.product_gallery');

    galleries.forEach((gallery) => {
      const zoomType = gallery.dataset.zoomType || 'none';

      if (zoomType !== 'lightbox') return;

      const slides = gallery.querySelectorAll('.product_gallery_main_slide');

      const lightbox = gallery.parentElement.querySelector('.product_lightbox');

      if (!lightbox) return;

      const closeBtn = lightbox.querySelector('.product_lightbox_close');

      const overlay = lightbox.querySelector('.product_lightbox_overlay');

      const thumbnails = lightbox.querySelectorAll('.product_lightbox_thumbnail');

      const imageItems = lightbox.querySelectorAll('.product_lightbox_image_item');

      const imagesWrapper = lightbox.querySelector('.product_lightbox_images');

      // ---------------------------------
      // OPEN LIGHTBOX
      // ---------------------------------

      let isThumbnailScrolling = false;

      function openLightbox(index) {
        lightbox.hidden = false;

        document.body.style.overflow = 'hidden';

        scrollToImage(index);
      }

      // ---------------------------------
      // CLOSE LIGHTBOX
      // ---------------------------------

      function closeLightbox() {
        lightbox.hidden = true;

        document.body.style.overflow = '';
      }

      // ---------------------------------
      // SCROLL TO IMAGE
      // ---------------------------------

      function scrollToImage(index) {
        const target = imageItems[index];

        if (!target) return;

        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });

        updateActiveThumbnail(index);
      }

      // ---------------------------------
      // ACTIVE THUMBNAIL
      // ---------------------------------

      function updateActiveThumbnail(index) {
        thumbnails.forEach((thumb) => {
          thumb.classList.remove('active');
        });

        if (thumbnails[index]) {
          thumbnails[index].classList.add('active');

          thumbnails[index].scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
          });
        }
      }

      // ---------------------------------
      // OBSERVER
      // ---------------------------------

      const observer = new IntersectionObserver(
        (entries) => {
          if (isThumbnailScrolling) return;

          let activeEntry = null;

          entries.forEach((entry) => {
            if (entry.isIntersecting && (!activeEntry || entry.intersectionRatio > activeEntry.intersectionRatio)) {
              activeEntry = entry;
            }
          });

          if (activeEntry) {
            updateActiveThumbnail(Number(activeEntry.target.dataset.index));
          }
        },
        {
          root: imagesWrapper,
          threshold: [0.2, 0.4, 0.6, 0.8, 1],
        }
      );

      imageItems.forEach((item) => {
        observer.observe(item);
      });

      // ---------------------------------
      // MAIN IMAGE CLICK
      // ---------------------------------

      slides.forEach((slide, index) => {
        slide.addEventListener('click', () => {
          openLightbox(index);
        });
      });

      // ---------------------------------
      // THUMB CLICK
      // ---------------------------------

      thumbnails.forEach((thumbnail) => {
        thumbnail.addEventListener('click', () => {
          isThumbnailScrolling = true;

          const index = Number(thumbnail.dataset.index);

          scrollToImage(index);

          updateActiveThumbnail(index);

          setTimeout(() => {
            isThumbnailScrolling = false;
          }, 600);
        });
      });

      // ---------------------------------
      // CLOSE EVENTS
      // ---------------------------------

      closeBtn?.addEventListener('click', closeLightbox);

      overlay?.addEventListener('click', closeLightbox);

      // ---------------------------------
      // ESC KEY
      // ---------------------------------

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !lightbox.hidden) {
          closeLightbox();
        }
      });
    });
  });
</script>

<script>
  document.addEventListener('DOMContentLoaded', () => {
    const galleries = document.querySelectorAll('.product_gallery');

    galleries.forEach((gallery) => {
      const zoomType = gallery.dataset.zoomType;

      if (zoomType !== 'hover') return;

      const slides = gallery.querySelectorAll('.product_gallery_main_slide');

      slides.forEach((slide) => {
        const img = slide.querySelector('img');

        if (!img) return;

        let startDistance = 0;
        let currentScale = 1;

        let startX = 0;
        let startY = 0;

        let translateX = 0;
        let translateY = 0;

        let lastTranslateX = 0;
        let lastTranslateY = 0;

        let lastTap = 0;

        function getDistance(t1, t2) {
          const dx = t2.clientX - t1.clientX;
          const dy = t2.clientY - t1.clientY;

          return Math.sqrt(dx * dx + dy * dy);
        }

        function updateTransform() {
          img.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${currentScale})`;
          img.dataset.scale = currentScale;
        }

        // -----------------------
        // TOUCH START
        // -----------------------

        slide.addEventListener(
          'touchstart',
          (e) => {
            if (e.touches.length === 2) {
              startDistance = getDistance(e.touches[0], e.touches[1]);
            }

            if (e.touches.length === 1 && currentScale > 1) {
              startX = e.touches[0].clientX;
              startY = e.touches[0].clientY;

              lastTranslateX = translateX;
              lastTranslateY = translateY;
            }
          },
          { passive: true }
        );

        // -----------------------
        // TOUCH MOVE
        // -----------------------

        slide.addEventListener(
          'touchmove',
          (e) => {
            // PINCH ZOOM
            if (e.touches.length === 2) {
              const distance = getDistance(e.touches[0], e.touches[1]);

              currentScale *= distance / startDistance;

              currentScale = Math.max(1, Math.min(currentScale, 4));

              startDistance = distance;

              if (currentScale <= 1.05) {
                currentScale = 1;
                translateX = 0;
                translateY = 0;
              }

              updateTransform();

              e.preventDefault();
              return;
            }

            // PAN IMAGE
            if (e.touches.length === 1 && currentScale > 1) {
              const deltaX = e.touches[0].clientX - startX;
              const deltaY = e.touches[0].clientY - startY;

              const maxX = (img.offsetWidth * currentScale - img.offsetWidth) / 2;

              const maxY = (img.offsetHeight * currentScale - img.offsetHeight) / 2;

              translateX = Math.max(-maxX, Math.min(maxX, lastTranslateX + deltaX));

              translateY = Math.max(-maxY, Math.min(maxY, lastTranslateY + deltaY));

              updateTransform();

              e.preventDefault();
            }
          },
          { passive: false }
        );

        // -----------------------
        // DOUBLE TAP ZOOM
        // -----------------------

        slide.addEventListener('touchend', (e) => {
          if (e.touches.length > 0) return;

          const currentTime = Date.now();
          const tapLength = currentTime - lastTap;

          if (tapLength < 300 && tapLength > 0) {
            if (currentScale < 1.5) {
              const rect = slide.getBoundingClientRect();

              const tapX = e.changedTouches[0].clientX - rect.left;
              const tapY = e.changedTouches[0].clientY - rect.top;

              currentScale = 2;

              translateX = -(tapX - rect.width / 2);
              translateY = -(tapY - rect.height / 2);

              const maxX = (img.offsetWidth * currentScale - img.offsetWidth) / 2;

              const maxY = (img.offsetHeight * currentScale - img.offsetHeight) / 2;

              translateX = Math.max(-maxX, Math.min(maxX, translateX));
              translateY = Math.max(-maxY, Math.min(maxY, translateY));
            } else {
              currentScale = 1;
              translateX = 0;
              translateY = 0;
            }

            updateTransform();
          }

          lastTap = currentTime;

          if (currentScale <= 1.05) {
            currentScale = 1;
            translateX = 0;
            translateY = 0;

            updateTransform();
          }
        });
      });
    });
  });
</script>





// =========================Below are optimized script tags =================================================





<script>
  document.addEventListener('DOMContentLoaded', () => {
    const SLIDE_GAP = 10;

    document.querySelectorAll('.product_gallery').forEach((gallery) => {
      const slider = gallery.querySelector('.product_gallery_main_slider');
      const track = gallery.querySelector('.product_gallery_main_track');

      const slides = [...gallery.querySelectorAll('.product_gallery_main_slide')];
      const thumbnails = [...gallery.querySelectorAll('.product_gallery_thumbnail')];

      const thumbnailTrack = gallery.querySelector('.product_gallery_thumbnail_track');

      const prevButton = gallery.querySelector('.product_gallery_arrow_prev');
      const nextButton = gallery.querySelector('.product_gallery_arrow_next');

      const isVertical = gallery.classList.contains('product_gallery--vertical');

      let currentIndex = 0;

      const getSlideWidth = () => slides[0].offsetWidth + SLIDE_GAP;

      function updateActiveThumbnail(index) {
        thumbnails.forEach((thumb) => thumb.classList.remove('active'));

        thumbnails[index]?.classList.add('active');

        thumbnails[index]?.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        });
      }

      function updateSlider(index) {
        if (!slides.length) return;

        if (index < 0) {
          index = slides.length - 1;
        }

        if (index >= slides.length) {
          index = 0;
        }

        track.style.transition = 'transform 0.4s ease';

        track.style.transform = `translate3d(-${index * getSlideWidth()}px,0,0)`;

        updateActiveThumbnail(index);

        currentIndex = index;
      }

      // ---------------------------------
      // ARROWS
      // ---------------------------------

      nextButton?.addEventListener('click', () => {
        updateSlider(currentIndex + 1);
      });

      prevButton?.addEventListener('click', () => {
        updateSlider(currentIndex - 1);
      });

      // ---------------------------------
      // THUMBNAILS
      // ---------------------------------

      thumbnails.forEach((thumbnail) => {
        thumbnail.addEventListener('click', () => {
          updateSlider(Number(thumbnail.dataset.index));
        });
      });

      // ---------------------------------
      // MAIN DRAG / SWIPE
      // ---------------------------------

      let isDragging = false;

      let startX = 0;
      let currentX = 0;

      let currentTranslate = 0;
      let prevTranslate = 0;

      function setSliderPosition(value) {
        track.style.transition = 'none';

        track.style.transform = `translate3d(${value}px,0,0)`;
      }

      function canDragSlider() {
        const activeImg = slides[currentIndex]?.querySelector('img');

        if (activeImg?._zoomScale > 1) {
          return false;
        }

        const zoomType = gallery.dataset.zoomType || 'none';
        const hoverZoomStyle = gallery.dataset.hoverZoomStyle || '';

        if (window.innerWidth > 991 && zoomType === 'hover' && hoverZoomStyle === 'magnifier') {
          return false;
        }

        return true;
      }

      function startDrag(x) {
        isDragging = true;

        startX = x;
        currentX = x;

        prevTranslate = -(currentIndex * getSlideWidth());

        track.style.transition = 'none';
      }

      function moveDrag(x) {
        if (!isDragging) return;

        currentX = x;

        currentTranslate = prevTranslate + (currentX - startX);

        setSliderPosition(currentTranslate);
      }

      function endDrag() {
        if (!isDragging) return;

        isDragging = false;

        const movedBy = currentX - startX;

        if (movedBy < -50) {
          currentIndex++;
        }

        if (movedBy > 50) {
          currentIndex--;
        }

        updateSlider(currentIndex);

        slider.style.cursor = 'grab';
      }

      // ---------------------------------
      // TOUCH
      // ---------------------------------

      slider.addEventListener(
        'touchstart',
        (e) => {
          if (!canDragSlider()) return;

          if (e.touches.length !== 1) return;

          startDrag(e.touches[0].clientX);
        },
        { passive: true }
      );

      slider.addEventListener(
        'touchmove',
        (e) => {
          if (!canDragSlider()) return;

          if (e.touches.length !== 1) return;

          moveDrag(e.touches[0].clientX);
        },
        { passive: true }
      );

      slider.addEventListener('touchend', endDrag);

      // ---------------------------------
      // DESKTOP DRAG
      // ---------------------------------

      slider.addEventListener('mousedown', (e) => {
        const enableDesktopDrag = gallery.dataset.enableDesktopDrag === 'true';

        if (!enableDesktopDrag) return;

        if (!canDragSlider()) return;

        e.preventDefault();

        slider.style.cursor = 'grabbing';

        startDrag(e.clientX);
      });

      window.addEventListener('mousemove', (e) => {
        const enableDesktopDrag = gallery.dataset.enableDesktopDrag === 'true';

        if (!enableDesktopDrag) return;

        moveDrag(e.clientX);
      });

      window.addEventListener('mouseup', () => {
        const enableDesktopDrag = gallery.dataset.enableDesktopDrag === 'true';

        if (!enableDesktopDrag) return;

        endDrag();
      });

      // ---------------------------------
      // THUMBNAIL DRAG SCROLL
      // ---------------------------------

      if (thumbnailTrack) {
        let isThumbDragging = false;

        let thumbStartPosition = 0;
        let thumbScrollPosition = 0;

        let dragMoved = false;

        thumbnailTrack.addEventListener('mousedown', (e) => {
          isThumbDragging = true;

          dragMoved = false;

          thumbnailTrack.classList.add('dragging');

          thumbStartPosition = isVertical ? e.pageY : e.pageX;

          thumbScrollPosition = isVertical ? thumbnailTrack.scrollTop : thumbnailTrack.scrollLeft;

          thumbnailTrack.style.cursor = 'grabbing';

          e.preventDefault();
        });

        window.addEventListener('mouseup', () => {
          isThumbDragging = false;

          thumbnailTrack.classList.remove('dragging');

          thumbnailTrack.style.cursor = '';
        });

        window.addEventListener('mousemove', (e) => {
          if (!isThumbDragging) return;

          e.preventDefault();

          const currentPosition = isVertical ? e.pageY : e.pageX;

          const walk = (currentPosition - thumbStartPosition) * 1.2;

          if (Math.abs(walk) > 5) {
            dragMoved = true;
          }

          if (isVertical) {
            thumbnailTrack.scrollTop = thumbScrollPosition - walk;
          } else {
            thumbnailTrack.scrollLeft = thumbScrollPosition - walk;
          }
        });

        thumbnails.forEach((thumbnail) => {
          thumbnail.addEventListener(
            'click',
            (e) => {
              if (!dragMoved) return;

              e.preventDefault();
              e.stopPropagation();
            },
            true
          );
        });
      }

      updateSlider(0);
    });
  });
</script>

{% comment %} Below script block is for preview window zoom style, keep it if you support it. {% endcomment %}

<script>
  document.addEventListener('DOMContentLoaded', () => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (isTouchDevice) return;

    document.querySelectorAll('.product_gallery').forEach((gallery) => {
      const zoomType = gallery.dataset.zoomType || 'none';
      const hoverZoomStyle = gallery.dataset.hoverZoomStyle || 'same_image';

      if (zoomType !== 'hover' || hoverZoomStyle !== 'preview_window') {
        return;
      }

      const preview = gallery.querySelector('.product_gallery_zoom_preview');

      const previewImage = gallery.querySelector('.product_gallery_zoom_preview_image');

      if (!preview || !previewImage) return;

      const slides = gallery.querySelectorAll('.product_gallery_main_slide');

      slides.forEach((slide) => {
        const image = slide.querySelector('img');

        if (!image) return;

        // -----------------------------
        // CREATE LENS (ONLY ONCE)
        // -----------------------------

        let lens = slide.querySelector('.product_gallery_zoom_lens');

        if (!lens) {
          lens = document.createElement('div');

          lens.className = 'product_gallery_zoom_lens';

          slide.appendChild(lens);
        }

        let animationFrame = null;

        // -----------------------------
        // MOUSE ENTER
        // -----------------------------

        slide.addEventListener('mouseenter', () => {
          preview.classList.add('active');

          lens.classList.add('active');

          const fullImage = slide.dataset.full;

          if (previewImage.dataset.currentImage !== fullImage) {
            previewImage.style.backgroundImage = `url(${fullImage})`;

            previewImage.dataset.currentImage = fullImage;
          }

          previewImage.style.backgroundSize = '200%';
        });

        // -----------------------------
        // MOUSE LEAVE
        // -----------------------------

        slide.addEventListener('mouseleave', () => {
          preview.classList.remove('active');

          lens.classList.remove('active');

          if (animationFrame) {
            cancelAnimationFrame(animationFrame);

            animationFrame = null;
          }
        });

        // -----------------------------
        // MOUSE MOVE
        // -----------------------------

        slide.addEventListener('mousemove', (event) => {
          if (animationFrame) {
            cancelAnimationFrame(animationFrame);
          }

          animationFrame = requestAnimationFrame(() => {
            const rect = slide.getBoundingClientRect();

            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            const percentX = (x / rect.width) * 100;
            const percentY = (y / rect.height) * 100;

            lens.style.left = `${x - lens.offsetWidth / 2}px`;
            lens.style.top = `${y - lens.offsetHeight / 2}px`;

            previewImage.style.backgroundPosition = `${percentX}% ${percentY}%`;
          });
        });
      });
    });
  });
</script>

{% comment %} Below script block Keep it if you support Magnifier zoom. {% endcomment %}

<script>
  document.addEventListener('DOMContentLoaded', () => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (isTouchDevice) return;

    document.querySelectorAll('.product_gallery').forEach((gallery) => {
      const zoomType = gallery.dataset.zoomType || 'none';
      const hoverZoomStyle = gallery.dataset.hoverZoomStyle || '';

      if (zoomType !== 'hover' || hoverZoomStyle !== 'magnifier') {
        return;
      }

      const slides = gallery.querySelectorAll('.product_gallery_main_slide');

      slides.forEach((slide) => {
        const img = slide.querySelector('img');

        if (!img) return;

        let rafId = null;

        slide.addEventListener('mouseenter', () => {
          slide.classList.add('magnifier_active');
        });

        slide.addEventListener('mousemove', (e) => {
          if (rafId) cancelAnimationFrame(rafId);

          rafId = requestAnimationFrame(() => {
            const rect = slide.getBoundingClientRect();

            const xPercent = ((e.clientX - rect.left) / rect.width) * 100;

            const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

            img.style.transformOrigin = `${xPercent}% ${yPercent}%`;
          });
        });

        slide.addEventListener('mouseleave', () => {
          slide.classList.remove('magnifier_active');

          img.style.transformOrigin = 'center center';

          if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
        });
      });
    });
  });
</script>

{% comment %} Below script block is for Lightbox zoom style, keep it if you support it. {% endcomment %}

<script>
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.product_gallery').forEach((gallery) => {
      const zoomType = gallery.dataset.zoomType || 'none';

      if (zoomType !== 'lightbox') return;

      const lightbox = gallery.parentElement.querySelector('.product_lightbox');

      if (!lightbox) return;

      const slides = gallery.querySelectorAll('.product_gallery_main_slide');

      const closeBtn = lightbox.querySelector('.product_lightbox_close');

      const overlay = lightbox.querySelector('.product_lightbox_overlay');

      const thumbnails = lightbox.querySelectorAll('.product_lightbox_thumbnail');

      const imageItems = lightbox.querySelectorAll('.product_lightbox_image_item');

      const imagesWrapper = lightbox.querySelector('.product_lightbox_images');

      let isThumbnailScrolling = false;

      // -----------------------------
      // ACTIVE THUMBNAIL
      // -----------------------------

      function updateActiveThumbnail(index) {
        thumbnails.forEach((thumb) => {
          thumb.classList.remove('active');
        });

        const activeThumb = thumbnails[index];

        if (!activeThumb) return;

        activeThumb.classList.add('active');

        activeThumb.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }

      // -----------------------------
      // SCROLL TO IMAGE
      // -----------------------------

      function scrollToImage(index) {
        const target = imageItems[index];

        if (!target) return;

        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });

        updateActiveThumbnail(index);
      }

      // -----------------------------
      // OPEN
      // -----------------------------

      function openLightbox(index) {
        lightbox.hidden = false;

        document.body.style.overflow = 'hidden';

        scrollToImage(index);
      }

      // -----------------------------
      // CLOSE
      // -----------------------------

      function closeLightbox() {
        lightbox.hidden = true;

        document.body.style.overflow = '';
      }

      // -----------------------------
      // OBSERVER
      // -----------------------------

      const observer = new IntersectionObserver(
        (entries) => {
          if (isThumbnailScrolling) return;

          let activeEntry = null;

          entries.forEach((entry) => {
            if (entry.isIntersecting && (!activeEntry || entry.intersectionRatio > activeEntry.intersectionRatio)) {
              activeEntry = entry;
            }
          });

          if (!activeEntry) return;

          updateActiveThumbnail(Number(activeEntry.target.dataset.index));
        },
        {
          root: imagesWrapper,
          threshold: [0.2, 0.4, 0.6, 0.8, 1],
        }
      );

      imageItems.forEach((item) => {
        observer.observe(item);
      });

      // -----------------------------
      // MAIN IMAGE CLICK
      // -----------------------------

      slides.forEach((slide, index) => {
        slide.addEventListener('click', () => {
          openLightbox(index);
        });
      });

      // -----------------------------
      // THUMBNAIL CLICK
      // -----------------------------

      thumbnails.forEach((thumbnail) => {
        thumbnail.addEventListener('click', () => {
          isThumbnailScrolling = true;

          const index = Number(thumbnail.dataset.index);

          scrollToImage(index);

          setTimeout(() => {
            isThumbnailScrolling = false;
          }, 600);
        });
      });

      // -----------------------------
      // CLOSE EVENTS
      // -----------------------------

      closeBtn?.addEventListener('click', closeLightbox);

      overlay?.addEventListener('click', closeLightbox);

      // -----------------------------
      // ESC KEY
      // -----------------------------

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !lightbox.hidden) {
          closeLightbox();
        }
      });
    });
  });
</script>

<script>
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.product_gallery').forEach((gallery) => {
      const zoomType = gallery.dataset.zoomType;

      if (zoomType !== 'hover') return;

      const slides = gallery.querySelectorAll('.product_gallery_main_slide');

      slides.forEach((slide) => {
        const img = slide.querySelector('img');

        if (!img) return;

        let startDistance = 0;

        let currentScale = 1;

        let startX = 0;
        let startY = 0;

        let translateX = 0;
        let translateY = 0;

        let lastTranslateX = 0;
        let lastTranslateY = 0;

        let lastTap = 0;

        let rafId = null;

        img._zoomScale = 1;

        // -----------------------------
        // HELPERS
        // -----------------------------

        function getDistance(t1, t2) {
          return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        }

        function getBounds() {
          return {
            maxX: (img.offsetWidth * currentScale - img.offsetWidth) / 2,

            maxY: (img.offsetHeight * currentScale - img.offsetHeight) / 2,
          };
        }

        function updateTransform() {
          if (rafId) {
            cancelAnimationFrame(rafId);
          }

          rafId = requestAnimationFrame(() => {
            img.style.transform = `
              translate3d(${translateX}px, ${translateY}px, 0)
              scale(${currentScale})
            `;

            img._zoomScale = currentScale;
          });
        }

        function resetZoom() {
          currentScale = 1;

          translateX = 0;
          translateY = 0;

          lastTranslateX = 0;
          lastTranslateY = 0;

          updateTransform();
        }

        // -----------------------------
        // TOUCH START
        // -----------------------------

        slide.addEventListener(
          'touchstart',
          (e) => {
            if (e.touches.length === 2) {
              startDistance = getDistance(e.touches[0], e.touches[1]);
            }

            if (e.touches.length === 1 && currentScale > 1) {
              startX = e.touches[0].clientX;
              startY = e.touches[0].clientY;

              lastTranslateX = translateX;
              lastTranslateY = translateY;
            }
          },
          { passive: true }
        );

        // -----------------------------
        // TOUCH MOVE
        // -----------------------------

        slide.addEventListener(
          'touchmove',
          (e) => {
            // PINCH ZOOM

            if (e.touches.length === 2) {
              const distance = getDistance(e.touches[0], e.touches[1]);

              currentScale *= distance / startDistance;

              currentScale = Math.max(1, Math.min(currentScale, 4));

              startDistance = distance;

              if (currentScale <= 1.05) {
                resetZoom();

                e.preventDefault();

                return;
              }

              updateTransform();

              e.preventDefault();

              return;
            }

            // PAN

            if (e.touches.length === 1 && currentScale > 1) {
              const deltaX = e.touches[0].clientX - startX;

              const deltaY = e.touches[0].clientY - startY;

              const { maxX, maxY } = getBounds();

              translateX = Math.max(-maxX, Math.min(maxX, lastTranslateX + deltaX));

              translateY = Math.max(-maxY, Math.min(maxY, lastTranslateY + deltaY));

              updateTransform();

              e.preventDefault();
            }
          },
          { passive: false }
        );

        // -----------------------------
        // DOUBLE TAP
        // -----------------------------

        slide.addEventListener('touchend', (e) => {
          if (e.touches.length > 0) return;

          const currentTime = Date.now();

          const tapLength = currentTime - lastTap;

          if (tapLength > 0 && tapLength < 300) {
            if (currentScale < 1.5) {
              const rect = slide.getBoundingClientRect();

              const tapX = e.changedTouches[0].clientX - rect.left;

              const tapY = e.changedTouches[0].clientY - rect.top;

              currentScale = 2;

              translateX = -(tapX - rect.width / 2);

              translateY = -(tapY - rect.height / 2);

              const { maxX, maxY } = getBounds();

              translateX = Math.max(-maxX, Math.min(maxX, translateX));

              translateY = Math.max(-maxY, Math.min(maxY, translateY));

              updateTransform();
            } else {
              resetZoom();
            }
          }

          lastTap = currentTime;

          if (currentScale <= 1.05) {
            resetZoom();
          }
        });
      });
    });
  });
</script>
