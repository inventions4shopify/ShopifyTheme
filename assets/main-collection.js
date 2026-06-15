class MainCollectionSection extends HTMLElement {
  connectedCallback() {
    if (this._initialized) return;
    this._initialized = true;

    this.abortController = new AbortController();
    const { signal } = this.abortController;

    this.initSortDropdown(signal);
    this.initAutoFilter(signal);
    this.initFilterAccordions(signal);
  }

  disconnectedCallback() {
    this._initialized = false;
    this.abortController?.abort();
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
}

if (!customElements.get('main-collection-section')) {
  customElements.define('main-collection-section', MainCollectionSection);
}
