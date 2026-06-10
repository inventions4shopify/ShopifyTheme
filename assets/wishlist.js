class Wishlist {
  constructor(storageKey = 'theme_wishlist') {
    this.storageKey = storageKey;
  }

  getItems() {
    try {
      const items = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
      return Array.isArray(items) ? items : [];
    } catch (error) {
      console.error('Wishlist storage is invalid', error);
      return [];
    }
  }

  saveItems(items) {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
    document.dispatchEvent(
      new CustomEvent('wishlist:updated', {
        detail: { items, count: items.length },
      })
    );
  }

  has(handle) {
    return this.getItems().some((item) => item.handle === handle);
  }

  add(product) {
    const handle = product.handle;

    if (!handle || this.has(handle)) return false;

    const items = this.getItems();

    items.unshift({
      handle,
      id: product.id,
      addedAt: Date.now(),
    });

    this.saveItems(items);
    return true;
  }

  remove(handle) {
    const items = this.getItems().filter((item) => item.handle !== handle);
    this.saveItems(items);
  }

  toggle(product) {
    if (this.has(product.handle)) {
      this.remove(product.handle);
      return false;
    }

    this.add(product);
    return true;
  }

  getCount() {
    return this.getItems().length;
  }

  async fetchProduct(handle) {
    const response = await fetch(`/products/${handle}.js`);

    if (!response.ok) {
      throw new Error(`Product not found: ${handle}`);
    }

    return response.json();
  }
}

class WishlistPage extends HTMLElement {
  connectedCallback() {
    this.grid = this.querySelector('[data-wishlist-grid]');
    this.emptyState = this.querySelector('[data-wishlist-empty]');
    this.wishlist = window.theme?.wishlist || new Wishlist();
    this.moneyFormat = window.theme?.moneyFormat || '${{amount}}';
    this.labels = window.theme?.wishlistLabels || {};

    this.onWishlistUpdated = this.onWishlistUpdated.bind(this);
    document.addEventListener('wishlist:updated', this.onWishlistUpdated);
    this.grid?.addEventListener('click', this.onGridClick.bind(this));

    this.render();
  }

  disconnectedCallback() {
    document.removeEventListener('wishlist:updated', this.onWishlistUpdated);
  }

  onWishlistUpdated() {
    this.render();
  }

  onGridClick(event) {
    const removeButton = event.target.closest('[data-wishlist-remove]');

    if (!removeButton) return;

    event.preventDefault();
    this.wishlist.remove(removeButton.dataset.wishlistRemove);
  }

  formatMoney(cents) {
    if (window.theme?.formatMoney) {
      return window.theme.formatMoney(cents);
    }

    const amount = (cents / 100).toFixed(2);
    return this.moneyFormat.replace(/\{\{\s*amount\s*\}\}/g, amount);
  }

  async render() {
    if (!this.grid || !this.emptyState) return;

    const items = this.wishlist.getItems();

    if (!items.length) {
      this.grid.innerHTML = '';
      this.emptyState.hidden = false;
      return;
    }

    this.emptyState.hidden = true;
    this.grid.innerHTML = `<p class="wishlist-page__loading">${this.labels.loading || 'Loading wishlist...'}</p>`;

    const products = await Promise.all(
      items.map(async (item) => {
        try {
          return await this.wishlist.fetchProduct(item.handle);
        } catch (error) {
          console.error(error);
          return null;
        }
      })
    );

    const validProducts = products.filter(Boolean);

    if (!validProducts.length) {
      this.grid.innerHTML = '';
      this.emptyState.hidden = false;
      return;
    }

    this.grid.innerHTML = validProducts
      .map((product) => this.renderCard(product))
      .join('');
  }

  renderCard(product) {
    const image = product.featured_image
      ? `<img src="${product.featured_image}" alt="${this.escapeHtml(product.title)}" loading="lazy" width="400" height="400">`
      : '';

    const comparePrice =
      product.compare_at_price > product.price
        ? `<span class="wishlist-card__compare">${this.formatMoney(product.compare_at_price)}</span>`
        : '';

    let actionButton = '';

    if (product.available) {
      if (product.variants.length === 1) {
        actionButton = `<button type="button" class="button wishlist-card__atc" data-product-card-atc data-variant-id="${product.variants[0].id}">${this.labels.addToCart || 'Add to cart'}</button>`;
      } else {
        actionButton = `<button type="button" class="button wishlist-card__quick-view" data-quick-view-trigger data-product-url="${product.url}">${this.labels.quickView || 'Quick view'}</button>`;
      }
    } else {
      actionButton = `<button type="button" class="button" disabled>${this.labels.soldOut || 'Sold out'}</button>`;
    }

    return `
      <article class="wishlist-card">
        <button
          type="button"
          class="wishlist-card__remove"
          data-wishlist-remove="${product.handle}"
          aria-label="${this.labels.remove || 'Remove from wishlist'}"
        >
          &times;
        </button>
        <a href="${product.url}" class="wishlist-card__media">${image}</a>
        <div class="wishlist-card__content">
          <h3 class="wishlist-card__title">
            <a href="${product.url}">${this.escapeHtml(product.title)}</a>
          </h3>
          <div class="wishlist-card__price">
            <span class="wishlist-card__price-current">${this.formatMoney(product.price)}</span>
            ${comparePrice}
          </div>
          ${actionButton}
        </div>
      </article>
    `;
  }

  escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

function initWishlistUi() {
  const wishlist = window.theme?.wishlist || new Wishlist();
  window.theme = window.theme || {};
  window.theme.wishlist = wishlist;

  const updateButtons = () => {
    document.querySelectorAll('[data-wishlist-toggle]').forEach((button) => {
      const handle = button.dataset.productHandle;
      const isActive = wishlist.has(handle);
      const addLabel = button.querySelector('[data-wishlist-label-add]')?.textContent;
      const removeLabel = button.querySelector('[data-wishlist-label-remove]')?.textContent;

      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      button.setAttribute('aria-label', isActive ? removeLabel : addLabel);
    });
  };

  const updateCount = () => {
    const count = wishlist.getCount();

    document.querySelectorAll('[data-wishlist-count]').forEach((element) => {
      element.textContent = count;
      element.hidden = count === 0;
    });
  };

  const refreshUi = () => {
    updateButtons();
    updateCount();
  };

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-wishlist-toggle]');

    if (!button) return;

    event.preventDefault();

    const product = {
      handle: button.dataset.productHandle,
      id: Number(button.dataset.productId),
    };

    if (!product.handle) return;

    wishlist.toggle(product);
  });

  document.addEventListener('wishlist:updated', refreshUi);
  refreshUi();
}

document.addEventListener('DOMContentLoaded', initWishlistUi);

if (!customElements.get('wishlist-page')) {
  customElements.define('wishlist-page', WishlistPage);
}
