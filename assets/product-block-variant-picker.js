class VariantPicker extends HTMLElement {
  constructor() {
    super();

    this.onChange = this.onChange.bind(this);
  }

  connectedCallback() {
    this.variantData = this.querySelector('.variant_picker_data');

    if (!this.variantData) return;

    try {
      this.variants = JSON.parse(this.variantData.textContent);
    } catch (error) {
      console.error('Variant data is invalid', error);
      return;
    }

    this.inputs = this.querySelectorAll('input[type="radio"], [data-dropdown-input]');

    this.inputs.forEach((input) => {
      input.addEventListener('change', this.onChange);
    });

    this.initDropdowns();
    this.optionElements = this.querySelectorAll('.variant_picker_option');

    this.updateVariant();
  }

  disconnectedCallback() {
    this.inputs?.forEach((input) => {
      input.removeEventListener('change', this.onChange);
    });
  }

  onChange() {
    this.updateVariant();
  }

  initDropdowns() {
    this.querySelectorAll('.variant_picker_dropdown').forEach((dropdown) => {
      const trigger = dropdown.querySelector('[data-dropdown-trigger]');

      const hiddenInput = dropdown.querySelector('[data-dropdown-input]');

      const selectedText = dropdown.querySelector('[data-dropdown-selected]');

      const options = dropdown.querySelectorAll('.variant_picker_dropdown_option');

      trigger.addEventListener('click', () => {
        dropdown.classList.toggle('is-open');
      });

      options.forEach((option) => {
        option.addEventListener('click', () => {
          const value = option.dataset.optionValue;

          hiddenInput.value = value;

          selectedText.textContent = value;

          dropdown.classList.remove('is-open');

          hiddenInput.dispatchEvent(
            new Event('change', {
              bubbles: true,
            })
          );
        });
      });
    });

    document.addEventListener('click', (event) => {
      if (!this.contains(event.target)) {
        this.querySelectorAll('.variant_picker_dropdown').forEach((dropdown) => {
          dropdown.classList.remove('is-open');
        });
      }
    });
  }

  getSelectedOptions() {
    const options = [];

    this.optionElements.forEach((option) => {
      const radio = option.querySelector('input[type="radio"]:checked');

      const dropdownInput = option.querySelector('[data-dropdown-input]');

      if (radio) {
        options.push(radio.value);
      } else if (dropdownInput) {
        options.push(dropdownInput.value);
      }
    });

    return options;
  }

  findVariant(selectedOptions) {
    return this.variants.find((variant) => {
      return variant.options.every((value, index) => {
        return value === selectedOptions[index];
      });
    });
  }

  updateSelectedLabels(selectedOptions) {
    this.optionElements.forEach((option, index) => {
      const selectedLabel = option.querySelector('[data-selected-value]');

      if (!selectedLabel) return;

      selectedLabel.textContent = selectedOptions[index];
    });
  }

  updateVariant() {
    const selectedOptions = this.getSelectedOptions();

    const variant = this.findVariant(selectedOptions);

    this.updateSelectedLabels(selectedOptions);

    if (!variant) return;

    this.currentVariant = variant;

    if (this.dataset.updateUrl === 'true' && window.location.pathname.includes('/products/')) {
      const url = new URL(window.location.href);

      url.searchParams.set('variant', variant.id);

      window.history.replaceState({}, '', url);
    }

    const productRoot = this.closest('[data-product-root]');

    productRoot?.dispatchEvent(
      new CustomEvent('product:variant-change', {
        detail: {
          variant,
          selectedOptions,
        },
      })
    );
  }
}

if (!customElements.get('variant-picker')) {
  customElements.define('variant-picker', VariantPicker);
}
