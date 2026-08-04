class FaqSection extends HTMLElement {
  connectedCallback() {
    if (this._initialized) return;
    this._initialized = true;

    this.abortController = new AbortController();
    const { signal } = this.abortController;

    this.querySelectorAll('.cms-faq-item').forEach((item) => {
      const question = item.querySelector('.cms-faq-question');
      const answer = item.querySelector('.cms-faq-answer');

      if (!question || !answer) return;

      answer.style.maxHeight = '0px';

      question.addEventListener(
        'click',
        () => {
          const isActive = item.classList.contains('active');

          this.querySelectorAll('.cms-faq-item').forEach((faq) => {
            faq.classList.remove('active');
            const content = faq.querySelector('.cms-faq-answer');
            if (content) {
              content.style.maxHeight = '0px';
            }
          });

          if (!isActive) {
            item.classList.add('active');
            answer.style.maxHeight = `${answer.scrollHeight}px`;
          }
        },
        { signal }
      );
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