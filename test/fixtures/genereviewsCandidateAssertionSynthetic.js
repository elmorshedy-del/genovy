const EXPECTED_SYNTHETIC_ASSERTION_CASE_COUNT = 100;

function makeCase(id, category, label, sentence, expectedOutcome, overrides = {}) {
  return {
    id,
    category,
    label,
    sentence,
    modelStatus: 'present',
    expectedOutcome,
    expectedOrigin: 'default_present',
    expectedReason: null,
    ...overrides
  };
}

const NEGATION_TO_EXCLUDED_CASES = [
  makeCase(
    'neg-001',
    'negation_to_excluded',
    'Seizures',
    'Seizures are not typically present in affected individuals.',
    'excluded',
    {
      expectedOrigin: 'sentence_negation_inferred',
      expectedReason: 'explicit_negative_local_context'
    }
  ),
  makeCase('neg-002', 'negation_to_excluded', 'Ataxia', 'Ataxia was not observed in this cohort.', 'excluded', {
    expectedOrigin: 'sentence_negation_inferred',
    expectedReason: 'explicit_negative_local_context'
  }),
  makeCase(
    'neg-003',
    'negation_to_excluded',
    'Dystonia',
    'Dystonia is usually absent, even in adulthood.',
    'excluded',
    {
      expectedOrigin: 'sentence_negation_inferred',
      expectedReason: 'explicit_negative_local_context'
    }
  ),
  makeCase(
    'neg-004',
    'negation_to_excluded',
    'cataracts',
    'No cataracts have been reported in affected children.',
    'excluded',
    {
      expectedOrigin: 'sentence_negation_inferred',
      expectedReason: 'explicit_negative_local_context'
    }
  ),
  makeCase(
    'neg-005',
    'negation_to_excluded',
    'hearing loss',
    'Without hearing loss, language development is better preserved.',
    'excluded',
    {
      expectedOrigin: 'sentence_negation_inferred',
      expectedReason: 'explicit_negative_local_context'
    }
  ),
  makeCase(
    'neg-006',
    'negation_to_excluded',
    'Ptosis',
    'Ptosis was not seen in any examined relative.',
    'excluded',
    {
      expectedOrigin: 'sentence_negation_inferred',
      expectedReason: 'explicit_negative_local_context'
    }
  ),
  makeCase(
    'neg-007',
    'negation_to_excluded',
    'Macrocephaly',
    'Macrocephaly has not been reported in this disorder.',
    'excluded',
    {
      expectedOrigin: 'sentence_negation_inferred',
      expectedReason: 'explicit_negative_local_context'
    }
  ),
  makeCase(
    'neg-008',
    'negation_to_excluded',
    'Neuropathy',
    'Neuropathy remains absent in infancy.',
    'excluded',
    {
      expectedOrigin: 'sentence_negation_inferred',
      expectedReason: 'explicit_negative_local_context'
    }
  ),
  makeCase(
    'neg-009',
    'negation_to_excluded',
    'Epilepsy',
    'Epilepsy is rarely present in this syndrome.',
    'excluded',
    {
      expectedOrigin: 'sentence_negation_inferred',
      expectedReason: 'explicit_negative_local_context'
    }
  ),
  makeCase(
    'neg-010',
    'negation_to_excluded',
    'Hypotonia',
    'Hypotonia is not present at birth.',
    'excluded',
    {
      expectedOrigin: 'sentence_negation_inferred',
      expectedReason: 'explicit_negative_local_context'
    }
  ),
  makeCase(
    'neg-011',
    'negation_to_excluded',
    'Contractures',
    'Contractures are typically absent in early childhood.',
    'excluded',
    {
      expectedOrigin: 'sentence_negation_inferred',
      expectedReason: 'explicit_negative_local_context'
    }
  ),
  makeCase(
    'neg-012',
    'negation_to_excluded',
    'scoliosis',
    'Patients are free of scoliosis during adolescence.',
    'excluded',
    {
      expectedOrigin: 'sentence_negation_inferred',
      expectedReason: 'explicit_negative_local_context'
    }
  ),
  makeCase(
    'neg-013',
    'negation_to_excluded',
    'tremor',
    'Lacking tremor, gait remained otherwise stable.',
    'excluded',
    {
      expectedOrigin: 'sentence_negation_inferred',
      expectedReason: 'explicit_negative_local_context'
    }
  ),
  makeCase(
    'neg-014',
    'negation_to_excluded',
    'myopathy',
    'The cohort was without myopathy in early infancy.',
    'excluded',
    {
      expectedOrigin: 'sentence_negation_inferred',
      expectedReason: 'explicit_negative_local_context'
    }
  ),
  makeCase(
    'neg-015',
    'negation_to_excluded',
    'apnea',
    'Absence of apnea was specifically noted in newborns.',
    'excluded',
    {
      expectedOrigin: 'sentence_negation_inferred',
      expectedReason: 'explicit_negative_local_context'
    }
  ),
  makeCase(
    'neg-016',
    'negation_to_excluded',
    'hearing impairment',
    'Hearing impairment is not reported in most families.',
    'excluded',
    {
      expectedOrigin: 'sentence_negation_inferred',
      expectedReason: 'explicit_negative_local_context'
    }
  ),
  makeCase(
    'neg-017',
    'negation_to_excluded',
    'cardiomyopathy',
    'Cardiomyopathy was not observed despite long follow-up.',
    'excluded',
    {
      expectedOrigin: 'sentence_negation_inferred',
      expectedReason: 'explicit_negative_local_context'
    }
  ),
  makeCase(
    'neg-018',
    'negation_to_excluded',
    'renal cysts',
    'Renal cysts are not seen on serial imaging.',
    'excluded',
    {
      expectedOrigin: 'sentence_negation_inferred',
      expectedReason: 'explicit_negative_local_context'
    }
  ),
  makeCase(
    'neg-019',
    'negation_to_excluded',
    'Psychosis',
    'Psychosis is usually absent in adolescence.',
    'excluded',
    {
      expectedOrigin: 'sentence_negation_inferred',
      expectedReason: 'explicit_negative_local_context'
    }
  ),
  makeCase(
    'neg-020',
    'negation_to_excluded',
    'liver dysfunction',
    'No liver dysfunction has been observed to date.',
    'excluded',
    {
      expectedOrigin: 'sentence_negation_inferred',
      expectedReason: 'explicit_negative_local_context'
    }
  )
];

const NORMAL_OR_PRESERVED_REJECTED_CASES = [
  makeCase('norm-001', 'normal_or_preserved_rejected', 'Cognitive function', 'Cognitive function is usually preserved.', 'rejected', {
    expectedReason: 'normal_or_preserved_context'
  }),
  makeCase('norm-002', 'normal_or_preserved_rejected', 'Vision', 'Vision remains normal in most adults.', 'rejected', {
    expectedReason: 'normal_or_preserved_context'
  }),
  makeCase('norm-003', 'normal_or_preserved_rejected', 'Hearing', 'Hearing is generally intact.', 'rejected', {
    expectedReason: 'normal_or_preserved_context'
  }),
  makeCase('norm-004', 'normal_or_preserved_rejected', 'Renal function', 'Renal function is typically unaffected.', 'rejected', {
    expectedReason: 'normal_or_preserved_context'
  }),
  makeCase('norm-005', 'normal_or_preserved_rejected', 'Muscle strength', 'Muscle strength is normal throughout childhood.', 'rejected', {
    expectedReason: 'normal_or_preserved_context'
  }),
  makeCase('norm-006', 'normal_or_preserved_rejected', 'Growth', 'Growth is usually normal after infancy.', 'rejected', {
    expectedReason: 'normal_or_preserved_context'
  }),
  makeCase('norm-007', 'normal_or_preserved_rejected', 'Speech', 'Speech is preserved in adolescence.', 'rejected', {
    expectedReason: 'normal_or_preserved_context'
  }),
  makeCase('norm-008', 'normal_or_preserved_rejected', 'Motor development', 'Motor development remains intact after early delay.', 'rejected', {
    expectedReason: 'normal_or_preserved_context'
  }),
  makeCase('norm-009', 'normal_or_preserved_rejected', 'Cardiac structure', 'Cardiac structure is generally normal on echocardiography.', 'rejected', {
    expectedReason: 'normal_or_preserved_context'
  }),
  makeCase('norm-010', 'normal_or_preserved_rejected', 'Liver function', 'Liver function is unaffected in mild cases.', 'rejected', {
    expectedReason: 'normal_or_preserved_context'
  }),
  makeCase('norm-011', 'normal_or_preserved_rejected', 'Intellect', 'Intellect is typically normal in heterozygous relatives.', 'rejected', {
    expectedReason: 'normal_or_preserved_context'
  }),
  makeCase('norm-012', 'normal_or_preserved_rejected', 'Respiration', 'Respiration remains normal during sleep.', 'rejected', {
    expectedReason: 'normal_or_preserved_context'
  }),
  makeCase('norm-013', 'normal_or_preserved_rejected', 'Puberty', 'Puberty is usually normal in females.', 'rejected', {
    expectedReason: 'normal_or_preserved_context'
  }),
  makeCase('norm-014', 'normal_or_preserved_rejected', 'Immune function', 'Immune function is preserved despite low counts.', 'rejected', {
    expectedReason: 'normal_or_preserved_context'
  }),
  makeCase('norm-015', 'normal_or_preserved_rejected', 'Gait', 'Gait is generally unaffected between episodes.', 'rejected', {
    expectedReason: 'normal_or_preserved_context'
  })
];

const CONDITIONAL_REJECTED_CASES = [
  makeCase('cond-001', 'conditional_or_risk_rejected', 'Seizures', 'Seizures may worsen if untreated.', 'rejected', {
    expectedReason: 'conditional_or_risk_context'
  }),
  makeCase('cond-002', 'conditional_or_risk_rejected', 'cardiomyopathy', 'Patients are at risk for cardiomyopathy in adulthood.', 'rejected', {
    expectedReason: 'conditional_or_risk_context'
  }),
  makeCase('cond-003', 'conditional_or_risk_rejected', 'ulceration', 'Neuropathy creates risk of ulceration in the feet.', 'rejected', {
    expectedReason: 'conditional_or_risk_context'
  }),
  makeCase('cond-004', 'conditional_or_risk_rejected', 'osteoporosis', 'Individuals have a predisposition to osteoporosis later in life.', 'rejected', {
    expectedReason: 'conditional_or_risk_context'
  }),
  makeCase('cond-005', 'conditional_or_risk_rejected', 'arrhythmia', 'Adolescents remain at risk for arrhythmia during fever.', 'rejected', {
    expectedReason: 'conditional_or_risk_context'
  }),
  makeCase('cond-006', 'conditional_or_risk_rejected', 'kidney stones', 'There is a predisposition to kidney stones in adults.', 'rejected', {
    expectedReason: 'conditional_or_risk_context'
  }),
  makeCase('cond-007', 'conditional_or_risk_rejected', 'stroke', 'Risk of stroke is increased after dehydration.', 'rejected', {
    expectedReason: 'conditional_or_risk_context'
  }),
  makeCase('cond-008', 'conditional_or_risk_rejected', 'aspiration', 'Children are at risk for aspiration during infections.', 'rejected', {
    expectedReason: 'conditional_or_risk_context'
  }),
  makeCase('cond-009', 'conditional_or_risk_rejected', 'psychosis', 'Teenagers may be at risk of psychosis under stress.', 'rejected', {
    expectedReason: 'conditional_or_risk_context'
  }),
  makeCase('cond-010', 'conditional_or_risk_rejected', 'scoliosis', 'Predisposition to scoliosis has been suggested in some families.', 'rejected', {
    expectedReason: 'conditional_or_risk_context'
  }),
  makeCase('cond-011', 'conditional_or_risk_rejected', 'melanoma', 'Adults remain at risk for melanoma on sun-exposed skin.', 'rejected', {
    expectedReason: 'conditional_or_risk_context'
  }),
  makeCase('cond-012', 'conditional_or_risk_rejected', 'fractures', 'Patients have risk of fractures after minor trauma.', 'rejected', {
    expectedReason: 'conditional_or_risk_context'
  }),
  makeCase('cond-013', 'conditional_or_risk_rejected', 'adrenal crisis', 'At risk for adrenal crisis, infants require emergency plans.', 'rejected', {
    expectedReason: 'conditional_or_risk_context'
  }),
  makeCase('cond-014', 'conditional_or_risk_rejected', 'thrombosis', 'There is a risk of thrombosis during prolonged immobilization.', 'rejected', {
    expectedReason: 'conditional_or_risk_context'
  }),
  makeCase('cond-015', 'conditional_or_risk_rejected', 'diabetes', 'A predisposition to diabetes has been reported in adulthood.', 'rejected', {
    expectedReason: 'conditional_or_risk_context'
  })
];

const ABNORMAL_ABSENCE_PRESENT_CASES = [
  makeCase('abs-001', 'abnormal_absence_present', 'Absence of speech', 'Absence of speech is common in affected individuals.', 'present'),
  makeCase('abs-002', 'abnormal_absence_present', 'Absence of tears', 'Absence of tears is reported in infancy.', 'present'),
  makeCase('abs-003', 'abnormal_absence_present', 'Lack of expressive language', 'Lack of expressive language is a striking feature.', 'present'),
  makeCase('abs-004', 'abnormal_absence_present', 'Loss of independent ambulation', 'Loss of independent ambulation occurs in adolescence.', 'present'),
  makeCase('abs-005', 'abnormal_absence_present', 'Absence of puberty', 'Absence of puberty has been observed in several patients.', 'present'),
  makeCase('abs-006', 'abnormal_absence_present', 'Lack of eye contact', 'Lack of eye contact is prominent in early childhood.', 'present'),
  makeCase('abs-007', 'abnormal_absence_present', 'Loss of pain sensation', 'Loss of pain sensation develops over time.', 'present'),
  makeCase('abs-008', 'abnormal_absence_present', 'Absence of bladder control', 'Absence of bladder control is common beyond age five.', 'present'),
  makeCase('abs-009', 'abnormal_absence_present', 'Lack of social reciprocity', 'Lack of social reciprocity is frequently reported.', 'present'),
  makeCase('abs-010', 'abnormal_absence_present', 'Loss of peripheral vision', 'Loss of peripheral vision may occur in adolescence.', 'present'),
  makeCase('abs-011', 'abnormal_absence_present', 'Absence of deep tendon reflexes', 'Absence of deep tendon reflexes is common on examination.', 'present'),
  makeCase('abs-012', 'abnormal_absence_present', 'Lack of sweating', 'Lack of sweating is reported during febrile illness.', 'present'),
  makeCase('abs-013', 'abnormal_absence_present', 'Loss of previously acquired words', 'Loss of previously acquired words follows regression episodes.', 'present'),
  makeCase('abs-014', 'abnormal_absence_present', 'Absence of enamel maturation', 'Absence of enamel maturation causes severe dental fragility.', 'present'),
  makeCase('abs-015', 'abnormal_absence_present', 'Lack of emotional reciprocity', 'Lack of emotional reciprocity is evident by toddlerhood.', 'present')
];

const STANDARD_POSITIVE_CASES = [
  makeCase('pos-001', 'standard_positive_present', 'Severe hypotonia', 'Severe hypotonia is evident at birth.', 'present'),
  makeCase('pos-002', 'standard_positive_present', 'Cerebellar ataxia', 'Cerebellar ataxia develops in late childhood.', 'present'),
  makeCase('pos-003', 'standard_positive_present', 'Sensorineural hearing loss', 'Sensorineural hearing loss progresses gradually.', 'present'),
  makeCase('pos-004', 'standard_positive_present', 'Optic atrophy', 'Optic atrophy is a frequent finding.', 'present'),
  makeCase('pos-005', 'standard_positive_present', 'Developmental delay', 'Developmental delay is universal.', 'present'),
  makeCase('pos-006', 'standard_positive_present', 'Feeding difficulties', 'Feeding difficulties begin in infancy.', 'present'),
  makeCase('pos-007', 'standard_positive_present', 'Joint hypermobility', 'Joint hypermobility is common in affected children.', 'present'),
  makeCase('pos-008', 'standard_positive_present', 'Microcephaly', 'Microcephaly is progressive.', 'present'),
  makeCase('pos-009', 'standard_positive_present', 'Epilepsy', 'Epilepsy often begins in childhood.', 'present'),
  makeCase('pos-010', 'standard_positive_present', 'Cardiomyopathy', 'Cardiomyopathy develops in adolescence.', 'present'),
  makeCase('pos-011', 'standard_positive_present', 'Renal cysts', 'Renal cysts are reported in adults.', 'present'),
  makeCase('pos-012', 'standard_positive_present', 'Short stature', 'Short stature is common across both sexes.', 'present'),
  makeCase('pos-013', 'standard_positive_present', 'Dystonia', 'Dystonia worsens over time.', 'present'),
  makeCase('pos-014', 'standard_positive_present', 'Autistic features', 'Autistic features are frequently described.', 'present'),
  makeCase('pos-015', 'standard_positive_present', 'Sleep disturbance', 'Sleep disturbance is common in school-age children.', 'present'),
  makeCase('pos-016', 'standard_positive_present', 'Peripheral neuropathy', 'Peripheral neuropathy appears in adulthood.', 'present'),
  makeCase('pos-017', 'standard_positive_present', 'Scoliosis', 'Scoliosis develops during adolescence.', 'present'),
  makeCase('pos-018', 'standard_positive_present', 'Retinal dystrophy', 'Retinal dystrophy is severe in the adult form.', 'present'),
  makeCase('pos-019', 'standard_positive_present', 'Behavioral dysregulation', 'Behavioral dysregulation is prominent in adolescence.', 'present'),
  makeCase('pos-020', 'standard_positive_present', 'Gastroesophageal reflux', 'Gastroesophageal reflux is persistent during infancy.', 'present')
];

const MODEL_EXCLUDED_STABLE_CASES = [
  makeCase('mex-001', 'model_excluded_stable', 'Seizures', 'Seizures are not observed in affected children.', 'excluded', {
    modelStatus: 'excluded',
    expectedOrigin: 'model_excluded',
    expectedReason: 'explicit_negative_local_context'
  }),
  makeCase('mex-002', 'model_excluded_stable', 'cataracts', 'No cataracts have been reported.', 'excluded', {
    modelStatus: 'excluded',
    expectedOrigin: 'model_excluded',
    expectedReason: 'explicit_negative_local_context'
  }),
  makeCase('mex-003', 'model_excluded_stable', 'Ataxia', 'Ataxia is usually absent.', 'excluded', {
    modelStatus: 'excluded',
    expectedOrigin: 'model_excluded',
    expectedReason: 'explicit_negative_local_context'
  }),
  makeCase('mex-004', 'model_excluded_stable', 'hearing loss', 'Hearing loss is not seen in this syndrome.', 'excluded', {
    modelStatus: 'excluded',
    expectedOrigin: 'model_excluded',
    expectedReason: 'explicit_negative_local_context'
  }),
  makeCase('mex-005', 'model_excluded_stable', 'cardiomyopathy', 'Cardiomyopathy remains absent through adulthood.', 'excluded', {
    modelStatus: 'excluded',
    expectedOrigin: 'model_excluded',
    expectedReason: 'explicit_negative_local_context'
  }),
  makeCase('mex-006', 'model_excluded_stable', 'renal failure', 'Renal failure has not been reported.', 'excluded', {
    modelStatus: 'excluded',
    expectedOrigin: 'model_excluded',
    expectedReason: 'explicit_negative_local_context'
  }),
  makeCase('mex-007', 'model_excluded_stable', 'Psychosis', 'Psychosis is not present in adolescence.', 'excluded', {
    modelStatus: 'excluded',
    expectedOrigin: 'model_excluded',
    expectedReason: 'explicit_negative_local_context'
  }),
  makeCase('mex-008', 'model_excluded_stable', 'liver disease', 'Without liver disease, nutrition remains stable.', 'excluded', {
    modelStatus: 'excluded',
    expectedOrigin: 'model_excluded',
    expectedReason: 'explicit_negative_local_context'
  }),
  makeCase('mex-009', 'model_excluded_stable', 'scoliosis', 'Patients are free of scoliosis on serial exams.', 'excluded', {
    modelStatus: 'excluded',
    expectedOrigin: 'model_excluded',
    expectedReason: 'explicit_negative_local_context'
  }),
  makeCase('mex-010', 'model_excluded_stable', 'tremor', 'Lacking tremor, gait remained otherwise stable.', 'excluded', {
    modelStatus: 'excluded',
    expectedOrigin: 'model_excluded',
    expectedReason: 'explicit_negative_local_context'
  }),
  makeCase('mex-011', 'model_excluded_stable', 'apnea', 'Apnea was not observed in the neonatal period.', 'excluded', {
    modelStatus: 'excluded',
    expectedOrigin: 'model_excluded',
    expectedReason: 'explicit_negative_local_context'
  }),
  makeCase('mex-012', 'model_excluded_stable', 'Contractures', 'Contractures are typically absent.', 'excluded', {
    modelStatus: 'excluded',
    expectedOrigin: 'model_excluded',
    expectedReason: 'explicit_negative_local_context'
  }),
  makeCase('mex-013', 'model_excluded_stable', 'Nephrocalcinosis', 'Nephrocalcinosis is not reported in adults.', 'excluded', {
    modelStatus: 'excluded',
    expectedOrigin: 'model_excluded',
    expectedReason: 'explicit_negative_local_context'
  }),
  makeCase('mex-014', 'model_excluded_stable', 'Optic atrophy', 'Optic atrophy was not seen on follow-up.', 'excluded', {
    modelStatus: 'excluded',
    expectedOrigin: 'model_excluded',
    expectedReason: 'explicit_negative_local_context'
  }),
  makeCase('mex-015', 'model_excluded_stable', 'Macrocephaly', 'Macrocephaly is rarely present.', 'excluded', {
    modelStatus: 'excluded',
    expectedOrigin: 'model_excluded',
    expectedReason: 'explicit_negative_local_context'
  })
];

export const GENEREVIEWS_CANDIDATE_ASSERTION_SYNTHETIC_CASES = [
  ...NEGATION_TO_EXCLUDED_CASES,
  ...NORMAL_OR_PRESERVED_REJECTED_CASES,
  ...CONDITIONAL_REJECTED_CASES,
  ...ABNORMAL_ABSENCE_PRESENT_CASES,
  ...STANDARD_POSITIVE_CASES,
  ...MODEL_EXCLUDED_STABLE_CASES
];

export { EXPECTED_SYNTHETIC_ASSERTION_CASE_COUNT };
