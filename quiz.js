(function (global) {
  const Data = global.CongressData || {};
  const INC = Data.INC || [];
  const PHASES = Data.PHASES || {};

  const CATEGORY_LABELS = {
    presidents: 'Presidents',
    cities: 'Cities',
    years: 'Years',
    phases: 'Phases',
    events: 'Events',
  };

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

  function normalizeText(value) {
    return String(value || '').trim().toLowerCase();
  }

  function clampYear(year) {
    return Data.clampYear ? Data.clampYear(year) : Math.min(Data.YEAR_MAX || 1947, Math.max(Data.YEAR_MIN || 1885, Number(year) || Data.YEAR_MIN || 1885));
  }

  function getPhaseLabel(phaseKey) {
    return PHASES[phaseKey]?.label || phaseKey || 'Unknown';
  }

  function getQuizPool(state) {
    const currentYear = clampYear(state.year);
    let pool = (Data.getSessionsUpTo?.(currentYear) || []).filter((session) => session && session.city);
    if (state.phaseFilter && state.phaseFilter !== 'all') {
      pool = pool.filter((session) => session.phase === state.phaseFilter);
    }
    if (state.importantOnly) {
      pool = pool.filter((session) => Data.IMPORTANT_YEARS?.has(session.y));
    }
    const query = normalizeText(state.searchQuery);
    if (query) {
      const getSessionSearchText = (session) => {
        const eventText = Array.isArray(session.ev) ? session.ev.join(' ') : '';
        const phaseLabel = PHASES[session.phase]?.label || session.phase || '';
        return [
          session.y,
          session.city,
          session.president,
          phaseLabel,
          eventText,
          session.desc,
        ].join(' ').toLowerCase();
      };
      pool = pool.filter((session) => getSessionSearchText(session).includes(query));
    }
    if (pool.length < 4) {
      pool = INC.filter((session) => session && session.city);
    }
    return pool;
  }

  function distinctValues(values, mapFn = (value) => value) {
    const seen = new Set();
    const result = [];
    for (const value of values) {
      const mapped = mapFn(value);
      const key = normalizeText(mapped);
      if (!mapped || seen.has(key)) continue;
      seen.add(key);
      result.push(mapped);
    }
    return result;
  }

  function shuffleCopy(values) {
    return Data.shuffleInPlace ? Data.shuffleInPlace([...values]) : [...values].sort(() => Math.random() - 0.5);
  }

  function pickRandomSession(pool) {
    const shuffled = shuffleCopy(pool);
    return shuffled[0] || null;
  }

  function buildOptionSet(answerValue, rawCandidates, formatLabel) {
    const formattedAnswer = formatLabel(answerValue);
    const candidates = distinctValues(rawCandidates, formatLabel).filter((candidate) => normalizeText(candidate) !== normalizeText(formattedAnswer));
    const picked = shuffleCopy(candidates).slice(0, 3);
    const options = [{ value: answerValue, label: formattedAnswer }];
    for (const candidate of picked) {
      options.push({ value: candidate.value ?? candidate, label: candidate.label ?? candidate });
    }
    return shuffleCopy(options);
  }

  function buildYearOptions(answerYear, pool) {
    const years = distinctValues(pool.map((session) => session.y), (value) => Number(value));
    const options = buildOptionSet(answerYear, years, (value) => String(value));
    return options.map((option) => ({ value: Number(option.value), label: String(option.label) }));
  }

  function buildCityOptions(answerCity, pool) {
    const cities = distinctValues(pool.map((session) => session.city), (value) => String(value));
    return buildOptionSet(answerCity, cities, (value) => String(value)).map((option) => ({ value: String(option.value), label: String(option.label) }));
  }

  function buildPhaseOptions(answerPhaseKey) {
    const phaseKeys = distinctValues(Object.keys(PHASES), (value) => String(value));
    return buildOptionSet(answerPhaseKey, phaseKeys, (value) => getPhaseLabel(value)).map((option) => ({ value: String(option.value), label: getPhaseLabel(option.value) }));
  }

  function buildPresidentOptions(answerPresident, pool) {
    const presidents = distinctValues(pool.map((session) => session.president), (value) => String(value));
    return buildOptionSet(answerPresident, presidents, (value) => String(value)).map((option) => ({ value: String(option.value), label: String(option.label) }));
  }

  function buildEventOptions(answerYear, pool) {
    const years = distinctValues(pool.map((session) => session.y), (value) => Number(value));
    return buildOptionSet(answerYear, years, (value) => String(value)).map((option) => ({ value: Number(option.value), label: String(option.label) }));
  }

  function makeQuestion(state) {
    const pool = getQuizPool(state);
    if (!pool.length) {
      return null;
    }

    const session = pickRandomSession(pool);
    if (!session) {
      return null;
    }

    const category = state.quiz?.category || 'presidents';

    if (category === 'cities') {
      const options = buildCityOptions(session.city, pool);
      return {
        category,
        prompt: `Which city hosted the ${session.y} Congress session?`,
        options,
        answer: session.city,
        answerLabel: session.city,
        session,
        explanation: `${session.y} was held in ${session.city}.`,
      };
    }

    if (category === 'years') {
      const options = buildYearOptions(session.y, pool);
      return {
        category,
        prompt: `What year was the ${session.city} session held?`,
        options,
        answer: session.y,
        answerLabel: String(session.y),
        session,
        explanation: `${session.city} hosted the Congress in ${session.y}.`,
      };
    }

    if (category === 'phases') {
      const options = buildPhaseOptions(session.phase);
      return {
        category,
        prompt: `Which historical phase best fits the ${session.y} session at ${session.city}?`,
        options,
        answer: session.phase,
        answerLabel: getPhaseLabel(session.phase),
        session,
        explanation: `${session.y} belongs to the ${getPhaseLabel(session.phase)}.`,
      };
    }

    if (category === 'events') {
      const eventText = shuffleCopy(session.ev || [session.desc]).find(Boolean) || session.desc;
      const options = buildEventOptions(session.y, pool);
      return {
        category,
        prompt: `Which year matches this milestone: ${eventText}?`,
        options,
        answer: session.y,
        answerLabel: String(session.y),
        session,
        explanation: `${eventText} belongs to ${session.y} - ${session.city}.`,
      };
    }

    const options = buildYearOptions(session.y, pool);
    return {
      category: 'presidents',
      prompt: `In which year was ${session.president} Congress president?`,
      options,
      answer: session.y,
      answerLabel: String(session.y),
      session,
      explanation: `${session.president} presided over the ${session.y} session at ${session.city}.`,
    };
  }

  function createQuizController({ state, elements, actions }) {
    const refs = elements;

    function ensureQuizState() {
      if (!state.quiz) {
        state.quiz = {};
      }
      state.quiz.category = state.quiz.category || 'presidents';
      state.quiz.score = Number(state.quiz.score || 0);
      state.quiz.correct = Number(state.quiz.correct || 0);
      state.quiz.attempted = Number(state.quiz.attempted || 0);
      state.quiz.streak = Number(state.quiz.streak || 0);
      state.quiz.bestStreak = Number(state.quiz.bestStreak || 0);
      state.quiz.open = Boolean(state.quiz.open);
      state.quiz.currentQuestion = state.quiz.currentQuestion || null;
      state.quiz.answered = Boolean(state.quiz.answered);
      state.quiz.feedback = state.quiz.feedback || '';
      state.quiz.feedbackKind = state.quiz.feedbackKind || '';
    }

    function renderMeta() {
      const categoryLabel = CATEGORY_LABELS[state.quiz.category] || 'Presidents';
      const currentYear = clampYear(state.year);
      const pool = getQuizPool(state);
      refs.quizMeta.textContent = `${categoryLabel} | ${pool.length} sessions | ${currentYear}`;
      refs.quizStreak.textContent = state.quiz.streak ? `Streak ${state.quiz.streak}` : '';

      clearNode(refs.quizState);
      [
        { label: 'Score', value: state.quiz.score },
        { label: 'Now', value: state.quiz.streak },
        { label: 'Best', value: state.quiz.bestStreak },
      ].forEach((stat) => {
        const item = createEl('div', 'quiz-stat');
        item.appendChild(createEl('span', 'quiz-stat-value', String(stat.value)));
        item.appendChild(createEl('span', 'quiz-stat-label', stat.label));
        refs.quizState.appendChild(item);
      });
    }

    function renderQuestion() {
      clearNode(refs.qtext);
      clearNode(refs.qopts);
      refs.qfb.textContent = state.quiz.feedback || '';
      refs.qfb.className = 'quiz-feedback';
      refs.qnext.hidden = !state.quiz.answered;

      if (!state.quiz.currentQuestion) {
        const empty = createEl('div', 'quiz-empty', 'No question loaded.');
        refs.qtext.appendChild(empty);
        return;
      }

      const question = state.quiz.currentQuestion;
      const context = createEl('div', 'quiz-context', `${CATEGORY_LABELS[question.category] || 'Quiz'} | ${question.session?.y || clampYear(state.year)} - ${question.session?.city || 'Session'}`);
      const prompt = createEl('div', 'quiz-prompt', question.prompt);
      refs.qtext.appendChild(context);
      refs.qtext.appendChild(prompt);

      const optionList = shuffleCopy(question.options);
      optionList.forEach((option, index) => {
        const button = createEl('button', 'quiz-option');
        button.type = 'button';
        button.dataset.value = String(option.value);
        button.disabled = Boolean(state.quiz.answered);
        button.appendChild(createEl('span', 'quiz-option-index', String(index + 1)));
        button.appendChild(createEl('span', 'quiz-option-copy', String(option.label)));
        if (state.quiz.answered) {
          const isCorrect = normalizeText(option.value) === normalizeText(question.answer);
          if (isCorrect) button.classList.add('ok');
          if (!isCorrect && normalizeText(option.value) === normalizeText(state.quiz.lastChoice)) button.classList.add('no');
        }
        button.addEventListener('click', () => handleAnswer(option.value));
        refs.qopts.appendChild(button);
      });

      if (state.quiz.answered) {
        const questionSummary = createEl('div', 'quiz-explanation', question.explanation || '');
        refs.qtext.appendChild(questionSummary);
      }
    }

    function renderOpenState() {
      refs.quizWrap?.classList.toggle('is-open', Boolean(state.quiz.open));
      refs.quizZone.hidden = !state.quiz.open;
      refs.openQuiz.hidden = Boolean(state.quiz.open);
      refs.openQuiz.textContent = state.quiz.currentQuestion ? 'Continue quiz' : 'Start quiz';
    }
    function nextQuestion() {
      ensureQuizState();
      state.quiz.currentQuestion = makeQuestion(state);
      state.quiz.answered = false;
      state.quiz.feedback = '';
      state.quiz.feedbackKind = '';
      state.quiz.lastChoice = null;

      if (!state.quiz.currentQuestion) {
        state.quiz.feedback = 'No quiz question can be generated from the current filter set.';
        state.quiz.feedbackKind = 'empty';
      }
      if (typeof actions.persist === 'function') {
        actions.persist();
      }
      if (typeof actions.requestRender === 'function') {
        actions.requestRender();
      }
    }

    function handleAnswer(chosenValue) {
      if (!state.quiz.currentQuestion || state.quiz.answered) return;
      const question = state.quiz.currentQuestion;
      const isCorrect = normalizeText(chosenValue) === normalizeText(question.answer);

      state.quiz.answered = true;
      state.quiz.lastChoice = chosenValue;
      state.quiz.attempted += 1;
      if (isCorrect) {
        state.quiz.correct += 1;
        state.quiz.score += 10;
        state.quiz.streak += 1;
        if (state.quiz.streak > state.quiz.bestStreak) {
          state.quiz.bestStreak = state.quiz.streak;
        }
        state.quiz.feedback = `Correct. ${question.explanation}`;
        state.quiz.feedbackKind = 'correct';
      } else {
        state.quiz.streak = 0;
        state.quiz.feedback = `Not quite. ${question.explanation}`;
        state.quiz.feedbackKind = 'incorrect';
      }

      if (typeof actions.persist === 'function') {
        actions.persist();
      }
      if (typeof actions.announce === 'function') {
        actions.announce(state.quiz.feedback);
      }
      if (typeof actions.requestRender === 'function') {
        actions.requestRender();
      }
    }

    function openQuiz() {
      state.quiz.open = true;
      if (!state.quiz.currentQuestion) {
        state.quiz.currentQuestion = makeQuestion(state);
      }
      if (typeof actions.persist === 'function') {
        actions.persist();
      }
      if (typeof actions.requestRender === 'function') {
        actions.requestRender();
      }
    }

    function closeQuiz() {
      state.quiz.open = false;
      if (typeof actions.persist === 'function') {
        actions.persist();
      }
      if (typeof actions.requestRender === 'function') {
        actions.requestRender();
      }
    }

    function setCategory(category) {
      state.quiz.category = CATEGORY_LABELS[category] ? category : 'presidents';
      state.quiz.currentQuestion = null;
      state.quiz.answered = false;
      state.quiz.feedback = '';
      state.quiz.feedbackKind = '';
      if (typeof actions.persist === 'function') {
        actions.persist();
      }
      if (typeof actions.requestRender === 'function') {
        actions.requestRender();
      }
    }

    function render() {
      ensureQuizState();
      renderOpenState();
      renderMeta();
      if (state.quiz.open && !state.quiz.currentQuestion) {
        state.quiz.currentQuestion = makeQuestion(state);
      }
      renderQuestion();
      refs.qnext.textContent = state.quiz.answered ? 'Next question' : 'New question';
      refs.qnext.hidden = !state.quiz.open || !state.quiz.currentQuestion || !state.quiz.answered && !state.quiz.feedback;
      refs.qnext.disabled = false;
      refs.qfb.classList.toggle('correct', state.quiz.feedbackKind === 'correct');
      refs.qfb.classList.toggle('incorrect', state.quiz.feedbackKind === 'incorrect');
      refs.qfb.classList.toggle('empty', state.quiz.feedbackKind === 'empty');
    }

    refs.openQuiz.addEventListener('click', () => {
      openQuiz();
    });

    refs.quizClose?.addEventListener('click', () => {
      closeQuiz();
    });

    refs.qnext.addEventListener('click', () => {
      nextQuestion();
      state.quiz.open = true;
      if (typeof actions.persist === 'function') {
        actions.persist();
      }
      if (typeof actions.requestRender === 'function') {
        actions.requestRender();
      }
    });

    ensureQuizState();

    return {
      render,
      openQuiz,
      closeQuiz,
      nextQuestion,
      setCategory,
    };
  }

  global.CongressQuiz = Object.freeze({
    createQuizController,
    CATEGORY_LABELS,
  });
})(window);
