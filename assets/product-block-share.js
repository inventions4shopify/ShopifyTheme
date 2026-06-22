class ProductShare extends HTMLElement {
  constructor() {
    super();

    this.onVariantChange = this.onVariantChange.bind(this);
    this.onClick = this.onClick.bind(this);
  }

  connectedCallback() {
    this.button = this.querySelector('[data-share-button]');
    this.label = this.querySelector('[data-share-label]');
    this.success = this.querySelector('[data-share-success]');
    this.productRoot = this.closest('[data-product-root]');
    this.title = this.dataset.title || document.title;

    this.productRoot?.addEventListener('product:variant-change', this.onVariantChange);
    this.button?.addEventListener('click', this.onClick);
  }

  disconnectedCallback() {
    this.productRoot?.removeEventListener('product:variant-change', this.onVariantChange);
    this.button?.removeEventListener('click', this.onClick);
    clearTimeout(this.successTimeout);
  }

  getShareUrl() {
    const url = new URL(window.location.href);

    const variantInput = this.productRoot?.querySelector('[data-variant-id]');
    if (variantInput?.value) {
      url.searchParams.set('variant', variantInput.value);
    }

    return url.toString();
  }

  onVariantChange() {
    this.shareUrl = this.getShareUrl();
  }

  showSuccess() {
    if (!this.label || !this.success) return;

    const defaultLabel = this.label.textContent;
    this.label.textContent = this.success.textContent;
    this.success.classList.remove('visually-hidden');

    clearTimeout(this.successTimeout);
    this.successTimeout = setTimeout(() => {
      this.label.textContent = defaultLabel;
      this.success.classList.add('visually-hidden');
    }, 2000);
  }

  async onClick() {
    const url = this.shareUrl || this.getShareUrl();

    try {
      if (navigator.share) {
        await navigator.share({
          title: this.title,
          url,
        });
        return;
      }

      await navigator.clipboard.writeText(url);
      this.showSuccess();
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error(error);
    }
  }
}

if (!customElements.get('product-share')) {
  customElements.define('product-share', ProductShare);
}
