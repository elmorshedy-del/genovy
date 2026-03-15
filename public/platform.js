const PLATFORM_OVERVIEW_ENDPOINT = '/api/platform/overview';

function formatCount(value) {
  return new Intl.NumberFormat().format(Number(value) || 0);
}

function formatModeLabel(value) {
  return String(value || 'website_only').replaceAll('_', ' ');
}

function formatDate(value) {
  if (!value) return 'Pending first successful sync';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Pending first successful sync';

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
}

function sumCounts(rows) {
  return rows.reduce((total, row) => total + (Number(row.count) || 0), 0);
}

function sumCountsByKey(rows, key) {
  return rows.reduce((total, row) => total + (Number(row[key]) || 0), 0);
}

function setTextContent(id, text) {
  const node = document.getElementById(id);
  if (!node) return;
  node.textContent = text;
}

function renderSummaryGrid(containerId, rows, keyName, emptyMessage) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!rows.length) {
    container.innerHTML = `<p class="empty-state">${emptyMessage}</p>`;
    return;
  }

  container.innerHTML = rows
    .map(
      (row) => `
        <article class="summary-chip-card">
          <p>${row[keyName].replaceAll('_', ' ')}</p>
          <strong>${formatCount(row.count)}</strong>
        </article>
      `
    )
    .join('');
}

function renderSources(sources) {
  const container = document.getElementById('source-status-grid');
  if (!container) return;

  if (!sources.length) {
    container.innerHTML = '<p class="empty-state">No source catalog is available yet.</p>';
    return;
  }

  container.innerHTML = sources
    .map((source) => {
      const scopeChips = source.entityScopeTokens
        .map((token) => `<span class="tag-pill">${token}</span>`)
        .join('');
      const summaryItems = Object.entries(source.lastSummary || {})
        .slice(0, 3)
        .map(([key, value]) => `<span class="tag-pill tag-pill-soft">${key.replaceAll('_', ' ')}: ${value}</span>`)
        .join('');
      const stateLabel = source.hasSuccessfulSync ? 'Live' : 'Catalog only';

      return `
        <article class="source-card">
          <div class="source-card-head">
            <div>
              <p class="source-eyebrow">${source.sourceKey.replaceAll('_', ' ')}</p>
              <h4>${source.displayName}</h4>
            </div>
            <span class="state-pill ${source.hasSuccessfulSync ? 'is-live' : 'is-muted'}">${stateLabel}</span>
          </div>
          <p class="source-description">${source.description}</p>
          <div class="tag-row">${scopeChips}</div>
          <div class="source-meta">
            <span>Refresh: ${source.updateFrequency}</span>
            <span>Last sync: ${formatDate(source.lastSuccessfulAt)}</span>
          </div>
          ${
            summaryItems
              ? `<div class="tag-row tag-row-spaced">${summaryItems}</div>`
              : ''
          }
        </article>
      `;
    })
    .join('');
}

function renderSyncList(containerId, items, emptyMessage) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!items.length) {
    container.innerHTML = `<p class="empty-state">${emptyMessage}</p>`;
    return;
  }

  container.innerHTML = items
    .map(
      (item) => `
        <article class="activity-item">
          <div>
            <p class="activity-title">${item.sourceKey.replaceAll('_', ' ')}</p>
            <p class="activity-meta">${
              item.status ? item.status : 'running'
            } · ${formatDate(item.startedAt)}</p>
          </div>
          <span class="tag-pill">${item.syncRunId ? `Run ${item.syncRunId}` : 'Active'}</span>
        </article>
      `
    )
    .join('');
}

function setPlatformStatus(overview) {
  const dot = document.getElementById('platform-health-dot');
  const label = document.getElementById('platform-health-label');
  const note = document.getElementById('platform-runtime-note');
  if (!dot || !label || !note) return;

  dot.classList.remove('is-live', 'is-warn');

  if (overview.warning) {
    dot.classList.add('is-warn');
    label.textContent = 'Public platform live, data layer partially unavailable';
    note.textContent = overview.warning;
    return;
  }

  if (overview.runtime?.knowledgeApiReady) {
    dot.classList.add('is-live');
    label.textContent = 'Knowledge network connected';
    note.textContent = overview.runtime.adminApiReady
      ? 'Public site, knowledge graph, and admin sync controls are available.'
      : 'Public site and knowledge graph are available. Admin sync controls are still gated.';
    return;
  }

  dot.classList.add('is-warn');
  label.textContent = 'Public platform live, knowledge layer pending';
  note.textContent = 'The public site is live while the database-backed knowledge layer is still being configured.';
}

async function hydratePlatformOverview() {
  const overviewRoot = document.querySelector('[data-platform-overview]');
  if (!overviewRoot) return;

  try {
    const response = await fetch(PLATFORM_OVERVIEW_ENDPOINT, {
      headers: { accept: 'application/json' }
    });
    if (!response.ok) {
      throw new Error(`Platform overview failed: ${response.status}`);
    }

    const payload = await response.json();
    const overview = payload.overview || {};
    const summary = overview.summary || { entities: [], relationships: [], canonical: {} };
    const canonicalSummary = summary.canonical || { concepts: [], relationships: [] };
    const sources = overview.sources || [];
    const activeSyncs = overview.activeSyncs || [];
    const recentSyncRuns = overview.recentSyncRuns || [];

    setTextContent('platform-runtime-mode', formatModeLabel(overview.runtime?.mode));
    setTextContent('platform-entity-total', formatCount(sumCounts(summary.entities)));
    setTextContent('platform-relationship-total', formatCount(sumCounts(summary.relationships)));
    setTextContent(
      'platform-canonical-concept-total',
      formatCount(sumCountsByKey(canonicalSummary.concepts, 'concept_count'))
    );
    setTextContent(
      'platform-canonical-relationship-total',
      formatCount(sumCounts(canonicalSummary.relationships))
    );
    setTextContent('platform-source-total', formatCount(sources.length));

    renderSummaryGrid(
      'entity-summary-grid',
      summary.entities,
      'entity_type',
      'Entity counts will appear here after the first source import completes.'
    );
    renderSummaryGrid(
      'relationship-summary-grid',
      summary.relationships,
      'predicate_key',
      'Relationship counts will appear here after the first source import completes.'
    );
    renderSources(sources);
    renderSyncList('active-sync-list', activeSyncs, 'No active source syncs are currently running.');
    renderSyncList('recent-sync-list', recentSyncRuns, 'No source sync history has been recorded yet.');
    setPlatformStatus(overview);
  } catch (_error) {
    setTextContent('platform-runtime-mode', 'degraded');
    setTextContent('platform-canonical-concept-total', '0');
    setTextContent('platform-canonical-relationship-total', '0');
    setTextContent('platform-runtime-note', 'The platform page loaded, but live overview data could not be fetched.');
    renderSummaryGrid('entity-summary-grid', [], 'entity_type', 'Live platform data is temporarily unavailable.');
    renderSummaryGrid(
      'relationship-summary-grid',
      [],
      'predicate_key',
      'Live platform data is temporarily unavailable.'
    );
    renderSources([]);
    renderSyncList('active-sync-list', [], 'Live sync state is temporarily unavailable.');
    renderSyncList('recent-sync-list', [], 'Live sync history is temporarily unavailable.');
  }
}

hydratePlatformOverview();
