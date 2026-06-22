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

  async refresh() {
    if (!this.contents) return;

    const response = await fetch(`/cart?section_id=${encodeURIComponent(this.sectionId)}`);

    if (!response.ok) {
      throw new Error('Unable to refresh cart drawer.');
    }

    const responseText = await response.text();
    const html = new DOMParser().parseFromString(responseText, 'text/html');
    const section = html.querySelector('.shopify-section');

    this.contents.innerHTML = section ? section.innerHTML : responseText;

    const isEmpty = !this.contents.querySelector('[data-cart-drawer-items]');
    this.classList.toggle('is-empty', isEmpty);

    initCartDrawerFeatures(this);
    await updateCartCount();
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
      if (Math.abs(dragDistance) > 8) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    { capture: true, signal }
  );
}

function setupCartRecommendationSliders(drawer) {
  if (!drawer?.contents) return;

  if (drawer.recommendationAbortController) {
    drawer.recommendationAbortController.abort();
  }

  drawer.recommendationAbortController = new AbortController();
  const { signal } = drawer.recommendationAbortController;

  drawer.contents.querySelectorAll('[data-cart-recommendations]').forEach((slider) => {
    const slides = slider.querySelectorAll('[data-cart-rec-slide]');

    if (!slides.length) return;

    if (!slider.dataset.currentIndex) {
      slider.dataset.currentIndex = '0';
    }

    buildCartRecommendationDots(slider);
    updateCartRecommendationSlider(slider, Number(slider.dataset.currentIndex) || 0);
    bindCartRecommendationDrag(slider, signal);
  });
}

if (!window.__cartRecommendationWheelBound) {
  window.__cartRecommendationWheelBound = true;

  document.addEventListener(
    'wheel',
    (event) => {
      const drawer = document.querySelector('cart-drawer.is-open');

      if (!drawer?.contents) return;

      const slider = drawer.contents.querySelector('[data-cart-recommendations]');

      if (!slider) return;

      const rect = slider.getBoundingClientRect();
      const isInside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      if (!isInside) return;

      handleCartRecommendationWheel(slider, event);
    },
    { passive: false, capture: true }
  );
}

function launchCartConfetti(drawer) {
  const confettiRoot = drawer.querySelector('[data-cart-drawer-celebration]');

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
    piece.style.setProperty('--confetti-drift', `${-40 + Math.random() * 80}px`);
    piece.style.setProperty('--confetti-rotation', `${Math.random() * 720}deg`);
    confettiRoot.appendChild(piece);
  }

  window.setTimeout(() => {
    confettiRoot.innerHTML = '';
    confettiRoot.setAttribute('hidden', '');
    confettiRoot.setAttribute('aria-hidden', 'true');
  }, 4200);
}

function initCartDrawerFeatures(drawer) {
  if (!drawer?.contents) return;

  const progress = drawer.contents.querySelector('[data-cart-progress]');
  const isComplete = progress?.dataset.cartProgressComplete === 'true';
  const wasComplete = drawer.dataset.progressComplete === 'true';
  const confettiEnabled = window.theme?.cartDrawerConfetti !== false;

  drawer.classList.toggle('is-rewards-complete', isComplete);

  setupCartRecommendationSliders(drawer);

  if (progress) {
    if (isComplete && !wasComplete && confettiEnabled && drawer.isOpen()) {
      launchCartConfetti(drawer);
      drawer.dataset.progressComplete = 'true';
    } else if (!isComplete) {
      drawer.dataset.progressComplete = 'false';
    }
  } else {
    drawer.dataset.progressComplete = 'false';
    drawer.classList.remove('is-rewards-complete');
  }
}

async function updateCartCount() {
  try {
    const response = await fetch('/cart.js');

    if (!response.ok) return;

    const cart = await response.json();

    document.querySelectorAll('[data-cart-count]').forEach((element) => {
      element.textContent = cart.item_count;
      element.hidden = cart.item_count === 0;
    });
  } catch (error) {
    console.error(error);
  }
}

async function refreshCartDrawer() {
  const drawer = document.querySelector('cart-drawer');

  if (drawer) {
    await drawer.refresh();
  } else {
    await updateCartCount();
  }
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

function cartMinLoading(startTime, min = 500) {
  const elapsed = Date.now() - startTime;
  return elapsed < min
    ? new Promise((resolve) => setTimeout(resolve, min - elapsed))
    : Promise.resolve();
}

async function addToCart(payload) {
  const isFormData = payload instanceof FormData;

  const response = await fetch('/cart/add.js', {
    method: 'POST',
    headers: isFormData
      ? { Accept: 'application/json' }
      : { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: isFormData ? payload : JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.description || 'Unable to add this item to the cart.');
  }

  const item = await response.json();
  await refreshCartDrawer();
  return item;
}

function handleCartAfterAdd(cartType) {
  if (cartType === 'cart_drawer') {
    closeQuickViewModal();
    openCartDrawer();
    return;
  }

  if (cartType === 'cart_page') {
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
};

if (!customElements.get('cart-drawer')) {
  customElements.define('cart-drawer', CartDrawer);
}

document.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-product-card-atc]');

  if (!button || button.disabled) return;

  event.preventDefault();

  const variantId = button.dataset.variantId;

  if (!variantId) return;

  button.disabled = true;
  button.classList.add('is-loading');
  const startTime = Date.now();
  let added = false;

  try {
    await addToCart({ id: Number(variantId), quantity: 1 });
    added = true;
  } catch (error) {
    console.error(error);
    window.alert(error.message || 'Unable to add this item to the cart.');
  } finally {
    await cartMinLoading(startTime);
    button.disabled = false;
    button.classList.remove('is-loading');
    if (added) handleCartAfterAdd(window.theme?.cartType || 'cart_drawer');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
});
