class ReadMoreDescription extends HTMLElement {
  constructor() {
    super();

    this.onToggle = this.onToggle.bind(this);
    this.setup = this.setup.bind(this);

    this.listenerAttached = false;
  }

  connectedCallback() {
    this.content = this.querySelector('.product_description_content');

    this.button = this.querySelector('.product_description_toggle');

    if (!this.content || !this.button) return;

    this.lines = parseInt(this.dataset.lines, 10) || 4;

    this.readMoreText = this.dataset.readMore || 'Read more';

    this.readLessText = this.dataset.readLess || 'Read less';

    this.content.style.setProperty('--read-more-lines', this.lines);

    this.content.classList.add('is-clamped');

    this.button.textContent = this.readMoreText;

    requestAnimationFrame(this.setup);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(this.setup);
    }
  }

  setup() {
    if (this.hasAttribute('expanded')) return;

    const overflowing = this.content.scrollHeight - this.content.clientHeight > 1;

    if (!overflowing) {
      this.button.classList.add('hidden');

      this.content.classList.remove('is-clamped');

      return;
    }

    this.button.classList.remove('hidden');

    if (!this.listenerAttached) {
      this.button.addEventListener('click', this.onToggle);

      this.listenerAttached = true;
    }
  }

  onToggle() {
    const expanded = this.hasAttribute('expanded');

    if (expanded) {
      this.removeAttribute('expanded');

      this.content.classList.add('is-clamped');

      this.button.textContent = this.readMoreText;
    } else {
      this.setAttribute('expanded', '');

      this.content.classList.remove('is-clamped');

      this.button.textContent = this.readLessText;
    }
  }

  disconnectedCallback() {
    if (this.button && this.listenerAttached) {
      this.button.removeEventListener('click', this.onToggle);
    }
  }
}

if (!customElements.get('read-more-description')) {
  customElements.define('read-more-description', ReadMoreDescription);
}
