(function (global) {
  const Data = global.CongressData || {};
  const mapData = global.CongressMapData || {};

  const CITY_STATE_NAME = {
    Bombay: 'Maharashtra',
    Calcutta: 'West Bengal',
    Madras: 'Tamil Nadu',
    Allahabad: 'Uttar Pradesh',
    Lahore: 'Punjab',
    Nagpur: 'Maharashtra',
    Amraoti: 'Maharashtra',
    Lucknow: 'Uttar Pradesh',
    Ahmedabad: 'Gujarat',
    Poona: 'Maharashtra',
    Amritsar: 'Punjab',
    Banaras: 'Uttar Pradesh',
    Gaya: 'Bihar',
    Kakinada: 'Andhra Pradesh',
    Belgaum: 'Karnataka',
    Kanpur: 'Uttar Pradesh',
    Gauhati: 'Assam',
    Bankipore: 'Bihar',
    Karachi: null,
    Faizpur: 'Maharashtra',
    Haripura: 'Gujarat',
    Tripuri: 'Madhya Pradesh',
    Ramgarh: 'Jharkhand',
    Meerut: 'Uttar Pradesh',
    Delhi: 'Delhi',
    'Wardha / Bombay': 'Maharashtra',
    Surat: 'Gujarat',
    'No session - WWII': null,
    '(No session - WWII)': null,
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

  function getStateNameForSession(session) {
    if (!session) return null;
    return CITY_STATE_NAME[session.city] ?? null;
  }

  function getFeatureStateName(feature) {
    return normalizeText(feature?.properties?.ST_NM);
  }

  function buildStateSessionIndex() {
    const index = new Map();
    for (const session of Data.INC || []) {
      const stateName = getStateNameForSession(session);
      if (!stateName) continue;
      const normalized = normalizeText(stateName);
      if (!index.has(normalized)) index.set(normalized, []);
      index.get(normalized).push(session);
    }
    return index;
  }

  const REMOTE_FOCUS_STATES = new Set(['andaman & nicobar', 'lakshadweep']);

  function reverseRing(ring) {
    return ring.map((position) => Array.isArray(position) ? position.slice() : position).reverse();
  }

  function rewindGeometryForD3(geometry) {
    if (!geometry) return geometry;
    if (geometry.type === 'Polygon') {
      return {
        ...geometry,
        coordinates: geometry.coordinates.map(reverseRing),
      };
    }
    if (geometry.type === 'MultiPolygon') {
      return {
        ...geometry,
        coordinates: geometry.coordinates.map((polygon) => polygon.map(reverseRing)),
      };
    }
    return { ...geometry };
  }

  function maybeRewindFeatureCollection(d3, collection) {
    if (!d3?.geoArea || !collection?.features?.length) return collection;

    try {
      const area = d3.geoArea(collection);
      if (area <= Math.PI) return collection;
    } catch (error) {
      return collection;
    }

    return {
      type: 'FeatureCollection',
      features: collection.features.map((feature) => ({
        ...feature,
        properties: { ...(feature.properties || {}) },
        geometry: rewindGeometryForD3(feature.geometry),
      })),
    };
  }

  function buildProjectionFitCollection(collection) {
    const focusFeatures = (collection.features || []).filter((feature) => !REMOTE_FOCUS_STATES.has(getFeatureStateName(feature)));
    const sessionPoints = Object.values(Data.CITY_COORDS || {})
      .filter((coords) => Array.isArray(coords) && coords.length >= 2)
      .map((coords) => ({
        type: 'Feature',
        properties: {},
        geometry: { type: 'Point', coordinates: coords },
      }));

    return {
      type: 'FeatureCollection',
      features: [
        ...(focusFeatures.length ? focusFeatures : collection.features || []),
        ...sessionPoints,
      ],
    };
  }

  function positionTooltip(refs, event, title, info, cap, count) {
    refs.tooltipName.textContent = title || '';
    refs.tooltipInfo.textContent = info || '';
    refs.tooltipCap.textContent = cap || '';
    refs.tooltipCount.textContent = count || '';
    refs.tooltip.classList.add('show');
    refs.tooltip.setAttribute('aria-hidden', 'false');

    const wrapperRect = refs.mapWrap.getBoundingClientRect();
    const tooltipRect = refs.tooltip.getBoundingClientRect();
    const padding = 12;
    const targetRect = event?.currentTarget?.getBoundingClientRect?.() || null;
    let clientX = event?.clientX;
    let clientY = event?.clientY;

    if (typeof clientX !== 'number' || typeof clientY !== 'number' || Number.isNaN(clientX) || Number.isNaN(clientY)) {
      if (targetRect) {
        clientX = targetRect.left + (targetRect.width / 2);
        clientY = targetRect.top + (targetRect.height / 2);
      } else {
        clientX = wrapperRect.left + (wrapperRect.width / 2);
        clientY = wrapperRect.top + 32;
      }
    }

    let left = clientX - wrapperRect.left + 16;
    let top = clientY - wrapperRect.top + 16;

    if (left + tooltipRect.width + padding > wrapperRect.width) {
      left = Math.max(padding, wrapperRect.width - tooltipRect.width - padding);
    }
    if (top + tooltipRect.height + padding > wrapperRect.height) {
      top = Math.max(padding, wrapperRect.height - tooltipRect.height - padding);
    }

    refs.tooltip.style.left = `${left}px`;
    refs.tooltip.style.top = `${top}px`;
  }

  function hideTooltip(refs) {
    refs.tooltip.classList.remove('show');
    refs.tooltip.setAttribute('aria-hidden', 'true');
  }

  function createMapController({ state, elements, actions }) {
    const refs = elements;
    const rawGeo = mapData.MAP_GEO || mapData.BHUVAN_GEO || mapData.SOI_GEO || null;
    const rawFeatureCollection = rawGeo && rawGeo.type === 'FeatureCollection'
      ? rawGeo
      : rawGeo && rawGeo.features
        ? { type: 'FeatureCollection', features: rawGeo.features }
        : null;

    if (!global.d3 || !rawFeatureCollection || !rawFeatureCollection.features?.length) {
      refs.mapStatus.textContent = 'Map geometry could not be loaded.';
      refs.mapStatus.hidden = false;
      refs.mapSvg.hidden = true;
      return {
        render() {},
        resize() {},
        setTheme() {},
      };
    }

    const d3 = global.d3;
    const featureCollection = maybeRewindFeatureCollection(d3, rawFeatureCollection);
    const projectionFitCollection = buildProjectionFitCollection(featureCollection);
    const svg = d3.select(refs.mapSvg);
    svg.attr('preserveAspectRatio', 'xMidYMid meet');
    const root = svg.append('g').attr('class', 'map-root');
    const fillLayer = root.append('g').attr('class', 'fill-layer');
    const borderLayer = root.append('g').attr('class', 'border-layer');
    const pinLayer = root.append('g').attr('class', 'pin-layer');
    const currentLayer = root.append('g').attr('class', 'current-layer');

    const stateIndex = buildStateSessionIndex();
    let projection = d3.geoMercator();
    let pathGenerator = d3.geoPath(projection);
    let currentTransform = d3.zoomIdentity;
    let baseReady = false;
    let activeSessionYear = null;

    function getSize() {
      const bounds = refs.mapWrap.getBoundingClientRect();
      const width = Math.max(320, Math.floor(bounds.width || refs.mapSvg.clientWidth || 960));
      const height = Math.max(360, Math.floor(bounds.height || refs.mapSvg.clientHeight || 620));
      return { width, height };
    }

    function rebuildProjection() {
      const { width, height } = getSize();
      svg.attr('viewBox', `0 0 ${width} ${height}`);
      const horizontalPadding = width < 640 ? 18 : 34;
      const verticalPadding = height < 520 ? 18 : 28;
      projection = d3.geoMercator().fitExtent(
        [[horizontalPadding, verticalPadding], [width - horizontalPadding, height - verticalPadding]],
        projectionFitCollection,
      );
      pathGenerator = d3.geoPath(projection);

      fillLayer.selectAll('path').attr('d', pathGenerator);
      borderLayer.selectAll('path').attr('d', pathGenerator);
      updatePins();
    }

    function getSessionsForState(feature) {
      return stateIndex.get(getFeatureStateName(feature)) || [];
    }

    function getActiveSession(year) {
      return Data.getSession?.(year) || Data.getNearestSession?.(year) || null;
    }

    function getActiveStateName(session) {
      return getStateNameForSession(session);
    }

    function showStateTooltip(event, feature) {
      const stateName = feature?.properties?.ST_NM || 'State';
      const sessions = getSessionsForState(feature);
      const lastSession = sessions[sessions.length - 1] || null;
      const firstSession = sessions[0] || null;
      const info = sessions.length
        ? `${sessions.length} session${sessions.length === 1 ? '' : 's'} mapped here`
        : 'No session mapped here';
      const cap = lastSession
        ? `Latest: ${lastSession.y} - ${lastSession.city}`
        : 'Click to keep the map focused on this region';
      const count = firstSession
        ? `First session: ${firstSession.y} - ${firstSession.city}`
        : '';
      positionTooltip(refs, event, stateName, info, cap, count);
    }

    function showPinTooltip(event, session) {
      const stateName = getStateNameForSession(session) || 'Session city';
      const info = `${session.city} | ${session.president}`;
      const cap = `${Data.getPhaseLabel?.(session.y) || session.phase}`;
      const count = stateName ? `${stateName}` : '';
      positionTooltip(refs, event, `${session.y} - ${session.city}`, info, cap, count);
    }

    function hideStateTooltip() {
      hideTooltip(refs);
    }

    function jumpToState(feature) {
      const sessions = getSessionsForState(feature);
      if (!sessions.length) {
        actions.announce('No INC session is mapped to this state.');
        return;
      }
      actions.setYear(sessions[sessions.length - 1].y);
    }

    function renderLegend() {
      clearNode(refs.legend);
      for (const phaseKey of Object.keys(Data.PHASES || {})) {
        const phase = Data.PHASES[phaseKey];
        const pill = createEl('div', 'legend-pill');
        const swatch = createEl('span', 'legend-swatch');
        swatch.style.background = phase.color;
        const label = createEl('span', '', phase.label);
        pill.appendChild(swatch);
        pill.appendChild(label);
        refs.legend.appendChild(pill);
      }
    }

    function drawBaseMap() {
      clearNode(fillLayer.node());
      clearNode(borderLayer.node());

      const fillSelection = fillLayer.selectAll('path.state-fill')
        .data(featureCollection.features, (feature, index) => feature.properties?.ST_NM || String(index));

      const fillEnter = fillSelection.enter().append('path')
        .attr('class', 'state-fill')
        .attr('tabindex', 0)
        .attr('role', 'button')
        .attr('aria-label', (feature) => `State ${feature.properties?.ST_NM || ''}`)
        .attr('d', pathGenerator)
        .on('mouseenter', (event, feature) => showStateTooltip(event, feature))
        .on('mousemove', (event, feature) => showStateTooltip(event, feature))
        .on('mouseleave', hideStateTooltip)
        .on('blur', hideStateTooltip)
        .on('click', (event, feature) => {
          event.preventDefault();
          hideTooltip(refs);
          jumpToState(feature);
        })
        .on('keydown', (event, feature) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            jumpToState(feature);
          }
        });

      fillSelection.merge(fillEnter).attr('d', pathGenerator);

      borderLayer.selectAll('path.state-border')
        .data(featureCollection.features, (feature, index) => feature.properties?.ST_NM || String(index))
        .join('path')
        .attr('class', 'state-border')
        .attr('d', pathGenerator);

      baseReady = true;
      refs.mapStatus.hidden = true;
      refs.mapSvg.hidden = false;
    }



    function updatePins() {
      const currentYear = clampYear(state.year);
      const queryText = String(state.searchQuery || '').trim().toLowerCase();
      const phaseFilter = state.phaseFilter || 'all';
      const importantOnly = Boolean(state.importantOnly);

      const matchesFilters = (session) => {
        if (phaseFilter !== 'all' && session.phase !== phaseFilter) return false;
        if (importantOnly && !Data.IMPORTANT_YEARS?.has(session.y)) return false;
        if (!queryText) return true;

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

        return searchText.includes(queryText);
      };

      const filteredYears = new Set(
        (Data.INC || []).filter(matchesFilters).map(s => s.y)
      );

      const historySessions = (Data.getSessionsUpTo?.(currentYear) || [])
        .filter((session) => Array.isArray(Data.CITY_COORDS?.[session.city]) && filteredYears.has(session.y));
      const activeSession = getActiveSession(currentYear);
      const transitionDuration = state.playing ? 650 : 220;
      const transitionEase = d3.easeCubicOut;

      const pinSelection = pinLayer.selectAll('g.history-pin')
        .data(historySessions, (session) => session.y);

      pinSelection.exit()
        .interrupt()
        .transition()
        .duration(180)
        .attr('opacity', 0)
        .attr('transform', function(session) {
          const t = d3.select(this).attr('transform') || '';
          const cleanT = t.replace(/\s*scale\([^)]*\)/, '');
          return `${cleanT} scale(0)`;
        })
        .remove();

      const pinEnter = pinSelection.enter().append('g')
        .attr('class', 'history-pin pin')
        .attr('opacity', 0)
        .attr('transform', (session) => {
          const [x, y] = projection(Data.CITY_COORDS[session.city]);
          return `translate(${x}, ${y}) scale(0)`;
        })
        .attr('tabindex', 0)
        .attr('role', 'button')
        .on('mouseenter', (event, session) => showPinTooltip(event, session))
        .on('mousemove', (event, session) => showPinTooltip(event, session))
        .on('mouseleave', hideStateTooltip)
        .on('blur', hideStateTooltip)
        .on('click', (event, session) => {
          event.preventDefault();
          hideTooltip(refs);
          actions.setYear(session.y);
        })
        .on('keydown', (event, session) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            actions.setYear(session.y);
          }
        });

      pinEnter.append('path')
        .attr('class', 'pin-path')
        .attr('d', 'M 0 0 C -3.5 -3.5 -7 -7 -7 -11 A 7 7 0 1 1 7 -11 C 7 -7 3.5 -3.5 0 0 Z')
        .attr('stroke', 'rgba(255,255,255,0.9)')
        .attr('stroke-width', 1);

      pinEnter.append('circle')
        .attr('class', 'pin-inner-dot')
        .attr('cx', 0)
        .attr('cy', -11)
        .attr('r', 2);

      const mergedPins = pinSelection.merge(pinEnter);

      mergedPins
        .interrupt()
        .transition()
        .duration(transitionDuration)
        .ease(transitionEase)
        .attr('opacity', (session) => (session.y === currentYear ? 1 : 0.75))
        .attr('transform', (session) => {
          const [x, y] = projection(Data.CITY_COORDS[session.city]);
          const scale = session.y === currentYear ? 1.4 : 1.0;
          return `translate(${x}, ${y}) scale(${scale})`;
        });

      mergedPins.select('.pin-path')
        .attr('fill', (session) => Data.getPhaseColor?.(session.y) || '#1a5276');

      const currentData = activeSession && Array.isArray(Data.CITY_COORDS?.[activeSession.city]) ? [activeSession] : [];
      const currentSelection = currentLayer.selectAll('g.current-session')
        .data(currentData, () => 'current');

      currentSelection.exit()
        .interrupt()
        .transition()
        .duration(180)
        .attr('opacity', 0)
        .remove();

      const currentEnter = currentSelection.enter().append('g').attr('class', 'current-session').attr('opacity', 0);
      currentEnter.append('circle').attr('class', 'current-halo').attr('cx', 0).attr('cy', 0).attr('r', 14).attr('fill', 'none').attr('stroke-width', 2);
      currentEnter.append('text').attr('class', 'current-label');

      // Append foreignObject for the details bubble above the pin
      const bubbleFO = currentEnter.append('foreignObject')
        .attr('class', 'playback-bubble-fo')
        .attr('width', 240)
        .attr('height', 110)
        .attr('x', -120)
        .attr('y', -130);
      
      // Append the HTML details bubble container inside it
      bubbleFO.append('xhtml:div')
        .attr('class', 'playback-bubble show');

      const mergedCurrent = currentSelection.merge(currentEnter);
      mergedCurrent
        .interrupt()
        .transition()
        .duration(transitionDuration)
        .ease(transitionEase)
        .attr('opacity', 1)
        .attr('transform', (session) => {
          const [x, y] = projection(Data.CITY_COORDS[session.city]);
          return `translate(${x}, ${y})`;
        });
      mergedCurrent.select('circle.current-halo')
        .interrupt()
        .transition()
        .duration(transitionDuration)
        .attr('stroke', Data.getPhaseColor?.(activeSession?.y) || '#1a5276');
      mergedCurrent.select('text.current-label')
        .attr('x', 0)
        .attr('y', 18)
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--txt)')
        .attr('font-size', 11)
        .attr('font-weight', 700)
        .attr('paint-order', 'stroke')
        .attr('stroke', 'var(--card, rgba(255,255,255,0.85))')
        .attr('stroke-width', 3.5)
        .text((session) => `${session.y} — ${session.city}`);

      // Handle the floating details bubble inside current-session group
      if (activeSession) {
        const eventText = activeSession.ev?.[0] || activeSession.desc || '';
        mergedCurrent.select('.playback-bubble').html(`
          <div class="bubble-header">
            <span class="bubble-year">${activeSession.y}</span>
            <span class="bubble-city">${activeSession.city}</span>
          </div>
          <div class="bubble-event">${eventText}</div>
        `);
      }

      const activeStateName = getActiveStateName(activeSession);
      fillLayer.selectAll('path.state-fill')
        .classed('is-active', (feature) => getFeatureStateName(feature) === normalizeText(activeStateName || ''));

      if (baseReady) {
        refs.mapStatus.hidden = true;
      }
      activeSessionYear = activeSession?.y || null;
    }

    const zoomBehavior = d3.zoom()
      .scaleExtent([1, 6])
      .on('zoom', (event) => {
        currentTransform = event.transform;
        root.attr('transform', currentTransform);
      });

    svg.call(zoomBehavior);

    refs.zoomIn.addEventListener('click', () => {
      svg.transition().duration(180).call(zoomBehavior.scaleBy, 1.2);
    });

    refs.zoomOut.addEventListener('click', () => {
      svg.transition().duration(180).call(zoomBehavior.scaleBy, 1 / 1.2);
    });

    refs.zoomReset.addEventListener('click', () => {
      svg.transition().duration(180).call(zoomBehavior.transform, d3.zoomIdentity);
    });

    refs.mapSvg.addEventListener('mouseleave', () => {
      hideTooltip(refs);
    });

    refs.mapSvg.addEventListener('pointerdown', () => {
      hideTooltip(refs);
    });

    renderLegend();
    drawBaseMap();
    rebuildProjection();

    function render(year = state.year) {
      if (!baseReady) {
        drawBaseMap();
      }
      updatePins(clampYear(year));
    }

    function resize() {
      rebuildProjection();
      updatePins();
    }

    function setTheme() {
      render(state.year);
    }

    return {
      render,
      resize,
      setTheme,
      getCurrentSessionYear() {
        return activeSessionYear;
      },
    };
  }

  global.CongressMap = Object.freeze({
    createMapController,
  });
})(window);
