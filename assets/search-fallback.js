(function () {
  'use strict';

  const root = document.querySelector('[data-search-fallback]');
  if (!root) return;

  const terms = (root.dataset.searchTerms || '').trim();
  const sectionId = root.dataset.sectionId;
  const predictiveUrl =
    root.dataset.predictiveUrl ||
    (window.routes && window.routes.predictive_search_url) ||
    '/search/suggest';
  const searchType = root.dataset.searchType || 'product,collection,page';
  const container = root.querySelector('#CollectionAjaxContainer');
  const grid = root.querySelector('[data-search-results-grid]');
  const emptyEl = root.querySelector('[data-search-fallback-empty]');

  if (!terms || !sectionId || !container) return;

  function findMatchingWord(products, query) {
    const needle = query.toLowerCase();
    for (const product of products || []) {
      const words = String(product.title || '').split(/[\s\-_/]+/);
      for (const word of words) {
        const normalized = word.toLowerCase();
        if (normalized.startsWith(needle) && normalized.length >= needle.length) {
          return word;
        }
      }
    }
    return '';
  }

  function keepTypedSearchTerm() {
    const input = document.getElementById('Search-In-Template');
    if (input) input.value = terms;
  }

  async function fetchSuggestData() {
    const params = new URLSearchParams({
      q: terms,
      'resources[type]': 'query,product',
      'resources[limit]': 4,
      'resources[limit_scope]': 'each',
      'resources[options][fields]': 'title,product_type,variants.title,vendor',
    });

    const response = await fetch(`${predictiveUrl}.json?${params.toString()}`);
    if (!response.ok) throw new Error(response.status);
    return response.json();
  }

  function resolveStorefrontQuery(data) {
    const suggested = data?.resources?.results?.queries?.[0]?.text;
    if (suggested && suggested.trim()) return suggested.trim();

    const products = data?.resources?.results?.products || [];
    return findMatchingWord(products, terms);
  }

  async function fetchStorefrontSection(query) {
    const searchUrl = new URL('/search', window.location.origin);
    searchUrl.searchParams.set('q', query);
    searchUrl.searchParams.set('type', searchType);
    searchUrl.searchParams.set('options[prefix]', 'last');
    searchUrl.searchParams.set('section_id', sectionId);

    const response = await fetch(searchUrl.toString());
    if (!response.ok) throw new Error(response.status);

    const html = new DOMParser().parseFromString(await response.text(), 'text/html');
    const section =
      html.getElementById(`shopify-section-${sectionId}`) ||
      html.querySelector('main-collection-section');
    return section?.querySelector('#CollectionAjaxContainer') || null;
  }

  function sectionHasResults(sectionContainer) {
    if (!sectionContainer) return false;
    return Boolean(
      sectionContainer.querySelector(
        '.collection-products .grid__item .product-card, .collection-products .grid__item .search-result-card'
      )
    );
  }

  function replaceWithStorefrontResults(newContainer) {
    container.innerHTML = newContainer.innerHTML;
    keepTypedSearchTerm();

    if (typeof root.reinitDynamicContent === 'function') {
      root.reinitDynamicContent();
    }

    if (typeof root.syncSearchSortFromUrl === 'function') {
      root.syncSearchSortFromUrl();
    }

    root.closest('.template-search')?.classList.remove('template-search--empty');
    root.removeAttribute('data-search-fallback');
  }

  async function renderPredictiveGridFallback() {
    const params = new URLSearchParams({
      q: terms,
      section_id: 'search-fallback',
      'resources[type]': 'product,collection,page',
      'resources[limit]': 10,
      'resources[limit_scope]': 'each',
      'resources[options][unavailable_products]': 'last',
      'resources[options][fields]': 'title,product_type,variants.title,vendor',
    });

    const response = await fetch(`${predictiveUrl}?${params.toString()}`);
    if (!response.ok) throw new Error(response.status);

    const markup = new DOMParser()
      .parseFromString(await response.text(), 'text/html')
      .querySelector('#search-fallback-results');

    if (!markup || !grid) throw new Error('missing fallback markup');

    const count = Number(markup.getAttribute('data-fallback-count') || 0);
    if (!count) {
      if (emptyEl) {
        emptyEl.textContent =
          emptyEl.dataset.noResultsText || `No results found for ${terms}`;
      }
      return;
    }

    grid.innerHTML = markup.innerHTML;
    root.querySelectorAll('.cms-collection-product-count').forEach((el) => {
      el.textContent = `${count} Products`;
    });
    keepTypedSearchTerm();

    if (typeof root.syncSearchSortFromUrl === 'function') {
      root.syncSearchSortFromUrl();
    }

    root.closest('.template-search')?.classList.remove('template-search--empty');
  }

  (async function init() {
    try {
      const suggestData = await fetchSuggestData();
      const storefrontQuery = resolveStorefrontQuery(suggestData);

      if (storefrontQuery) {
        const storefrontContainer = await fetchStorefrontSection(storefrontQuery);
        if (sectionHasResults(storefrontContainer)) {
          replaceWithStorefrontResults(storefrontContainer);
          return;
        }
      }

      await renderPredictiveGridFallback();
    } catch (error) {
      try {
        await renderPredictiveGridFallback();
      } catch (fallbackError) {
        if (emptyEl) {
          emptyEl.textContent =
            emptyEl.dataset.noResultsText || `No results found for ${terms}`;
        }
      }
    }
  })();
})();
