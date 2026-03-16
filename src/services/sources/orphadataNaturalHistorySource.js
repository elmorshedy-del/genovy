import { fetchSourceText } from '../../lib/sourceFetch.js';
import { asArray, parseXmlDocument, pickLangName, xmlText } from '../../lib/xml.js';

const ORPHADATA_TERM_ROLES = Object.freeze({
  average_age_of_onset: {
    listField: 'AverageAgeOfOnsetList',
    itemField: 'AverageAgeOfOnset',
    predicateKey: 'has_average_age_of_onset',
    termEntityType: 'onset',
    curiePrefix: 'ORPHAAGE'
  },
  average_age_of_diagnosis: {
    listField: 'AverageAgeOfDiagnosisList',
    itemField: 'AverageAgeOfDiagnosis',
    predicateKey: 'has_average_age_of_diagnosis',
    termEntityType: 'diagnosis_age',
    curiePrefix: 'ORPHADIAGNOSISAGE'
  },
  average_age_of_death: {
    listField: 'AverageAgeOfDeathList',
    itemField: 'AverageAgeOfDeath',
    predicateKey: 'has_average_age_of_death',
    termEntityType: 'death_age',
    curiePrefix: 'ORPHADEATHAGE'
  },
  inheritance_mode: {
    listField: 'TypeOfInheritanceList',
    itemField: 'TypeOfInheritance',
    predicateKey: 'has_inheritance_mode',
    termEntityType: 'inheritance',
    curiePrefix: 'ORPHAINHERITANCE'
  }
});

function buildDiseaseCurie(orphaCode) {
  return `ORPHA:${orphaCode}`;
}

function buildTermCurie(curiePrefix, rawId) {
  return `${curiePrefix}:${rawId}`;
}

function buildTermRef(roleConfig, item) {
  const rawId = String(item?.['@_id'] || '').trim();
  const label = pickLangName(item);
  if (!rawId || !label) {
    return null;
  }

  return {
    curie: buildTermCurie(roleConfig.curiePrefix, rawId),
    entityType: roleConfig.termEntityType,
    label,
    metadata: {
      orphadataTermId: rawId,
      sourceType: 'orphadata_natural_history_term'
    }
  };
}

export function buildNaturalHistoryTermEntries(disorder) {
  const entries = [];

  for (const [termRole, config] of Object.entries(ORPHADATA_TERM_ROLES)) {
    const values = asArray(disorder?.[config.listField]?.[config.itemField]);
    values.forEach((item, index) => {
      const ref = buildTermRef(config, item);
      if (!ref) {
        return;
      }

      entries.push({
        termRole,
        predicateKey: config.predicateKey,
        ref,
        sortOrder: index
      });
    });
  }

  return entries;
}

export async function fetchOrphadataNaturalHistoryDataset(source) {
  const xmlTextValue = await fetchSourceText(source.accessUrl);
  const parsed = parseXmlDocument(xmlTextValue);
  const disorders = asArray(parsed?.JDBOR?.DisorderList?.Disorder);

  const entities = [];
  const relationships = [];
  const sourceRecords = [];
  const clinicalNaturalHistoryAssertions = [];
  const seenTermCuries = new Set();

  for (const disorder of disorders) {
    const orphaCode = xmlText(disorder?.OrphaCode);
    const diseaseLabel = pickLangName(disorder);
    if (!orphaCode || !diseaseLabel) {
      continue;
    }

    const diseaseCurie = buildDiseaseCurie(orphaCode);
    const sourceRecordKey = `orphadata-natural-history:${diseaseCurie}`;
    const expertLink = xmlText(disorder?.ExpertLink);
    const termEntries = buildNaturalHistoryTermEntries(disorder);

    if (!termEntries.length) {
      continue;
    }

    sourceRecords.push({
      recordType: 'natural_history',
      sourceRecordKey,
      canonicalCurie: diseaseCurie,
      payload: {
        orphaCode,
        diseaseLabel,
        expertLink,
        termCount: termEntries.length
      }
    });

    clinicalNaturalHistoryAssertions.push({
      diseaseRef: {
        curie: diseaseCurie,
        entityType: 'disease',
        label: diseaseLabel,
        isPlaceholder: true,
        metadata: {
          orphaCode
        }
      },
      sourceRecordKey,
      validationStatus: '',
      expertLink,
      sourceText: '',
      provenanceUrl: expertLink || source.homepageUrl,
      termRefs: termEntries.map((entry) => ({
        termRole: entry.termRole,
        termRef: entry.ref,
        sortOrder: entry.sortOrder
      })),
      payload: {
        orphaCode,
        diseaseLabel
      }
    });

    for (const termEntry of termEntries) {
      if (!seenTermCuries.has(termEntry.ref.curie)) {
        seenTermCuries.add(termEntry.ref.curie);
        entities.push({
          entityType: termEntry.ref.entityType,
          canonicalCurie: termEntry.ref.curie,
          canonicalLabel: termEntry.ref.label,
          description: '',
          primarySourceKey: source.sourceKey,
          metadata: termEntry.ref.metadata
        });
      }

      relationships.push({
        predicateKey: termEntry.predicateKey,
        subjectRef: {
          curie: diseaseCurie,
          entityType: 'disease',
          label: diseaseLabel,
          isPlaceholder: true
        },
        objectRef: termEntry.ref,
        qualifiers: {
          orphaCode,
          sourceRecordKey
        },
        evidence: {
          sourceRecordKey,
          evidenceType: 'natural_history_term',
          provenanceUrl: expertLink || source.homepageUrl,
          payload: {
            orphaCode,
            diseaseLabel,
            termRole: termEntry.termRole,
            termLabel: termEntry.ref.label
          }
        }
      });
    }
  }

  return {
    sourceVersion: parsed?.JDBOR?.['@_version'] || '',
    entities,
    aliases: [],
    xrefs: [],
    relationships,
    sourceRecords,
    clinicalNaturalHistoryAssertions,
    summary: {
      naturalHistoryAssertions: clinicalNaturalHistoryAssertions.length
    }
  };
}
