class ProductSku extends HTMLElement {
  constructor() {
    super();

    this.onVariantChange = this.onVariantChange.bind(this);
  }

  connectedCallback() {
    this.skuValue = this.querySelector('[data-sku]');
    this.skuLabel = this.querySelector('.product_sku_label');
    this.productRoot = this.closest('[data-product-root]');
    this.hideWhenEmpty = this.dataset.hideWhenEmpty === 'true';

    this.updateSku(this.skuValue?.textContent?.trim() || '');

    this.productRoot?.addEventListener('product:variant-change', this.onVariantChange);
  }

  disconnectedCallback() {
    this.productRoot?.removeEventListener('product:variant-change', this.onVariantChange);
  }

  onVariantChange(event) {
    this.updateSku(event.detail.variant?.sku?.trim() || '');
  }

  updateSku(sku) {
    if (this.skuValue) {
      this.skuValue.textContent = sku;
    }

    if (this.skuLabel) {
      this.skuLabel.hidden = !sku;
    }

    if (this.hideWhenEmpty) {
      this.toggleAttribute('hidden', !sku);
    }
  }
}

if (!customElements.get('product-sku')) {
  customElements.define('product-sku', ProductSku);
}
