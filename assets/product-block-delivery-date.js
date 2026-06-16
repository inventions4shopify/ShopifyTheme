class ProductDeliveryDate extends HTMLElement {
  connectedCallback() {
    if (this._initialized) return;

    this.display = this.querySelector('[data-delivery-countdown]');
    if (!this.display) return;

    this._initialized = true;

    const storageKey = this.dataset.storageKey || 'offer_countdown_3h45m';
    const defaultTime = parseInt(this.dataset.defaultSeconds || '13500', 10);

    let remainingTime = localStorage.getItem(storageKey);

    if (!remainingTime) {
      remainingTime = defaultTime;
      localStorage.setItem(storageKey, remainingTime);
    } else {
      remainingTime = parseInt(remainingTime, 10);
    }

    this.updateTimer = () => {
      if (remainingTime <= 0) {
        this.display.textContent = 'Expired';
        localStorage.removeItem(storageKey);
        clearInterval(this.interval);
        return;
      }

      const hours = Math.floor(remainingTime / 3600);
      const minutes = Math.floor((remainingTime % 3600) / 60);
      const seconds = remainingTime % 60;

      this.display.textContent = `${hours}h ${minutes}m ${seconds}s`;

      remainingTime--;
      localStorage.setItem(storageKey, remainingTime);
    };

    this.updateTimer();
    this.interval = setInterval(this.updateTimer, 1000);
  }

  disconnectedCallback() {
    this._initialized = false;
    clearInterval(this.interval);
  }
}

if (!customElements.get('product-delivery-date')) {
  customElements.define('product-delivery-date', ProductDeliveryDate);
}
