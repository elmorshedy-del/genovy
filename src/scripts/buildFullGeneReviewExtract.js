import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, readJson, writeJson } from '../lib/genereviewsPipeline.js';

const OUTPUT_SUFFIX = '_full_chapter_extract.json';
const CANDIDATE_SUFFIXES = Object.freeze({
  opusInput: ['_recovered_opus_input.json', '_opus_input.json'],
  structure: ['_recovered_clinical_structure.json', '_clinical_structure.json'],
  tables: ['_recovered_tables.json', '_tables.json'],
  fetchMeta: ['_recovered_fetch_meta.json', '_fetch_meta.json'],
  audit: ['recovered_source_surface_audit_20260411.json', 'recovered_source_surface_audit_20260410.json', 'source_surface_audit_20260411.json', 'source_surface_audit_20260410.json']
});

function requireFlag(value, flagName) {
  const text = String(value || '').trim();
  if (!text) {
    throw new Error(`Pass ${flagName}`);
  }
  return text;
}

function inferStem(opusInputPath) {
  const baseName = path.basename(opusInputPath);
  return baseName.replace(/_recovered_opus_input\.json$/i, '').replace(/_opus_input\.json$/i, '');
}

function findFile(chapterFolder, suffixes) {
  const entries = fs.readdirSync(chapterFolder);
  for (const suffix of suffixes) {
    const exact = entries.find((entry) => entry === suffix || entry.endsWith(suffix));
    if (exact) return path.join(chapterFolder, exact);
  }
  return null;
}

function buildExtractPayload({ opusInput, structure, tables, fetchMeta, audit }) {
  return {
    artifact_version: 'genereviews_full_chapter_extract_v1',
    artifact_type: 'full_chapter_extract',
    chapter: opusInput.chapter || {},
    source_surface: {
      profile: structure.source_surface_profile || tables.source_surface_profile || fetchMeta.source_surface_profile || null,
      surface_label: audit?.surface_label || null,
      likely_truncated: audit?.likely_truncated ?? null,
      manual_5_4_ready: audit?.manual_5_4_ready ?? null,
      completeness_gate: audit?.manual_5_4_completeness_gate || null,
      prose_chars: fetchMeta?.prose_chars ?? null,
      raw_html_chars: fetchMeta?.raw_html_chars ?? null,
      rebuilt_from_raw_html: fetchMeta?.rebuilt_from_raw_html || null
    },
    heading_inventory: structure.heading_inventory || [],
    chapter_domains: structure.chapter_domains || [],
    sentence_index: opusInput.sentence_index || [],
    tables: tables.tables || []
  };
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const chapterFolder = requireFlag(
    flags.chapterFolder || flags['chapter-folder'] || flags.chapter || '',
    '--chapter-folder'
  );

  const opusInputPath = findFile(chapterFolder, CANDIDATE_SUFFIXES.opusInput);
  const structurePath = findFile(chapterFolder, CANDIDATE_SUFFIXES.structure);
  const tablesPath = findFile(chapterFolder, CANDIDATE_SUFFIXES.tables);
  const fetchMetaPath = findFile(chapterFolder, CANDIDATE_SUFFIXES.fetchMeta);
  const auditPath = findFile(chapterFolder, CANDIDATE_SUFFIXES.audit);

  if (!opusInputPath || !structurePath || !tablesPath) {
    throw new Error(`Missing required recovered chapter artifacts in ${chapterFolder}`);
  }

  const opusInput = await readJson(opusInputPath);
  const structure = await readJson(structurePath);
  const tables = await readJson(tablesPath);
  const fetchMeta = fetchMetaPath ? await readJson(fetchMetaPath) : {};
  const audit = auditPath ? await readJson(auditPath) : null;
  const stem = inferStem(opusInputPath);
  const outputPath = String(flags.output || '').trim() || path.join(chapterFolder, `${stem}${OUTPUT_SUFFIX}`);

  await writeJson(
    outputPath,
    buildExtractPayload({ opusInput, structure, tables, fetchMeta, audit })
  );

  console.log(
    JSON.stringify(
      {
        chapter_folder: chapterFolder,
        output_path: outputPath,
        nbk_id: opusInput?.chapter?.nbk_id || null,
        title: opusInput?.chapter?.title || null,
        sentence_count: Array.isArray(opusInput?.sentence_index) ? opusInput.sentence_index.length : 0,
        table_count: Array.isArray(tables?.tables) ? tables.tables.length : 0,
        manual_5_4_ready: audit?.manual_5_4_ready ?? null,
        surface_label: audit?.surface_label || null
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error.message || String(error));
  process.exit(1);
});
