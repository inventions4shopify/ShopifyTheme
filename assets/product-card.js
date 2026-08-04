(() => {
  const SELECTOR = '[data-card-variant-image]';
  const CARD_CLASS = 'product-card--variant-hover';
  const ACTIVE_CLASS = 'is-active';
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)');
  let lastPointerType = 'mouse';

  function getPrimaryImage(card) {
    return card?.querySelector('.product-card__image--primary');
  }

  function clearActiveSwatches(card) {
    card?.querySelectorAll(`${SELECTOR}.${ACTIVE_CLASS}`).forEach((el) => {
      el.classList.remove(ACTIVE_CLASS);
    });
  }

  function showVariantImage(swatch, { persist = false } = {}) {
    const card = swatch.closest('.product-card');
    const primary = getPrimaryImage(card);
    const imageUrl = swatch.getAttribute('data-card-variant-image');

    if (!card || !primary || !imageUrl) return;

    if (!primary.dataset.originalSrc) {
      primary.dataset.originalSrc = primary.currentSrc || primary.getAttribute('src') || '';
    }

    if (primary.getAttribute('src') !== imageUrl) {
      primary.setAttribute('src', imageUrl);
    }

    card.classList.add(CARD_CLASS);
    clearActiveSwatches(card);
    swatch.classList.add(ACTIVE_CLASS);

    if (persist) {
      card.dataset.variantImageLocked = 'true';
    }
  }

  function resetVariantImage(card, { force = false } = {}) {
    if (!card) return;
    if (!force && card.dataset.variantImageLocked === 'true') return;

    const primary = getPrimaryImage(card);
    if (primary?.dataset.originalSrc) {
      primary.setAttribute('src', primary.dataset.originalSrc);
    }

    card.classList.remove(CARD_CLASS);
    clearActiveSwatches(card);
    delete card.dataset.variantImageLocked;
  }

  document.addEventListener(
    'pointerdown',
    (event) => {
      lastPointerType = event.pointerType || 'mouse';
    },
    true
  );

  document.addEventListener('pointerover', (event) => {
    if (event.pointerType === 'touch') return;
    if (!canHover.matches) return;

    const swatch = event.target.closest(SELECTOR);
    if (!swatch) return;

    const related = event.relatedTarget?.closest?.(SELECTOR);
    if (related === swatch) return;

    showVariantImage(swatch);
  });

  document.addEventListener('pointerout', (event) => {
    if (event.pointerType === 'touch') return;
    if (!canHover.matches) return;

    const swatch = event.target.closest(SELECTOR);
    if (!swatch) return;

    const card = swatch.closest('.product-card');
    const nextSwatch = event.relatedTarget?.closest?.(SELECTOR);

    if (nextSwatch && card?.contains(nextSwatch)) {
      showVariantImage(nextSwatch);
      return;
    }

    resetVariantImage(card);
  });

  // Touch / coarse pointer: tap to swap image and keep it until another swatch (or same again)
  document.addEventListener('click', (event) => {
    const swatch = event.target.closest(SELECTOR);
    if (!swatch) return;

    const isTouchLike = lastPointerType === 'touch' || !canHover.matches;
    if (!isTouchLike) return;

    const card = swatch.closest('.product-card');
    if (!card) return;

    event.preventDefault();
    event.stopPropagation();

    if (swatch.classList.contains(ACTIVE_CLASS) && card.dataset.variantImageLocked === 'true') {
      resetVariantImage(card, { force: true });
      return;
    }

    showVariantImage(swatch, { persist: true });
  });
})();
