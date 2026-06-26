class ProductForm extends HTMLElement {
  constructor() {
    super();

    this.onVariantChange = this.onVariantChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  connectedCallback() {
    this.form = this.querySelector('form');
    this.variantInput = this.querySelector('[data-variant-id]');
    this.addToCartButton = this.querySelector('[data-add-to-cart]');
    this.addToCartText = this.querySelector('[data-add-to-cart-text]');
    this.productRoot = this.closest('[data-product-root]');

    this.productRoot?.addEventListener('product:variant-change', this.onVariantChange);
    this.form?.addEventListener('submit', this.onSubmit);
  }

  disconnectedCallback() {
    this.productRoot?.removeEventListener('product:variant-change', this.onVariantChange);
    this.form?.removeEventListener('submit', this.onSubmit);
  }

  onVariantChange(event) {
    const variant = event.detail.variant;

    if (!variant) return;

    this.variantInput.value = variant.id;
    this.currentVariant = variant;
    this.updateButton(variant);
  }

  updateButton(variant) {
    if (!this.addToCartButton) return;

    if (variant.available) {
      this.addToCartButton.disabled = false;
      this.addToCartText.textContent = 'Add to cart';
    } else {
      this.addToCartButton.disabled = true;
      this.addToCartText.textContent = 'Sold out';
    }
  }

  setLoading(isLoading) {
    const button = this.querySelector('[data-add-to-cart]');
    const spinner = this.querySelector('[data-spinner]');

    if (button) {
      button.classList.toggle('loading', isLoading);
      button.disabled = isLoading;
    }

    if (spinner) {
      spinner.classList.toggle('hidden', !isLoading);
    }
  }

  ensureMinLoading(startTime, min = 500) {
    const elapsed = Date.now() - startTime;
    return elapsed < min
      ? new Promise((resolve) => setTimeout(resolve, min - elapsed))
      : Promise.resolve();
  }

  async onSubmit(event) {
    event.preventDefault();

    if (!this.form) return;

    const cartType = this.dataset.cartType || 'cart_page';

    this.setLoading(true);
    const startTime = Date.now();
    let afterAdd = null;

    let addedItem = null;

    try {
      if (window.theme?.cart?.add) {
        addedItem = await window.theme.cart.add(new FormData(this.form));
        afterAdd = () => window.theme.cart.handleAfterAdd(cartType, addedItem);
      } else {
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          body: new FormData(this.form),
        });

        if (!response.ok) {
          throw new Error('Unable to add this item to the cart.');
        }

        const addedItem = await response.json();

        afterAdd = () => {
          if (window.theme?.cart?.handleAfterAdd) {
            window.theme.cart.handleAfterAdd(window.theme?.cartType, addedItem);
            return;
          }

          window.location.href = '/cart';
        };
      }
    } catch (error) {
      console.error(error);
      window.alert(error.message || 'Unable to add this item to the cart.');
    } finally {
      // Keep the loader visible for the whole request (and a minimum time),
      // then hide it and run the post-add behavior (open drawer / redirect).
      await this.ensureMinLoading(startTime);
      this.setLoading(false);
      if (afterAdd) afterAdd();
    }
  }
}

if (!customElements.get('product-form')) {
  customElements.define('product-form', ProductForm);
}
