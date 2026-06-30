(function () {
  'use strict';

  const PREDICTIVE_SEARCH_URL =
    (window.routes && window.routes.predictive_search_url) || '/search/suggest';
  const PREDICTIVE_SEARCH_ENABLED =
    !window.theme || window.theme.predictiveSearchEnabled !== false;

  function debounce(fn, wait) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  /* ------------------------------------------------------------------ *
   *  SearchForm — shared behavior for any search input (reset button)  *
   * ------------------------------------------------------------------ */
  class SearchForm extends HTMLElement {
    constructor() {
      super();
      this.input = this.querySelector('input[type="search"]');
      this.resetButton = this.querySelector('button[type="reset"]');

      if (!this.input) return;

      this.input.form.addEventListener('reset', this.onFormReset.bind(this));
      this.input.addEventListener(
        'input',
        debounce((event) => {
          this.onChange(event);
        }, 300).bind(this)
      );

      if (this.resetButton) {
        this.resetButton.addEventListener('click', this.onFormReset.bind(this));
      }
    }

    toggleResetButton() {
      if (!this.resetButton) return;
      const resetIsHidden = this.resetButton.classList.contains('hidden');
      if (this.input.value.length > 0 && resetIsHidden) {
        this.resetButton.classList.remove('hidden');
      } else if (this.input.value.length === 0 && !resetIsHidden) {
        this.resetButton.classList.add('hidden');
      }
    }

    onChange() {
      this.toggleResetButton();
    }

    shouldResetForm() {
      return !document.querySelector('[aria-selected="true"] a');
    }

    onFormReset(event) {
      // Prevent default so the reset doesn't blur / submit unexpectedly.
      if (event && event.type === 'click') event.preventDefault();
      if (this.shouldResetForm()) {
        this.input.value = '';
        this.input.focus();
        this.toggleResetButton();
      }
    }

    getQuery() {
      return this.input ? this.input.value.trim() : '';
    }
  }
  if (!customElements.get('search-form')) {
    customElements.define('search-form', SearchForm);
  }

  /* ------------------------------------------------------------------ *
   *  MainSearch — search form on the /search results template          *
   * ------------------------------------------------------------------ */
  class MainSearch extends SearchForm {
    constructor() {
      super();
      this.allSearchInputs = document.querySelectorAll('input[type="search"]');
      this.setupEventListeners();
    }

    setupEventListeners() {
      let allSearchForms = [];
      this.allSearchInputs.forEach((input) =>
        allSearchForms.push(input.closest('form'))
      );
      if (!this.input) return;
      this.input.addEventListener('focus', this.onInputFocus.bind(this));
      if (allSearchForms.length < 2) return;
      allSearchForms.forEach((form) =>
        form.addEventListener('reset', this.onFormReset.bind(this))
      );
      this.allSearchInputs.forEach((input) =>
        input.addEventListener('input', this.onInput.bind(this))
      );
    }

    onFormReset(event) {
      super.onFormReset(event);
      if (super.shouldResetForm()) {
        this.keepInSync('', this.input);
      }
    }

    onInput(event) {
      const target = event.target;
      this.keepInSync(target.value, target);
    }

    onInputFocus() {
      const isSmallScreen = window.innerWidth < 750;
      if (isSmallScreen) {
        this.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    keepInSync(value, target) {
      this.allSearchInputs.forEach((input) => {
        if (input !== target) {
          input.value = value;
        }
      });
    }
  }
  if (!customElements.get('main-search')) {
    customElements.define('main-search', MainSearch);
  }

  /* ------------------------------------------------------------------ *
   *  PredictiveSearch — live suggestions dropdown                      *
   * ------------------------------------------------------------------ */
  class PredictiveSearch extends SearchForm {
    constructor() {
      super();
      this.cachedResults = {};
      this.predictiveSearchResults = this.querySelector('[data-predictive-search]');
      this.allPredictiveSearchInstances =
        document.querySelectorAll('predictive-search');
      this.isOpen = false;
      this.abortController = new AbortController();
      this.searchTerm = '';

      if (!PREDICTIVE_SEARCH_ENABLED || !this.input) return;

      this.setupEventListeners();
    }

    setupEventListeners() {
      this.input.form.addEventListener('submit', this.onFormSubmit.bind(this));
      this.input.addEventListener('focus', this.onFocus.bind(this));
      this.addEventListener('focusout', this.onFocusOut.bind(this));
      this.addEventListener('keyup', this.onKeyup.bind(this));
      this.addEventListener('keydown', this.onKeydown.bind(this));
    }

    getQuery() {
      return this.input.value.trim();
    }

    onChange() {
      super.onChange();
      const newSearchTerm = this.getQuery();
      if (!this.searchTerm || !newSearchTerm.startsWith(this.searchTerm)) {
        // Remove all previous selected elements when the query changes.
        const selectedElement = this.querySelector('[aria-selected="true"]');
        if (selectedElement) selectedElement.setAttribute('aria-selected', false);
      }

      this.updateSearchForTerm(this.searchTerm, newSearchTerm);
      this.searchTerm = newSearchTerm;

      if (!this.searchTerm.length) {
        this.reset();
        return;
      }

      this.getSearchResults(this.searchTerm);
    }

    onFormSubmit(event) {
      if (
        !this.getQuery().length ||
        this.querySelector('[aria-selected="true"] a')
      ) {
        event.preventDefault();
      }
    }

    onFormReset(event) {
      super.onFormReset(event);
      if (super.shouldResetForm()) {
        this.searchTerm = '';
        this.abortController.abort();
        this.abortController = new AbortController();
        this.closeResults(true);
      }
    }

    onFocus() {
      const currentSearchTerm = this.getQuery();
      if (!currentSearchTerm.length) return;

      if (this.searchTerm !== currentSearchTerm) {
        // Search term was changed from other search input, treat it as a user change.
        this.onChange();
      } else if (this.getAttribute('results') === 'true') {
        this.open();
      } else {
        this.getSearchResults(this.searchTerm);
      }
    }

    onFocusOut() {
      setTimeout(() => {
        if (!this.contains(document.activeElement)) this.close();
      });
    }

    onKeyup(event) {
      if (!this.getQuery().length) this.close(true);
      event.preventDefault();

      switch (event.code) {
        case 'ArrowUp':
          this.switchOption('up');
          break;
        case 'ArrowDown':
          this.switchOption('down');
          break;
        case 'Enter':
          this.selectOption();
          break;
      }
    }

    onKeydown(event) {
      // Prevent the cursor from moving in the input when using the up and down arrow keys.
      if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
        event.preventDefault();
      }
    }

    updateSearchForTerm(previousTerm, newTerm) {
      const searchForTextElement = this.querySelector(
        '[data-predictive-search-search-for-text]'
      );
      const currentButtonText = searchForTextElement?.innerText;
      if (currentButtonText) {
        if (currentButtonText.match(new RegExp(previousTerm, 'g')?.length) > 1) {
          // The new term matches part of the button text and not just the search term, do not replace to avoid mistakes.
          return;
        }
        const newButtonText = currentButtonText.replace(previousTerm, newTerm);
        searchForTextElement.innerText = newButtonText;
      }
    }

    switchOption(direction) {
      if (!this.getAttribute('open')) return;

      const moveUp = direction === 'up';
      const selectedElement = this.querySelector('[aria-selected="true"]');

      // Filter out hidden elements (duplicated page and article resources) thanks
      // to https://github.com/whatwg/html/issues/452
      const allVisibleElements = Array.from(
        this.querySelectorAll('li, button.predictive-search__item')
      ).filter((element) => element.offsetParent !== null);

      let activeElementIndex = 0;

      if (moveUp && !selectedElement) return;

      let selectedElementIndex = -1;
      let i = 0;

      while (selectedElementIndex === -1 && i <= allVisibleElements.length) {
        if (allVisibleElements[i] === selectedElement) {
          selectedElementIndex = i;
        }
        i++;
      }

      if (this.statusElement) this.statusElement.textContent = '';

      if (!moveUp && selectedElement) {
        activeElementIndex =
          selectedElementIndex === allVisibleElements.length - 1
            ? 0
            : selectedElementIndex + 1;
      } else if (moveUp) {
        activeElementIndex =
          selectedElementIndex === 0
            ? allVisibleElements.length - 1
            : selectedElementIndex - 1;
      }

      if (activeElementIndex === selectedElementIndex) return;

      const activeElement = allVisibleElements[activeElementIndex];

      activeElement.setAttribute('aria-selected', true);
      if (selectedElement) selectedElement.setAttribute('aria-selected', false);

      this.input.setAttribute('aria-activedescendant', activeElement.id);
    }

    selectOption() {
      const selectedOption = this.querySelector(
        '[aria-selected="true"] a, button[aria-selected="true"]'
      );
      if (selectedOption) selectedOption.click();
    }

    getSearchResults(searchTerm) {
      const queryKey = searchTerm.replace(' ', '-').toLowerCase();
      this.setLiveRegionLoadingState();

      if (this.cachedResults[queryKey]) {
        this.renderSearchResults(this.cachedResults[queryKey]);
        return;
      }

      const params = new URLSearchParams({
        q: searchTerm,
        section_id: 'predictive-search',
        'resources[type]': 'product,page,article,collection,query',
        'resources[limit]': 10,
        'resources[options][unavailable_products]': 'last',
      });

      fetch(`${PREDICTIVE_SEARCH_URL}?${params.toString()}`, {
        signal: this.abortController.signal,
      })
        .then((response) => {
          if (!response.ok) {
            const error = new Error(response.status);
            this.close();
            throw error;
          }
          return response.text();
        })
        .then((text) => {
          const resultsMarkup = new DOMParser()
            .parseFromString(text, 'text/html')
            .querySelector('#predictive-search-results');
          // Save bandwidth by caching the results.
          this.allPredictiveSearchInstances.forEach((predictiveSearchInstance) => {
            predictiveSearchInstance.cachedResults[queryKey] = resultsMarkup
              ? resultsMarkup.outerHTML
              : '';
          });
          this.renderSearchResults(resultsMarkup ? resultsMarkup.outerHTML : '');
        })
        .catch((error) => {
          if (error?.code === 20) {
            // Code 20 means the call was aborted.
            return;
          }
          this.close();
          throw error;
        });
    }

    setLiveRegionLoadingState() {
      this.statusElement =
        this.statusElement || this.querySelector('.predictive-search-status');
      this.loadingText =
        this.loadingText || this.getAttribute('data-loading-text') || 'Loading…';

      if (this.statusElement) {
        this.setLiveRegionText(this.loadingText);
      }
      this.setAttribute('loading', true);
    }

    setLiveRegionText(statusText) {
      if (!this.statusElement) return;
      this.statusElement.setAttribute('aria-hidden', 'false');
      this.statusElement.textContent = statusText;

      setTimeout(() => {
        this.statusElement.setAttribute('aria-hidden', 'true');
      }, 1000);
    }

    renderSearchResults(resultsMarkup) {
      if (this.predictiveSearchResults) {
        this.predictiveSearchResults.innerHTML = resultsMarkup;
      }
      this.setAttribute('results', true);
      this.setLiveRegionResults();
      this.open();
    }

    setLiveRegionResults() {
      this.removeAttribute('loading');
      this.setLiveRegionText(
        this.querySelector('[role="status"]')?.textContent || ''
      );
    }

    getResultsMaxHeight() {
      this.resultsMaxHeight =
        window.innerHeight -
        (this.getBoundingClientRect().bottom + (window.scrollY || 0)) +
        (window.scrollY || 0) -
        this.getBoundingClientRect().top -
        20;
      return this.resultsMaxHeight;
    }

    getSearchTemplateMaxHeight() {
      const anchor = this.querySelector('.field') || this;
      const rect = anchor.getBoundingClientRect();
      return Math.max(200, window.innerHeight - rect.bottom - 24);
    }

    updateResultsMaxHeight() {
      if (!this.predictiveSearchResults) return;

      const maxHeight = this.isSearchTemplate()
        ? this.getSearchTemplateMaxHeight()
        : this.getResultsMaxHeight();

      this.predictiveSearchResults.style.maxHeight = maxHeight + 'px';
    }

    isSearchTemplate() {
      return this.predictiveSearchResults?.classList.contains(
        'predictive-search--search-template'
      );
    }

    getSearchTemplateRoot() {
      return this.closest('.template-search');
    }

    setSearchTemplateOpenState(isOpen) {
      if (!this.isSearchTemplate()) return;
      this.getSearchTemplateRoot()?.classList.toggle(
        'template-search--predictive-open',
        isOpen
      );
    }

    open() {
      this.updateResultsMaxHeight();
      this.setSearchTemplateOpenState(true);
      this.setAttribute('open', true);
      this.input.setAttribute('aria-expanded', true);
      this.isOpen = true;
    }

    close(clearSearchTerm = false) {
      this.closeResults(clearSearchTerm);
      this.isOpen = false;
    }

    closeResults(clearSearchTerm = false) {
      if (clearSearchTerm) {
        this.input.value = '';
        this.removeAttribute('results');
      }
      const selected = this.querySelector('[aria-selected="true"]');

      if (selected) selected.setAttribute('aria-selected', false);

      this.input.setAttribute('aria-activedescendant', '');
      this.removeAttribute('loading');
      this.removeAttribute('open');
      this.input.setAttribute('aria-expanded', false);
      this.setSearchTemplateOpenState(false);
      if (this.predictiveSearchResults) {
        this.predictiveSearchResults.removeAttribute('style');
      }
    }

    reset() {
      if (this.predictiveSearchResults) this.predictiveSearchResults.innerHTML = '';
      this.input.val = '';
      this.removeAttribute('results');
      this.closeResults(true);
    }
  }
  if (!customElements.get('predictive-search')) {
    customElements.define('predictive-search', PredictiveSearch);
  }
})();
