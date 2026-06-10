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

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function highlightText(text, query) {
    const safeText = escapeHtml(text);
    if (!query) return safeText;
    const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return safeText.replace(regex, '<mark class="search-highlight">$1</mark>');
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

  // Removed old findPreviousSessionYear, findNextSessionYear, and findNearestDisplaySession functions to redefine them inline inside the controller.

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

  function appendBriefFact(parent, label, value, query) {
    if (!value) return;
    const item = createEl('div', 'brief-fact');
    item.appendChild(createEl('span', 'brief-fact-label', label));
    const valSpan = createEl('span', 'brief-fact-value');
    valSpan.innerHTML = highlightText(value, query);
    item.appendChild(valSpan);
    parent.appendChild(item);
  }

  function buildBriefHighlights(session, query) {
    const events = Array.isArray(session?.ev) ? session.ev.filter(Boolean).slice(0, 3) : [];
    if (!events.length && session?.desc) events.push(session.desc);
    if (!events.length) return null;

    const block = createEl('div', 'brief-highlights');
    const heading = createEl('h3', '', 'Key points');
    const list = createEl('ul', 'brief-highlight-list');

    for (const eventText of events) {
      const li = createEl('li');
      li.innerHTML = highlightText(eventText, query);
      list.appendChild(li);
    }

    block.appendChild(heading);
    block.appendChild(list);
    return block;
  }

  function buildBriefTags(session, year, query) {
    const tags = createEl('div', 'brief-tags');
    const phaseLabel = getPhaseLabel(session?.phase || Data.getPhaseKey?.(year));
    const tagTexts = [phaseLabel];
    if (IMPORTANT_YEARS.has(session?.y || year)) tagTexts.push('Major milestone');
    if (session?.ev?.[0]) tagTexts.push(session.ev[0]);

    for (const tagText of tagTexts) {
      const span = createEl('span', 'brief-tag');
      span.innerHTML = highlightText(tagText, query);
      tags.appendChild(span);
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

    function getFilteredSessions() {
      const queryText = normalizeText(state.searchQuery).trim();
      return INC.filter((session) => matchesFilters(session, queryText, state.phaseFilter, state.importantOnly));
    }

    function findPreviousSessionYear(year) {
      const numericYear = clampYear(year);
      const filtered = getFilteredSessions();
      if (!filtered.length) return numericYear;
      let previous = filtered[0].y;
      for (const session of filtered) {
        if (session.y >= numericYear) break;
        previous = session.y;
      }
      return previous;
    }

    function findNextSessionYear(year) {
      const numericYear = clampYear(year);
      const filtered = getFilteredSessions();
      if (!filtered.length) return numericYear;
      for (const session of filtered) {
        if (session.y > numericYear) return session.y;
      }
      return filtered[0].y;
    }

    function findNearestDisplaySession(year) {
      const numericYear = clampYear(year);
      const filtered = getFilteredSessions();
      if (!filtered.length) return null;
      let nearest = filtered[0];
      for (const session of filtered) {
        if (Math.abs(session.y - numericYear) < Math.abs(nearest.y - numericYear)) {
          nearest = session;
        }
      }
      return nearest;
    }

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
      const query = normalizeText(state.searchQuery).trim();

      const card = createEl('article', 'session-summary-card');
      card.style.setProperty('--session-accent', accentColor);
      if (!exactSession) card.classList.add('is-nearest');

      const isMatch = matchesFilters(supportingSession, query, state.phaseFilter, state.importantOnly);
      if (!isMatch) {
        card.classList.add('no-match-filter');
      }

      const head = createEl('div', 'summary-top');
      const yearMark = createEl('div', 'summary-year', String(supportingSession?.y || year));
      const eyebrow = createEl('div', 'summary-meta');
      const dot = createEl('span', 'summary-dot');
      dot.style.background = accentColor;
      eyebrow.appendChild(dot);
      eyebrow.appendChild(createEl('span', '', phaseLabel));
      if (IMPORTANT_YEARS.has(actionYear)) {
        eyebrow.appendChild(createEl('span', 'summary-chip', 'Major milestone'));
      }
      if (!isMatch) {
        eyebrow.appendChild(createEl('span', 'summary-chip warning', 'Out of Filter Scope'));
      }

      const titleText = exactSession
        ? `${exactSession.y} - ${exactSession.city}`
        : `No annual session in ${year}`;
      const subtitleText = supportingSession
        ? exactSession
          ? `President: ${supportingSession.president}`
          : `Nearest record: ${supportingSession.y} - ${supportingSession.city}`
        : 'No session record found for this year.';

      const copy = createEl('div', 'summary-copy');
      copy.appendChild(eyebrow);
      
      const titleEl = createEl('h2', 'summary-title');
      titleEl.innerHTML = highlightText(titleText, query);
      copy.appendChild(titleEl);
      
      const subtitleEl = createEl('p', 'summary-subtitle');
      subtitleEl.innerHTML = highlightText(subtitleText, query);
      copy.appendChild(subtitleEl);

      head.appendChild(yearMark);
      head.appendChild(copy);
      card.appendChild(head);

      if (supportingSession) {
        const leadEvent = supportingSession.ev?.find(Boolean) || supportingSession.desc;
        const insight = createEl('div', 'summary-focus');
        insight.appendChild(createEl('span', 'summary-focus-label', 'Milestone'));
        
        const insightText = createEl('span', 'summary-focus-text');
        insightText.innerHTML = highlightText(leadEvent, query);
        insight.appendChild(insightText);
        
        card.appendChild(insight);

        const details = createEl('details', 'summary-details');
        details.appendChild(createEl('summary', 'summary-details-toggle', 'Details'));

        const detailsBody = createEl('div', 'summary-details-body');

        const summaryText = createEl('p', 'summary-details-text');
        const descText = exactSession
          ? supportingSession.desc
          : `The map stays anchored to the closest recorded Congress session: ${supportingSession.y} in ${supportingSession.city}.`;
        summaryText.innerHTML = highlightText(descText, query);
        detailsBody.appendChild(summaryText);

        const facts = createEl('div', 'brief-facts');
        appendBriefFact(facts, 'City', supportingSession.city, query);
        appendBriefFact(facts, 'President', supportingSession.president, query);
        appendBriefFact(facts, 'Phase', phaseLabel, query);
        appendBriefFact(facts, 'Record', exactSession ? 'Exact year' : 'Nearest year', query);
        detailsBody.appendChild(facts);

        const highlights = buildBriefHighlights(supportingSession, query);
        if (highlights) detailsBody.appendChild(highlights);

        detailsBody.appendChild(buildBriefTags(supportingSession, actionYear, query));

        details.appendChild(detailsBody);
        card.appendChild(details);
      }

      // Card action footer with share + bookmark
      const actionFooter = createEl('div', 'card-action-footer');

      const shareBtn = createEl('button', 'card-action-btn');
      shareBtn.type = 'button';
      shareBtn.title = 'Share session';
      shareBtn.setAttribute('aria-label', 'Share session');
      shareBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
          <polyline points="16 6 12 2 8 6"></polyline>
          <line x1="12" y1="2" x2="12" y2="15"></line>
        </svg>
        <span>Share</span>
      `;
      shareBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        actions.shareSession(actionYear);
      });
      actionFooter.appendChild(shareBtn);

      const bookmarkBtn = createEl('button', 'card-action-btn');
      bookmarkBtn.type = 'button';
      bookmarkBtn.title = isBookmarked ? 'Remove bookmark' : 'Bookmark session';
      bookmarkBtn.setAttribute('aria-label', isBookmarked ? 'Remove bookmark' : 'Bookmark session');
      bookmarkBtn.classList.toggle('is-bookmarked', isBookmarked);
      bookmarkBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="${isBookmarked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
        <span>${isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
      `;
      bookmarkBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        actions.toggleBookmark(actionYear);
      });
      actionFooter.appendChild(bookmarkBtn);

      card.appendChild(actionFooter);

      clearNode(refs.sessionCardSlot);
      refs.sessionCardSlot.appendChild(card);
      if (refs.bookmarkCurrentBtn) {
        refs.bookmarkCurrentBtn.textContent = isBookmarked
          ? 'Saved current year'
          : 'Save current year';
      }
    }

    function renderSearchResults(year) {
      if (!refs.searchCount || !refs.searchResults) return;
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
        const phaseKey = session?.phase || Data.getPhaseKey?.(selectedYear);
        const accentColor = getPhaseColor(phaseKey);
        const softColor = Data.hexToRgba?.(accentColor, 0.12) || 'rgba(26, 82, 118, 0.12)';
        const strongColor = Data.hexToRgba?.(accentColor, 0.28) || 'rgba(26, 82, 118, 0.28)';
        
        card.style.setProperty('--compare-accent', accentColor);
        card.style.setProperty('--compare-accent-soft', softColor);
        card.style.setProperty('--compare-accent-strong', strongColor);

        const head = createEl('div', 'compare-head');
        const yearLabel = createEl('div', 'compare-year', session ? String(session.y) : String(selectedYear));
        head.appendChild(yearLabel);
        const phaseLabel = createEl('span', 'result-pill', getPhaseLabel(phaseKey));
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

        const removeButton = createEl('button', 'bookmark-remove', '✕');
        removeButton.type = 'button';
        removeButton.setAttribute('aria-label', `Remove bookmark for year ${bookmarkYear}`);
        removeButton.setAttribute('title', `Remove bookmark for year ${bookmarkYear}`);
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
        
        if (itemData.label === 'Accuracy') {
          const bar = createEl('div', 'stat-progress');
          const fill = createEl('div', 'stat-progress-fill');
          fill.style.width = String(itemData.value);
          bar.appendChild(fill);
          card.appendChild(bar);
        }
        
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
      if (refs.playbackYear) {
        refs.playbackYear.textContent = String(clampYear(year));
      }
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
      if (!refs.notesMeta.classList.contains('is-saving')) {
        refs.notesMeta.textContent = notesValue.trim().length ? 'Notes saved' : 'Saved';
      }

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

      const mobileFiltersBtn = document.getElementById('mobile-filters-btn');
      const filtersGroup = document.getElementById('filters-group');
      const filtersCloseBtn = document.getElementById('filters-close-btn');
      const filtersBackdrop = document.getElementById('filters-backdrop');

      function openFilters() {
        filtersGroup?.classList.add('open');
        filtersBackdrop?.classList.add('show');
        filtersBackdrop?.removeAttribute('hidden');
      }

      function closeFilters() {
        filtersGroup?.classList.remove('open');
        filtersBackdrop?.classList.remove('show');
        filtersBackdrop?.setAttribute('hidden', 'true');
      }

      mobileFiltersBtn?.addEventListener('click', openFilters);
      filtersCloseBtn?.addEventListener('click', closeFilters);
      filtersBackdrop?.addEventListener('click', closeFilters);

      refs.phaseFilter.addEventListener('change', () => {
        state.phaseFilter = refs.phaseFilter.value || 'all';
        persistAndRender();
        closeFilters();
      });

      refs.importantToggle.addEventListener('change', () => {
        state.importantOnly = refs.importantToggle.checked;
        persistAndRender();
        closeFilters();
      });

      refs.quizCategory.addEventListener('change', () => {
        if (typeof actions.setQuizCategory === 'function') {
          actions.setQuizCategory(refs.quizCategory.value);
        }
        persistAndRender();
        closeFilters();
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

      let saveTimeout = null;
      refs.notesInput.addEventListener('input', () => {
        const yearKey = String(clampYear(state.year));
        if (!state.notes) state.notes = {};
        state.notes[yearKey] = refs.notesInput.value;

        // Visual saving pulsing indicator
        refs.notesMeta.classList.add('is-saving');
        refs.notesMeta.textContent = 'Saving...';

        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          refs.notesMeta.classList.remove('is-saving');
          refs.notesMeta.textContent = 'Notes saved';
        }, 650);

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
        actions.stepYear(-1);
      });

      refs.nextBtn.addEventListener('click', () => {
        actions.stepYear(1);
      });

      refs.playBtn.addEventListener('click', () => {
        actions.togglePlaying();
      });

      refs.quizBtn?.addEventListener('click', () => {
        actions.openQuiz();
      });

      refs.mapQuizBtn?.addEventListener('click', () => {
        actions.openQuiz();
      });

      refs.bookmarksBtn?.addEventListener('click', () => {
        actions.openBookmarks();
      });

      refs.sliderInput.addEventListener('input', () => {
        actions.setYear(clampYear(refs.sliderInput.value));
      });

      refs.drawerToggle?.addEventListener('click', () => {
        actions.toggleDrawer();
      });

      refs.fcClose?.addEventListener('click', () => {
        actions.toggleDrawer(false);
      });

      refs.drawerBackdrop?.addEventListener('click', () => {
        actions.toggleDrawer(false);
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
