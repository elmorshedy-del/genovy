import fs from 'node:fs/promises';
import path from 'node:path';
import { DX_SIMILARITY_DEFAULTS } from '../constants/dx.js';
import { withClient } from '../db/pool.js';
import { extractDxPhenotypeInput, validateDxPhenotypeInput } from '../lib/phenopackets.js';
import { loadDxGeneDiseaseSupportRows } from '../repositories/dxRepository.js';
import {
  classificationWeight,
  computeDiseaseSupportEvidenceWeight,
  loadDxSimilarityIndex,
  rankDiseasesByPhenotypeSimilarity,
  rankGenesByPhenotypeSimilarity,
  shouldReplaceSupportingDisease
} from '../services/dx/similarityEngine.js';
import { extractTruthGeneKeys, normalizeGeneKey, parseArgs } from './lib/shadowBenchmarkUtils.js';

const DEFAULTS = Object.freeze({
  phenopacketDir: '/Users/ahmedelmorshedy/Genovy/output/pheval-official-sample-100/phenopackets',
  outputJson: '/Users/ahmedelmorshedy/Genovy/output/truth-gene-coverage-audit.json',
  outputMd: '/Users/ahmedelmorshedy/Genovy/output/truth-gene-coverage-audit.md',
  geneLimit: 100
});

function buildDiseaseGeneIndex(rows) {
  const linksByGeneKey = new Map();
  for (const row of rows) {
    for (const geneKey of [
      normalizeGeneKey(row.gene_curie),
      normalizeGeneKey(row.gene_label),
      normalizeGeneKey(row.gene_curie || row.gene_label)
    ]) {
      if (!geneKey) continue;
      if (!linksByGeneKey.has(geneKey)) {
        linksByGeneKey.set(geneKey, []);
      }
      linksByGeneKey.get(geneKey).push({
        geneCurie: row.gene_curie,
        geneLabel: row.gene_label || row.gene_curie,
        geneEntityId: Number(row.gene_entity_id),
        diseaseCurie: row.disease_curie,
        diseaseLabel: row.disease_label || row.disease_curie,
        classification: row.classification || '',
        evidenceCode: row.evidence_code || '',
        supportWeight: classificationWeight(row.classification, row.evidence_code)
      });
    }
  }
  return linksByGeneKey;
}

function buildDiseaseProfileIndex(index) {
  return new Map(index.diseaseProfiles.map((profile) => [profile.entityCurie, profile]));
}

function buildChildrenByParent(diseaseProfiles, parentMap) {
  const diseaseCuries = new Set(diseaseProfiles.map((profile) => profile.entityCurie));
  const childrenByParent = new Map();
  for (const childCurie of diseaseCuries) {
    for (const parentCurie of parentMap.get(childCurie) || []) {
      if (!diseaseCuries.has(parentCurie)) continue;
      if (!childrenByParent.has(parentCurie)) {
        childrenByParent.set(parentCurie, []);
      }
      childrenByParent.get(parentCurie).push(childCurie);
    }
  }
  return childrenByParent;
}

function countExactOverlap(patientTerms, phenotypeRows, { directOnly = false } = {}) {
  const patientSet = new Set(patientTerms);
  let overlap = 0;
  for (const row of phenotypeRows || []) {
    if (directOnly && row.edgeOrigin === 'propagated') continue;
    if (patientSet.has(row.phenotypeCurie)) {
      overlap += 1;
    }
  }
  return overlap;
}

function buildLinkedDiseaseSummary(link, diseaseRankingMap, diseaseProfileMap, patientTerms) {
  const ranking = diseaseRankingMap.get(link.diseaseCurie);
  const profile = diseaseProfileMap.get(link.diseaseCurie);
  const normalizedScore = ranking?.normalizedScore ?? 0;
  const directPhenotypeCount = profile?.directPhenotypeEdgeCount || 0;
  const propagatedPhenotypeCount = profile?.propagatedPhenotypeEdgeCount || 0;
  const phenotypeCount = profile?.phenotypes?.length || directPhenotypeCount + propagatedPhenotypeCount;
  const matchedPhenotypeCount = ranking?.matchedPhenotypeCount ?? 0;
  const supportWeight = link.supportWeight || 0;
  const evidenceWeight = computeDiseaseSupportEvidenceWeight({
    normalizedScore,
    phenotypeCount,
    matchedPhenotypeCount,
    directPhenotypeEdgeCount: directPhenotypeCount,
    propagatedPhenotypeEdgeCount: propagatedPhenotypeCount
  });
  const diseaseSupportScore = Number(
    (normalizedScore * supportWeight * evidenceWeight).toFixed(DX_SIMILARITY_DEFAULTS.normalizedScorePrecision)
  );

  if (!profile) {
    return {
      diseaseCurie: link.diseaseCurie,
      diseaseLabel: link.diseaseLabel,
      normalizedScore: null,
      diseaseSupportScore,
      evidenceWeight,
      supportWeight,
      matchedPhenotypeCount,
      directPhenotypeCount: 0,
      propagatedPhenotypeCount: 0,
      exactPatientOverlap: 0,
      exactDirectPatientOverlap: 0
    };
  }

  return {
    diseaseCurie: link.diseaseCurie,
    diseaseLabel: link.diseaseLabel,
    normalizedScore: ranking?.normalizedScore ?? null,
    diseaseSupportScore,
    evidenceWeight,
    supportWeight,
    matchedPhenotypeCount,
    directPhenotypeCount,
    propagatedPhenotypeCount,
    exactPatientOverlap: countExactOverlap(patientTerms, profile.phenotypes),
    exactDirectPatientOverlap: countExactOverlap(patientTerms, profile.phenotypes, { directOnly: true })
  };
}

function sortSupportCandidates(rows) {
  return [...rows].sort((left, right) => {
    if (shouldReplaceSupportingDisease(left, right)) {
      return 1;
    }
    if (shouldReplaceSupportingDisease(right, left)) {
      return -1;
    }
    return 0;
  });
}

function buildChildSummary(parentCurie, childrenByParent, diseaseRankingMap, diseaseProfileMap, patientTerms) {
  const childCuries = childrenByParent.get(parentCurie) || [];
  const rows = childCuries
    .map((childCurie) => {
      const profile = diseaseProfileMap.get(childCurie);
      if (!profile) return null;
      return {
        diseaseCurie: childCurie,
        diseaseLabel: profile.entityLabel || childCurie,
        normalizedScore: diseaseRankingMap.get(childCurie)?.normalizedScore ?? null,
        directPhenotypeCount: profile.directPhenotypeEdgeCount || 0,
        propagatedPhenotypeCount: profile.propagatedPhenotypeEdgeCount || 0,
        exactPatientOverlap: countExactOverlap(patientTerms, profile.phenotypes),
        exactDirectPatientOverlap: countExactOverlap(patientTerms, profile.phenotypes, { directOnly: true })
      };
    })
    .filter(Boolean)
    .sort((left, right) => {
      if ((right.exactDirectPatientOverlap || 0) !== (left.exactDirectPatientOverlap || 0)) {
        return (right.exactDirectPatientOverlap || 0) - (left.exactDirectPatientOverlap || 0);
      }
      return (right.normalizedScore || 0) - (left.normalizedScore || 0);
    });

  return rows;
}

function classifyCase(row) {
  const reasons = [];
  if (!row.truth_gene_rank_found) reasons.push('truth_gene_missed');
  if (row.supporting_disease_direct_count === 0) reasons.push('supporting_disease_no_direct_terms');
  if (row.best_support_candidate && row.best_support_candidate.diseaseCurie !== row.supporting_disease_curie) {
    reasons.push('supporting_disease_not_best_support_candidate');
  }
  if (
    row.best_child_under_supporting &&
    (row.best_child_under_supporting.exactDirectPatientOverlap || 0) > (row.supporting_disease_exact_direct_overlap || 0)
  ) {
    reasons.push('child_under_supporting_has_better_direct_overlap');
  }
  if ((row.supporting_disease_exact_direct_overlap || 0) === 0 && (row.patient_term_count || 0) > 0) {
    reasons.push('supporting_disease_has_zero_exact_direct_patient_overlap');
  }
  return reasons;
}

function summarizeCounts(rows) {
  const summary = {
    cases: rows.length,
    truth_found: 0,
    truth_missed: 0,
    supporting_disease_no_direct_terms: 0,
    supporting_disease_zero_exact_direct_overlap: 0,
    supporting_disease_not_best_support_candidate: 0,
    child_under_supporting_has_better_direct_overlap: 0
  };

  for (const row of rows) {
    if (row.truth_gene_rank_found) summary.truth_found += 1;
    else summary.truth_missed += 1;
    if (row.supporting_disease_direct_count === 0) summary.supporting_disease_no_direct_terms += 1;
    if ((row.supporting_disease_exact_direct_overlap || 0) === 0) summary.supporting_disease_zero_exact_direct_overlap += 1;
    if (row.audit_flags.includes('supporting_disease_not_best_support_candidate')) {
      summary.supporting_disease_not_best_support_candidate += 1;
    }
    if (row.audit_flags.includes('child_under_supporting_has_better_direct_overlap')) summary.child_under_supporting_has_better_direct_overlap += 1;
  }

  summary.supporting_disease_not_best_linked_disease = summary.supporting_disease_not_best_support_candidate;
  return summary;
}

function topCases(rows, predicate) {
  return rows.filter(predicate);
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const config = {
    phenopacketDir: flags['phenopacket-dir'] || DEFAULTS.phenopacketDir,
    outputJson: flags['output-json'] || DEFAULTS.outputJson,
    outputMd: flags['output-md'] || DEFAULTS.outputMd,
    geneLimit: Number.parseInt(String(flags['gene-limit'] || DEFAULTS.geneLimit), 10)
  };

  const [index, geneDiseaseSupportRows] = await Promise.all([
    withClient((client) => loadDxSimilarityIndex(client, { forceRefresh: true })),
    withClient((client) => loadDxGeneDiseaseSupportRows(client))
  ]);

  const diseaseProfileMap = buildDiseaseProfileIndex(index);
  const linksByGeneKey = buildDiseaseGeneIndex(geneDiseaseSupportRows);
  const childrenByParent = buildChildrenByParent(index.diseaseProfiles, index.parentMap);
  const rows = [];

  for (const fileName of (await fs.readdir(config.phenopacketDir)).filter((name) => name.endsWith('.json')).sort()) {
    const payload = JSON.parse(await fs.readFile(path.join(config.phenopacketDir, fileName), 'utf8'));
    const phenopacket = payload?.phenopacket || payload;
    const input = extractDxPhenotypeInput({ phenopacket });
    if (validateDxPhenotypeInput(input)) continue;

    const caseId = fileName.replace(/\.json$/, '');
    const truthGeneKeys = extractTruthGeneKeys(phenopacket);
    const truthGeneSet = new Set(truthGeneKeys.map((key) => normalizeGeneKey(key)));

    const geneRanking = rankGenesByPhenotypeSimilarity(index, {
      phenotypeCuries: input.presentPhenotypeCuries,
      excludedPhenotypeCuries: input.excludedPhenotypeCuries,
      limit: config.geneLimit
    });
    const diseaseRanking = rankDiseasesByPhenotypeSimilarity(index, {
      phenotypeCuries: input.presentPhenotypeCuries,
      excludedPhenotypeCuries: input.excludedPhenotypeCuries,
      limit: index.totalDiseases || 10000
    });
    const diseaseRankingMap = new Map(diseaseRanking.results.map((result) => [result.diseaseCurie, result]));

    const truthGeneResult = geneRanking.results.find((row) =>
      [row.geneCurie, row.geneLabel, row.geneSymbol].some((value) => truthGeneSet.has(normalizeGeneKey(value)))
    );

    const linkedDiseaseCandidates = [];
    const seenDiseaseCuries = new Set();
    for (const truthGeneKey of truthGeneSet) {
      for (const link of linksByGeneKey.get(truthGeneKey) || []) {
        if (seenDiseaseCuries.has(link.diseaseCurie)) continue;
        seenDiseaseCuries.add(link.diseaseCurie);
        linkedDiseaseCandidates.push(buildLinkedDiseaseSummary(link, diseaseRankingMap, diseaseProfileMap, input.presentPhenotypeCuries));
      }
    }

    const linkedDiseaseCandidatesBySimilarity = [...linkedDiseaseCandidates].sort((left, right) => {
      if ((right.normalizedScore || 0) !== (left.normalizedScore || 0)) {
        return (right.normalizedScore || 0) - (left.normalizedScore || 0);
      }
      if ((right.exactDirectPatientOverlap || 0) !== (left.exactDirectPatientOverlap || 0)) {
        return (right.exactDirectPatientOverlap || 0) - (left.exactDirectPatientOverlap || 0);
      }
      return (right.directPhenotypeCount || 0) - (left.directPhenotypeCount || 0);
    });
    const linkedDiseaseCandidatesBySupport = sortSupportCandidates(linkedDiseaseCandidates);
    const bestSupportCandidate = linkedDiseaseCandidatesBySupport[0] || null;

    const supportingDiseaseCurie = truthGeneResult?.supportingDiseaseCurie || '';
    const supportingDiseaseSummary = supportingDiseaseCurie
      ? linkedDiseaseCandidatesBySupport.find((candidate) => candidate.diseaseCurie === supportingDiseaseCurie) ||
        buildLinkedDiseaseSummary(
          {
            diseaseCurie: supportingDiseaseCurie,
            diseaseLabel: truthGeneResult?.supportingDiseaseLabel || supportingDiseaseCurie,
            supportWeight: 0
          },
          diseaseRankingMap,
          diseaseProfileMap,
          input.presentPhenotypeCuries
        )
      : null;

    const childSummaries = supportingDiseaseCurie
      ? buildChildSummary(supportingDiseaseCurie, childrenByParent, diseaseRankingMap, diseaseProfileMap, input.presentPhenotypeCuries)
      : [];

    const row = {
      case_id: caseId,
      file_name: fileName,
      patient_term_count: input.presentPhenotypeCuries.length,
      truth_gene_keys: truthGeneKeys,
      truth_gene_rank: truthGeneResult?.rank ?? null,
      truth_gene_rank_found: truthGeneResult != null,
      supporting_disease_curie: supportingDiseaseCurie,
      supporting_disease_label: truthGeneResult?.supportingDiseaseLabel || '',
      supporting_disease_support_score: supportingDiseaseSummary?.diseaseSupportScore ?? 0,
      supporting_disease_evidence_weight: supportingDiseaseSummary?.evidenceWeight ?? 0,
      supporting_disease_support_weight: supportingDiseaseSummary?.supportWeight ?? 0,
      supporting_disease_direct_count: supportingDiseaseSummary?.directPhenotypeCount || 0,
      supporting_disease_propagated_count: supportingDiseaseSummary?.propagatedPhenotypeCount || 0,
      supporting_disease_exact_overlap: supportingDiseaseSummary?.exactPatientOverlap || 0,
      supporting_disease_exact_direct_overlap: supportingDiseaseSummary?.exactDirectPatientOverlap || 0,
      best_support_candidate: bestSupportCandidate,
      top_support_candidates: linkedDiseaseCandidatesBySupport.slice(0, 5),
      highest_similarity_linked_disease: linkedDiseaseCandidatesBySimilarity[0] || null,
      top_linked_diseases_by_similarity: linkedDiseaseCandidatesBySimilarity.slice(0, 5),
      best_linked_disease: bestSupportCandidate,
      top_linked_diseases: linkedDiseaseCandidatesBySupport.slice(0, 5),
      best_child_under_supporting: childSummaries[0] || null,
      top_children_under_supporting: childSummaries.slice(0, 5)
    };

    row.audit_flags = classifyCase(row);
    rows.push(row);
  }

  const report = {
    created_at: new Date().toISOString(),
    phenopacket_dir: config.phenopacketDir,
    summary: summarizeCounts(rows),
    supporting_disease_no_direct_terms_cases: topCases(
      rows,
      (row) => row.audit_flags.includes('supporting_disease_no_direct_terms')
    ),
    supporting_disease_zero_exact_direct_overlap_cases: topCases(
      rows,
      (row) => row.audit_flags.includes('supporting_disease_has_zero_exact_direct_patient_overlap')
    ),
    child_beats_supporting_direct_overlap_cases: topCases(
      rows,
      (row) => row.audit_flags.includes('child_under_supporting_has_better_direct_overlap')
    ),
    supporting_not_best_support_candidate_cases: topCases(
      rows,
      (row) => row.audit_flags.includes('supporting_disease_not_best_support_candidate')
    ),
    supporting_not_best_linked_cases: topCases(
      rows,
      (row) => row.audit_flags.includes('supporting_disease_not_best_support_candidate')
    ),
    per_case: rows
  };

  await fs.writeFile(config.outputJson, `${JSON.stringify(report, null, 2)}\n`);

  const md = [
    '# Truth Gene Coverage Audit',
    '',
    `Created: ${report.created_at}`,
    '',
    '## Summary',
    '',
    `Cases: ${report.summary.cases}`,
    `Truth found: ${report.summary.truth_found}`,
    `Truth missed: ${report.summary.truth_missed}`,
    `Supporting disease has no direct terms: ${report.summary.supporting_disease_no_direct_terms}`,
    `Supporting disease zero exact direct overlap: ${report.summary.supporting_disease_zero_exact_direct_overlap}`,
    `Supporting disease not best support candidate: ${report.summary.supporting_disease_not_best_support_candidate}`,
    `Child under supporting beats supporting on direct overlap: ${report.summary.child_under_supporting_has_better_direct_overlap}`,
    '',
    '## Interpretation',
    '',
    'This audit is case-level and benchmark-focused. It checks the truth gene, the disease support path the scorer actually picked, and whether linked or child diseases appear to have better exact standardized HPO coverage.',
    '',
    '## Output',
    '',
    `JSON: ${config.outputJson}`
  ].join('\n');

  await fs.writeFile(config.outputMd, `${md}\n`);

  console.log(`JSON_OUT=${config.outputJson}`);
  console.log(`MD_OUT=${config.outputMd}`);
}

main().catch((error) => {
  console.error('[audit-truth-gene-coverage] failed:', error);
  process.exit(1);
});
