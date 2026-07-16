class CartDrawer extends HTMLElement {
  constructor() {
    super();

    this.onDocumentClick = this.onDocumentClick.bind(this);
    this.onKeydown = this.onKeydown.bind(this);
    this.onContentsClick = this.onContentsClick.bind(this);
    this.onQuantityChange = this.onQuantityChange.bind(this);
  }

  connectedCallback() {
    this.sectionId = this.dataset.sectionId || 'cart-drawer';
    this.contents = this.querySelector('[data-cart-drawer-contents]');

    document.addEventListener('click', this.onDocumentClick);
    document.addEventListener('keydown', this.onKeydown);
    this.contents?.addEventListener('click', this.onContentsClick);
    this.contents?.addEventListener('change', this.onQuantityChange);
  }

  disconnectedCallback() {
    document.removeEventListener('click', this.onDocumentClick);
    document.removeEventListener('keydown', this.onKeydown);
    this.contents?.removeEventListener('click', this.onContentsClick);
    this.contents?.removeEventListener('change', this.onQuantityChange);
  }

  isOpen() {
    return this.classList.contains('is-open');
  }

  open() {
    this.classList.add('is-open');
    this.setAttribute('aria-hidden', 'false');
    document.body.classList.add('cart-drawer-open');
    initCartDrawerFeatures(this);
  }

  close() {
    this.classList.remove('is-open');
    this.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('cart-drawer-open');
  }

  onDocumentClick(event) {
    const trigger = event.target.closest('[data-cart-drawer-trigger]');

    if (trigger) {
      event.preventDefault();
      this.open();
      return;
    }

    if (event.target.closest('[data-cart-drawer-close]') && this.isOpen()) {
      event.preventDefault();
      this.close();
    }
  }

  onKeydown(event) {
    if (event.key === 'Escape' && this.isOpen()) {
      this.close();
    }
  }

  onContentsClick(event) {
    if (event.target.closest('[data-cart-drawer-close]')) {
      event.preventDefault();
      this.close();
      return;
    }

    // Quantity +/- is handled by the shared <quantity-input> element, which
    // dispatches a `change` event picked up by onQuantityChange below.
    const removeButton = event.target.closest('[data-cart-remove]');

    if (!removeButton) return;

    const lineItem = event.target.closest('[data-cart-item]');

    if (!lineItem) return;

    event.preventDefault();
    this.updateLine(Number(lineItem.dataset.line), 0);
  }

  onQuantityChange(event) {
    const input = event.target.closest('[data-quantity-input]');

    if (!input) return;

    const lineItem = input.closest('[data-cart-item]');

    if (!lineItem) return;

    const line = Number(lineItem.dataset.line);
    const quantity = Math.max(0, Number(input.value) || 0);

    this.updateLine(line, quantity);
  }

  setUpdating(isUpdating) {
    this.classList.toggle('is-updating', isUpdating);
  }

  async updateLine(line, quantity) {
    this.setUpdating(true);
    const startTime = Date.now();

    try {
      const response = await fetch('/cart/change.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ line, quantity }),
      });

      if (!response.ok) {
        throw new Error('Unable to update cart.');
      }

      await this.refresh();
    } catch (error) {
      console.error(error);
      window.alert(error.message || 'Unable to update cart.');
    } finally {
      await cartMinLoading(startTime);
      this.setUpdating(false);
    }
  }

  applySectionHtml(htmlString, { initFeatures = true } = {}) {
    if (!this.contents || !htmlString) return false;

    const html = new DOMParser().parseFromString(htmlString, 'text/html');
    const section = html.querySelector('.shopify-section');

    this.contents.innerHTML = section ? section.innerHTML : htmlString;

    const isEmpty = !this.contents.querySelector('[data-cart-drawer-items]');
    this.classList.toggle('is-empty', isEmpty);

    if (initFeatures) {
      initCartDrawerFeatures(this);
    }

    return true;
  }

  async refresh() {
    if (!this.contents) return;

    const response = await fetch(`/cart?section_id=${encodeURIComponent(this.sectionId)}`);

    if (!response.ok) {
      throw new Error('Unable to refresh cart drawer.');
    }

    const responseText = await response.text();
    this.applySectionHtml(responseText, { initFeatures: true });
    syncCartCountFromDrawer(this) || (await updateCartCount());
  }
}

function normalizeCartRecommendationWheelDelta(event) {
  let delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;

  if (event.deltaMode === 1) {
    delta *= 40;
  } else if (event.deltaMode === 2) {
    delta *= window.innerHeight;
  }

  return delta;
}

function updateCartRecommendationSlider(slider, index) {
  const track = slider.querySelector('[data-cart-rec-track]');
  const slides = slider.querySelectorAll('[data-cart-rec-slide]');
  const dots = slider.querySelectorAll('.cart-drawer__recommendations-dot');

  if (!track || !slides.length) return;

  const maxIndex = Math.max(0, slides.length - 1);
  const currentIndex = Math.max(0, Math.min(index, maxIndex));

  slider.dataset.currentIndex = String(currentIndex);
  track.style.transform = `translateX(-${currentIndex * 100}%)`;

  dots.forEach((dot, dotIndex) => {
    dot.classList.toggle('is-active', dotIndex === currentIndex);
  });
}

function buildCartRecommendationDots(slider) {
  const dotsContainer = slider.querySelector('[data-cart-rec-dots]');
  const slides = slider.querySelectorAll('[data-cart-rec-slide]');

  if (!dotsContainer || slides.length < 2) return;

  dotsContainer.innerHTML = '';

  slides.forEach((_, dotIndex) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'cart-drawer__recommendations-dot';
    dot.setAttribute('aria-label', `Show product ${dotIndex + 1}`);
    dot.addEventListener('click', () => {
      updateCartRecommendationSlider(slider, dotIndex);
    });
    dotsContainer.appendChild(dot);
  });
}

function handleCartRecommendationWheel(slider, event) {
  const slides = slider.querySelectorAll('[data-cart-rec-slide]');

  if (slides.length < 2) return;

  const delta = normalizeCartRecommendationWheelDelta(event);

  if (Math.abs(delta) < 1) return;

  const scrollingForward = delta > 0;
  const currentIndex = Number(slider.dataset.currentIndex) || 0;
  const maxIndex = slides.length - 1;

  if (scrollingForward && currentIndex >= maxIndex) return;
  if (!scrollingForward && currentIndex <= 0) return;

  event.preventDefault();
  event.stopImmediatePropagation();

  if (slider.dataset.wheelCooldown === 'true') return;

  slider.dataset.wheelCooldown = 'true';
  window.setTimeout(() => {
    slider.dataset.wheelCooldown = 'false';
  }, 300);

  updateCartRecommendationSlider(slider, scrollingForward ? currentIndex + 1 : currentIndex - 1);
}

function isCartRecommendationInteractiveTarget(target) {
  return Boolean(
    target?.closest('button, a, input, select, textarea, [data-product-card-atc]')
  );
}

function bindCartRecommendationDrag(slider, signal) {
  const viewport = slider.querySelector('.cart-drawer__recommendations-viewport');
  const track = slider.querySelector('[data-cart-rec-track]');

  if (!viewport || !track) return;

  let startX = 0;
  let dragDistance = 0;
  let isDragging = false;
  let activePointerId = null;

  const setTrackPosition = (index, offsetPx = 0) => {
    track.style.transform = `translateX(calc(-${index * 100}% + ${offsetPx}px))`;
  };

  const endDrag = (event) => {
    if (!isDragging || event.pointerId !== activePointerId) return;

    isDragging = false;
    activePointerId = null;
    viewport.classList.remove('is-dragging');
    track.style.transition = '';

    if (viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }

    const currentIndex = Number(slider.dataset.currentIndex) || 0;
    const slides = slider.querySelectorAll('[data-cart-rec-slide]');
    const maxIndex = slides.length - 1;
    const threshold = Math.max(40, viewport.offsetWidth * 0.18);

    if (dragDistance < -threshold && currentIndex < maxIndex) {
      updateCartRecommendationSlider(slider, currentIndex + 1);
    } else if (dragDistance > threshold && currentIndex > 0) {
      updateCartRecommendationSlider(slider, currentIndex - 1);
    } else {
      updateCartRecommendationSlider(slider, currentIndex);
    }

    window.setTimeout(() => {
      dragDistance = 0;
    }, 0);
  };

  viewport.addEventListener(
    'pointerdown',
    (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (isCartRecommendationInteractiveTarget(event.target)) return;

      const slides = slider.querySelectorAll('[data-cart-rec-slide]');
      if (slides.length < 2) return;

      isDragging = true;
      activePointerId = event.pointerId;
      startX = event.clientX;
      dragDistance = 0;
      viewport.classList.add('is-dragging');
      track.style.transition = 'none';
      viewport.setPointerCapture(event.pointerId);
    },
    { signal }
  );

  viewport.addEventListener(
    'pointermove',
    (event) => {
      if (!isDragging || event.pointerId !== activePointerId) return;

      dragDistance = event.clientX - startX;
      const currentIndex = Number(slider.dataset.currentIndex) || 0;
      setTrackPosition(currentIndex, dragDistance);
    },
    { signal }
  );

  viewport.addEventListener('pointerup', endDrag, { signal });
  viewport.addEventListener('pointercancel', endDrag, { signal });

  viewport.addEventListener(
    'click',
    (event) => {
      if (isCartRecommendationInteractiveTarget(event.target)) return;

      if (Math.abs(dragDistance) > 8) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    { capture: true, signal }
  );
}

function setupCartRecommendationSliders(root, stateHolder) {
  if (!root) return;

  if (stateHolder.recommendationAbortController) {
    stateHolder.recommendationAbortController.abort();
  }

  stateHolder.recommendationAbortController = new AbortController();
  const { signal } = stateHolder.recommendationAbortController;

  root.querySelectorAll('[data-cart-recommendations]').forEach((slider) => {
    const slides = slider.querySelectorAll('[data-cart-rec-slide]');

    if (!slides.length) return;

    if (!slider.dataset.currentIndex) {
      slider.dataset.currentIndex = '0';
    }

    buildCartRecommendationDots(slider);
    updateCartRecommendationSlider(slider, Number(slider.dataset.currentIndex) || 0);
    bindCartRecommendationDrag(slider, signal);

    slider.addEventListener(
      'click',
      (event) => {
        const button = event.target.closest('[data-product-card-atc]');
        if (!button || button.disabled) return;

        event.preventDefault();
        event.stopPropagation();
        handleProductCardAtcClick(button);
      },
      { capture: true, signal }
    );
  });
}

if (!window.__cartRecommendationWheelBound) {
  window.__cartRecommendationWheelBound = true;

  document.addEventListener(
    'wheel',
    (event) => {
      const slider = event
        .composedPath()
        .find((node) => node instanceof Element && node.matches('[data-cart-recommendations]'));

      if (!slider) return;

      const inDrawer = slider.closest('cart-drawer');
      if (inDrawer && !inDrawer.classList.contains('is-open')) return;

      handleCartRecommendationWheel(slider, event);
    },
    { passive: false, capture: true }
  );
}

function launchCartConfetti(confettiRoot) {

  if (!confettiRoot) return;

  confettiRoot.innerHTML = '';
  confettiRoot.removeAttribute('hidden');
  confettiRoot.setAttribute('aria-hidden', 'false');

  const colors = ['#ff8fab', '#f72585', '#ffc8dd', '#e05780', '#ffd6e0', '#fb6f92', '#ffafcc'];

  for (let index = 0; index < 90; index += 1) {
    const piece = document.createElement('span');
    const isCircle = index % 3 === 0;

    piece.className = `cart-drawer__confetti-piece${isCircle ? ' cart-drawer__confetti-piece--circle' : ''}`;
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[index % colors.length];
    piece.style.animationDelay = `${Math.random() * 1.2}s`;
    piece.style.animationDuration = `${2.4 + Math.random() * 1.6}s`;
    piece.style.setProperty('--tps-confetti-drift', `${-40 + Math.random() * 80}px`);
    piece.style.setProperty('--tps-confetti-rotation', `${Math.random() * 720}deg`);
    confettiRoot.appendChild(piece);
  }

  window.setTimeout(() => {
    confettiRoot.innerHTML = '';
    confettiRoot.setAttribute('hidden', '');
    confettiRoot.setAttribute('aria-hidden', 'true');
  }, 4200);
}

function initCartFeatures(root, context = {}) {
  if (!root) return;

  const {
    stateHolder = root,
    confettiRoot = null,
    shouldCelebrate = false,
  } = context;

  const progress = root.querySelector('[data-cart-progress]');
  const isComplete = progress?.dataset.cartProgressComplete === 'true';
  const wasComplete = stateHolder.dataset.progressComplete === 'true';
  const confettiEnabled = window.theme?.cartDrawerConfetti !== false;

  stateHolder.classList.toggle('is-rewards-complete', isComplete);

  setupCartRecommendationSliders(root, stateHolder);

  if (progress) {
    if (isComplete && !wasComplete && confettiEnabled && shouldCelebrate && confettiRoot) {
      launchCartConfetti(confettiRoot);
      stateHolder.dataset.progressComplete = 'true';
    } else if (!isComplete) {
      stateHolder.dataset.progressComplete = 'false';
    }
  } else {
    stateHolder.dataset.progressComplete = 'false';
    stateHolder.classList.remove('is-rewards-complete');
  }
}

function initCartDrawerFeatures(drawer) {
  if (!drawer?.contents) return;

  initCartFeatures(drawer.contents, {
    stateHolder: drawer,
    confettiRoot: drawer.querySelector('[data-cart-drawer-celebration]'),
    shouldCelebrate: drawer.isOpen(),
  });
}

function setCartCount(count) {
  const next = Math.max(0, Number(count) || 0);

  document.querySelectorAll('[data-cart-count]').forEach((element) => {
    element.textContent = next;
    element.hidden = next === 0;
  });
}

function bumpCartCount(delta = 1) {
  const first = document.querySelector('[data-cart-count]');
  const current = first ? Number(first.textContent) || 0 : 0;
  setCartCount(current + (Number(delta) || 0));
}

function syncCartCountFromDrawer(drawer) {
  if (!drawer) return false;

  if (!drawer.querySelector('[data-cart-drawer-items]')) {
    setCartCount(0);
    return true;
  }

  const countEl = drawer.querySelector('.cart-drawer__count');
  const match = countEl?.textContent?.match(/\d+/);

  if (!match) return false;

  setCartCount(Number(match[0]));
  return true;
}

async function updateCartCount() {
  try {
    const response = await fetch('/cart.js');

    if (!response.ok) return;

    const cart = await response.json();
    setCartCount(cart.item_count);
  } catch (error) {
    console.error(error);
  }
}

async function refreshCart() {
  const drawer = document.querySelector('cart-drawer');
  const cartPage = document.querySelector('cart-page');

  if (drawer) {
    await drawer.refresh();
  }

  if (cartPage) {
    await cartPage.refresh();
  }

  if (!drawer && !cartPage) {
    await updateCartCount();
  }
}

async function refreshCartDrawer() {
  await refreshCart();
}

function openCartDrawer() {
  const drawer = document.querySelector('cart-drawer');
  drawer?.open();
}

function closeQuickViewModal() {
  const quickView = document.querySelector('quick-view-modal');

  if (quickView?.classList.contains('is-open')) {
    quickView.close();
  }
}

function cartMinLoading(startTime, min = 200) {
  const elapsed = Date.now() - startTime;
  return elapsed < min
    ? new Promise((resolve) => setTimeout(resolve, min - elapsed))
    : Promise.resolve();
}

function normalizeCartAddResponse(data) {
  if (!data) return null;

  if (Array.isArray(data.items) && data.items.length) {
    return data.items[data.items.length - 1];
  }

  return data;
}

function getAddedQuantity(payload) {
  // Use the request quantity — line item.quantity is the cart line total after add.
  if (payload instanceof FormData) {
    return Math.max(1, Number(payload.get('quantity')) || 1);
  }

  if (payload?.quantity != null) return Math.max(1, Number(payload.quantity) || 1);

  if (Array.isArray(payload?.items)) {
    return payload.items.reduce(
      (sum, line) => sum + Math.max(1, Number(line.quantity) || 1),
      0,
    ) || 1;
  }

  return 1;
}

function prepareAddRequest(payload, { withSections, sectionId }) {
  if (payload instanceof FormData) {
    const body = new FormData();

    for (const [key, value] of payload.entries()) {
      body.append(key, value);
    }

    if (withSections && sectionId) {
      body.append('sections', sectionId);
      body.append('sections_url', '/cart');
    }

    return {
      headers: { Accept: 'application/json' },
      body,
    };
  }

  const json = { ...payload };

  if (withSections && sectionId) {
    json.sections = sectionId;
    json.sections_url = '/cart';
  }

  return {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(json),
  };
}

function refreshCartInBackground() {
  refreshCart().catch((error) => {
    console.warn('Background cart refresh failed:', error);
    updateCartCount();
  });
}

async function addToCart(payload) {
  const cartType = window.theme?.cartType || 'cart_drawer';
  const drawer = document.querySelector('cart-drawer');
  const sectionId = drawer?.dataset?.sectionId || 'cart-drawer';
  // Only block the add response on section HTML when the drawer opens immediately.
  const withSections = cartType === 'cart_drawer' && !!drawer;
  const request = prepareAddRequest(payload, { withSections, sectionId });

  const response = await fetch('/cart/add.js', {
    method: 'POST',
    headers: request.headers,
    body: request.body,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.description || 'Unable to add this item to the cart.');
  }

  const data = await response.json();
  const sectionHtml = data?.sections?.[sectionId];
  const item = normalizeCartAddResponse(data);

  // Drop sections payload so popup/other UI gets a clean line item.
  if (item?.sections) {
    delete item.sections;
  }

  bumpCartCount(getAddedQuantity(payload));

  if (sectionHtml && drawer) {
    // open() initializes drawer features — skip here to avoid double work.
    drawer.applySectionHtml(sectionHtml, { initFeatures: false });
    syncCartCountFromDrawer(drawer);
  } else if (drawer || document.querySelector('cart-page')) {
    // Keep drawer/page in sync without delaying popup / success UI.
    refreshCartInBackground();
  } else {
    updateCartCount();
  }

  return item;
}

async function openCartPopup(addedItem) {
  if (!addedItem) return;

  closeQuickViewModal();

  const popup = document.querySelector('cart-popup');
  if (!popup) return;

  if (customElements.get('cart-popup')) {
    popup.show(addedItem);
    return;
  }

  await customElements.whenDefined('cart-popup');
  popup.show(addedItem);
}

function handleCartAfterAdd(cartType, addedItem) {
  const type = cartType || window.theme?.cartType || 'cart_drawer';

  if (type === 'cart_drawer') {
    closeQuickViewModal();
    openCartDrawer();
    return;
  }

  if (type === 'cart_popup') {
    openCartPopup(addedItem);
    return;
  }

  if (type === 'cart_page' && !document.querySelector('cart-page')) {
    window.location.href = '/cart';
  }
}

window.theme = window.theme || {};
window.theme.cart = {
  add: addToCart,
  refresh: refreshCartDrawer,
  open: openCartDrawer,
  updateCount: updateCartCount,
  handleAfterAdd: handleCartAfterAdd,
  showPopup: openCartPopup,
};

class CartPage extends HTMLElement {
  constructor() {
    super();

    this.onContentsClick = this.onContentsClick.bind(this);
    this.onQuantityChange = this.onQuantityChange.bind(this);
  }

  connectedCallback() {
    this.sectionId = this.dataset.sectionId;
    this.contents = this.querySelector('[data-cart-page-contents]');

    this.contents?.addEventListener('click', this.onContentsClick);
    this.contents?.addEventListener('change', this.onQuantityChange);

    initCartFeatures(this.contents, {
      stateHolder: this,
      confettiRoot: this.querySelector('[data-cart-celebration]'),
      shouldCelebrate: true,
    });
  }

  disconnectedCallback() {
    this.contents?.removeEventListener('click', this.onContentsClick);
    this.contents?.removeEventListener('change', this.onQuantityChange);
  }

  onContentsClick(event) {
    const removeButton = event.target.closest('[data-cart-remove]');

    if (!removeButton) return;

    const lineItem = event.target.closest('[data-cart-item]');

    if (!lineItem) return;

    event.preventDefault();
    this.updateLine(Number(lineItem.dataset.line), 0);
  }

  onQuantityChange(event) {
    const input = event.target.closest('[data-quantity-input]');

    if (!input) return;

    const lineItem = input.closest('[data-cart-item]');

    if (!lineItem) return;

    const line = Number(lineItem.dataset.line);
    const quantity = Math.max(0, Number(input.value) || 0);

    this.updateLine(line, quantity);
  }

  setUpdating(isUpdating) {
    this.classList.toggle('is-updating', isUpdating);
  }

  async updateLine(line, quantity) {
    this.setUpdating(true);
    const startTime = Date.now();

    try {
      const response = await fetch('/cart/change.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ line, quantity }),
      });

      if (!response.ok) {
        throw new Error('Unable to update cart.');
      }

      await this.refresh();
    } catch (error) {
      console.error(error);
      window.alert(error.message || 'Unable to update cart.');
    } finally {
      await cartMinLoading(startTime);
      this.setUpdating(false);
    }
  }

  async refresh() {
    if (!this.contents || !this.sectionId) return;

    const noteValue = this.contents.querySelector('#CartNote')?.value;

    const response = await fetch(`/cart?section_id=${encodeURIComponent(this.sectionId)}`);

    if (!response.ok) {
      throw new Error('Unable to refresh cart page.');
    }

    const responseText = await response.text();
    const html = new DOMParser().parseFromString(responseText, 'text/html');
    const newContents = html.querySelector('[data-cart-page-contents]');

    if (newContents) {
      this.contents.innerHTML = newContents.innerHTML;
    }

    const noteInput = this.contents.querySelector('#CartNote');

    if (noteInput && noteValue !== undefined) {
      noteInput.value = noteValue;
    }

    const isEmpty = !this.contents.querySelector('[data-cart-items]');
    this.classList.toggle('is-empty', isEmpty);

    initCartFeatures(this.contents, {
      stateHolder: this,
      confettiRoot: this.querySelector('[data-cart-celebration]'),
      shouldCelebrate: true,
    });

    await updateCartCount();
  }
}

class CartPopup extends HTMLElement {
  constructor() {
    super();

    this.isOpen = false;
    this.isHovering = false;
    this.ignoreOutsideClick = false;
    this.autoCloseTimer = null;
    this.closeTimer = null;

    this.onKeydown = this.onKeydown.bind(this);
    this.onDocumentClick = this.onDocumentClick.bind(this);
    this.onMouseEnter = this.onMouseEnter.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
  }

  connectedCallback() {
    this.cacheElements();
    this.closeButton?.addEventListener('click', () => this.close());
    this.addEventListener('mouseenter', this.onMouseEnter);
    this.addEventListener('mouseleave', this.onMouseLeave);
    document.addEventListener('keydown', this.onKeydown);
    document.addEventListener('click', this.onDocumentClick);
  }

  disconnectedCallback() {
    this.clearAutoClose();
    this.clearCloseTimer();
    this.removeEventListener('mouseenter', this.onMouseEnter);
    this.removeEventListener('mouseleave', this.onMouseLeave);
    document.removeEventListener('keydown', this.onKeydown);
    document.removeEventListener('click', this.onDocumentClick);
  }

  cacheElements() {
    this.imageEl = this.querySelector('[data-cart-popup-image]');
    this.titleEl = this.querySelector('[data-cart-popup-title]');
    this.priceEl = this.querySelector('[data-cart-popup-price]');
    this.variantEl = this.querySelector('[data-cart-popup-variant]');
    this.closeButton = this.querySelector('[data-cart-popup-close]');
  }

  show(item) {
    if (!item) return;

    this.cacheElements();
    this.populateItem(item);
    this.open();
    this.startAutoClose();
  }

  populateItem(item) {
    const title = item.product_title || item.title || '';
    const variantTitle =
      item.variant_title && item.variant_title !== 'Default Title' ? item.variant_title : '';

    if (this.titleEl) this.titleEl.textContent = title;
    if (this.priceEl) {
      this.priceEl.textContent = window.theme?.formatMoney
        ? window.theme.formatMoney(item.price)
        : '';
    }

    if (this.variantEl) {
      this.variantEl.textContent = variantTitle;
      this.variantEl.hidden = !variantTitle;
    }

    if (this.imageEl) {
      if (item.image) {
        const imageUrl = item.image.includes('?') ? `${item.image}&width=144` : `${item.image}?width=144`;
        this.imageEl.src = imageUrl;
        this.imageEl.alt = title;
        this.imageEl.hidden = false;
      } else {
        this.imageEl.removeAttribute('src');
        this.imageEl.alt = '';
        this.imageEl.hidden = true;
      }
    }
  }

  open() {
    this.clearCloseTimer();
    this.classList.remove('is-closing');
    this.setAttribute('aria-hidden', 'false');

    requestAnimationFrame(() => {
      this.classList.add('is-open');
      this.isOpen = true;
      this.ignoreOutsideClick = true;

      window.setTimeout(() => {
        this.ignoreOutsideClick = false;
      }, 200);
    });
  }

  close() {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.clearAutoClose();
    this.classList.remove('is-open');
    this.classList.add('is-closing');
    this.setAttribute('aria-hidden', 'true');

    this.clearCloseTimer();
    this.closeTimer = window.setTimeout(() => {
      this.classList.remove('is-closing');
    }, 300);
  }

  startAutoClose() {
    this.clearAutoClose();
    this.autoCloseTimer = window.setTimeout(() => {
      if (!this.isHovering) this.close();
    }, 5000);
  }

  clearAutoClose() {
    if (this.autoCloseTimer) {
      window.clearTimeout(this.autoCloseTimer);
      this.autoCloseTimer = null;
    }
  }

  clearCloseTimer() {
    if (this.closeTimer) {
      window.clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }

  onMouseEnter() {
    this.isHovering = true;
    this.clearAutoClose();
  }

  onMouseLeave() {
    this.isHovering = false;
    if (this.isOpen) this.startAutoClose();
  }

  onKeydown(event) {
    if (event.key === 'Escape' && this.isOpen) {
      this.close();
    }
  }

  onDocumentClick(event) {
    if (!this.isOpen || this.ignoreOutsideClick) return;
    if (this.contains(event.target)) return;

    this.close();
  }
}

if (!customElements.get('cart-drawer')) {
  customElements.define('cart-drawer', CartDrawer);
}

if (!customElements.get('cart-page')) {
  customElements.define('cart-page', CartPage);
}

if (!customElements.get('cart-popup')) {
  customElements.define('cart-popup', CartPopup);
}

async function handleProductCardAtcClick(button) {
  if (!button || button.disabled || button.dataset.loading === 'true') return;

  const variantId = button.dataset.variantId;
  if (!variantId) return;

  button.dataset.loading = 'true';
  button.disabled = true;
  button.classList.add('is-loading');

  try {
    const addedItem = await addToCart({ id: Number(variantId), quantity: 1 });
    button.disabled = false;
    button.classList.remove('is-loading');
    delete button.dataset.loading;
    handleCartAfterAdd(window.theme?.cartType || 'cart_drawer', addedItem);
  } catch (error) {
    console.error(error);
    window.alert(error.message || 'Unable to add this item to the cart.');
    button.disabled = false;
    button.classList.remove('is-loading');
    delete button.dataset.loading;
  }
}

document.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-product-card-atc]');

  if (!button || button.disabled) return;

  event.preventDefault();
  await handleProductCardAtcClick(button);
});

document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
});
