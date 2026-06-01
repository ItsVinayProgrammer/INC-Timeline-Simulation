(function (global) {
  const Data = global.CongressData || {};
  const YEAR_MIN = Data.YEAR_MIN || 1885;
  const YEAR_MAX = Data.YEAR_MAX || 1947;
  const YEAR_RANGE = Data.YEAR_RANGE || (YEAR_MAX - YEAR_MIN);
  const INC = Data.INC || [];
  const PHASES = Data.PHASES || {};
  const JUMPS = Data.JUMPS || [];
  const ERA_MARKS = Data.ERA_MARKS || [];
  const ERA_COLORS = Data.ERA_COLORS || [];
  const IMPORTANT_YEARS = Data.IMPORTANT_YEARS || new Set();
  const SESSION_YEARS = Data.SESSION_YEARS || [];

  function createEl(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text != null) element.textContent = text;
    return element;
  }

  function clearNode(node) {
    if (!node) return;
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function clampYear(year) {
    return Math.min(YEAR_MAX, Math.max(YEAR_MIN, Number(year) || YEAR_MIN));
  }

  function normalizeText(value) {
    return String(value || '').toLowerCase();
  }

  function getPhaseLabel(phaseKey) {
    return PHASES[phaseKey]?.label || phaseKey || 'Unknown';
  }

  function getPhaseColor(phaseKey) {
    return PHASES[phaseKey]?.color || Data.getPhaseColor?.(YEAR_MIN) || '#1a5276';
  }

  function formatSessionLine(session) {
    if (!session) return '';
    return `${session.city} - ${session.president}`;
  }

  function buildSearchText(session) {
    const eventText = Array.isArray(session.ev) ? session.ev.join(' ') : '';
    return normalizeText([
      session.y,
      session.city,
      session.president,
      getPhaseLabel(session.phase),
      eventText,
      session.desc,
    ].join(' '));
  }

  function matchesFilters(session, queryText, phaseFilter, importantOnly) {
    if (phaseFilter !== 'all' && session.phase !== phaseFilter) return false;
    if (importantOnly && !IMPORTANT_YEARS.has(session.y)) return false;
    if (!queryText) return true;
    return buildSearchText(session).includes(queryText);
  }

  function findPreviousSessionYear(year) {
    const numericYear = clampYear(year);
    let previous = SESSION_YEARS[0] || YEAR_MIN;
    for (const sessionYear of SESSION_YEARS) {
      if (sessionYear >= numericYear) break;
      previous = sessionYear;
    }
    return previous;
  }

  function findNextSessionYear(year) {
    const numericYear = clampYear(year);
    for (const sessionYear of SESSION_YEARS) {
      if (sessionYear > numericYear) return sessionYear;
    }
    return SESSION_YEARS[0] || YEAR_MIN;
  }

  function findNearestDisplaySession(year) {
    const exact = Data.getSession?.(year);
    if (exact) return exact;
    return Data.getNearestSession?.(year) || null;
  }

  function buildPhaseBadge(session, year) {
    const badge = createEl('span', 'session-badge');
    const phaseLabel = getPhaseLabel(session?.phase || Data.getPhaseKey?.(year));
    badge.textContent = IMPORTANT_YEARS.has(session?.y || year) ? `${phaseLabel} - key year` : phaseLabel;
    return badge;
  }

  function buildTagList(session, year) {
    const tagList = createEl('div', 'tag-list');
    const tags = [];
    const phaseLabel = getPhaseLabel(session?.phase || Data.getPhaseKey?.(year));
    tags.push(phaseLabel);
    if (IMPORTANT_YEARS.has(session?.y || year)) tags.push('Important');
    if (session?.ev?.length) tags.push(session.ev[0]);
    for (const tagText of tags) {
      const tag = createEl('span', 'tag', tagText);
      tagList.appendChild(tag);
    }
    return tagList;
  }

  function appendBriefFact(parent, label, value) {
    if (!value) return;
    const item = createEl('div', 'brief-fact');
    item.appendChild(createEl('span', 'brief-fact-label', label));
    item.appendChild(createEl('span', 'brief-fact-value', value));
    parent.appendChild(item);
  }

  function buildBriefHighlights(session) {
    const events = Array.isArray(session?.ev) ? session.ev.filter(Boolean).slice(0, 3) : [];
    if (!events.length && session?.desc) events.push(session.desc);
    if (!events.length) return null;

    const block = createEl('div', 'brief-highlights');
    const heading = createEl('h3', '', 'Key points');
    const list = createEl('ul', 'brief-highlight-list');

    for (const eventText of events) {
      list.appendChild(createEl('li', '', eventText));
    }

    block.appendChild(heading);
    block.appendChild(list);
    return block;
  }

  function buildBriefTags(session, year) {
    const tags = createEl('div', 'brief-tags');
    const phaseLabel = getPhaseLabel(session?.phase || Data.getPhaseKey?.(year));
    const tagTexts = [phaseLabel];
    if (IMPORTANT_YEARS.has(session?.y || year)) tagTexts.push('Major milestone');
    if (session?.ev?.[0]) tagTexts.push(session.ev[0]);

    for (const tagText of tagTexts) {
      tags.appendChild(createEl('span', 'brief-tag', tagText));
    }

    return tags;
  }

  function buildSummaryText(session, year) {
    const phaseLabel = getPhaseLabel(session?.phase || Data.getPhaseKey?.(year));
    const note = session
      ? `${session.y} - ${session.city}`
      : `No recorded session in ${year}`;
    return `${note} | ${phaseLabel}`;
  }

  function createTimelineController({ state, elements, actions }) {
    const refs = elements;
    let compareLoaded = false;
    let sourcesLoaded = false;
    let eraLoaded = false;
    let renderTimer = null;

    function requestRender() {
      if (typeof actions.requestRender === 'function') {
        actions.requestRender();
      }
    }

    function persistAndRender() {
      if (typeof actions.persist === 'function') {
        actions.persist();
      }
      requestRender();
    }

    function populateCompareSelects() {
      if (compareLoaded) return;
      compareLoaded = true;
      clearNode(refs.compareYearA);
      clearNode(refs.compareYearB);
      for (const sessionYear of SESSION_YEARS) {
        const optionA = createEl('option');
        optionA.value = String(sessionYear);
        optionA.textContent = `${sessionYear} - ${Data.getSession?.(sessionYear)?.city || ''}`;
        refs.compareYearA.appendChild(optionA);

        const optionB = createEl('option');
        optionB.value = String(sessionYear);
        optionB.textContent = `${sessionYear} - ${Data.getSession?.(sessionYear)?.city || ''}`;
        refs.compareYearB.appendChild(optionB);
      }
      if (!state.compareYearA) state.compareYearA = SESSION_YEARS[0] || YEAR_MIN;
      if (!state.compareYearB) state.compareYearB = SESSION_YEARS[SESSION_YEARS.length - 1] || YEAR_MAX;
      refs.compareYearA.value = String(state.compareYearA);
      refs.compareYearB.value = String(state.compareYearB);
    }

    function renderEraScale() {
      if (eraLoaded) return;
      eraLoaded = true;
      clearNode(refs.eraTicks);
      clearNode(refs.eraBands);

      for (const mark of ERA_MARKS) {
        const tick = createEl('div', 'etick');
        tick.style.left = `${((mark.y - YEAR_MIN) / YEAR_RANGE) * 100}%`;

        const line = createEl('span', 'etick-line');
        const label = createEl('span', 'etick-lbl', mark.l);
        tick.appendChild(line);
        tick.appendChild(label);
        refs.eraTicks.appendChild(tick);
      }

      for (const band of ERA_COLORS) {
        const bandEl = createEl('div', 'era-band');
        bandEl.dataset.phase = Data.getPhaseKey?.(band.s) || '';
        bandEl.style.left = `${((band.s - YEAR_MIN) / YEAR_RANGE) * 100}%`;
        bandEl.style.width = `${((band.e - band.s) / YEAR_RANGE) * 100}%`;
        bandEl.style.background = band.c;
        refs.eraBands.appendChild(bandEl);
      }
    }

    function renderSlider(year) {
      const ratio = (clampYear(year) - YEAR_MIN) / YEAR_RANGE;
      const percent = `${ratio * 100}%`;
      refs.sliderInput.value = String(clampYear(year));
      refs.sliderFill.style.width = percent;
      refs.sliderGlow.style.width = percent;
      refs.sliderThumb.style.left = percent;
      refs.sliderThumbLabel.textContent = String(clampYear(year));
      refs.sliderShell.dataset.phase = Data.getPhaseKey?.(year) || '';

      const activeBand = Data.getPhaseKey?.(year) || '';
      refs.eraBands.querySelectorAll('.era-band').forEach((bandEl) => {
        bandEl.classList.toggle('is-active', bandEl.dataset.phase === activeBand);
      });
    }

    function renderJumpButtons(year) {
      clearNode(refs.jumpRow);
      for (const jump of JUMPS) {
        const button = createEl('button', 'jump-btn', jump.label);
        button.type = 'button';
        button.dataset.year = String(jump.y);
        button.classList.toggle('active', clampYear(year) === jump.y);
        button.addEventListener('click', () => actions.setYear(jump.y));
        refs.jumpRow.appendChild(button);
      }
    }

    function renderSessionCard(year) {
      const exactSession = Data.getSession?.(year);
      const displaySession = findNearestDisplaySession(year);
      const supportingSession = exactSession || displaySession;
      const phaseKey = supportingSession?.phase || Data.getPhaseKey?.(year);
      const phaseLabel = getPhaseLabel(phaseKey);
      const accentColor = getPhaseColor(phaseKey);
      const actionYear = supportingSession?.y || year;
      const isBookmarked = state.bookmarks.includes(actionYear);

      const brief = createEl('article', 'year-brief compact-brief');
      brief.style.setProperty('--brief-accent', accentColor);
      if (!exactSession) brief.classList.add('is-nearest');

      const head = createEl('div', 'brief-head');
      const yearMark = createEl('div', 'brief-year-mark', String(supportingSession?.y || year));
      const eyebrow = createEl('div', 'brief-eyebrow');
      const dot = createEl('span', 'brief-dot');
      dot.style.background = accentColor;
      eyebrow.appendChild(dot);
      eyebrow.appendChild(createEl('span', '', phaseLabel));
      if (IMPORTANT_YEARS.has(actionYear)) {
        eyebrow.appendChild(createEl('span', 'brief-kicker-chip', 'Major milestone'));
      }

      const titleText = exactSession
        ? `${exactSession.y} - ${exactSession.city}`
        : `No annual session in ${year}`;
      const subtitleText = supportingSession
        ? exactSession
          ? `President: ${supportingSession.president}`
          : `Nearest record: ${supportingSession.y} - ${supportingSession.city}`
        : 'No session record found for this year.';

      const copy = createEl('div', 'brief-copy');
      copy.appendChild(eyebrow);
      copy.appendChild(createEl('h2', 'brief-title', titleText));
      copy.appendChild(createEl('p', 'brief-subtitle', subtitleText));
      copy.appendChild(createEl('span', 'brief-year-chip', exactSession ? 'Selected year' : `Nearest ${actionYear}`));

      head.appendChild(yearMark);
      head.appendChild(copy);
      brief.appendChild(head);

      if (supportingSession) {
        const leadEvent = supportingSession.ev?.find(Boolean) || supportingSession.desc;
        const insight = createEl('div', 'brief-insight');
        insight.appendChild(createEl('span', 'brief-insight-label', 'Milestone'));
        insight.appendChild(createEl('p', 'brief-insight-text', leadEvent));
        brief.appendChild(insight);

        const summary = createEl('p', 'brief-summary');
        summary.textContent = exactSession
          ? supportingSession.desc
          : `The map stays anchored to the closest recorded Congress session: ${supportingSession.y} in ${supportingSession.city}.`;
        brief.appendChild(summary);

        const details = createEl('details', 'brief-more');
        details.appendChild(createEl('summary', '', 'Details'));

        const facts = createEl('div', 'brief-facts');
        appendBriefFact(facts, 'City', supportingSession.city);
        appendBriefFact(facts, 'President', supportingSession.president);
        appendBriefFact(facts, 'Phase', phaseLabel);
        appendBriefFact(facts, 'Record', exactSession ? 'Exact year' : 'Nearest year');
        details.appendChild(facts);
        const highlights = buildBriefHighlights(supportingSession);
        if (highlights) details.appendChild(highlights);
        details.appendChild(buildBriefTags(supportingSession, actionYear));
        brief.appendChild(details);
      }

      const actionsRow = createEl('div', 'brief-actions');
      const bookmarkButton = createEl('button', 'card-btn brief-primary-action', isBookmarked ? 'Saved' : 'Save');
      bookmarkButton.type = 'button';
      bookmarkButton.addEventListener('click', () => actions.toggleBookmark(actionYear));
      actionsRow.appendChild(bookmarkButton);

      const shareButton = createEl('button', 'card-btn', 'Share');
      shareButton.type = 'button';
      shareButton.addEventListener('click', () => actions.shareSession(actionYear));
      actionsRow.appendChild(shareButton);

      if (supportingSession) {
        const previousYear = findPreviousSessionYear(supportingSession.y);
        const prevButton = createEl('button', 'card-btn', `Prev ${previousYear}`);
        prevButton.type = 'button';
        prevButton.addEventListener('click', () => actions.setYear(previousYear));
        actionsRow.appendChild(prevButton);

        const nextYear = findNextSessionYear(supportingSession.y);
        const nextButton = createEl('button', 'card-btn', `Next ${nextYear}`);
        nextButton.type = 'button';
        nextButton.addEventListener('click', () => actions.setYear(nextYear));
        actionsRow.appendChild(nextButton);
      }

      if (!exactSession && supportingSession) {
        const openButton = createEl('button', 'card-btn', `Open ${supportingSession.y}`);
        openButton.type = 'button';
        openButton.addEventListener('click', () => actions.setYear(supportingSession.y));
        actionsRow.appendChild(openButton);
      }

      brief.appendChild(actionsRow);

      clearNode(refs.sessionCardSlot);
      refs.sessionCardSlot.appendChild(brief);

      refs.bookmarkCurrentBtn.textContent = isBookmarked
        ? 'Saved current year'
        : 'Save current year';
    }

    function renderSearchResults(year) {
      const queryText = normalizeText(state.searchQuery).trim();
      const filteredSessions = INC.filter((session) => matchesFilters(session, queryText, state.phaseFilter, state.importantOnly));
      const headingCount = queryText || state.phaseFilter !== 'all' || state.importantOnly
        ? `${filteredSessions.length} match${filteredSessions.length === 1 ? '' : 'es'}`
        : `${filteredSessions.length} sessions`;
      refs.searchCount.textContent = headingCount;

      clearNode(refs.searchResults);
      if (!filteredSessions.length) {
        const empty = createEl('div', 'result-empty', 'No sessions match the current search or filter set.');
        refs.searchResults.appendChild(empty);
        return;
      }

      for (const session of filteredSessions) {
        const button = createEl('button', 'result-card');
        button.type = 'button';
        if (session.y === clampYear(year)) {
          button.style.borderColor = getPhaseColor(session.phase);
          button.style.background = 'var(--accent-ghost)';
        }

        const yearLabel = createEl('span', 'result-year', String(session.y));
        button.appendChild(yearLabel);

        const copy = createEl('span', 'result-copy');
        const title = createEl('span', 'result-title', `${session.city} - ${session.president}`);
        const subtitle = createEl('span', 'result-subtitle', `${getPhaseLabel(session.phase)} | ${session.ev?.[0] || 'Session record'}`);
        copy.appendChild(title);
        copy.appendChild(subtitle);
        button.appendChild(copy);

        const pill = createEl('span', 'result-pill', IMPORTANT_YEARS.has(session.y) ? 'Key' : 'Open');
        button.appendChild(pill);

        button.addEventListener('click', () => actions.setYear(session.y));
        refs.searchResults.appendChild(button);
      }
    }

    function renderCompare() {
      const leftYear = clampYear(refs.compareYearA.value || state.compareYearA || YEAR_MIN);
      const rightYear = clampYear(refs.compareYearB.value || state.compareYearB || YEAR_MAX);
      state.compareYearA = leftYear;
      state.compareYearB = rightYear;
      refs.compareYearA.value = String(leftYear);
      refs.compareYearB.value = String(rightYear);

      clearNode(refs.compareResult);
      const leftSession = Data.getSession?.(leftYear);
      const rightSession = Data.getSession?.(rightYear);

      const buildCard = (session, selectedYear) => {
        const card = createEl('article', 'compare-card');
        const head = createEl('div', 'compare-head');
        const yearLabel = createEl('div', 'compare-year', session ? String(session.y) : String(selectedYear));
        head.appendChild(yearLabel);
        const phaseLabel = createEl('span', 'result-pill', getPhaseLabel(session?.phase || Data.getPhaseKey?.(selectedYear)));
        head.appendChild(phaseLabel);
        card.appendChild(head);

        if (!session) {
          const empty = createEl('div', 'compare-empty', `No recorded session for ${selectedYear}.`);
          card.appendChild(empty);
          return card;
        }

        const meta = createEl('div', 'compare-meta', `${session.city} | President: ${session.president}`);
        card.appendChild(meta);

        const events = createEl('div', 'compare-events');
        for (const eventText of session.ev || []) {
          events.appendChild(createEl('span', 'tag', eventText));
        }
        card.appendChild(events);

        const desc = createEl('p', 'session-desc', session.desc);
        card.appendChild(desc);
        return card;
      };

      refs.compareResult.appendChild(buildCard(leftSession, leftYear));
      refs.compareResult.appendChild(buildCard(rightSession, rightYear));
    }

    function renderBookmarks() {
      const sortedBookmarks = [...new Set(state.bookmarks)].sort((a, b) => a - b);
      state.bookmarks = sortedBookmarks;
      refs.bookmarkCount.textContent = `${sortedBookmarks.length} saved`;
      clearNode(refs.bookmarkList);

      if (!sortedBookmarks.length) {
        refs.bookmarkList.appendChild(createEl('div', 'bookmark-empty', 'Bookmark a session to keep it in quick reach.'));
        return;
      }

      for (const bookmarkYear of sortedBookmarks) {
        const session = Data.getSession?.(bookmarkYear);
        const item = createEl('div', 'bookmark-item');
        const jumpButton = createEl('button', 'result-card');
        jumpButton.type = 'button';
        jumpButton.style.flex = '1';
        jumpButton.addEventListener('click', () => actions.setYear(bookmarkYear));

        const yearLabel = createEl('span', 'bookmark-year', String(bookmarkYear));
        jumpButton.appendChild(yearLabel);

        const copy = createEl('span', 'bookmark-copy');
        copy.appendChild(createEl('span', 'bookmark-title', session ? `${session.city} - ${session.president}` : `Year ${bookmarkYear}`));
        copy.appendChild(createEl('span', 'bookmark-subtitle', session ? getPhaseLabel(session.phase) : 'Saved bookmark'));
        jumpButton.appendChild(copy);

        const removeButton = createEl('button', 'card-btn bookmark-remove', 'Remove');
        removeButton.type = 'button';
        removeButton.addEventListener('click', () => actions.toggleBookmark(bookmarkYear));

        item.appendChild(jumpButton);
        item.appendChild(removeButton);
        refs.bookmarkList.appendChild(item);
      }
    }

    function renderDashboard() {
      const correct = Number(state.quiz?.correct || 0);
      const attempted = Number(state.quiz?.attempted || 0);
      const score = Number(state.quiz?.score || 0);
      const bestStreak = Number(state.quiz?.bestStreak || 0);
      const streak = Number(state.quiz?.streak || 0);
      const accuracy = attempted ? Math.round((correct / attempted) * 100) : 0;

      const items = [
        { value: score, label: 'Score' },
        { value: correct, label: 'Correct answers' },
        { value: `${accuracy}%`, label: 'Accuracy' },
        { value: bestStreak, label: 'Best streak' },
        { value: streak, label: 'Current streak' },
        { value: attempted, label: 'Attempts' },
      ];

      clearNode(refs.dashboardGrid);
      for (const itemData of items) {
        const card = createEl('article', 'stat-card');
        card.appendChild(createEl('span', 'stat-value', String(itemData.value)));
        card.appendChild(createEl('span', 'stat-label', itemData.label));
        refs.dashboardGrid.appendChild(card);
      }
      refs.scoreVal.textContent = String(score);
    }

    function renderSources() {
      if (sourcesLoaded) return;
      sourcesLoaded = true;
      clearNode(refs.sourcesList);
      for (const sourceText of Data.SOURCES || []) {
        refs.sourcesList.appendChild(createEl('li', '', sourceText));
      }
    }

    function renderFiltersAndControls(year) {
      const phaseKey = Data.getPhaseKey?.(year) || 'moderate';
      refs.eraLabel.textContent = getPhaseLabel(phaseKey);
      refs.eraBadgeText.textContent = getPhaseLabel(phaseKey);
      refs.eraDot.style.background = getPhaseColor(phaseKey);
      refs.eraBadge.style.borderColor = Data.hexToRgba?.(getPhaseColor(phaseKey), 0.28) || 'rgba(26, 82, 118, 0.28)';
      refs.eraBadge.style.background = Data.hexToRgba?.(getPhaseColor(phaseKey), 0.12) || 'rgba(26, 82, 118, 0.12)';
      refs.eraBadge.style.color = getPhaseColor(phaseKey);

      refs.yearNum.textContent = String(clampYear(year));
      refs.eventText.textContent = Data.getEventForYear?.(year) || 'No recorded milestone for this year';

      refs.searchInput.value = state.searchQuery || '';
      refs.phaseFilter.value = state.phaseFilter || 'all';
      refs.importantToggle.checked = Boolean(state.importantOnly);
      refs.quizCategory.value = state.quiz?.category || 'presidents';
      refs.themeBtn.textContent = state.theme === 'dark' ? 'Light theme' : 'Dark theme';
      refs.themeBtn.setAttribute('aria-pressed', String(state.theme === 'dark'));
      refs.playBtn.textContent = state.playing ? 'Pause' : 'Play';
      refs.playBtn.classList.toggle('is-playing', Boolean(state.playing));
      refs.bookmarkCurrentBtn.textContent = state.bookmarks.includes(clampYear(year)) ? 'Bookmarked this year' : 'Bookmark current year';

      const notesValue = state.notes?.[clampYear(year)] || '';
      if (document.activeElement !== refs.notesInput || refs.notesInput.value !== notesValue) {
        refs.notesInput.value = notesValue;
      }
      refs.notesMeta.textContent = notesValue.trim().length ? 'Note saved locally' : 'Saved locally';

      if (!state.compareYearA) {
        state.compareYearA = clampYear(year);
      }
      if (!state.compareYearB) {
        state.compareYearB = findPreviousSessionYear(year);
      }

      if (refs.compareYearA.value !== String(state.compareYearA)) refs.compareYearA.value = String(state.compareYearA);
      if (refs.compareYearB.value !== String(state.compareYearB)) refs.compareYearB.value = String(state.compareYearB);
    }

    function renderStatus(year) {
      const exactSession = Data.getSession?.(year);
      const nearestSession = findNearestDisplaySession(year);
      const visibleSessions = INC.filter((session) => matchesFilters(session, normalizeText(state.searchQuery).trim(), state.phaseFilter, state.importantOnly));
      const bookmarkCount = state.bookmarks.length;
      const noteCount = state.notes ? Object.keys(state.notes).filter((key) => String(state.notes[key] || '').trim().length > 0).length : 0;
      const quizScore = Number(state.quiz?.score || 0);
      refs.fcCount.textContent = exactSession ? `${exactSession.y}` : `Nearest ${nearestSession?.y || year}`;
      const summary = exactSession
        ? `${buildSummaryText(exactSession, year)} | ${visibleSessions.length} filtered session${visibleSessions.length === 1 ? '' : 's'} | ${bookmarkCount} bookmark${bookmarkCount === 1 ? '' : 's'} | ${noteCount} note${noteCount === 1 ? '' : 's'} | Score ${quizScore}`
        : `${buildSummaryText(nearestSession, year)} | ${visibleSessions.length} filtered session${visibleSessions.length === 1 ? '' : 's'} | ${bookmarkCount} bookmark${bookmarkCount === 1 ? '' : 's'} | ${noteCount} note${noteCount === 1 ? '' : 's'} | Score ${quizScore}`;
      refs.statusBar.textContent = state.uiMessage || summary;
    }

    function render(year = state.year) {
      const currentYear = clampYear(year);
      renderEraScale();
      renderFiltersAndControls(currentYear);
      renderSlider(currentYear);
      renderJumpButtons(currentYear);
      renderSessionCard(currentYear);
      renderSearchResults(currentYear);
      renderCompare();
      renderBookmarks();
      renderDashboard();
      renderSources();
      renderStatus(currentYear);

      if (state.drawerOpen) {
        refs.fcPanel.classList.add('drawer-open');
        document.body.classList.add('drawer-active');
        refs.drawerToggle.setAttribute('aria-expanded', 'true');
      } else {
        refs.fcPanel.classList.remove('drawer-open');
        document.body.classList.remove('drawer-active');
        refs.drawerToggle.setAttribute('aria-expanded', 'false');
      }
      document.body.classList.toggle('is-playing-timeline', Boolean(state.playing));
    }

    function bindEvents() {
      refs.searchInput.addEventListener('input', () => {
        state.searchQuery = refs.searchInput.value.trim();
        persistAndRender();
      });

      refs.searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          refs.searchInput.value = '';
          state.searchQuery = '';
          persistAndRender();
          refs.searchInput.blur();
          return;
        }
        if (event.key === 'Enter') {
          const filteredSessions = INC.filter((session) => matchesFilters(session, normalizeText(state.searchQuery).trim(), state.phaseFilter, state.importantOnly));
          if (filteredSessions.length) {
            actions.setYear(filteredSessions[0].y);
          }
        }
      });

      refs.searchClear.addEventListener('click', () => {
        refs.searchInput.value = '';
        state.searchQuery = '';
        persistAndRender();
        refs.searchInput.focus();
      });

      refs.phaseFilter.addEventListener('change', () => {
        state.phaseFilter = refs.phaseFilter.value || 'all';
        persistAndRender();
      });

      refs.importantToggle.addEventListener('change', () => {
        state.importantOnly = refs.importantToggle.checked;
        persistAndRender();
      });

      refs.quizCategory.addEventListener('change', () => {
        if (typeof actions.setQuizCategory === 'function') {
          actions.setQuizCategory(refs.quizCategory.value);
        }
        persistAndRender();
      });

      refs.compareYearA.addEventListener('change', () => {
        state.compareYearA = clampYear(refs.compareYearA.value);
        persistAndRender();
      });

      refs.compareYearB.addEventListener('change', () => {
        state.compareYearB = clampYear(refs.compareYearB.value);
        persistAndRender();
      });

      refs.compareSwap.addEventListener('click', () => {
        const left = state.compareYearA;
        state.compareYearA = state.compareYearB;
        state.compareYearB = left;
        persistAndRender();
      });

      refs.notesInput.addEventListener('input', () => {
        const yearKey = String(clampYear(state.year));
        if (!state.notes) state.notes = {};
        state.notes[yearKey] = refs.notesInput.value;
        persistAndRender();
      });

      refs.bookmarkCurrentBtn.addEventListener('click', () => {
        actions.toggleBookmark(state.year);
      });

      refs.shareBtn.addEventListener('click', () => {
        actions.shareSession(state.year);
      });

      refs.themeBtn.addEventListener('click', () => {
        actions.toggleTheme();
      });

      refs.resetBtn.addEventListener('click', () => {
        actions.resetProgress();
      });

      refs.prevBtn.addEventListener('click', () => {
        actions.setYear(findPreviousSessionYear(state.year));
      });

      refs.nextBtn.addEventListener('click', () => {
        actions.setYear(findNextSessionYear(state.year));
      });

      refs.playBtn.addEventListener('click', () => {
        actions.togglePlaying();
      });

      refs.sliderInput.addEventListener('input', () => {
        actions.setYear(clampYear(refs.sliderInput.value));
      });

      refs.drawerToggle?.addEventListener('click', () => {
        actions.toggleDrawer();
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && state.drawerOpen) {
          actions.toggleDrawer(false);
        }
      });

    }

    bindEvents();
    populateCompareSelects();
    renderEraScale();

    return {
      render,
      syncCompareOptions: populateCompareSelects,
      updateSessionCard: renderSessionCard,
      updateStatus: renderStatus,
      resize() {
        renderEraScale();
        render(clampYear(state.year));
      },
    };
  }

  global.CongressTimeline = Object.freeze({
    createTimelineController,
  });
})(window);
