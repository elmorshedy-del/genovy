import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { withClient } from '../db/pool.js';

const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULTS = Object.freeze({
  inputJson:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-global-exact-input-20260329.json',
  outputDir:
    '/Users/ahmedelmorshedy/Downloads/files (4)/gr_output_global_exact_gemini_anchor_pilot10_20260329',
  textCacheDir:
    '/Users/ahmedelmorshedy/Downloads/files (4)/gr_output_global_exact_gemini_flash_pilot10_20260329',
  model: 'gemini-2.5-flash',
  provider: 'gemini',
  maxAnchorsPerCall: 8,
  maxAnchorsPerBlock: 12,
  maxAnchorWords: 8,
  maxBlockChars: 900,
  maxSentencesPerSegment: 2,
  thinkingBudget: 0,
  generatedAt: '2026-03-29',
  ncbiDelayMs: 400
});

const NCBI_BOOKS_URL = 'https://www.ncbi.nlm.nih.gov/books';

const GENERIC_SINGLE_WORD_ANCHORS = new Set([
  'abnormality',
  'abnormalities',
  'affected',
  'anomaly',
  'anomalies',
  'bilateral',
  'death',
  'defect',
  'defects',
  'disease',
  'diseases',
  'disorder',
  'disorders',
  'feature',
  'features',
  'finding',
  'findings',
  'mortality',
  'phenotype',
  'phenotypes',
  'unilateral',
  'symptom',
  'symptoms'
]);

const METADATA_PROMPT = `You are validating already-anchored phenotype terms against a GeneReviews paragraph.

TASK:
You will receive:
1. a single paragraph from GeneReviews
2. a list of anchored phenotype terms that were matched deterministically to HPO concepts

Return JSON only with one item per anchor that is EXPLICITLY supported in this paragraph as a patient manifestation.

RULES:
- Do not invent new phenotypes.
- Do not return anchors that are not actually supported by the paragraph.
- Do not infer from general medical knowledge.
- Only extract metadata when explicitly stated in the paragraph.
- treatment_response should only be used for explicit response to treatment/therapy, not for phrases like "if untreated" or "without treatment".
- frequency should be a true frequency expression such as a percentage, ratio, "most", "rare", etc. Do not use words like "primary" as frequency.
- onset should only be true onset timing or age window.
- severity, subtype, progression, and treatment_response should be null unless explicitly described.
- source_sentence must be copied exactly from the paragraph.

OUTPUT FORMAT:
{
  "items": [
    {
      "phenotype_curie": "HP:....",
      "supported": true,
      "status": "present" or "excluded",
      "frequency": "64%" or "3/14" or "most" or null,
      "onset": "infancy" or "at birth" or null,
      "severity": "mild" or "severe" or null,
      "subtype": "infantile spasms" or null,
      "progression": "progressive" or "worsens with age" or null,
      "treatment_response": "responds to ..." or "drug-resistant" or null,
      "source_sentence": "exact sentence"
    }
  ]
}`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value) {
  return String(value || '')
    .trim()
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function extractNbkId(value) {
  const match = String(value || '').match(/(NBK\d+)/i);
  return match ? match[1].toUpperCase() : '';
}

function toBaseName(entry, fallback = '') {
  return String(entry.gene_symbol || entry.chapter_title || entry.nbk_id || entry.chapter_path || fallback)
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function findExistingOutput(outputDir, baseName) {
  const prefix = `${baseName}_`;
  const entries = fs.existsSync(outputDir) ? fs.readdirSync(outputDir, { withFileTypes: true }) : [];
  const jsonFile = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .find((name) => name.startsWith(prefix) && name.endsWith('.json') && name !== 'extraction_summary.json');
  const textFile = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .find((name) => name.startsWith(prefix) && name.endsWith('_text.txt'));
  return {
    jsonPath: jsonFile ? path.join(outputDir, jsonFile) : '',
    textPath: textFile ? path.join(outputDir, textFile) : ''
  };
}

function findCachedText(cacheDir, baseName) {
  if (!cacheDir || !fs.existsSync(cacheDir)) return '';
  const prefix = `${baseName}_`;
  const entries = fs.readdirSync(cacheDir, { withFileTypes: true });
  const textFile = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .find((name) => name.startsWith(prefix) && name.endsWith('_text.txt'));
  return textFile ? path.join(cacheDir, textFile) : '';
}

function isInsufficientQuotaError(error) {
  const message = String(error?.message || '');
  return (
    message.includes('insufficient_quota') ||
    message.includes('RESOURCE_EXHAUSTED') ||
    message.includes('quota') ||
    message.includes('429')
  );
}

function decodeHtmlEntities(text) {
  return String(text || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x2019;|&#8217;/g, "'")
    .replace(/&#x2013;|&#8211;/g, '-')
    .replace(/&#x2014;|&#8212;/g, '-')
    .replace(/&#x201c;|&#8220;/g, '"')
    .replace(/&#x201d;|&#8221;/g, '"')
    .replace(/&#xAE;/gi, '®')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
}

function stripHtml(text) {
  return decodeHtmlEntities(
    String(text || '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<\/h[1-6]>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\u00a0/g, ' ')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function extractSectionBlock(html, marker) {
  const start = html.search(marker);
  if (start === -1) return '';
  const rest = html.slice(start);
  const endMatch = rest.slice(1).match(/<div id="[^"]+\.[A-Z][^"]*">/);
  return endMatch ? rest.slice(0, endMatch.index + 1) : rest;
}

function extractClinicalSections(html) {
  const blocks = [];
  const clinicalCharacteristics = extractSectionBlock(html, /<div id="[^"]+\.Clinical_Characteristics">/i);
  if (clinicalCharacteristics) blocks.push(clinicalCharacteristics);
  const clinicalDescription = extractSectionBlock(html, /<div id="[^"]+\.Clinical_Description">/i);
  if (clinicalDescription) blocks.push(clinicalDescription);
  const suggestiveFindings = extractSectionBlock(html, /<div id="[^"]+\.Suggestive_Findings">/i);
  if (suggestiveFindings) blocks.push(suggestiveFindings);

  const sections = blocks
    .map(stripHtml)
    .filter(Boolean)
    .filter((text, index, list) => list.indexOf(text) === index);

  if (sections.length) {
    return sections.join('\n\n');
  }

  const chunks = [...html.matchAll(/<(p|li|dd)[^>]*>([\s\S]*?)<\/\1>/gi)]
    .map((match) => stripHtml(match[2]))
    .filter((text) => text.length > 20);

  return chunks.join('\n\n');
}

async function fetchGeneReviewsText(entry) {
  const nbkId = String(entry.nbk_id || '').trim();
  const chapterPath = String(entry.chapter_path || '').trim();
  const url = chapterPath
    ? `https://www.ncbi.nlm.nih.gov${chapterPath}?report=printable`
    : `${NCBI_BOOKS_URL}/${nbkId}/?report=printable`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      Accept: 'text/html'
    }
  });
  if (!response.ok) {
    throw new Error(`NCBI fetch failed for ${nbkId || chapterPath}: ${response.status}`);
  }

  const html = await response.text();
  const clinicalText = extractClinicalSections(html);
  const resolvedNbkId =
    html.match(/meta name="ncbi_acc" content="(NBK\d+)"/i)?.[1] ||
    html.match(/\/books\/(NBK\d+)\//i)?.[1] ||
    nbkId;
  const chapterTitle =
    decodeHtmlEntities(
      html.match(/<title>(.*?)<\/title>/i)?.[1] ||
        html.match(/<h1[^>]*>\s*<span[^>]*>(.*?)<\/span>/i)?.[1] ||
        entry.chapter_title ||
        entry.gene_symbol ||
        resolvedNbkId
    ) || entry.chapter_title || entry.gene_symbol || resolvedNbkId;

  return { clinicalText, resolvedNbkId, chapterTitle };
}

function preprocessClinicalText(text) {
  return String(text || '')
    .replace(/\b(Table\s+\d+\.)/gi, '\n\n$1')
    .replace(/\b(View in own window)\b/gi, '\n$1')
    .replace(/\b(Clinical Description|Suggestive Findings|Clinical Characteristics)\b/g, '\n\n$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function splitSentences(text) {
  return String(text || '')
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function splitIntoBlocks(text) {
  const prepared = preprocessClinicalText(text);
  const rawBlocks = prepared
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  const segmented = [];
  for (const rawBlock of rawBlocks) {
    if (isTableLikeBlock(rawBlock)) {
      segmented.push(rawBlock);
      continue;
    }

    const sentences = splitSentences(rawBlock);
    if (
      rawBlock.length <= DEFAULTS.maxBlockChars &&
      sentences.length <= DEFAULTS.maxSentencesPerSegment
    ) {
      segmented.push(rawBlock);
      continue;
    }

    for (let index = 0; index < sentences.length; index += DEFAULTS.maxSentencesPerSegment) {
      const segment = sentences
        .slice(index, index + DEFAULTS.maxSentencesPerSegment)
        .join(' ')
        .trim();
      if (segment) {
        segmented.push(segment);
      }
    }
  }

  return segmented.map((block, index) => ({
    blockId: index + 1,
    text: block
  }));
}

function isTableLikeBlock(block) {
  const text = String(block || '').trim();
  if (!text) return false;
  const lower = text.toLowerCase();
  const percentCount = (text.match(/\b\d+(?:\.\d+)?%/g) || []).length;
  const ratioCount = (text.match(/\b\d+\s*\/\s*\d+\b/g) || []).length;
  const ageBucketCount = (text.match(/(?:<|>|≤|≥)?\s*\d+\s*[-–]?\s*\d*\s*yrs?/gi) || []).length;
  if (lower.startsWith('table ')) return true;
  if (lower.includes('view in own window')) return true;
  if (percentCount >= 4) return true;
  if (ratioCount >= 3) return true;
  if (percentCount + ratioCount + ageBucketCount >= 5 && !/[.?!]/.test(text)) return true;
  if (/^[A-Z][A-Za-z ]+\s+\d+%(\s+[A-Z][A-Za-z ]+\s+\d+%)+/.test(text)) return true;
  return false;
}

function loadChunks(items, chunkSize) {
  const chunks = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
}

function buildLexicon(rows, maxAnchorWords) {
  const phraseCandidates = new Map();
  for (const row of rows) {
    const candidates = [
      { phrase: row.canonical_label, isCanonical: true },
      ...(row.aliases || []).map((alias) => ({ phrase: alias.alias_label, isCanonical: false }))
    ];
    for (const candidate of candidates) {
      const normalizedPhrase = normalizeText(candidate.phrase);
      if (!normalizedPhrase) continue;
      const wordCount = normalizedPhrase.split(' ').filter(Boolean).length;
      if (!wordCount || wordCount > maxAnchorWords) continue;
      if (wordCount === 1 && GENERIC_SINGLE_WORD_ANCHORS.has(normalizedPhrase)) continue;
      if (normalizedPhrase.length < 4) continue;
      const bucket = phraseCandidates.get(normalizedPhrase) || [];
      bucket.push({
        phenotypeCurie: row.canonical_curie,
        phenotypeLabel: row.canonical_label,
        source: candidate.isCanonical ? 'canonical' : 'alias',
        wordCount
      });
      phraseCandidates.set(normalizedPhrase, bucket);
    }
  }

  const uniqueMap = new Map();
  const ambiguousMap = new Map();
  for (const [phrase, candidates] of phraseCandidates.entries()) {
    const unique = [...new Map(candidates.map((candidate) => [candidate.phenotypeCurie, candidate])).values()];
    if (unique.length === 1) {
      uniqueMap.set(phrase, unique[0]);
    } else if (unique.length > 1) {
      ambiguousMap.set(phrase, unique);
    }
  }

  return {
    uniqueMap,
    ambiguousMap,
    maxWords: Math.max(...[...uniqueMap.values()].map((candidate) => candidate.wordCount), 1)
  };
}

async function loadPhenotypeLexicon(client, maxAnchorWords) {
  const result = await client.query(
    `
      SELECT
        e.entity_id,
        e.canonical_curie,
        e.canonical_label,
        COALESCE(
          json_agg(
            json_build_object(
              'alias_label', a.alias_label,
              'alias_type', a.alias_type
            )
          ) FILTER (WHERE a.entity_alias_id IS NOT NULL),
          '[]'::json
        ) AS aliases
      FROM entities e
      LEFT JOIN entity_aliases a ON a.entity_id = e.entity_id
      WHERE e.entity_type = 'phenotype'
        AND e.is_placeholder = FALSE
      GROUP BY e.entity_id, e.canonical_curie, e.canonical_label
      ORDER BY e.canonical_curie ASC
    `
  );
  return buildLexicon(result.rows, maxAnchorWords);
}

function findAnchorsInBlock(block, lexicon) {
  const normalized = normalizeText(block);
  if (!normalized) return [];
  const words = normalized.split(' ').filter(Boolean);
  const seen = new Set();
  const anchors = [];

  for (let size = lexicon.maxWords; size >= 1; size -= 1) {
    for (let index = 0; index <= words.length - size; index += 1) {
      const phrase = words.slice(index, index + size).join(' ');
      const candidate = lexicon.uniqueMap.get(phrase);
      if (!candidate) continue;
      if (seen.has(candidate.phenotypeCurie)) continue;
      anchors.push({
        ...candidate,
        matchedPhrase: phrase
      });
      seen.add(candidate.phenotypeCurie);
    }
  }

  return anchors
    .sort((left, right) => {
      return (
        right.wordCount - left.wordCount ||
        left.phenotypeLabel.localeCompare(right.phenotypeLabel)
      );
    })
    .slice(0, DEFAULTS.maxAnchorsPerBlock);
}

async function callGeminiMetadata(paragraph, anchors, apiKey, model, thinkingBudget) {
  const response = await fetch(`${GEMINI_API_BASE_URL}/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: METADATA_PROMPT }]
      },
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: JSON.stringify(
                {
                  paragraph,
                  anchors: anchors.map((anchor) => ({
                    phenotype_curie: anchor.phenotypeCurie,
                    phenotype_label: anchor.phenotypeLabel,
                    matched_phrase: anchor.matchedPhrase
                  }))
                },
                null,
                2
              )
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
        thinkingConfig: {
          thinkingBudget
        }
      }
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  const rawContent =
    data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('\n').trim() || '';
  const cleaned = rawContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    parsed = { items: [], parse_error: true, raw_output: rawContent };
  }
  return {
    parsed,
    usage: data.usageMetadata || null,
    rawOutput: rawContent
  };
}

function sanitizeMetadataValue(value) {
  const trimmed = String(value || '').trim();
  return trimmed || null;
}

function isValidFrequency(value) {
  if (!value) return false;
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return false;
  if (['primary', 'typically', 'commonest', 'major'].includes(normalized)) return false;
  return true;
}

function isValidTreatmentResponse(value) {
  if (!value) return false;
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return false;
  if (normalized === 'if untreated' || normalized === 'without treatment') return false;
  if (normalized.includes('untreated') && !normalized.includes('responsive') && !normalized.includes('resistant')) {
    return false;
  }
  return true;
}

function scoreSpecificity(value) {
  const text = String(value || '').trim();
  if (!text) return 0;
  let score = text.length;
  if (/\d|%|\//.test(text)) score += 20;
  if (text.split(/\s+/).length > 2) score += 10;
  return score;
}

function mergeFeature(existing, incoming) {
  if (!existing) {
    return {
      ...incoming,
      source_sentences: incoming.source_sentence ? [incoming.source_sentence] : []
    };
  }

  const merged = { ...existing };
  const candidateFields = [
    'frequency',
    'onset',
    'severity',
    'subtype',
    'progression',
    'treatment_response'
  ];
  for (const field of candidateFields) {
    const current = merged[field] || '';
    const next = incoming[field] || '';
    if (!current || scoreSpecificity(next) > scoreSpecificity(current)) {
      merged[field] = next || null;
    }
  }
  if (incoming.status === 'excluded') {
    merged.status = 'excluded';
  }
  if (incoming.source_sentence && !(merged.source_sentences || []).includes(incoming.source_sentence)) {
    merged.source_sentences = [...(merged.source_sentences || []), incoming.source_sentence];
  }
  if (!merged.source_sentence && incoming.source_sentence) {
    merged.source_sentence = incoming.source_sentence;
  }
  return merged;
}

function finalizeFeature(feature) {
  return {
    phenotype_curie: feature.phenotype_curie,
    label: feature.label,
    status: feature.status || 'present',
    frequency: isValidFrequency(feature.frequency) ? sanitizeMetadataValue(feature.frequency) : null,
    onset: sanitizeMetadataValue(feature.onset),
    severity: sanitizeMetadataValue(feature.severity),
    subtype: sanitizeMetadataValue(feature.subtype),
    progression: sanitizeMetadataValue(feature.progression),
    treatment_response: isValidTreatmentResponse(feature.treatment_response)
      ? sanitizeMetadataValue(feature.treatment_response)
      : null,
    confidence: 'anchor_validated',
    source_sentence: feature.source_sentence || '',
    source_sentences: feature.source_sentences || []
  };
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const inputJson = flags.input || DEFAULTS.inputJson;
  const outputDir = flags.output || DEFAULTS.outputDir;
  const textCacheDir = flags.textCacheDir || DEFAULTS.textCacheDir;
  const provider = String(flags.provider || DEFAULTS.provider).toLowerCase();
  const model = flags.model || DEFAULTS.model;
  const apiKey = flags.apiKey || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '';
  const start = Number.parseInt(flags.start || '0', 10) || 0;
  const limit = Number.parseInt(flags.limit || '10', 10) || 10;
  const maxAnchorsPerCall = Number.parseInt(flags.maxAnchorsPerCall || String(DEFAULTS.maxAnchorsPerCall), 10);
  const thinkingBudget = Number.parseInt(flags.thinkingBudget || String(DEFAULTS.thinkingBudget), 10);
  const resume = flags.noResume ? false : true;

  if (provider !== 'gemini') {
    throw new Error(`This script currently supports gemini only. Received provider=${provider}`);
  }
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY is required.');
  }

  const input = JSON.parse(await fsp.readFile(inputJson, 'utf8'));
  const slice = input.slice(start, start + limit);
  await fsp.mkdir(outputDir, { recursive: true });

  const lexicon = await withClient((client) => loadPhenotypeLexicon(client, DEFAULTS.maxAnchorWords));
  console.log(
    JSON.stringify(
      {
        lexiconPhrases: lexicon.uniqueMap.size,
        ambiguousPhrases: lexicon.ambiguousMap.size,
        processing: slice.length,
        provider,
        model
      },
      null,
      2
    )
  );

  const results = [];
  const errors = [];
  const usageTotals = {
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
    thoughts_tokens: 0
  };
  let abortedForQuota = false;

  for (let offset = 0; offset < slice.length; offset += 1) {
    const entry = slice[offset];
    const idx = start + offset;
    const baseName = toBaseName(entry, `entry_${idx + 1}`);
    const existing = resume ? findExistingOutput(outputDir, baseName) : { jsonPath: '', textPath: '' };

    console.log(`[${idx + 1}/${input.length}] ${entry.chapter_title || entry.chapter_path}`);

    try {
      if (existing.jsonPath) {
        console.log(`  Resume hit — skipping existing extraction ${path.basename(existing.jsonPath)}`);
        const cached = JSON.parse(await fsp.readFile(existing.jsonPath, 'utf8'));
        results.push({
          chapter_title: cached.chapter_title || entry.chapter_title || '',
          nbk_id: cached.nbk_id || '',
          feature_count: (cached.features || []).length,
          resumed: true
        });
        continue;
      }

      let clinicalText = '';
      let resolvedNbkId = '';
      let chapterTitle = entry.chapter_title || '';
      const cachedText = resume ? findCachedText(outputDir, baseName) || findCachedText(textCacheDir, baseName) : '';
      if (cachedText) {
        console.log(`  Resume hit — reusing cached text ${path.basename(cachedText)}`);
        clinicalText = await fsp.readFile(cachedText, 'utf8');
        resolvedNbkId = extractNbkId(cachedText);
      } else {
        console.log('  Fetching GeneReviews text...');
        const fetched = await fetchGeneReviewsText(entry);
        clinicalText = fetched.clinicalText;
        resolvedNbkId = fetched.resolvedNbkId;
        chapterTitle = fetched.chapterTitle;
        await sleep(DEFAULTS.ncbiDelayMs);
      }

      if (!clinicalText || clinicalText.length < 100) {
        errors.push({
          chapter_title: entry.chapter_title || '',
          chapter_path: entry.chapter_path || '',
          error: 'short_text'
        });
        continue;
      }

      const textPath = path.join(outputDir, `${baseName}_${resolvedNbkId}_text.txt`);
      if (!fs.existsSync(textPath)) {
        await fsp.writeFile(textPath, clinicalText);
      }

      const blocks = splitIntoBlocks(clinicalText);
      const proseBlocks = blocks.filter((block) => !isTableLikeBlock(block.text));
      const tableBlocks = blocks.filter((block) => isTableLikeBlock(block.text));
      const chapterFeatureMap = new Map();
      let blockCallCount = 0;
      let anchorCount = 0;

      for (const block of proseBlocks) {
        const anchors = findAnchorsInBlock(block.text, lexicon);
        if (!anchors.length) continue;
        anchorCount += anchors.length;
        const anchorChunks = loadChunks(anchors, maxAnchorsPerCall);
        for (const anchorChunk of anchorChunks) {
          blockCallCount += 1;
          const { parsed, usage } = await callGeminiMetadata(
            block.text,
            anchorChunk,
            apiKey,
            model,
            thinkingBudget
          );
          if (usage) {
            usageTotals.prompt_tokens += Number(usage.promptTokenCount || 0);
            usageTotals.completion_tokens += Number(usage.candidatesTokenCount || 0);
            usageTotals.total_tokens += Number(usage.totalTokenCount || 0);
            usageTotals.thoughts_tokens += Number(usage.thoughtsTokenCount || 0);
          }

          const items = Array.isArray(parsed?.items) ? parsed.items : [];
          for (const item of items) {
            if (!item || item.supported === false) continue;
            const phenotypeCurie = String(item.phenotype_curie || '').trim();
            const anchor = anchorChunk.find((candidate) => candidate.phenotypeCurie === phenotypeCurie);
            if (!anchor) continue;

            const incoming = {
              phenotype_curie: anchor.phenotypeCurie,
              label: anchor.phenotypeLabel,
              status: String(item.status || 'present').trim().toLowerCase() === 'excluded' ? 'excluded' : 'present',
              frequency: item.frequency || null,
              onset: item.onset || null,
              severity: item.severity || null,
              subtype: item.subtype || null,
              progression: item.progression || null,
              treatment_response: item.treatment_response || null,
              source_sentence: item.source_sentence || '',
              block_id: block.blockId,
              matched_phrase: anchor.matchedPhrase
            };
            const existingFeature = chapterFeatureMap.get(anchor.phenotypeCurie);
            chapterFeatureMap.set(anchor.phenotypeCurie, mergeFeature(existingFeature, incoming));
          }
        }
      }

      const features = [...chapterFeatureMap.values()]
        .map(finalizeFeature)
        .sort((left, right) => left.label.localeCompare(right.label));

      const payload = {
        created_at: new Date().toISOString(),
        pipeline: 'anchor_first_metadata',
        provider,
        model,
        chapter_title: chapterTitle || entry.chapter_title || '',
        nbk_id: resolvedNbkId,
        chapter_path: entry.chapter_path || '',
        disease_curie: entry.disease_curie || '',
        disease_label: entry.disease_label || '',
        stats: {
          total_blocks: blocks.length,
          prose_blocks: proseBlocks.length,
          table_like_blocks: tableBlocks.length,
          anchor_count: anchorCount,
          llm_block_calls: blockCallCount
        },
        usage_totals: { ...usageTotals },
        features
      };

      const outPath = path.join(outputDir, `${baseName}_${resolvedNbkId}.json`);
      await fsp.writeFile(outPath, `${JSON.stringify(payload, null, 2)}\n`);

      results.push({
        chapter_title: payload.chapter_title,
        nbk_id: resolvedNbkId,
        feature_count: features.length,
        prose_blocks: proseBlocks.length,
        table_like_blocks: tableBlocks.length,
        anchor_count: anchorCount,
        llm_block_calls: blockCallCount
      });
    } catch (error) {
      console.error(`  ERROR: ${error.message}`);
      errors.push({
        chapter_title: entry.chapter_title || '',
        chapter_path: entry.chapter_path || '',
        error: error.message
      });
      if (isInsufficientQuotaError(error)) {
        abortedForQuota = true;
        break;
      }
    }
  }

  const summary = {
    created_at: new Date().toISOString(),
    pipeline: 'anchor_first_metadata',
    provider,
    model,
    total_processed: results.length,
    total_errors: errors.length,
    total_features: results.reduce((sum, row) => sum + row.feature_count, 0),
    aborted_for_quota: abortedForQuota,
    usage_totals: usageTotals,
    results,
    errors
  };

  await fsp.writeFile(path.join(outputDir, 'extraction_summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(
    JSON.stringify(
      {
        outputDir,
        totalProcessed: summary.total_processed,
        totalErrors: summary.total_errors,
        totalFeatures: summary.total_features,
        usageTotals: usageTotals
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
