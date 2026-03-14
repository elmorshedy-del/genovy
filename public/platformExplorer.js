const KNOWLEDGE_SEARCH_ENDPOINT = '/api/knowledge/search';
const ENTITY_DETAIL_ENDPOINT_PREFIX = '/api/knowledge/entities/';
const DEFAULT_SEARCH_QUERY = 'muscle weakness';
const DETAIL_RELATIONSHIP_PREVIEW_LIMIT = 6;
const SEARCH_DEBOUNCE_MS = 260;

let activeSearchRequestId = 0;
let searchDebounceTimeout = null;

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatCount(value) {
  return new Intl.NumberFormat().format(Number(value) || 0);
}

function titleizeToken(value) {
  return String(value || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function renderExplorerMessage(container, message) {
  if (!container) return;
  container.innerHTML = `<p class="empty-state">${escapeHtml(message)}</p>`;
}

function buildResultMarkup(result) {
  const description = result.description ? `<p>${escapeHtml(result.description)}</p>` : '';
  return `
    <button class="result-card" type="button" data-curie="${escapeHtml(result.canonical_curie)}">
      <div class="result-card-head">
        <div>
          <p class="result-type">${escapeHtml(titleizeToken(result.entity_type))}</p>
          <h4>${escapeHtml(result.canonical_label)}</h4>
        </div>
        <span class="tag-pill">${escapeHtml(result.canonical_curie)}</span>
      </div>
      ${description}
      <div class="result-signals">
        <span class="tag-pill tag-pill-soft">Outbound ${formatCount(result.outbound_count)}</span>
        <span class="tag-pill tag-pill-soft">Inbound ${formatCount(result.inbound_count)}</span>
      </div>
    </button>
  `;
}

function renderSearchResults(results) {
  const container = document.getElementById('graph-search-results');
  if (!container) return;

  if (!results.length) {
    renderExplorerMessage(container, 'No live graph matches yet. Try a broader disease, phenotype, or gene term.');
    return;
  }

  container.innerHTML = results.map((result) => buildResultMarkup(result)).join('');
}

function summarizeRelationshipItem(item, roleKey, labelKey) {
  const counterpart = item[labelKey] ? escapeHtml(item[labelKey]) : 'Unknown entity';
  return `
    <article class="relationship-card">
      <p class="relationship-predicate">${escapeHtml(titleizeToken(item.predicate_key))}</p>
      <h5>${counterpart}</h5>
      <p class="relationship-meta">${escapeHtml(item[roleKey])}</p>
    </article>
  `;
}

function renderEntityDetail(detail) {
  const container = document.getElementById('graph-entity-detail');
  if (!container) return;

  const entity = detail.entity || {};
  const outbound = (detail.outboundRelationships || []).slice(0, DETAIL_RELATIONSHIP_PREVIEW_LIMIT);
  const inbound = (detail.inboundRelationships || []).slice(0, DETAIL_RELATIONSHIP_PREVIEW_LIMIT);
  const aliases = detail.aliases || [];
  const xrefs = detail.xrefs || [];
  const description = entity.description ? `<p class="entity-description">${escapeHtml(entity.description)}</p>` : '';
  const aliasPreview = aliases
    .slice(0, 6)
    .map((alias) => `<span class="tag-pill">${escapeHtml(alias.alias_label)}</span>`)
    .join('');
  const xrefPreview = xrefs
    .slice(0, 6)
    .map((xref) => `<span class="tag-pill">${escapeHtml(xref.xref_curie)}</span>`)
    .join('');

  container.innerHTML = `
    <div class="entity-header">
      <div>
        <p class="result-type">${escapeHtml(titleizeToken(entity.entity_type || 'entity'))}</p>
        <h4>${escapeHtml(entity.canonical_label || 'Unknown entity')}</h4>
      </div>
      <span class="tag-pill">${escapeHtml(entity.canonical_curie || '')}</span>
    </div>
    ${description}
    <div class="entity-stats">
      <article class="entity-stat-card">
        <p>Aliases</p>
        <strong>${formatCount(aliases.length)}</strong>
      </article>
      <article class="entity-stat-card">
        <p>Cross references</p>
        <strong>${formatCount(xrefs.length)}</strong>
      </article>
      <article class="entity-stat-card">
        <p>Outbound links</p>
        <strong>${formatCount(detail.outboundCount)}</strong>
      </article>
      <article class="entity-stat-card">
        <p>Inbound links</p>
        <strong>${formatCount(detail.inboundCount)}</strong>
      </article>
    </div>
    <div class="entity-chip-groups">
      ${aliasPreview ? `<div><p class="mini-heading">Alias preview</p><div class="tag-row">${aliasPreview}</div></div>` : ''}
      ${xrefPreview ? `<div><p class="mini-heading">Cross-reference preview</p><div class="tag-row">${xrefPreview}</div></div>` : ''}
    </div>
    <div class="relationship-columns">
      <div>
        <p class="mini-heading">Outbound relationship preview</p>
        <div class="relationship-list">
          ${
            outbound.length
              ? outbound
                  .map((item) => summarizeRelationshipItem(item, 'object_curie', 'object_label'))
                  .join('')
              : '<p class="empty-state">No outbound links in the current preview.</p>'
          }
        </div>
      </div>
      <div>
        <p class="mini-heading">Inbound relationship preview</p>
        <div class="relationship-list">
          ${
            inbound.length
              ? inbound
                  .map((item) => summarizeRelationshipItem(item, 'subject_curie', 'subject_label'))
                  .join('')
              : '<p class="empty-state">No inbound links in the current preview.</p>'
          }
        </div>
      </div>
    </div>
  `;
}

async function loadEntityDetail(curie) {
  const container = document.getElementById('graph-entity-detail');
  renderExplorerMessage(container, 'Loading connected evidence...');

  try {
    const response = await fetch(`${ENTITY_DETAIL_ENDPOINT_PREFIX}${encodeURIComponent(curie)}`, {
      headers: { accept: 'application/json' }
    });
    if (!response.ok) {
      throw new Error(`Entity detail failed: ${response.status}`);
    }
    const payload = await response.json();
    renderEntityDetail(payload.detail || {});
  } catch (_error) {
    renderExplorerMessage(container, 'Could not load the entity detail right now.');
  }
}

async function executeSearch(query) {
  const trimmedQuery = String(query || '').trim();
  const resultsContainer = document.getElementById('graph-search-results');
  if (!resultsContainer) return;

  if (trimmedQuery.length < 2) {
    renderExplorerMessage(resultsContainer, 'Type at least two characters to search the live graph.');
    return;
  }

  const requestId = ++activeSearchRequestId;
  renderExplorerMessage(resultsContainer, 'Searching the live graph...');

  try {
    const response = await fetch(`${KNOWLEDGE_SEARCH_ENDPOINT}?q=${encodeURIComponent(trimmedQuery)}&limit=8`, {
      headers: { accept: 'application/json' }
    });
    if (!response.ok) {
      throw new Error(`Graph search failed: ${response.status}`);
    }

    const payload = await response.json();
    if (requestId !== activeSearchRequestId) {
      return;
    }

    const results = payload.results || [];
    renderSearchResults(results);

    if (results.length) {
      loadEntityDetail(results[0].canonical_curie);
    } else {
      renderExplorerMessage(
        document.getElementById('graph-entity-detail'),
        'No entity selected because the search returned no live results.'
      );
    }
  } catch (_error) {
    if (requestId !== activeSearchRequestId) {
      return;
    }
    renderExplorerMessage(resultsContainer, 'Search is temporarily unavailable.');
    renderExplorerMessage(document.getElementById('graph-entity-detail'), 'Entity detail is temporarily unavailable.');
  }
}

function bindResultClicks() {
  const resultsContainer = document.getElementById('graph-search-results');
  if (!resultsContainer) return;

  resultsContainer.addEventListener('click', (event) => {
    const button = event.target.closest('[data-curie]');
    if (!button) return;
    loadEntityDetail(button.dataset.curie);
  });
}

function bindQueryPills(input) {
  const pills = document.querySelectorAll('[data-query]');
  pills.forEach((pill) => {
    pill.addEventListener('click', () => {
      input.value = pill.dataset.query || '';
      executeSearch(input.value);
    });
  });
}

function bindExplorer() {
  const form = document.getElementById('graph-search-form');
  const input = document.getElementById('graph-search-input');
  if (!form || !input) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    executeSearch(input.value);
  });

  input.addEventListener('input', () => {
    window.clearTimeout(searchDebounceTimeout);
    searchDebounceTimeout = window.setTimeout(() => {
      executeSearch(input.value);
    }, SEARCH_DEBOUNCE_MS);
  });

  bindQueryPills(input);
  bindResultClicks();

  input.value = DEFAULT_SEARCH_QUERY;
  executeSearch(DEFAULT_SEARCH_QUERY);
}

bindExplorer();
