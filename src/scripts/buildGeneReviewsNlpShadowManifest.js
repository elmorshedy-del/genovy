import fs from 'node:fs/promises';
import path from 'node:path';
import { withClient } from '../db/pool.js';
import { loadDxDiseasePhenotypeRows } from '../repositories/dxRepository.js';
import {
  resolveEntitiesByCurieBatch,
  resolveEntityByLabel,
  searchKnowledgeEntities
} from '../repositories/knowledgeRepository.js';
import { normalizeCurie, normalizeLabel } from '../lib/curies.js';

const DEFAULTS = Object.freeze({
  grOutputDir: '/Users/ahmedelmorshedy/Downloads/files (4)/gr_output',
  priorityGeneListJson: '/Users/ahmedelmorshedy/Downloads/files (4)/priority_gene_list.json',
  benchmarkJson:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/official-real-v1-working-handoff-floor-1.0-20260326.json',
  auditOutputDir: '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output',
  outputJson:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-nlp-shadow-manifest-20260328.json',
  generatedAt: '2026-03-28'
});

const ASSERTION_STATUS = Object.freeze({
  PRESENT: 'present',
  ABSENT: 'absent'
});

const SOURCE_KEY = 'genereviews_nlp';

const HPO_FREQUENCY_CURIES = Object.freeze({
  obligate: 'HP:0040280',
  veryFrequent: 'HP:0040281',
  frequent: 'HP:0040282',
  occasional: 'HP:0040283',
  veryRare: 'HP:0040284',
  excluded: 'HP:0040285'
});

const HPO_FREQUENCY_LABELS = Object.freeze({
  [HPO_FREQUENCY_CURIES.obligate]: 'Obligate',
  [HPO_FREQUENCY_CURIES.veryFrequent]: 'Very frequent',
  [HPO_FREQUENCY_CURIES.frequent]: 'Frequent',
  [HPO_FREQUENCY_CURIES.occasional]: 'Occasional',
  [HPO_FREQUENCY_CURIES.veryRare]: 'Very rare',
  [HPO_FREQUENCY_CURIES.excluded]: 'Excluded'
});

const GENE_DISEASE_MAPPINGS = Object.freeze({
  ANKRD11: ['MONDO:0007846'],
  PPP2R1A: ['MONDO:0014605', 'MONDO:0957553'],
  RERE: ['MONDO:0014857', 'ORPHA:494344'],
  SETD2: ['MONDO:0014791'],
  SMARCC2: ['MONDO:0032702'],
  STXBP1: ['MONDO:0012812', 'ORPHA:599373']
});

const FEATURE_REVIEW_RULES = Object.freeze({
  ANKRD11: {
    remap: {
      'HP:0011069': {
        curie: 'HP:0000675',
        reason: 'Map upper-incisor macrodontia to the graph term for permanent maxillary central incisor macrodontia.'
      },
      'HP:0000925': {
        curie: 'HP:0003422',
        reason: 'Graph lacks the extracted costovertebral label; vertebral segmentation defect is the closest safe graph term.'
      }
    },
    labelRemap: {
      'macrodontia of permanent upper incisors': {
        curie: 'HP:0000675',
        reason: 'Map upper-incisor macrodontia to the graph term for permanent maxillary central incisor macrodontia.'
      },
      'costovertebral segmentation defect': {
        curie: 'HP:0003422',
        reason: 'Graph lacks the extracted costovertebral label; vertebral segmentation defect is the closest safe graph term.'
      }
    },
    drop: {
      'HP:0001249': 'Learning difficulties of variable severity do not safely justify an intellectual-disability assertion beyond the other extracted developmental terms.'
    },
    labelDrop: {
      'learning disability':
        'Learning difficulties of variable severity do not safely justify an intellectual-disability assertion beyond the other extracted developmental terms.'
    }
  },
  PPP2R1A: {
    remap: {
      'HP:0001624': {
        curie: 'HP:0031936',
        reason: 'Resolve the invalid delayed-walking identifier to the graph term Delayed ability to walk.'
      },
      'HP:0008572': {
        curie: 'HP:0008772',
        reason: 'External ear abnormalities including microtia are better represented by Aplasia/Hypoplasia of the external ear than the obsolete extracted term.'
      },
      'HP:0002511': {
        curie: 'HP:0006970',
        reason: 'Resolve the misbound periventricular leukomalacia identifier to the live graph term.'
      }
    },
    labelRemap: {
      'delayed walking': {
        curie: 'HP:0031936',
        reason: 'Resolve delayed walking to the graph term Delayed ability to walk.'
      },
      'external ear malformation': {
        curie: 'HP:0008772',
        reason: 'External ear abnormalities including microtia are better represented by Aplasia/Hypoplasia of the external ear.'
      },
      'periventricular leukomalacia': {
        curie: 'HP:0006970',
        reason: 'Resolve periventricular leukomalacia to the live graph identifier.'
      }
    },
    drop: {
      'HP:0000742': 'The extracted destructive-behavior identifier resolves to self-mutilation in the graph and is not safe to ingest from this sentence.'
    },
    labelDrop: {
      'destructive behavior':
        'The extracted destructive-behavior identifier resolves to self-mutilation in the graph and is not safe to ingest from this sentence.'
    }
  },
  RERE: {
    remap: {
      'HP:0007817': {
        curie: 'HP:0012803',
        reason: 'Resolve anisometropia to the live graph identifier.'
      },
      'HP:0011969': {
        curie: 'HP:0002033',
        reason: 'Resolve poor suck to the live graph identifier.'
      }
    },
    labelRemap: {
      anisometropia: {
        curie: 'HP:0012803',
        reason: 'Resolve anisometropia to the live graph identifier.'
      },
      'poor suck': {
        curie: 'HP:0002033',
        reason: 'Resolve poor suck to the live graph identifier.'
      }
    },
    drop: {
      'HP:0011506': 'Broad structural-eye-anomaly extraction is redundant with the more specific eye findings already extracted and the identifier resolves incorrectly in the graph.',
      'HP:0001283': 'The extracted cranial-nerve-palsy identifier resolves to bulbar palsy in the graph and is too specific for the source sentence.'
    },
    labelDrop: {
      'structural eye anomaly':
        'Broad structural-eye-anomaly extraction is redundant with the more specific eye findings already extracted.',
      'cranial nerve palsy':
        'The extracted cranial-nerve-palsy label is too specific for the source sentence and resolves to bulbar palsy in the graph.'
    }
  },
  SETD2: {
    remap: {
      'HP:0004440': {
        curie: 'HP:0004422',
        reason: 'Resolve biparietal narrowing to the live graph identifier.'
      },
      'HP:0000583': {
        curie: 'HP:0012745',
        reason: 'Resolve short palpebral fissure to the live graph identifier.'
      }
    },
    labelRemap: {
      'biparietal narrowing': {
        curie: 'HP:0004422',
        reason: 'Resolve biparietal narrowing to the live graph identifier.'
      },
      'short palpebral fissure': {
        curie: 'HP:0012745',
        reason: 'Resolve short palpebral fissure to the live graph identifier.'
      }
    },
    drop: {
      'HP:0000252': 'Microcephaly belongs to the MCA branch of the GeneReviews chapter, not the benchmark Luscan-Lumish branch.',
      'HP:0001531': 'Failure to thrive in infancy is MCA-branch specific in this chapter.',
      'HP:0001100': 'Coats disease resolves to the wrong graph identifier and is specific to the MCA branch.',
      'HP:0000294': 'Low anterior hairline is listed only in the MCA-specific suggestive findings.',
      'HP:0004440:after-remap': 'Biparietal narrowing is listed only in the MCA-specific suggestive findings.',
      'HP:0000327': 'Maxillary hypoplasia is listed only in the MCA-specific suggestive findings.',
      'HP:0002553': 'Arched eyebrows are listed only in the MCA-specific suggestive findings.',
      'HP:0000316': 'Hypertelorism is listed only in the MCA-specific suggestive findings.',
      'HP:0000583:after-remap': 'Short palpebral fissure is listed only in the MCA-specific suggestive findings.',
      'HP:0000431': 'Wide nasal bridge is listed only in the MCA-specific suggestive findings.',
      'HP:0000463': 'Anteverted nares are listed only in the MCA-specific suggestive findings.',
      'HP:0000455': 'Broad nasal tip is listed only in the MCA-specific suggestive findings.',
      'HP:0000347': 'Micrognathia is listed only in the MCA-specific suggestive findings.'
    },
    labelDrop: {
      microcephaly: 'Microcephaly belongs to the MCA branch of the GeneReviews chapter, not the benchmark Luscan-Lumish branch.',
      'failure to thrive in infancy': 'Failure to thrive in infancy is MCA-branch specific in this chapter.',
      'coats disease': 'Coats disease is specific to the MCA branch of the GeneReviews chapter.',
      'low anterior hairline': 'Low anterior hairline is listed only in the MCA-specific suggestive findings.',
      'biparietal narrowing': 'Biparietal narrowing is listed only in the MCA-specific suggestive findings.',
      'maxillary hypoplasia': 'Maxillary hypoplasia is listed only in the MCA-specific suggestive findings.',
      'arched eyebrows': 'Arched eyebrows are listed only in the MCA-specific suggestive findings.',
      hypertelorism: 'Hypertelorism is listed only in the MCA-specific suggestive findings.',
      'short palpebral fissure': 'Short palpebral fissure is listed only in the MCA-specific suggestive findings.',
      'broad nasal bridge': 'Broad nasal bridge is listed only in the MCA-specific suggestive findings.',
      'anteverted nares': 'Anteverted nares are listed only in the MCA-specific suggestive findings.',
      'broad nasal tip': 'Broad nasal tip is listed only in the MCA-specific suggestive findings.',
      micrognathia: 'Micrognathia is listed only in the MCA-specific suggestive findings.'
    }
  },
  SMARCC2: {
    remap: {
      'HP:0006159': {
        curie: 'HP:0008398',
        reason: 'The graph lacks a broader fifth-digit/nail hypoplasia term; map conservatively to hypoplastic fifth fingernail.'
      },
      'HP:0001388': {
        curie: 'HP:0001382',
        reason: 'Replace obsolete joint laxity with joint hypermobility.'
      },
      'HP:0011398': {
        curie: 'HP:0001252',
        reason: 'Replace obsolete central hypotonia with hypotonia.'
      },
      'HP:0000110': {
        curie: 'HP:0000119',
        reason: 'Replace the misbound genitourinary-malformation identifier with the graph term Abnormality of the genitourinary system.'
      }
    }
    ,
    labelRemap: {
      'hypoplasia of the fifth digit': {
        curie: 'HP:0008398',
        reason: 'The graph lacks a broader fifth-digit hypoplasia label; map conservatively to hypoplastic fifth fingernail.'
      },
      'joint laxity': {
        curie: 'HP:0001382',
        reason: 'Replace obsolete joint laxity with joint hypermobility.'
      },
      'central hypotonia': {
        curie: 'HP:0001252',
        reason: 'Replace obsolete central hypotonia with hypotonia.'
      },
      'genitourinary malformation': {
        curie: 'HP:0000119',
        reason: 'Replace the misbound genitourinary-malformation identifier with the graph term Abnormality of the genitourinary system.'
      }
    }
  },
  STXBP1: {
    remap: {
      'HP:0001388': {
        curie: 'HP:0001382',
        reason: 'Replace obsolete joint laxity with joint hypermobility.'
      }
    },
    labelRemap: {
      'joint laxity': {
        curie: 'HP:0001382',
        reason: 'Replace obsolete joint laxity with joint hypermobility.'
      }
    },
    drop: {
      'HP:0100854': 'Neurobehavioral manifestations are already decomposed into specific behavioral features elsewhere in the extraction.',
      'HP:0002540': 'Wheelchair bound is not equivalent to the graph term Inability to walk.',
      'HP:0002130': 'No safe refractory-seizure identifier exists in the current graph; keep the broader seizure burden features instead.',
      'HP:0010802': 'Ohtahara syndrome is a syndrome label, not a phenotype assertion for ingestion.',
      'HP:0002105': 'Rett syndrome phenotype is a syndrome label, not a phenotype assertion for ingestion.'
    },
    labelDrop: {
      'neurobehavioral manifestations':
        'Neurobehavioral manifestations are already decomposed into specific behavioral features elsewhere in the extraction.',
      'wheelchair bound': 'Wheelchair bound is not equivalent to the graph term Inability to walk.',
      'refractory seizures':
        'No safe refractory-seizure identifier exists in the current graph; keep the broader seizure burden features instead.',
      'ohtahara syndrome': 'Ohtahara syndrome is a syndrome label, not a phenotype assertion for ingestion.',
      'rett syndrome': 'Rett syndrome is a syndrome label, not a phenotype assertion for ingestion.'
    }
  }
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

function slugify(value) {
  return String(value || '')
    .trim()
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function getFeatureLabel(feature) {
  return String(feature.label || feature.hpo_label || '').trim();
}

function getFeatureCurie(feature) {
  return normalizeCurie(feature.hpo_id || feature.hpoId || '');
}

function buildLabelCandidates(label) {
  const raw = String(label || '').trim();
  const candidates = new Set();
  if (!raw) return [];
  candidates.add(raw);

  if (raw.endsWith('ies') && raw.length > 3) {
    candidates.add(`${raw.slice(0, -3)}y`);
  }
  if (raw.endsWith('s') && !raw.endsWith('ss') && raw.length > 3) {
    candidates.add(raw.slice(0, -1));
  }
  return [...candidates];
}

function asPresenceStatus(status) {
  return String(status || '').trim().toLowerCase() === 'excluded'
    ? ASSERTION_STATUS.ABSENT
    : ASSERTION_STATUS.PRESENT;
}

function normalizeTextFrequency(rawValue) {
  const value = String(rawValue || '').trim().toLowerCase();
  if (!value) return '';
  if (value === '100%' || value === 'all') return HPO_FREQUENCY_CURIES.obligate;
  if (value.includes('very frequent') || value.includes('80-99%') || value.includes('≥80')) {
    return HPO_FREQUENCY_CURIES.veryFrequent;
  }
  if (
    value.includes('frequent') ||
    value.includes('common') ||
    value.includes('often') ||
    value.includes('most') ||
    value.includes('30-79%')
  ) {
    return HPO_FREQUENCY_CURIES.frequent;
  }
  if (value.includes('occasional') || value.includes('5-29%')) {
    return HPO_FREQUENCY_CURIES.occasional;
  }
  if (
    value.includes('rare') ||
    value.includes('minority') ||
    value.includes('few') ||
    value.includes('1-4%') ||
    value.includes('fewer than')
  ) {
    return HPO_FREQUENCY_CURIES.veryRare;
  }
  return '';
}

function normalizeRatioFrequency(rawValue) {
  const value = String(rawValue || '').trim();
  const ratio = value.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (!ratio) return '';
  const numerator = Number(ratio[1]);
  const denominator = Number(ratio[2]);
  if (!denominator) return '';
  const percentage = (numerator / denominator) * 100;
  if (percentage === 100) return HPO_FREQUENCY_CURIES.obligate;
  if (percentage >= 80) return HPO_FREQUENCY_CURIES.veryFrequent;
  if (percentage >= 30) return HPO_FREQUENCY_CURIES.frequent;
  if (percentage >= 5) return HPO_FREQUENCY_CURIES.occasional;
  if (percentage >= 1) return HPO_FREQUENCY_CURIES.veryRare;
  return HPO_FREQUENCY_CURIES.excluded;
}

function buildFrequencyInfo(rawValue) {
  const raw = String(rawValue || '').trim();
  const curie = normalizeTextFrequency(raw) || normalizeRatioFrequency(raw);
  return {
    frequency: raw || null,
    frequencyCurie: curie || '',
    frequencyLabel: curie ? HPO_FREQUENCY_LABELS[curie] || raw : raw || ''
  };
}

function buildBenchmarkCaseMap(benchmark) {
  const casesByGene = new Map();
  for (const row of benchmark.per_case || []) {
    const geneSymbol = (row.truth_gene_keys || [])
      .map((value) => String(value || ''))
      .find((value) => value.startsWith('symbol:'))
      ?.split(':')
      ?.slice(1)
      ?.join(':');
    if (!geneSymbol) continue;
    if (!casesByGene.has(geneSymbol)) {
      casesByGene.set(geneSymbol, []);
    }
    casesByGene.get(geneSymbol).push(row.case_id);
  }
  return casesByGene;
}

async function loadPriorityRivalAuditSummary(auditOutputDir, priorityGenes) {
  const auditEntries = await fs.readdir(auditOutputDir, { withFileTypes: true });
  const auditJsonFiles = auditEntries
    .filter((entry) => entry.isFile() && entry.name.startsWith('audit-') && entry.name.endsWith('.json'))
    .map((entry) => path.join(auditOutputDir, entry.name))
    .sort();

  const matchedPriorityRivals = [];
  for (const auditPath of auditJsonFiles) {
    const parsed = JSON.parse(await fs.readFile(auditPath, 'utf8'));
    const truthGene = parsed.truthGene || parsed.truth?.geneLabel || '';
    const top1Gene = parsed.top1?.geneLabel || '';
    if (top1Gene && top1Gene !== truthGene && priorityGenes.has(top1Gene)) {
      matchedPriorityRivals.push({
        auditFile: auditPath,
        truthGene,
        rivalGene: top1Gene
      });
    }
  }

  return {
    checkedAuditJsonCount: auditJsonFiles.length,
    checkedAuditJsonFiles: auditJsonFiles,
    matchedPriorityRivals
  };
}

function applyFeatureReview(geneSymbol, feature) {
  const rules = FEATURE_REVIEW_RULES[geneSymbol] || {};
  const originalCurie = getFeatureCurie(feature);
  const originalLabel = getFeatureLabel(feature);
  const normalizedLabel = normalizeLabel(originalLabel);
  const labelRemapRule = rules.labelRemap?.[normalizedLabel];
  const remapRule = rules.remap?.[originalCurie];
  const chosenRemapRule = remapRule || labelRemapRule || null;
  const remappedCurie = normalizeCurie(chosenRemapRule?.curie || originalCurie);
  const dropKey = remapRule ? `${originalCurie}:after-remap` : originalCurie;
  const dropReason =
    rules.drop?.[dropKey] ||
    rules.drop?.[originalCurie] ||
    rules.labelDrop?.[normalizedLabel] ||
    '';

  if (dropReason) {
    return {
      action: 'drop',
      finalCurie: remappedCurie,
      finalLabel: originalLabel,
      reviewReason: dropReason,
      remapReason: chosenRemapRule?.reason || '',
      reviewMode: chosenRemapRule ? 'remapped_then_dropped' : 'dropped'
    };
  }

  if (chosenRemapRule) {
    return {
      action: 'keep',
      finalCurie: remappedCurie,
      finalLabel: originalLabel,
      reviewReason: chosenRemapRule.reason,
      remapReason: chosenRemapRule.reason,
      reviewMode: 'curie_remapped'
    };
  }

  return {
    action: 'keep',
    finalCurie: '',
    finalLabel: originalLabel,
    reviewReason: '',
    remapReason: '',
    reviewMode: 'label_first'
  };
}

async function loadEntityRows(client, curies) {
  const normalized = [...new Set((curies || []).map((value) => normalizeCurie(value)).filter(Boolean))];
  if (!normalized.length) return [];
  const result = await client.query(
    `
      SELECT entity_id, canonical_curie, canonical_label, entity_type
      FROM entities
      WHERE canonical_curie = ANY($1::text[])
      ORDER BY canonical_curie ASC
    `,
    [normalized]
  );
  return result.rows;
}

async function resolvePhenotypeEntity(client, candidate, entityByCurie) {
  if (candidate.phenotypeCurie) {
    const direct = entityByCurie.get(candidate.phenotypeCurie);
    if (direct) {
      return {
        entity: direct,
        mappingMode: candidate.reviewMode === 'curie_remapped' ? 'manual_curie_remap' : 'reviewed_curie'
      };
    }
  }

  for (const labelCandidate of buildLabelCandidates(candidate.reviewedPhenotypeLabel)) {
    const exact = await resolveEntityByLabel(client, labelCandidate, 'phenotype');
    if (exact) {
      const exactCurie = normalizeCurie(exact.canonical_curie);
      let entity = entityByCurie.get(exactCurie);
      if (!entity) {
        const [loaded] = await loadEntityRows(client, [exactCurie]);
        if (loaded) {
          entity = loaded;
          entityByCurie.set(exactCurie, loaded);
        }
      }
      if (entity) {
        return {
          entity,
          mappingMode: normalizeLabel(labelCandidate) === normalizeLabel(candidate.reviewedPhenotypeLabel)
            ? 'label_exact_or_alias'
            : 'label_variant_exact_or_alias'
        };
      }
    }
  }

  const diagnostics = await searchKnowledgeEntities(client, {
    query: candidate.reviewedPhenotypeLabel,
    entityType: 'phenotype',
    limit: 3
  });

  return {
    entity: null,
    mappingMode: '',
    diagnostics: diagnostics.map((row) => ({
      canonicalCurie: row.canonical_curie,
      canonicalLabel: row.canonical_label,
      matchRank: row.match_rank
    }))
  };
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const grOutputDir = flags.inputDir || DEFAULTS.grOutputDir;
  const priorityGeneListJson = flags.priority || DEFAULTS.priorityGeneListJson;
  const benchmarkJson = flags.benchmark || DEFAULTS.benchmarkJson;
  const auditOutputDir = flags.auditDir || DEFAULTS.auditOutputDir;
  const outputJson = flags.output || DEFAULTS.outputJson;

  const priorityGenes = JSON.parse(await fs.readFile(priorityGeneListJson, 'utf8'));
  const extractedFiles = await fs.readdir(grOutputDir);
  const extractedJsonFiles = extractedFiles
    .filter((fileName) => fileName.endsWith('.json') && fileName.includes('_NBK') && !fileName.includes('summary'))
    .sort();

  const benchmark = JSON.parse(await fs.readFile(benchmarkJson, 'utf8'));
  const caseIdsByGene = buildBenchmarkCaseMap(benchmark);
  const priorityGeneSet = new Set(priorityGenes.map((row) => row.gene_symbol));
  const rivalAuditSummary = await loadPriorityRivalAuditSummary(auditOutputDir, priorityGeneSet);

  const extractedByGene = new Map();
  for (const fileName of extractedJsonFiles) {
    const payload = JSON.parse(await fs.readFile(path.join(grOutputDir, fileName), 'utf8'));
    extractedByGene.set(payload.gene_symbol, {
      fileName,
      payload
    });
  }

  const mappedDiseaseCuries = [
    ...new Set(Object.values(GENE_DISEASE_MAPPINGS).flat().map((value) => normalizeCurie(value)).filter(Boolean))
  ];

  const reviewedCandidates = [];
  const skipped = [];

  for (const row of priorityGenes) {
    const geneSymbol = row.gene_symbol;
    const nbkId = row.nbk_id;
    const extracted = extractedByGene.get(geneSymbol);

    if (!extracted) {
      skipped.push({
        scope: 'gene',
        geneSymbol,
        nbkId,
        reason: 'No extracted GeneReviews JSON file was found for this verified priority gene.'
      });
      continue;
    }

    const diseaseCuries = GENE_DISEASE_MAPPINGS[geneSymbol] || [];
    if (!diseaseCuries.length) {
      skipped.push({
        scope: 'gene',
        geneSymbol,
        nbkId,
        reason: 'No reviewed graph disease mapping was configured for this gene.'
      });
      continue;
    }

    for (const feature of extracted.payload.features || []) {
      const review = applyFeatureReview(geneSymbol, feature);
      if (review.action === 'drop') {
        skipped.push({
          scope: 'feature',
          geneSymbol,
          nbkId,
          fileName: extracted.fileName,
          originalPhenotypeCurie: getFeatureCurie(feature),
          originalPhenotypeLabel: getFeatureLabel(feature),
          reviewMode: review.reviewMode,
          reviewReason: review.reviewReason,
          remapReason: review.remapReason,
          sourceSentence: feature.source_sentence
        });
        continue;
      }

      const finalPresenceStatus = asPresenceStatus(feature.status);
      for (const diseaseCurie of diseaseCuries) {
        reviewedCandidates.push({
          geneSymbol,
          nbkId,
          fileName: extracted.fileName,
          diseaseCurie: normalizeCurie(diseaseCurie),
          originalPhenotypeCurie: getFeatureCurie(feature),
          phenotypeCurie: review.finalCurie,
          originalPhenotypeLabel: getFeatureLabel(feature),
          reviewedPhenotypeLabel: review.finalLabel,
          presenceStatus: finalPresenceStatus,
          extractedFrequency: feature.frequency || null,
          extractedOnset: feature.onset || null,
          confidence: feature.confidence || '',
          sourceSentence: feature.source_sentence || '',
          reviewMode: review.reviewMode,
          reviewReason: review.reviewReason
        });
      }
    }
  }

  const allCuriesToResolve = [
    ...new Set(
      reviewedCandidates.flatMap((entry) => [entry.diseaseCurie, entry.phenotypeCurie].filter(Boolean))
    )
  ];

  const result = await withClient(async (client) => {
    const { rows: dxRows } = await loadDxDiseasePhenotypeRows(client);
    const directDiseasePhenotypes = new Set(
      dxRows
        .filter((row) => (row.phenotype_edge_origin || 'direct') === 'direct')
        .map((row) => `${row.disease_curie}|${row.phenotype_curie}|${row.presence_status || ASSERTION_STATUS.PRESENT}`)
    );

    const resolved = await resolveEntitiesByCurieBatch(client, allCuriesToResolve);
    const entityRows = await loadEntityRows(client, [
      ...resolved.flatMap((row) => [row.matched_curie, row.canonical_curie]),
      ...mappedDiseaseCuries
    ]);

    const entityIdByCurie = new Map();
    const entityByCurie = new Map();
    for (const row of resolved) {
      entityIdByCurie.set(row.matched_curie, row.entity_id);
      entityIdByCurie.set(row.canonical_curie, row.entity_id);
    }
    for (const row of entityRows) {
      entityByCurie.set(row.canonical_curie, row);
      entityIdByCurie.set(row.canonical_curie, row.entity_id);
    }

    const entries = [];
    for (const candidate of reviewedCandidates) {
      const diseaseEntity = entityByCurie.get(candidate.diseaseCurie);

      if (!diseaseEntity) {
        skipped.push({
          scope: 'candidate',
          geneSymbol: candidate.geneSymbol,
          nbkId: candidate.nbkId,
          diseaseCurie: candidate.diseaseCurie,
          phenotypeCurie: candidate.phenotypeCurie,
          reason: 'Mapped disease curie could not be resolved in the staged graph.'
        });
        continue;
      }

      const phenotypeResolution = await resolvePhenotypeEntity(client, candidate, entityByCurie);
      const phenotypeEntity = phenotypeResolution.entity;

      if (!phenotypeEntity) {
        skipped.push({
          scope: 'candidate',
          geneSymbol: candidate.geneSymbol,
          nbkId: candidate.nbkId,
          diseaseCurie: candidate.diseaseCurie,
          originalPhenotypeCurie: candidate.originalPhenotypeCurie,
          phenotypeCurie: candidate.phenotypeCurie,
          originalPhenotypeLabel: candidate.originalPhenotypeLabel,
          reviewedPhenotypeLabel: candidate.reviewedPhenotypeLabel,
          mappingDiagnostics: phenotypeResolution.diagnostics || [],
          reason: 'Reviewed phenotype label could not be grounded safely in the staged graph.'
        });
        continue;
      }

      const presenceStatus = candidate.presenceStatus || ASSERTION_STATUS.PRESENT;
      const existingKey = `${candidate.diseaseCurie}|${candidate.phenotypeCurie}|${presenceStatus}`;
      if (directDiseasePhenotypes.has(existingKey)) {
        skipped.push({
          scope: 'candidate',
          geneSymbol: candidate.geneSymbol,
          nbkId: candidate.nbkId,
          diseaseCurie: candidate.diseaseCurie,
          diseaseLabel: diseaseEntity.canonical_label,
          phenotypeCurie: candidate.phenotypeCurie,
          phenotypeLabel: phenotypeEntity.canonical_label,
          reason: 'Phenotype already exists on the current direct disease surface.'
        });
        continue;
      }

      const frequencyInfo = buildFrequencyInfo(candidate.extractedFrequency);
      const evidenceTag = `genereviews_nlp_${slugify(candidate.nbkId)}`;
      const referenceText = `GeneReviews:${candidate.nbkId}`;
      const benchmarkCaseIds = caseIdsByGene.get(candidate.geneSymbol) || [];

      entries.push({
        geneLabel: candidate.geneSymbol,
        nbkId: candidate.nbkId,
        fileName: candidate.fileName,
        diseaseEntityId: diseaseEntity.entity_id,
        diseaseCurie: diseaseEntity.canonical_curie,
        diseaseLabel: diseaseEntity.canonical_label,
        phenotypeCurie: phenotypeEntity.canonical_curie,
        phenotypeLabel: phenotypeEntity.canonical_label,
        presenceStatus,
        sourceKey: SOURCE_KEY,
        sourceReference: candidate.nbkId,
        referenceText,
        phenotypeEdgeOrigin: 'direct',
        frequency: frequencyInfo.frequency,
        frequencyCurie: frequencyInfo.frequencyCurie,
        frequencyLabel: frequencyInfo.frequencyLabel,
        onset: candidate.extractedOnset,
        side: 'truth-side',
        dateAdded: DEFAULTS.generatedAt,
        evidenceTag,
        sourceRecordKey: `genereviews-nlp:${slugify(candidate.geneSymbol)}:${slugify(candidate.nbkId)}:${slugify(
          diseaseEntity.canonical_curie
        )}:${slugify(phenotypeEntity.canonical_curie)}:${presenceStatus}`,
        provenanceUrl: `https://www.ncbi.nlm.nih.gov/books/${candidate.nbkId}/`,
        benchmarkCaseIds,
        payload: {
          extractedPhenotypeCurie: candidate.originalPhenotypeCurie,
          extractedPhenotypeLabel: candidate.originalPhenotypeLabel,
          reviewedPhenotypeLabel: candidate.reviewedPhenotypeLabel,
          extractedConfidence: candidate.confidence,
          sourceSentence: candidate.sourceSentence,
          reviewMode: candidate.reviewMode,
          reviewReason: candidate.reviewReason,
          mappingMode: phenotypeResolution.mappingMode,
          sourceScopeNote:
            candidate.geneSymbol === 'SMARCC2'
              ? 'GeneReviews chapter is syndrome-level Coffin-Siris syndrome, not SMARCC2-only.'
              : candidate.geneSymbol === 'SETD2'
                ? 'Only reviewed rows judged compatible with the benchmark-relevant Luscan-Lumish branch were kept.'
                : '',
          auditRoleCheck:
            rivalAuditSummary.matchedPriorityRivals.length === 0
              ? 'No priority genes appeared as rival top1 genes in the saved audit JSON set.'
              : rivalAuditSummary.matchedPriorityRivals
        }
      });
    }

    entries.sort((left, right) => {
      return (
        left.geneLabel.localeCompare(right.geneLabel) ||
        left.diseaseCurie.localeCompare(right.diseaseCurie) ||
        left.phenotypeCurie.localeCompare(right.phenotypeCurie)
      );
    });

    return { entries };
  });

  const manifest = {
    createdAt: DEFAULTS.generatedAt,
    sourceKey: SOURCE_KEY,
    sourceDir: grOutputDir,
    priorityGeneListJson,
    benchmarkJson,
    auditOutputDir,
    reviewPolicy: {
      sideRule:
        rivalAuditSummary.matchedPriorityRivals.length === 0
          ? 'No reviewed priority genes appeared as rival top1 genes in the saved audit JSON set, so all manifest rows are truth-side.'
          : 'Priority genes that appear as rivals in saved audit JSONs must be included symmetrically.'
    },
    auditRivalCheck: rivalAuditSummary,
    geneDiseaseMappings: GENE_DISEASE_MAPPINGS,
    entryCount: result.entries.length,
    skippedCount: skipped.length,
    entries: result.entries,
    skipped
  };

  await fs.writeFile(outputJson, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify({
    outputJson,
    entryCount: manifest.entryCount,
    skippedCount: manifest.skippedCount
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
