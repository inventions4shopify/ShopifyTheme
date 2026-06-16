class MainCollectionSection extends HTMLElement {
  connectedCallback() {
    if (this._initialized) return;
    this._initialized = true;

    this.abortController = new AbortController();
    const { signal } = this.abortController;

    this.initSortDropdown(signal);
    this.initAutoFilter(signal);
    this.initFilterAccordions(signal);
    this.initFilterDrawer(signal);
    this.initLayoutToggle(signal);
  }

  disconnectedCallback() {
    this._initialized = false;
    this.abortController?.abort();
    document.body.classList.remove('open-filter-drawer');
  }

  initSortDropdown(signal) {
    const dropdown = this.querySelector('.js-sort-dropdown');
    const selected = this.querySelector('.js-sort-selected');
    const label = this.querySelector('.js-sort-label');
    const options = this.querySelectorAll('.js-sort-option');
    const input = this.querySelector('#SortByInput');
    const form = this.querySelector('#SortByForm');

    if (!dropdown || !selected || !label || !input || !form) return;

    selected.addEventListener('click', () => {
      dropdown.classList.toggle('open');
    }, { signal });

    options.forEach((option) => {
      if (option.classList.contains('active')) {
        label.textContent = option.textContent.trim();
      }

      option.addEventListener('click', () => {
        label.textContent = option.textContent.trim();
        input.value = option.dataset.value;
        dropdown.classList.remove('open');
        form.submit();
      }, { signal });
    });

    this.onDocumentClick = (e) => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('open');
      }
    };

    document.addEventListener('click', this.onDocumentClick, { signal });
  }

  initAutoFilter(signal) {
    const filterForm = this.querySelector('#CollectionFiltersForm');

    if (!filterForm?.hasAttribute('data-auto-filter')) return;

    filterForm.querySelectorAll('input, select').forEach((input) => {
      input.addEventListener('change', () => {
        filterForm.submit();
      }, { signal });
    });
  }

  initFilterAccordions(signal) {
    this.querySelectorAll('.cms-filter-accordion').forEach((accordion) => {
      const content = accordion.querySelector('.cms-filter-accordion-content');
      const summary = accordion.querySelector('.cms-filter-accordion-title');

      if (!content || !summary) return;

      if (!accordion.open) {
        content.style.maxHeight = '0px';
      }

      summary.addEventListener('click', (e) => {
        e.preventDefault();

        if (accordion.open) {
          content.style.maxHeight = content.scrollHeight + 'px';

          requestAnimationFrame(() => {
            content.style.maxHeight = '0px';
          });

          setTimeout(() => {
            accordion.removeAttribute('open');
          }, 300);
        } else {
          accordion.setAttribute('open', '');

          requestAnimationFrame(() => {
            content.style.maxHeight = content.scrollHeight + 'px';
          });
        }
      }, { signal });
    });
  }

  initFilterDrawer(signal) {
    const drawerDetails = this.querySelector('.collection-filter-dropdown');
    if (!drawerDetails) return;

    const drawer = drawerDetails.querySelector('.collection-filter-drawer');
    const summary = drawerDetails.querySelector('summary');
    const closeBtn = drawerDetails.querySelector('.collection-filter-drawer-close');

    const closeDrawer = () => {
      drawerDetails.removeAttribute('open');
    };

    const syncBodyClass = () => {
      document.body.classList.toggle('open-filter-drawer', drawerDetails.open);
    };

    drawerDetails.addEventListener('toggle', syncBodyClass, { signal });

    closeBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      closeDrawer();
    }, { signal });

    document.addEventListener('click', (e) => {
      if (!drawerDetails.open) return;
      if (drawer?.contains(e.target) || summary?.contains(e.target)) return;

      closeDrawer();
    }, { signal });
  }

  initLayoutToggle(signal) {
    const viewToggle = this.querySelector('.cms-main-collection-view');
    const grid = this.querySelector('.collection-products.grid, .collection-products .grid');

    if (!viewToggle || !grid) return;

    const buttons = viewToggle.querySelectorAll('[data-grid]');
    const storageKey = 'collection-grid-cols';
    const usesMdBreakpoint = [...grid.classList].some((cls) => cls.startsWith('md:grid--'));
    const gridColPattern = /^(xs:|sm:|md:|lg:)?grid--\d+-col$/;

    const getCurrentCols = () => {
      const desktopClass = [...grid.classList].find((cls) => {
        if (usesMdBreakpoint) return cls.startsWith('md:grid--');
        return cls.startsWith('lg:grid--');
      });

      return desktopClass?.includes('4-col') ? '4' : '3';
    };

    const applyGrid = (cols) => {
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

      buttons.forEach((button) => {
        const isActive = button.dataset.grid === cols;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });

      localStorage.setItem(storageKey, cols);
    };

    const savedCols = localStorage.getItem(storageKey);
    applyGrid(savedCols === '3' || savedCols === '4' ? savedCols : getCurrentCols());

    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        applyGrid(button.dataset.grid);
      }, { signal });
    });
  }
}

if (!customElements.get('main-collection-section')) {
  customElements.define('main-collection-section', MainCollectionSection);
}
