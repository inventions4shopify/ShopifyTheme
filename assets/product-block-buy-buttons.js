if (!customElements.get('product-form')) {
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

  async onSubmit(event) {
    event.preventDefault();

    if (!this.form) return;

    const cartType = this.dataset.cartType || 'cart_page';

    this.setLoading(true);

    try {
      if (window.theme?.cart?.add) {
        const addedItem = await window.theme.cart.add(new FormData(this.form));
        this.setLoading(false);
        window.theme.cart.handleAfterAdd(cartType, addedItem);
        return;
      }

      const response = await fetch('/cart/add.js', {
        method: 'POST',
        body: new FormData(this.form),
      });

      if (!response.ok) {
        throw new Error('Unable to add this item to the cart.');
      }

      const addedItem = await response.json();
      this.setLoading(false);

      if (window.theme?.cart?.handleAfterAdd) {
        window.theme.cart.handleAfterAdd(window.theme?.cartType, addedItem);
        return;
      }

      window.location.href = '/cart';
    } catch (error) {
      console.error(error);
      window.alert(error.message || 'Unable to add this item to the cart.');
      this.setLoading(false);
    }
  }
  }

  customElements.define('product-form', ProductForm);
}
