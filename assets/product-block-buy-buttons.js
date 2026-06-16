class ProductForm extends HTMLElement {
  constructor() {
    super();

    this.onVariantChange = this.onVariantChange.bind(this);
    this.onQuantityDecrease = this.onQuantityDecrease.bind(this);
    this.onQuantityIncrease = this.onQuantityIncrease.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  connectedCallback() {
    this.form = this.querySelector('form');
    this.variantInput = this.querySelector('[data-variant-id]');
    this.addToCartButton = this.querySelector('[data-add-to-cart]');
    this.addToCartText = this.querySelector('[data-add-to-cart-text]');
    this.quantityInput = this.querySelector('[data-quantity-input]');
    this.quantityDecreaseButton = this.querySelector('[data-quantity-decrease]');
    this.quantityIncreaseButton = this.querySelector('[data-quantity-increase]');
    this.productRoot = this.closest('[data-product-root]');

    this.productRoot?.addEventListener('product:variant-change', this.onVariantChange);
    this.quantityDecreaseButton?.addEventListener('click', this.onQuantityDecrease);
    this.quantityIncreaseButton?.addEventListener('click', this.onQuantityIncrease);
    this.form?.addEventListener('submit', this.onSubmit);
  }

  disconnectedCallback() {
    this.productRoot?.removeEventListener('product:variant-change', this.onVariantChange);
    this.quantityDecreaseButton?.removeEventListener('click', this.onQuantityDecrease);
    this.quantityIncreaseButton?.removeEventListener('click', this.onQuantityIncrease);
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

  onQuantityDecrease() {
    if (!this.quantityInput) return;

    const currentQuantity = Number(this.quantityInput.value) || 1;
    this.quantityInput.value = Math.max(1, currentQuantity - 1);
  }

  onQuantityIncrease() {
    if (!this.quantityInput) return;

    const currentQuantity = Number(this.quantityInput.value) || 1;
    this.quantityInput.value = currentQuantity + 1;
  }

  async onSubmit(event) {
    event.preventDefault();

    if (!this.form) return;

    const cartType = this.dataset.cartType || 'cart_page';

    try {
      if (window.theme?.cart?.add) {
        await window.theme.cart.add(new FormData(this.form));
        window.theme.cart.handleAfterAdd(cartType);
        return;
      }

      const response = await fetch('/cart/add.js', {
        method: 'POST',
        body: new FormData(this.form),
      });

      if (!response.ok) {
        throw new Error('Unable to add this item to the cart.');
      }

      await response.json();

      if (window.theme?.cartType === 'cart_drawer' && window.theme.openCartDrawer?.()) {
        return;
      }

      window.location.href = '/cart';
    } catch (error) {
      console.error(error);
      window.alert(error.message || 'Unable to add this item to the cart.');
    }
  }
}

if (!customElements.get('product-form')) {
  customElements.define('product-form', ProductForm);
}
