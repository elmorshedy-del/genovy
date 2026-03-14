import { normalizeCurie } from '../../lib/curies.js';
import { HTTP_CONSTANTS } from '../../constants/http.js';

function extractSourceVersion(graph) {
  return (
    graph?.meta?.version ||
    graph?.meta?.basicPropertyValues?.find((item) => item.pred?.includes('version'))?.val ||
    ''
  );
}

export async function fetchHpoOntologyDataset(source) {
  const response = await fetch(source.accessUrl, {
    headers: { 'user-agent': HTTP_CONSTANTS.userAgent }
  });
  if (!response.ok) {
    throw new Error(`HPO ontology fetch failed: ${response.status}`);
  }
  const payload = await response.json();
  const graph = payload.graphs?.[0];
  if (!graph) {
    throw new Error('HPO graph payload missing');
  }

  const entities = [];
  const relationships = [];
  const sourceRecords = [];
  const aliases = [];
  const xrefs = [];

  for (const node of graph.nodes || []) {
    const curie = normalizeCurie(node.id);
    if (!curie.startsWith('HP:')) continue;

    entities.push({
      entityType: 'phenotype',
      canonicalCurie: curie,
      canonicalLabel: node.lbl || curie,
      description: node.meta?.definition?.val || '',
      primarySourceKey: source.sourceKey,
      metadata: {
        comments: node.meta?.comments || [],
        nodeType: node.type || ''
      }
    });

    sourceRecords.push({
      recordType: 'entity',
      sourceRecordKey: `entity:${curie}`,
      canonicalCurie: curie,
      payload: node
    });

    for (const synonym of node.meta?.synonyms || []) {
      if (!synonym?.val) continue;
      aliases.push({
        canonicalCurie: curie,
        aliasLabel: synonym.val,
        aliasType: synonym.pred || 'synonym',
        sourceKey: source.sourceKey
      });
    }

    for (const xref of node.meta?.xrefs || []) {
      if (!xref?.val) continue;
      xrefs.push({
        canonicalCurie: curie,
        xrefCurie: xref.val,
        xrefType: 'cross_reference',
        sourceKey: source.sourceKey
      });
    }
  }

  for (const edge of graph.edges || []) {
    const subjectCurie = normalizeCurie(edge.sub);
    const objectCurie = normalizeCurie(edge.obj);
    if (!subjectCurie.startsWith('HP:') || !objectCurie.startsWith('HP:')) continue;
    if (edge.pred !== 'is_a') continue;

    const sourceRecordKey = `edge:${subjectCurie}:${edge.pred}:${objectCurie}`;
    relationships.push({
      predicateKey: 'is_a',
      subjectRef: { curie: subjectCurie, entityType: 'phenotype', label: subjectCurie },
      objectRef: { curie: objectCurie, entityType: 'phenotype', label: objectCurie },
      qualifiers: {},
      evidence: {
        sourceRecordKey,
        evidenceType: 'ontology_edge',
        provenanceUrl: source.homepageUrl,
        payload: edge
      }
    });
    sourceRecords.push({
      recordType: 'relationship',
      sourceRecordKey,
      canonicalCurie: subjectCurie,
      payload: edge
    });
  }

  return {
    sourceVersion: extractSourceVersion(graph),
    entities,
    aliases,
    xrefs,
    relationships,
    sourceRecords
  };
}
