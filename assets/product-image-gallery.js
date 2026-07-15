function initProductGalleries(root = document) {
  root.querySelectorAll(".product_gallery:not([data-gallery-initialized])").forEach((gallery) => {
    gallery.dataset.galleryInitialized = "true";
    const slider = gallery.querySelector(".product_gallery_main_slider");
    const track = gallery.querySelector(".product_gallery_main_track");

    const slides = [...gallery.querySelectorAll(".product_gallery_main_slide")];
    const thumbnails = [
      ...gallery.querySelectorAll(".product_gallery_thumbnail"),
    ];

    const thumbnailTrack = gallery.querySelector(
      ".product_gallery_thumbnail_track",
    );

    const prevButton = gallery.querySelector(".product_gallery_arrow_prev");
    const nextButton = gallery.querySelector(".product_gallery_arrow_next");

    if (!slider || !track || !slides.length) return;

    const isVertical = gallery.classList.contains("product_gallery--vertical");

    let currentIndex = 0;

    const getSlideWidth = () => {
      if (!slides.length) return 0;

      const gap = parseFloat(getComputedStyle(track).gap) || 0;

      return slides[0].offsetWidth + gap;
    };

    function updateThumbnailHeight() {
      const mainWrapper = gallery.querySelector(
        ".product_gallery_main_wrapper",
      );

      if (!mainWrapper) return;

      const heightPx = mainWrapper.offsetHeight;
      const rootFontSize = 10;

      const heightRem = heightPx / rootFontSize;

      gallery.style.setProperty("--thumbnail-height", `${heightRem}`);
    }

    function scrollThumbnailIntoView(thumb, behavior = "smooth") {
      if (!thumb || !thumbnailTrack) return;

      // Center the thumbnail within its own track only.
      // Using Element.scrollIntoView() here would scroll every scrollable
      // ancestor (including the window), jumping the whole page to the
      // gallery on load when it sits below the fold.
      if (isVertical) {
        const offset =
          thumb.offsetTop -
          (thumbnailTrack.clientHeight - thumb.offsetHeight) / 2;

        thumbnailTrack.scrollTo({ top: offset, behavior });
      } else {
        const offset =
          thumb.offsetLeft -
          (thumbnailTrack.clientWidth - thumb.offsetWidth) / 2;

        thumbnailTrack.scrollTo({ left: offset, behavior });
      }
    }

    function updateActiveThumbnail(index, shouldScroll = true) {
      thumbnails.forEach((thumb) => thumb.classList.remove("active"));

      const thumb = thumbnails[index];

      thumb?.classList.add("active");

      if (shouldScroll) {
        scrollThumbnailIntoView(thumb);
      }
    }

    function pauseSlideMedia(slide) {
      if (!slide) return;

      slide.querySelectorAll("video").forEach((video) => {
        video.pause();
      });

      slide.querySelectorAll("iframe").forEach((iframe) => {
        try {
          iframe.contentWindow?.postMessage(
            '{"event":"command","func":"pauseVideo","args":""}',
            "*",
          );
          iframe.contentWindow?.postMessage('{"method":"pause"}', "*");
        } catch (error) {
          // Cross-origin hosts may block postMessage; ignore safely.
        }
      });
    }

    function pauseInactiveMedia(activeIndex) {
      slides.forEach((slide, index) => {
        if (index === activeIndex) return;
        pauseSlideMedia(slide);
      });
    }

    function isInteractiveMediaTarget(target) {
      return Boolean(target?.closest?.("video, iframe"));
    }

    function updateSlider(index, shouldScrollThumb = true) {
      if (!slides.length) return;

      if (index < 0) {
        index = slides.length - 1;
      }

      if (index >= slides.length) {
        index = 0;
      }

      track.style.transition = "transform 0.4s ease";

      track.style.transform = `translate3d(-${index * getSlideWidth()}px,0,0)`;

      updateActiveThumbnail(index, shouldScrollThumb);

      pauseInactiveMedia(index);

      currentIndex = index;
    }

    /* ---------------------------------
      RESIZE
    --------------------------------- */

    window.addEventListener("resize", () => {
      updateSlider(currentIndex, false);
    });

    // ---------------------------------
    // ARROWS
    // ---------------------------------

    nextButton?.addEventListener("click", () => {
      updateSlider(currentIndex + 1);
    });

    prevButton?.addEventListener("click", () => {
      updateSlider(currentIndex - 1);
    });

    // ---------------------------------
    // THUMBNAILS
    // ---------------------------------

    thumbnails.forEach((thumbnail) => {
      thumbnail.addEventListener("click", () => {
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
      track.style.transition = "none";

      track.style.transform = `translate3d(${value}px,0,0)`;
    }

    function canDragSlider(event) {
      if (event && isInteractiveMediaTarget(event.target)) {
        return false;
      }

      const activeSlide = slides[currentIndex];
      const activeImg =
        activeSlide?.querySelector("picture img") ||
        (activeSlide?.dataset.mediaType === "image"
          ? activeSlide.querySelector("img")
          : null);

      if (activeImg?._zoomScale > 1) {
        return false;
      }

      const zoomType = gallery.dataset.zoomType || "none";
      const hoverZoomStyle = gallery.dataset.hoverZoomStyle || "";

      if (
        window.innerWidth > 991 &&
        zoomType === "hover" &&
        hoverZoomStyle === "magnifier"
      ) {
        return false;
      }

      return true;
    }

    function startDrag(x) {
      isDragging = true;

      startX = x;
      currentX = x;

      prevTranslate = -(currentIndex * getSlideWidth());

      track.style.transition = "none";
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

      slider.style.cursor = "grab";
    }

    // ---------------------------------
    // TOUCH
    // ---------------------------------

    slider.addEventListener(
      "touchstart",
      (e) => {
        if (!canDragSlider(e)) return;

        if (e.touches.length !== 1) return;

        startDrag(e.touches[0].clientX);
      },
      { passive: true },
    );

    slider.addEventListener(
      "touchmove",
      (e) => {
        if (!canDragSlider(e)) return;

        if (e.touches.length !== 1) return;

        moveDrag(e.touches[0].clientX);
      },
      { passive: true },
    );

    slider.addEventListener("touchend", endDrag);

    // ---------------------------------
    // DESKTOP DRAG
    // ---------------------------------

    slider.addEventListener("mousedown", (e) => {
      const enableDesktopDrag = gallery.dataset.enableDesktopDrag === "true";

      if (!enableDesktopDrag) return;

      if (!canDragSlider(e)) return;

      e.preventDefault();

      slider.style.cursor = "grabbing";

      startDrag(e.clientX);
    });

    window.addEventListener("mousemove", (e) => {
      const enableDesktopDrag = gallery.dataset.enableDesktopDrag === "true";

      if (!enableDesktopDrag) return;

      moveDrag(e.clientX);
    });

    window.addEventListener("mouseup", () => {
      const enableDesktopDrag = gallery.dataset.enableDesktopDrag === "true";

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

      thumbnailTrack.addEventListener("mousedown", (e) => {
        isThumbDragging = true;

        dragMoved = false;

        thumbnailTrack.classList.add("dragging");

        thumbStartPosition = isVertical ? e.pageY : e.pageX;

        thumbScrollPosition = isVertical
          ? thumbnailTrack.scrollTop
          : thumbnailTrack.scrollLeft;

        thumbnailTrack.style.cursor = "grabbing";

        e.preventDefault();
      });

      window.addEventListener("mouseup", () => {
        isThumbDragging = false;

        thumbnailTrack.classList.remove("dragging");

        thumbnailTrack.style.cursor = "";
      });

      window.addEventListener("mousemove", (e) => {
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
          "click",
          (e) => {
            if (!dragMoved) return;

            e.preventDefault();
            e.stopPropagation();
          },
          true,
        );
      });
    }

    updateSlider(0, false);

    updateThumbnailHeight();
  });
}

// Below script block is for preview window zoom style, keep it if you support it.

document.addEventListener("DOMContentLoaded", () => {
  const isTouchDevice =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;

  if (isTouchDevice) return;

  document.querySelectorAll(".product_gallery").forEach((gallery) => {
    const zoomType = gallery.dataset.zoomType || "none";
    const hoverZoomStyle = gallery.dataset.hoverZoomStyle || "same_image";

    if (zoomType !== "hover" || hoverZoomStyle !== "preview_window") {
      return;
    }

    const preview = gallery.querySelector(".product_gallery_zoom_preview");

    const previewImage = gallery.querySelector(
      ".product_gallery_zoom_preview_image",
    );

    if (!preview || !previewImage) return;

    const slides = gallery.querySelectorAll(".product_gallery_main_slide");

    slides.forEach((slide) => {
      if (slide.dataset.mediaType && slide.dataset.mediaType !== "image") {
        return;
      }

      const image = slide.querySelector("picture img") || slide.querySelector("img");

      if (!image) return;

      // -----------------------------
      // CREATE LENS (ONLY ONCE)
      // -----------------------------

      let lens = slide.querySelector(".product_gallery_zoom_lens");

      if (!lens) {
        lens = document.createElement("div");

        lens.className = "product_gallery_zoom_lens";

        slide.appendChild(lens);
      }

      let animationFrame = null;

      // -----------------------------
      // MOUSE ENTER
      // -----------------------------

      slide.addEventListener("mouseenter", () => {
        preview.classList.add("active");

        lens.classList.add("active");

        const fullImage = slide.dataset.full;

        if (previewImage.dataset.currentImage !== fullImage) {
          previewImage.style.backgroundImage = `url(${fullImage})`;

          previewImage.dataset.currentImage = fullImage;
        }

        previewImage.style.backgroundSize = "200%";
      });

      // -----------------------------
      // MOUSE LEAVE
      // -----------------------------

      slide.addEventListener("mouseleave", () => {
        preview.classList.remove("active");

        lens.classList.remove("active");

        if (animationFrame) {
          cancelAnimationFrame(animationFrame);

          animationFrame = null;
        }
      });

      // -----------------------------
      // MOUSE MOVE
      // -----------------------------

      slide.addEventListener("mousemove", (event) => {
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

// Below script block Keep it if you support Magnifier zoom.

document.addEventListener("DOMContentLoaded", () => {
  const isTouchDevice =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;

  if (isTouchDevice) return;

  document.querySelectorAll(".product_gallery").forEach((gallery) => {
    const zoomType = gallery.dataset.zoomType || "none";
    const hoverZoomStyle = gallery.dataset.hoverZoomStyle || "";

    if (zoomType !== "hover" || hoverZoomStyle !== "magnifier") {
      return;
    }

    const slides = gallery.querySelectorAll(".product_gallery_main_slide");

    slides.forEach((slide) => {
      if (slide.dataset.mediaType && slide.dataset.mediaType !== "image") {
        return;
      }

      const img = slide.querySelector("picture img") || slide.querySelector("img");

      if (!img) return;

      let rafId = null;

      slide.addEventListener("mouseenter", () => {
        slide.classList.add("magnifier_active");
      });

      slide.addEventListener("mousemove", (e) => {
        if (rafId) cancelAnimationFrame(rafId);

        rafId = requestAnimationFrame(() => {
          const rect = slide.getBoundingClientRect();

          const xPercent = ((e.clientX - rect.left) / rect.width) * 100;

          const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

          img.style.transformOrigin = `${xPercent}% ${yPercent}%`;
        });
      });

      slide.addEventListener("mouseleave", () => {
        slide.classList.remove("magnifier_active");

        img.style.transformOrigin = "center center";

        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      });
    });
  });
});

// Below script block is for Lightbox zoom style, keep it if you support it.

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".product_gallery").forEach((gallery) => {
    const zoomType = gallery.dataset.zoomType || "none";

    if (zoomType !== "lightbox") return;

    const lightbox = gallery.parentElement.querySelector(".product_lightbox");

    if (!lightbox) return;

    const slides = gallery.querySelectorAll(".product_gallery_main_slide");

    const closeBtn = lightbox.querySelector(".product_lightbox_close");

    const overlay = lightbox.querySelector(".product_lightbox_overlay");

    const thumbnails = lightbox.querySelectorAll(".product_lightbox_thumbnail");

    const imageItems = lightbox.querySelectorAll(
      ".product_lightbox_image_item",
    );

    const imagesWrapper = lightbox.querySelector(".product_lightbox_images");

    let isThumbnailScrolling = false;

    // -----------------------------
    // ACTIVE THUMBNAIL
    // -----------------------------

    function updateActiveThumbnail(index) {
      thumbnails.forEach((thumb) => {
        thumb.classList.remove("active");
      });

      const activeThumb = thumbnails[index];

      if (!activeThumb) return;

      activeThumb.classList.add("active");

      activeThumb.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }

    // -----------------------------
    // SCROLL TO IMAGE
    // -----------------------------

    function scrollToImage(index) {
      const target = imageItems[index];

      if (!target) return;

      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      updateActiveThumbnail(index);
    }

    // -----------------------------
    // OPEN
    // -----------------------------

    function openLightbox(index) {
      lightbox.hidden = false;

      document.body.style.overflow = "hidden";
      document.body.classList.add("product-lightbox-open");

      scrollToImage(index);
    }

    // -----------------------------
    // CLOSE
    // -----------------------------

    function pauseLightboxMedia() {
      lightbox.querySelectorAll("video").forEach((video) => {
        video.pause();
      });

      lightbox.querySelectorAll("iframe").forEach((iframe) => {
        try {
          iframe.contentWindow?.postMessage(
            '{"event":"command","func":"pauseVideo","args":""}',
            "*",
          );
          iframe.contentWindow?.postMessage('{"method":"pause"}', "*");
        } catch (error) {
          // Cross-origin hosts may block postMessage; ignore safely.
        }
      });
    }

    function closeLightbox() {
      pauseLightboxMedia();

      lightbox.hidden = true;

      document.body.style.overflow = "";
      document.body.classList.remove("product-lightbox-open");
    }

    // -----------------------------
    // OBSERVER
    // -----------------------------

    const observer = new IntersectionObserver(
      (entries) => {
        if (isThumbnailScrolling) return;

        let activeEntry = null;

        entries.forEach((entry) => {
          if (
            entry.isIntersecting &&
            (!activeEntry ||
              entry.intersectionRatio > activeEntry.intersectionRatio)
          ) {
            activeEntry = entry;
          }
        });

        if (!activeEntry) return;

        updateActiveThumbnail(Number(activeEntry.target.dataset.index));
      },
      {
        root: imagesWrapper,
        threshold: [0.2, 0.4, 0.6, 0.8, 1],
      },
    );

    imageItems.forEach((item) => {
      observer.observe(item);
    });

    // -----------------------------
    // MAIN IMAGE CLICK
    // -----------------------------

    slides.forEach((slide, index) => {
      // Keep video/external video interactive in-place; only images open lightbox.
      if (slide.dataset.mediaType && slide.dataset.mediaType !== "image") {
        return;
      }

      slide.addEventListener("click", () => {
        openLightbox(index);
      });
    });

    // -----------------------------
    // THUMBNAIL CLICK
    // -----------------------------

    thumbnails.forEach((thumbnail) => {
      thumbnail.addEventListener("click", () => {
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

    closeBtn?.addEventListener("click", closeLightbox);

    overlay?.addEventListener("click", closeLightbox);

    // -----------------------------
    // ESC KEY
    // -----------------------------

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !lightbox.hidden) {
        closeLightbox();
      }
    });
  });
});

/* Pinch Zoom and double tap zoom for touch devices, keep it if you support it. */

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".product_gallery").forEach((gallery) => {
    const zoomType = gallery.dataset.zoomType;

    if (zoomType !== "hover") return;

    const slides = gallery.querySelectorAll(".product_gallery_main_slide");

    slides.forEach((slide) => {
      if (slide.dataset.mediaType && slide.dataset.mediaType !== "image") {
        return;
      }

      const img = slide.querySelector("picture img") || slide.querySelector("img");

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
        "touchstart",
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
        { passive: true },
      );

      // -----------------------------
      // TOUCH MOVE
      // -----------------------------

      slide.addEventListener(
        "touchmove",
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

            translateX = Math.max(
              -maxX,
              Math.min(maxX, lastTranslateX + deltaX),
            );

            translateY = Math.max(
              -maxY,
              Math.min(maxY, lastTranslateY + deltaY),
            );

            updateTransform();

            e.preventDefault();
          }
        },
        { passive: false },
      );

      // -----------------------------
      // DOUBLE TAP
      // -----------------------------

      slide.addEventListener("touchend", (e) => {
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

document.addEventListener("DOMContentLoaded", () => {
  initProductGalleries();
});

window.theme = window.theme || {};
window.theme.initProductGalleries = initProductGalleries;
