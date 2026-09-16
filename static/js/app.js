// Vanilla JavaScript for Famous Quotes Web Application

document.addEventListener('DOMContentLoaded', () => {
  // State
  const state = {
    heroQuote: null,
    quotes: [],
    categories: [],
    authors: [],
    filters: {
      q: '',
      category: '',
      author: ''
    },
    debounceTimer: null
  };

  // DOM Elements
  const heroCard = document.getElementById('hero-quote-card');
  const heroText = document.getElementById('hero-quote-text');
  const heroAuthor = document.getElementById('hero-author');
  const heroCategory = document.getElementById('hero-category');
  const heroRandomBtn = document.getElementById('hero-random-btn');
  const heroCopyBtn = document.getElementById('hero-copy-btn');
  const heroCopyText = document.getElementById('hero-copy-text');

  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const categorySelect = document.getElementById('category-select');
  const authorSelect = document.getElementById('author-select');
  const categoryPillsContainer = document.getElementById('category-pills');
  const resetFiltersBtn = document.getElementById('reset-filters-btn');

  const resultsCount = document.getElementById('results-count');
  const quotesGrid = document.getElementById('quotes-grid');
  const emptyState = document.getElementById('empty-state');
  const emptyResetBtn = document.getElementById('empty-reset-btn');
  const toast = document.getElementById('toast');

  // Category to CSS badge class mapping
  function getCategoryClass(category) {
    if (!category) return '';
    const norm = category.toLowerCase().replace(/[^a-z]/g, '');
    if (norm.includes('philosophy')) return 'badge-philosophy';
    if (norm.includes('science')) return 'badge-science';
    if (norm.includes('literature')) return 'badge-literature';
    if (norm.includes('leadership')) return 'badge-leadership';
    if (norm.includes('inspiration')) return 'badge-inspiration';
    if (norm.includes('wisdom')) return 'badge-wisdom';
    if (norm.includes('humor')) return 'badge-humor';
    if (norm.includes('art')) return 'badge-art';
    return '';
  }

  // Toast Notification
  let toastTimer = null;
  function showToast(message) {
    if (toastTimer) clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('show');
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2400);
  }

  // Copy text to clipboard
  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-999999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      showToast('Copied quote to clipboard!');
      return true;
    } catch (err) {
      console.error('Failed to copy: ', err);
      showToast('Could not copy quote');
      return false;
    }
  }

  // Escape HTML helper
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Highlight search terms
  function highlightMatch(text, query) {
    if (!query) return escapeHtml(text);
    const escapedText = escapeHtml(text);
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return escapedText.replace(regex, '<mark>$1</mark>');
  }

  // Render Hero Quote
  function renderHeroQuote(quote) {
    state.heroQuote = quote;
    heroText.classList.add('fading');

    setTimeout(() => {
      heroText.textContent = `"${quote.quote}"`;
      heroAuthor.textContent = `— ${quote.author}`;
      heroCategory.textContent = quote.category;
      
      // Update badge styling
      heroCategory.className = `category-badge ${getCategoryClass(quote.category)}`;
      heroCategory.onclick = () => selectCategory(quote.category);

      heroText.classList.remove('fading');
    }, 180);
  }

  // Fetch Random Quote
  async function fetchRandomQuote() {
    heroRandomBtn.classList.add('rotating');
    try {
      const res = await fetch('/api/quotes/random');
      if (!res.ok) throw new Error('Failed to fetch random quote');
      const data = await res.json();
      if (data.quote) {
        renderHeroQuote(data.quote);
      }
    } catch (err) {
      console.error(err);
      heroText.textContent = 'Could not load a random quote at this time.';
    } finally {
      setTimeout(() => heroRandomBtn.classList.remove('rotating'), 400);
    }
  }

  // Fetch Filter Options (Categories & Authors)
  async function loadFilterOptions() {
    try {
      const [catRes, authRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/authors')
      ]);

      if (catRes.ok) {
        const catData = await catRes.json();
        state.categories = catData.categories || [];
        populateCategories(state.categories);
      }

      if (authRes.ok) {
        const authData = await authRes.json();
        state.authors = authData.authors || [];
        populateAuthors(state.authors);
      }
    } catch (err) {
      console.error('Error loading filter options:', err);
    }
  }

  // Populate Categories
  function populateCategories(categories) {
    categorySelect.innerHTML = '<option value="">All Categories</option>';
    categoryPillsContainer.innerHTML = '';

    // "All" pill
    const allPill = document.createElement('button');
    allPill.className = 'pill-btn active';
    allPill.textContent = 'All Categories';
    allPill.addEventListener('click', () => selectCategory(''));
    categoryPillsContainer.appendChild(allPill);

    categories.forEach(cat => {
      // Option in select
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      categorySelect.appendChild(opt);

      // Pill button
      const pill = document.createElement('button');
      pill.className = 'pill-btn';
      pill.textContent = cat;
      pill.dataset.category = cat;
      pill.addEventListener('click', () => selectCategory(cat));
      categoryPillsContainer.appendChild(pill);
    });
  }

  // Populate Authors
  function populateAuthors(authors) {
    authorSelect.innerHTML = '<option value="">All Authors</option>';
    authors.forEach(author => {
      const opt = document.createElement('option');
      opt.value = author;
      opt.textContent = author;
      authorSelect.appendChild(opt);
    });
  }

  // Select Category
  function selectCategory(cat) {
    if (state.filters.category === cat) {
      state.filters.category = '';
    } else {
      state.filters.category = cat;
    }
    categorySelect.value = state.filters.category;
    updatePillsHighlight();
    fetchQuotes();
  }

  function updatePillsHighlight() {
    const pills = categoryPillsContainer.querySelectorAll('.pill-btn');
    pills.forEach(pill => {
      if (!state.filters.category && !pill.dataset.category) {
        pill.classList.add('active');
      } else if (pill.dataset.category === state.filters.category) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
  }

  // Fetch Quotes with active filters
  async function fetchQuotes() {
    const params = new URLSearchParams();
    if (state.filters.q) params.set('q', state.filters.q);
    if (state.filters.category) params.set('category', state.filters.category);
    if (state.filters.author) params.set('author', state.filters.author);

    resultsCount.textContent = 'Searching...';

    try {
      const res = await fetch(`/api/quotes?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch quotes');
      const data = await res.json();
      state.quotes = data.quotes || [];
      renderQuotesGrid(state.quotes, state.filters.q);
    } catch (err) {
      console.error(err);
      resultsCount.textContent = 'Error loading quotes';
    }
  }

  // Render Quotes Grid
  function renderQuotesGrid(quotes, query) {
    quotesGrid.innerHTML = '';

    resultsCount.textContent = `Showing ${quotes.length} of 100 quotes`;

    if (quotes.length === 0) {
      emptyState.classList.remove('hidden');
      quotesGrid.style.display = 'none';
      return;
    }

    emptyState.classList.add('hidden');
    quotesGrid.style.display = 'grid';

    quotes.forEach(quote => {
      const card = document.createElement('article');
      card.className = 'quote-card-item';

      const highlightedQuote = highlightMatch(`"${quote.quote}"`, query);
      const highlightedAuthor = highlightMatch(quote.author, query);
      const badgeClass = getCategoryClass(quote.category);

      card.innerHTML = `
        <blockquote class="quote-card-text">${highlightedQuote}</blockquote>
        <div class="quote-card-footer">
          <div class="quote-card-meta">
            <cite class="quote-card-author">— ${highlightedAuthor}</cite>
            <span class="category-badge ${badgeClass}" data-cat="${escapeHtml(quote.category)}">
              ${escapeHtml(quote.category)}
            </span>
          </div>
          <button class="card-copy-btn" title="Copy quote" aria-label="Copy quote">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
        </div>
      `;

      // Copy click
      const copyBtn = card.querySelector('.card-copy-btn');
      copyBtn.addEventListener('click', () => {
        copyToClipboard(`"${quote.quote}" — ${quote.author}`);
      });

      // Category badge click to filter
      const catBadge = card.querySelector('.category-badge');
      catBadge.addEventListener('click', () => {
        selectCategory(quote.category);
      });

      quotesGrid.appendChild(card);
    });
  }

  // Reset all filters
  function resetFilters() {
    state.filters.q = '';
    state.filters.category = '';
    state.filters.author = '';

    searchInput.value = '';
    clearSearchBtn.classList.remove('visible');
    categorySelect.value = '';
    authorSelect.value = '';
    updatePillsHighlight();

    fetchQuotes();
  }

  // Event Listeners
  heroRandomBtn.addEventListener('click', fetchRandomQuote);

  heroCopyBtn.addEventListener('click', async () => {
    if (!state.heroQuote) return;
    const text = `"${state.heroQuote.quote}" — ${state.heroQuote.author}`;
    const success = await copyToClipboard(text);
    if (success) {
      heroCopyText.textContent = 'Copied!';
      setTimeout(() => {
        heroCopyText.textContent = 'Copy';
      }, 2000);
    }
  });

  // Search input with debounce
  searchInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    state.filters.q = val;

    if (val) {
      clearSearchBtn.classList.add('visible');
    } else {
      clearSearchBtn.classList.remove('visible');
    }

    clearTimeout(state.debounceTimer);
    state.debounceTimer = setTimeout(() => {
      fetchQuotes();
    }, 250);
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    state.filters.q = '';
    clearSearchBtn.classList.remove('visible');
    searchInput.focus();
    fetchQuotes();
  });

  categorySelect.addEventListener('change', (e) => {
    state.filters.category = e.target.value;
    updatePillsHighlight();
    fetchQuotes();
  });

  authorSelect.addEventListener('change', (e) => {
    state.filters.author = e.target.value;
    fetchQuotes();
  });

  resetFiltersBtn.addEventListener('click', resetFilters);
  emptyResetBtn.addEventListener('click', resetFilters);

  // Initialize
  fetchRandomQuote();
  loadFilterOptions();
  fetchQuotes();
});
