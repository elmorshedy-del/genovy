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

export function normalizeGeneKey(value) {
  if (value == null) return '';
  const text = String(value).trim();
  if (!text) return '';
  const lower = text.toLowerCase();
  if (lower.startsWith('symbol:')) return `symbol:${text.split(':', 2)[1].toUpperCase()}`;
  if (lower.startsWith('ncbigene:')) return `ncbigene:${text.split(':', 2)[1]}`;
  if (lower.startsWith('hgnc:')) return `hgnc:${text.split(':', 2)[1]}`;
  if (lower.startsWith('ensembl:')) return `ensembl:${text.split(':', 2)[1]}`;
  if (text.toUpperCase().startsWith('ENSG')) return `ensembl:${text.toUpperCase()}`;
  return `symbol:${text.toUpperCase()}`;
}

export function extractTruthGeneKeys(phenopacket) {
  const keys = new Set();
  for (const interpretation of phenopacket?.interpretations || []) {
    const diagnoses = [];
    if (interpretation?.diagnosis) diagnoses.push(interpretation.diagnosis);
    diagnoses.push(...(interpretation?.diagnoses || []));
    for (const diagnosis of diagnoses) {
      for (const genomicInterpretation of diagnosis?.genomicInterpretations || []) {
        const geneContext = genomicInterpretation?.variantInterpretation?.variationDescriptor?.geneContext || {};
        for (const rawValue of [geneContext?.valueId, geneContext?.symbol, ...(geneContext?.alternateIds || [])]) {
          const key = normalizeGeneKey(rawValue);
          if (key) keys.add(key);
        }
      }
    }
  }
  return [...keys].sort();
}

export function findTruthRank(rows, truthGeneKeys) {
  const truthSet = new Set(truthGeneKeys);
  for (const row of rows) {
    for (const key of [
      normalizeGeneKey(row.geneSymbol),
      normalizeGeneKey(row.geneLabel),
      normalizeGeneKey(row.geneCurie),
      normalizeGeneKey(row.geneIdentifier)
    ]) {
      if (truthSet.has(key)) return row.rank;
    }
  }
  return null;
}

export function summarizeRun(rankByCase) {
  const caseIds = Object.keys(rankByCase);
  const total = caseIds.length;
  const found = caseIds.map((caseId) => rankByCase[caseId]).filter((rank) => rank != null);
  const ordered = [...found].sort((left, right) => left - right);
  const midpoint = Math.floor(ordered.length / 2);
  const medianRank =
    !ordered.length
      ? null
      : ordered.length % 2 === 0
        ? (ordered[midpoint - 1] + ordered[midpoint]) / 2
        : ordered[midpoint];
  const pct = (count) => (total ? Number(((count / total) * 100).toFixed(2)) : 0);
  const countAt = (n) => found.filter((rank) => rank <= n).length;

  return {
    case_count: total,
    found_count: found.length,
    found_pct: pct(found.length),
    top1_count: countAt(1),
    top1_pct: pct(countAt(1)),
    top3_count: countAt(3),
    top3_pct: pct(countAt(3)),
    top5_count: countAt(5),
    top5_pct: pct(countAt(5)),
    top10_count: countAt(10),
    top10_pct: pct(countAt(10)),
    median_rank: medianRank,
    mrr: total ? Number((found.reduce((sum, rank) => sum + 1 / rank, 0) / total).toFixed(6)) : 0
  };
}

export function compareBaselineVsShadow(perCase) {
  const deltas = { improved: 0, worsened: 0, unchanged: 0, recovered_from_miss: 0, regressed_to_miss: 0 };

  for (const row of perCase) {
    const before = row.baseline_rank;
    const after = row.shadow_rank;

    if (before == null && after != null) {
      deltas.improved += 1;
      deltas.recovered_from_miss += 1;
    } else if (before != null && after == null) {
      deltas.worsened += 1;
      deltas.regressed_to_miss += 1;
    } else if (before == null && after == null) {
      deltas.unchanged += 1;
    } else if (after < before) {
      deltas.improved += 1;
    } else if (after > before) {
      deltas.worsened += 1;
    } else {
      deltas.unchanged += 1;
    }
  }

  return deltas;
}

export function topMoves(perCase, mode, limit = 10) {
  const rows = perCase
    .filter((row) => row.baseline_rank != null || row.shadow_rank != null)
    .map((row) => {
      const before = row.baseline_rank ?? 999999;
      const after = row.shadow_rank ?? 999999;
      return {
        case_id: row.case_id,
        truth_gene_keys: row.truth_gene_keys,
        baseline_rank: row.baseline_rank,
        shadow_rank: row.shadow_rank,
        movement: before - after
      };
    });

  rows.sort((left, right) => (mode === 'improved' ? right.movement - left.movement : left.movement - right.movement));
  return rows.slice(0, limit);
}

export function selectShardFiles(fileNames, shardIndex, shardCount) {
  if (!Number.isInteger(shardCount) || shardCount <= 1) {
    return fileNames;
  }
  if (!Number.isInteger(shardIndex) || shardIndex < 0 || shardIndex >= shardCount) {
    throw new Error(`Invalid shard settings: shardIndex=${shardIndex} shardCount=${shardCount}`);
  }
  return fileNames.filter((_, index) => index % shardCount === shardIndex);
}

export function buildShadowMarkdown({
  title,
  createdAt,
  baselineSummary,
  shadowSummary,
  deltas,
  metadataLines = []
}) {
  return [
    `# ${title}`,
    '',
    `Created: ${createdAt}`,
    ...metadataLines,
    '',
    '## Baseline vs Shadow',
    '',
    `Found: ${baselineSummary.found_pct}% -> ${shadowSummary.found_pct}%`,
    `Top-1: ${baselineSummary.top1_pct}% -> ${shadowSummary.top1_pct}%`,
    `Top-3: ${baselineSummary.top3_pct}% -> ${shadowSummary.top3_pct}%`,
    `Top-5: ${baselineSummary.top5_pct}% -> ${shadowSummary.top5_pct}%`,
    `Top-10: ${baselineSummary.top10_pct}% -> ${shadowSummary.top10_pct}%`,
    `Median rank: ${baselineSummary.median_rank} -> ${shadowSummary.median_rank}`,
    `MRR: ${baselineSummary.mrr} -> ${shadowSummary.mrr}`,
    '',
    '## Delta vs Baseline',
    '',
    `Improved: ${deltas.improved}`,
    `Worsened: ${deltas.worsened}`,
    `Recovered from miss: ${deltas.recovered_from_miss}`,
    `Regressed to miss: ${deltas.regressed_to_miss}`
  ].join('\n');
}
