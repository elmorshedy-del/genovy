export const SOURCE_KEYS = Object.freeze({
  MONDO_ONTOLOGY: 'mondo_ontology',
  HPO_ONTOLOGY: 'hpo_ontology',
  HPO_DISEASE_PHENOTYPE: 'hpo_disease_phenotype',
  HPO_GENE_DISEASE: 'hpo_gene_disease',
  HPO_GENE_PHENOTYPE: 'hpo_gene_phenotype',
  CLINVAR_GENE_DISEASE: 'clinvar_gene_disease',
  CLINICAL_TRIALS: 'clinical_trials'
});

export const BOOTSTRAP_SOURCE_ORDER = Object.freeze([
  SOURCE_KEYS.MONDO_ONTOLOGY,
  SOURCE_KEYS.HPO_ONTOLOGY,
  SOURCE_KEYS.HPO_DISEASE_PHENOTYPE,
  SOURCE_KEYS.HPO_GENE_DISEASE,
  SOURCE_KEYS.HPO_GENE_PHENOTYPE,
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
  [SOURCE_KEYS.CLINVAR_GENE_DISEASE]: {
    sourceKey: SOURCE_KEYS.CLINVAR_GENE_DISEASE,
    displayName: 'ClinVar Gene Condition Links',
    description: 'ClinVar gene-to-condition links.',
    homepageUrl: 'https://www.ncbi.nlm.nih.gov/clinvar/',
    accessUrl: 'https://ftp.ncbi.nlm.nih.gov/pub/clinvar/gene_condition_source_id',
    updateFrequency: 'daily',
    entityScope: 'gene,disease'
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
