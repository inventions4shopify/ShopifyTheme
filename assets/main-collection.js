class MainCollectionSection extends HTMLElement {
  constructor() {
    super();
    this.handleDocumentClick = this.handleDocumentClick.bind(this);
    this.handlePopState = this.handlePopState.bind(this);
  }
 
  connectedCallback() {
    if (this._initialized) return;
    this._initialized = true;
 
    this.abortController = new AbortController();
    const { signal } = this.abortController;
 
    document.addEventListener('click', this.handleDocumentClick, { signal });
    window.addEventListener('popstate', this.handlePopState, { signal });
 
    this.initSortDropdown(signal);
    this.initAutoFilter(signal);
    this.initPriceRangeFilters(signal);
    this.initFilterAccordions(signal);
    this.initFilterDrawer(signal);
    this.initLayoutToggle(signal);
    this.initPagination(signal);
    this.initActiveFilterPills(signal);
    this.initStickyFilterBar();
    this.syncSearchSortFromUrl();
  }
 
  isSearchPage() {
    return this.hasAttribute('data-search-page');
  }
 
  getUrlSortBy() {
    return new URL(window.location.href).searchParams.get('sort_by') || '';
  }
 
  isClientSearchSort(sortBy) {
    return [
      'title-ascending',
      'title-descending',
      'created-ascending',
      'created-descending',
      'best-selling',
    ].includes(sortBy);
  }
 
  syncSearchSortFromUrl() {
    if (!this.isSearchPage()) return;
 
    const sortBy = this.getUrlSortBy();
    if (!sortBy) return;
 
    this.setSortDropdownValue(sortBy);
    this.applyClientSearchSort(sortBy);
  }
 
  setSortDropdownValue(sortBy) {
    if (!sortBy) return;
 
    const input = this.querySelector('#SortByInput');
    const label = this.querySelector('.js-sort-label');
    const options = this.querySelectorAll('.js-sort-option');
    let matched = false;
 
    options.forEach((option) => {
      const isActive = option.dataset.value === sortBy;
      option.classList.toggle('active', isActive);
      if (isActive) {
        matched = true;
        if (label) label.textContent = option.textContent.trim();
      }
    });
 
    if (matched && input) input.value = sortBy;
  }
 
  applyClientSearchSort(sortBy) {
    if (!this.isSearchPage() || !this.isClientSearchSort(sortBy)) return;
 
    const grid = this.querySelector('[data-search-results-grid]');
    if (!grid) return;
 
    const items = [...grid.querySelectorAll(':scope > .grid__item[data-sort-title]')];
    if (items.length < 2) return;
 
    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
 
    items.sort((a, b) => {
      switch (sortBy) {
        case 'title-ascending':
          return collator.compare(a.dataset.sortTitle || '', b.dataset.sortTitle || '');
        case 'title-descending':
          return collator.compare(b.dataset.sortTitle || '', a.dataset.sortTitle || '');
        case 'created-ascending':
          return Number(a.dataset.sortCreated || 0) - Number(b.dataset.sortCreated || 0);
        case 'created-descending':
          return Number(b.dataset.sortCreated || 0) - Number(a.dataset.sortCreated || 0);
        case 'best-selling':
          return Number(b.dataset.sortBest || 0) - Number(a.dataset.sortBest || 0);
        default:
          return 0;
      }
    });
 
    items.forEach((item) => grid.appendChild(item));
  }
 
  disconnectedCallback() {
    this._initialized = false;
    this.abortController?.abort();
    document.body.classList.remove('open-filter-drawer');
    this.footerObserver?.disconnect();
    this.footerObserver = null;
  }
 
  initStickyFilterBar() {
    if (this._stickyFilterBarBound) return;
 
    const footer =
      document.querySelector('.footer_section') || document.querySelector('footer');
    if (!footer || !('IntersectionObserver' in window)) return;
 
    this._stickyFilterBarBound = true;
 
    this.footerObserver = new IntersectionObserver(
      (entries) => {
        const row = this.querySelector('.cms-main-collection-filter-row');
        if (!row) return;
 
        entries.forEach((entry) => {
          row.classList.toggle('is-hidden-by-footer', entry.isIntersecting);
        });
      },
      { rootMargin: '0px', threshold: 0 }
    );
 
    this.footerObserver.observe(footer);
  }
 
  handleDocumentClick(e) {
    const dropdown = this.querySelector('.js-sort-dropdown');
    if (dropdown && !dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  }
 
  handlePopState() {
    if (!this.dataset.sectionId) return;
    this.renderSection(new URL(window.location.href));
  }
 
  initSortDropdown(signal) {
    if (this._sortDropdownBound) return;
    this._sortDropdownBound = true;
 
    const activeOption = this.querySelector('.js-sort-option.active');
    const label = this.querySelector('.js-sort-label');
    if (activeOption && label) {
      label.textContent = activeOption.textContent.trim();
    }
 
    this.addEventListener(
      'click',
      (event) => {
        const selected = event.target.closest('.js-sort-selected');
        if (selected) {
          selected.closest('.js-sort-dropdown')?.classList.toggle('open');
          return;
        }
 
        const option = event.target.closest('.js-sort-option');
        if (!option) return;
 
        const dropdown = option.closest('.js-sort-dropdown');
        const form = this.querySelector('#SortByForm');
        const input = this.querySelector('#SortByInput');
        const label = dropdown?.querySelector('.js-sort-label');
 
        if (!dropdown || !form || !input || !label) return;
 
        label.textContent = option.textContent.trim();
        input.value = option.dataset.value;
        dropdown.classList.remove('open');
 
        dropdown.querySelectorAll('.js-sort-option').forEach((item) => {
          item.classList.toggle('active', item === option);
        });
 
        if (this.dataset.sectionId) {
          this.applyFromForms();
        } else {
          form.submit();
        }
      },
      { signal }
    );
  }
 
  initPriceRangeFilters(signal) {
    this.querySelectorAll('price-range-filter').forEach((filter) => {
      if (filter.dataset.priceRangeBound === 'true') return;
      filter.dataset.priceRangeBound = 'true';
      filter.init({ signal, section: this });
    });
  }
 
  initAutoFilter(signal) {
    if (this._autoFilterBound) return;
    this._autoFilterBound = true;
 
    this.addEventListener(
      'submit',
      (event) => {
        const form = event.target.closest('[data-collection-filter]');
        if (!form || !this.contains(form)) return;
 
        event.preventDefault();
        this.applyFromForms(form);
      },
      { signal }
    );
 
    this.addEventListener(
      'change',
      (event) => {
        const input = event.target;
        if (
          !input.matches(
            '[data-collection-filter] input[type="checkbox"], [data-collection-filter] input[type="number"]'
          )
        ) {
          return;
        }
 
        const filterForm = input.closest('[data-collection-filter]');
        if (filterForm) {
          this.applyFromForms(filterForm);
        }
      },
      { signal }
    );
  }
 
  closeSiblingAccordions(activeAccordion) {
    const drawer = activeAccordion.closest('.collection-filter-drawer');
    if (!drawer) return;
 
    drawer.querySelectorAll('.cms-filter-accordion[open]').forEach((accordion) => {
      if (accordion === activeAccordion) return;
 
      const content = accordion.querySelector('.cms-filter-accordion-content');
      accordion.removeAttribute('open');
      if (content) {
        content.style.maxHeight = '0px';
        content.style.opacity = '0';
      }
    });
  }
 
  openAccordionPanel(accordion, content) {
    const isDrawer = Boolean(accordion.closest('.collection-filter-drawer'));
 
    accordion.setAttribute('open', '');
 
    if (isDrawer) {
      content.style.maxHeight = 'none';
      content.style.opacity = '1';
      return;
    }
 
    requestAnimationFrame(() => {
      content.style.maxHeight = `${content.scrollHeight}px`;
      content.style.opacity = '1';
    });
  }
 
  closeAccordionPanel(accordion, content) {
    const isDrawer = Boolean(accordion.closest('.collection-filter-drawer'));
 
    if (isDrawer) {
      content.style.maxHeight = '0px';
      content.style.opacity = '0';
      accordion.removeAttribute('open');
      return;
    }
 
    content.style.maxHeight = `${content.scrollHeight}px`;
 
    requestAnimationFrame(() => {
      content.style.maxHeight = '0px';
      content.style.opacity = '0';
    });
 
    setTimeout(() => {
      accordion.removeAttribute('open');
    }, 300);
  }
 
  initFilterAccordions(signal) {
    this.querySelectorAll('.cms-filter-accordion').forEach((accordion) => {
      if (accordion.dataset.accordionBound === 'true') return;
      accordion.dataset.accordionBound = 'true';
 
      const content = accordion.querySelector('.cms-filter-accordion-content');
      const summary = accordion.querySelector('.cms-filter-accordion-title');
 
      if (!content || !summary) return;
 
      if (!accordion.open) {
        content.style.maxHeight = '0px';
        content.style.opacity = '0';
      } else if (accordion.closest('.collection-filter-drawer')) {
        content.style.maxHeight = 'none';
        content.style.opacity = '1';
      }
 
      summary.addEventListener(
        'click',
        (e) => {
          e.preventDefault();
 
          if (accordion.open) {
            this.closeAccordionPanel(accordion, content);
          } else {
            this.closeSiblingAccordions(accordion);
            this.openAccordionPanel(accordion, content);
          }
        },
        { signal }
      );
    });
  }
 
  openFilterDrawer(drawerDetails) {
    if (!drawerDetails) return;
 
    drawerDetails.classList.remove('is-closing');
    document.body.classList.add('open-filter-drawer');
 
    // Force the closed transform first, then slide in on the next frame.
    // Needed because <details> skips the transition on reopen.
    drawerDetails.classList.remove('is-open');
 
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!drawerDetails.open) return;
        drawerDetails.classList.add('is-open');
      });
    });
  }
 
  closeFilterDrawer(drawerDetails) {
    if (!drawerDetails?.open || drawerDetails.classList.contains('is-closing')) return;
 
    const drawer = drawerDetails.querySelector('.collection-filter-drawer');
    drawerDetails.classList.add('is-closing');
    drawerDetails.classList.remove('is-open');
    document.body.classList.remove('open-filter-drawer');
 
    const finish = () => {
      if (!drawerDetails.classList.contains('is-closing')) return;
      drawerDetails.removeAttribute('open');
      drawerDetails.classList.remove('is-closing');
      drawer?.removeEventListener('transitionend', onEnd);
    };
 
    const onEnd = (event) => {
      if (event.target !== drawer || event.propertyName !== 'transform') return;
      finish();
    };
 
    drawer?.addEventListener('transitionend', onEnd);
    setTimeout(finish, 300);
  }
 
  initFilterDrawer(signal) {
    if (this._filterDrawerBound) return;
    this._filterDrawerBound = true;
 
    this.addEventListener(
      'toggle',
      (event) => {
        const drawerDetails = event.target;
        if (!drawerDetails?.classList?.contains('collection-filter-dropdown')) return;
 
        if (drawerDetails.open) {
          this.openFilterDrawer(drawerDetails);
        } else {
          drawerDetails.classList.remove('is-open', 'is-closing');
          document.body.classList.remove('open-filter-drawer');
        }
      },
      { signal, capture: true }
    );
 
    this.addEventListener(
      'click',
      (event) => {
        const drawerDetails = event.target.closest('.collection-filter-dropdown');
        if (!drawerDetails) return;
 
        const closeBtn = event.target.closest('.collection-filter-drawer-close');
        if (closeBtn) {
          event.preventDefault();
          this.closeFilterDrawer(drawerDetails);
          return;
        }
 
        // Animate close when toggling via the Filter summary while open
        const summary = event.target.closest('summary');
        if (summary && drawerDetails.open && summary.parentElement === drawerDetails) {
          event.preventDefault();
          this.closeFilterDrawer(drawerDetails);
        }
      },
      { signal }
    );
 
    document.addEventListener(
      'click',
      (event) => {
        const drawerDetails = this.querySelector('.collection-filter-dropdown');
        if (!drawerDetails?.open) return;
 
        const drawer = drawerDetails.querySelector('.collection-filter-drawer');
        const summary = drawerDetails.querySelector('summary');
        if (drawer?.contains(event.target) || summary?.contains(event.target)) return;
 
        this.closeFilterDrawer(drawerDetails);
      },
      { signal }
    );
  }
 
  initActiveFilterPills(signal) {
    if (this._activeFilterPillsBound) return;
    this._activeFilterPillsBound = true;
 
    this.addEventListener(
      'click',
      (event) => {
        const pill = event.target.closest('[data-filter-remove-url]');
        if (pill) {
          event.preventDefault();
          const removeUrl = pill.getAttribute('data-filter-remove-url');
          if (removeUrl) {
            this.renderSection(new URL(removeUrl, window.location.origin));
          }
          return;
        }
 
        const clearAll = event.target.closest('[data-filter-clear-url]');
        if (clearAll) {
          event.preventDefault();
          const clearUrl = clearAll.getAttribute('data-filter-clear-url');
          if (clearUrl) {
            this.renderSection(new URL(clearUrl, window.location.origin));
          }
        }
      },
      { signal }
    );
  }
 
  syncActiveFiltersBar(newContainer) {
    const newWrappers = newContainer.querySelectorAll('[data-collection-active-filters-wrapper]');
    const currentWrappers = this.querySelectorAll('[data-collection-active-filters-wrapper]');
 
    newWrappers.forEach((newWrapper, index) => {
      const currentWrapper = currentWrappers[index];
      if (!currentWrapper) return;
 
      currentWrapper.innerHTML = newWrapper.innerHTML;
 
      if (newWrapper.hasAttribute('hidden')) {
        currentWrapper.setAttribute('hidden', '');
      } else {
        currentWrapper.removeAttribute('hidden');
      }
    });
  }
 
  getActiveFilterCount(container = this) {
    const countEl = container.querySelector('[data-collection-filter-count]');
    if (countEl) {
      const parsed = parseInt(countEl.textContent, 10);
      if (!Number.isNaN(parsed)) return parsed;
    }
 
    return container.querySelectorAll('[data-filter-remove-url]').length;
  }
 
  syncFilterCount(newContainer) {
    const count = this.getActiveFilterCount(newContainer);
 
    this.querySelectorAll('[data-collection-filter-count]').forEach((el) => {
      el.textContent = count;
 
      if (count > 0) {
        el.removeAttribute('hidden');
        el.removeAttribute('aria-hidden');
      } else {
        el.setAttribute('hidden', '');
        el.setAttribute('aria-hidden', 'true');
      }
    });
  }
 
  getProductGrid() {
    return (
      this.querySelector('.collection-products > .grid') ||
      this.querySelector('.collection-products.grid') ||
      this.querySelector('#CollectionAjaxContainer .template-search__results > .grid')
    );
  }
 
  getGridColPattern() {
    return /^(xs:|sm:|md:|lg:)?grid--\d+-col$/;
  }
 
  usesMdGridBreakpoint(grid) {
    return [...grid.classList].some((cls) => cls.startsWith('md:grid--'));
  }
 
  applyGridLayout(cols) {
    const viewToggle = this.querySelector('.cms-main-collection-view');
    const grid = this.getProductGrid();
    if (!viewToggle || !grid) return;
 
    const storageKey = 'collection-grid-cols';
    const usesMdBreakpoint = this.usesMdGridBreakpoint(grid);
    const gridColPattern = this.getGridColPattern();
 
    [...grid.classList].forEach((cls) => {
      if (gridColPattern.test(cls)) {
        grid.classList.remove(cls);
      }
    });
 
    grid.classList.add('grid', 'grid--2-col');
 
    if (cols === '4') {
      if (usesMdBreakpoint) {
        grid.classList.add('md:grid--4-col');
      } else {
        grid.classList.add('sm:grid--3-col', 'lg:grid--4-col');
      }
    } else if (usesMdBreakpoint) {
      grid.classList.add('md:grid--3-col');
    } else {
      grid.classList.add('sm:grid--3-col', 'lg:grid--3-col');
    }
 
    viewToggle.querySelectorAll('[data-grid]').forEach((button) => {
      const isActive = button.dataset.grid === cols;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
 
    localStorage.setItem(storageKey, cols);
  }
 
  initLayoutToggle(signal) {
    if (this._layoutToggleBound) return;
    this._layoutToggleBound = true;
 
    const storageKey = 'collection-grid-cols';
    const savedCols = localStorage.getItem(storageKey);
    const grid = this.getProductGrid();
 
    if (grid) {
      const usesMdBreakpoint = this.usesMdGridBreakpoint(grid);
      const desktopClass = [...grid.classList].find((cls) => {
        if (usesMdBreakpoint) return cls.startsWith('md:grid--');
        return cls.startsWith('lg:grid--');
      });
      const defaultCols = desktopClass?.includes('4-col') ? '4' : '3';
      this.applyGridLayout(savedCols === '3' || savedCols === '4' ? savedCols : defaultCols);
    }
 
    this.addEventListener(
      'click',
      (event) => {
        const button = event.target.closest('.cms-main-collection-view [data-grid]');
        if (!button || !this.contains(button)) return;
        this.applyGridLayout(button.dataset.grid);
      },
      { signal }
    );
  }
 
  buildPaginationUrl(linkHref) {
    const url = new URL(window.location.href);
    const linkUrl = new URL(linkHref, window.location.origin);
    const page = linkUrl.searchParams.get('page');
 
    if (page) {
      url.searchParams.set('page', page);
    } else {
      url.searchParams.delete('page');
    }
 
    url.searchParams.delete('section_id');
    return url;
  }
 
  initPagination(signal) {
    this.addEventListener(
      'click',
      (event) => {
        const link = event.target.closest('#CollectionAjaxContainer a[href]');
        if (!link || !link.closest('.pagination')) return;
 
        event.preventDefault();
        this.renderSection(this.buildPaginationUrl(link.href));
      },
      { signal }
    );
  }
 
  buildRequestUrl(filterForm) {
    const sectionId = this.dataset.sectionId;
    const requestUrl = new URL(window.location.pathname, window.location.origin);
    const currentUrl = new URL(window.location.href);
    const form = filterForm || this.querySelector('[data-collection-filter]');
    const singleValueKeys = new Set(['q', 'sort_by', 'options[prefix]']);
 
    if (form) {
      const formData = new FormData(form);
      formData.forEach((value, key) => {
        if (value === '') return;
 
        if (singleValueKeys.has(key)) {
          requestUrl.searchParams.set(key, value);
        } else {
          requestUrl.searchParams.append(key, value);
        }
      });
    } else {
      const sortForm = this.querySelector('#SortByForm');
      if (sortForm) {
        const sortFormData = new FormData(sortForm);
        sortFormData.forEach((value, key) => {
          if (value === '') return;
          requestUrl.searchParams.set(key, value);
        });
      }
    }
 
    if (!requestUrl.searchParams.has('q') && currentUrl.searchParams.has('q')) {
      requestUrl.searchParams.set('q', currentUrl.searchParams.get('q'));
    }
 
    if (
      !requestUrl.searchParams.has('options[prefix]') &&
      currentUrl.searchParams.has('options[prefix]')
    ) {
      requestUrl.searchParams.set('options[prefix]', currentUrl.searchParams.get('options[prefix]'));
    }
 
    const sortInput = this.querySelector('#SortByInput');
    if (sortInput?.value) {
      requestUrl.searchParams.set('sort_by', sortInput.value);
    }
 
    if (sectionId) {
      requestUrl.searchParams.set('section_id', sectionId);
    }
 
    return requestUrl;
  }
 
  applyFromForms(filterForm) {
    if (!this.dataset.sectionId) {
      (filterForm || this.querySelector('[data-collection-filter]'))?.submit();
      return;
    }
 
    const requestUrl = this.buildRequestUrl(filterForm);
    requestUrl.searchParams.delete('page');
    this.renderSection(requestUrl);
  }
 
  setLoading(isLoading) {
    const container = this.querySelector('#CollectionAjaxContainer');
    const drawer = this.querySelector('.collection-filter-dropdown');
    if (!container) return;
 
    container.classList.toggle('is-loading', isLoading);
    container.setAttribute('aria-busy', isLoading ? 'true' : 'false');
 
    if (drawer?.open) {
      document.body.classList.add('open-filter-drawer');
    } else if (!isLoading) {
      // No open drawer: make sure the backdrop/scroll-lock never gets stuck on
      document.body.classList.remove('open-filter-drawer');
    }
  }
 
  scrollBarIntoViewIfFooterVisible() {
    const footer =
      document.querySelector('.footer_section') || document.querySelector('footer');
    if (!footer) return;
 
    // Only intervene when the footer is currently in view (which is what hides the
    // sticky bar), e.g. filtering to an empty/short result set while scrolled down.
    const footerInView = footer.getBoundingClientRect().top < window.innerHeight;
    if (!footerInView) return;
 
    const top = this.getBoundingClientRect().top + window.scrollY;
    if (window.scrollY <= top) return;
 
    window.scrollTo({ top: Math.max(top - 16, 0), behavior: 'smooth' });
  }
 
  getFilterDrawerState() {
    const drawerDetails = this.querySelector('.collection-filter-dropdown');
    if (!drawerDetails) return null;
 
    const drawer = drawerDetails.querySelector('.collection-filter-drawer');
    const openDrawerAccordion = drawer
      ? [...drawer.querySelectorAll('.cms-filter-accordion[open]')]
          .map((accordion) => accordion.querySelector('.cms-filter-label')?.textContent.trim())
          .filter(Boolean)
          .pop()
      : null;
 
    return {
      drawerOpen: drawerDetails.open,
      openAccordion: openDrawerAccordion || null,
    };
  }
 
  restoreFilterDrawerState(state) {
    if (!state) return;
 
    const drawerDetails = this.querySelector('.collection-filter-dropdown');
    if (state.drawerOpen && drawerDetails) {
      drawerDetails.setAttribute('open', '');
      drawerDetails.classList.add('is-open');
      drawerDetails.classList.remove('is-closing');
      document.body.classList.add('open-filter-drawer');
    }
 
    if (!state.openAccordion) return;
 
    const drawer = drawerDetails?.querySelector('.collection-filter-drawer');
    if (!drawer) return;
 
    drawer.querySelectorAll('.cms-filter-accordion').forEach((accordion) => {
      const label = accordion.querySelector('.cms-filter-label')?.textContent.trim();
      const content = accordion.querySelector('.cms-filter-accordion-content');
      if (!content) return;
 
      if (label === state.openAccordion) {
        accordion.setAttribute('open', '');
        content.style.maxHeight = 'none';
        content.style.opacity = '1';
      } else {
        accordion.removeAttribute('open');
        content.style.maxHeight = '0px';
        content.style.opacity = '0';
      }
    });
  }
 
  refreshGridLayout() {
    const storageKey = 'collection-grid-cols';
    const savedCols = localStorage.getItem(storageKey);
    const viewToggle = this.querySelector('.cms-main-collection-view');
    const activeButton = viewToggle?.querySelector('[data-grid].is-active');
    const cols = savedCols === '3' || savedCols === '4' ? savedCols : activeButton?.dataset.grid || '3';
    this.applyGridLayout(cols);
  }
 
  syncFilterStates(newContainer) {
    const newForms = newContainer.querySelectorAll('[data-collection-filter]');
    const currentForms = this.querySelectorAll('[data-collection-filter]');
 
    newForms.forEach((newForm, formIndex) => {
      const currentForm = currentForms[formIndex];
      if (!currentForm) return;
 
      const newCheckboxMap = new Map();
      newForm.querySelectorAll('input[type="checkbox"]').forEach((input) => {
        newCheckboxMap.set(`${input.name}::${input.value}`, {
          checked: input.checked,
          labelHtml: input.closest('.cms-filter-option')?.querySelector('span')?.innerHTML,
        });
      });
 
      currentForm.querySelectorAll('input[type="checkbox"]').forEach((input) => {
        const updated = newCheckboxMap.get(`${input.name}::${input.value}`);
        if (!updated) return;
 
        input.checked = updated.checked;
        const labelSpan = input.closest('.cms-filter-option')?.querySelector('span');
        if (labelSpan && updated.labelHtml) {
          labelSpan.innerHTML = updated.labelHtml;
        }
      });
 
      newForm.querySelectorAll('input[type="number"]').forEach((newInput) => {
        const currentInput = currentForm.querySelector(
          `input[type="number"][name="${CSS.escape(newInput.name)}"]`
        );
        if (currentInput) {
          currentInput.value = newInput.value;
        }
      });
 
      currentForm.querySelectorAll('price-range-filter').forEach((filter) => {
        filter.syncFromInputs?.();
      });
    });
  }
 
  syncProductCounts(newContainer) {
    const newCounts = newContainer.querySelectorAll('.cms-collection-product-count');
    const currentCounts = this.querySelectorAll('.cms-collection-product-count');
 
    newCounts.forEach((newCount, index) => {
      if (currentCounts[index]) {
        currentCounts[index].textContent = newCount.textContent;
      }
    });
  }
 
  syncSortDropdown(newContainer) {
    const inputSort = this.isSearchPage() ? this.querySelector('#SortByInput')?.value : '';
    const urlSort = this.isSearchPage() ? this.getUrlSortBy() : '';
    const newActive = newContainer.querySelector('.js-sort-option.active');
    const newValue = inputSort || urlSort || newActive?.dataset.value;
    if (!newValue) return;
 
    this.setSortDropdownValue(newValue);
    this.applyClientSearchSort(newValue);
  }
 
  syncPagination(newContainer, currentContainer) {
    const newPagination = newContainer.querySelector('.pagination-wrapper');
    if (!newPagination) return;
 
    const currentPagination = currentContainer.querySelector('.pagination-wrapper');
    if (currentPagination) {
      currentPagination.outerHTML = newPagination.outerHTML;
      return;
    }
 
    const currentProducts = currentContainer.querySelector('.collection-products');
    if (currentProducts) {
      currentProducts.insertAdjacentHTML('afterend', newPagination.outerHTML);
    }
  }
 
  updateCollectionResults(newContainer, currentContainer) {
    const currentProducts = currentContainer.querySelector('.collection-products');
    const newProducts = newContainer.querySelector('.collection-products');
 
    if (currentProducts && newProducts) {
      currentProducts.innerHTML = newProducts.innerHTML;
      this.syncPagination(newContainer, currentContainer);
      this.syncFilterStates(newContainer);
      this.syncProductCounts(newContainer);
      this.syncSortDropdown(newContainer);
      this.syncActiveFiltersBar(newContainer);
      this.syncFilterCount(newContainer);
      this.refreshGridLayout();
      return true;
    }
 
    return false;
  }
 
  reinitDynamicContent() {
    const { signal } = this.abortController;
    this.initFilterAccordions(signal);
    this.initPriceRangeFilters(signal);
    this.refreshGridLayout();
  }
 
  async renderSection(requestUrl) {
    if (this._filterLoading || !this.dataset.sectionId) return;
 
    const sectionId = this.dataset.sectionId;
    const container = this.querySelector('#CollectionAjaxContainer');
    if (!container) return;
 
    this._filterLoading = true;
    this.setLoading(true);
 
    const fetchUrl = new URL(requestUrl.href);
    fetchUrl.searchParams.set('section_id', sectionId);
 
    const browseUrl = new URL(fetchUrl.href);
    browseUrl.searchParams.delete('section_id');
 
    try {
      const response = await fetch(fetchUrl.toString());
      if (!response.ok) throw new Error(response.status);
 
      const html = new DOMParser().parseFromString(await response.text(), 'text/html');
      const section = html.getElementById(`shopify-section-${sectionId}`);
      const newContainer = section?.querySelector('#CollectionAjaxContainer');
 
      if (!newContainer) throw new Error('Missing collection results container');
 
      const drawerState = this.getFilterDrawerState();
      const updated = this.updateCollectionResults(newContainer, container);
 
      if (!updated) {
        container.innerHTML = newContainer.innerHTML;
        this.reinitDynamicContent();
      }
 
      history.pushState({}, '', browseUrl.toString());
      this.restoreFilterDrawerState(drawerState);
      requestAnimationFrame(() => this.scrollBarIntoViewIfFooterVisible());
 
      if (this.isSearchPage()) {
        const sortBy = browseUrl.searchParams.get('sort_by') || this.querySelector('#SortByInput')?.value;
        this.setSortDropdownValue(sortBy);
        this.applyClientSearchSort(sortBy);
      }
    } catch (error) {
      console.error(error);
      window.location.assign(browseUrl.toString());
    } finally {
      this._filterLoading = false;
      this.setLoading(false);
    }
  }
}
 
class PriceRangeFilter extends HTMLElement {
  init({ signal, section }) {
    this.section = section;
    this.rangeMin = parseFloat(this.dataset.rangeMin) || 0;
    this.rangeMax = parseFloat(this.dataset.rangeMax) || 0;
    this.step = parseFloat(this.dataset.priceStep) || 1;
 
    this.minSlider = this.querySelector('[data-price-range-min]');
    this.maxSlider = this.querySelector('[data-price-range-max]');
    this.minInput = this.querySelector('[data-price-input-min]');
    this.maxInput = this.querySelector('[data-price-input-max]');
    this.progress = this.querySelector('[data-price-progress]');
 
    if (!this.minSlider || !this.maxSlider || this.rangeMax <= this.rangeMin) return;
 
    this.applyFilter = this.debounce(() => {
      const form = this.closest('[data-collection-filter]');
      if (form && this.section) {
        this.section.applyFromForms(form);
      }
    }, 500);
 
    this.minSlider.addEventListener('pointerdown', () => this.setActiveSlider('min'), { signal });
    this.maxSlider.addEventListener('pointerdown', () => this.setActiveSlider('max'), { signal });
    this.minSlider.addEventListener('pointerup', () => this.clearActiveSlider(), { signal });
    this.maxSlider.addEventListener('pointerup', () => this.clearActiveSlider(), { signal });
    this.minSlider.addEventListener('pointercancel', () => this.clearActiveSlider(), { signal });
    this.maxSlider.addEventListener('pointercancel', () => this.clearActiveSlider(), { signal });
    this.minSlider.addEventListener('input', () => this.onSliderInput('min'), { signal });
    this.maxSlider.addEventListener('input', () => this.onSliderInput('max'), { signal });
    this.minSlider.addEventListener('change', () => this.applyFilter(), { signal });
    this.maxSlider.addEventListener('change', () => this.applyFilter(), { signal });
 
    if (this.minInput) {
      this.minInput.addEventListener('input', () => this.onNumberInput(), { signal });
    }
 
    if (this.maxInput) {
      this.maxInput.addEventListener('input', () => this.onNumberInput(), { signal });
    }
 
    this.syncFromInputs();
  }
 
  debounce(fn, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), wait);
    };
  }
 
  setActiveSlider(which) {
    this.minSlider.classList.toggle('is-active', which === 'min');
    this.maxSlider.classList.toggle('is-active', which === 'max');
  }
 
  clearActiveSlider() {
    this.minSlider.classList.remove('is-active');
    this.maxSlider.classList.remove('is-active');
    this.updateThumbZIndex(
      parseFloat(this.minSlider.value),
      parseFloat(this.maxSlider.value)
    );
  }
 
  updateThumbZIndex(minVal, maxVal) {
    const range = this.rangeMax - this.rangeMin;
    const threshold = range > 0 ? range * 0.05 : 0;
 
    if (maxVal - minVal <= threshold) {
      this.minSlider.style.zIndex = this.minSlider.classList.contains('is-active') ? '6' : '5';
      this.maxSlider.style.zIndex = this.maxSlider.classList.contains('is-active') ? '6' : '4';
    } else {
      this.minSlider.style.zIndex = '';
      this.maxSlider.style.zIndex = '';
    }
  }
 
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
 
  parseInputValue(input, fallback) {
    if (!input || input.value === '') return fallback;
    const value = parseFloat(input.value);
    return Number.isNaN(value) ? fallback : value;
  }
 
  syncFromInputs() {
    let minVal = this.parseInputValue(this.minInput, this.rangeMin);
    let maxVal = this.parseInputValue(this.maxInput, this.rangeMax);
 
    minVal = this.clamp(minVal, this.rangeMin, this.rangeMax);
    maxVal = this.clamp(maxVal, this.rangeMin, this.rangeMax);
 
    if (minVal > maxVal) {
      minVal = maxVal;
    }
 
    this.minSlider.value = minVal;
    this.maxSlider.value = maxVal;
    this.updateProgress(minVal, maxVal);
    this.updateThumbZIndex(minVal, maxVal);
  }
 
  onSliderInput(which) {
    let minVal = parseFloat(this.minSlider.value);
    let maxVal = parseFloat(this.maxSlider.value);
 
    if (minVal > maxVal) {
      if (which === 'min') {
        minVal = maxVal;
        this.minSlider.value = minVal;
      } else {
        maxVal = minVal;
        this.maxSlider.value = maxVal;
      }
    }
 
    if (this.minInput) {
      this.minInput.value = minVal <= this.rangeMin ? '' : this.formatInputValue(minVal);
    }
 
    if (this.maxInput) {
      this.maxInput.value = maxVal >= this.rangeMax ? '' : this.formatInputValue(maxVal);
    }
 
    this.updateProgress(minVal, maxVal);
    this.updateThumbZIndex(minVal, maxVal);
  }
 
  onNumberInput() {
    let minVal = this.parseInputValue(this.minInput, this.rangeMin);
    let maxVal = this.parseInputValue(this.maxInput, this.rangeMax);
 
    minVal = this.clamp(minVal, this.rangeMin, this.rangeMax);
    maxVal = this.clamp(maxVal, this.rangeMin, this.rangeMax);
 
    if (minVal > maxVal) {
      maxVal = minVal;
      if (this.maxInput) {
        this.maxInput.value = maxVal >= this.rangeMax ? '' : this.formatInputValue(maxVal);
      }
    }
 
    this.minSlider.value = minVal;
    this.maxSlider.value = maxVal;
    this.updateProgress(minVal, maxVal);
    this.updateThumbZIndex(minVal, maxVal);
  }
 
  formatInputValue(value) {
    if (this.step < 1) {
      return value.toFixed(2);
    }
 
    return String(Math.round(value));
  }
 
  updateProgress(minVal, maxVal) {
    if (!this.progress) return;
 
    const range = this.rangeMax - this.rangeMin;
    if (range <= 0) return;
 
    const left = ((minVal - this.rangeMin) / range) * 100;
    const width = ((maxVal - minVal) / range) * 100;
 
    this.progress.style.left = `${left}%`;
    this.progress.style.width = `${width}%`;
  }
}
 
if (!customElements.get('price-range-filter')) {
  customElements.define('price-range-filter', PriceRangeFilter);
}
 
if (!customElements.get('main-collection-section')) {
  customElements.define('main-collection-section', MainCollectionSection);
}