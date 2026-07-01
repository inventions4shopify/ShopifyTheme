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
    this.initFilterAccordions(signal);
    this.initFilterDrawer(signal);
    this.initLayoutToggle(signal);
    this.initPagination(signal);
    this.initActiveFilterPills(signal);
  }

  disconnectedCallback() {
    this._initialized = false;
    this.abortController?.abort();
    document.body.classList.remove('open-filter-drawer');
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

  initFilterDrawer(signal) {
    if (this._filterDrawerBound) return;
    this._filterDrawerBound = true;

    this.addEventListener(
      'toggle',
      (event) => {
        const drawerDetails = event.target.closest('.collection-filter-dropdown');
        if (!drawerDetails) return;
        document.body.classList.toggle('open-filter-drawer', drawerDetails.open);
      },
      { signal, capture: true }
    );

    this.addEventListener(
      'click',
      (event) => {
        const closeBtn = event.target.closest('.collection-filter-drawer-close');
        if (!closeBtn) return;

        event.preventDefault();
        closeBtn.closest('.collection-filter-dropdown')?.removeAttribute('open');
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

        drawerDetails.removeAttribute('open');
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
      this.querySelector('.collection-products.grid')
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
    const form = filterForm || this.querySelector('[data-collection-filter]');

    if (form) {
      const formData = new FormData(form);
      formData.forEach((value, key) => {
        if (value === '') return;
        requestUrl.searchParams.append(key, value);
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
    }
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
    const newActive = newContainer.querySelector('.js-sort-option.active');
    const newValue = newActive?.dataset.value;
    if (!newValue) return;

    const input = this.querySelector('#SortByInput');
    const label = this.querySelector('.js-sort-label');

    if (input) input.value = newValue;

    this.querySelectorAll('.js-sort-option').forEach((option) => {
      const isActive = option.dataset.value === newValue;
      option.classList.toggle('active', isActive);
      if (isActive && label) {
        label.textContent = option.textContent.trim();
      }
    });
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
    } catch (error) {
      console.error(error);
      window.location.assign(browseUrl.toString());
    } finally {
      this._filterLoading = false;
      this.setLoading(false);
    }
  }
}

if (!customElements.get('main-collection-section')) {
  customElements.define('main-collection-section', MainCollectionSection);
}
