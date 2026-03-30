import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULTS = Object.freeze({
  inputJson:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/data/source-enrichment/genereviews-chapter-policy-template-20260329.json',
  outputJson:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/data/source-enrichment/genereviews-chapter-policy-seeded-20260329.json'
});

function parseArgs(argv) {
  const flags = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      flags[key] = true;
      continue;
    }
    flags[key] = next;
    index += 1;
  }
  return flags;
}

function isPlaceholderCurie(curie) {
  return String(curie || '').startsWith('PLACEHOLDER:');
}

function isPluralDisordersTitle(title) {
  return /disorders$/i.test(String(title || '').trim());
}

function isRelatedDisordersTitle(title) {
  return /related disorders?/i.test(String(title || '').trim());
}

function shouldAutoSeed(chapter) {
  if (chapter.rosterMappingStatus !== 'exact_label_or_alias') return false;
  if (!chapter.rosterMappedDiseaseCurie) return false;
  if (isPlaceholderCurie(chapter.rosterMappedDiseaseCurie)) return false;
  if (isRelatedDisordersTitle(chapter.chapterTitle)) return false;
  if (isPluralDisordersTitle(chapter.chapterTitle)) return false;
  return true;
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const inputJson = flags.input || DEFAULTS.inputJson;
  const outputJson = flags.output || DEFAULTS.outputJson;

  const payload = JSON.parse(await fs.readFile(inputJson, 'utf8'));
  const chapters = Array.isArray(payload.chapters) ? payload.chapters : [];

  let autoAccepted = 0;
  const seeded = {
    ...payload,
    basedOn: inputJson,
    chapters: chapters.map((chapter) => {
      if (!shouldAutoSeed(chapter)) {
        return chapter;
      }

      autoAccepted += 1;
      return {
        ...chapter,
        policy: {
          ingestionDecision: 'auto_accept',
          chapterScope: 'disease_specific',
          targetingMode: 'roster_exact_single_target',
          diseaseTargets: [chapter.rosterMappedDiseaseCurie],
          notes:
            'Auto-seeded because the GeneReviews title maps exactly to one non-placeholder disease in the current graph and does not look like a mixed/related-disorders chapter.'
        }
      };
    })
  };

  await fs.mkdir(path.dirname(outputJson), { recursive: true });
  await fs.writeFile(outputJson, `${JSON.stringify(seeded, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        outputJson,
        chapterCount: chapters.length,
        autoAccepted
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
