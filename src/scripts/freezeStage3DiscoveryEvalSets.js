import path from 'node:path';
import fsp from 'node:fs/promises';
import vm from 'node:vm';
import {
  ensureDir,
  parseArgs,
  writeJson
} from '../lib/genereviewsPipeline.js';

const REPO_ROOT = '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914';
const FIXTURE_DIR = path.join(REPO_ROOT, 'test/fixtures');
const DEFAULTS = Object.freeze({
  sourceBenchmark: '/Users/ahmedelmorshedy/Downloads/discovery_benchmark.js',
  devSliceSource: path.join(REPO_ROOT, 'output/stage3_discovery_medgemma_smoke_20260402_hard20_cases.js'),
  realHoldoutGlobDir: path.join(
    REPO_ROOT,
    'preservation/bucket-critical/20260331-genereviews-latest5-readiness/stage1_fetch'
  ),
  fixtureDir: FIXTURE_DIR
});

const FULL_JS_BASENAME = 'stage3DiscoveryBenchmarkFull';
const DEV_JS_BASENAME = 'stage3DiscoveryBenchmarkDevHard20';
const HOLDOUT_JS_BASENAME = 'stage3DiscoveryBenchmarkHoldout80';
const MANIFEST_BASENAME = 'stage3DiscoveryEvalManifest';
const REAL_HOLDOUT_BASENAME = 'stage3DiscoveryRealHoldoutManifest';
const REAL_HOLDOUT_SUFFIX = '_clinical_structure.json';

async function loadBenchmarkFromJs(filePath) {
  const raw = await fsp.readFile(filePath, 'utf8');
  const sandbox = { module: { exports: {} }, exports: {} };
  vm.createContext(sandbox);
  vm.runInContext(
    `${raw}\nthis.__cases = typeof DISCOVERY_BENCHMARK !== 'undefined' ? DISCOVERY_BENCHMARK : (module.exports?.DISCOVERY_BENCHMARK || null);`,
    sandbox,
    { timeout: 1000, filename: filePath }
  );
  const cases = sandbox.__cases;
  if (!Array.isArray(cases)) {
    throw new Error(`Failed to load DISCOVERY_BENCHMARK from ${filePath}`);
  }
  return cases;
}

function serializeBenchmarkJs(cases) {
  const payload = JSON.stringify(cases, null, 2);
  return `const DISCOVERY_BENCHMARK = ${payload};\n\nmodule.exports = {\n  DISCOVERY_BENCHMARK,\n  DISCOVERY_BENCHMARK_RAW: DISCOVERY_BENCHMARK\n};\n`;
}

async function writeBenchmarkPair(outputDir, baseName, cases) {
  const jsPath = path.join(outputDir, `${baseName}.js`);
  const jsonPath = path.join(outputDir, `${baseName}.json`);
  await fsp.writeFile(jsPath, serializeBenchmarkJs(cases), 'utf8');
  await writeJson(jsonPath, cases);
  return { jsPath, jsonPath };
}

function normalizeCaseIds(cases) {
  return cases.map((item) => String(item?.id || '').trim()).filter(Boolean);
}

function buildSyntheticManifest({ fullCases, devCases, holdoutCases, sourceBenchmark, devSliceSource }) {
  return {
    created_at: new Date().toISOString(),
    source_benchmark: sourceBenchmark,
    dev_slice_source: devSliceSource,
    benchmark_policy: {
      dev_split_name: 'hard20',
      synthetic_holdout_name: 'holdout80',
      rationale:
        'Use the frozen hard-20 as the prompt-tuning dev slice; validate on the untouched synthetic holdout and separate real-chapter holdout before accepting prompt changes.'
    },
    counts: {
      full: fullCases.length,
      dev: devCases.length,
      synthetic_holdout: holdoutCases.length
    },
    ids: {
      dev: normalizeCaseIds(devCases),
      synthetic_holdout: normalizeCaseIds(holdoutCases)
    }
  };
}

async function buildRealHoldoutManifest(realHoldoutDir) {
  const entries = await fsp.readdir(realHoldoutDir);
  const structureFiles = entries
    .filter((name) => name.endsWith(REAL_HOLDOUT_SUFFIX))
    .sort((left, right) => left.localeCompare(right));

  const chapters = [];
  for (const fileName of structureFiles) {
    const filePath = path.join(realHoldoutDir, fileName);
    const raw = JSON.parse(await fsp.readFile(filePath, 'utf8'));
    chapters.push({
      nbk_id: raw?.nbk_id || fileName.replace(REAL_HOLDOUT_SUFFIX, ''),
      chapter_key: raw?.chapter_key || null,
      chapter_title: raw?.chapter_title || null,
      provenance_url: raw?.provenance_url || null,
      structure_path: filePath,
      text_sha256: raw?.text_sha256 || null,
      section_count: Number(raw?.section_count || 0),
      paragraph_count: Number(raw?.paragraph_count || 0),
      sentence_count: Number(raw?.sentence_count || 0)
    });
  }

  return {
    created_at: new Date().toISOString(),
    source_dir: realHoldoutDir,
    chapter_count: chapters.length,
    chapters
  };
}

function splitSyntheticCases(fullCases, devIds) {
  const devSet = new Set(devIds);
  const devCases = [];
  const holdoutCases = [];

  for (const testCase of fullCases) {
    if (devSet.has(testCase.id)) {
      devCases.push(testCase);
      continue;
    }
    holdoutCases.push(testCase);
  }

  return { devCases, holdoutCases };
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const sourceBenchmark = String(flags.input || DEFAULTS.sourceBenchmark);
  const devSliceSource = String(flags.dev || DEFAULTS.devSliceSource);
  const realHoldoutDir = String(flags.realHoldoutDir || DEFAULTS.realHoldoutGlobDir);
  const fixtureDir = String(flags.outputDir || DEFAULTS.fixtureDir);

  const fullCases = await loadBenchmarkFromJs(sourceBenchmark);
  const devSliceCases = await loadBenchmarkFromJs(devSliceSource);
  const devIds = normalizeCaseIds(devSliceCases);
  const { devCases, holdoutCases } = splitSyntheticCases(fullCases, devIds);

  if (devCases.length !== devSliceCases.length) {
    throw new Error(
      `Dev slice mismatch: expected ${devSliceCases.length} cases from ${devSliceSource}, found ${devCases.length} in ${sourceBenchmark}`
    );
  }

  if (devCases.length + holdoutCases.length !== fullCases.length) {
    throw new Error('Synthetic split accounting failed');
  }

  await ensureDir(fixtureDir);
  const fullPaths = await writeBenchmarkPair(fixtureDir, FULL_JS_BASENAME, fullCases);
  const devPaths = await writeBenchmarkPair(fixtureDir, DEV_JS_BASENAME, devCases);
  const holdoutPaths = await writeBenchmarkPair(fixtureDir, HOLDOUT_JS_BASENAME, holdoutCases);

  const syntheticManifest = buildSyntheticManifest({
    fullCases,
    devCases,
    holdoutCases,
    sourceBenchmark,
    devSliceSource
  });
  const realHoldoutManifest = await buildRealHoldoutManifest(realHoldoutDir);

  const manifestPath = path.join(fixtureDir, `${MANIFEST_BASENAME}.json`);
  const realHoldoutPath = path.join(fixtureDir, `${REAL_HOLDOUT_BASENAME}.json`);
  await writeJson(manifestPath, {
    ...syntheticManifest,
    fixture_files: {
      full: fullPaths,
      dev: devPaths,
      synthetic_holdout: holdoutPaths,
      real_holdout_manifest: realHoldoutPath
    }
  });
  await writeJson(realHoldoutPath, realHoldoutManifest);

  process.stdout.write(
    `${JSON.stringify(
      {
        full: fullCases.length,
        dev: devCases.length,
        syntheticHoldout: holdoutCases.length,
        realHoldoutChapters: realHoldoutManifest.chapter_count,
        manifestPath
      },
      null,
      2
    )}\n`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
