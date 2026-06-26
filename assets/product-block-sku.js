class ProductSku extends HTMLElement {
  constructor() {
    super();

    this.onVariantChange = this.onVariantChange.bind(this);
  }

  connectedCallback() {
    this.skuValue = this.querySelector('[data-sku]');
    this.productRoot = this.closest('[data-product-root]');
    this.hideWhenEmpty = this.dataset.hideWhenEmpty === 'true';

    this.productRoot?.addEventListener('product:variant-change', this.onVariantChange);
  }

  disconnectedCallback() {
    this.productRoot?.removeEventListener('product:variant-change', this.onVariantChange);
  }

  onVariantChange(event) {
    const sku = event.detail.variant?.sku || '';

    if (this.skuValue) {
      this.skuValue.textContent = sku;
    }

    if (this.hideWhenEmpty) {
      this.toggleAttribute('hidden', !sku);
    }
  }
}

if (!customElements.get('product-sku')) {
  customElements.define('product-sku', ProductSku);
}
