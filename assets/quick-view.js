class QuickViewModal extends HTMLElement {
  constructor() {
    super();

    this.sectionIds = ['quick-view'];
    this.onDocumentClick = this.onDocumentClick.bind(this);
    this.onDocumentKeydown = this.onDocumentKeydown.bind(this);
    this.onContentClick = this.onContentClick.bind(this);
  }

  connectedCallback() {
    this.content = this.querySelector('[data-quick-view-content]');
    this.viewDetailsText =
      this.dataset.viewDetailsText || 'View full details';

    if (this.dataset.sectionIds) {
      this.sectionIds = this.dataset.sectionIds
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
    }

    document.addEventListener('click', this.onDocumentClick);
    document.addEventListener('keydown', this.onDocumentKeydown);
    this.content?.addEventListener('click', this.onContentClick);
  }

  disconnectedCallback() {
    document.removeEventListener('click', this.onDocumentClick);
    document.removeEventListener('keydown', this.onDocumentKeydown);
    this.content?.removeEventListener('click', this.onContentClick);
  }

  onDocumentClick(event) {
    const quickViewTrigger = event.target.closest('[data-quick-view-trigger]');

    if (quickViewTrigger) {
      event.preventDefault();
      this.open(
        quickViewTrigger.dataset.productUrl,
        quickViewTrigger.dataset.sectionId
      );
      return;
    }

    if (event.target.closest('[data-quick-view-close]') && this.isOpen()) {
      event.preventDefault();
      this.close();
    }
  }

  onDocumentKeydown(event) {
    if (event.key === 'Escape' && this.isOpen()) {
      this.close();
    }
  }

  onContentClick(event) {
    if (event.target.closest('[data-quick-view-close]')) {
      event.preventDefault();
      this.close();
    }
  }

  isOpen() {
    return this.classList.contains('is-open');
  }

  getProductPath(productUrl) {
    if (!productUrl) return '';

    try {
      return new URL(productUrl, window.location.origin).pathname;
    } catch (error) {
      return productUrl;
    }
  }

  async open(productUrl, sectionId) {
    if (!productUrl || this._loading) return;

    this._loading = true;

    const productPath = this.getProductPath(productUrl);
    const sectionIds = sectionId ? [sectionId, ...this.sectionIds] : this.sectionIds;
    const uniqueSectionIds = [...new Set(sectionIds)];
    const wasOpen = this.isOpen();

    try {
      const sectionHtml = await this.fetchProductSection(productPath, uniqueSectionIds);

      if (!sectionHtml) {
        throw new Error('Unable to load product.');
      }

      const html = new DOMParser().parseFromString(sectionHtml, 'text/html');

      await this.loadSectionAssets(html);

      const section = html.querySelector('.shopify-section');
      const markup = section ? section.innerHTML : sectionHtml;

      this.activeProductUrl = productUrl;

      if (!wasOpen) {
        this.removeAttribute('hidden');
        this.classList.add('is-open', 'is-preparing');
        this.setAttribute('aria-hidden', 'false');
        document.body.classList.add('quick-view-open');
      } else {
        this.classList.add('is-preparing');
      }

      this.content.innerHTML = markup;
      this.runInlineScripts(this.content);
      this.appendViewDetailsLink(productUrl);
      await this.prepareContent();
      this.classList.remove('is-preparing');
    } catch (error) {
      console.error(error);

      if (!wasOpen) {
        this.removeAttribute('hidden');
        this.classList.add('is-open');
        this.setAttribute('aria-hidden', 'false');
        document.body.classList.add('quick-view-open');
      }

      this.classList.remove('is-preparing');
      this.content.innerHTML = `<p class="quick-view-modal__loader">${error.message}</p>`;
    } finally {
      this._loading = false;
    }
  }

  async fetchProductSection(productPath, sectionIds) {
    const sectionsParam = sectionIds.join(',');

    const jsonResponse = await fetch(
      `${productPath}?sections=${encodeURIComponent(sectionsParam)}`,
      {
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      }
    );

    if (jsonResponse.ok) {
      const sections = await jsonResponse.json();

      for (const sectionId of sectionIds) {
        if (sections[sectionId]) {
          return sections[sectionId];
        }
      }
    }

    for (const sectionId of sectionIds) {
      const htmlResponse = await fetch(
        `${productPath}?section_id=${encodeURIComponent(sectionId)}`,
        {
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
          },
        }
      );

      if (htmlResponse.ok) {
        return htmlResponse.text();
      }
    }

    return null;
  }

  close() {
    this.classList.remove('is-open', 'is-preparing');
    this.setAttribute('aria-hidden', 'true');
    this.setAttribute('hidden', '');
    document.body.classList.remove('quick-view-open');
    this.content.innerHTML = '';
    this.activeProductUrl = null;
    this._loading = false;
  }

  prepareContent() {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        window.theme?.initProductGalleries?.(this.content);
        requestAnimationFrame(resolve);
      });
    });
  }

  loadSectionAssets(doc) {
    doc.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
      const href = link.getAttribute('href');

      if (!href || document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) {
        return;
      }

      const newLink = document.createElement('link');
      newLink.rel = 'stylesheet';
      newLink.href = href;
      document.head.appendChild(newLink);
    });

    const scriptPromises = [...doc.querySelectorAll('script[src]')].map((oldScript) => {
      const src = oldScript.getAttribute('src');

      if (!src || document.querySelector(`script[src="${src}"]`)) {
        return Promise.resolve();
      }

      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = src;
        script.defer = oldScript.defer;
        script.onload = resolve;
        script.onerror = resolve;
        document.head.appendChild(script);
      });
    });

    return Promise.all(scriptPromises);
  }

  runInlineScripts(container) {
    container.querySelectorAll('script:not([src])').forEach((oldScript) => {
      const script = document.createElement('script');

      [...oldScript.attributes].forEach((attribute) => {
        script.setAttribute(attribute.name, attribute.value);
      });

      script.textContent = oldScript.textContent;
      oldScript.replaceWith(script);
    });
  }

  appendViewDetailsLink(productUrl) {
    const infoWrapper = this.content.querySelector('.product-info-wrapper');

    if (!infoWrapper || infoWrapper.querySelector('[data-quick-view-view-details]')) {
      return;
    }

    const link = document.createElement('a');
    link.href = productUrl;
    link.className = 'quick-view-modal__view-details';
    link.dataset.quickViewViewDetails = '';
    link.textContent = this.viewDetailsText;
    infoWrapper.appendChild(link);
  }

}

if (!customElements.get('quick-view-modal')) {
  customElements.define('quick-view-modal', QuickViewModal);
}
