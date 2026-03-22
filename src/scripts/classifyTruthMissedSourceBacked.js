import fs from 'node:fs/promises';
import { withClient } from '../db/pool.js';
import { SOURCE_KEYS } from '../constants/sourceCatalog.js';
import { parseArgs } from './lib/shadowBenchmarkUtils.js';

const DEFAULTS = Object.freeze({
  gapJson: '/Users/ahmedelmorshedy/Genovy/output/truth-missed-term-gaps-pass-1.json',
  outputJson: '/Users/ahmedelmorshedy/Genovy/output/truth-missed-source-backed-pass-1.json',
  outputMd: '/Users/ahmedelmorshedy/Genovy/output/truth-missed-source-backed-pass-1.md'
});

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function uniqueSorted(values) {
  return unique(values).sort((left, right) => left.localeCompare(right));
}

function extractTruthGeneSymbols(truthGeneKeys = []) {
  return uniqueSorted(
    truthGeneKeys
      .filter((value) => typeof value === 'string' && value.startsWith('symbol:'))
      .map((value) => value.split(':', 2)[1])
  );
}

function buildBranchDiseaseMap(rows) {
  const map = new Map();
  for (const row of rows) {
    if (!map.has(row.root_curie)) {
      map.set(row.root_curie, []);
    }
    map.get(row.root_curie).push({
      diseaseCurie: row.branch_curie,
      diseaseLabel: row.branch_label || row.branch_curie,
      relation: row.relation
    });
  }
  return map;
}

function buildDirectAssertionMaps(rows) {
  const byDiseaseAndTerm = new Map();
  const byTerm = new Map();

  for (const row of rows) {
    const key = `${row.disease_curie}||${row.phenotype_curie}`;
    if (!byDiseaseAndTerm.has(key)) {
      byDiseaseAndTerm.set(key, []);
    }
    byDiseaseAndTerm.get(key).push({
      diseaseCurie: row.disease_curie,
      diseaseLabel: row.disease_label || row.disease_curie,
      phenotypeCurie: row.phenotype_curie,
      phenotypeLabel: row.phenotype_label || row.phenotype_curie,
      sourceKey: row.source_key
    });

    if (!byTerm.has(row.phenotype_curie)) {
      byTerm.set(row.phenotype_curie, []);
    }
    byTerm.get(row.phenotype_curie).push({
      diseaseCurie: row.disease_curie,
      diseaseLabel: row.disease_label || row.disease_curie,
      sourceKey: row.source_key
    });
  }

  return { byDiseaseAndTerm, byTerm };
}

function classifyTerm({ linkedDiseaseCuries, branchDiseaseMap, directAssertionMaps, term }) {
  const branchHits = [];

  for (const linkedDiseaseCurie of linkedDiseaseCuries) {
    for (const branchDisease of branchDiseaseMap.get(linkedDiseaseCurie) || []) {
      const hits = directAssertionMaps.byDiseaseAndTerm.get(`${branchDisease.diseaseCurie}||${term.curie}`) || [];
      for (const hit of hits) {
        branchHits.push({
          linkedDiseaseCurie,
          branchDiseaseCurie: branchDisease.diseaseCurie,
          branchDiseaseLabel: branchDisease.diseaseLabel,
          relation: branchDisease.relation,
          sourceKey: hit.sourceKey
        });
      }
    }
  }

  const uniqueBranchHits = [];
  const seenBranchKeys = new Set();
  for (const hit of branchHits) {
    const dedupeKey = `${hit.linkedDiseaseCurie}||${hit.branchDiseaseCurie}||${hit.sourceKey}`;
    if (seenBranchKeys.has(dedupeKey)) continue;
    seenBranchKeys.add(dedupeKey);
    uniqueBranchHits.push(hit);
  }

  const globalHits = directAssertionMaps.byTerm.get(term.curie) || [];
  const uniqueGlobalHits = [];
  const seenGlobalKeys = new Set();
  for (const hit of globalHits) {
    const dedupeKey = `${hit.diseaseCurie}||${hit.sourceKey}`;
    if (seenGlobalKeys.has(dedupeKey)) continue;
    seenGlobalKeys.add(dedupeKey);
    uniqueGlobalHits.push(hit);
  }

  let classification = 'not_found_in_imported_human_direct_sources';
  if (uniqueBranchHits.length > 0) {
    classification = 'branch_source_backed_wrong_shelf';
  } else if (uniqueGlobalHits.length > 0) {
    classification = 'human_direct_exists_elsewhere_only';
  }

  return {
    term,
    classification,
    branch_hits: uniqueBranchHits,
    global_direct_hit_count: uniqueGlobalHits.length,
    global_direct_hit_diseases: uniqueGlobalHits.slice(0, 10)
  };
}

function sortClassificationRows(rows) {
  return [...rows].sort((left, right) => {
    if (left.classification !== right.classification) {
      return left.classification.localeCompare(right.classification);
    }
    if ((right.branch_hits?.length || 0) !== (left.branch_hits?.length || 0)) {
      return (right.branch_hits?.length || 0) - (left.branch_hits?.length || 0);
    }
    return left.term.label.localeCompare(right.term.label);
  });
}

function countByClassification(rows) {
  const counts = new Map();
  for (const row of rows) {
    counts.set(row.classification, (counts.get(row.classification) || 0) + 1);
  }
  return Object.fromEntries([...counts.entries()].sort((left, right) => left[0].localeCompare(right[0])));
}

function flattenClassifications(caseReports, field) {
  return caseReports.flatMap((row) =>
    (row[field] || []).map((entry) => ({
      case_id: row.case_id,
      truth_gene_symbols: row.truth_gene_symbols,
      linked_disease_curies: row.linked_disease_curies,
      ...entry
    }))
  );
}

function summarizeTopTerms(rows) {
  const byTerm = new Map();
  for (const row of rows) {
    const key = `${row.term.curie}||${row.classification}`;
    if (!byTerm.has(key)) {
      byTerm.set(key, {
        curie: row.term.curie,
        label: row.term.label || row.term.curie,
        classification: row.classification,
        case_ids: [],
        truth_gene_symbols: []
      });
    }
    const aggregate = byTerm.get(key);
    aggregate.case_ids.push(row.case_id);
    aggregate.truth_gene_symbols.push(...(row.truth_gene_symbols || []));
  }

  return [...byTerm.values()]
    .map((row) => ({
      ...row,
      case_count: uniqueSorted(row.case_ids).length,
      gene_count: uniqueSorted(row.truth_gene_symbols).length,
      case_ids: uniqueSorted(row.case_ids),
      truth_gene_symbols: uniqueSorted(row.truth_gene_symbols)
    }))
    .sort((left, right) => {
      if (right.case_count !== left.case_count) {
        return right.case_count - left.case_count;
      }
      if (right.gene_count !== left.gene_count) {
        return right.gene_count - left.gene_count;
      }
      return left.label.localeCompare(right.label);
    });
}

async function fetchBranchDiseaseRows(client, rootDiseaseCuries) {
  if (!rootDiseaseCuries.length) return [];
  const result = await client.query(
    `
      WITH RECURSIVE seed AS (
        SELECT entity_id, canonical_curie
        FROM entities
        WHERE canonical_curie = ANY($1::TEXT[])
          AND entity_type = 'disease'
      ),
      ancestors AS (
        SELECT canonical_curie AS root_curie, entity_id, 0 AS depth
        FROM seed
        UNION
        SELECT ancestors.root_curie, rel.object_entity_id, ancestors.depth + 1
        FROM ancestors
        INNER JOIN relationships rel
          ON rel.subject_entity_id = ancestors.entity_id
         AND rel.predicate_key = 'is_a'
      ),
      descendants AS (
        SELECT canonical_curie AS root_curie, entity_id, 0 AS depth
        FROM seed
        UNION
        SELECT descendants.root_curie, rel.subject_entity_id, descendants.depth + 1
        FROM descendants
        INNER JOIN relationships rel
          ON rel.object_entity_id = descendants.entity_id
         AND rel.predicate_key = 'is_a'
      )
      SELECT DISTINCT
        branch.root_curie,
        disease.canonical_curie AS branch_curie,
        disease.canonical_label AS branch_label,
        branch.relation
      FROM (
        SELECT root_curie, entity_id, 'self_or_ancestor'::TEXT AS relation FROM ancestors
        UNION
        SELECT root_curie, entity_id, 'self_or_descendant'::TEXT AS relation FROM descendants
      ) branch
      INNER JOIN entities disease
        ON disease.entity_id = branch.entity_id
       AND disease.entity_type = 'disease'
      ORDER BY branch.root_curie ASC, disease.canonical_curie ASC, branch.relation ASC
    `,
    [rootDiseaseCuries]
  );
  return result.rows;
}

async function fetchDirectHumanPhenotypeRows(client, phenotypeCuries) {
  if (!phenotypeCuries.length) return [];
  const result = await client.query(
    `
      SELECT DISTINCT
        disease.canonical_curie AS disease_curie,
        disease.canonical_label AS disease_label,
        phenotype.canonical_curie AS phenotype_curie,
        phenotype.canonical_label AS phenotype_label,
        assertion.source_key
      FROM clinical_phenotype_assertions assertion
      INNER JOIN entities disease
        ON disease.entity_id = assertion.subject_entity_id
       AND disease.entity_type = 'disease'
      INNER JOIN entities phenotype
        ON phenotype.entity_id = assertion.phenotype_entity_id
       AND phenotype.entity_type = 'phenotype'
      WHERE assertion.presence_status = 'present'
        AND assertion.source_key <> $1
        AND phenotype.canonical_curie = ANY($2::TEXT[])
      ORDER BY phenotype.canonical_curie ASC, disease.canonical_curie ASC, assertion.source_key ASC
    `,
    [SOURCE_KEYS.PHENOTYPE_PROPAGATION, phenotypeCuries]
  );
  return result.rows;
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const config = {
    gapJson: flags['gap-json'] || DEFAULTS.gapJson,
    outputJson: flags['output-json'] || DEFAULTS.outputJson,
    outputMd: flags['output-md'] || DEFAULTS.outputMd
  };

  const gapReport = JSON.parse(await fs.readFile(config.gapJson, 'utf8'));
  const cases = gapReport.cases || [];
  const linkedDiseaseCuries = unique(
    cases.flatMap((row) => (row.linked_disease_coverage || []).map((coverage) => coverage.disease_curie))
  );
  const missingAnyTerms = unique(
    cases.flatMap((row) =>
      (row.terms_missing_from_all_linked_diseases_any_profiles || []).map((term) => term.curie)
    )
  );
  const missingDirectTerms = unique(
    cases.flatMap((row) =>
      (row.terms_missing_from_all_linked_diseases_direct_profiles || []).map((term) => term.curie)
    )
  );
  const phenotypeCuries = unique([...missingAnyTerms, ...missingDirectTerms]);

  const [branchDiseaseRows, directHumanPhenotypeRows] = await withClient(async (client) => {
    const [branchRows, phenotypeRows] = await Promise.all([
      fetchBranchDiseaseRows(client, linkedDiseaseCuries),
      fetchDirectHumanPhenotypeRows(client, phenotypeCuries)
    ]);
    return [branchRows, phenotypeRows];
  });

  const branchDiseaseMap = buildBranchDiseaseMap(branchDiseaseRows);
  const directAssertionMaps = buildDirectAssertionMaps(directHumanPhenotypeRows);

  const caseReports = cases.map((row) => {
    const truthGeneSymbols = extractTruthGeneSymbols(row.truth_gene_keys);
    const caseLinkedDiseaseCuries = unique(
      (row.linked_disease_coverage || []).map((coverage) => coverage.disease_curie)
    );

    const missingAnyClassifications = sortClassificationRows(
      (row.terms_missing_from_all_linked_diseases_any_profiles || []).map((term) =>
        classifyTerm({
          linkedDiseaseCuries: caseLinkedDiseaseCuries,
          branchDiseaseMap,
          directAssertionMaps,
          term
        })
      )
    );

    const missingDirectClassifications = sortClassificationRows(
      (row.terms_missing_from_all_linked_diseases_direct_profiles || []).map((term) =>
        classifyTerm({
          linkedDiseaseCuries: caseLinkedDiseaseCuries,
          branchDiseaseMap,
          directAssertionMaps,
          term
        })
      )
    );

    return {
      case_id: row.case_id,
      truth_gene_symbols: truthGeneSymbols,
      linked_disease_curies: caseLinkedDiseaseCuries,
      best_support_candidate: row.best_support_candidate || null,
      missing_from_all_linked_any_profiles_classified: missingAnyClassifications,
      missing_from_all_linked_direct_profiles_classified: missingDirectClassifications
    };
  });

  const flattenedAny = flattenClassifications(caseReports, 'missing_from_all_linked_any_profiles_classified');
  const flattenedDirect = flattenClassifications(caseReports, 'missing_from_all_linked_direct_profiles_classified');

  const summary = {
    case_count: caseReports.length,
    any_profile_gap_term_count: flattenedAny.length,
    direct_profile_gap_term_count: flattenedDirect.length,
    any_profile_gap_classification_counts: countByClassification(flattenedAny),
    direct_profile_gap_classification_counts: countByClassification(flattenedDirect)
  };

  const report = {
    created_at: new Date().toISOString(),
    source_gap_json: config.gapJson,
    summary,
    highest_confidence_global_gaps: summarizeTopTerms(flattenedAny),
    direct_profile_gap_classification_summary: summarizeTopTerms(flattenedDirect),
    cases: caseReports
  };

  await fs.writeFile(config.outputJson, `${JSON.stringify(report, null, 2)}\n`);

  const lines = [
    '# Missed Truth-Gene Source-Backed Classification',
    '',
    `Created: ${report.created_at}`,
    `Source gap audit: ${config.gapJson}`,
    '',
    '## Summary',
    '',
    `Cases: ${summary.case_count}`,
    `All-profile gap terms classified: ${summary.any_profile_gap_term_count}`,
    `Direct-profile gap terms classified: ${summary.direct_profile_gap_term_count}`,
    '',
    'All-profile gap classification counts:',
    ...Object.entries(summary.any_profile_gap_classification_counts).map(([key, value]) => `- ${key}: ${value}`),
    '',
    'Direct-profile gap classification counts:',
    ...Object.entries(summary.direct_profile_gap_classification_counts).map(([key, value]) => `- ${key}: ${value}`),
    '',
    '## Top All-Profile Gap Terms',
    ''
  ];

  for (const row of report.highest_confidence_global_gaps.slice(0, 20)) {
    lines.push(`- ${row.curie} ${row.label} | class=${row.classification} | cases=${row.case_count} | genes=${row.gene_count}`);
    lines.push(`  case_ids: ${row.case_ids.join(', ')}`);
    lines.push(`  genes: ${row.truth_gene_symbols.join(', ') || 'none'}`);
  }

  lines.push('');
  lines.push('## Top Direct-Profile Gap Terms');
  lines.push('');

  for (const row of report.direct_profile_gap_classification_summary.slice(0, 20)) {
    lines.push(`- ${row.curie} ${row.label} | class=${row.classification} | cases=${row.case_count} | genes=${row.gene_count}`);
    lines.push(`  case_ids: ${row.case_ids.join(', ')}`);
    lines.push(`  genes: ${row.truth_gene_symbols.join(', ') || 'none'}`);
  }

  await fs.writeFile(config.outputMd, `${lines.join('\n')}\n`);
}

main().catch((error) => {
  console.error(`[classify-truth-missed-source-backed] failed: ${error.stack || error.message}`);
  process.exitCode = 1;
});
