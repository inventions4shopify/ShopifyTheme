class ReadMoreDescription extends HTMLElement {
  constructor() {
    super();

    this.onToggle = this.onToggle.bind(this);
  }

  connectedCallback() {
    this.content = this.querySelector('.product_description_content');

    this.button = this.querySelector('.product_description_toggle');

    if (!this.content || !this.button) return;

    this.lines = parseInt(this.dataset.lines || 4, 10);

    this.readMoreText = this.dataset.readMore || 'Read more';

    this.readLessText = this.dataset.readLess || 'Read less';

    requestAnimationFrame(() => {
      this.initialize();
    });
  }

  initialize() {
    const computedStyle = window.getComputedStyle(this.content);

    let lineHeight = parseFloat(computedStyle.lineHeight);

    if (isNaN(lineHeight)) {
      const fontSize = parseFloat(computedStyle.fontSize);

      lineHeight = fontSize * 1.2;
    }

    this.collapsedHeight = lineHeight * this.lines;

    if (this.content.scrollHeight <= this.collapsedHeight + 5) {
      this.button.classList.add('hidden');
      this.content.style.maxHeight = 'none';
      return;
    }

    this.content.style.maxHeight = `${this.collapsedHeight}px`;

    this.button.addEventListener('click', this.onToggle);
  }

  onToggle() {
    const expanded = this.hasAttribute('expanded');

    if (expanded) {
      this.removeAttribute('expanded');

      this.content.style.maxHeight = `${this.collapsedHeight}px`;

      this.button.textContent = this.readMoreText;
    } else {
      this.setAttribute('expanded', '');

      this.content.style.maxHeight = `${this.content.scrollHeight}px`;

      this.button.textContent = this.readLessText;
    }
  }

  disconnectedCallback() {
    if (this.button) {
      this.button.removeEventListener('click', this.onToggle);
    }
  }
}

if (!customElements.get('read-more-description')) {
  customElements.define('read-more-description', ReadMoreDescription);
}
