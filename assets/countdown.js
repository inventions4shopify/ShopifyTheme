class CountdownTimer extends HTMLElement {
  connectedCallback() {
    if (this._initialized) return;
    this._initialized = true;

    const countdownDate = new Date(this.dataset.countdown).getTime();
    if (Number.isNaN(countdownDate)) return;

    this.dayEl = this.querySelector('.countdown-day .countdown-number');
    this.hourEl = this.querySelector('.countdown-hour .countdown-number');
    this.minuteEl = this.querySelector('.countdown-minute .countdown-number');
    this.secondEl = this.querySelector('.countdown-second .countdown-number');

    this.updateCountdown = () => {
      const distance = countdownDate - Date.now();

      if (distance <= 0) {
        clearInterval(this.interval);
        if (this.dayEl) this.dayEl.textContent = '00';
        if (this.hourEl) this.hourEl.textContent = '00';
        if (this.minuteEl) this.minuteEl.textContent = '00';
        if (this.secondEl) this.secondEl.textContent = '00';
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      if (this.dayEl) this.dayEl.textContent = String(days).padStart(2, '0');
      if (this.hourEl) this.hourEl.textContent = String(hours).padStart(2, '0');
      if (this.minuteEl) this.minuteEl.textContent = String(minutes).padStart(2, '0');
      if (this.secondEl) this.secondEl.textContent = String(seconds).padStart(2, '0');
    };

    this.updateCountdown();
    this.interval = setInterval(this.updateCountdown, 1000);
  }

  disconnectedCallback() {
    this._initialized = false;
    clearInterval(this.interval);
  }
}

if (!customElements.get('countdown-timer')) {
  customElements.define('countdown-timer', CountdownTimer);
}
