class StickyAddToCart extends HTMLElement {
  connectedCallback() {
    this.productRoot = document.querySelector('[data-product-root]');

    this.image = this.querySelector('[data-sticky-image]');

    this.price = this.querySelector('[data-sticky-price]');

    this.button = this.querySelector('[data-sticky-atc]');

    this.buyButtons = document.querySelector('product-form');

    this.variant = null;

    this.onVariantChange = this.onVariantChange.bind(this);
    this.onSellingPlanChange = this.onSellingPlanChange.bind(this);
    this.onButtonClick = this.onButtonClick.bind(this);

    this.productRoot?.addEventListener('product:variant-change', this.onVariantChange);
    this.productRoot?.addEventListener('product:selling-plan-change', this.onSellingPlanChange);

    this.button?.addEventListener('click', this.onButtonClick);

    this.initObserver();
  }

  disconnectedCallback() {
    this.productRoot?.removeEventListener('product:variant-change', this.onVariantChange);
    this.productRoot?.removeEventListener('product:selling-plan-change', this.onSellingPlanChange);

    this.button?.removeEventListener('click', this.onButtonClick);

    this.observer?.disconnect();
  }

  initObserver() {
    if (!this.buyButtons) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.classList.remove('is-visible');
          } else {
            this.classList.add('is-visible');
          }
        });
      },
      {
        threshold: 0,
      }
    );

    this.observer.observe(this.buyButtons);
  }

  onVariantChange(event) {
    const variant = event.detail.variant;

    if (!variant) return;

    this.variant = variant;

    if (variant.featured_media?.preview_image?.src && this.image) {
      this.image.src = `${variant.featured_media.preview_image.src}&width=120`;
    }

    if (this.price) {
      this.price.textContent = window.theme.formatMoney(variant.price);
    }
  }

  onSellingPlanChange(event) {
    const { price } = event.detail;

    if (price == null || !this.price) return;

    this.price.textContent = window.theme.formatMoney(price);
  }

  onButtonClick() {
    const form = document.querySelector('product-form form');

    if (!form) return;

    form.requestSubmit();
  }
}

if (!customElements.get('sticky-add-to-cart')) {
  customElements.define('sticky-add-to-cart', StickyAddToCart);
}
