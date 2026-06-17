class ProductRecommendations extends HTMLElement {
  constructor() {
    super();
    this.observer = undefined;
  }

  connectedCallback() {
    this.initializeRecommendations(this.dataset.productId);
  }

  initializeRecommendations(productId) {
    this.observer?.unobserve(this);
    this.observer = new IntersectionObserver(
      (entries, observer) => {
        if (!entries[0].isIntersecting) return;
        observer.unobserve(this); 
        this.loadRecommendations(productId);
      },
      { rootMargin: '0px 0px 400px 0px' }
    );
    this.observer.observe(this);
  }

  loadRecommendations() {
    if (!this.dataset.url) return;

    fetch(this.dataset.url)
      .then((response) => {
        if (!response.ok) throw new Error(response.status);
        return response.text();
      })
      .then((text) => {
        const html = document.createElement('div');
        html.innerHTML = text;
        const recommendations = html.querySelector('product-recommendations');

        if (recommendations && recommendations.innerHTML.trim().length) {
          this.innerHTML = recommendations.innerHTML;
        } else {
          // No recommendations returned: remove the empty section wrapper.
          const section = this.closest('.shopify-section');
          if (section) section.remove();
        }
      })
      .catch((error) => {
        console.error('Product recommendations error:', error);
        const section = this.closest('.shopify-section');
        if (section) section.remove();
      });
  }
}

if (!customElements.get('product-recommendations')) {
  customElements.define('product-recommendations', ProductRecommendations);
}
