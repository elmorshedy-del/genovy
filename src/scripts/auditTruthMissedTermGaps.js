import fs from 'node:fs/promises';
import path from 'node:path';
import { withClient } from '../db/pool.js';
import { extractDxPhenotypeInput, validateDxPhenotypeInput } from '../lib/phenopackets.js';
import { loadDxGeneDiseaseSupportRows } from '../repositories/dxRepository.js';
import { loadDxSimilarityIndex } from '../services/dx/similarityEngine.js';
import { normalizeGeneKey, parseArgs } from './lib/shadowBenchmarkUtils.js';

const DEFAULTS = Object.freeze({
  auditJson: '/Users/ahmedelmorshedy/Genovy/output/truth-coverage-pass-2.json',
  phenopacketDir: '/Users/ahmedelmorshedy/Genovy/output/pheval-official-sample-100/phenopackets',
  outputJson: '/Users/ahmedelmorshedy/Genovy/output/truth-missed-term-gaps.json',
  outputMd: '/Users/ahmedelmorshedy/Genovy/output/truth-missed-term-gaps.md'
});

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function buildLinksByGeneKey(rows) {
  const linksByGeneKey = new Map();
  for (const row of rows) {
    for (const geneKey of unique([
      normalizeGeneKey(row.gene_curie),
      normalizeGeneKey(row.gene_label),
      normalizeGeneKey(row.gene_curie || row.gene_label)
    ])) {
      if (!linksByGeneKey.has(geneKey)) {
        linksByGeneKey.set(geneKey, []);
      }
      linksByGeneKey.get(geneKey).push({
        geneCurie: row.gene_curie,
        geneLabel: row.gene_label || row.gene_curie,
        diseaseCurie: row.disease_curie,
        diseaseLabel: row.disease_label || row.disease_curie,
        classification: row.classification || '',
        evidenceCode: row.evidence_code || ''
      });
    }
  }
  return linksByGeneKey;
}

function buildDiseaseProfileMap(index) {
  return new Map(index.diseaseProfiles.map((profile) => [profile.entityCurie, profile]));
}

function buildTermObjects(curies, labelByCurie) {
  return curies.map((curie) => ({
    curie,
    label: labelByCurie.get(curie) || curie
  }));
}

function buildDirectPhenotypeSets(profile) {
  const direct = new Set();
  const any = new Set();

  for (const phenotype of profile?.phenotypes || []) {
    any.add(phenotype.phenotypeCurie);
    if (phenotype.edgeOrigin !== 'propagated') {
      direct.add(phenotype.phenotypeCurie);
    }
  }

  return { direct, any };
}

function sortDiseaseCoverageRows(rows) {
  return [...rows].sort((left, right) => {
    if (right.exact_direct_overlap_count !== left.exact_direct_overlap_count) {
      return right.exact_direct_overlap_count - left.exact_direct_overlap_count;
    }
    if (right.exact_any_overlap_count !== left.exact_any_overlap_count) {
      return right.exact_any_overlap_count - left.exact_any_overlap_count;
    }
    if (right.direct_term_count !== left.direct_term_count) {
      return right.direct_term_count - left.direct_term_count;
    }
    return left.disease_label.localeCompare(right.disease_label);
  });
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const config = {
    auditJson: flags['audit-json'] || DEFAULTS.auditJson,
    phenopacketDir: flags['phenopacket-dir'] || DEFAULTS.phenopacketDir,
    outputJson: flags['output-json'] || DEFAULTS.outputJson,
    outputMd: flags['output-md'] || DEFAULTS.outputMd
  };

  const [auditReport, index, geneDiseaseSupportRows] = await Promise.all([
    fs.readFile(config.auditJson, 'utf8').then(JSON.parse),
    withClient((client) => loadDxSimilarityIndex(client, { forceRefresh: true })),
    withClient((client) => loadDxGeneDiseaseSupportRows(client))
  ]);

  const diseaseProfileMap = buildDiseaseProfileMap(index);
  const linksByGeneKey = buildLinksByGeneKey(geneDiseaseSupportRows);
  const missedCases = (auditReport.per_case || []).filter((row) => row.truth_gene_rank_found === false);
  const caseReports = [];

  for (const auditCase of missedCases) {
    const phenopacketPath = path.join(config.phenopacketDir, `${auditCase.case_id}.json`);
    const payload = JSON.parse(await fs.readFile(phenopacketPath, 'utf8'));
    const phenopacket = payload?.phenopacket || payload;
    const input = extractDxPhenotypeInput({ phenopacket });
    if (validateDxPhenotypeInput(input)) continue;

    const patientTermSet = new Set(input.presentPhenotypeCuries);
    const truthGeneKeys = unique((auditCase.truth_gene_keys || []).map((value) => normalizeGeneKey(value)));
    const linkedDiseases = [];
    const seenDiseaseCuries = new Set();

    for (const truthGeneKey of truthGeneKeys) {
      for (const link of linksByGeneKey.get(truthGeneKey) || []) {
        if (seenDiseaseCuries.has(link.diseaseCurie)) continue;
        seenDiseaseCuries.add(link.diseaseCurie);
        linkedDiseases.push(link);
      }
    }

    const allLinkedDirectTerms = new Set();
    const allLinkedAnyTerms = new Set();
    const linkedDiseaseCoverage = [];

    for (const link of linkedDiseases) {
      const profile = diseaseProfileMap.get(link.diseaseCurie);
      const sets = buildDirectPhenotypeSets(profile);

      for (const curie of sets.direct) allLinkedDirectTerms.add(curie);
      for (const curie of sets.any) allLinkedAnyTerms.add(curie);

      linkedDiseaseCoverage.push({
        disease_curie: link.diseaseCurie,
        disease_label: link.diseaseLabel,
        classification: link.classification,
        evidence_code: link.evidenceCode,
        direct_term_count: sets.direct.size,
        any_term_count: sets.any.size,
        exact_direct_overlap_count: [...patientTermSet].filter((curie) => sets.direct.has(curie)).length,
        exact_any_overlap_count: [...patientTermSet].filter((curie) => sets.any.has(curie)).length
      });
    }

    const bestSupportCurie = auditCase.best_support_candidate?.diseaseCurie || '';
    const bestSupportProfile = bestSupportCurie ? diseaseProfileMap.get(bestSupportCurie) : null;
    const bestSupportSets = buildDirectPhenotypeSets(bestSupportProfile);

    const directTermsPresentOnBest = input.presentPhenotypeCuries.filter((curie) => bestSupportSets.direct.has(curie));
    const missingFromBestDirect = input.presentPhenotypeCuries.filter((curie) => !bestSupportSets.direct.has(curie));
    const missingFromAllLinkedDirect = input.presentPhenotypeCuries.filter((curie) => !allLinkedDirectTerms.has(curie));
    const missingFromAllLinkedAny = input.presentPhenotypeCuries.filter((curie) => !allLinkedAnyTerms.has(curie));

    caseReports.push({
      case_id: auditCase.case_id,
      file_name: auditCase.file_name,
      truth_gene_keys: auditCase.truth_gene_keys,
      patient_terms: buildTermObjects(input.presentPhenotypeCuries, index.labelByCurie),
      best_support_candidate: auditCase.best_support_candidate || null,
      direct_terms_present_on_best_support: buildTermObjects(directTermsPresentOnBest, index.labelByCurie),
      terms_missing_from_best_support_direct_profile: buildTermObjects(missingFromBestDirect, index.labelByCurie),
      terms_missing_from_all_linked_diseases_direct_profiles: buildTermObjects(missingFromAllLinkedDirect, index.labelByCurie),
      terms_missing_from_all_linked_diseases_any_profiles: buildTermObjects(missingFromAllLinkedAny, index.labelByCurie),
      linked_disease_coverage: sortDiseaseCoverageRows(linkedDiseaseCoverage)
    });
  }

  const summary = {
    missed_case_count: caseReports.length,
    cases_with_best_support_candidate: caseReports.filter((row) => row.best_support_candidate?.diseaseCurie).length,
    cases_with_nonempty_best_direct_overlap: caseReports.filter(
      (row) => row.direct_terms_present_on_best_support.length > 0
    ).length,
    cases_with_terms_missing_from_all_linked_direct_profiles: caseReports.filter(
      (row) => row.terms_missing_from_all_linked_diseases_direct_profiles.length > 0
    ).length,
    cases_with_terms_missing_from_all_linked_any_profiles: caseReports.filter(
      (row) => row.terms_missing_from_all_linked_diseases_any_profiles.length > 0
    ).length
  };

  const report = {
    created_at: new Date().toISOString(),
    source_audit_json: config.auditJson,
    phenopacket_dir: config.phenopacketDir,
    summary,
    cases: caseReports
  };

  await fs.writeFile(config.outputJson, `${JSON.stringify(report, null, 2)}\n`);

  const markdownLines = [
    '# Missed Truth-Gene Phenotype Gap Audit',
    '',
    `Created: ${report.created_at}`,
    `Source audit: ${config.auditJson}`,
    '',
    '## Summary',
    '',
    `Missed cases: ${summary.missed_case_count}`,
    `Cases with best support candidate: ${summary.cases_with_best_support_candidate}`,
    `Cases with nonempty best direct overlap: ${summary.cases_with_nonempty_best_direct_overlap}`,
    `Cases with terms missing from all linked direct profiles: ${summary.cases_with_terms_missing_from_all_linked_direct_profiles}`,
    `Cases with terms missing from all linked any profiles: ${summary.cases_with_terms_missing_from_all_linked_any_profiles}`
  ];

  for (const row of caseReports) {
    markdownLines.push('');
    markdownLines.push(`## ${row.case_id}`);
    markdownLines.push('');
    markdownLines.push(`Truth gene keys: ${row.truth_gene_keys.join(', ')}`);
    if (row.best_support_candidate?.diseaseCurie) {
      markdownLines.push(
        `Best linked support disease: ${row.best_support_candidate.diseaseCurie} ${row.best_support_candidate.diseaseLabel}`
      );
    } else {
      markdownLines.push('Best linked support disease: none');
    }
    markdownLines.push('');
    markdownLines.push('Patient HPO terms:');
    for (const term of row.patient_terms) {
      markdownLines.push(`- ${term.curie} ${term.label}`);
    }
    markdownLines.push('');
    markdownLines.push('Exact direct terms already present on best linked disease:');
    if (row.direct_terms_present_on_best_support.length) {
      for (const term of row.direct_terms_present_on_best_support) {
        markdownLines.push(`- ${term.curie} ${term.label}`);
      }
    } else {
      markdownLines.push('- none');
    }
    markdownLines.push('');
    markdownLines.push('Terms missing from best linked disease direct profile:');
    if (row.terms_missing_from_best_support_direct_profile.length) {
      for (const term of row.terms_missing_from_best_support_direct_profile) {
        markdownLines.push(`- ${term.curie} ${term.label}`);
      }
    } else {
      markdownLines.push('- none');
    }
    markdownLines.push('');
    markdownLines.push('Terms missing from all linked diseases direct profiles:');
    if (row.terms_missing_from_all_linked_diseases_direct_profiles.length) {
      for (const term of row.terms_missing_from_all_linked_diseases_direct_profiles) {
        markdownLines.push(`- ${term.curie} ${term.label}`);
      }
    } else {
      markdownLines.push('- none');
    }
    markdownLines.push('');
    markdownLines.push('Terms missing from all linked diseases any profiles:');
    if (row.terms_missing_from_all_linked_diseases_any_profiles.length) {
      for (const term of row.terms_missing_from_all_linked_diseases_any_profiles) {
        markdownLines.push(`- ${term.curie} ${term.label}`);
      }
    } else {
      markdownLines.push('- none');
    }
    markdownLines.push('');
    markdownLines.push('Linked disease coverage summary:');
    for (const coverage of row.linked_disease_coverage) {
      markdownLines.push(
        `- ${coverage.disease_curie} ${coverage.disease_label} | direct=${coverage.direct_term_count} | exact_direct=${coverage.exact_direct_overlap_count} | exact_any=${coverage.exact_any_overlap_count} | classification=${coverage.classification || 'none'}`
      );
    }
  }

  await fs.writeFile(config.outputMd, `${markdownLines.join('\n')}\n`);

  console.log(`JSON_OUT=${config.outputJson}`);
  console.log(`MD_OUT=${config.outputMd}`);
}

main().catch((error) => {
  console.error('[audit-truth-missed-term-gaps] failed:', error);
  process.exit(1);
});
