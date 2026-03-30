import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';

const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const NCBI_BOOKS_URL = 'https://www.ncbi.nlm.nih.gov/books';
const MODE_OF_INHERITANCE_ROOT = 'HP:0000005';
const CLINICAL_MODIFIER_ROOT = 'HP:0012823';

const NON_PHENOTYPE_PHRASES = new Set([
  'affected',
  'bilateral',
  'unilateral',
  'family history',
  'autosomal dominant inheritance',
  'autosomal recessive inheritance',
  'x linked inheritance',
  'x linked dominant inheritance',
  'x linked recessive inheritance',
  'mitochondrial inheritance',
  'digenic inheritance'
]);

const ENGLISH_FREQUENCY_TERMS = Object.freeze([
  'very frequent',
  'frequent',
  'occasional',
  'very rare',
  'all',
  'most',
  'majority',
  'many',
  'some',
  'few',
  'minority',
  'rare',
  'uncommon',
  'common'
]);

const ONSET_MAPPINGS = Object.freeze([
  { terms: ['congenital', 'at birth', 'prenatal', 'in utero'], hpoId: 'HP:0003577', label: 'Congenital onset' },
  { terms: ['neonatal', 'first month'], hpoId: 'HP:0003623', label: 'Neonatal onset' },
  { terms: ['first year', 'in infancy', 'during infancy', 'infancy'], hpoId: 'HP:0003593', label: 'Infantile onset' },
  { terms: ['early childhood', 'in childhood', 'during childhood', 'childhood', 'pediatric onset'], hpoId: 'HP:0011463', label: 'Childhood onset' },
  { terms: ['juvenile onset', 'in adolescence', 'during adolescence', 'adolescence', 'adolescent onset'], hpoId: 'HP:0003621', label: 'Juvenile onset' },
  { terms: ['adult onset', 'in adulthood', 'during adulthood', 'adulthood'], hpoId: 'HP:0003581', label: 'Adult onset' }
]);

const FEATURE_SOURCE_WEIGHTS = Object.freeze({
  graph_exact_anchor: 3,
  graph_alias_anchor: 2,
  llm_candidate: 0
});

const FEATURE_TRUST_WEIGHTS = Object.freeze({
  high: 2,
  medium: 1,
  reject: 0
});

export function parseArgs(argv) {
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

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeLabel(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function slugify(value) {
  return String(value || '')
    .trim()
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function extractNbkId(value) {
  const match = String(value || '').match(/(NBK\d+)/i);
  return match ? match[1].toUpperCase() : '';
}

export function toBaseName(entry, fallback = '') {
  return String(entry.chapterTitle || entry.chapter_title || entry.gene_symbol || entry.nbkId || entry.nbk_id || entry.chapterPath || entry.chapter_path || fallback)
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

export async function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(await fsp.readFile(filePath, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') return fallback;
    throw error;
  }
}

export async function writeJson(filePath, value) {
  await ensureDir(path.dirname(filePath));
  await fsp.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export async function writeText(filePath, value) {
  await ensureDir(path.dirname(filePath));
  await fsp.writeFile(filePath, value);
}

export async function loadPolicyFile(policyJson) {
  const payload = JSON.parse(await fsp.readFile(policyJson, 'utf8'));
  const chapters = Array.isArray(payload?.chapters) ? payload.chapters : [];
  return {
    payload,
    chapters
  };
}

export function sliceChapters(chapters, start = 0, limit = chapters.length) {
  return chapters.slice(start, start + limit);
}

export function createStageTracker(outputDir, progressName = 'progress.json') {
  const progressPath = path.join(outputDir, progressName);
  return {
    progressPath,
    async load() {
      return (await readJson(progressPath, null)) || {
        created_at: new Date().toISOString(),
        total_processed: 0,
        total_errors: 0,
        last_index: -1,
        last_chapter_key: '',
        results: [],
        errors: []
      };
    },
    async save(progress) {
      await writeJson(progressPath, progress);
    }
  };
}

export function findExistingOutput(outputDir, baseName, suffix) {
  const filePath = path.join(outputDir, `${baseName}_${suffix}`);
  return fs.existsSync(filePath) ? filePath : '';
}

export function decodeHtmlEntities(text) {
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

export function stripHtml(text) {
  return decodeHtmlEntities(
    String(text || '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<\/dd>/gi, '\n')
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

function parseHtmlTable(tableHtml, index) {
  const caption =
    decodeHtmlEntities(tableHtml.match(/<caption[^>]*>([\s\S]*?)<\/caption>/i)?.[1] || '') || `Table ${index + 1}`;
  const rows = [...tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((match) => {
    return [...match[1].matchAll(/<(th|td)[^>]*>([\s\S]*?)<\/\1>/gi)].map((cellMatch) => stripHtml(cellMatch[2]));
  });
  return {
    table_index: index + 1,
    caption,
    rows: rows.filter((row) => row.length)
  };
}

export function extractClinicalSectionsAndTables(html) {
  const blockSources = [
    extractSectionBlock(html, /<div id="[^"]+\.Clinical_Characteristics">/i),
    extractSectionBlock(html, /<div id="[^"]+\.Clinical_Description">/i),
    extractSectionBlock(html, /<div id="[^"]+\.Suggestive_Findings">/i)
  ].filter(Boolean);

  const sourceBlocks = blockSources.length
    ? blockSources
    : [...html.matchAll(/<(p|li|dd)[^>]*>([\s\S]*?)<\/\1>/gi)].map((match) => match[0]);

  const tables = [];
  const proseSections = sourceBlocks
    .map((sectionHtml) => {
      const localTables = [...sectionHtml.matchAll(/<table[\s\S]*?<\/table>/gi)].map((match, index) =>
        parseHtmlTable(match[0], tables.length + index)
      );
      tables.push(...localTables);
      return sectionHtml.replace(/<table[\s\S]*?<\/table>/gi, ' ');
    })
    .map(stripHtml)
    .filter(Boolean)
    .filter((text, index, list) => list.indexOf(text) === index);

  return {
    proseText: proseSections.join('\n\n').trim(),
    tables
  };
}

export async function fetchGeneReviewsChapter(entry, delayMs = 400) {
  const nbkId = String(entry.nbkId || entry.nbk_id || '').trim();
  const chapterPath = String(entry.chapterPath || entry.chapter_path || '').trim();
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

  const rawHtml = await response.text();
  const { proseText, tables } = extractClinicalSectionsAndTables(rawHtml);
  const resolvedNbkId =
    rawHtml.match(/meta name="ncbi_acc" content="(NBK\d+)"/i)?.[1] ||
    rawHtml.match(/\/books\/(NBK\d+)\//i)?.[1] ||
    nbkId;
  const chapterTitle =
    decodeHtmlEntities(
      rawHtml.match(/<title>(.*?)<\/title>/i)?.[1] ||
        rawHtml.match(/<h1[^>]*>\s*<span[^>]*>(.*?)<\/span>/i)?.[1] ||
        entry.chapterTitle ||
        entry.chapter_title ||
        resolvedNbkId
    ) ||
    entry.chapterTitle ||
    entry.chapter_title ||
    resolvedNbkId;

  await sleep(delayMs);

  return {
    rawHtml,
    clinicalText: proseText,
    tables,
    resolvedNbkId,
    chapterTitle,
    provenanceUrl: `${NCBI_BOOKS_URL}/${resolvedNbkId}/`
  };
}

export function splitSentences(text) {
  return String(text || '')
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

export function splitParagraphs(text) {
  return String(text || '')
    .replace(/\n{3,}/g, '\n\n')
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function findBestSentenceForPhrase(paragraph, phrase) {
  const normalizedPhrase = normalizeText(phrase);
  for (const sentence of splitSentences(paragraph)) {
    if (normalizeText(sentence).includes(normalizedPhrase)) {
      return sentence;
    }
  }
  return splitSentences(paragraph)[0] || paragraph;
}

function buildPhraseCandidates(rows, maxAnchorWords) {
  const phraseCandidates = new Map();
  for (const row of rows) {
    const candidates = [
      { phrase: row.canonical_label, matchType: 'exact_label' },
      ...(row.aliases || []).map((alias) => ({ phrase: alias.alias_label, matchType: 'alias' }))
    ];
    for (const candidate of candidates) {
      const normalizedPhrase = normalizeText(candidate.phrase);
      if (!normalizedPhrase) continue;
      const wordCount = normalizedPhrase.split(' ').filter(Boolean).length;
      if (!wordCount || wordCount > maxAnchorWords) continue;
      if (normalizedPhrase.length < 4) continue;
      const bucket = phraseCandidates.get(normalizedPhrase) || [];
      bucket.push({
        hpoId: row.canonical_curie,
        hpoLabel: row.canonical_label,
        description: row.description || '',
        icScore: Number(row.ic_score || 0),
        isInheritance: Boolean(row.is_inheritance),
        isClinicalModifier: Boolean(row.is_clinical_modifier),
        matchType: candidate.matchType,
        wordCount
      });
      phraseCandidates.set(normalizedPhrase, bucket);
    }
  }
  return phraseCandidates;
}

export function buildPhenotypeLexicon(rows, maxAnchorWords = 8) {
  const phraseCandidates = buildPhraseCandidates(rows, maxAnchorWords);
  const uniqueMap = new Map();
  const ambiguousMap = new Map();
  for (const [phrase, candidates] of phraseCandidates.entries()) {
    const unique = [...new Map(candidates.map((candidate) => [`${candidate.hpoId}:${candidate.matchType}`, candidate])).values()];
    const uniqueByHpo = [...new Map(unique.map((candidate) => [candidate.hpoId, candidate])).values()];
    if (uniqueByHpo.length === 1) {
      uniqueMap.set(phrase, uniqueByHpo[0]);
    } else if (uniqueByHpo.length > 1) {
      ambiguousMap.set(phrase, uniqueByHpo);
    }
  }

  return {
    rows,
    uniqueMap,
    ambiguousMap,
    maxWords: Math.max(...[...uniqueMap.values()].map((row) => row.wordCount), 1)
  };
}

export async function loadPhenotypeBaseRows(client) {
  const branchFlags = await client.query(
    `
      WITH RECURSIVE descendants AS (
        SELECT entity_id, canonical_curie, canonical_curie AS root_curie
        FROM entities
        WHERE canonical_curie = ANY($1::text[])

        UNION ALL

        SELECT child.entity_id, child.canonical_curie, descendants.root_curie
        FROM descendants
        INNER JOIN relationships rel
          ON rel.object_entity_id = descendants.entity_id
         AND rel.predicate_key = 'is_a'
        INNER JOIN entities child
          ON child.entity_id = rel.subject_entity_id
        WHERE child.entity_type = 'phenotype'
      )
      SELECT entity_id, root_curie
      FROM descendants
    `,
    [[MODE_OF_INHERITANCE_ROOT, CLINICAL_MODIFIER_ROOT]]
  );

  const inheritanceIds = new Set(
    branchFlags.rows.filter((row) => row.root_curie === MODE_OF_INHERITANCE_ROOT).map((row) => Number(row.entity_id))
  );
  const modifierIds = new Set(
    branchFlags.rows.filter((row) => row.root_curie === CLINICAL_MODIFIER_ROOT).map((row) => Number(row.entity_id))
  );

  const result = await client.query(
    `
      SELECT
        e.entity_id,
        e.canonical_curie,
        e.canonical_label,
        e.description,
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
      LEFT JOIN entity_aliases a
        ON a.entity_id = e.entity_id
      WHERE e.entity_type = 'phenotype'
        AND e.is_placeholder = FALSE
      GROUP BY e.entity_id, e.canonical_curie, e.canonical_label, e.description
      ORDER BY e.canonical_curie ASC
    `
  );

  return result.rows.map((row) => ({
    ...row,
    ic_score: null,
    is_inheritance: inheritanceIds.has(Number(row.entity_id)),
    is_clinical_modifier: modifierIds.has(Number(row.entity_id))
  }));
}

export async function loadPhenotypeRows(client) {
  const baseRows = await loadPhenotypeBaseRows(client);
  const icRows = await client.query(
    `
      WITH disease_phenotypes AS (
        SELECT DISTINCT
          c.subject_entity_id AS disease_entity_id,
          c.phenotype_entity_id AS phenotype_entity_id
        FROM clinical_phenotype_assertions c
        INNER JOIN entities disease
          ON disease.entity_id = c.subject_entity_id
        WHERE disease.entity_type = 'disease'
          AND disease.is_placeholder = FALSE
          AND c.presence_status = 'present'

        UNION

        SELECT DISTINCT
          rel.subject_entity_id AS disease_entity_id,
          rel.object_entity_id AS phenotype_entity_id
        FROM relationships rel
        INNER JOIN entities disease
          ON disease.entity_id = rel.subject_entity_id
        INNER JOIN entities phenotype
          ON phenotype.entity_id = rel.object_entity_id
        WHERE rel.predicate_key = 'has_phenotype'
          AND disease.entity_type = 'disease'
          AND disease.is_placeholder = FALSE
          AND phenotype.entity_type = 'phenotype'
          AND phenotype.is_placeholder = FALSE
      ),
      totals AS (
        SELECT COUNT(DISTINCT disease_entity_id)::NUMERIC AS disease_count
        FROM disease_phenotypes
      )
      SELECT
        phenotype_entity_id,
        CASE
          WHEN COUNT(DISTINCT disease_entity_id) = 0 THEN 0::NUMERIC
          ELSE -LN(COUNT(DISTINCT disease_entity_id)::NUMERIC / NULLIF(MAX(totals.disease_count), 0))
        END AS ic_score
      FROM disease_phenotypes
      CROSS JOIN totals
      GROUP BY phenotype_entity_id
    `
  );
  const icByEntityId = new Map(icRows.rows.map((row) => [Number(row.phenotype_entity_id), Number(row.ic_score || 0)]));
  return baseRows.map((row) => ({
    ...row,
    ic_score: icByEntityId.get(Number(row.entity_id)) || 0
  }));
}

export function extractAnchorOccurrences(paragraphs, lexicon, options = {}) {
  const minIc = Number(options.minIc ?? 0);
  const chapterMap = new Map();

  for (let paragraphIndex = 0; paragraphIndex < paragraphs.length; paragraphIndex += 1) {
    const paragraph = paragraphs[paragraphIndex];
    const normalized = normalizeText(paragraph);
    if (!normalized) continue;
    const words = normalized.split(' ').filter(Boolean);

    for (let size = lexicon.maxWords; size >= 1; size -= 1) {
      for (let index = 0; index <= words.length - size; index += 1) {
        const phrase = words.slice(index, index + size).join(' ');
        const candidate = lexicon.uniqueMap.get(phrase);
        if (!candidate) continue;
        if (candidate.isInheritance || candidate.isClinicalModifier) continue;
        if (NON_PHENOTYPE_PHRASES.has(phrase)) continue;
        if ((candidate.icScore || 0) < minIc) continue;

        const sentence = findBestSentenceForPhrase(paragraph, phrase);
        const existing = chapterMap.get(candidate.hpoId) || {
          hpo_id: candidate.hpoId,
          hpo_label: candidate.hpoLabel,
          ic_score: candidate.icScore || 0,
          match_types: new Set(),
          occurrences: []
        };
        existing.match_types.add(candidate.matchType);
        existing.occurrences.push({
          match_text: phrase,
          sentence,
          paragraph,
          match_type: candidate.matchType,
          paragraph_index: paragraphIndex + 1
        });
        chapterMap.set(candidate.hpoId, existing);
      }
    }
  }

  return [...chapterMap.values()]
    .map((row) => ({
      hpo_id: row.hpo_id,
      hpo_label: row.hpo_label,
      ic_score: row.ic_score,
      match_types: [...row.match_types].sort(),
      occurrences: row.occurrences
    }))
    .sort((left, right) => left.hpo_label.localeCompare(right.hpo_label));
}

function diceCoefficient(left, right) {
  const leftNorm = normalizeText(left);
  const rightNorm = normalizeText(right);
  if (!leftNorm || !rightNorm) return 0;
  if (leftNorm === rightNorm) return 1;
  const leftTokens = new Set(leftNorm.split(' '));
  const rightTokens = new Set(rightNorm.split(' '));
  let overlap = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) overlap += 1;
  }
  return (2 * overlap) / (leftTokens.size + rightTokens.size);
}

export function matchesExistingAnchor(candidateLabel, anchors) {
  const normalizedCandidate = normalizeText(candidateLabel);
  if (!normalizedCandidate) return false;
  for (const anchor of anchors) {
    if (normalizeText(anchor.hpo_label) === normalizedCandidate) return true;
    for (const occurrence of anchor.occurrences || []) {
      if (normalizeText(occurrence.match_text) === normalizedCandidate) return true;
    }
    if (diceCoefficient(candidateLabel, anchor.hpo_label) >= 0.85) return true;
  }
  return false;
}

export function locateCandidateContext(clinicalText, candidateLabel) {
  const paragraphs = splitParagraphs(clinicalText);
  let best = {
    score: 0,
    sentence: '',
    paragraph: ''
  };
  for (const paragraph of paragraphs) {
    const sentence = findBestSentenceForPhrase(paragraph, candidateLabel);
    const score = Math.max(diceCoefficient(candidateLabel, paragraph), diceCoefficient(candidateLabel, sentence));
    if (score > best.score) {
      best = { score, sentence, paragraph };
    }
  }
  return {
    source_sentence: best.sentence || '',
    paragraph: best.paragraph || ''
  };
}

export async function callGeminiJson({ apiKey, model, systemPrompt, userPayload, temperature = 0.1, thinkingBudget = 0 }) {
  const response = await fetch(`${GEMINI_API_BASE_URL}/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: typeof userPayload === 'string' ? userPayload : JSON.stringify(userPayload, null, 2) }]
        }
      ],
      generationConfig: {
        temperature,
        responseMimeType: 'application/json',
        thinkingConfig: {
          thinkingBudget
        }
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  const rawContent =
    data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('\n').trim() || '';
  const cleaned = rawContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  let parsed = null;
  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    parsed = null;
  }

  return {
    parsed,
    rawOutput: rawContent,
    usage: data.usageMetadata || null
  };
}

export async function callOpenAiCompatJson({
  baseUrl,
  apiKey,
  model,
  systemPrompt,
  userPayload,
  temperature = 0.1,
  extraBody = {}
}) {
  const response = await fetch(`${String(baseUrl || '').replace(/\/+$/g, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: typeof userPayload === 'string' ? userPayload : JSON.stringify(userPayload, null, 2)
        }
      ],
      ...extraBody
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI-compatible API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content?.trim() || '';
  const cleaned = rawContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  let parsed = null;
  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    parsed = null;
  }

  return {
    parsed,
    rawOutput: rawContent,
    usage: data.usage || null
  };
}

export async function callGeminiEmbedding({ apiKey, model = 'gemini-embedding-001', text, taskType = 'SEMANTIC_SIMILARITY' }) {
  const response = await fetch(`${GEMINI_API_BASE_URL}/${model}:embedContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: `models/${model}`,
      content: {
        parts: [{ text }]
      },
      taskType
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini embedding error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return {
    embedding: data.embedding?.values || [],
    usage: data.metadata || null
  };
}

export async function callGeminiBatchEmbeddings({
  apiKey,
  model = 'gemini-embedding-001',
  texts,
  taskType = 'SEMANTIC_SIMILARITY'
}) {
  const response = await fetch(`${GEMINI_API_BASE_URL}/${model}:batchEmbedContents?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: (texts || []).map((text) => ({
        model: `models/${model}`,
        content: {
          parts: [{ text }]
        },
        taskType
      }))
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini batch embedding error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return {
    embeddings: (data.embeddings || []).map((entry) => entry.values || []),
    usage: data.metadata || null
  };
}

export function cosineSimilarity(left, right) {
  if (!left.length || !right.length || left.length !== right.length) return 0;
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftNorm += left[index] * left[index];
    rightNorm += right[index] * right[index];
  }
  if (!leftNorm || !rightNorm) return 0;
  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

export function buildEmbeddingText(row) {
  const aliases = (row.aliases || []).map((alias) => alias.alias_label).filter(Boolean);
  return `${row.canonical_label}. ${row.description || ''}${aliases.length ? ` Synonyms: ${aliases.join('; ')}` : ''}`.trim();
}

function hasNormalizedPhrase(text, phrase) {
  const normalizedText = normalizeText(text);
  const normalizedPhrase = normalizeText(phrase);
  if (!normalizedText || !normalizedPhrase) return false;
  const textWords = normalizedText.split(' ').filter(Boolean);
  const phraseWords = normalizedPhrase.split(' ').filter(Boolean);
  for (let index = 0; index <= textWords.length - phraseWords.length; index += 1) {
    let matches = true;
    for (let offset = 0; offset < phraseWords.length; offset += 1) {
      if (textWords[index + offset] !== phraseWords[offset]) {
        matches = false;
        break;
      }
    }
    if (matches) return true;
  }
  return false;
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findRawMatchIndex(text, matchText) {
  const source = String(text || '');
  const rawMatch = String(matchText || '').trim();
  if (!source || !rawMatch) return -1;
  const lowerSource = source.toLowerCase();
  const directIndex = lowerSource.indexOf(rawMatch.toLowerCase());
  if (directIndex !== -1) return directIndex;

  const normalizedWords = normalizeText(rawMatch).split(' ').filter(Boolean);
  if (!normalizedWords.length) return -1;
  const separatorTolerant = new RegExp(`\\b${normalizedWords.map(escapeRegex).join('[^a-z0-9]+')}\\b`, 'i');
  const fuzzyMatch = lowerSource.match(separatorTolerant);
  return fuzzyMatch?.index ?? -1;
}

function pickClosestMatch(matchIndex, matches) {
  if (!matches.length) return null;
  if (matchIndex === -1) return matches[0];
  return matches
    .slice()
    .sort((left, right) => Math.abs(left.index - matchIndex) - Math.abs(right.index - matchIndex))[0];
}

function collectFrequencyCandidates(raw) {
  const candidates = [];
  for (const match of raw.matchAll(/(\d+(?:\.\d+)?)%/g)) {
    candidates.push({
      index: match.index || 0,
      frequency_value: `${match[1]}%`,
      frequency_raw: match[0],
      frequency_trust: 'high'
    });
  }
  for (const match of raw.matchAll(/(\d+)\s*\/\s*(\d+)/g)) {
    candidates.push({
      index: match.index || 0,
      frequency_value: `${match[1]}/${match[2]}`,
      frequency_raw: match[0],
      frequency_trust: 'high'
    });
  }
  for (const term of ENGLISH_FREQUENCY_TERMS) {
    const regex = new RegExp(`\\b${escapeRegex(term).replace(/\\ /g, '\\\\s+')}\\b`, 'gi');
    for (const match of raw.matchAll(regex)) {
      candidates.push({
        index: match.index || 0,
        frequency_value: term,
        frequency_raw: match[0],
        frequency_trust: 'high'
      });
    }
  }
  return candidates;
}

function collectOnsetCandidates(raw) {
  const candidates = [];
  for (const mapping of ONSET_MAPPINGS) {
    for (const term of mapping.terms) {
      const regex = new RegExp(`\\b${escapeRegex(term).replace(/\\ /g, '\\\\s+')}\\b`, 'gi');
      for (const match of raw.matchAll(regex)) {
        candidates.push({
          index: match.index || 0,
          onset_hpo_id: mapping.hpoId,
          onset_label: mapping.label,
          onset_raw: match[0],
          onset_trust: 'high'
        });
      }
    }
  }
  return candidates;
}

function pickAdjacentMatch(matchIndex, matchText, matches, { beforeChars = 24, afterChars = 32 } = {}) {
  if (matchIndex === -1) return null;
  const matchLength = String(matchText || '').length;
  const after = matches
    .filter((candidate) => candidate.index >= matchIndex + matchLength && candidate.index <= matchIndex + matchLength + afterChars)
    .sort((left, right) => left.index - right.index)[0];
  if (after) return after;
  const before = matches
    .filter((candidate) => candidate.index < matchIndex && candidate.index >= matchIndex - beforeChars)
    .sort((left, right) => right.index - left.index)[0];
  return before || null;
}

function pickPreferredFrequencyMatch(raw, matchIndex, matchText, candidates) {
  if (matchIndex === -1) return null;
  const matchLength = String(matchText || '').length;
  const before = candidates
    .filter((candidate) => candidate.index < matchIndex && candidate.index >= matchIndex - 48)
    .sort((left, right) => right.index - left.index)[0];
  const after = candidates
    .filter((candidate) => candidate.index >= matchIndex + matchLength && candidate.index <= matchIndex + matchLength + 40)
    .sort((left, right) => left.index - right.index)[0];
  const isNumericLike = (candidate) =>
    Boolean(candidate) &&
    (/^\d+(?:\.\d+)?%$/.test(String(candidate.frequency_value || '')) || /^\d+\/\d+$/.test(String(candidate.frequency_value || '')));
  const hasTightBeforeBinding = (candidate) => {
    if (!candidate) return false;
    if (isNumericLike(candidate)) return true;
    const between = raw.slice(candidate.index + String(candidate.frequency_raw || '').length, matchIndex);
    const betweenWords = normalizeText(between).split(' ').filter(Boolean).length;
    return betweenWords <= 3;
  };

  if (before && after) {
    const afterText = raw.slice(matchIndex + matchLength, Math.min(raw.length, after.index + 24)).toLowerCase();
    if (/^\s*[,;]\s*(especially|including|such as|notably|for example)\b/.test(afterText)) {
      return hasTightBeforeBinding(before) ? before : null;
    }

    const beforeGap = matchIndex - (before.index + String(before.frequency_raw || '').length);
    const afterGap = after.index - (matchIndex + matchLength);
    if (beforeGap <= afterGap && hasTightBeforeBinding(before)) return before;
    return after;
  }

  if (after) return after;
  if (hasTightBeforeBinding(before)) return before;
  return null;
}

export function extractLocalMatchWindow(text, matchText, windowWords = 4) {
  const sentence = String(text || '').trim();
  const rawWords = sentence.split(/\s+/).filter(Boolean);
  if (!rawWords.length) return '';

  const rawMatch = String(matchText || '').trim();
  if (rawMatch) {
    const lowerSentence = sentence.toLowerCase();
    const lowerMatch = rawMatch.toLowerCase();
    const charIndex = lowerSentence.indexOf(lowerMatch);
    if (charIndex !== -1) {
      let wordIndex = 0;
      let seenChars = 0;
      for (let index = 0; index < rawWords.length; index += 1) {
        seenChars = sentence.indexOf(rawWords[index], seenChars);
        if (seenChars === -1) break;
        if (seenChars + rawWords[index].length > charIndex) {
          wordIndex = index;
          break;
        }
        seenChars += rawWords[index].length;
      }
      const matchWordLength = rawMatch.split(/\s+/).filter(Boolean).length || 1;
      const start = Math.max(0, wordIndex - windowWords);
      const end = Math.min(rawWords.length, wordIndex + matchWordLength + windowWords);
      return rawWords.slice(start, end).join(' ');
    }
  }

  const normalizedTarget = normalizeText(matchText);
  if (!normalizedTarget) return sentence;
  const targetWords = normalizedTarget.split(' ').filter(Boolean);
  const normalizedWords = rawWords.map((word) => normalizeText(word));

  let matchIndex = -1;
  for (let index = 0; index <= normalizedWords.length - targetWords.length; index += 1) {
    let matches = true;
    for (let offset = 0; offset < targetWords.length; offset += 1) {
      if (normalizedWords[index + offset] !== targetWords[offset]) {
        matches = false;
        break;
      }
    }
    if (matches) {
      matchIndex = index;
      break;
    }
  }

  if (matchIndex === -1) return sentence;
  const start = Math.max(0, matchIndex - windowWords);
  const end = Math.min(rawWords.length, matchIndex + targetWords.length + windowWords);
  return rawWords.slice(start, end).join(' ');
}

export function extractDeterministicFrequency(text) {
  const raw = String(text || '');
  const percent = raw.match(/(\d+(?:\.\d+)?)%/);
  if (percent) {
    return {
      frequency_value: percent[1] + '%',
      frequency_raw: percent[0],
      frequency_trust: 'high'
    };
  }
  const fraction = raw.match(/(\d+)\s*\/\s*(\d+)/);
  if (fraction) {
    return {
      frequency_value: `${fraction[1]}/${fraction[2]}`,
      frequency_raw: fraction[0],
      frequency_trust: 'high'
    };
  }
  const term = ENGLISH_FREQUENCY_TERMS.find((candidate) => hasNormalizedPhrase(raw, candidate));
  if (term) {
    return {
      frequency_value: term,
      frequency_raw: term,
      frequency_trust: 'high'
    };
  }
  return {
    frequency_value: null,
    frequency_raw: null,
    frequency_trust: 'not_extracted_deterministic'
  };
}

export function extractScopedFrequency(text, matchText) {
  const raw = String(text || '');
  const matchIndex = findRawMatchIndex(raw, matchText);
  const candidates = collectFrequencyCandidates(raw);

  const adjacent = pickPreferredFrequencyMatch(raw, matchIndex, matchText, candidates);
  if (!adjacent) {
    return {
      frequency_value: null,
      frequency_raw: null,
      frequency_trust: 'not_extracted_deterministic'
    };
  }
  return {
    frequency_value: adjacent.frequency_value,
    frequency_raw: adjacent.frequency_raw,
    frequency_trust: adjacent.frequency_trust
  };
}

export function extractDeterministicOnset(text) {
  for (const mapping of ONSET_MAPPINGS) {
    if (mapping.terms.some((term) => hasNormalizedPhrase(text, term))) {
      return {
        onset_hpo_id: mapping.hpoId,
        onset_label: mapping.label,
        onset_raw: mapping.terms.find((term) => hasNormalizedPhrase(text, term)) || mapping.label,
        onset_trust: 'high'
      };
    }
  }
  return {
    onset_hpo_id: null,
    onset_label: null,
    onset_raw: null,
    onset_trust: 'not_extracted_deterministic'
  };
}

export function extractScopedOnset(text, matchText) {
  const raw = String(text || '');
  const matchIndex = findRawMatchIndex(raw, matchText);
  const candidates = collectOnsetCandidates(raw);
  const adjacent = pickAdjacentMatch(matchIndex, matchText, candidates, { beforeChars: 0, afterChars: 24 });
  const selected = adjacent || null;
  if (selected) {
    return {
      onset_hpo_id: selected.onset_hpo_id,
      onset_label: selected.onset_label,
      onset_raw: selected.onset_raw,
      onset_trust: selected.onset_trust
    };
  }
  return {
    onset_hpo_id: null,
    onset_label: null,
    onset_raw: null,
    onset_trust: 'not_extracted_deterministic'
  };
}

export function pickRichest(left, right) {
  if (!left) return right;
  if (!right) return left;
  const fields = [
    'frequency_value',
    'frequency_raw',
    'onset_hpo_id',
    'onset_raw',
    'severity_raw',
    'subtype_raw',
    'progression_raw',
    'treatment_response_raw'
  ];
  const score = (row) =>
    fields.reduce((sum, field) => sum + (row[field] ? 1 : 0), 0) +
    (FEATURE_SOURCE_WEIGHTS[row.anchor_source] || 0) +
    (FEATURE_TRUST_WEIGHTS[row.hpo_mapping_trust] || 0);
  return score(right) > score(left) ? { ...left, ...right } : { ...right, ...left };
}

export function buildNormalFindingOverride(label) {
  const normalized = normalizeText(label);
  const overrides = {
    'normal intelligence': { target_hpo_id: 'HP:0001249', target_label: 'Intellectual disability', status: 'excluded' },
    'normal head size': { target_hpo_id: 'HP:0000252', target_label: 'Microcephaly', status: 'excluded' }
  };
  return overrides[normalized] || null;
}

export function isReviewDecision(chapter) {
  const policy = chapter.policy || {};
  return policy.ingestionDecision !== 'auto_accept' || !Array.isArray(policy.diseaseTargets) || !policy.diseaseTargets.length;
}

export async function loadPhenotypeOntologyRows(client) {
  const result = await client.query(
    `
      SELECT
        child.canonical_curie AS child_curie,
        child.canonical_label AS child_label,
        parent.canonical_curie AS parent_curie,
        parent.canonical_label AS parent_label
      FROM relationships rel
      INNER JOIN entities child
        ON child.entity_id = rel.subject_entity_id
      INNER JOIN entities parent
        ON parent.entity_id = rel.object_entity_id
      WHERE rel.predicate_key = 'is_a'
        AND child.entity_type = 'phenotype'
        AND parent.entity_type = 'phenotype'
    `
  );
  return result.rows;
}

export function buildAncestorMap(ontologyRows) {
  const parentsByChild = new Map();
  for (const row of ontologyRows) {
    const bucket = parentsByChild.get(row.child_curie) || [];
    bucket.push(row.parent_curie);
    parentsByChild.set(row.child_curie, bucket);
  }

  const cache = new Map();
  const visit = (curie) => {
    if (cache.has(curie)) return cache.get(curie);
    const ancestors = new Set();
    for (const parent of parentsByChild.get(curie) || []) {
      ancestors.add(parent);
      for (const ancestor of visit(parent)) {
        ancestors.add(ancestor);
      }
    }
    cache.set(curie, ancestors);
    return ancestors;
  };

  for (const curie of parentsByChild.keys()) {
    visit(curie);
  }

  return cache;
}
