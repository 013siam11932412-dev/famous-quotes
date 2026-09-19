// Vanilla JavaScript for Famous Quotes Web Application with Dark Soul Mode

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
    debounceTimer: null,
    theme: localStorage.getItem('famous_quotes_theme') || 
           (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'),
    isDarkSoul: localStorage.getItem('famous_quotes_dark_soul') === 'true',
    soundEnabled: localStorage.getItem('famous_quotes_sound') !== 'false',
    audioCtx: null,
    emberAnimId: null
  };

  // DOM Elements
  const headerBadge = document.getElementById('header-badge');
  const themeToggle = document.getElementById('theme-toggle');
  const themeToggleLabel = document.getElementById('theme-toggle-label');
  const appTitle = document.getElementById('app-title');
  const appSubtitle = document.getElementById('app-subtitle');
  const randomHeading = document.getElementById('random-heading');

  const heroCard = document.getElementById('hero-quote-card');
  const heroText = document.getElementById('hero-quote-text');
  const heroAuthor = document.getElementById('hero-author');
  const heroCategory = document.getElementById('hero-category');
  const heroRandomBtn = document.getElementById('hero-random-btn');
  const heroCopyBtn = document.getElementById('hero-copy-btn');
  const heroCopyText = document.getElementById('hero-copy-text');

  const darkSoulToggle = document.getElementById('dark-soul-toggle');
  const darkSoulLabel = document.getElementById('dark-soul-label');
  const soundToggle = document.getElementById('sound-toggle');
  const bonfireBanner = document.getElementById('bonfire-lit-banner');
  const emberCanvas = document.getElementById('dark-soul-canvas');


  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const categorySelect = document.getElementById('category-select');
  const authorSelect = document.getElementById('author-select');
  const categoryPillsContainer = document.getElementById('category-pills');
  const resetFiltersBtn = document.getElementById('reset-filters-btn');

  const resultsCount = document.getElementById('results-count');
  const exportCsvBtn = document.getElementById('export-csv-btn');
  const exportCsvText = document.getElementById('export-csv-text');
  const activeFiltersBar = document.getElementById('active-filters-bar');
  const activeChipsList = document.getElementById('active-chips-list');
  const clearAllChipsBtn = document.getElementById('clear-all-chips-btn');
  const backToTopBtn = document.getElementById('back-to-top-btn');
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

  // Web Audio Synthesizer for Bonfire Lit sound
  function getAudioContext() {
    if (!state.audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        state.audioCtx = new AudioCtxClass();
      }
    }
    if (state.audioCtx && state.audioCtx.state === 'suspended') {
      state.audioCtx.resume();
    }
    return state.audioCtx;
  }

  function playBonfireIgnitionSound() {
    if (!state.soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // 1. Warm Fire Ignition Whoosh (Bandpass noise)
      const bufferSize = Math.floor(ctx.sampleRate * 1.5);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(140, now);
      filter.frequency.exponentialRampToValueAtTime(500, now + 0.35);
      filter.frequency.exponentialRampToValueAtTime(70, now + 1.4);
      filter.Q.setValueAtTime(2.5, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.01, now);
      noiseGain.gain.linearRampToValueAtTime(0.3, now + 0.25);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      whiteNoise.start(now);
      whiteNoise.stop(now + 1.5);

      // 2. Harmonic Church Bell / Bonfire Chime
      const frequencies = [130.81, 261.63, 392.00, 523.25];
      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = idx === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const initGain = 0.22 / (idx + 1);
        oscGain.gain.setValueAtTime(0.01, now);
        oscGain.gain.linearRampToValueAtTime(initGain, now + 0.08);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);

        osc.connect(oscGain);
        oscGain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 2.5);
      });
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  // Floating Embers Canvas Animation
  let emberParticles = [];
  function initEmbersCanvas() {
    if (!emberCanvas) return;
    const ctx = emberCanvas.getContext('2d');
    if (!ctx) return;

    function resize() {
      emberCanvas.width = window.innerWidth;
      emberCanvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const count = Math.min(50, Math.floor(window.innerWidth / 25));
    emberParticles = [];
    for (let i = 0; i < count; i++) {
      emberParticles.push({
        x: Math.random() * emberCanvas.width,
        y: Math.random() * emberCanvas.height,
        size: Math.random() * 2.6 + 0.8,
        speedY: Math.random() * 1.1 + 0.35,
        speedX: (Math.random() - 0.5) * 0.7,
        swaySpeed: Math.random() * 0.02 + 0.01,
        swayOffset: Math.random() * Math.PI * 2,
        opacity: Math.random() * 0.7 + 0.3,
        hue: Math.random() > 0.35 ? 35 : 15
      });
    }

    function animate() {
      if (!state.isDarkSoul) {
        ctx.clearRect(0, 0, emberCanvas.width, emberCanvas.height);
        return;
      }
      ctx.clearRect(0, 0, emberCanvas.width, emberCanvas.height);

      emberParticles.forEach(p => {
        p.y -= p.speedY;
        p.swayOffset += p.swaySpeed;
        p.x += Math.sin(p.swayOffset) * 0.5 + p.speedX;

        if (p.y < -10) {
          p.y = emberCanvas.height + 10;
          p.x = Math.random() * emberCanvas.width;
          p.opacity = Math.random() * 0.7 + 0.3;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${p.opacity})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `hsl(${p.hue}, 100%, 50%)`;
        ctx.fill();
        ctx.restore();
      });

      state.emberAnimId = requestAnimationFrame(animate);
    }

    if (state.isDarkSoul && !state.emberAnimId) {
      state.emberAnimId = requestAnimationFrame(animate);
    }
  }

  function startEmbers() {
    if (!state.emberAnimId) {
      initEmbersCanvas();
    }
  }

  // Bonfire Lit Dramatic Banner
  function showBonfireLitBanner() {
    if (!bonfireBanner) return;
    bonfireBanner.classList.add('active');
    bonfireBanner.setAttribute('aria-hidden', 'false');

    playBonfireIgnitionSound();

    setTimeout(() => {
      bonfireBanner.classList.remove('active');
      bonfireBanner.setAttribute('aria-hidden', 'true');
    }, 2800);
  }

  // Light / Dark Theme Management
  function applyTheme(theme, save = true) {
    state.theme = theme;
    if (save) {
      localStorage.setItem('famous_quotes_theme', theme);
    }

    if (theme === 'light') {
      document.body.classList.add('light-mode');
      if (themeToggle) {
        themeToggle.setAttribute('aria-checked', 'true');
        themeToggle.title = 'Switch to Dark mode';
      }
      if (themeToggleLabel) {
        themeToggleLabel.textContent = 'Light';
      }
      // If Bonfire mode was active, extinguish it
      if (state.isDarkSoul) {
        applyDarkSoulTheme(false, false);
      }
    } else {
      document.body.classList.remove('light-mode');
      if (themeToggle) {
        themeToggle.setAttribute('aria-checked', 'false');
        themeToggle.title = 'Switch to Light mode';
      }
      if (themeToggleLabel) {
        themeToggleLabel.textContent = 'Dark';
      }
    }
  }

  function toggleTheme() {
    const nextTheme = state.theme === 'light' ? 'dark' : 'light';
    applyTheme(nextTheme, true);
    showToast(`Switched to ${nextTheme === 'light' ? 'Light' : 'Dark'} mode`);
  }

  // Apply Dark Soul Theme
  function applyDarkSoulTheme(active, triggerBanner = false) {
    state.isDarkSoul = active;
    localStorage.setItem('famous_quotes_dark_soul', active ? 'true' : 'false');

    if (active) {
      document.body.classList.remove('light-mode');
      document.body.classList.add('dark-soul-mode');
      darkSoulToggle.setAttribute('aria-pressed', 'true');
      darkSoulLabel.textContent = 'Extinguish Bonfire';
      headerBadge.textContent = '🔥 Bonfire Ignited';
      appTitle.textContent = 'Words of the Ashen One';
      appSubtitle.textContent = 'Kindle the flame. Discover, reflect, and uncover the words of lords, knights, and sages.';
      randomHeading.textContent = "🔥 Flame's Remembrance";
      heroRandomBtn.querySelector('span').textContent = 'Rest at Bonfire';
      resetFiltersBtn.textContent = 'Restore Humanity';
      if (exportCsvText) exportCsvText.textContent = 'Export Tomes (CSV)';
      soundToggle.classList.remove('hidden');

      startEmbers();
      if (triggerBanner) {
        showBonfireLitBanner();
      }
    } else {
      document.body.classList.remove('dark-soul-mode');
      if (state.theme === 'light') {
        document.body.classList.add('light-mode');
      }
      darkSoulToggle.setAttribute('aria-pressed', 'false');
      darkSoulLabel.textContent = 'Kindle Bonfire';
      headerBadge.textContent = '✨ 100 Famous Quotes';
      appTitle.textContent = 'Words of Wisdom';
      appSubtitle.textContent = "Discover, reflect, and search quotes from history's most renowned thinkers, leaders, and creators.";
      randomHeading.textContent = 'Quote of the Moment';
      heroRandomBtn.querySelector('span').textContent = 'Random Quote';
      resetFiltersBtn.textContent = 'Reset Filters';
      if (exportCsvText) exportCsvText.textContent = 'Export to CSV';
      soundToggle.classList.add('hidden');

      if (emberCanvas) {
        const ctx = emberCanvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, emberCanvas.width, emberCanvas.height);
      }
      if (state.emberAnimId) {
        cancelAnimationFrame(state.emberAnimId);
        state.emberAnimId = null;
      }
    }
  }

  function toggleDarkSoulMode() {
    const nextState = !state.isDarkSoul;
    applyDarkSoulTheme(nextState, true);
    if (!nextState) {
      showToast('Bonfire extinguished. Returned to the mortal realm.');
    }
  }

  // Update Sound Toggle Button
  function updateSoundToggle() {
    if (!soundToggle) return;
    if (state.soundEnabled) {
      soundToggle.classList.remove('muted');
      soundToggle.innerHTML = '🔊';
      soundToggle.title = 'Mute Bonfire Ambience';
    } else {
      soundToggle.classList.add('muted');
      soundToggle.innerHTML = '🔇';
      soundToggle.title = 'Unmute Bonfire Ambience';
    }
  }

  // Render Hero Quote
  function renderHeroQuote(quote) {
    state.heroQuote = quote;
    heroText.classList.add('fading');

    setTimeout(() => {
      heroText.textContent = `"${quote.quote}"`;
      heroAuthor.textContent = `— ${quote.author}`;
      heroCategory.textContent = quote.category;
      
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
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      categorySelect.appendChild(opt);

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
      renderActiveFilterChips();
    } catch (err) {
      console.error(err);
      resultsCount.textContent = 'Error loading quotes';
    }
  }

  // Render Quotes Grid
  function renderQuotesGrid(quotes, query) {
    quotesGrid.innerHTML = '';

    const totalCount = 100;
    resultsCount.textContent = `Showing ${quotes.length} of ${totalCount} quotes`;

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
          <button class="card-copy-btn" title="Copy quote to clipboard" aria-label="Copy quote to clipboard">
            <svg class="copy-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span class="card-copy-text">Copy</span>
          </button>
        </div>
      `;

      const copyBtn = card.querySelector('.card-copy-btn');
      copyBtn.addEventListener('click', async () => {
        const text = `"${quote.quote}" — ${quote.author}`;
        const success = await copyToClipboard(text);
        if (success) {
          copyBtn.classList.add('copied');
          copyBtn.innerHTML = `
            <svg class="check-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span class="card-copy-text">Copied!</span>
          `;
          setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyBtn.innerHTML = `
              <svg class="copy-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span class="card-copy-text">Copy</span>
            `;
          }, 1800);
        }
      });

      const catBadge = card.querySelector('.category-badge');
      catBadge.addEventListener('click', () => {
        selectCategory(quote.category);
      });

      quotesGrid.appendChild(card);
    });
  }

  // Export currently visible quotes to CSV
  function exportVisibleQuotesToCSV() {
    if (!state.quotes || state.quotes.length === 0) {
      showToast('No visible quotes to export');
      return;
    }

    const headers = ['ID', 'Quote', 'Author', 'Category'];
    const rows = state.quotes.map(q => {
      const id = q.id ?? '';
      const quoteText = `"${(q.quote || '').replace(/"/g, '""')}"`;
      const authorText = `"${(q.author || '').replace(/"/g, '""')}"`;
      const categoryText = `"${(q.category || '').replace(/"/g, '""')}"`;
      return [id, quoteText, authorText, categoryText].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    let filename = 'famous_quotes';
    if (state.filters.category) {
      filename += `_${state.filters.category.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    }
    if (state.filters.author) {
      filename += `_${state.filters.author.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    }
    filename += `_${state.quotes.length}_quotes.csv`;

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (exportCsvBtn && exportCsvText) {
      const origText = exportCsvText.textContent;
      exportCsvBtn.classList.add('exported');
      exportCsvText.textContent = 'Exported!';
      setTimeout(() => {
        exportCsvBtn.classList.remove('exported');
        exportCsvText.textContent = origText;
      }, 1800);
    }

    showToast(`Exported ${state.quotes.length} quotes to CSV!`);
  }

  // Render Active Filter Chips
  function renderActiveFilterChips() {
    if (!activeFiltersBar || !activeChipsList) return;

    activeChipsList.innerHTML = '';
    const activeFilters = [];

    if (state.filters.q) {
      activeFilters.push({
        type: 'q',
        label: 'Search',
        value: `"${state.filters.q}"`,
        onRemove: () => {
          state.filters.q = '';
          searchInput.value = '';
          clearSearchBtn.classList.remove('visible');
          fetchQuotes();
        }
      });
    }

    if (state.filters.category) {
      activeFilters.push({
        type: 'category',
        label: 'Category',
        value: state.filters.category,
        onRemove: () => {
          state.filters.category = '';
          categorySelect.value = '';
          updatePillsHighlight();
          fetchQuotes();
        }
      });
    }

    if (state.filters.author) {
      activeFilters.push({
        type: 'author',
        label: 'Author',
        value: state.filters.author,
        onRemove: () => {
          state.filters.author = '';
          authorSelect.value = '';
          fetchQuotes();
        }
      });
    }

    if (activeFilters.length === 0) {
      activeFiltersBar.classList.add('hidden');
      return;
    }

    activeFiltersBar.classList.remove('hidden');

    activeFilters.forEach(f => {
      const chip = document.createElement('span');
      chip.className = 'filter-chip';
      chip.innerHTML = `
        <span class="chip-label">${escapeHtml(f.label)}:</span>
        <strong class="chip-value">${escapeHtml(f.value)}</strong>
        <button class="chip-remove-btn" title="Remove ${escapeHtml(f.label)} filter" aria-label="Remove ${escapeHtml(f.label)} filter">×</button>
      `;

      const removeBtn = chip.querySelector('.chip-remove-btn');
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        f.onRemove();
      });

      activeChipsList.appendChild(chip);
    });

    if (clearAllChipsBtn) {
      clearAllChipsBtn.style.display = activeFilters.length >= 2 ? 'inline-block' : 'none';
    }
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
    renderActiveFilterChips();

    fetchQuotes();
  }

  // Event Listeners
  darkSoulToggle.addEventListener('click', toggleDarkSoulMode);

  soundToggle.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    localStorage.setItem('famous_quotes_sound', state.soundEnabled ? 'true' : 'false');
    updateSoundToggle();
    if (state.soundEnabled) {
      playBonfireIgnitionSound();
      showToast('Bonfire audio resonance enabled');
    } else {
      showToast('Bonfire audio muted');
    }
  });


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
  if (clearAllChipsBtn) {
    clearAllChipsBtn.addEventListener('click', resetFilters);
  }
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', exportVisibleQuotesToCSV);
  }

  // Back to Top Button
  function handleWindowScroll() {
    if (!backToTopBtn) return;
    if (window.scrollY > 350) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  }

  window.addEventListener('scroll', handleWindowScroll, { passive: true });

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
      // Only auto-switch if user hasn't explicitly chosen a preference in localStorage
      if (!localStorage.getItem('famous_quotes_theme')) {
        applyTheme(e.matches ? 'light' : 'dark', false);
      }
    });
  }

  // Initialize
  applyTheme(state.theme, false);
  updateSoundToggle();
  if (state.isDarkSoul) {
    applyDarkSoulTheme(true, false);
  }
  fetchRandomQuote();
  loadFilterOptions();
  fetchQuotes();
});
