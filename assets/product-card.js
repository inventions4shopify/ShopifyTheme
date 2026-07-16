(() => {
  const SELECTOR = '[data-card-variant-image]';
  const CARD_CLASS = 'product-card--variant-hover';

  function getPrimaryImage(card) {
    return card?.querySelector('.product-card__image--primary');
  }

  function showVariantImage(swatch) {
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
  }

  function resetVariantImage(card) {
    if (!card) return;

    const primary = getPrimaryImage(card);
    if (primary?.dataset.originalSrc) {
      primary.setAttribute('src', primary.dataset.originalSrc);
    }

    card.classList.remove(CARD_CLASS);
  }

  document.addEventListener('pointerover', (event) => {
    const swatch = event.target.closest(SELECTOR);
    if (!swatch) return;

    const related = event.relatedTarget?.closest?.(SELECTOR);
    if (related === swatch) return;

    showVariantImage(swatch);
  });

  document.addEventListener('pointerout', (event) => {
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
})();
