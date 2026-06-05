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

// JS for product block accordion functionality end------------------