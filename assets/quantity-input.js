/**
 * <quantity-input>
 * Reusable quantity stepper used across the theme (product form, quick view,
 * cart drawer, cart page).
 *
 * Expected markup:
 *   <quantity-input>
 *     <button type="button" data-quantity-decrease>-</button>
 *     <input type="number" data-quantity-input value="1" min="1" step="1">
 *     <button type="button" data-quantity-increase>+</button>
 *   </quantity-input>
 *
 * Behavior:
 *   - Increments/decrements the input respecting min / max / step.
 *   - Dispatches a native, bubbling `change` event on the input so listeners
 *     (e.g. the cart drawer) can react with their own logic.
 */
class QuantityInput extends HTMLElement {
  constructor() {
    super();
    this.onClick = this.onClick.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onKeydown = this.onKeydown.bind(this);
  }

  connectedCallback() {
    this.input =
      this.querySelector('[data-quantity-input]') ||
      this.querySelector('input[type="number"]');
    this.decreaseButton = this.querySelector('[data-quantity-decrease]');
    this.increaseButton = this.querySelector('[data-quantity-increase]');

    if (!this.input) return;

    this.addEventListener('click', this.onClick);
    this.input.addEventListener('change', this.onChange);
    this.input.addEventListener('keydown', this.onKeydown);

    this.validate();
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.onClick);
    this.input?.removeEventListener('change', this.onChange);
    this.input?.removeEventListener('keydown', this.onKeydown);
  }

  get step() {
    const step = Number(this.input.step);
    return step > 0 ? step : 1;
  }

  get min() {
    return this.input.min === '' ? 1 : Number(this.input.min);
  }

  get max() {
    return this.input.max === '' ? null : Number(this.input.max);
  }

  onClick(event) {
    const button = event.target.closest(
      '[data-quantity-decrease], [data-quantity-increase]'
    );

    if (!button || !this.contains(button) || button.disabled) return;

    event.preventDefault();

    const direction = button.matches('[data-quantity-increase]') ? 1 : -1;
    this.changeBy(direction);
  }

  changeBy(direction) {
    const current = Number(this.input.value) || 0;
    let next = current + direction * this.step;

    next = Math.max(this.min, next);
    if (this.max !== null) next = Math.min(this.max, next);

    this.validate(next);

    if (next === current) return;

    this.input.value = next;
    this.input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  onChange() {
    this.validate();
  }

  onKeydown(event) {
    if (event.key !== 'Enter') return;

    // Prevent implicit form submit (e.g. cart page checkout button).
    event.preventDefault();
    this.validate();
    this.input.dispatchEvent(new Event('change', { bubbles: true }));
    this.input.blur();
  }

  validate(value = Number(this.input.value) || 0) {
    if (this.decreaseButton) {
      this.decreaseButton.disabled = value <= this.min;
    }

    if (this.increaseButton) {
      this.increaseButton.disabled = this.max !== null && value >= this.max;
    }
  }
}

if (!customElements.get('quantity-input')) {
  customElements.define('quantity-input', QuantityInput);
}
