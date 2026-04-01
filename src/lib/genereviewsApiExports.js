import path from 'node:path';
import { SOURCE_CATALOG } from '../constants/sourceCatalog.js';

const API_PIPELINE_VERSION = 'genereviews-api-export-v1-20260331';
const HPO_FREQUENCY_TERMS = Object.freeze({
  'very frequent': { hpo_id: 'HP:0040281', label: 'Very frequent' },
  frequent: { hpo_id: 'HP:0040282', label: 'Frequent' },
  occasional: { hpo_id: 'HP:0040283', label: 'Occasional' },
  'very rare': { hpo_id: 'HP:0040284', label: 'Very rare' }
});

function normalizeFrequencyValue(rawValue) {
  const raw = String(rawValue || '').trim();
  if (!raw) {
    return {
      value_numeric: null,
      value_min: null,
      value_max: null,
      normalization_method: null
    };
  }
  const percentageMatch = raw.match(/(\d+(?:\.\d+)?)\s*%/);
  if (percentageMatch) {
    const value = Number(percentageMatch[1]) / 100;
    return {
      value_numeric: value,
      value_min: value,
      value_max: value,
      normalization_method: 'percentage'
    };
  }
  const fractionMatch = raw.match(/(\d+)\s*\/\s*(\d+)/);
  if (fractionMatch && Number(fractionMatch[2])) {
    const value = Number(fractionMatch[1]) / Number(fractionMatch[2]);
    return {
      value_numeric: value,
      value_min: value,
      value_max: value,
      normalization_method: 'fraction'
    };
  }
  return {
    value_numeric: null,
    value_min: null,
    value_max: null,
    normalization_method: null
  };
}

function extractGeneSymbols(chapter) {
  const values = [];
  if (Array.isArray(chapter.geneSymbols)) values.push(...chapter.geneSymbols);
  if (Array.isArray(chapter.genes)) values.push(...chapter.genes);
  if (chapter.geneSymbol) values.push(chapter.geneSymbol);
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))];
}

function extractChapterDomains(chapter) {
  return Array.isArray(chapter.chapterDomains) ? chapter.chapterDomains : [];
}

function extractHeadingInventory(chapter) {
  return Array.isArray(chapter.headingInventory) ? chapter.headingInventory : [];
}

function cleanChapterTitle(value) {
  return String(value || '')
    .replace(/\s+-\s+GeneReviews.*$/i, '')
    .replace(/\s+-\s+NCBI Bookshelf.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildDiseaseContexts(chapter) {
  const policyTargets = Array.isArray(chapter?.policy?.diseaseTargets) ? chapter.policy.diseaseTargets : [];
  if (policyTargets.length) {
    return policyTargets.map((target) => ({
      curie: target.disease_curie || target.diseaseCurie || null,
      label: target.disease_label || target.diseaseLabel || null
    }));
  }
  if (chapter.rosterMappedDiseaseCurie || chapter.rosterMappedDiseaseLabel) {
    return [
      {
        curie: chapter.rosterMappedDiseaseCurie || null,
        label: chapter.rosterMappedDiseaseLabel || null
      }
    ];
  }
  return [{ curie: null, label: null }];
}

function buildAssertionId({ nbkId, diseaseCurie, phenotypeCurie, status }) {
  const chapterKey = nbkId || 'unknown';
  const diseaseKey = diseaseCurie || 'unmapped';
  const phenotypeKey = phenotypeCurie || 'unknown';
  return `GR-${chapterKey}-${diseaseKey}-${phenotypeKey}-${status || 'present'}`;
}

function buildValidationMap(verification) {
  return new Map((verification?.checks || []).map((entry) => [entry.name, entry]));
}

function buildConcordanceKey(diseaseCurie, phenotypeCurie, status) {
  return `${String(diseaseCurie || '').trim()}::${String(phenotypeCurie || '').trim()}::${String(status || 'present').trim()}`;
}

function buildFrequencyBlock(feature) {
  const termMeta = HPO_FREQUENCY_TERMS[String(feature.frequency_value || '').trim().toLowerCase()] || null;
  const normalized = normalizeFrequencyValue(feature.frequency_value || feature.frequency_raw);
  return {
    value: normalized.value_numeric,
    value_min: normalized.value_min,
    value_max: normalized.value_max,
    normalization_method: normalized.normalization_method,
    raw: feature.frequency_raw || feature.frequency_value || null,
    hpo_category: termMeta?.hpo_id || null,
    hpo_category_label: termMeta?.label || null,
    trust: feature.frequency_trust || null,
    evidence_text: feature.frequency_evidence || null
  };
}

function buildOnsetBlock(feature) {
  return {
    hpo_id: feature.onset_hpo_id || null,
    label: feature.onset_label || null,
    raw: feature.onset_raw || null,
    trust: feature.onset_trust || null,
    evidence_text: feature.onset_evidence || null
  };
}

function buildSimpleMetadataBlock(raw, trust, evidenceText) {
  return {
    raw: raw || null,
    trust: trust || null,
    evidence_text: evidenceText || null
  };
}

function buildProvenanceBlock(chapter, feature, sourceKey) {
  return {
    source_key: sourceKey,
    nbk_id: chapter.nbkId || '',
    chapter_title: cleanChapterTitle(chapter.chapterTitle || ''),
    section_id: feature.section_id || null,
    section_heading: feature.section_heading || null,
    source_sentence: feature.source_sentence || '',
    paragraph_id: feature.paragraph_id || null,
    sentence_id: feature.sentence_id || null,
    paragraph_char_start: feature.paragraph_char_start ?? null,
    paragraph_char_end: feature.paragraph_char_end ?? null,
    sentence_char_start: feature.sentence_char_start ?? null,
    sentence_char_end: feature.sentence_char_end ?? null,
    match_char_start: feature.match_char_start ?? null,
    match_char_end: feature.match_char_end ?? null,
    provenance_url: chapter.nbkId
      ? `https://www.ncbi.nlm.nih.gov/books/${chapter.nbkId}/`
      : chapter.chapterUrl || '',
    extraction_date: new Date().toISOString().slice(0, 10),
    pipeline_version: API_PIPELINE_VERSION
  };
}

function buildValidationBlock(feature, verification, concordanceMap, diseaseCurie) {
  const checks = buildValidationMap(verification);
  const concordance = concordanceMap?.get(buildConcordanceKey(diseaseCurie, feature.hpo_id, feature.status || 'present')) || [];
  return {
    anchor_source: feature.anchor_source || null,
    hpo_mapping_method: feature.anchor_source || null,
    hpo_mapping_trust: feature.hpo_mapping_trust || null,
    verification_verdict: feature.verification_verdict || verification?.verdict || null,
    auto_accept_eligible: feature.auto_accept_eligible ?? false,
    auto_accept_reasons: feature.auto_accept_reasons || [],
    alias_shadow: checks.get('alias_shadow')?.status === 'flag',
    section_branch_consistent: checks.get('section_branch_consistency')?.status === 'pass'
      ? true
      : checks.get('section_branch_consistency')?.status === 'flag'
        ? false
        : null,
    table_concordance: checks.get('table_concordance')?.status || null,
    cross_source_concordance: concordance.map((sourceKey) => ({
      source_key: sourceKey,
      display_name: SOURCE_CATALOG[sourceKey]?.displayName || sourceKey
    }))
  };
}

export function buildApiAssertionRows({ chapter, features, verificationByKey, sourceKey, concordanceMap = new Map() }) {
  const genes = extractGeneSymbols(chapter);
  const diseases = buildDiseaseContexts(chapter);
  const rows = [];
  for (const disease of diseases) {
    for (const feature of features) {
      const verification = verificationByKey.get(`${feature.hpo_id}::${feature.status || 'present'}`) || null;
      rows.push({
        assertion_id: buildAssertionId({
          nbkId: chapter.nbkId,
          diseaseCurie: disease.curie,
          phenotypeCurie: feature.hpo_id,
          status: feature.status
        }),
        disease_curie: disease.curie,
        disease_label: disease.label,
        gene_symbols: genes,
        local_clinical_domains: Array.isArray(feature.local_clinical_domains) ? feature.local_clinical_domains : [],
        phenotype_curie: feature.hpo_id,
        phenotype_label: feature.hpo_label,
        status: feature.status || 'present',
        frequency: buildFrequencyBlock(feature),
        onset: buildOnsetBlock(feature),
        severity: buildSimpleMetadataBlock(feature.severity_raw, feature.severity_trust, null),
        progression: buildSimpleMetadataBlock(feature.progression_raw, feature.progression_trust, feature.progression_evidence),
        treatment_response: buildSimpleMetadataBlock(
          feature.treatment_response_raw,
          feature.treatment_response_trust,
          feature.treatment_response_evidence
        ),
        provenance: buildProvenanceBlock(chapter, feature, sourceKey),
        validation: buildValidationBlock(feature, verification, concordanceMap, disease.curie)
      });
    }
  }
  return rows;
}

export function buildChapterExport({ chapter, assertions }) {
  const diseases = buildDiseaseContexts(chapter)
    .map((entry) => entry.curie)
    .filter(Boolean);
  const chapterTitle = cleanChapterTitle(chapter.chapterTitle || '');
  return {
    chapter_key: chapter.chapterKey || '',
    nbk_id: chapter.nbkId || '',
    chapter_title: chapterTitle,
    source_url: chapter.nbkId ? `https://www.ncbi.nlm.nih.gov/books/${chapter.nbkId}/` : chapter.chapterUrl || '',
    diseases,
    genes: extractGeneSymbols(chapter),
    chapter_domains: extractChapterDomains(chapter),
    heading_inventory: extractHeadingInventory(chapter),
    extraction_date: new Date().toISOString().slice(0, 10),
    pipeline_version: API_PIPELINE_VERSION,
    total_assertions: assertions.length,
    assertions,
    summary_stats: {
      present_count: assertions.filter((row) => row.status === 'present').length,
      excluded_count: assertions.filter((row) => row.status === 'excluded').length,
      with_frequency: assertions.filter((row) => row.frequency.raw).length,
      with_onset: assertions.filter((row) => row.onset.raw || row.onset.hpo_id).length,
      high_trust: assertions.filter((row) => row.validation.hpo_mapping_trust === 'high').length,
      medium_trust: assertions.filter((row) => row.validation.hpo_mapping_trust === 'medium').length
    }
  };
}

export function chapterExportPath(apiOutputDir, fileStem) {
  return path.join(apiOutputDir, 'chapters', `${fileStem}_chapter.json`);
}
