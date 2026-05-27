



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

      let currentIndex = 0;

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

        track.style.transform = `translateX(-${index * 100}%)`;

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
      // BUTTON NAVIGATION
      // ---------------------------------

      nextButton.addEventListener('click', () => {
        updateSlider(currentIndex + 1);
      });

      prevButton.addEventListener('click', () => {
        updateSlider(currentIndex - 1);
      });

      // ---------------------------------
      // THUMBNAIL CLICK
      // ---------------------------------

      thumbnails.forEach((thumbnail) => {
        thumbnail.addEventListener('click', function () {
          const index = Number(this.dataset.index);

          updateSlider(index);
        });
      });

      // ---------------------------------
      // MAIN SLIDER SWIPE / DRAG
      // ---------------------------------

      let startX = 0;
      let currentX = 0;
      let isDragging = false;

      function startDrag(x) {
        isDragging = true;

        startX = x;

        currentX = x;
      }

      function moveDrag(x) {
        if (!isDragging) return;

        currentX = x;
      }

      function endDrag() {
        if (!isDragging) return;

        const diff = startX - currentX;

        if (Math.abs(diff) > 50) {
          if (diff > 0) {
            updateSlider(currentIndex + 1);
          } else {
            updateSlider(currentIndex - 1);
          }
        }

        isDragging = false;
      }

      // ---------------------------------
      // TOUCH EVENTS
      // ---------------------------------

      slider.addEventListener(
        'touchstart',
        (e) => {
          startDrag(e.touches[0].clientX);
        },
        { passive: true }
      );

      slider.addEventListener(
        'touchmove',
        (e) => {
          moveDrag(e.touches[0].clientX);
        },
        { passive: true }
      );

      slider.addEventListener('touchend', () => {
        endDrag();
      });

      // ---------------------------------
      // DESKTOP MOUSE DRAG
      // ---------------------------------

      let mouseDown = false;

      slider.addEventListener('mousedown', (e) => {
        e.preventDefault();

        mouseDown = true;

        startDrag(e.clientX);

        slider.style.cursor = 'grabbing';
      });

      window.addEventListener('mousemove', (e) => {
        if (!mouseDown) return;

        moveDrag(e.clientX);
      });

      window.addEventListener('mouseup', () => {
        if (!mouseDown) return;

        mouseDown = false;

        endDrag();

        slider.style.cursor = 'grab';
      });

      // ---------------------------------
      // THUMBNAIL DRAG SCROLL
      // ---------------------------------

      let isDown = false;
      let startThumbX;
      let scrollLeft;

      thumbnailTrack.addEventListener('mousedown', (e) => {
        isDown = true;

        thumbnailTrack.classList.add('dragging');

        startThumbX = e.pageX - thumbnailTrack.offsetLeft;

        scrollLeft = thumbnailTrack.scrollLeft;
      });

      thumbnailTrack.addEventListener('mouseleave', () => {
        isDown = false;

        thumbnailTrack.classList.remove('dragging');
      });

      thumbnailTrack.addEventListener('mouseup', () => {
        isDown = false;

        thumbnailTrack.classList.remove('dragging');
      });

      thumbnailTrack.addEventListener('mousemove', (e) => {
        if (!isDown) return;

        e.preventDefault();

        const x = e.pageX - thumbnailTrack.offsetLeft;

        const walk = (x - startThumbX) * 1.5;

        thumbnailTrack.scrollLeft = scrollLeft - walk;
      });
    });
  });
