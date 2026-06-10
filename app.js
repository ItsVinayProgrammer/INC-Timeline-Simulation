(function (global) {
  const Data = global.CongressData || null;
  const MapData = global.CongressMapData || null;
  const Timeline = global.CongressTimeline || null;
  const MapModule = global.CongressMap || null;
  const Quiz = global.CongressQuiz || null;

  const STATE_KEY = 'incTimeline.state';
  const THEME_KEY = 'incTimeline.theme';
  const VALID_PHASE_FILTERS = new Set(['all', 'moderate', 'assertive', 'gandhi', 'cdo', 'independence']);
  const VALID_QUIZ_CATEGORIES = new Set(['presidents', 'cities', 'years', 'phases', 'events']);

  function getEl(id) {
    return document.getElementById(id);
  }

  function clampYear(year) {
    return Data?.clampYear ? Data.clampYear(year) : Math.min(Data?.YEAR_MAX || 1947, Math.max(Data?.YEAR_MIN || 1885, Number(year) || Data?.YEAR_MIN || 1885));
  }

  function safeGetStorage(key) {
    try {
      return global.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function safeSetStorage(key, value) {
    try {
      global.localStorage.setItem(key, value);
    } catch (error) {
      return false;
    }
    return true;
  }

  function safeRemoveStorage(key) {
    try {
      global.localStorage.removeItem(key);
    } catch (error) {
      return false;
    }
    return true;
  }

  function createFreshQuizState() {
    return {
      category: 'presidents',
      score: 0,
      correct: 0,
      attempted: 0,
      streak: 0,
      bestStreak: 0,
      open: false,
      currentQuestion: null,
      answered: false,
      feedback: '',
      feedbackKind: '',
      lastChoice: null,
    };
  }

  function createFreshState(theme) {
    return {
      year: Data?.YEAR_MIN || 1885,
      searchQuery: '',
      phaseFilter: 'all',
      importantOnly: false,
      compareYearA: Data?.YEAR_MIN || 1885,
      compareYearB: Data?.YEAR_MAX || 1947,
      bookmarks: [],
      notes: {},
      quiz: createFreshQuizState(),
      playing: false,
      uiMessage: '',
      theme: theme || 'light',
      drawerOpen: false,
    };
  }

  function normalizeBookmarks(values) {
    if (!Array.isArray(values)) return [];
    const bookmarks = [];
    const seen = new Set();
    for (const value of values) {
      const year = clampYear(value);
      if (seen.has(year)) continue;
      seen.add(year);
      bookmarks.push(year);
    }
    return bookmarks.sort((a, b) => a - b);
  }

  function normalizeNotes(values) {
    if (!values || typeof values !== 'object') return {};
    const notes = {};
    for (const [yearKey, noteValue] of Object.entries(values)) {
      const text = String(noteValue || '');
      if (!text.trim()) continue;
      notes[String(clampYear(yearKey))] = text;
    }
    return notes;
  }

  function snapSessionYear(year) {
    const session = Data?.getNearestSession ? Data.getNearestSession(year) : null;
    return session ? session.y : clampYear(year);
  }

  function normalizeQuizState(rawQuiz) {
    const fresh = createFreshQuizState();
    if (!rawQuiz || typeof rawQuiz !== 'object') return fresh;
    const category = VALID_QUIZ_CATEGORIES.has(rawQuiz.category) ? rawQuiz.category : fresh.category;
    return {
      ...fresh,
      category,
      score: Number(rawQuiz.score || 0),
      correct: Number(rawQuiz.correct || 0),
      attempted: Number(rawQuiz.attempted || 0),
      streak: Number(rawQuiz.streak || 0),
      bestStreak: Number(rawQuiz.bestStreak || 0),
      open: Boolean(rawQuiz.open),
    };
  }

  function loadTheme() {
    const storedTheme = safeGetStorage(THEME_KEY);
    if (storedTheme === 'dark' || storedTheme === 'light') {
      return storedTheme;
    }
    if (global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  function loadState(theme) {
    const fresh = createFreshState(theme);
    const stored = safeGetStorage(STATE_KEY);
    if (!stored) return fresh;
    try {
      const parsed = JSON.parse(stored);
      if (!parsed || typeof parsed !== 'object') return fresh;
      return {
        ...fresh,
        year: clampYear(parsed.year ?? fresh.year),
        searchQuery: typeof parsed.searchQuery === 'string' ? parsed.searchQuery : fresh.searchQuery,
        phaseFilter: VALID_PHASE_FILTERS.has(parsed.phaseFilter) ? parsed.phaseFilter : fresh.phaseFilter,
        importantOnly: Boolean(parsed.importantOnly),
        compareYearA: snapSessionYear(parsed.compareYearA ?? fresh.compareYearA),
        compareYearB: snapSessionYear(parsed.compareYearB ?? fresh.compareYearB),
        bookmarks: normalizeBookmarks(parsed.bookmarks),
        notes: normalizeNotes(parsed.notes),
        quiz: normalizeQuizState(parsed.quiz),
        playing: false,
        uiMessage: '',
        theme,
        drawerOpen: Boolean(parsed.drawerOpen),
      };
    } catch (error) {
      return fresh;
    }
  }

  function buildSnapshot(state) {
    return {
      year: clampYear(state.year),
      searchQuery: String(state.searchQuery || ''),
      phaseFilter: VALID_PHASE_FILTERS.has(state.phaseFilter) ? state.phaseFilter : 'all',
      importantOnly: Boolean(state.importantOnly),
      compareYearA: snapSessionYear(state.compareYearA || Data?.YEAR_MIN || 1885),
      compareYearB: snapSessionYear(state.compareYearB || Data?.YEAR_MAX || 1947),
      bookmarks: normalizeBookmarks(state.bookmarks),
      notes: normalizeNotes(state.notes),
      quiz: {
        category: VALID_QUIZ_CATEGORIES.has(state.quiz?.category) ? state.quiz.category : 'presidents',
        score: Number(state.quiz?.score || 0),
        correct: Number(state.quiz?.correct || 0),
        attempted: Number(state.quiz?.attempted || 0),
        streak: Number(state.quiz?.streak || 0),
        bestStreak: Number(state.quiz?.bestStreak || 0),
        open: Boolean(state.quiz?.open),
      },
      drawerOpen: Boolean(state.drawerOpen),
    };
  }

  function copyStateInto(target, source) {
    for (const key of Object.keys(target)) {
      delete target[key];
    }
    Object.assign(target, source);
  }

  function readTextFromClipboardFallback(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    let success = false;
    try {
      success = document.execCommand('copy');
    } catch (error) {
      success = false;
    }
    document.body.removeChild(textarea);
    return success;
  }

  function setupApp() {
    const theme = loadTheme();
    const state = loadState(theme);

    const refs = {
      appShell: getEl('app'),
      loadingState: getEl('loading-state'),
      errorBanner: getEl('error-banner'),
      scoreVal: getEl('score-val'),
      scoreLbl: getEl('score-lbl'),
      shareBtn: getEl('share-btn'),
      themeBtn: getEl('theme-btn'),
      resetBtn: getEl('reset-btn'),
      yearNum: getEl('yr-num'),
      eraLabel: getEl('era-lbl'),
      eventText: getEl('evt-txt'),
      searchInput: getEl('search-input'),
      searchClear: getEl('search-clear'),
      phaseFilter: getEl('phase-filter'),
      importantToggle: getEl('important-toggle'),
      quizCategory: getEl('quiz-category'),
      sliderInput: getEl('yr-sl'),
      sliderFill: getEl('track-fill'),
      sliderGlow: getEl('track-glow'),
      sliderThumb: getEl('thumb'),
      sliderThumbLabel: getEl('thumb-lbl'),
      sliderShell: getEl('sl-outer'),
      eraTicks: getEl('era-ticks'),
      eraBands: getEl('era-bands'),
      milestoneMarkers: getEl('milestone-markers'),
      prevBtn: getEl('prev-btn'),
      playBtn: getEl('play-btn'),
      nextBtn: getEl('next-btn'),
      playbackYear: getEl('playback-year'),
      eraBadge: getEl('era-badge'),
      eraDot: getEl('era-dot'),
      eraBadgeText: getEl('era-badge-txt'),
      jumpRow: getEl('jumps'),
      fcCount: getEl('fc-cnt'),
      sessionCardSlot: getEl('session-card-slot'),
      searchCount: getEl('search-count'),
      searchResults: getEl('search-results'),
      compareYearA: getEl('compare-year-a'),
      compareYearB: getEl('compare-year-b'),
      compareSwap: getEl('compare-swap'),
      compareResult: getEl('compare-result'),
      notesMeta: getEl('notes-meta'),
      notesInput: getEl('notes-input'),
      bookmarkCount: getEl('bookmark-count'),
      bookmarkCurrentBtn: getEl('bookmark-current-btn'),
      bookmarkList: getEl('bookmark-list'),
      dashboardGrid: getEl('dashboard-grid'),
      sourcesList: getEl('sources-list'),
      mapStatus: getEl('map-status'),
      mapSvg: getEl('the-map'),
      mapWrap: getEl('map-wrap'),
      tooltip: getEl('tt'),
      tooltipName: getEl('tt-name'),
      tooltipInfo: getEl('tt-info'),
      tooltipCap: getEl('tt-cap'),
      tooltipCount: getEl('tt-cnt'),
      zoomIn: getEl('zoom-in'),
      zoomOut: getEl('zoom-out'),
      zoomReset: getEl('zoom-reset'),
      legend: getEl('legend'),

      quizBtn: getEl('quiz-btn'),
      mapQuizBtn: getEl('map-quiz-btn'),
      bookmarksBtn: getEl('bookmarks-btn'),
      bookmarksPanel: getEl('bookmarks-panel'),
      quizWrap: getEl('quiz-wrap'),
      openQuiz: getEl('open-quiz'),
      quizClose: getEl('quiz-close'),
      quizZone: getEl('quiz-zone'),
      quizStreak: getEl('quiz-streak'),
      quizMeta: getEl('quiz-meta'),
      quizState: getEl('quiz-state'),
      qtext: getEl('qtext'),
      qopts: getEl('qopts'),
      qfb: getEl('qfb'),
      qnext: getEl('qnext'),
      statusBar: getEl('status-bar'),
      drawerToggle: getEl('drawer-toggle'),
      fcPanel: getEl('fc-panel'),
      drawerBackdrop: getEl('drawer-backdrop'),
      fcClose: getEl('fc-close'),
    };

    let timelineController = null;
    let mapController = null;
    let quizController = null;
    let renderQueued = false;
    let noticeTimer = null;
    let playbackTimer = null;

    function updateDocumentTheme() {
      document.documentElement.dataset.theme = state.theme;
    }

    function stopPlayback() {
      if (playbackTimer) {
        global.clearInterval(playbackTimer);
        playbackTimer = null;
      }
      state.playing = false;
    }

    function getFilteredSessionYears() {
      const query = String(state.searchQuery || '').trim().toLowerCase();
      const phase = state.phaseFilter || 'all';
      const important = Boolean(state.importantOnly);
      
      const matches = (session) => {
        if (phase !== 'all' && session.phase !== phase) return false;
        if (important && !Data.IMPORTANT_YEARS?.has(session.y)) return false;
        if (!query) return true;
        
        const evText = Array.isArray(session.ev) ? session.ev.join(' ') : '';
        const phaseLabel = Data.PHASES?.[session.phase]?.label || session.phase || '';
        const searchText = [
          session.y,
          session.city,
          session.president,
          phaseLabel,
          evText,
          session.desc
        ].join(' ').toLowerCase();
        
        return searchText.includes(query);
      };

      const filtered = (Data.INC || []).filter(matches).map(s => s.y);
      return filtered.length ? filtered.sort((a,b) => a - b) : Data.SESSION_YEARS || [];
    }

    function nextSessionYear(year) {
      const sessions = getFilteredSessionYears();
      const currentYear = clampYear(year);
      for (const sessionYear of sessions) {
        if (sessionYear > currentYear) return sessionYear;
      }
      return sessions[0] || currentYear;
    }

    function previousSessionYear(year) {
      const sessions = getFilteredSessionYears();
      const currentYear = clampYear(year);
      let previous = sessions[sessions.length - 1] || currentYear;
      for (const sessionYear of sessions) {
        if (sessionYear >= currentYear) break;
        previous = sessionYear;
      }
      return previous;
    }

    function announce(message, duration = 2500) {
      state.uiMessage = String(message || '');
      if (noticeTimer) {
        global.clearTimeout(noticeTimer);
      }
      if (duration > 0) {
        noticeTimer = global.setTimeout(() => {
          if (state.uiMessage === message) {
            state.uiMessage = '';
            requestRender();
          }
        }, duration);
      }
      requestRender();
    }

    function persistTheme() {
      safeSetStorage(THEME_KEY, state.theme);
    }

    function persist() {
      safeSetStorage(STATE_KEY, JSON.stringify(buildSnapshot(state)));
      persistTheme();
    }

    function requestRender() {
      if (renderQueued) return;
      renderQueued = true;
      global.requestAnimationFrame(() => {
        renderQueued = false;
        renderAll();
      });
    }

    function renderAll() {
      if (!timelineController || !mapController || !quizController) return;
      try {
        timelineController.render(state.year);
        mapController.render(state.year);
        quizController.render();
        refs.errorBanner.hidden = true;
      } catch (error) {
        const message = error?.message || 'The app could not finish rendering.';
        refs.errorBanner.textContent = message;
        refs.errorBanner.hidden = false;
        refs.statusBar.textContent = message;
        console.error(error);
      } finally {
        refs.appShell.classList.add('is-ready');
        refs.loadingState.setAttribute('hidden', 'true');
      }
    }

    function setYear(year) {
      state.year = clampYear(year);
      persist();
      requestRender();
    }

    function setTheme(theme) {
      state.theme = theme === 'dark' ? 'dark' : 'light';
      updateDocumentTheme();
      persistTheme();
      requestRender();
    }

    function toggleTheme() {
      setTheme(state.theme === 'dark' ? 'light' : 'dark');
    }

    function toggleDrawer(forceValue) {
      state.drawerOpen = typeof forceValue === 'boolean' ? forceValue : !state.drawerOpen;
      persist();
      requestRender();
    }

    function toggleBookmark(year) {
      const bookmarkYear = clampYear(year);
      const index = state.bookmarks.indexOf(bookmarkYear);
      if (index >= 0) {
        state.bookmarks.splice(index, 1);
        announce(`Removed ${bookmarkYear} from bookmarks.`);
      } else {
        state.bookmarks.push(bookmarkYear);
        state.bookmarks = [...new Set(state.bookmarks)].sort((a, b) => a - b);
        announce(`Bookmarked ${bookmarkYear}.`);
      }
      persist();
      requestRender();
    }

    function setQuizCategory(category) {
      const nextCategory = Quiz?.CATEGORY_LABELS?.[category] ? category : 'presidents';
      state.quiz.category = nextCategory;
      state.quiz.currentQuestion = null;
      state.quiz.answered = false;
      state.quiz.feedback = '';
      state.quiz.feedbackKind = '';
      persist();
      requestRender();
    }

    function togglePlaying(forceValue) {
      const shouldPlay = typeof forceValue === 'boolean' ? forceValue : !state.playing;
      if (!shouldPlay) {
        stopPlayback();
        persist();
        requestRender();
        return;
      }

      state.playing = true;
      if (playbackTimer) {
        global.clearInterval(playbackTimer);
      }
      playbackTimer = global.setInterval(() => {
        setYear(nextSessionYear(state.year));
      }, 1800);
      persist();
      requestRender();
    }

    async function shareSession(year) {
      const currentYear = clampYear(year);
      const session = Data.getSession?.(currentYear) || Data.getNearestSession?.(currentYear) || null;
      const shareText = session
        ? Data.buildShareText?.(session) || `${session.y} - ${session.city}`
        : `No session found for ${currentYear}.`;
      const payload = {
        title: 'Indian National Congress timeline',
        text: Data.getSession?.(currentYear) ? shareText : `Selected year ${currentYear}\n${shareText}`,
        url: global.location.href,
      };

      try {
        if (navigator.share) {
          await navigator.share(payload);
          announce('Share sheet opened.');
          return;
        }
      } catch (error) {
        // Fall back to copy or prompt.
      }

      const copied = (navigator.clipboard && global.isSecureContext)
        ? navigator.clipboard.writeText(payload.text).then(() => true).catch(() => false)
        : Promise.resolve(readTextFromClipboardFallback(`${payload.text}\n${payload.url}`));

      const success = await copied;
      if (success) {
        announce('Summary copied to clipboard.');
        return;
      }

      global.prompt('Copy this summary', `${payload.text}\n${payload.url}`);
      announce('Summary ready to copy.');
    }

    function resetProgress() {
      const confirmed = global.confirm('Reset saved progress? This clears bookmarks, notes, filters, and quiz stats while keeping the theme choice.');
      if (!confirmed) return;
      stopPlayback();
      safeRemoveStorage(STATE_KEY);

      const currentTheme = state.theme;
      copyStateInto(state, createFreshState(currentTheme));
      state.theme = currentTheme;
      updateDocumentTheme();
      persistTheme();
      announce('Progress cleared.');
      requestRender();
    }

    function showError(message) {
      refs.errorBanner.textContent = message;
      refs.errorBanner.hidden = false;
      refs.statusBar.textContent = message;
      refs.loadingState.setAttribute('hidden', 'true');
      refs.appShell.classList.add('is-ready');
    }

    function initializeControllers() {
      timelineController = Timeline?.createTimelineController({ state, elements: refs, actions: actionApi }) || null;
      mapController = MapModule?.createMapController({ state, elements: refs, actions: actionApi, mapData: MapData }) || null;
      quizController = Quiz?.createQuizController({ state, elements: refs, actions: actionApi }) || null;
    }

    const actionApi = {
      setYear,
      toggleTheme,
      setTheme,
      toggleDrawer,
      toggleBookmark,
      shareSession,
      resetProgress,
      togglePlaying,
      setQuizCategory,
      persist,
      requestRender,
      announce,
      openQuiz() {
        state.drawerOpen = true;
        if (quizController?.openQuiz) {
          quizController.openQuiz();
        }
        persist();
        requestRender();
      },
      openBookmarks() {
        state.drawerOpen = true;
        const bookmarksPanel = getEl('bookmarks-panel');
        if (bookmarksPanel) {
          bookmarksPanel.open = true;
          bookmarksPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        const otherIds = ['search-panel', 'compare-panel', 'notes-panel', 'dashboard-panel', 'sources-panel'];
        for (const id of otherIds) {
          const el = getEl(id);
          if (el) el.open = false;
        }
        persist();
        requestRender();
      },
      stepYear(direction) {
        if (direction > 0) {
          setYear(nextSessionYear(state.year));
        } else {
          setYear(previousSessionYear(state.year));
        }
      },
    };

    function validateDependencies() {
      if (!Data || !Timeline || !MapModule || !Quiz || !MapData) {
        showError('One or more app modules failed to load. Reload the page and check the console for details.');
        return false;
      }
      return true;
    }

    function syncDerivedState() {
      state.year = clampYear(state.year);
      state.compareYearA = snapSessionYear(state.compareYearA || Data.YEAR_MIN || 1885);
      state.compareYearB = snapSessionYear(state.compareYearB || Data.YEAR_MAX || 1947);
      state.searchQuery = String(state.searchQuery || '');
      state.phaseFilter = VALID_PHASE_FILTERS.has(state.phaseFilter) ? state.phaseFilter : 'all';
      state.importantOnly = Boolean(state.importantOnly);
      state.bookmarks = normalizeBookmarks(state.bookmarks);
      state.notes = normalizeNotes(state.notes);
      state.quiz = normalizeQuizState(state.quiz);
      state.quiz.category = VALID_QUIZ_CATEGORIES.has(state.quiz.category) ? state.quiz.category : 'presidents';
      state.quiz.open = Boolean(state.quiz.open);
      state.drawerOpen = false;
      state.playing = false;
      state.uiMessage = '';
      updateDocumentTheme();
    }

    function boot() {
      if (!validateDependencies()) {
        return;
      }

      syncDerivedState();
      initializeControllers();

      refs.quizCategory.value = state.quiz.category;
      refs.phaseFilter.value = state.phaseFilter;
      refs.searchInput.value = state.searchQuery;
      refs.importantToggle.checked = Boolean(state.importantOnly);
      refs.compareYearA.value = String(state.compareYearA);
      refs.compareYearB.value = String(state.compareYearB);
      refs.sliderInput.value = String(state.year);

      persistTheme();
      persist();
      renderAll();
      global.addEventListener('resize', () => {
        if (mapController?.resize) mapController.resize();
      });
      global.addEventListener('beforeunload', () => {
        persist();
      });
    }

    return { boot, actionApi };
  }

  function start() {
    const app = setupApp();
    if (!app) return;
    app.boot();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})(window);
