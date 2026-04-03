const RUN_STATUS_ENDPOINT = '/api/gene-reviews-audit/run-status';
const REFRESH_MS = 10000;

const subtitleEl = document.getElementById('gr-run-subtitle');
const refreshEl = document.getElementById('gr-run-refresh');
const metaEl = document.getElementById('gr-run-meta');
const medgemmaEl = document.getElementById('gr-medgemma-state');
const stageGridEl = document.getElementById('gr-stage-grid');

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function queryRun() {
  const params = new URLSearchParams(window.location.search);
  return params.get('run') || 'genereviews-pipeline-review-first-50-20260331';
}

function prettyDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function renderMeta(payload) {
  metaEl.innerHTML = `
    <dt>Run name</dt><dd>${escapeHtml(payload.run_name)}</dd>
    <dt>Generated</dt><dd>${escapeHtml(prettyDate(payload.generated_at))}</dd>
    <dt>Run dir</dt><dd>${escapeHtml(payload.run_dir)}</dd>
    <dt>Ready</dt><dd>${payload.ready ? 'yes' : 'no'}</dd>
  `;
}

function renderMedGemma(payload) {
  const state = payload.medgemma?.state || 'unknown';
  const http = payload.medgemma?.http_status ?? '—';
  medgemmaEl.innerHTML = `
    <p><span class="gr-state-pill ${escapeHtml(state)}">${escapeHtml(state)}</span></p>
    <dl class="gr-run-meta">
      <dt>HTTP</dt><dd>${escapeHtml(http)}</dd>
      <dt>Detail</dt><dd>${escapeHtml(JSON.stringify(payload.medgemma?.payload || {}))}</dd>
    </dl>
  `;
}

function renderStages(payload) {
  stageGridEl.innerHTML = (payload.stages || [])
    .map((stage) => {
      const summary = stage.summary || {};
      return `
        <article class="gr-stage-card">
          <div class="gr-chip-row">
            <span class="gr-state-pill ${escapeHtml(stage.status)}">${escapeHtml(stage.status)}</span>
          </div>
          <h3>${escapeHtml(stage.label)}</h3>
          <dl>
            <dt>Files</dt><dd>${escapeHtml(stage.file_count)}</dd>
            <dt>Last update</dt><dd>${escapeHtml(prettyDate(stage.latest_mtime))}</dd>
            <dt>Processed</dt><dd>${escapeHtml(summary.total_processed ?? '—')}</dd>
            <dt>Errors</dt><dd>${escapeHtml(summary.total_errors ?? '—')}</dd>
            <dt>Path</dt><dd>${escapeHtml(stage.dir_path)}</dd>
          </dl>
        </article>
      `;
    })
    .join('');
}

async function loadStatus() {
  const run = queryRun();
  const response = await fetch(`${RUN_STATUS_ENDPOINT}?run=${encodeURIComponent(run)}`);
  const payload = await response.json();
  if (!payload.success) {
    throw new Error(payload.error || 'Failed to load run status');
  }
  subtitleEl.textContent = `Showing live status for ${payload.run_name}. Auto-refreshes every 10 seconds.`;
  refreshEl.textContent = `Updated ${new Date().toLocaleTimeString()}`;
  renderMeta(payload);
  renderMedGemma(payload);
  renderStages(payload);
}

async function tick() {
  try {
    await loadStatus();
  } catch (error) {
    subtitleEl.textContent = error.message || String(error);
  }
}

await tick();
window.setInterval(tick, REFRESH_MS);
