// JS for product block accordion functionality------------------

class ProductAccordion {
  constructor(details) {
    this.details = details;
    this.summary = details.querySelector(".product_accordion_summary");
    this.contentWrapper = details.querySelector(
      ".product_accordion_content_wrapper",
    );

    this.summary.addEventListener("click", this.onClick.bind(this));

    if (this.details.hasAttribute("open")) {
      this.contentWrapper.style.height = "auto";
    }
  }

  onClick(event) {
    event.preventDefault();

    const isOpen = this.details.hasAttribute("open");

    if (isOpen) {
      this.close();
    } else {
      this.closeOthers();
      this.open();
    }
  }

  closeOthers() {
    document
      .querySelectorAll(".product_accordion[open]")
      .forEach((accordion) => {
        if (accordion === this.details) return;

        accordion.querySelector(
          ".product_accordion_content_wrapper",
        ).style.height = `${
          accordion.querySelector(".product_accordion_content_wrapper")
            .scrollHeight
        }px`;

        requestAnimationFrame(() => {
          accordion.querySelector(
            ".product_accordion_content_wrapper",
          ).style.height = "0px";
        });

        accordion
          .querySelector(".product_accordion_content_wrapper")
          .addEventListener(
            "transitionend",
            () => {
              accordion.removeAttribute("open");
            },
            { once: true },
          );
      });
  }

  open() {
    this.details.setAttribute("open", "");

    this.contentWrapper.style.height = "0px";

    requestAnimationFrame(() => {
      this.contentWrapper.style.height = `${this.contentWrapper.scrollHeight}px`;
    });

    this.contentWrapper.addEventListener(
      "transitionend",
      () => {
        if (this.details.hasAttribute("open")) {
          this.contentWrapper.style.height = "auto";
        }
      },
      { once: true },
    );
  }

  close() {
    this.contentWrapper.style.height = `${this.contentWrapper.scrollHeight}px`;

    requestAnimationFrame(() => {
      this.contentWrapper.style.height = "0px";
    });

    this.contentWrapper.addEventListener(
      "transitionend",
      () => {
        this.details.removeAttribute("open");
      },
      { once: true },
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".product_accordion").forEach((accordion) => {
    new ProductAccordion(accordion);
  });
});

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
      this.currentIndex = Math.min(this.currentIndex, this.getMaxIndex());

      this.update();
    };

    window.addEventListener("resize", this.resizeHandler);

    this.update();
  }

  disconnectedCallback() {
    window.removeEventListener("resize", this.resizeHandler);
  }

  getSlidesPerView() {
    if (window.innerWidth >= 992) {
      return 4;
    }

    if (window.innerWidth >= 768) {
      return 2;
    }

    return 1;
  }

  getMaxIndex() {
    return Math.max(0, this.slides.length - this.getSlidesPerView());
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
    const slideWidth = this.slides[0]?.offsetWidth || 0;

    const offset = (slideWidth + this.gap) * this.currentIndex;

    this.track.style.transform = `translateX(-${offset}px)`;

    const maxIndex = this.getMaxIndex();

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
    console.log("connected callback fired");

    this.button = this.querySelector(".product_card_atc");
    this.variantId = this.querySelector("[data-variant-id]");

    console.log(this.button);
    console.log(this.variantId);

    if (!this.button || !this.variantId) return;

    this.button.addEventListener("click", this.onClick.bind(this));
  }

  async onClick() {
    console.log("clicked");

    console.log("variant id", this.variantId.value);

    try {
      const response = await fetch("/cart/add.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: this.variantId.value,
          quantity: 1,
        }),
      });

      console.log(response);

      const data = await response.json();

      console.log(data);
    } catch (error) {
      console.error(error);
    }
  }
}

if (!customElements.get("product-card-form")) {
  customElements.define("product-card-form", ProductCardForm);
}
// Product card form submission end ------------------
