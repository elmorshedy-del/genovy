export const SOURCE_KEYS = Object.freeze({
  MONDO_ONTOLOGY: 'mondo_ontology',
  HPO_ONTOLOGY: 'hpo_ontology',
  HPO_DISEASE_PHENOTYPE: 'hpo_disease_phenotype',
  HPO_DISEASE_PHENOTYPE_NEGATIVE: 'hpo_disease_phenotype_negative',
  ORPHADATA_PHENOTYPES: 'orphadata_phenotypes',
  ORPHADATA_HOOM: 'orphadata_hoom',
  ORPHADATA_NATURAL_HISTORY: 'orphadata_natural_history',
  PRIMEKG: 'primekg',
  HPO_GENE_DISEASE: 'hpo_gene_disease',
  HPO_GENE_PHENOTYPE: 'hpo_gene_phenotype',
  PHENOTYPE_PROPAGATION: 'phenotype_propagation',
  GENE_IDENTITY_REPAIR: 'gene_identity_repair',
  CLINGEN_GENE_DISEASE_VALIDITY: 'clingen_gene_disease_validity',
  CLINVAR_GENE_DISEASE: 'clinvar_gene_disease',
  CLINVAR_VARIANT_SUMMARY: 'clinvar_variant_summary',
  CLINICAL_TRIALS: 'clinical_trials'
});

export const BOOTSTRAP_SOURCE_ORDER = Object.freeze([
  SOURCE_KEYS.MONDO_ONTOLOGY,
  SOURCE_KEYS.HPO_ONTOLOGY,
  SOURCE_KEYS.HPO_DISEASE_PHENOTYPE,
  SOURCE_KEYS.ORPHADATA_NATURAL_HISTORY,
  SOURCE_KEYS.HPO_GENE_DISEASE,
  SOURCE_KEYS.HPO_GENE_PHENOTYPE,
  SOURCE_KEYS.CLINGEN_GENE_DISEASE_VALIDITY,
  SOURCE_KEYS.CLINVAR_GENE_DISEASE
]);

export const SOURCE_CATALOG = Object.freeze({
  [SOURCE_KEYS.MONDO_ONTOLOGY]: {
    sourceKey: SOURCE_KEYS.MONDO_ONTOLOGY,
    displayName: 'MONDO Ontology',
    description: 'Unified disease ontology backbone.',
    homepageUrl: 'https://mondo.monarchinitiative.org/',
    accessUrl: 'https://github.com/monarch-initiative/mondo/releases/latest/download/mondo.json',
    updateFrequency: 'release-based',
    entityScope: 'disease'
  },
  [SOURCE_KEYS.HPO_ONTOLOGY]: {
    sourceKey: SOURCE_KEYS.HPO_ONTOLOGY,
    displayName: 'Human Phenotype Ontology',
    description: 'Phenotype ontology backbone.',
    homepageUrl: 'https://hpo.jax.org/',
    accessUrl: 'https://github.com/obophenotype/human-phenotype-ontology/releases/latest/download/hp.json',
    updateFrequency: 'release-based',
    entityScope: 'phenotype'
  },
  [SOURCE_KEYS.HPO_DISEASE_PHENOTYPE]: {
    sourceKey: SOURCE_KEYS.HPO_DISEASE_PHENOTYPE,
    displayName: 'HPO Disease Phenotype Annotations',
    description: 'Disease-to-phenotype annotations from HPO.',
    homepageUrl: 'https://hpo.jax.org/',
    accessUrl: 'https://github.com/obophenotype/human-phenotype-ontology/releases/latest/download/phenotype.hpoa',
    updateFrequency: 'release-based',
    entityScope: 'disease,phenotype'
  },
  [SOURCE_KEYS.HPO_DISEASE_PHENOTYPE_NEGATIVE]: {
    sourceKey: SOURCE_KEYS.HPO_DISEASE_PHENOTYPE_NEGATIVE,
    displayName: 'HPO Disease Negative Phenotype Annotations',
    description: 'Disease-to-phenotype negative assertions from HPO phenotype.hpoa NOT rows.',
    homepageUrl: 'https://human-phenotype-ontology.github.io/downloads.html',
    accessUrl: 'https://github.com/obophenotype/human-phenotype-ontology/releases/latest/download/phenotype.hpoa',
    updateFrequency: 'release-based',
    entityScope: 'disease,phenotype'
  },
  [SOURCE_KEYS.ORPHADATA_PHENOTYPES]: {
    sourceKey: SOURCE_KEYS.ORPHADATA_PHENOTYPES,
    displayName: 'Orphadata Phenotypes',
    description: 'Orphanet disease-to-HPO phenotype assertions from Product 4 XML.',
    homepageUrl: 'https://sciences.orphadata.com/phenotypes/',
    accessUrl: 'https://www.orphadata.com/data/xml/en_product4.xml',
    updateFrequency: 'bi-annual',
    entityScope: 'disease,phenotype'
  },
  [SOURCE_KEYS.ORPHADATA_HOOM]: {
    sourceKey: SOURCE_KEYS.ORPHADATA_HOOM,
    displayName: 'Orphadata HOOM',
    description:
      'Orphanet HOOM phenotype-frequency ontology. Uses the latest live archive available on import day; the 2.5 landing-page link returned 404 on 2026-03-28, so 2.4 is pinned here until upstream restores the newer file.',
    homepageUrl: 'https://sciences.orphadata.com/hoom/',
    accessUrl: 'https://www.orphadata.com/data/ontologies/hoom/hoom_orphanet_2.4.zip',
    updateFrequency: 'release-based',
    entityScope: 'disease,phenotype,frequency'
  },
  [SOURCE_KEYS.ORPHADATA_NATURAL_HISTORY]: {
    sourceKey: SOURCE_KEYS.ORPHADATA_NATURAL_HISTORY,
    displayName: 'Orphadata Natural History',
    description: 'Orphadata rare-disease onset and inheritance natural history terms.',
    homepageUrl: 'https://sciences.orphadata.com/orphanet-scientific-knowledge-files/',
    accessUrl: 'https://www.orphadata.com/data/xml/en_product9_ages.xml',
    updateFrequency: 'bi-annual',
    entityScope: 'disease,onset,inheritance'
  },
  [SOURCE_KEYS.PRIMEKG]: {
    sourceKey: SOURCE_KEYS.PRIMEKG,
    displayName: 'PrimeKG',
    description: 'Integrated disease-to-phenotype assertions from the Harvard PrimeKG CSV.',
    homepageUrl: 'https://doi.org/10.7910/DVN/IXA7BM',
    accessUrl: 'https://dataverse.harvard.edu/api/access/datafile/6180620',
    updateFrequency: 'release-based',
    entityScope: 'disease,phenotype'
  },
  [SOURCE_KEYS.HPO_GENE_DISEASE]: {
    sourceKey: SOURCE_KEYS.HPO_GENE_DISEASE,
    displayName: 'HPO Gene Disease Links',
    description: 'Gene-to-disease associations from HPO.',
    homepageUrl: 'https://hpo.jax.org/',
    accessUrl: 'https://github.com/obophenotype/human-phenotype-ontology/releases/latest/download/genes_to_disease.txt',
    updateFrequency: 'release-based',
    entityScope: 'gene,disease'
  },
  [SOURCE_KEYS.HPO_GENE_PHENOTYPE]: {
    sourceKey: SOURCE_KEYS.HPO_GENE_PHENOTYPE,
    displayName: 'HPO Gene Phenotype Links',
    description: 'Gene-to-phenotype associations from HPO.',
    homepageUrl: 'https://hpo.jax.org/',
    accessUrl: 'https://github.com/obophenotype/human-phenotype-ontology/releases/latest/download/genes_to_phenotype.txt',
    updateFrequency: 'release-based',
    entityScope: 'gene,phenotype'
  },
  [SOURCE_KEYS.PHENOTYPE_PROPAGATION]: {
    sourceKey: SOURCE_KEYS.PHENOTYPE_PROPAGATION,
    displayName: 'Phenotype Propagation Maintenance',
    description: 'Derived disease phenotype assertions propagated from xrefs, disease hierarchy, or linked genes.',
    homepageUrl: 'https://genovy.railway.app/',
    accessUrl: '',
    updateFrequency: 'manual',
    entityScope: 'disease,phenotype,gene'
  },
  [SOURCE_KEYS.GENE_IDENTITY_REPAIR]: {
    sourceKey: SOURCE_KEYS.GENE_IDENTITY_REPAIR,
    displayName: 'Gene Identity Repair Maintenance',
    description: 'Manual repair workflow for missing or canonically-broken gene identities.',
    homepageUrl: 'https://genovy.railway.app/',
    accessUrl: '',
    updateFrequency: 'manual',
    entityScope: 'gene'
  },
  [SOURCE_KEYS.CLINGEN_GENE_DISEASE_VALIDITY]: {
    sourceKey: SOURCE_KEYS.CLINGEN_GENE_DISEASE_VALIDITY,
    displayName: 'ClinGen Gene-Disease Validity',
    description: 'ClinGen curated gene-disease validity assertions with MONDO and HGNC identifiers.',
    homepageUrl: 'https://www.clinicalgenome.org/curation-activities/gene-disease-validity/',
    accessUrl: 'https://search.clinicalgenome.org/kb/gene-validity/download',
    updateFrequency: 'real-time csv',
    entityScope: 'gene,disease'
  },
  [SOURCE_KEYS.CLINVAR_GENE_DISEASE]: {
    sourceKey: SOURCE_KEYS.CLINVAR_GENE_DISEASE,
    displayName: 'ClinVar Gene Condition Links',
    description: 'ClinVar gene-to-condition links.',
    homepageUrl: 'https://www.ncbi.nlm.nih.gov/clinvar/',
    accessUrl: 'https://ftp.ncbi.nlm.nih.gov/pub/clinvar/gene_condition_source_id',
    updateFrequency: 'daily',
    entityScope: 'gene,disease'
  },
  [SOURCE_KEYS.CLINVAR_VARIANT_SUMMARY]: {
    sourceKey: SOURCE_KEYS.CLINVAR_VARIANT_SUMMARY,
    displayName: 'ClinVar Variant Summary',
    description: 'ClinVar variant-to-condition assertions and review metadata.',
    homepageUrl: 'https://www.ncbi.nlm.nih.gov/clinvar/docs/maintenance_use/',
    accessUrl: 'https://ftp.ncbi.nlm.nih.gov/pub/clinvar/tab_delimited/variant_summary.txt.gz',
    updateFrequency: 'weekly',
    entityScope: 'variant,gene,disease'
  },
  [SOURCE_KEYS.CLINICAL_TRIALS]: {
    sourceKey: SOURCE_KEYS.CLINICAL_TRIALS,
    displayName: 'ClinicalTrials.gov',
    description: 'Condition-to-trial recruitment data.',
    homepageUrl: 'https://clinicaltrials.gov/data-api/api',
    accessUrl: 'https://clinicaltrials.gov/api/v2/studies',
    updateFrequency: 'api-driven',
    entityScope: 'trial,disease'
  }
});
