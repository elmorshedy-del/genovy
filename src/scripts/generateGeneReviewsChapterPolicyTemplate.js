import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULTS = Object.freeze({
  rosterJson:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-global-roster-20260329.json',
  outputJson:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/data/source-enrichment/genereviews-chapter-policy-template-20260329.json',
  generatedAt: '2026-03-29'
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

function extractNbkId(chapterPath) {
  const match = String(chapterPath || '').match(/\/(NBK\d+)\//i);
  return match ? match[1].toUpperCase() : '';
}

function slugify(value) {
  return String(value || '')
    .trim()
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function classifyRecommendation(chapter) {
  if (chapter.mappingStatus !== 'exact_label_or_alias') {
    return {
      recommendedDecision: 'review_required',
      recommendedScope: 'mapping_unresolved',
      recommendationReason: 'Chapter title does not map cleanly to a disease in the current graph.'
    };
  }

  const title = String(chapter.chapterTitle || '').trim();
  if (/related disorders?/i.test(title)) {
    return {
      recommendedDecision: 'review_required',
      recommendedScope: 'mixed_related_disorders',
      recommendationReason: 'Related-disorders chapters often mix multiple disease branches and should not auto-ingest.'
    };
  }

  if (/disorders$/i.test(title)) {
    return {
      recommendedDecision: 'review_required',
      recommendedScope: 'plural_disorders',
      recommendationReason: 'Plural disease titles may represent heterogeneous chapter scope and need manual review.'
    };
  }

  return {
    recommendedDecision: 'candidate_auto_accept',
    recommendedScope: 'candidate_disease_specific',
    recommendationReason: 'Exact disease-label mapping exists, but manual approval is still required before ingestion.'
  };
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const rosterJson = flags.roster || DEFAULTS.rosterJson;
  const outputJson = flags.output || DEFAULTS.outputJson;

  const roster = JSON.parse(await fs.readFile(rosterJson, 'utf8'));
  const chapters = Array.isArray(roster.chapters) ? roster.chapters : [];

  const template = {
    createdAt: DEFAULTS.generatedAt,
    rosterJson,
    defaults: {
      ingestionDecision: 'review_required',
      chapterScope: 'unclassified',
      targetingMode: 'manual_required',
      notes:
        'Do not auto-ingest GeneReviews into the graph until the chapter scope and disease targets are reviewed explicitly.'
    },
    chapters: chapters.map((chapter) => {
      const nbkId = extractNbkId(chapter.chapterPath);
      const recommendation = classifyRecommendation(chapter);
      return {
        chapterKey: slugify(chapter.chapterTitle || chapter.chapterPath || 'unknown_chapter'),
        nbkId,
        chapterTitle: chapter.chapterTitle || '',
        chapterPath: chapter.chapterPath || '',
        chapterUrl: chapter.chapterUrl || '',
        rosterMappingStatus: chapter.mappingStatus || '',
        rosterMappedDiseaseCurie: chapter.diseaseCurie || '',
        rosterMappedDiseaseLabel: chapter.diseaseLabel || '',
        recommendedDecision: recommendation.recommendedDecision,
        recommendedScope: recommendation.recommendedScope,
        recommendationReason: recommendation.recommendationReason,
        policy: {
          ingestionDecision: '',
          chapterScope: '',
          targetingMode: '',
          diseaseTargets: [],
          notes: ''
        }
      };
    })
  };

  await fs.mkdir(path.dirname(outputJson), { recursive: true });
  await fs.writeFile(outputJson, `${JSON.stringify(template, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        outputJson,
        chapterCount: template.chapters.length,
        exactMappedCount: template.chapters.filter(
          (chapter) => chapter.rosterMappingStatus === 'exact_label_or_alias'
        ).length
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
