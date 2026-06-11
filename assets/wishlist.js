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

  saveItems(items, meta = {}) {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
    document.dispatchEvent(
      new CustomEvent('wishlist:updated', {
        detail: { items, count: items.length, ...meta },
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

    this.saveItems(items, { addedHandle: handle });
    return true;
  }

  remove(handle) {
    const items = this.getItems().filter((item) => item.handle !== handle);
    this.saveItems(items, { removedHandle: handle });
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
}

class WishlistPage extends HTMLElement {
  connectedCallback() {
    this.grid = this.querySelector('[data-wishlist-grid]');
    this.emptyState = this.querySelector('[data-wishlist-empty]');
    this.wishlist = window.theme?.wishlist || new Wishlist();
    this.labels = window.theme?.wishlistLabels || {};
    this.sectionId = 'wishlist-product-card';
    this.htmlCache = new Map();
    this.isInitialRender = true;

    this.onWishlistUpdated = this.onWishlistUpdated.bind(this);
    document.addEventListener('wishlist:updated', this.onWishlistUpdated);
    this.grid?.addEventListener('click', this.onGridClick.bind(this));

    this.render();
  }

  disconnectedCallback() {
    document.removeEventListener('wishlist:updated', this.onWishlistUpdated);
  }

  onWishlistUpdated(event) {
    const { removedHandle, addedHandle } = event.detail || {};

    if (removedHandle) {
      this.removeCardByHandle(removedHandle);
      return;
    }

    if (addedHandle) {
      this.addCardByHandle(addedHandle);
      return;
    }

    this.render();
  }

  onGridClick(event) {
    const removeButton = event.target.closest('[data-wishlist-remove]');

    if (!removeButton) return;

    event.preventDefault();
    this.wishlist.remove(removeButton.dataset.wishlistRemove);
  }

  updateEmptyState() {
    if (!this.grid || !this.emptyState) return;

    const hasItems = this.wishlist.getCount() > 0;
    this.emptyState.hidden = hasItems;
  }

  removeCardByHandle(handle) {
    this.htmlCache.delete(handle);

    const card = this.grid?.querySelector(`[data-wishlist-card="${handle}"]`);

    if (!card) {
      this.updateEmptyState();
      return;
    }

    card.classList.add('is-removing');

    const removeCard = () => {
      card.remove();
      this.updateEmptyState();
    };

    card.addEventListener('transitionend', removeCard, { once: true });
    setTimeout(removeCard, 300);
  }

  async addCardByHandle(handle) {
    if (!this.grid || this.grid.querySelector(`[data-wishlist-card="${handle}"]`)) {
      return;
    }

    try {
      const html = await this.fetchProductCardHtml(handle);
      this.emptyState.hidden = true;
      this.grid.insertAdjacentHTML('afterbegin', html);
    } catch (error) {
      console.error(error);
    }
  }

  async fetchProductCardHtml(handle) {
    if (this.htmlCache.has(handle)) {
      return this.htmlCache.get(handle);
    }

    const response = await fetch(
      `/products/${encodeURIComponent(handle)}?section_id=${this.sectionId}`
    );

    if (!response.ok) {
      throw new Error(`Unable to load product card: ${handle}`);
    }

    const responseText = await response.text();
    const doc = new DOMParser().parseFromString(responseText, 'text/html');
    const section = doc.querySelector('.shopify-section');
    let html = section ? section.innerHTML : responseText;

    html = html.replace(/<link[^>]*card-product\.css[^>]*>/gi, '');

    this.htmlCache.set(handle, html);
    return html;
  }

  async render() {
    if (!this.grid || !this.emptyState) return;

    const items = this.wishlist.getItems();

    if (!items.length) {
      this.grid.innerHTML = '';
      this.emptyState.hidden = false;
      this.htmlCache.clear();
      return;
    }

    this.emptyState.hidden = true;

    const showLoading = this.isInitialRender && !this.grid.children.length;

    if (showLoading) {
      this.grid.innerHTML = `<p class="wishlist-page__loading">${this.labels.loading || 'Loading wishlist...'}</p>`;
    }

    const cards = await Promise.all(
      items.map(async (item) => {
        try {
          return await this.fetchProductCardHtml(item.handle);
        } catch (error) {
          console.error(error);
          return '';
        }
      })
    );

    this.isInitialRender = false;

    const validCards = cards.filter(Boolean);

    if (!validCards.length) {
      this.grid.innerHTML = '';
      this.emptyState.hidden = false;
      return;
    }

    this.grid.innerHTML = validCards.join('');
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
