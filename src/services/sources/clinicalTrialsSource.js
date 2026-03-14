import { HTTP_CONSTANTS } from '../../constants/http.js';

function trialEntityFromStudy(study, sourceKey) {
  const identification = study.protocolSection?.identificationModule || {};
  const statusModule = study.protocolSection?.statusModule || {};
  const descriptionModule = study.protocolSection?.descriptionModule || {};
  const nctId = identification.nctId;
  return {
    entityType: 'trial',
    canonicalCurie: `NCT:${nctId}`,
    canonicalLabel: identification.officialTitle || identification.briefTitle || nctId,
    description: descriptionModule.briefSummary || '',
    primarySourceKey: sourceKey,
    metadata: {
      overallStatus: statusModule.overallStatus || '',
      studyType: study.protocolSection?.designModule?.studyType || '',
      phaseList: study.protocolSection?.designModule?.phases || [],
      conditions: study.protocolSection?.conditionsModule?.conditions || []
    }
  };
}

export async function fetchClinicalTrialsDataset(source, options = {}) {
  const conditionQuery = String(options.conditionQuery || '').trim();
  if (!conditionQuery) {
    throw new Error('clinical_trials sync requires conditionQuery');
  }

  const pageSize = Math.max(1, Math.min(100, Number(options.pageSize) || 100));
  const maxPages = Math.max(1, Math.min(50, Number(options.maxPages) || 10));
  const entities = [];
  const relationships = [];
  const sourceRecords = [];
  const seenTrials = new Set();
  let pageToken = '';
  let pageCount = 0;

  while (pageCount < maxPages) {
    const url = new URL(source.accessUrl);
    url.searchParams.set('query.cond', conditionQuery);
    url.searchParams.set('pageSize', String(pageSize));
    if (pageToken) {
      url.searchParams.set('pageToken', pageToken);
    }

    const response = await fetch(url, {
      headers: {
        'user-agent': HTTP_CONSTANTS.userAgent,
        accept: HTTP_CONSTANTS.jsonMimeType
      }
    });
    if (!response.ok) {
      throw new Error(`ClinicalTrials fetch failed: ${response.status}`);
    }
    const payload = await response.json();
    const studies = payload.studies || [];

    for (const study of studies) {
      const nctId = study.protocolSection?.identificationModule?.nctId;
      if (!nctId || seenTrials.has(nctId)) continue;
      seenTrials.add(nctId);
      const trialCurie = `NCT:${nctId}`;
      const sourceRecordKey = `trial:${nctId}`;
      entities.push(trialEntityFromStudy(study, source.sourceKey));
      sourceRecords.push({
        recordType: 'trial',
        sourceRecordKey,
        canonicalCurie: trialCurie,
        payload: study
      });

      for (const condition of study.protocolSection?.conditionsModule?.conditions || []) {
        const relationshipRecordKey = `trial-condition:${nctId}:${condition}`;
        relationships.push({
          predicateKey: 'recruits_for_disease',
          subjectRef: {
            curie: trialCurie,
            entityType: 'trial',
            label: nctId
          },
          objectRef: {
            entityType: 'disease',
            label: condition,
            isPlaceholder: true,
            metadata: {
              sourceCondition: condition
            }
          },
          qualifiers: {
            overallStatus: study.protocolSection?.statusModule?.overallStatus || '',
            recruitmentStatus: study.protocolSection?.statusModule?.statusVerifiedDate || '',
            conditionQuery
          },
          evidence: {
            sourceRecordKey: relationshipRecordKey,
            evidenceType: 'trial_condition_match',
            provenanceUrl: `https://clinicaltrials.gov/study/${nctId}`,
            payload: {
              nctId,
              condition,
              conditionQuery
            }
          }
        });
        sourceRecords.push({
          recordType: 'trial_condition',
          sourceRecordKey: relationshipRecordKey,
          canonicalCurie: trialCurie,
          payload: {
            nctId,
            condition,
            conditionQuery
          }
        });
      }
    }

    pageCount += 1;
    pageToken = payload.nextPageToken || '';
    if (!pageToken) break;
  }

  return {
    sourceVersion: '',
    entities,
    aliases: [],
    xrefs: [],
    relationships,
    sourceRecords,
    summary: {
      conditionQuery,
      pagesFetched: pageCount,
      studiesFetched: entities.length
    }
  };
}
