import fs from 'node:fs/promises';
import { withClient } from '../db/pool.js';
import { resolveEntityByLabel, searchKnowledgeEntities } from '../repositories/knowledgeRepository.js';
import { normalizeCurie } from '../lib/curies.js';

const DEFAULTS = Object.freeze({
  chapterIndexUrl: 'https://www.ncbi.nlm.nih.gov/sites/books/n/gene/',
  outputJson:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-global-roster-20260329.json',
  generatedAt: '2026-03-29'
});

const EXCLUDED_CHAPTER_PATHS = new Set([
  '/sites/books/n/gene/glossary/',
  '/sites/books/n/gene/help/',
  '/sites/books/n/gene/advanced/',
  '/sites/books/n/gene/updates/',
  '/sites/books/n/gene/authors/',
  '/sites/books/n/gene/resource_mats/',
  '/sites/books/n/gene/prospective_authors/',
  '/sites/books/n/gene/GRpersonnel/',
  '/sites/books/n/gene/howto_linkin/',
  '/sites/books/n/gene/contact_us/',
  '/sites/books/n/gene/archived_chapters/'
]);

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

function decodeHtmlEntities(text) {
  return String(text || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x2019;|&#8217;/g, "'")
    .replace(/&#x2013;|&#8211;/g, '-')
    .replace(/&#x2014;|&#8212;/g, '-')
    .replace(/&#x201c;|&#8220;/g, '"')
    .replace(/&#x201d;|&#8221;/g, '"')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractGeneReviewsChapters(html) {
  const chapters = [];
  const pattern =
    /<li class="half_rhythm" id="toc_itm_NBK1116_toc_[^"]+">\s*<a class="toc-item" href="([^"]+)">([\s\S]*?)<\/a>([\s\S]*?)(?=<\/li>)/g;

  for (const match of html.matchAll(pattern)) {
    const chapterPath = String(match[1] || '').trim();
    if (!chapterPath || EXCLUDED_CHAPTER_PATHS.has(chapterPath)) continue;

    const title = decodeHtmlEntities(match[2]);
    const remainder = match[3] || '';
    const divTexts = [...remainder.matchAll(/<div(?: class="[^"]*")?>([\s\S]*?)<\/div>/g)].map((row) =>
      decodeHtmlEntities(row[1])
    );
    const authors = divTexts[0] || '';
    const publication = divTexts[1] || '';

    chapters.push({
      chapterTitle: title,
      chapterPath,
      chapterUrl: `https://www.ncbi.nlm.nih.gov${chapterPath}`,
      authors,
      publication
    });
  }

  return chapters;
}

async function resolveDiseaseCandidate(client, chapter) {
  const exact = await resolveEntityByLabel(client, chapter.chapterTitle, 'disease');
  if (exact) {
    const diagnostics = await searchKnowledgeEntities(client, {
      query: chapter.chapterTitle,
      entityType: 'disease',
      limit: 1
    });
    const detail = diagnostics[0];
    return {
      mappingStatus: 'exact_label_or_alias',
      diseaseCurie: normalizeCurie(exact.canonical_curie),
      diseaseLabel: detail?.canonical_label || chapter.chapterTitle,
      diagnostics: detail
        ? [
            {
              canonicalCurie: detail.canonical_curie,
              canonicalLabel: detail.canonical_label,
              matchRank: detail.match_rank
            }
          ]
        : []
    };
  }

  const diagnostics = await searchKnowledgeEntities(client, {
    query: chapter.chapterTitle,
    entityType: 'disease',
    limit: 3
  });

  return {
    mappingStatus: diagnostics.length ? 'needs_review' : 'unresolved',
    diseaseCurie: '',
    diseaseLabel: '',
    diagnostics: diagnostics.map((row) => ({
      canonicalCurie: row.canonical_curie,
      canonicalLabel: row.canonical_label,
      matchRank: row.match_rank
    }))
  };
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const chapterIndexUrl = flags.url || DEFAULTS.chapterIndexUrl;
  const outputJson = flags.output || DEFAULTS.outputJson;

  const response = await fetch(chapterIndexUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      Accept: 'text/html'
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch GeneReviews title index: ${response.status}`);
  }

  const html = await response.text();
  const chapters = extractGeneReviewsChapters(html);

  const resolved = await withClient(async (client) => {
    const rows = [];
    for (const chapter of chapters) {
      const mapping = await resolveDiseaseCandidate(client, chapter);
      rows.push({
        ...chapter,
        ...mapping
      });
    }
    return rows;
  });

  const exactMatches = resolved.filter((row) => row.mappingStatus === 'exact_label_or_alias');
  const reviewNeeded = resolved.filter((row) => row.mappingStatus === 'needs_review');
  const unresolved = resolved.filter((row) => row.mappingStatus === 'unresolved');

  const payload = {
    createdAt: DEFAULTS.generatedAt,
    chapterIndexUrl,
    totalChapterCount: resolved.length,
    exactMappedCount: exactMatches.length,
    reviewNeededCount: reviewNeeded.length,
    unresolvedCount: unresolved.length,
    extractionInput: exactMatches.map((row) => ({
      chapter_title: row.chapterTitle,
      chapter_path: row.chapterPath,
      disease_curie: row.diseaseCurie,
      disease_label: row.diseaseLabel
    })),
    chapters: resolved
  };

  await fs.writeFile(outputJson, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(
    JSON.stringify(
      {
        outputJson,
        totalChapterCount: payload.totalChapterCount,
        exactMappedCount: payload.exactMappedCount,
        reviewNeededCount: payload.reviewNeededCount,
        unresolvedCount: payload.unresolvedCount
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
