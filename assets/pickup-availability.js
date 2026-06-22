class PickupAvailability extends HTMLElement {
  constructor() {
    super();

    this.onVariantChange = this.onVariantChange.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onKeydown = this.onKeydown.bind(this);
  }

  connectedCallback() {
    this.container = this.querySelector('[data-pickup-availability-container]');
    this.productRoot = this.closest('[data-product-root]');

    this.productRoot?.addEventListener('product:variant-change', this.onVariantChange);
    this.addEventListener('click', this.onClick);
    document.addEventListener('keydown', this.onKeydown);

    if (this.container?.querySelector('.pickup-availability-preview')) {
      this.updateModalProductDetails();
      return;
    }

    this.fetchAvailability(this.dataset.variantId);
  }

  disconnectedCallback() {
    this.productRoot?.removeEventListener('product:variant-change', this.onVariantChange);
    this.removeEventListener('click', this.onClick);
    document.removeEventListener('keydown', this.onKeydown);
  }

  onVariantChange(event) {
    const variant = event.detail?.variant;

    if (!variant) return;

    this.dataset.variantId = variant.id;
    this.fetchAvailability(variant.id);
  }

  onClick(event) {
    if (event.target.closest('[data-pickup-availability-open]')) {
      event.preventDefault();
      this.openModal();
      return;
    }

    if (
      event.target.closest('[data-pickup-availability-close]') ||
      event.target.closest('[data-pickup-availability-overlay]')
    ) {
      event.preventDefault();
      this.closeModal();
    }
  }

  onKeydown(event) {
    if (event.key === 'Escape') {
      this.closeModal();
    }
  }

  openModal() {
    const modal = this.querySelector('[data-pickup-availability-modal]');

    if (!modal) return;

    modal.hidden = false;
    document.body.classList.add('pickup-availability-open');
    modal.querySelector('[data-pickup-availability-close]')?.focus();
  }

  closeModal() {
    const modal = this.querySelector('[data-pickup-availability-modal]');

    if (!modal || modal.hidden) return;

    modal.hidden = true;
    document.body.classList.remove('pickup-availability-open');
  }

  getSectionUrl(variantId) {
    const rootUrl = this.dataset.rootUrl || '/';
    const normalizedRoot = rootUrl.endsWith('/') ? rootUrl : `${rootUrl}/`;

    return `${normalizedRoot}variants/${variantId}/?section_id=pickup-availability`;
  }

  fetchAvailability(variantId) {
    if (!variantId || !this.container) return;

    this.closeModal();

    fetch(this.getSectionUrl(variantId))
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Pickup availability request failed (${response.status})`);
        }

        return response.text();
      })
      .then((responseText) => {
        const html = new DOMParser().parseFromString(responseText, 'text/html');
        const section =
          html.querySelector('.shopify-section') ||
          html.querySelector('[id^="shopify-section-"]');

        this.container.innerHTML = section ? section.innerHTML : '';
        this.updateModalProductDetails();
      })
      .catch((error) => {
        console.error('Pickup availability fetch failed', error);
        this.container.innerHTML = '';
      });
  }

  updateModalProductDetails() {
    const productTitle = this.querySelector('[data-pickup-product-title]');
    const variantTitle = this.querySelector('[data-pickup-variant-title]');
    const currentVariantTitle = this.querySelector('[data-current-variant-title]')?.textContent?.trim();

    if (productTitle) {
      productTitle.textContent = this.dataset.productTitle || '';
    }

    if (!variantTitle) return;

    if (this.dataset.hasOnlyDefaultVariant === 'true') {
      variantTitle.hidden = true;
      return;
    }

    if (currentVariantTitle) {
      variantTitle.textContent = currentVariantTitle;
    }

    variantTitle.hidden = !variantTitle.textContent;
  }
}

if (!customElements.get('pickup-availability')) {
  customElements.define('pickup-availability', PickupAvailability);
}
