class FaqSection extends HTMLElement {
  connectedCallback() {
    if (this._initialized) return;
    this._initialized = true;

    this.abortController = new AbortController();
    const { signal } = this.abortController;

    this.querySelectorAll('.cms-faq-item').forEach((item) => {
      const question = item.querySelector('.cms-faq-question');
      if (!question) return;

      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        this.querySelectorAll('.cms-faq-item').forEach((faq) => {
          faq.classList.remove('active');
        });

        if (!isActive) {
          item.classList.add('active');
        }
      }, { signal });
    });
  }

  disconnectedCallback() {
    this._initialized = false;
    this.abortController?.abort();
  }
}

if (!customElements.get('faq-section')) {
  customElements.define('faq-section', FaqSection);
}
