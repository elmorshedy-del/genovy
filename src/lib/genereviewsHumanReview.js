function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function extractSpanText(chapterText, start, end) {
  const source = String(chapterText || '');
  const startIndex = Number(start);
  const endIndex = Number(end);
  if (!Number.isFinite(startIndex) || !Number.isFinite(endIndex)) return '';
  if (startIndex < 0 || endIndex <= startIndex || endIndex > source.length) return '';
  return source.slice(startIndex, endIndex);
}

function safeSlug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'item';
}

function buildReviewId(feature, index) {
  return `review-${index + 1}-${safeSlug(feature.hpo_id || feature.hpo_label || 'feature')}-${safeSlug(feature.status || 'present')}`;
}

function groupCheckNames(checks, status) {
  return (checks || [])
    .filter((check) => check.status === status)
    .map((check) => check.name);
}

function buildSpanRecord(key, label, start, end, chapterText) {
  const text = extractSpanText(chapterText, start, end).trim();
  return {
    key,
    label,
    char_start: start ?? null,
    char_end: end ?? null,
    text: text || null
  };
}

function buildHumanReviewRecord({ chapter, feature, verification, chapterText, reviewPagePath, index }) {
  const reviewId = buildReviewId(feature, index);
  const reviewHref = reviewPagePath ? `${reviewPagePath}#${reviewId}` : `#${reviewId}`;
  const hostedReviewHref = `/audit/genereviews?chapter=${encodeURIComponent(chapter.chapterKey || chapter.nbkId || '')}#${reviewId}`;
  const checks = verification?.checks || [];
  const sourceSpan = checks.find((check) => check.name === 'source_span');
  const phenotypeCheck = checks.find((check) => check.name === 'phenotype_presence');

  const spans = [
    buildSpanRecord('phenotype', 'Phenotype', feature.match_char_start, feature.match_char_end, chapterText),
    buildSpanRecord('frequency', 'Frequency', feature.frequency_char_start, feature.frequency_char_end, chapterText),
    buildSpanRecord('onset', 'Onset', feature.onset_char_start, feature.onset_char_end, chapterText),
    buildSpanRecord('progression', 'Progression', feature.progression_char_start, feature.progression_char_end, chapterText),
    buildSpanRecord(
      'treatment_response',
      'Treatment response',
      feature.treatment_response_char_start,
      feature.treatment_response_char_end,
      chapterText
    )
  ];

  return {
    review_id: reviewId,
    review_href: reviewHref,
    hosted_review_href: hostedReviewHref,
    chapter_key: chapter.chapterKey || '',
    nbk_id: chapter.nbkId || '',
    chapter_title: chapter.chapterTitle || '',
    source_url: chapter.nbkId ? `https://www.ncbi.nlm.nih.gov/books/${chapter.nbkId}/` : chapter.chapterUrl || '',
    hpo_id: feature.hpo_id,
    hpo_label: feature.hpo_label,
    status: feature.status || 'present',
    verdict: verification?.verdict || feature.verification_verdict || null,
    auto_accept_eligible: verification?.auto_accept_eligible ?? feature.auto_accept_eligible ?? false,
    auto_accept_reasons: verification?.auto_accept_reasons || feature.auto_accept_reasons || [],
    local_clinical_domains: Array.isArray(feature.local_clinical_domains) ? feature.local_clinical_domains : [],
    section_id: feature.section_id || null,
    section_heading: feature.section_heading || null,
    paragraph_id: feature.paragraph_id || null,
    sentence_id: feature.sentence_id || null,
    paragraph_char_start: feature.paragraph_char_start ?? null,
    paragraph_char_end: feature.paragraph_char_end ?? null,
    sentence_char_start: feature.sentence_char_start ?? null,
    sentence_char_end: feature.sentence_char_end ?? null,
    sentence_text: sourceSpan?.span_text || feature.source_sentence || null,
    paragraph_text: feature.paragraph || null,
    matched_phrase: phenotypeCheck?.matched_phrase || feature.match_text || null,
    match_span_text: phenotypeCheck?.match_span_text || extractSpanText(chapterText, feature.match_char_start, feature.match_char_end).trim() || null,
    frequency_raw: feature.frequency_raw || feature.frequency_value || null,
    onset_raw: feature.onset_raw || feature.onset_label || null,
    progression_raw: feature.progression_raw || null,
    treatment_response_raw: feature.treatment_response_raw || null,
    spans: spans.filter((span) => span.char_start != null || span.text),
    failed_checks: groupCheckNames(checks, 'fail'),
    flagged_checks: groupCheckNames(checks, 'flag'),
    checks
  };
}

function buildSectionsFromStructure(clinicalStructure) {
  const paragraphsById = new Map((clinicalStructure?.paragraphs || []).map((paragraph) => [paragraph.paragraph_id, paragraph]));
  return (clinicalStructure?.sections || []).map((section) => ({
    section_id: section.section_id,
    section_heading: section.section_heading,
    paragraphs: (section.paragraph_ids || [])
      .map((paragraphId) => paragraphsById.get(paragraphId))
      .filter(Boolean)
      .map((paragraph) => ({
        paragraph_id: paragraph.paragraph_id,
        paragraph_index: paragraph.paragraph_index,
        text: paragraph.text,
        local_clinical_domains: Array.isArray(paragraph.local_clinical_domains) ? paragraph.local_clinical_domains : [],
        section_id: paragraph.section_id || section.section_id,
        section_heading: paragraph.section_heading || section.section_heading,
        sentences: (paragraph.sentences || []).map((sentence) => ({
          sentence_id: sentence.sentence_id,
          sentence_index: sentence.sentence_index,
          text: sentence.text,
          char_start: sentence.char_start,
          char_end: sentence.char_end
        }))
      }))
  }));
}

export function buildChapterReviewArtifacts({
  chapter,
  features,
  verifications,
  chapterText,
  clinicalStructure,
  reviewPagePath
}) {
  const reviewItems = features.map((feature, index) =>
    buildHumanReviewRecord({
      chapter,
      feature,
      verification: verifications[index],
      chapterText,
      reviewPagePath,
      index
    })
  );

  const pagePayload = {
    chapter: {
      chapter_key: chapter.chapterKey || '',
      nbk_id: chapter.nbkId || '',
      chapter_title: chapter.chapterTitle || '',
      source_url: chapter.nbkId ? `https://www.ncbi.nlm.nih.gov/books/${chapter.nbkId}/` : chapter.chapterUrl || ''
    },
    sections: buildSectionsFromStructure(clinicalStructure),
    items: reviewItems
  };

  return {
    reviewItems,
    payload: pagePayload,
    html: buildChapterReviewHtml(pagePayload)
  };
}

function buildChapterReviewHtml(payload) {
  const title = escapeHtml(payload.chapter.chapter_title || payload.chapter.chapter_key || 'GeneReviews audit review');
  const json = escapeHtml(JSON.stringify(payload));
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title} Audit Review</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root {
      --bg: #f6f4ee;
      --panel: #fffdf7;
      --ink: #1e1b16;
      --muted: #6f665a;
      --line: #ddd4c6;
      --accent: #925c14;
      --verified: #2e7d32;
      --flagged: #b26a00;
      --failed: #b42318;
      --match: #ffec99;
      --freq: #c8f7c5;
      --onset: #cfe8ff;
      --progression: #ffd6e7;
      --treatment: #e4d7ff;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--ink);
      background: var(--bg);
    }
    .layout {
      display: grid;
      grid-template-columns: 360px minmax(0, 1fr);
      min-height: 100vh;
    }
    .sidebar, .detail {
      background: var(--panel);
      border-right: 1px solid var(--line);
    }
    .sidebar {
      display: grid;
      grid-template-rows: auto auto minmax(0, 1fr);
      position: sticky;
      top: 0;
      height: 100vh;
    }
    .header, .filters, .detail-panel {
      padding: 16px 18px;
    }
    .header h1 {
      margin: 0 0 6px;
      font-size: 18px;
      line-height: 1.3;
    }
    .header p, .detail-panel p { margin: 0; color: var(--muted); font-size: 13px; line-height: 1.45; }
    .filters { border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); display: flex; gap: 8px; flex-wrap: wrap; }
    .filters button {
      border: 1px solid var(--line);
      background: white;
      padding: 7px 10px;
      border-radius: 999px;
      cursor: pointer;
      font-size: 12px;
    }
    .filters button.active { border-color: var(--accent); color: var(--accent); font-weight: 600; }
    .review-list { overflow: auto; padding: 10px 10px 16px; }
    .review-item {
      display: block;
      width: 100%;
      border: 1px solid var(--line);
      background: white;
      border-radius: 14px;
      text-align: left;
      padding: 12px;
      margin-bottom: 10px;
      cursor: pointer;
    }
    .review-item.active { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(146, 92, 20, 0.12); }
    .review-item h3 { margin: 0 0 6px; font-size: 14px; line-height: 1.35; }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
    .chip {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      border: 1px solid var(--line);
      color: var(--muted);
    }
    .chip.verified { color: var(--verified); border-color: rgba(46,125,50,.35); }
    .chip.flagged { color: var(--flagged); border-color: rgba(178,106,0,.35); }
    .chip.failed { color: var(--failed); border-color: rgba(180,35,24,.35); }
    .main {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 360px;
      min-height: 100vh;
    }
    .chapter {
      padding: 28px 34px 40px;
      overflow: auto;
    }
    .detail {
      border-left: 1px solid var(--line);
      border-right: 0;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow: auto;
    }
    .section { margin-bottom: 28px; }
    .section h2 { margin: 0 0 12px; font-size: 20px; }
    .paragraph {
      background: rgba(255,255,255,0.6);
      border: 1px solid transparent;
      border-radius: 12px;
      padding: 12px 14px;
      margin-bottom: 12px;
    }
    .paragraph.active { border-color: rgba(146, 92, 20, 0.3); background: #fffaf0; }
    .sentence { line-height: 1.75; }
    .sentence.active {
      background: #fff7d6;
      border-radius: 8px;
      padding: 2px 4px;
      box-decoration-break: clone;
      -webkit-box-decoration-break: clone;
    }
    mark {
      padding: 0 1px;
      border-radius: 3px;
      color: inherit;
    }
    mark.match { background: var(--match); }
    mark.frequency { background: var(--freq); }
    mark.onset { background: var(--onset); }
    mark.progression { background: var(--progression); }
    mark.treatment_response { background: var(--treatment); }
    .detail-panel h2 { margin: 0 0 10px; font-size: 18px; }
    .detail-block { margin-top: 18px; }
    .detail-block h3 { margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); }
    .detail-block pre, .detail-block code {
      white-space: pre-wrap;
      word-break: break-word;
      font-family: ui-monospace, "SFMono-Regular", monospace;
      font-size: 12px;
      line-height: 1.5;
    }
    .detail-block pre {
      margin: 0;
      padding: 10px 12px;
      background: white;
      border: 1px solid var(--line);
      border-radius: 10px;
    }
    .detail-list { margin: 0; padding-left: 18px; }
    .detail-list li { margin: 0 0 6px; }
    .detail-link { color: var(--accent); text-decoration: none; }
  </style>
</head>
<body>
  <div class="layout">
    <aside class="sidebar">
      <div class="header">
        <h1>${title}</h1>
        <p>${escapeHtml(payload.chapter.nbk_id || '')}</p>
        <p><a class="detail-link" href="${escapeHtml(payload.chapter.source_url || '#')}" target="_blank" rel="noreferrer">Open source chapter</a></p>
      </div>
      <div class="filters">
        <button data-filter="all" class="active">All</button>
        <button data-filter="review">Needs review</button>
        <button data-filter="failed">Failed</button>
        <button data-filter="flagged">Flagged</button>
        <button data-filter="eligible">Eligible</button>
      </div>
      <div class="review-list" id="review-list"></div>
    </aside>
    <main class="main">
      <section class="chapter" id="chapter"></section>
      <aside class="detail">
        <div class="detail-panel" id="detail-panel">
          <h2>Select an assertion</h2>
          <p>The page will jump to the exact sentence and highlight the phenotype plus any metadata spans that were recorded.</p>
        </div>
      </aside>
    </main>
  </div>
  <script id="audit-payload" type="application/json">${json}</script>
  <script>
    const payload = JSON.parse(document.getElementById('audit-payload').textContent);
    const state = { filter: 'all', currentId: null };
    const reviewList = document.getElementById('review-list');
    const chapterEl = document.getElementById('chapter');
    const detailPanel = document.getElementById('detail-panel');
    const paragraphMap = new Map();
    const sentenceMap = new Map();

    function escapeHtmlJs(value) {
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function verdictClass(verdict) {
      return String(verdict || '').toLowerCase();
    }

    function filteredItems() {
      return payload.items.filter((item) => {
        if (state.filter === 'all') return true;
        if (state.filter === 'review') return !item.auto_accept_eligible;
        if (state.filter === 'eligible') return item.auto_accept_eligible;
        if (state.filter === 'failed') return item.verdict === 'FAILED';
        if (state.filter === 'flagged') return item.verdict === 'FLAGGED';
        return true;
      });
    }

    function renderChapter() {
      chapterEl.innerHTML = payload.sections.map((section) => {
        const paragraphs = section.paragraphs.map((paragraph) => {
          const sentences = paragraph.sentences.map((sentence) =>
            '<span class="sentence" id="sentence-' + escapeHtmlJs(sentence.sentence_id) + '" data-text="' + escapeHtmlJs(sentence.text) + '" data-sentence-id="' + escapeHtmlJs(sentence.sentence_id) + '">' + escapeHtmlJs(sentence.text) + '</span>'
          ).join(' ');
          return '<div class="paragraph" id="paragraph-' + escapeHtmlJs(paragraph.paragraph_id) + '">' + sentences + '</div>';
        }).join('');
        return '<section class="section" id="' + escapeHtmlJs(section.section_id) + '"><h2>' + escapeHtmlJs(section.section_heading || 'Section') + '</h2>' + paragraphs + '</section>';
      }).join('');
      chapterEl.querySelectorAll('.paragraph').forEach((el) => paragraphMap.set(el.id.replace('paragraph-', ''), el));
      chapterEl.querySelectorAll('.sentence').forEach((el) => sentenceMap.set(el.dataset.sentenceId, el));
    }

    function renderReviewList() {
      const items = filteredItems();
      reviewList.innerHTML = items.map((item) => {
        const classes = ['review-item'];
        if (item.review_id === state.currentId) classes.push('active');
        const flags = [];
        if (item.flagged_checks.length) flags.push(item.flagged_checks.join(', '));
        if (item.failed_checks.length) flags.push(item.failed_checks.join(', '));
        return '<button class="' + classes.join(' ') + '" data-review-id="' + escapeHtmlJs(item.review_id) + '">' +
          '<div class="chips">' +
            '<span class="chip ' + verdictClass(item.verdict) + '">' + escapeHtmlJs(item.verdict) + '</span>' +
            '<span class="chip">' + escapeHtmlJs(item.status) + '</span>' +
            '<span class="chip">' + escapeHtmlJs(item.section_heading || 'No section') + '</span>' +
          '</div>' +
          '<h3>' + escapeHtmlJs(item.hpo_label || item.hpo_id) + '</h3>' +
          '<p>' + escapeHtmlJs(flags[0] || (item.auto_accept_eligible ? 'Auto-accept eligible' : 'Verifier requires review')) + '</p>' +
        '</button>';
      }).join('');
      reviewList.querySelectorAll('[data-review-id]').forEach((button) => {
        button.addEventListener('click', () => selectItem(button.dataset.reviewId));
      });
    }

    function resetHighlights() {
      for (const el of sentenceMap.values()) {
        el.classList.remove('active');
        el.innerHTML = escapeHtmlJs(el.dataset.text || '');
      }
      for (const el of paragraphMap.values()) {
        el.classList.remove('active');
      }
    }

    function buildHighlightHtml(sentenceText, sentenceStart, spans) {
      const source = String(sentenceText || '');
      const intervals = [];
      for (const span of spans) {
        const start = Number(span.char_start);
        const end = Number(span.char_end);
        if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
        const localStart = start - sentenceStart;
        const localEnd = end - sentenceStart;
        if (localStart < 0 || localEnd > source.length || localEnd <= localStart) continue;
        intervals.push({ start: localStart, end: localEnd, label: span.key });
      }
      if (!intervals.length) return escapeHtmlJs(source);
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
          const text = escapeHtmlJs(source.slice(cursor, event.pos));
          if (active.length) {
            html += '<mark class="' + active.join(' ') + '">' + text + '</mark>';
          } else {
            html += text;
          }
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
        const text = escapeHtmlJs(source.slice(cursor));
        if (active.length) {
          html += '<mark class="' + active.join(' ') + '">' + text + '</mark>';
        } else {
          html += text;
        }
      }
      return html;
    }

    function renderDetail(item) {
      const chips = [
        '<span class="chip ' + verdictClass(item.verdict) + '">' + escapeHtmlJs(item.verdict) + '</span>',
        '<span class="chip">' + escapeHtmlJs(item.status) + '</span>',
        item.auto_accept_eligible ? '<span class="chip">Auto-accept eligible</span>' : '<span class="chip">Needs review</span>'
      ].join(' ');
      const failed = item.failed_checks.length ? '<li>' + item.failed_checks.map(escapeHtmlJs).join('</li><li>') + '</li>' : '<li>None</li>';
      const flagged = item.flagged_checks.length ? '<li>' + item.flagged_checks.map(escapeHtmlJs).join('</li><li>') + '</li>' : '<li>None</li>';
      const checkDetails = item.checks.length
        ? item.checks.map((check) =>
            '<li><strong>' + escapeHtmlJs(check.name) + '</strong> [' + escapeHtmlJs(check.status) + ']: ' + escapeHtmlJs(check.detail || '') + '</li>'
          ).join('')
        : '<li>None</li>';
      const spans = item.spans.map((span) =>
        '<li><strong>' + escapeHtmlJs(span.label) + ':</strong> ' + escapeHtmlJs(span.text || 'No stored span text') + '</li>'
      ).join('');
      detailPanel.innerHTML =
        '<h2>' + escapeHtmlJs(item.hpo_label || item.hpo_id) + '</h2>' +
        '<div class="chips">' + chips + '</div>' +
        '<p>' + escapeHtmlJs(item.section_heading || 'No section heading') + ' · ' + escapeHtmlJs(item.paragraph_id || 'no paragraph') + ' · ' + escapeHtmlJs(item.sentence_id || 'no sentence') + '</p>' +
        '<div class="detail-block"><h3>Sentence</h3><pre>' + escapeHtmlJs(item.sentence_text || '') + '</pre></div>' +
        '<div class="detail-block"><h3>Span texts</h3><ul class="detail-list">' + (spans || '<li>None</li>') + '</ul></div>' +
        '<div class="detail-block"><h3>Failed checks</h3><ul class="detail-list">' + failed + '</ul></div>' +
        '<div class="detail-block"><h3>Flagged checks</h3><ul class="detail-list">' + flagged + '</ul></div>' +
        '<div class="detail-block"><h3>Verifier check details</h3><ul class="detail-list">' + checkDetails + '</ul></div>' +
        '<div class="detail-block"><h3>Auto-accept reasons</h3><pre>' + escapeHtmlJs((item.auto_accept_reasons || []).join('\\n') || 'None') + '</pre></div>' +
        '<div class="detail-block"><h3>Open source</h3><p><a class="detail-link" href="' + escapeHtmlJs(item.source_url || '#') + '" target="_blank" rel="noreferrer">NCBI chapter</a></p></div>';
    }

    function selectItem(reviewId) {
      const item = payload.items.find((entry) => entry.review_id === reviewId);
      if (!item) return;
      state.currentId = reviewId;
      window.location.hash = reviewId;
      renderReviewList();
      resetHighlights();
      const sentenceEl = sentenceMap.get(item.sentence_id);
      const paragraphEl = paragraphMap.get(item.paragraph_id);
      if (paragraphEl) paragraphEl.classList.add('active');
      if (sentenceEl) {
        sentenceEl.classList.add('active');
        sentenceEl.innerHTML = buildHighlightHtml(sentenceEl.dataset.text || '', item.sentence_char_start || 0, item.spans || []);
        sentenceEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      renderDetail(item);
    }

    document.querySelectorAll('.filters button').forEach((button) => {
      button.addEventListener('click', () => {
        state.filter = button.dataset.filter;
        document.querySelectorAll('.filters button').forEach((el) => el.classList.toggle('active', el === button));
        renderReviewList();
      });
    });

    renderChapter();
    renderReviewList();
    const initialId = location.hash.replace(/^#/, '') || (payload.items[0] && payload.items[0].review_id);
    if (initialId) selectItem(initialId);
  </script>
</body>
</html>`;
}
