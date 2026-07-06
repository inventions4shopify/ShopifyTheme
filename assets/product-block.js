// JS for product block accordion functionality------------------

class ProductAccordion {
  constructor(details) {
    this.details = details;
    this.summary = details.querySelector(".product_accordion_summary");
    this.contentWrapper = details.querySelector(
      ".product_accordion_content_wrapper",
    );
    this.transitionDuration = 400;

    if (!this.summary || !this.contentWrapper) return;

    this.onSummaryClick = this.onSummaryClick.bind(this);
    this.summary.addEventListener("click", this.onSummaryClick);

    const startsOpen = this.details.hasAttribute("open");
    this.details.classList.toggle("is-active", startsOpen);

    if (startsOpen) {
      requestAnimationFrame(() => {
        this.contentWrapper.style.height = "auto";
      });
    } else {
      this.contentWrapper.style.height = "0px";
    }
  }

  onSummaryClick(event) {
    event.preventDefault();

    if (this.details.classList.contains("is-active")) {
      this.close();
    } else {
      this.closeOthers();
      this.open();
    }
  }

  closeOthers() {
    document.querySelectorAll(".product_accordion.is-active").forEach((accordion) => {
      if (accordion === this.details) return;
      accordion._productAccordion?.close();
    });
  }

  open() {
    this.details.classList.add("is-active");
    this.details.setAttribute("open", "");

    this.contentWrapper.style.height = "0px";
    const targetHeight = this.contentWrapper.scrollHeight;
    void this.contentWrapper.offsetHeight;

    requestAnimationFrame(() => {
      this.contentWrapper.style.height = `${targetHeight}px`;
    });

    this.waitForHeightTransition(() => {
      if (this.details.classList.contains("is-active")) {
        this.contentWrapper.style.height = "auto";
      }
    });
  }

  close() {
    this.details.classList.remove("is-active");

    const currentHeight = this.contentWrapper.scrollHeight;
    if (!currentHeight) {
      this.finishClose();
      return;
    }

    this.contentWrapper.style.height = `${currentHeight}px`;
    void this.contentWrapper.offsetHeight;

    requestAnimationFrame(() => {
      this.contentWrapper.style.height = "0px";
    });

    this.waitForHeightTransition(() => this.finishClose());
  }

  finishClose() {
    this.details.removeAttribute("open");
    this.contentWrapper.style.height = "0px";
  }

  waitForHeightTransition(callback) {
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      this.contentWrapper.removeEventListener("transitionend", onTransitionEnd);
      clearTimeout(fallbackTimer);
      callback();
    };

    const onTransitionEnd = (event) => {
      if (
        event.target === this.contentWrapper &&
        event.propertyName === "height"
      ) {
        finish();
      }
    };

    this.contentWrapper.addEventListener("transitionend", onTransitionEnd);
    const fallbackTimer = setTimeout(
      finish,
      this.transitionDuration,
    );
  }
}

function initProductAccordions(root = document) {
  root.querySelectorAll(".product_accordion:not([data-accordion-bound])").forEach((details) => {
    details.dataset.accordionBound = "true";
    details._productAccordion = new ProductAccordion(details);
  });
}

window.theme = window.theme || {};
window.theme.initProductAccordions = initProductAccordions;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initProductAccordions());
} else {
  initProductAccordions();
}

// Product recommendations slider ------------------

class ProductRecommendationsSlider extends HTMLElement {
  connectedCallback() {
    this.track = this.querySelector(".prs_track");

    this.slides = [...this.querySelectorAll(".prs_slide")];

    this.prevButton = this.querySelector(".prs_prev");

    this.nextButton = this.querySelector(".prs_next");

    this.currentIndex = 0;

    if (!this.track || !this.slides.length) return;

    this.gap = parseFloat(getComputedStyle(this.track).gap) || 0;

    this.prevButton?.addEventListener("click", () => this.prev());

    this.nextButton?.addEventListener("click", () => this.next());

    this.resizeHandler = () => {
      this.gap = parseFloat(getComputedStyle(this.track).gap) || 0;
      this.currentIndex = Math.min(this.currentIndex, this.getMaxIndex());

      this.update();
    };

    window.addEventListener("resize", this.resizeHandler);

    this.update();
  }

  disconnectedCallback() {
    window.removeEventListener("resize", this.resizeHandler);
  }

  getSlideStep() {
    const slideWidth = this.slides[0]?.offsetWidth || 0;

    return slideWidth + this.gap;
  }

  usesNativeScroll() {
    return window.innerWidth < 768;
  }

  getMaxIndex() {
    if (!this.slides.length) return 0;

    const viewport = this.querySelector(".prs_viewport");
    const step = this.getSlideStep();

    if (!viewport || !step) return Math.max(0, this.slides.length - 1);

    const maxOffset = Math.max(0, this.track.scrollWidth - viewport.clientWidth);

    return Math.max(0, Math.ceil(maxOffset / step));
  }

  next() {
    this.currentIndex = Math.min(this.currentIndex + 1, this.getMaxIndex());

    this.update();
  }

  prev() {
    this.currentIndex = Math.max(this.currentIndex - 1, 0);

    this.update();
  }

  update() {
    if (this.usesNativeScroll()) {
      this.track.style.transform = "";
      this.track.style.transition = "";
      return;
    }

    const maxIndex = this.getMaxIndex();
    const step = this.getSlideStep();
    let offset = step * this.currentIndex;

    if (this.currentIndex === maxIndex && maxIndex > 0) {
      const viewport = this.querySelector(".prs_viewport");
      offset = Math.max(
        0,
        this.track.scrollWidth - (viewport?.clientWidth || 0),
      );
    }

    this.track.style.transform = `translateX(-${offset}px)`;

    if (maxIndex === 0) {
      this.prevButton?.setAttribute("hidden", "");

      this.nextButton?.setAttribute("hidden", "");
    } else {
      this.prevButton?.removeAttribute("hidden");

      this.nextButton?.removeAttribute("hidden");
    }

    this.prevButton?.toggleAttribute("disabled", this.currentIndex === 0);

    this.nextButton?.toggleAttribute(
      "disabled",
      this.currentIndex === maxIndex,
    );
  }
}

if (!customElements.get("product-recommendations-slider")) {
  customElements.define(
    "product-recommendations-slider",
    ProductRecommendationsSlider,
  );
}

// Product recommendations slider end ------------------

// Product card form submission ------------------

class ProductCardForm extends HTMLElement {
  connectedCallback() {
    this.button = this.querySelector(".js_product_card_atc");
    this.variantId = this.querySelector("[data-variant-id]");

    if (!this.button || !this.variantId) return;

    this.button.addEventListener("click", this.onClick.bind(this));
  }

  async onClick() {
    this.button.disabled = true;
    this.button.classList.add("is-loading");
    const startTime = Date.now();
    let afterAdd = null;

    let addedItem = null;

    try {
      if (window.theme?.cart?.add) {
        addedItem = await window.theme.cart.add({
          id: this.variantId.value,
          quantity: 1,
        });
        afterAdd = () =>
          window.theme.cart.handleAfterAdd(window.theme?.cartType || "cart_drawer", addedItem);
      } else {
        const response = await fetch("/cart/add.js", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            id: this.variantId.value,
            quantity: 1,
          }),
        });

        if (!response.ok) {
          throw new Error("Unable to add this item to the cart.");
        }

        const addedItem = await response.json();

        afterAdd = () => {
          if (window.theme?.cart?.handleAfterAdd) {
            window.theme.cart.handleAfterAdd(window.theme?.cartType, addedItem);
            return;
          }

          window.location.href = "/cart";
        };
      }
    } catch (error) {
      console.error(error);
    } finally {
      const elapsed = Date.now() - startTime;
      if (elapsed < 500) {
        await new Promise((resolve) => setTimeout(resolve, 500 - elapsed));
      }
      this.button.disabled = false;
      this.button.classList.remove("is-loading");
      if (afterAdd) afterAdd();
    }
  }
}

if (!customElements.get("product-card-form")) {
  customElements.define("product-card-form", ProductCardForm);
}
// Product card form submission end ------------------
