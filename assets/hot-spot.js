class HotSpotSection extends HTMLElement {
  connectedCallback() {
    if (this._initialized) return;
    this._initialized = true;

    this.abortController = new AbortController();
    const { signal } = this.abortController;

    this.querySelectorAll('.cms-hot-spot-cell').forEach((spot) => {
      const btn = spot.querySelector('button');
      if (!btn) return;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();

        this.querySelectorAll('.cms-hot-spot-cell').forEach((item) => {
          if (item !== spot) {
            item.classList.remove('active', 'open-left');
          }
        });

        spot.classList.toggle('active');

        if (!spot.classList.contains('active')) return;

        const popup = spot.querySelector('.cms-hot-spot-body');
        const spotRect = spot.getBoundingClientRect();
        const popupWidth = popup.offsetWidth || 250;
        const rightSpace = window.innerWidth - spotRect.right;
        const leftSpace = spotRect.left;

        spot.classList.remove('open-left');

        if (rightSpace < popupWidth + 20 && leftSpace > popupWidth) {
          spot.classList.add('open-left');
        }
      }, { signal });
    });
  }

  disconnectedCallback() {
    this._initialized = false;
    this.abortController?.abort();
  }
}

if (!customElements.get('hot-spot-section')) {
  customElements.define('hot-spot-section', HotSpotSection);
}
