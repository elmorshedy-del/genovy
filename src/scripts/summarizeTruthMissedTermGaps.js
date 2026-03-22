import fs from 'node:fs/promises';
import { parseArgs } from './lib/shadowBenchmarkUtils.js';

const DEFAULTS = Object.freeze({
  gapJson: '/Users/ahmedelmorshedy/Genovy/output/truth-missed-term-gaps-pass-1.json',
  outputJson: '/Users/ahmedelmorshedy/Genovy/output/truth-missed-term-fill-priority.json',
  outputMd: '/Users/ahmedelmorshedy/Genovy/output/truth-missed-term-fill-priority.md'
});

function extractTruthGeneSymbols(truthGeneKeys = []) {
  return [...new Set(
    truthGeneKeys
      .filter((value) => typeof value === 'string' && value.startsWith('symbol:'))
      .map((value) => value.split(':', 2)[1])
      .filter(Boolean)
  )].sort();
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
}

function sortTermRows(rows) {
  return [...rows].sort((left, right) => {
    if (right.case_count !== left.case_count) {
      return right.case_count - left.case_count;
    }
    if (right.gene_count !== left.gene_count) {
      return right.gene_count - left.gene_count;
    }
    return left.label.localeCompare(right.label);
  });
}

function sortCaseRows(rows) {
  return [...rows].sort((left, right) => {
    if (right.missing_from_all_linked_any_count !== left.missing_from_all_linked_any_count) {
      return right.missing_from_all_linked_any_count - left.missing_from_all_linked_any_count;
    }
    if (right.missing_from_all_linked_direct_count !== left.missing_from_all_linked_direct_count) {
      return right.missing_from_all_linked_direct_count - left.missing_from_all_linked_direct_count;
    }
    if (right.missing_from_best_support_direct_count !== left.missing_from_best_support_direct_count) {
      return right.missing_from_best_support_direct_count - left.missing_from_best_support_direct_count;
    }
    return left.case_id.localeCompare(right.case_id);
  });
}

function buildTermPriorityRows(cases, field) {
  const byCurie = new Map();

  for (const row of cases) {
    const geneSymbols = extractTruthGeneSymbols(row.truth_gene_keys);
    const bestSupportLabel = row.best_support_candidate?.diseaseLabel || '';

    for (const term of row[field] || []) {
      if (!term?.curie) continue;
      if (!byCurie.has(term.curie)) {
        byCurie.set(term.curie, {
          curie: term.curie,
          label: term.label || term.curie,
          case_ids: [],
          truth_gene_symbols: [],
          best_support_disease_labels: []
        });
      }

      const aggregate = byCurie.get(term.curie);
      aggregate.case_ids.push(row.case_id);
      aggregate.truth_gene_symbols.push(...geneSymbols);
      if (bestSupportLabel) {
        aggregate.best_support_disease_labels.push(bestSupportLabel);
      }
    }
  }

  return sortTermRows(
    [...byCurie.values()].map((row) => ({
      curie: row.curie,
      label: row.label,
      case_count: uniqueSorted(row.case_ids).length,
      gene_count: uniqueSorted(row.truth_gene_symbols).length,
      case_ids: uniqueSorted(row.case_ids),
      truth_gene_symbols: uniqueSorted(row.truth_gene_symbols),
      best_support_disease_labels: uniqueSorted(row.best_support_disease_labels)
    }))
  );
}

function buildCasePriorityRows(cases) {
  return sortCaseRows(
    cases.map((row) => ({
      case_id: row.case_id,
      truth_gene_symbols: extractTruthGeneSymbols(row.truth_gene_keys),
      best_support_disease: row.best_support_candidate?.diseaseLabel || 'none',
      patient_term_count: row.patient_terms?.length || 0,
      direct_terms_present_on_best_support_count: row.direct_terms_present_on_best_support?.length || 0,
      missing_from_best_support_direct_count: row.terms_missing_from_best_support_direct_profile?.length || 0,
      missing_from_all_linked_direct_count: row.terms_missing_from_all_linked_diseases_direct_profiles?.length || 0,
      missing_from_all_linked_any_count: row.terms_missing_from_all_linked_diseases_any_profiles?.length || 0
    }))
  );
}

function renderTopTermSection(lines, heading, rows, limit = 15) {
  lines.push(`## ${heading}`);
  lines.push('');

  if (!rows.length) {
    lines.push('None');
    return;
  }

  for (const row of rows.slice(0, limit)) {
    lines.push(`- ${row.curie} ${row.label} | cases=${row.case_count} | genes=${row.gene_count}`);
    lines.push(`  case_ids: ${row.case_ids.join(', ')}`);
    lines.push(`  genes: ${row.truth_gene_symbols.join(', ') || 'none'}`);
    lines.push(`  best_support_diseases: ${row.best_support_disease_labels.join(', ') || 'none'}`);
  }
}

function renderTopCaseSection(lines, rows, limit = 15) {
  lines.push('## Highest-Priority Cases');
  lines.push('');

  if (!rows.length) {
    lines.push('None');
    return;
  }

  for (const row of rows.slice(0, limit)) {
    lines.push(
      `- ${row.case_id} | genes=${row.truth_gene_symbols.join(', ') || 'none'} | best_support=${row.best_support_disease} | patient_terms=${row.patient_term_count} | missing_all_any=${row.missing_from_all_linked_any_count} | missing_all_direct=${row.missing_from_all_linked_direct_count} | missing_best_direct=${row.missing_from_best_support_direct_count}`
    );
  }
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

  const missingFromAllLinkedDirect = buildTermPriorityRows(
    cases,
    'terms_missing_from_all_linked_diseases_direct_profiles'
  );
  const missingFromAllLinkedAny = buildTermPriorityRows(
    cases,
    'terms_missing_from_all_linked_diseases_any_profiles'
  );
  const missingFromBestSupportDirect = buildTermPriorityRows(
    cases,
    'terms_missing_from_best_support_direct_profile'
  );
  const casePriority = buildCasePriorityRows(cases);

  const summary = {
    missed_case_count: cases.length,
    unique_terms_missing_from_all_linked_direct_profiles: missingFromAllLinkedDirect.length,
    unique_terms_missing_from_all_linked_any_profiles: missingFromAllLinkedAny.length,
    unique_terms_missing_from_best_support_direct_profiles: missingFromBestSupportDirect.length,
    cases_with_any_profile_gaps: casePriority.filter((row) => row.missing_from_all_linked_any_count > 0).length,
    cases_with_direct_profile_gaps: casePriority.filter((row) => row.missing_from_all_linked_direct_count > 0).length
  };

  const report = {
    created_at: new Date().toISOString(),
    source_gap_json: config.gapJson,
    summary,
    highest_priority_terms_missing_from_all_linked_any_profiles: missingFromAllLinkedAny,
    direct_fill_priority_terms: missingFromAllLinkedDirect,
    best_support_direct_fill_priority_terms: missingFromBestSupportDirect,
    highest_priority_cases: casePriority
  };

  await fs.writeFile(config.outputJson, `${JSON.stringify(report, null, 2)}\n`);

  const markdownLines = [
    '# Missed Truth-Gene Fill Priority',
    '',
    `Created: ${report.created_at}`,
    `Source gap audit: ${config.gapJson}`,
    '',
    '## Summary',
    '',
    `Missed cases: ${summary.missed_case_count}`,
    `Unique terms missing from all linked direct profiles: ${summary.unique_terms_missing_from_all_linked_direct_profiles}`,
    `Unique terms missing from all linked any profiles: ${summary.unique_terms_missing_from_all_linked_any_profiles}`,
    `Unique terms missing from best-support direct profiles: ${summary.unique_terms_missing_from_best_support_direct_profiles}`,
    `Cases with any-profile gaps: ${summary.cases_with_any_profile_gaps}`,
    `Cases with direct-profile gaps: ${summary.cases_with_direct_profile_gaps}`,
    ''
  ];

  renderTopTermSection(
    markdownLines,
    'Highest-Confidence Global Gaps (Missing From All Linked Profiles)',
    missingFromAllLinkedAny
  );
  markdownLines.push('');
  renderTopTermSection(
    markdownLines,
    'Direct Curation Targets (Missing From All Linked Direct Profiles)',
    missingFromAllLinkedDirect
  );
  markdownLines.push('');
  renderTopTermSection(
    markdownLines,
    'Best-Support Direct Misses (Present Somewhere Else Or Only Via Propagation)',
    missingFromBestSupportDirect
  );
  markdownLines.push('');
  renderTopCaseSection(markdownLines, casePriority);

  await fs.writeFile(config.outputMd, `${markdownLines.join('\n')}\n`);
}

main().catch((error) => {
  console.error(`[summarize-truth-missed-term-gaps] failed: ${error.stack || error.message}`);
  process.exitCode = 1;
});
