const AUDIT_INDEX_ENDPOINT = '/api/gene-reviews-audit/index';
const AUDIT_CHAPTER_ENDPOINT = '/api/gene-reviews-audit/chapters/';

const state = {
  index: null,
  chapter: null,
  payload: null,
  currentReviewId: null,
  filter: 'all'
};

const assertionListEl = document.getElementById('gr-assertion-list');
const chapterSelectEl = document.getElementById('gr-chapter-select');
const chapterCanvasEl = document.getElementById('gr-chapter-canvas');
const detailPanelEl = document.getElementById('gr-detail-panel');
const chapterTitleEl = document.getElementById('gr-chapter-title');
const chapterMetaEl = document.getElementById('gr-chapter-meta');
const sourceLinkEl = document.getElementById('gr-source-link');
const summaryCopyEl = document.getElementById('gr-summary-copy');

const paragraphMap = new Map();
const sentenceMap = new Map();

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function verdictClass(verdict) {
  return String(verdict || '').toLowerCase();
}

function queryParams() {
  return new URLSearchParams(window.location.search);
}

function updateLocation(chapterSlug, reviewId) {
  const params = queryParams();
  if (chapterSlug) params.set('chapter', chapterSlug);
  const nextUrl = `${window.location.pathname}?${params.toString()}${reviewId ? `#${reviewId}` : ''}`;
  window.history.replaceState({}, '', nextUrl);
}

function filteredItems() {
  const items = state.payload?.items || [];
  return items.filter((item) => {
    if (state.filter === 'all') return true;
    if (state.filter === 'review') return !item.auto_accept_eligible;
    if (state.filter === 'eligible') return item.auto_accept_eligible;
    if (state.filter === 'failed') return item.verdict === 'FAILED';
    if (state.filter === 'flagged') return item.verdict === 'FLAGGED';
    return true;
  });
}

function renderEmptyCanvas(title, text) {
  chapterCanvasEl.innerHTML = `
    <div class="gr-empty">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(text)}</p>
    </div>
  `;
}

function buildSentenceHtml(sentence) {
  return `
    <span
      class="gr-sentence"
      id="sentence-${escapeHtml(sentence.sentence_id)}"
      data-sentence-id="${escapeHtml(sentence.sentence_id)}"
      data-text="${escapeHtml(sentence.text)}"
      data-start="${Number(sentence.char_start || 0)}"
    >${escapeHtml(sentence.text)}</span>
  `;
}

function renderChapterCanvas() {
  paragraphMap.clear();
  sentenceMap.clear();

  if (!state.payload?.sections?.length) {
    renderEmptyCanvas('Audit payload missing', 'This chapter has no rendered audit sections yet.');
    return;
  }

  chapterCanvasEl.innerHTML = state.payload.sections
    .map(
      (section) => `
        <section class="gr-section" id="${escapeHtml(section.section_id)}">
          <h3>${escapeHtml(section.section_heading || 'Section')}</h3>
          ${(section.paragraphs || [])
            .map(
              (paragraph) => `
                <article class="gr-paragraph" id="paragraph-${escapeHtml(paragraph.paragraph_id)}" data-local-domains="${escapeHtml((paragraph.local_clinical_domains || []).map((domain) => domain.label).join(', '))}">
                  ${(paragraph.sentences || []).map((sentence) => buildSentenceHtml(sentence)).join(' ')}
                </article>
              `
            )
            .join('')}
        </section>
      `
    )
    .join('');

  chapterCanvasEl.querySelectorAll('.gr-paragraph').forEach((element) => {
    paragraphMap.set(element.id.replace('paragraph-', ''), element);
  });
  chapterCanvasEl.querySelectorAll('.gr-sentence').forEach((element) => {
    sentenceMap.set(element.dataset.sentenceId, element);
  });
}

function renderChapterHeader() {
  const chapter = state.payload?.chapter || state.chapter || {};
  const domainLabels = Array.isArray(state.chapter?.chapter_domains)
    ? state.chapter.chapter_domains.map((domain) => domain.label).filter(Boolean)
    : [];
  const genes = Array.isArray(state.chapter?.genes) ? state.chapter.genes.filter(Boolean) : [];
  chapterTitleEl.textContent = chapter.chapter_title || chapter.chapter_key || 'GeneReviews audit';
  chapterMetaEl.textContent = [
    chapter.nbk_id,
    state.payload?.items?.length ? `${state.payload.items.length} assertions` : '',
    domainLabels.length ? `Domains: ${domainLabels.join(', ')}` : '',
    genes.length ? `Genes: ${genes.join(', ')}` : ''
  ]
    .filter(Boolean)
    .join(' · ');
  sourceLinkEl.href = chapter.source_url || '#';
}

function renderAssertionList() {
  const items = filteredItems();
  assertionListEl.innerHTML = items
    .map(
      (item) => `
        <button class="gr-assertion-card ${item.review_id === state.currentReviewId ? 'is-active' : ''}" type="button" data-review-id="${escapeHtml(item.review_id)}">
          <div class="gr-chip-row">
            <span class="gr-chip ${verdictClass(item.verdict)}">${escapeHtml(item.verdict)}</span>
            <span class="gr-chip">${escapeHtml(item.status)}</span>
            <span class="gr-chip">${escapeHtml(item.section_heading || 'No section')}</span>
          </div>
          <h3>${escapeHtml(item.hpo_label || item.hpo_id)}</h3>
          <p class="gr-card-meta">
            ${escapeHtml(item.failed_checks?.[0] || item.flagged_checks?.[0] || (item.auto_accept_eligible ? 'Auto-accept eligible' : 'Verifier requires review'))}
          </p>
        </button>
      `
    )
    .join('');

  assertionListEl.querySelectorAll('[data-review-id]').forEach((button) => {
    button.addEventListener('click', () => selectReviewItem(button.dataset.reviewId));
  });
}

function resetHighlights() {
  for (const paragraph of paragraphMap.values()) {
    paragraph.classList.remove('is-active');
  }
  for (const sentence of sentenceMap.values()) {
    sentence.classList.remove('is-active');
    sentence.innerHTML = escapeHtml(sentence.dataset.text || '');
  }
}

function buildHighlightHtml(sentenceText, sentenceStart, spans) {
  const source = String(sentenceText || '');
  const intervals = [];
  for (const span of spans || []) {
    const start = Number(span.char_start);
    const end = Number(span.char_end);
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
    const localStart = start - sentenceStart;
    const localEnd = end - sentenceStart;
    if (localStart < 0 || localEnd <= localStart || localEnd > source.length) continue;
    intervals.push({ start: localStart, end: localEnd, label: span.key });
  }
  if (!intervals.length) return escapeHtml(source);

  const events = [];
  for (const interval of intervals) {
    events.push({ pos: interval.start, type: 'start', label: interval.label });
    events.push({ pos: interval.end, type: 'end', label: interval.label });
  }
  events.sort((a, b) => a.pos - b.pos || (a.type === 'end' ? -1 : 1));

  let cursor = 0;
  const active = [];
  let html = '';

  for (const event of events) {
    if (event.pos > cursor) {
      const text = escapeHtml(source.slice(cursor, event.pos));
      html += active.length ? `<mark class="${active.join(' ')}">${text}</mark>` : text;
      cursor = event.pos;
    }
    if (event.type === 'start') {
      if (!active.includes(event.label)) active.push(event.label);
    } else {
      const index = active.indexOf(event.label);
      if (index >= 0) active.splice(index, 1);
    }
  }

  if (cursor < source.length) {
    const text = escapeHtml(source.slice(cursor));
    html += active.length ? `<mark class="${active.join(' ')}">${text}</mark>` : text;
  }

  return html;
}

function renderDetail(item) {
  const localDomains = Array.isArray(item.local_clinical_domains) ? item.local_clinical_domains : [];
  const localDomainsHtml = localDomains.length
    ? localDomains.map((domain) => `<li><strong>${escapeHtml(domain.label || domain.key)}:</strong> ${escapeHtml((domain.evidence_headings || []).join(', ') || (domain.evidence_snippets || [])[0] || '')}</li>`).join('')
    : '<li>None</li>';
  const spansHtml = (item.spans || []).length
    ? item.spans
        .map(
          (span) =>
            `<li><strong>${escapeHtml(span.label)}:</strong> ${escapeHtml(span.text || 'No stored span text')}</li>`
        )
        .join('')
    : '<li>None</li>';

  detailPanelEl.innerHTML = `
    <h3>${escapeHtml(item.hpo_label || item.hpo_id)}</h3>
    <div class="gr-chip-row">
      <span class="gr-chip ${verdictClass(item.verdict)}">${escapeHtml(item.verdict)}</span>
      <span class="gr-chip">${escapeHtml(item.status)}</span>
      ${item.auto_accept_eligible ? '<span class="gr-chip">Auto-accept eligible</span>' : '<span class="gr-chip">Needs review</span>'}
    </div>
    <p>${escapeHtml(item.section_heading || 'No section')} · ${escapeHtml(item.paragraph_id || 'No paragraph')} · ${escapeHtml(item.sentence_id || 'No sentence')}</p>
    <div class="gr-detail-block">
      <h4>Local clinical domains</h4>
      <ul class="gr-detail-list">${localDomainsHtml}</ul>
    </div>
    <div class="gr-detail-block">
      <h4>Sentence</h4>
      <pre>${escapeHtml(item.sentence_text || '')}</pre>
    </div>
    <div class="gr-detail-block">
      <h4>Span texts</h4>
      <ul class="gr-detail-list">${spansHtml}</ul>
    </div>
    <div class="gr-detail-block">
      <h4>Failed checks</h4>
      <ul class="gr-detail-list">${(item.failed_checks || []).length ? item.failed_checks.map((check) => `<li>${escapeHtml(check)}</li>`).join('') : '<li>None</li>'}</ul>
    </div>
    <div class="gr-detail-block">
      <h4>Flagged checks</h4>
      <ul class="gr-detail-list">${(item.flagged_checks || []).length ? item.flagged_checks.map((check) => `<li>${escapeHtml(check)}</li>`).join('') : '<li>None</li>'}</ul>
    </div>
    <div class="gr-detail-block">
      <h4>Auto-accept reasons</h4>
      <pre>${escapeHtml((item.auto_accept_reasons || []).join('\n') || 'None')}</pre>
    </div>
    <div class="gr-detail-block">
      <h4>Review link</h4>
      <p><a class="gr-link-button" href="${escapeHtml(item.hosted_review_href || '#')}">Deep-link this assertion</a></p>
    </div>
  `;
}

function selectReviewItem(reviewId) {
  const item = (state.payload?.items || []).find((entry) => entry.review_id === reviewId);
  if (!item) return;

  state.currentReviewId = reviewId;
  updateLocation(state.chapter?.chapter_slug || state.chapter?.chapter_key || state.chapter?.nbk_id, reviewId);
  renderAssertionList();
  resetHighlights();

  const paragraph = paragraphMap.get(item.paragraph_id);
  const sentence = sentenceMap.get(item.sentence_id);
  if (paragraph) paragraph.classList.add('is-active');
  if (sentence) {
    sentence.classList.add('is-active');
    sentence.innerHTML = buildHighlightHtml(sentence.dataset.text || '', Number(sentence.dataset.start || 0), item.spans || []);
    sentence.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  renderDetail(item);
}

function populateChapterSelect() {
  const chapters = state.index?.chapters || [];
  chapterSelectEl.innerHTML = chapters
    .map(
      (chapter) =>
        `<option value="${escapeHtml(chapter.chapter_slug)}">${escapeHtml(chapter.chapter_title || chapter.nbk_id || chapter.chapter_key)}</option>`
    )
    .join('');

  chapterSelectEl.addEventListener('change', () => {
    loadChapter(chapterSelectEl.value);
  });
}

async function loadAuditIndex() {
  const response = await fetch(AUDIT_INDEX_ENDPOINT, { headers: { accept: 'application/json' } });
  const payload = await response.json();
  if (!payload.success || !payload.ready) {
    throw new Error(payload.message || 'Audit index unavailable');
  }
  state.index = payload;
  summaryCopyEl.textContent = `${payload.summary?.review_rows || payload.chapters.length} chapter review queues are available.`;
  populateChapterSelect();
}

async function loadChapter(chapterSlug) {
  chapterCanvasEl.innerHTML = '<div class="gr-empty"><h3>Loading chapter…</h3><p>Fetching review-ready audit data.</p></div>';
  const response = await fetch(`${AUDIT_CHAPTER_ENDPOINT}${encodeURIComponent(chapterSlug)}`, {
    headers: { accept: 'application/json' }
  });
  const payload = await response.json();
  if (!payload.success || !payload.payload) {
    renderEmptyCanvas('Chapter unavailable', payload.error || 'Audit payload missing for this chapter.');
    return;
  }

  state.chapter = payload.chapter;
  state.payload = payload.payload;
  chapterSelectEl.value = payload.chapter.chapter_slug;
  renderChapterHeader();
  renderChapterCanvas();
  renderAssertionList();

  const targetReviewId = window.location.hash.replace(/^#/, '') || state.payload.items?.[0]?.review_id;
  if (targetReviewId) {
    selectReviewItem(targetReviewId);
  }
}

function bindFilterButtons() {
  document.querySelectorAll('.gr-filter').forEach((button) => {
    button.addEventListener('click', () => {
      state.filter = button.dataset.filter;
      document.querySelectorAll('.gr-filter').forEach((el) => el.classList.toggle('is-active', el === button));
      renderAssertionList();
    });
  });
}

async function init() {
  bindFilterButtons();
  try {
    await loadAuditIndex();
    const requestedChapter = queryParams().get('chapter') || state.index.chapters?.[0]?.chapter_slug;
    if (requestedChapter) {
      await loadChapter(requestedChapter);
    } else {
      renderEmptyCanvas('No audit chapters found', 'Run the verifier and manifest export first.');
    }
  } catch (error) {
    console.error('[genovy] failed to load GeneReviews audit app', error);
    renderEmptyCanvas('Audit unavailable', 'The hosted audit artifacts are not ready on this deployment yet.');
    summaryCopyEl.textContent = 'Audit artifacts are not ready yet.';
  }
}

init();
