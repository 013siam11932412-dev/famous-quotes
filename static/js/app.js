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
    source: 'all', // 'all' (100 quotes) or 'darksoul' (Dark Souls lore)
    isDarkSoul: localStorage.getItem('famous_quotes_dark_soul') === 'true',
    soundEnabled: localStorage.getItem('famous_quotes_sound') !== 'false',
    audioCtx: null,
    emberAnimId: null
  };

  // DOM Elements
  const headerBadge = document.getElementById('header-badge');
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

  const tabAll = document.getElementById('tab-all');
  const tabDarkSoul = document.getElementById('tab-darksoul');

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

  // Apply Dark Soul Theme
  function applyDarkSoulTheme(active, triggerBanner = false) {
    state.isDarkSoul = active;
    localStorage.setItem('famous_quotes_dark_soul', active ? 'true' : 'false');

    if (active) {
      document.body.classList.add('dark-soul-mode');
      darkSoulToggle.setAttribute('aria-pressed', 'true');
      darkSoulLabel.textContent = 'Extinguish Bonfire';
      headerBadge.textContent = '🔥 Bonfire Ignited';
      appTitle.textContent = 'Words of the Ashen One';
      appSubtitle.textContent = 'Kindle the flame. Discover, reflect, and uncover the words of lords, knights, and sages.';
      randomHeading.textContent = "🔥 Flame's Remembrance";
      heroRandomBtn.querySelector('span').textContent = 'Rest at Bonfire';
      resetFiltersBtn.textContent = 'Restore Humanity';
      soundToggle.classList.remove('hidden');

      startEmbers();
      if (triggerBanner) {
        showBonfireLitBanner();
      }
    } else {
      document.body.classList.remove('dark-soul-mode');
      darkSoulToggle.setAttribute('aria-pressed', 'false');
      darkSoulLabel.textContent = 'Kindle Bonfire';
      headerBadge.textContent = '✨ 100 Famous Quotes';
      appTitle.textContent = 'Words of Wisdom';
      appSubtitle.textContent = "Discover, reflect, and search quotes from history's most renowned thinkers, leaders, and creators.";
      randomHeading.textContent = 'Quote of the Moment';
      heroRandomBtn.querySelector('span').textContent = 'Random Quote';
      resetFiltersBtn.textContent = 'Reset Filters';
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

  // Switch Collection (All 100 vs Lordran Lore)
  function switchCollection(source) {
    if (state.source === source) return;
    state.source = source;

    if (source === 'darksoul') {
      tabDarkSoul.classList.add('active');
      tabDarkSoul.setAttribute('aria-selected', 'true');
      tabAll.classList.remove('active');
      tabAll.setAttribute('aria-selected', 'false');
      if (!state.isDarkSoul) {
        applyDarkSoulTheme(true, true);
      }
    } else {
      tabAll.classList.add('active');
      tabAll.setAttribute('aria-selected', 'true');
      tabDarkSoul.classList.remove('active');
      tabDarkSoul.setAttribute('aria-selected', 'false');
    }

    state.filters.q = '';
    state.filters.category = '';
    state.filters.author = '';
    searchInput.value = '';
    clearSearchBtn.classList.remove('visible');

    loadFilterOptions();
    fetchQuotes();
    fetchRandomQuote();
  }

  // Render Hero Quote
  function renderHeroQuote(quote) {
    state.heroQuote = quote;
    heroText.classList.add('fading');

    setTimeout(() => {
      heroText.textContent = `"${quote.quote}"`;
      const authorText = quote.lore ? `— ${quote.author} (${quote.lore})` : `— ${quote.author}`;
      heroAuthor.textContent = authorText;
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
      const endpoint = state.source === 'darksoul' ? '/api/darksoul/random' : '/api/quotes/random';
      const res = await fetch(endpoint);
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
      if (state.source === 'darksoul') {
        const res = await fetch('/api/darksoul/quotes');
        if (res.ok) {
          const data = await res.json();
          const quotes = data.quotes || [];
          state.categories = Array.from(new Set(quotes.map(q => q.category))).sort();
          state.authors = Array.from(new Set(quotes.map(q => q.author))).sort();
          populateCategories(state.categories);
          populateAuthors(state.authors);
        }
        return;
      }

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
      const endpoint = state.source === 'darksoul' ? '/api/darksoul/quotes' : '/api/quotes';
      const res = await fetch(`${endpoint}?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch quotes');
      const data = await res.json();
      let quotes = data.quotes || [];

      if (state.source === 'darksoul') {
        if (state.filters.category) {
          quotes = quotes.filter(q => q.category.toLowerCase() === state.filters.category.toLowerCase());
        }
        if (state.filters.author) {
          quotes = quotes.filter(q => q.author.toLowerCase().includes(state.filters.author.toLowerCase()));
        }
      }

      state.quotes = quotes;
      renderQuotesGrid(state.quotes, state.filters.q);
    } catch (err) {
      console.error(err);
      resultsCount.textContent = 'Error loading quotes';
    }
  }

  // Render Quotes Grid
  function renderQuotesGrid(quotes, query) {
    quotesGrid.innerHTML = '';

    const totalCount = state.source === 'darksoul' ? 20 : 100;
    const label = state.source === 'darksoul' ? 'Dark Souls quotes' : 'quotes';
    resultsCount.textContent = `Showing ${quotes.length} of ${totalCount} ${label}`;

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
      const loreTag = quote.lore ? `<span class="quote-card-lore" style="color:var(--text-muted);font-size:0.8rem;font-style:normal;margin-left:0.35rem;">(${escapeHtml(quote.lore)})</span>` : '';

      card.innerHTML = `
        <blockquote class="quote-card-text">${highlightedQuote}</blockquote>
        <div class="quote-card-footer">
          <div class="quote-card-meta">
            <cite class="quote-card-author">— ${highlightedAuthor}${loreTag}</cite>
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

      const copyBtn = card.querySelector('.card-copy-btn');
      copyBtn.addEventListener('click', () => {
        copyToClipboard(`"${quote.quote}" — ${quote.author}`);
      });

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

  tabAll.addEventListener('click', () => switchCollection('all'));
  tabDarkSoul.addEventListener('click', () => switchCollection('darksoul'));

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
  updateSoundToggle();
  if (state.isDarkSoul) {
    applyDarkSoulTheme(true, false);
  }
  fetchRandomQuote();
  loadFilterOptions();
  fetchQuotes();
});
