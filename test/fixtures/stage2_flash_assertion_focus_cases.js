const stage3RealFormatCases = [
  {
    id: 'anc-060__glaucoma',
    category: 'stage2_flash_focus',
    input: {
      label: 'Glaucoma',
      status: 'present',
      source_sentence:
        'Patients with truncating variants develop cataracts, and heterozygous carriers may be at increased risk for glaucoma.',
      section_heading: 'Clinical Description',
      paragraph_id: 'focus_anc_060',
      sentence_id: 'focus_anc_060_s1',
      source: 'flash_anchor_probe'
    },
    expected: {
      outcome: 'rejected',
      origin: 'default_present',
      reason: 'conditional_or_risk_context'
    }
  },
  {
    id: 'anc-063__esrd',
    category: 'stage2_flash_focus',
    input: {
      label: 'End-stage renal disease',
      status: 'present',
      source_sentence:
        'Autosomal dominant polycystic kidney disease accounts for roughly 10% of end-stage renal disease.',
      section_heading: 'Clinical Description',
      paragraph_id: 'focus_anc_063',
      sentence_id: 'focus_anc_063_s1',
      source: 'flash_anchor_probe'
    },
    expected: {
      outcome: 'rejected',
      origin: 'default_present',
      reason: 'conditional_or_risk_context'
    }
  },
  {
    id: 'anc-079__neuropathy',
    category: 'stage2_flash_focus',
    input: {
      label: 'Peripheral neuropathy',
      status: 'present',
      source_sentence:
        'Peripheral neuropathy has been described in isolated cases but is not considered part of the core phenotype.',
      section_heading: 'Clinical Description',
      paragraph_id: 'focus_anc_079',
      sentence_id: 'focus_anc_079_s1',
      source: 'flash_anchor_probe'
    },
    expected: {
      outcome: 'excluded',
      origin: 'sentence_negation_inferred',
      reason: 'explicit_negative_local_context'
    }
  },
  {
    id: 'anc-089__renal_failure',
    category: 'stage2_flash_focus',
    input: {
      label: 'Renal failure',
      status: 'present',
      source_sentence:
        'The role of modifier genes in determining whether affected individuals develop renal failure remains unclear.',
      section_heading: 'Clinical Description',
      paragraph_id: 'focus_anc_089',
      sentence_id: 'focus_anc_089_s1',
      source: 'flash_anchor_probe'
    },
    expected: {
      outcome: 'rejected',
      origin: 'default_present',
      reason: 'conditional_or_risk_context'
    }
  },
  {
    id: 'anc-098__behavioral_difficulties',
    category: 'stage2_flash_focus',
    input: {
      label: 'Behavioral difficulties',
      status: 'present',
      source_sentence:
        'There is no intellectual disability, but behavioral difficulties including attention deficit and impulsivity are common.',
      section_heading: 'Clinical Description',
      paragraph_id: 'focus_anc_098',
      sentence_id: 'focus_anc_098_s1',
      source: 'flash_anchor_probe'
    },
    expected: {
      outcome: 'present',
      origin: 'default_present',
      reason: null
    }
  },
  {
    id: 'anc-098__impulsivity',
    category: 'stage2_flash_focus',
    input: {
      label: 'Impulsivity',
      status: 'present',
      source_sentence:
        'There is no intellectual disability, but behavioral difficulties including attention deficit and impulsivity are common.',
      section_heading: 'Clinical Description',
      paragraph_id: 'focus_anc_098',
      sentence_id: 'focus_anc_098_s1',
      source: 'flash_anchor_probe'
    },
    expected: {
      outcome: 'present',
      origin: 'default_present',
      reason: null
    }
  }
];
