class SellingPlansPicker extends HTMLElement {
  constructor() {
    super();

    this.onVariantChange = this.onVariantChange.bind(this);
    this.onOptionChange = this.onOptionChange.bind(this);
  }

  connectedCallback() {
    this.productRoot = this.closest('[data-product-root]');
    this.variantSections = this.querySelectorAll('[data-selling-plan-variant]');
    this.requiresSellingPlan = this.dataset.requiresSellingPlan === 'true';

    this.productRoot?.addEventListener('product:variant-change', this.onVariantChange);
    this.addEventListener('change', this.onOptionChange);

    const variantInput = this.productRoot?.querySelector('[data-variant-id]');
    if (variantInput?.value) {
      this.showVariantSection(variantInput.value);
      this.syncSellingPlanInput();
      this.dispatchPriceUpdate();
    }
  }

  disconnectedCallback() {
    this.productRoot?.removeEventListener('product:variant-change', this.onVariantChange);
  }

  get sellingPlanInput() {
    return this.productRoot?.querySelector('[data-selling-plan-input]');
  }

  get selectedRadio() {
    const visibleSection = this.querySelector(
      `[data-selling-plan-variant]:not(.selling_plans_variant--hidden)`
    );

    return visibleSection?.querySelector('input[type="radio"]:checked');
  }

  onVariantChange(event) {
    const variant = event.detail.variant;
    if (!variant) return;

    this.showVariantSection(String(variant.id));
    this.selectDefaultOption(variant.id);
    this.syncSellingPlanInput();
    this.dispatchPriceUpdate();
  }

  onOptionChange(event) {
    if (event.target.type !== 'radio') return;

    this.syncSellingPlanInput();
    this.dispatchPriceUpdate();
  }

  showVariantSection(variantId) {
    this.variantSections.forEach((section) => {
      const isSelected = section.dataset.sellingPlanVariant === String(variantId);
      section.classList.toggle('selling_plans_variant--hidden', !isSelected);
    });
  }

  selectDefaultOption(variantId) {
    const section = this.querySelector(`[data-selling-plan-variant="${variantId}"]`);
    if (!section) return;

    const oneTime = section.querySelector('[data-radio-type="one_time_purchase"]');
    const firstPlan = section.querySelector('[data-radio-type="selling_plan"]');

    if (oneTime && !this.requiresSellingPlan) {
      oneTime.checked = true;
    } else if (firstPlan) {
      firstPlan.checked = true;
    }
  }

  syncSellingPlanInput() {
    const input = this.sellingPlanInput;
    const selected = this.selectedRadio;
    if (!input) return;

    input.value = selected?.dataset.sellingPlanId || '';
  }

  dispatchPriceUpdate() {
    const selected = this.selectedRadio;
    if (!selected || !this.productRoot) return;

    const price = Number(selected.dataset.price);
    const compareAtPrice = Number(selected.dataset.compareAtPrice);

    this.productRoot.dispatchEvent(
      new CustomEvent('product:selling-plan-change', {
        detail: {
          price,
          compareAtPrice,
          sellingPlanId: selected.dataset.sellingPlanId || null,
          isSubscription: selected.dataset.radioType === 'selling_plan',
        },
      })
    );
  }
}

if (!customElements.get('selling-plans-picker')) {
  customElements.define('selling-plans-picker', SellingPlansPicker);
}
