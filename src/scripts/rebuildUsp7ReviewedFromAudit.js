import fs from 'node:fs/promises';

const CHAPTER_DIR =
  '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-usp7-related-hao-fountain-syndrome';
const MANUAL_PATH = `${CHAPTER_DIR}/NBK619577_usp7_related_hao_fountain_syndrome_regime_ready_gpt-5.4-manual.json`;
const REVIEWED_PATH = `${CHAPTER_DIR}/NBK619577_usp7_related_hao_fountain_syndrome_regime_ready_gpt-5.4-manual-opus4.6-reviewed.json`;
const STAGE1_PATH =
  '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-review-first-50-20260331/stage1_fetch/NBK619577_clinical_structure.json';
const RECOVERED_PATH = `${CHAPTER_DIR}/NBK619577_recovered_opus_input.json`;
const AUDIT_PATH = '/Users/ahmedelmorshedy/Downloads/NBK619577_USP7_audit_and_complement.json';

const SURVEILLANCE_SOURCE_IDS = [
  'p70_s1',
  'p71_s1',
  'p72_s1',
  'p73_s1',
  'p74_s1',
  'p75_s1',
  'p76_s1',
  'p77_s1',
  'p78_s1',
  'p79_s1',
  'p80_s1',
  'p81_s1',
  'p82_s1'
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function flattenStructure(structure) {
  const sentenceIndex = [];
  for (const paragraph of structure?.paragraphs || []) {
    for (const sentence of paragraph?.sentences || []) {
      sentenceIndex.push({
        sentence_id: sentence.sentence_id,
        section: sentence.section_heading || paragraph.section_heading || '',
        section_id: sentence.section_id || paragraph.section_id || '',
        paragraph_id: paragraph.paragraph_id,
        text: sentence.text
      });
    }
  }
  return sentenceIndex;
}

function sortSentenceIndex(sentenceIndex) {
  return [...sentenceIndex].sort((left, right) => {
    const [, leftParagraph = '0', leftSentence = '0'] = String(left.sentence_id || '').match(/^p(\d+)_s(\d+)$/) || [];
    const [, rightParagraph = '0', rightSentence = '0'] =
      String(right.sentence_id || '').match(/^p(\d+)_s(\d+)$/) || [];
    return Number(leftParagraph) - Number(rightParagraph) || Number(leftSentence) - Number(rightSentence);
  });
}

function buildSentenceIndexMap(sentenceIndex) {
  return new Map(sentenceIndex.map((entry) => [entry.sentence_id, entry]));
}

function phenotypeTemplate(base) {
  return clone(base.phenotype_assertions[0]?.qualifiers || {});
}

function ancillaryTemplate(base) {
  return clone(base.ancillary_assertions[0]?.qualifiers || {});
}

function getPhenotype(base, id) {
  const row = base.phenotype_assertions.find((entry) => entry.assertion_local_id === id);
  if (!row) throw new Error(`Missing phenotype row ${id}`);
  return row;
}

function getAncillary(base, id) {
  const row = base.ancillary_assertions.find((entry) => entry.ancillary_local_id === id);
  if (!row) throw new Error(`Missing ancillary row ${id}`);
  return row;
}

function getContext(base, id) {
  const row = base.context_assertions.find((entry) => entry.context_local_id === id);
  if (!row) throw new Error(`Missing context row ${id}`);
  return row;
}

function getTrajectory(base, id) {
  const row = base.trajectory_assertions.find((entry) => entry.trajectory_local_id === id);
  if (!row) throw new Error(`Missing trajectory row ${id}`);
  return row;
}

function getChain(base, id) {
  const row = base.causal_chains.find((entry) => entry.causal_chain_local_id === id);
  if (!row) throw new Error(`Missing causal chain ${id}`);
  return row;
}

function getNote(base, id) {
  const row = base.extraction_notes.find((entry) => entry.note_local_id === id);
  if (!row) throw new Error(`Missing note ${id}`);
  return row;
}

function patchPhenotype(base, id, updates) {
  const row = getPhenotype(base, id);
  Object.assign(row, updates);
  if (updates.qualifiers) {
    row.qualifiers = {
      ...phenotypeTemplate(base),
      ...row.qualifiers,
      ...updates.qualifiers
    };
  }
}

function patchAncillary(base, id, updates) {
  const row = getAncillary(base, id);
  Object.assign(row, updates);
  if (updates.qualifiers) {
    row.qualifiers = {
      ...ancillaryTemplate(base),
      ...row.qualifiers,
      ...updates.qualifiers
    };
  }
}

function patchContext(base, id, updates) {
  Object.assign(getContext(base, id), updates);
}

function patchTrajectory(base, id, updates) {
  Object.assign(getTrajectory(base, id), updates);
}

function patchChain(base, id, updates) {
  Object.assign(getChain(base, id), updates);
}

function patchNote(base, id, updates) {
  Object.assign(getNote(base, id), updates);
}

function stripAuditMeta(row) {
  const next = clone(row);
  delete next._audit_note;
  delete next._chapter_source;
  return next;
}

function buildSupplementalSurveillanceRows(manual) {
  const sentenceMap = buildSentenceIndexMap(manual.source_document.sentence_index || []);
  const idMap = new Map();
  const rows = SURVEILLANCE_SOURCE_IDS.map((oldId, index) => {
    const oldEntry = sentenceMap.get(oldId);
    if (!oldEntry) {
      throw new Error(`Missing supplemental surveillance sentence ${oldId}`);
    }
    const paragraphNumber = 109 + index;
    const sentenceId = `p${paragraphNumber}_s1`;
    idMap.set(oldId, sentenceId);
    return {
      sentence_id: sentenceId,
      section: 'Surveillance',
      section_id: 'section_Surveillance',
      paragraph_id: `p${paragraphNumber}`,
      text: oldEntry.text
    };
  });
  return { rows, idMap };
}

function numericPart(id, pattern) {
  return Number(String(id || '').match(pattern)?.[1] || 0);
}

function validateArtifact(data) {
  const sentenceIds = new Set((data.source_document?.sentence_index || []).map((entry) => entry.sentence_id));
  const duplicateSentenceIds = [];
  const seenSentenceIds = new Set();
  for (const entry of data.source_document?.sentence_index || []) {
    if (seenSentenceIds.has(entry.sentence_id)) duplicateSentenceIds.push(entry.sentence_id);
    seenSentenceIds.add(entry.sentence_id);
  }

  const unresolved = [];
  const phenotypeMultiRefs = [];
  const idBuckets = [
    ['phenotype_assertions', 'assertion_local_id'],
    ['ancillary_assertions', 'ancillary_local_id'],
    ['context_assertions', 'context_local_id'],
    ['trajectory_assertions', 'trajectory_local_id'],
    ['causal_chains', 'causal_chain_local_id'],
    ['extraction_notes', 'note_local_id']
  ];
  const seenRowIds = new Set();
  const duplicateRowIds = [];

  for (const [bucket, key] of idBuckets) {
    for (const row of data[bucket] || []) {
      const rowId = row[key];
      if (rowId) {
        if (seenRowIds.has(rowId)) duplicateRowIds.push(rowId);
        seenRowIds.add(rowId);
      }
      for (const sentenceId of row.evidence_sentence_ids || []) {
        if (!sentenceIds.has(sentenceId)) {
          unresolved.push(`${bucket}:${rowId}:${sentenceId}`);
        }
      }
      if (bucket === 'phenotype_assertions' && (row.evidence_sentence_ids || []).length !== 1) {
        phenotypeMultiRefs.push(rowId);
      }
    }
  }

  return {
    duplicateSentenceIds,
    duplicateRowIds,
    unresolved,
    phenotypeMultiRefs
  };
}

function buildCounts(data) {
  return {
    phenotypes: data.phenotype_assertions.length,
    ancillary: data.ancillary_assertions.length,
    context: data.context_assertions.length,
    trajectories: data.trajectory_assertions.length,
    chains: data.causal_chains.length,
    notes: data.extraction_notes.length,
    episodes: data.episode_classes.length,
    triggers: data.trigger_factors.length,
    sentence_index: data.source_document.sentence_index.length
  };
}

async function main() {
  const [manualRaw, stage1Raw, recoveredRaw, auditRaw] = await Promise.all([
    fs.readFile(MANUAL_PATH, 'utf8'),
    fs.readFile(STAGE1_PATH, 'utf8'),
    fs.readFile(RECOVERED_PATH, 'utf8'),
    fs.readFile(AUDIT_PATH, 'utf8')
  ]);

  const manual = JSON.parse(manualRaw);
  const stage1 = JSON.parse(stage1Raw);
  const recovered = JSON.parse(recoveredRaw);
  const audit = JSON.parse(auditRaw);

  const stage1SentenceIndex = flattenStructure(stage1).filter((entry) => {
    const text = String(entry.text || '').trim();
    if (!text) return false;
    if (/^select features of\b/i.test(text)) return false;
    if (/^view in own window$/i.test(text)) return false;
    if (/^based on\b/i.test(text)) return false;
    if (/^(?:[A-Z0-9-]+\s*=\s*[^;]+)(?:;\s*[A-Z0-9-]+\s*=\s*[^;]+)+$/u.test(text)) return false;
    return true;
  });
  const recoveredExtras = (recovered.sentence_index || []).filter(
    (entry) => numericPart(entry.paragraph_id, /^p(\d+)$/) >= 78
  );
  const { rows: surveillanceSupplement, idMap: surveillanceIdMap } = buildSupplementalSurveillanceRows(manual);
  const combinedSentenceIndex = sortSentenceIndex([
    ...stage1SentenceIndex,
    ...recoveredExtras,
    ...surveillanceSupplement
  ]);

  const base = clone(manual);
  base.source_document.sentence_index = combinedSentenceIndex;

  patchPhenotype(base, 'ph_001', {
    evidence_sentence_ids: ['p23_s1'],
    qualifiers: { frequency: null }
  });
  patchPhenotype(base, 'ph_002', {
    evidence_sentence_ids: ['p23_s1'],
    qualifiers: { frequency: null }
  });
  patchPhenotype(base, 'ph_003', { evidence_sentence_ids: ['p31_s1'] });
  patchPhenotype(base, 'ph_004', { evidence_sentence_ids: ['p31_s3'] });
  patchPhenotype(base, 'ph_005', { evidence_sentence_ids: ['p47_s1'] });
  patchPhenotype(base, 'ph_006', { evidence_sentence_ids: ['p49_s1'] });
  patchPhenotype(base, 'ph_007', { evidence_sentence_ids: ['p58_s1'] });
  patchPhenotype(base, 'ph_008', { evidence_sentence_ids: ['p32_s1'] });
  patchPhenotype(base, 'ph_009', { evidence_sentence_ids: ['p45_s1'] });
  patchPhenotype(base, 'ph_010', { evidence_sentence_ids: ['p45_s2'] });
  patchPhenotype(base, 'ph_011', { evidence_sentence_ids: ['p40_s2'] });
  patchPhenotype(base, 'ph_012', { evidence_sentence_ids: ['p33_s1'] });
  patchPhenotype(base, 'ph_013', { evidence_sentence_ids: ['p33_s1'] });
  patchPhenotype(base, 'ph_014', { evidence_sentence_ids: ['p12_s1'] });
  patchPhenotype(base, 'ph_015', { evidence_sentence_ids: ['p52_s1'], clinical_role: 'descriptor' });
  patchPhenotype(base, 'ph_016', { evidence_sentence_ids: ['p53_s1'], clinical_role: 'descriptor' });
  patchPhenotype(base, 'ph_017', { evidence_sentence_ids: ['p54_s1'], clinical_role: 'descriptor' });
  patchPhenotype(base, 'ph_018', { evidence_sentence_ids: ['p55_s2'] });
  patchPhenotype(base, 'ph_019', { evidence_sentence_ids: ['p55_s2'] });
  patchPhenotype(base, 'ph_020', { evidence_sentence_ids: ['p64_s2'] });
  patchPhenotype(base, 'ph_021', { evidence_sentence_ids: ['p61_s1'] });
  patchPhenotype(base, 'ph_022', { evidence_sentence_ids: ['p62_s1'] });
  patchPhenotype(base, 'ph_023', { evidence_sentence_ids: ['p41_s2'] });
  patchPhenotype(base, 'ph_024', {
    evidence_sentence_ids: ['p41_s2'],
    qualifiers: { frequency: '29%' }
  });
  patchPhenotype(base, 'ph_025', { evidence_sentence_ids: ['p46_s3'] });
  patchPhenotype(base, 'ph_026', { evidence_sentence_ids: ['p63_s2'] });
  patchPhenotype(base, 'ph_027', { evidence_sentence_ids: ['p55_s2'] });

  patchAncillary(base, 'anc_001', { evidence_sentence_ids: ['p42_s2'] });
  patchAncillary(base, 'anc_002', { evidence_sentence_ids: ['p42_s3'] });
  patchAncillary(base, 'anc_003', { evidence_sentence_ids: ['p15_s2'] });
  patchAncillary(base, 'anc_004', {
    evidence_sentence_ids: ['p42_s3'],
    finding_raw: 'Thinning of the corpus callosum'
  });
  SURVEILLANCE_SOURCE_IDS.forEach((oldId, index) => {
    const ancillaryId = `anc_${String(index + 5).padStart(3, '0')}`;
    patchAncillary(base, ancillaryId, {
      evidence_sentence_ids: [surveillanceIdMap.get(oldId)]
    });
  });

  patchContext(base, 'ctx_001', { evidence_sentence_ids: ['p18_s1'] });
  patchContext(base, 'ctx_002', {
    evidence_sentence_ids: ['p86_s1'],
    value: 'Autosomal dominant, typically de novo'
  });
  patchContext(base, 'ctx_003', {
    evidence_sentence_ids: ['p17_s4', 'p66_s2'],
    value:
      'Affected individuals exhibit broad variability. None of the features are specific to USP7-related Hao-Fountain syndrome. The condition is static and not considered progressive.'
  });
  patchContext(base, 'ctx_004', { evidence_sentence_ids: ['p80_s1'] });
  patchContext(base, 'ctx_005', { evidence_sentence_ids: ['p80_s2'] });
  patchContext(base, 'ctx_006', { evidence_sentence_ids: ['p88_s1'] });
  patchContext(base, 'ctx_007', { evidence_sentence_ids: ['p89_s1'] });
  patchContext(base, 'ctx_008', { evidence_sentence_ids: ['p95_s1'] });
  patchContext(base, 'ctx_009', { evidence_sentence_ids: ['p96_s2'] });
  patchContext(base, 'ctx_010', { evidence_sentence_ids: ['p94_s1'] });

  patchTrajectory(base, 'traj_001', { evidence_sentence_ids: ['p5_s1', 'p47_s1'] });
  patchTrajectory(base, 'traj_002', {
    evidence_sentence_ids: ['p31_s2', 'p31_s3', 'p59_s1', 'p41_s3'],
    summary:
      'Muscular hypotonia improves with age in the majority of affected individuals, but some severely affected individuals develop hypertonia. Contractures emerge over time, and easy fatigability with increased daytime rest need becomes prominent later in the course.',
    manifestation_labels: [
      'muscular hypotonia',
      'hypertonia',
      'joint contractures',
      'easy fatigability',
      'increased daytime rest need'
    ]
  });

  patchChain(base, 'chain_001', { evidence_sentence_ids: ['p107_s3'] });
  patchChain(base, 'chain_002', { evidence_sentence_ids: ['p107_s6'] });
  patchChain(base, 'chain_003', { evidence_sentence_ids: ['p61_s1', 'p62_s1'] });
  base.mechanism_sentence_ids = ['p107_s1', 'p107_s3', 'p107_s6'];

  patchNote(base, 'note_001', {
    evidence_sentence_ids: ['p12_s1', 'p13_s1', 'p14_s1', 'p15_s1']
  });
  patchNote(base, 'note_002', {
    decision: 'Used the archived fuller clinical fetch plus targeted surveillance-table supplementation.',
    rationale:
      'The archived fuller fetch preserved the chapter’s Table 2 clinical detail, and surveillance table rows were supplemented explicitly so the final artifact could keep quantitative clinical and monitoring detail while remaining internally grounded to its own source_document.',
    evidence_sentence_ids: ['p23_s1', surveillanceIdMap.get('p70_s1')]
  });
  patchNote(base, 'note_003', {
    evidence_sentence_ids: ['p15_s2', 'p42_s2', 'p42_s3']
  });
  patchNote(base, 'note_004', {
    evidence_sentence_ids: ['p45_s2']
  });
  patchNote(base, 'note_005', {
    evidence_sentence_ids: ['p78_s1', 'p78_s2', 'p78_s3', 'p107_s6']
  });
  patchNote(base, 'note_006', {
    evidence_sentence_ids: ['p14_s1', 'p55_s2', 'p55_s3']
  });

  const reviewed = clone(base);
  const phenotypeQualifierDefaults = phenotypeTemplate(reviewed);
  const ancillaryQualifierDefaults = ancillaryTemplate(reviewed);

  const complementPhenotypes = (audit._complement_phenotype_assertions || []).map((row) => {
    const next = stripAuditMeta(row);
    next.qualifiers = { ...phenotypeQualifierDefaults, ...next.qualifiers };
    return next;
  });
  const phenotypeEvidenceMap = new Map([
    ['ph_028', ['p57_s1']],
    ['ph_029', ['p60_s1']],
    ['ph_030', ['p61_s1']],
    ['ph_031', ['p61_s2']],
    ['ph_032', ['p61_s2']],
    ['ph_033', ['p46_s2']],
    ['ph_034', ['p46_s2']],
    ['ph_035', ['p48_s1']],
    ['ph_036', ['p49_s1']],
    ['ph_037', ['p65_s2']],
    ['ph_038', ['p50_s1']],
    ['ph_039', ['p41_s3']],
    ['ph_040', ['p41_s3']],
    ['ph_041', ['p44_s2']]
  ]);
  const phenotypeQualifierOverrides = {
    ph_028: { progression: null },
    ph_030: { subtype_context: null },
    ph_033: { pathophysiology: 'hypothesized to be due to gut motility issues' },
    ph_034: { pathophysiology: 'hypothesized to be due to gut motility issues' },
    ph_035: { subtype_context: 'can lead to increased risk of aspiration' },
    ph_037: { morphology: null, subtype_context: 'no specific facial gestalt' },
    ph_038: { subtype_context: null },
    ph_041: { subtype_context: 'growth restriction in subset' }
  };
  reviewed.phenotype_assertions.push(
    ...complementPhenotypes.map((row) => ({
      ...row,
      evidence_sentence_ids: phenotypeEvidenceMap.get(row.assertion_local_id),
      qualifiers: {
        ...row.qualifiers,
        ...(phenotypeQualifierOverrides[row.assertion_local_id] || {})
      }
    }))
  );

  const complementAncillary = (audit._complement_ancillary_assertions || []).map((row) => {
    const next = stripAuditMeta(row);
    next.qualifiers = { ...ancillaryQualifierDefaults, ...next.qualifiers };
    return next;
  });
  const ancillaryEvidenceMap = new Map([
    ['anc_018', ['p42_s4']],
    ['anc_019', ['p23_s2', 'p24_s1', 'p25_s1', 'p26_s1', 'p27_s1', 'p28_s1']],
    ['anc_020', ['p29_s1', 'p29_s2']]
  ]);
  reviewed.ancillary_assertions.push(
    ...complementAncillary.map((row) => ({
      ...row,
      evidence_sentence_ids: ancillaryEvidenceMap.get(row.ancillary_local_id)
    }))
  );

  const complementContext = (audit._complement_context_assertions || [])
    .map((row) => stripAuditMeta(row))
    .map((row) => {
      if (row.context_local_id === 'ctx_011') {
        return {
          ...row,
          evidence_sentence_ids: ['p66_s2', 'p66_s3', 'p66_s4', 'p66_s5']
        };
      }
      if (row.context_local_id === 'ctx_012') {
        return {
          ...row,
          value:
            'Developmental delay appears universal in reported individuals; however, detailed phenotypic information on heterozygous parents who inherited the variant is not currently available.',
          evidence_sentence_ids: ['p23_s1', 'p89_s2']
        };
      }
      return row;
    });
  reviewed.context_assertions.push(...complementContext);

  const complementChain = stripAuditMeta(audit._complement_causal_chains[0]);
  complementChain.evidence_sentence_ids = ['p66_s5'];
  reviewed.causal_chains.push(complementChain);

  const complementNotes = (audit._complement_extraction_notes || [])
    .filter((row) => row.note_local_id !== 'note_007')
    .map((row) => stripAuditMeta(row))
    .map((row) => {
      const noteEvidenceMap = new Map([
        ['note_008', ['p33_s1', 'p34_s1', 'p35_s1', 'p36_s1', 'p37_s1', 'p38_s1', 'p39_s1']],
        ['note_009', ['p63_s3']],
        ['note_010', ['p64_s3']],
        ['note_011', ['p59_s1']],
        ['note_012', ['p31_s3']],
        ['note_013', ['p44_s3', 'p55_s4']],
        ['note_014', ['p55_s3']]
      ]);
      return {
        ...row,
        evidence_sentence_ids: noteEvidenceMap.get(row.note_local_id) || []
      };
    });
  reviewed.extraction_notes.push(...complementNotes);

  const manualValidation = validateArtifact(base);
  const reviewedValidation = validateArtifact(reviewed);
  if (
    manualValidation.duplicateSentenceIds.length ||
    manualValidation.duplicateRowIds.length ||
    manualValidation.unresolved.length ||
    manualValidation.phenotypeMultiRefs.length
  ) {
    throw new Error(`Manual artifact validation failed: ${JSON.stringify(manualValidation, null, 2)}`);
  }
  if (
    reviewedValidation.duplicateSentenceIds.length ||
    reviewedValidation.duplicateRowIds.length ||
    reviewedValidation.unresolved.length ||
    reviewedValidation.phenotypeMultiRefs.length
  ) {
    throw new Error(`Reviewed artifact validation failed: ${JSON.stringify(reviewedValidation, null, 2)}`);
  }

  await Promise.all([
    fs.writeFile(MANUAL_PATH, `${JSON.stringify(base, null, 2)}\n`),
    fs.writeFile(REVIEWED_PATH, `${JSON.stringify(reviewed, null, 2)}\n`)
  ]);

  console.log(
    JSON.stringify(
      {
        manual_counts: buildCounts(base),
        reviewed_counts: buildCounts(reviewed),
        manual_path: MANUAL_PATH,
        reviewed_path: REVIEWED_PATH
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
