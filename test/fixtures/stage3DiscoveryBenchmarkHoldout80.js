const DISCOVERY_BENCHMARK = [
  {
    "id": "disc-001",
    "chapter_title": "Wolfram Syndrome",
    "existing_anchors": [
      {
        "hpo_label": "Diabetes mellitus",
        "match_texts": [
          "diabetes mellitus"
        ]
      },
      {
        "hpo_label": "Optic atrophy",
        "match_texts": [
          "optic atrophy"
        ]
      }
    ],
    "clinical_text": "Sensorineural hearing loss develops in approximately 65% of individuals by the end of the second decade. Diabetes insipidus is present in nearly all affected individuals and typically manifests during childhood. Neurologic complications including cerebellar ataxia and peripheral neuropathy may appear later in the disease course. Renal tract abnormalities, particularly hydroureter and hydronephrosis, are observed in a subset of patients. Cognitive function is generally preserved throughout the disease course.",
    "expectedNewCandidates": [
      {
        "label": "sensorineural hearing loss",
        "status": "present"
      },
      {
        "label": "diabetes insipidus",
        "status": "present"
      },
      {
        "label": "cerebellar ataxia",
        "status": "present"
      },
      {
        "label": "peripheral neuropathy",
        "status": "present"
      },
      {
        "label": "hydroureter",
        "status": "present"
      },
      {
        "label": "hydronephrosis",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Diabetes mellitus",
        "reason": "already_in_anchors"
      },
      {
        "label": "Optic atrophy",
        "reason": "already_in_anchors"
      },
      {
        "label": "cognitive function",
        "reason": "normal_or_preserved"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "renal tract abnormalities",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Wolfram Syndrome",
      "clinical_text": "Sensorineural hearing loss develops in approximately 65% of individuals by the end of the second decade. Diabetes insipidus is present in nearly all affected individuals and typically manifests during childhood. Neurologic complications including cerebellar ataxia and peripheral neuropathy may appear later in the disease course. Renal tract abnormalities, particularly hydroureter and hydronephrosis, are observed in a subset of patients. Cognitive function is generally preserved throughout the disease course.",
      "paragraph_count": 1,
      "sentence_count": 5,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Sensorineural hearing loss develops in approximately 65% of individuals by the end of the second decade. Diabetes insipidus is present in nearly all affected individuals and typically manifests during childhood. Neurologic complications including cerebellar ataxia and peripheral neuropathy may appear later in the disease course. Renal tract abnormalities, particularly hydroureter and hydronephrosis, are observed in a subset of patients. Cognitive function is generally preserved throughout the disease course.",
          "char_start": 0,
          "char_end": 513,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Sensorineural hearing loss develops in approximately 65% of individuals by the end of the second decade.",
              "char_start": 0,
              "char_end": 104
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Diabetes insipidus is present in nearly all affected individuals and typically manifests during childhood.",
              "char_start": 105,
              "char_end": 211
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Neurologic complications including cerebellar ataxia and peripheral neuropathy may appear later in the disease course.",
              "char_start": 212,
              "char_end": 330
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Renal tract abnormalities, particularly hydroureter and hydronephrosis, are observed in a subset of patients.",
              "char_start": 331,
              "char_end": 440
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Cognitive function is generally preserved throughout the disease course.",
              "char_start": 441,
              "char_end": 513
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Sensorineural hearing loss develops in approximately 65% of individuals by the end of the second decade.",
          "char_start": 0,
          "char_end": 104
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Diabetes insipidus is present in nearly all affected individuals and typically manifests during childhood.",
          "char_start": 105,
          "char_end": 211
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Neurologic complications including cerebellar ataxia and peripheral neuropathy may appear later in the disease course.",
          "char_start": 212,
          "char_end": 330
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Renal tract abnormalities, particularly hydroureter and hydronephrosis, are observed in a subset of patients.",
          "char_start": 331,
          "char_end": 440
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Cognitive function is generally preserved throughout the disease course.",
          "char_start": 441,
          "char_end": 513
        }
      ]
    }
  },
  {
    "id": "disc-002",
    "chapter_title": "Rett Syndrome",
    "existing_anchors": [
      {
        "hpo_label": "Stereotypic hand movements",
        "match_texts": [
          "stereotypic hand movements",
          "hand stereotypies"
        ]
      },
      {
        "hpo_label": "Intellectual disability",
        "match_texts": [
          "intellectual disability"
        ]
      }
    ],
    "clinical_text": "After a period of apparently normal development lasting 6 to 18 months, affected girls experience a regression phase characterized by loss of purposeful hand movements and loss of acquired spoken language. Breathing irregularities including episodic apnea and hyperventilation during wakefulness are common. Seizures occur in approximately 80% of affected individuals. Scoliosis develops in most patients and may require surgical intervention. Growth deceleration leading to short stature is typical. Bruxism is observed during waking hours.",
    "expectedNewCandidates": [
      {
        "label": "loss of purposeful hand movements",
        "status": "present"
      },
      {
        "label": "loss of acquired spoken language",
        "status": "present"
      },
      {
        "label": "episodic apnea",
        "status": "present"
      },
      {
        "label": "hyperventilation",
        "status": "present"
      },
      {
        "label": "seizures",
        "status": "present"
      },
      {
        "label": "scoliosis",
        "status": "present"
      },
      {
        "label": "short stature",
        "status": "present"
      },
      {
        "label": "bruxism",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Stereotypic hand movements",
        "reason": "already_in_anchors"
      },
      {
        "label": "Intellectual disability",
        "reason": "already_in_anchors"
      },
      {
        "label": "surgical intervention",
        "reason": "treatment_or_management"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "breathing irregularities",
        "status": "present"
      },
      {
        "label": "developmental regression",
        "status": "present"
      },
      {
        "label": "growth deceleration",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Rett Syndrome",
      "clinical_text": "After a period of apparently normal development lasting 6 to 18 months, affected girls experience a regression phase characterized by loss of purposeful hand movements and loss of acquired spoken language. Breathing irregularities including episodic apnea and hyperventilation during wakefulness are common. Seizures occur in approximately 80% of affected individuals. Scoliosis develops in most patients and may require surgical intervention. Growth deceleration leading to short stature is typical. Bruxism is observed during waking hours.",
      "paragraph_count": 1,
      "sentence_count": 6,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "After a period of apparently normal development lasting 6 to 18 months, affected girls experience a regression phase characterized by loss of purposeful hand movements and loss of acquired spoken language. Breathing irregularities including episodic apnea and hyperventilation during wakefulness are common. Seizures occur in approximately 80% of affected individuals. Scoliosis develops in most patients and may require surgical intervention. Growth deceleration leading to short stature is typical. Bruxism is observed during waking hours.",
          "char_start": 0,
          "char_end": 541,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "After a period of apparently normal development lasting 6 to 18 months, affected girls experience a regression phase characterized by loss of purposeful hand movements and loss of acquired spoken language.",
              "char_start": 0,
              "char_end": 205
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Breathing irregularities including episodic apnea and hyperventilation during wakefulness are common.",
              "char_start": 206,
              "char_end": 307
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Seizures occur in approximately 80% of affected individuals.",
              "char_start": 308,
              "char_end": 368
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Scoliosis develops in most patients and may require surgical intervention.",
              "char_start": 369,
              "char_end": 443
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Growth deceleration leading to short stature is typical.",
              "char_start": 444,
              "char_end": 500
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Bruxism is observed during waking hours.",
              "char_start": 501,
              "char_end": 541
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "After a period of apparently normal development lasting 6 to 18 months, affected girls experience a regression phase characterized by loss of purposeful hand movements and loss of acquired spoken language.",
          "char_start": 0,
          "char_end": 205
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Breathing irregularities including episodic apnea and hyperventilation during wakefulness are common.",
          "char_start": 206,
          "char_end": 307
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Seizures occur in approximately 80% of affected individuals.",
          "char_start": 308,
          "char_end": 368
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Scoliosis develops in most patients and may require surgical intervention.",
          "char_start": 369,
          "char_end": 443
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Growth deceleration leading to short stature is typical.",
          "char_start": 444,
          "char_end": 500
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Bruxism is observed during waking hours.",
          "char_start": 501,
          "char_end": 541
        }
      ]
    }
  },
  {
    "id": "disc-003",
    "chapter_title": "Marfan Syndrome",
    "existing_anchors": [
      {
        "hpo_label": "Aortic root dilation",
        "match_texts": [
          "aortic root dilation"
        ]
      },
      {
        "hpo_label": "Ectopia lentis",
        "match_texts": [
          "ectopia lentis",
          "lens subluxation"
        ]
      }
    ],
    "clinical_text": "Skeletal features include disproportionately long limbs (dolichostenomelia), arachnodactyly, pectus excavatum or pectus carinatum, and scoliosis. Joint hypermobility is common, particularly in younger patients. Dural ectasia, defined as widening of the dural sac, is detected in approximately 65% of individuals by MRI. Spontaneous pneumothorax occurs at an increased frequency. Striae distensae are often present on the shoulders, hips, and lower back. Myopia is the most common ocular finding aside from lens subluxation. FBN1 pathogenic variants are identified in the vast majority of affected individuals and are inherited in an autosomal dominant manner.",
    "expectedNewCandidates": [
      {
        "label": "dolichostenomelia",
        "status": "present"
      },
      {
        "label": "arachnodactyly",
        "status": "present"
      },
      {
        "label": "pectus excavatum",
        "status": "present"
      },
      {
        "label": "pectus carinatum",
        "status": "present"
      },
      {
        "label": "scoliosis",
        "status": "present"
      },
      {
        "label": "joint hypermobility",
        "status": "present"
      },
      {
        "label": "dural ectasia",
        "status": "present"
      },
      {
        "label": "spontaneous pneumothorax",
        "status": "present"
      },
      {
        "label": "striae distensae",
        "status": "present"
      },
      {
        "label": "myopia",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Aortic root dilation",
        "reason": "already_in_anchors"
      },
      {
        "label": "Ectopia lentis",
        "reason": "already_in_anchors"
      },
      {
        "label": "FBN1",
        "reason": "gene_or_variant"
      },
      {
        "label": "autosomal dominant",
        "reason": "not_a_phenotype"
      },
      {
        "label": "MRI",
        "reason": "lab_or_test_method"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "long limbs",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Marfan Syndrome",
      "clinical_text": "Skeletal features include disproportionately long limbs (dolichostenomelia), arachnodactyly, pectus excavatum or pectus carinatum, and scoliosis. Joint hypermobility is common, particularly in younger patients. Dural ectasia, defined as widening of the dural sac, is detected in approximately 65% of individuals by MRI. Spontaneous pneumothorax occurs at an increased frequency. Striae distensae are often present on the shoulders, hips, and lower back. Myopia is the most common ocular finding aside from lens subluxation. FBN1 pathogenic variants are identified in the vast majority of affected individuals and are inherited in an autosomal dominant manner.",
      "paragraph_count": 1,
      "sentence_count": 7,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Skeletal features include disproportionately long limbs (dolichostenomelia), arachnodactyly, pectus excavatum or pectus carinatum, and scoliosis. Joint hypermobility is common, particularly in younger patients. Dural ectasia, defined as widening of the dural sac, is detected in approximately 65% of individuals by MRI. Spontaneous pneumothorax occurs at an increased frequency. Striae distensae are often present on the shoulders, hips, and lower back. Myopia is the most common ocular finding aside from lens subluxation. FBN1 pathogenic variants are identified in the vast majority of affected individuals and are inherited in an autosomal dominant manner.",
          "char_start": 0,
          "char_end": 659,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Skeletal features include disproportionately long limbs (dolichostenomelia), arachnodactyly, pectus excavatum or pectus carinatum, and scoliosis.",
              "char_start": 0,
              "char_end": 145
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Joint hypermobility is common, particularly in younger patients.",
              "char_start": 146,
              "char_end": 210
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Dural ectasia, defined as widening of the dural sac, is detected in approximately 65% of individuals by MRI.",
              "char_start": 211,
              "char_end": 319
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Spontaneous pneumothorax occurs at an increased frequency.",
              "char_start": 320,
              "char_end": 378
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Striae distensae are often present on the shoulders, hips, and lower back.",
              "char_start": 379,
              "char_end": 453
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Myopia is the most common ocular finding aside from lens subluxation.",
              "char_start": 454,
              "char_end": 523
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "FBN1 pathogenic variants are identified in the vast majority of affected individuals and are inherited in an autosomal dominant manner.",
              "char_start": 524,
              "char_end": 659
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Skeletal features include disproportionately long limbs (dolichostenomelia), arachnodactyly, pectus excavatum or pectus carinatum, and scoliosis.",
          "char_start": 0,
          "char_end": 145
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Joint hypermobility is common, particularly in younger patients.",
          "char_start": 146,
          "char_end": 210
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Dural ectasia, defined as widening of the dural sac, is detected in approximately 65% of individuals by MRI.",
          "char_start": 211,
          "char_end": 319
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Spontaneous pneumothorax occurs at an increased frequency.",
          "char_start": 320,
          "char_end": 378
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Striae distensae are often present on the shoulders, hips, and lower back.",
          "char_start": 379,
          "char_end": 453
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Myopia is the most common ocular finding aside from lens subluxation.",
          "char_start": 454,
          "char_end": 523
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "FBN1 pathogenic variants are identified in the vast majority of affected individuals and are inherited in an autosomal dominant manner.",
          "char_start": 524,
          "char_end": 659
        }
      ]
    }
  },
  {
    "id": "disc-004",
    "chapter_title": "Tuberous Sclerosis Complex",
    "existing_anchors": [
      {
        "hpo_label": "Cortical tuber",
        "match_texts": [
          "cortical tubers"
        ]
      },
      {
        "hpo_label": "Seizure",
        "match_texts": [
          "seizures",
          "epilepsy"
        ]
      }
    ],
    "clinical_text": "Hypomelanotic macules (ash-leaf spots) are often the earliest visible sign and may be present at birth. Facial angiofibromas develop in approximately 75% of affected individuals, typically appearing between ages 2 and 5 years. Shagreen patches are found over the lumbosacral area. Subependymal giant cell astrocytomas can cause obstructive hydrocephalus if they enlarge near the foramen of Monro. Renal angiomyolipomas occur in up to 80% of adults and can cause life-threatening hemorrhage. Cardiac rhabdomyomas are most common in infancy and usually regress spontaneously. Intellectual disability of varying severity is present in approximately 50% of individuals. Autism spectrum disorder is diagnosed in 25%–50% of individuals.",
    "expectedNewCandidates": [
      {
        "label": "hypomelanotic macules",
        "status": "present"
      },
      {
        "label": "facial angiofibromas",
        "status": "present"
      },
      {
        "label": "shagreen patches",
        "status": "present"
      },
      {
        "label": "subependymal giant cell astrocytoma",
        "status": "present"
      },
      {
        "label": "obstructive hydrocephalus",
        "status": "present"
      },
      {
        "label": "renal angiomyolipomas",
        "status": "present"
      },
      {
        "label": "cardiac rhabdomyomas",
        "status": "present"
      },
      {
        "label": "intellectual disability",
        "status": "present"
      },
      {
        "label": "autism spectrum disorder",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Cortical tuber",
        "reason": "already_in_anchors"
      },
      {
        "label": "Seizure",
        "reason": "already_in_anchors"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "hemorrhage",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Tuberous Sclerosis Complex",
      "clinical_text": "Hypomelanotic macules (ash-leaf spots) are often the earliest visible sign and may be present at birth. Facial angiofibromas develop in approximately 75% of affected individuals, typically appearing between ages 2 and 5 years. Shagreen patches are found over the lumbosacral area. Subependymal giant cell astrocytomas can cause obstructive hydrocephalus if they enlarge near the foramen of Monro. Renal angiomyolipomas occur in up to 80% of adults and can cause life-threatening hemorrhage. Cardiac rhabdomyomas are most common in infancy and usually regress spontaneously. Intellectual disability of varying severity is present in approximately 50% of individuals. Autism spectrum disorder is diagnosed in 25%–50% of individuals.",
      "paragraph_count": 1,
      "sentence_count": 8,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Hypomelanotic macules (ash-leaf spots) are often the earliest visible sign and may be present at birth. Facial angiofibromas develop in approximately 75% of affected individuals, typically appearing between ages 2 and 5 years. Shagreen patches are found over the lumbosacral area. Subependymal giant cell astrocytomas can cause obstructive hydrocephalus if they enlarge near the foramen of Monro. Renal angiomyolipomas occur in up to 80% of adults and can cause life-threatening hemorrhage. Cardiac rhabdomyomas are most common in infancy and usually regress spontaneously. Intellectual disability of varying severity is present in approximately 50% of individuals. Autism spectrum disorder is diagnosed in 25%–50% of individuals.",
          "char_start": 0,
          "char_end": 730,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Hypomelanotic macules (ash-leaf spots) are often the earliest visible sign and may be present at birth.",
              "char_start": 0,
              "char_end": 103
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Facial angiofibromas develop in approximately 75% of affected individuals, typically appearing between ages 2 and 5 years.",
              "char_start": 104,
              "char_end": 226
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Shagreen patches are found over the lumbosacral area.",
              "char_start": 227,
              "char_end": 280
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Subependymal giant cell astrocytomas can cause obstructive hydrocephalus if they enlarge near the foramen of Monro.",
              "char_start": 281,
              "char_end": 396
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Renal angiomyolipomas occur in up to 80% of adults and can cause life-threatening hemorrhage.",
              "char_start": 397,
              "char_end": 490
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Cardiac rhabdomyomas are most common in infancy and usually regress spontaneously.",
              "char_start": 491,
              "char_end": 573
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Intellectual disability of varying severity is present in approximately 50% of individuals.",
              "char_start": 574,
              "char_end": 665
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Autism spectrum disorder is diagnosed in 25%–50% of individuals.",
              "char_start": 666,
              "char_end": 730
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Hypomelanotic macules (ash-leaf spots) are often the earliest visible sign and may be present at birth.",
          "char_start": 0,
          "char_end": 103
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Facial angiofibromas develop in approximately 75% of affected individuals, typically appearing between ages 2 and 5 years.",
          "char_start": 104,
          "char_end": 226
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Shagreen patches are found over the lumbosacral area.",
          "char_start": 227,
          "char_end": 280
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Subependymal giant cell astrocytomas can cause obstructive hydrocephalus if they enlarge near the foramen of Monro.",
          "char_start": 281,
          "char_end": 396
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Renal angiomyolipomas occur in up to 80% of adults and can cause life-threatening hemorrhage.",
          "char_start": 397,
          "char_end": 490
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Cardiac rhabdomyomas are most common in infancy and usually regress spontaneously.",
          "char_start": 491,
          "char_end": 573
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Intellectual disability of varying severity is present in approximately 50% of individuals.",
          "char_start": 574,
          "char_end": 665
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Autism spectrum disorder is diagnosed in 25%–50% of individuals.",
          "char_start": 666,
          "char_end": 730
        }
      ]
    }
  },
  {
    "id": "disc-005",
    "chapter_title": "Friedreich Ataxia",
    "existing_anchors": [
      {
        "hpo_label": "Ataxia",
        "match_texts": [
          "ataxia",
          "progressive ataxia"
        ]
      },
      {
        "hpo_label": "Hypertrophic cardiomyopathy",
        "match_texts": [
          "hypertrophic cardiomyopathy"
        ]
      }
    ],
    "clinical_text": "Loss of independent ambulation typically occurs within 10 to 15 years of symptom onset. Dysarthria develops gradually and becomes severe in advanced stages. Absent deep tendon reflexes in the lower extremities are a hallmark finding on neurological examination. Scoliosis develops in most patients and may be severe. Pes cavus is present in a significant minority. Dysphagia becomes increasingly problematic in later stages. Sensorineural hearing loss has been reported but is not a consistent feature. Diabetes mellitus develops in approximately 10%–30% of affected individuals. Visual acuity is generally preserved. The disorder is caused by biallelic GAA triplet repeat expansions in FXN.",
    "expectedNewCandidates": [
      {
        "label": "loss of independent ambulation",
        "status": "present"
      },
      {
        "label": "dysarthria",
        "status": "present"
      },
      {
        "label": "absent deep tendon reflexes",
        "status": "present"
      },
      {
        "label": "scoliosis",
        "status": "present"
      },
      {
        "label": "pes cavus",
        "status": "present"
      },
      {
        "label": "dysphagia",
        "status": "present"
      },
      {
        "label": "sensorineural hearing loss",
        "status": "present"
      },
      {
        "label": "diabetes mellitus",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Ataxia",
        "reason": "already_in_anchors"
      },
      {
        "label": "Hypertrophic cardiomyopathy",
        "reason": "already_in_anchors"
      },
      {
        "label": "visual acuity",
        "reason": "normal_or_preserved"
      },
      {
        "label": "FXN",
        "reason": "gene_or_variant"
      },
      {
        "label": "GAA triplet repeat expansions",
        "reason": "gene_or_variant"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "areflexia",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Friedreich Ataxia",
      "clinical_text": "Loss of independent ambulation typically occurs within 10 to 15 years of symptom onset. Dysarthria develops gradually and becomes severe in advanced stages. Absent deep tendon reflexes in the lower extremities are a hallmark finding on neurological examination. Scoliosis develops in most patients and may be severe. Pes cavus is present in a significant minority. Dysphagia becomes increasingly problematic in later stages. Sensorineural hearing loss has been reported but is not a consistent feature. Diabetes mellitus develops in approximately 10%–30% of affected individuals. Visual acuity is generally preserved. The disorder is caused by biallelic GAA triplet repeat expansions in FXN.",
      "paragraph_count": 1,
      "sentence_count": 10,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Loss of independent ambulation typically occurs within 10 to 15 years of symptom onset. Dysarthria develops gradually and becomes severe in advanced stages. Absent deep tendon reflexes in the lower extremities are a hallmark finding on neurological examination. Scoliosis develops in most patients and may be severe. Pes cavus is present in a significant minority. Dysphagia becomes increasingly problematic in later stages. Sensorineural hearing loss has been reported but is not a consistent feature. Diabetes mellitus develops in approximately 10%–30% of affected individuals. Visual acuity is generally preserved. The disorder is caused by biallelic GAA triplet repeat expansions in FXN.",
          "char_start": 0,
          "char_end": 691,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Loss of independent ambulation typically occurs within 10 to 15 years of symptom onset.",
              "char_start": 0,
              "char_end": 87
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Dysarthria develops gradually and becomes severe in advanced stages.",
              "char_start": 88,
              "char_end": 156
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Absent deep tendon reflexes in the lower extremities are a hallmark finding on neurological examination.",
              "char_start": 157,
              "char_end": 261
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Scoliosis develops in most patients and may be severe.",
              "char_start": 262,
              "char_end": 316
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Pes cavus is present in a significant minority.",
              "char_start": 317,
              "char_end": 364
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Dysphagia becomes increasingly problematic in later stages.",
              "char_start": 365,
              "char_end": 424
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Sensorineural hearing loss has been reported but is not a consistent feature.",
              "char_start": 425,
              "char_end": 502
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Diabetes mellitus develops in approximately 10%–30% of affected individuals.",
              "char_start": 503,
              "char_end": 579
            },
            {
              "sentence_id": "p1_s9",
              "sentence_index": 9,
              "text": "Visual acuity is generally preserved.",
              "char_start": 580,
              "char_end": 617
            },
            {
              "sentence_id": "p1_s10",
              "sentence_index": 10,
              "text": "The disorder is caused by biallelic GAA triplet repeat expansions in FXN.",
              "char_start": 618,
              "char_end": 691
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Loss of independent ambulation typically occurs within 10 to 15 years of symptom onset.",
          "char_start": 0,
          "char_end": 87
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Dysarthria develops gradually and becomes severe in advanced stages.",
          "char_start": 88,
          "char_end": 156
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Absent deep tendon reflexes in the lower extremities are a hallmark finding on neurological examination.",
          "char_start": 157,
          "char_end": 261
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Scoliosis develops in most patients and may be severe.",
          "char_start": 262,
          "char_end": 316
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Pes cavus is present in a significant minority.",
          "char_start": 317,
          "char_end": 364
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Dysphagia becomes increasingly problematic in later stages.",
          "char_start": 365,
          "char_end": 424
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Sensorineural hearing loss has been reported but is not a consistent feature.",
          "char_start": 425,
          "char_end": 502
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Diabetes mellitus develops in approximately 10%–30% of affected individuals.",
          "char_start": 503,
          "char_end": 579
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s9",
          "sentence_index": 9,
          "text": "Visual acuity is generally preserved.",
          "char_start": 580,
          "char_end": 617
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s10",
          "sentence_index": 10,
          "text": "The disorder is caused by biallelic GAA triplet repeat expansions in FXN.",
          "char_start": 618,
          "char_end": 691
        }
      ]
    }
  },
  {
    "id": "disc-006",
    "chapter_title": "Neurofibromatosis Type 1",
    "existing_anchors": [
      {
        "hpo_label": "Cafe-au-lait macule",
        "match_texts": [
          "cafe-au-lait macules",
          "café-au-lait spots"
        ]
      },
      {
        "hpo_label": "Neurofibroma",
        "match_texts": [
          "neurofibromas"
        ]
      }
    ],
    "clinical_text": "Lisch nodules (iris hamartomas) are present in over 90% of adults and can be detected on slit-lamp examination. Axillary and inguinal freckling develops during childhood. Optic pathway gliomas occur in approximately 15% of children and may cause visual impairment. Osseous lesions including sphenoid wing dysplasia and long bone pseudarthrosis are less common but diagnostically significant. Learning disabilities affect up to 60% of children, though severe intellectual disability is uncommon. Hypertension may result from renal artery stenosis or pheochromocytoma. Malignant peripheral nerve sheath tumors develop in 8%–13% of individuals over their lifetime.",
    "expectedNewCandidates": [
      {
        "label": "Lisch nodules",
        "status": "present"
      },
      {
        "label": "axillary freckling",
        "status": "present"
      },
      {
        "label": "inguinal freckling",
        "status": "present"
      },
      {
        "label": "optic pathway glioma",
        "status": "present"
      },
      {
        "label": "visual impairment",
        "status": "present"
      },
      {
        "label": "sphenoid wing dysplasia",
        "status": "present"
      },
      {
        "label": "pseudarthrosis",
        "status": "present"
      },
      {
        "label": "learning disabilities",
        "status": "present"
      },
      {
        "label": "hypertension",
        "status": "present"
      },
      {
        "label": "renal artery stenosis",
        "status": "present"
      },
      {
        "label": "pheochromocytoma",
        "status": "present"
      },
      {
        "label": "malignant peripheral nerve sheath tumor",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Cafe-au-lait macule",
        "reason": "already_in_anchors"
      },
      {
        "label": "Neurofibroma",
        "reason": "already_in_anchors"
      },
      {
        "label": "slit-lamp examination",
        "reason": "lab_or_test_method"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "iris hamartomas",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Neurofibromatosis Type 1",
      "clinical_text": "Lisch nodules (iris hamartomas) are present in over 90% of adults and can be detected on slit-lamp examination. Axillary and inguinal freckling develops during childhood. Optic pathway gliomas occur in approximately 15% of children and may cause visual impairment. Osseous lesions including sphenoid wing dysplasia and long bone pseudarthrosis are less common but diagnostically significant. Learning disabilities affect up to 60% of children, though severe intellectual disability is uncommon. Hypertension may result from renal artery stenosis or pheochromocytoma. Malignant peripheral nerve sheath tumors develop in 8%–13% of individuals over their lifetime.",
      "paragraph_count": 1,
      "sentence_count": 7,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Lisch nodules (iris hamartomas) are present in over 90% of adults and can be detected on slit-lamp examination. Axillary and inguinal freckling develops during childhood. Optic pathway gliomas occur in approximately 15% of children and may cause visual impairment. Osseous lesions including sphenoid wing dysplasia and long bone pseudarthrosis are less common but diagnostically significant. Learning disabilities affect up to 60% of children, though severe intellectual disability is uncommon. Hypertension may result from renal artery stenosis or pheochromocytoma. Malignant peripheral nerve sheath tumors develop in 8%–13% of individuals over their lifetime.",
          "char_start": 0,
          "char_end": 661,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Lisch nodules (iris hamartomas) are present in over 90% of adults and can be detected on slit-lamp examination.",
              "char_start": 0,
              "char_end": 111
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Axillary and inguinal freckling develops during childhood.",
              "char_start": 112,
              "char_end": 170
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Optic pathway gliomas occur in approximately 15% of children and may cause visual impairment.",
              "char_start": 171,
              "char_end": 264
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Osseous lesions including sphenoid wing dysplasia and long bone pseudarthrosis are less common but diagnostically significant.",
              "char_start": 265,
              "char_end": 391
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Learning disabilities affect up to 60% of children, though severe intellectual disability is uncommon.",
              "char_start": 392,
              "char_end": 494
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Hypertension may result from renal artery stenosis or pheochromocytoma.",
              "char_start": 495,
              "char_end": 566
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Malignant peripheral nerve sheath tumors develop in 8%–13% of individuals over their lifetime.",
              "char_start": 567,
              "char_end": 661
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Lisch nodules (iris hamartomas) are present in over 90% of adults and can be detected on slit-lamp examination.",
          "char_start": 0,
          "char_end": 111
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Axillary and inguinal freckling develops during childhood.",
          "char_start": 112,
          "char_end": 170
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Optic pathway gliomas occur in approximately 15% of children and may cause visual impairment.",
          "char_start": 171,
          "char_end": 264
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Osseous lesions including sphenoid wing dysplasia and long bone pseudarthrosis are less common but diagnostically significant.",
          "char_start": 265,
          "char_end": 391
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Learning disabilities affect up to 60% of children, though severe intellectual disability is uncommon.",
          "char_start": 392,
          "char_end": 494
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Hypertension may result from renal artery stenosis or pheochromocytoma.",
          "char_start": 495,
          "char_end": 566
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Malignant peripheral nerve sheath tumors develop in 8%–13% of individuals over their lifetime.",
          "char_start": 567,
          "char_end": 661
        }
      ]
    }
  },
  {
    "id": "disc-007",
    "chapter_title": "Angelman Syndrome",
    "existing_anchors": [
      {
        "hpo_label": "Global developmental delay",
        "match_texts": [
          "global developmental delay",
          "severe developmental delay"
        ]
      },
      {
        "hpo_label": "Seizure",
        "match_texts": [
          "seizures"
        ]
      }
    ],
    "clinical_text": "Affected individuals have absent or severely limited speech, typically producing fewer than five words. A characteristic behavioral phenotype includes a happy demeanor with frequent smiling and laughter, often provoked by social interaction. Movement abnormalities include ataxic gait with arms held uplifted and tremulous hand movements. Microcephaly develops postnatally and is present by age 2 in most individuals. Sleep disturbance with decreased need for sleep is a significant management concern. Feeding difficulties are common in infancy. Hypopigmentation relative to family members is observed in deletion cases.",
    "expectedNewCandidates": [
      {
        "label": "absent speech",
        "status": "present"
      },
      {
        "label": "happy demeanor",
        "status": "present"
      },
      {
        "label": "ataxic gait",
        "status": "present"
      },
      {
        "label": "tremor",
        "status": "present"
      },
      {
        "label": "microcephaly",
        "status": "present"
      },
      {
        "label": "sleep disturbance",
        "status": "present"
      },
      {
        "label": "feeding difficulties",
        "status": "present"
      },
      {
        "label": "hypopigmentation",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Global developmental delay",
        "reason": "already_in_anchors"
      },
      {
        "label": "Seizure",
        "reason": "already_in_anchors"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "frequent laughter",
        "status": "present"
      },
      {
        "label": "decreased need for sleep",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Angelman Syndrome",
      "clinical_text": "Affected individuals have absent or severely limited speech, typically producing fewer than five words. A characteristic behavioral phenotype includes a happy demeanor with frequent smiling and laughter, often provoked by social interaction. Movement abnormalities include ataxic gait with arms held uplifted and tremulous hand movements. Microcephaly develops postnatally and is present by age 2 in most individuals. Sleep disturbance with decreased need for sleep is a significant management concern. Feeding difficulties are common in infancy. Hypopigmentation relative to family members is observed in deletion cases.",
      "paragraph_count": 1,
      "sentence_count": 7,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Affected individuals have absent or severely limited speech, typically producing fewer than five words. A characteristic behavioral phenotype includes a happy demeanor with frequent smiling and laughter, often provoked by social interaction. Movement abnormalities include ataxic gait with arms held uplifted and tremulous hand movements. Microcephaly develops postnatally and is present by age 2 in most individuals. Sleep disturbance with decreased need for sleep is a significant management concern. Feeding difficulties are common in infancy. Hypopigmentation relative to family members is observed in deletion cases.",
          "char_start": 0,
          "char_end": 621,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Affected individuals have absent or severely limited speech, typically producing fewer than five words.",
              "char_start": 0,
              "char_end": 103
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "A characteristic behavioral phenotype includes a happy demeanor with frequent smiling and laughter, often provoked by social interaction.",
              "char_start": 104,
              "char_end": 241
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Movement abnormalities include ataxic gait with arms held uplifted and tremulous hand movements.",
              "char_start": 242,
              "char_end": 338
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Microcephaly develops postnatally and is present by age 2 in most individuals.",
              "char_start": 339,
              "char_end": 417
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Sleep disturbance with decreased need for sleep is a significant management concern.",
              "char_start": 418,
              "char_end": 502
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Feeding difficulties are common in infancy.",
              "char_start": 503,
              "char_end": 546
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Hypopigmentation relative to family members is observed in deletion cases.",
              "char_start": 547,
              "char_end": 621
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Affected individuals have absent or severely limited speech, typically producing fewer than five words.",
          "char_start": 0,
          "char_end": 103
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "A characteristic behavioral phenotype includes a happy demeanor with frequent smiling and laughter, often provoked by social interaction.",
          "char_start": 104,
          "char_end": 241
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Movement abnormalities include ataxic gait with arms held uplifted and tremulous hand movements.",
          "char_start": 242,
          "char_end": 338
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Microcephaly develops postnatally and is present by age 2 in most individuals.",
          "char_start": 339,
          "char_end": 417
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Sleep disturbance with decreased need for sleep is a significant management concern.",
          "char_start": 418,
          "char_end": 502
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Feeding difficulties are common in infancy.",
          "char_start": 503,
          "char_end": 546
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Hypopigmentation relative to family members is observed in deletion cases.",
          "char_start": 547,
          "char_end": 621
        }
      ]
    }
  },
  {
    "id": "disc-008",
    "chapter_title": "Wilson Disease",
    "existing_anchors": [
      {
        "hpo_label": "Hepatic dysfunction",
        "match_texts": [
          "hepatic dysfunction",
          "liver disease"
        ]
      },
      {
        "hpo_label": "Kayser-Fleischer ring",
        "match_texts": [
          "Kayser-Fleischer rings"
        ]
      }
    ],
    "clinical_text": "Neuropsychiatric manifestations include dysarthria, dystonia, tremor, and parkinsonism. Personality changes, depression, and psychosis may precede the recognition of neurologic disease. Hemolytic anemia can be the presenting feature in some individuals. Renal tubular dysfunction manifesting as aminoaciduria and nephrocalcinosis has been described. Reduced serum ceruloplasmin levels and elevated 24-hour urinary copper excretion are the primary diagnostic findings. Treatment with chelating agents such as penicillamine or trientine is effective when initiated early.",
    "expectedNewCandidates": [
      {
        "label": "dysarthria",
        "status": "present"
      },
      {
        "label": "dystonia",
        "status": "present"
      },
      {
        "label": "tremor",
        "status": "present"
      },
      {
        "label": "parkinsonism",
        "status": "present"
      },
      {
        "label": "depression",
        "status": "present"
      },
      {
        "label": "psychosis",
        "status": "present"
      },
      {
        "label": "hemolytic anemia",
        "status": "present"
      },
      {
        "label": "renal tubular dysfunction",
        "status": "present"
      },
      {
        "label": "aminoaciduria",
        "status": "present"
      },
      {
        "label": "nephrocalcinosis",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Hepatic dysfunction",
        "reason": "already_in_anchors"
      },
      {
        "label": "Kayser-Fleischer ring",
        "reason": "already_in_anchors"
      },
      {
        "label": "serum ceruloplasmin",
        "reason": "lab_or_test_method"
      },
      {
        "label": "urinary copper excretion",
        "reason": "lab_or_test_method"
      },
      {
        "label": "penicillamine",
        "reason": "treatment_or_management"
      },
      {
        "label": "trientine",
        "reason": "treatment_or_management"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "personality changes",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Wilson Disease",
      "clinical_text": "Neuropsychiatric manifestations include dysarthria, dystonia, tremor, and parkinsonism. Personality changes, depression, and psychosis may precede the recognition of neurologic disease. Hemolytic anemia can be the presenting feature in some individuals. Renal tubular dysfunction manifesting as aminoaciduria and nephrocalcinosis has been described. Reduced serum ceruloplasmin levels and elevated 24-hour urinary copper excretion are the primary diagnostic findings. Treatment with chelating agents such as penicillamine or trientine is effective when initiated early.",
      "paragraph_count": 1,
      "sentence_count": 6,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Neuropsychiatric manifestations include dysarthria, dystonia, tremor, and parkinsonism. Personality changes, depression, and psychosis may precede the recognition of neurologic disease. Hemolytic anemia can be the presenting feature in some individuals. Renal tubular dysfunction manifesting as aminoaciduria and nephrocalcinosis has been described. Reduced serum ceruloplasmin levels and elevated 24-hour urinary copper excretion are the primary diagnostic findings. Treatment with chelating agents such as penicillamine or trientine is effective when initiated early.",
          "char_start": 0,
          "char_end": 569,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Neuropsychiatric manifestations include dysarthria, dystonia, tremor, and parkinsonism.",
              "char_start": 0,
              "char_end": 87
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Personality changes, depression, and psychosis may precede the recognition of neurologic disease.",
              "char_start": 88,
              "char_end": 185
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Hemolytic anemia can be the presenting feature in some individuals.",
              "char_start": 186,
              "char_end": 253
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Renal tubular dysfunction manifesting as aminoaciduria and nephrocalcinosis has been described.",
              "char_start": 254,
              "char_end": 349
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Reduced serum ceruloplasmin levels and elevated 24-hour urinary copper excretion are the primary diagnostic findings.",
              "char_start": 350,
              "char_end": 467
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Treatment with chelating agents such as penicillamine or trientine is effective when initiated early.",
              "char_start": 468,
              "char_end": 569
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Neuropsychiatric manifestations include dysarthria, dystonia, tremor, and parkinsonism.",
          "char_start": 0,
          "char_end": 87
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Personality changes, depression, and psychosis may precede the recognition of neurologic disease.",
          "char_start": 88,
          "char_end": 185
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Hemolytic anemia can be the presenting feature in some individuals.",
          "char_start": 186,
          "char_end": 253
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Renal tubular dysfunction manifesting as aminoaciduria and nephrocalcinosis has been described.",
          "char_start": 254,
          "char_end": 349
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Reduced serum ceruloplasmin levels and elevated 24-hour urinary copper excretion are the primary diagnostic findings.",
          "char_start": 350,
          "char_end": 467
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Treatment with chelating agents such as penicillamine or trientine is effective when initiated early.",
          "char_start": 468,
          "char_end": 569
        }
      ]
    }
  },
  {
    "id": "disc-009",
    "chapter_title": "Duchenne Muscular Dystrophy",
    "existing_anchors": [
      {
        "hpo_label": "Progressive muscle weakness",
        "match_texts": [
          "progressive muscle weakness",
          "proximal muscle weakness"
        ]
      },
      {
        "hpo_label": "Elevated circulating creatine kinase concentration",
        "match_texts": [
          "elevated CK",
          "elevated creatine kinase"
        ]
      }
    ],
    "clinical_text": "Affected boys typically present with delayed motor milestones, particularly delayed walking, between 12 and 18 months. Gowers sign, in which the child uses the hands to walk up the legs when rising from the floor, is a classic finding. Pseudohypertrophy of the calf muscles is noted in early childhood. Loss of independent ambulation occurs by age 12 in most patients. Dilated cardiomyopathy is nearly universal by the late teenage years. Respiratory insufficiency requiring ventilatory support develops in the second or third decade. Scoliosis worsens after loss of ambulation. Cognitive impairment with a mean IQ approximately one standard deviation below normal is well documented. DMD pathogenic variants are identified by multiplex ligation-dependent probe amplification or sequencing.",
    "expectedNewCandidates": [
      {
        "label": "delayed motor milestones",
        "status": "present"
      },
      {
        "label": "Gowers sign",
        "status": "present"
      },
      {
        "label": "pseudohypertrophy of calf muscles",
        "status": "present"
      },
      {
        "label": "loss of independent ambulation",
        "status": "present"
      },
      {
        "label": "dilated cardiomyopathy",
        "status": "present"
      },
      {
        "label": "respiratory insufficiency",
        "status": "present"
      },
      {
        "label": "scoliosis",
        "status": "present"
      },
      {
        "label": "cognitive impairment",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Progressive muscle weakness",
        "reason": "already_in_anchors"
      },
      {
        "label": "Elevated circulating creatine kinase concentration",
        "reason": "already_in_anchors"
      },
      {
        "label": "DMD",
        "reason": "gene_or_variant"
      },
      {
        "label": "multiplex ligation-dependent probe amplification",
        "reason": "lab_or_test_method"
      },
      {
        "label": "ventilatory support",
        "reason": "treatment_or_management"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "delayed walking",
        "status": "present"
      },
      {
        "label": "calf hypertrophy",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Duchenne Muscular Dystrophy",
      "clinical_text": "Affected boys typically present with delayed motor milestones, particularly delayed walking, between 12 and 18 months. Gowers sign, in which the child uses the hands to walk up the legs when rising from the floor, is a classic finding. Pseudohypertrophy of the calf muscles is noted in early childhood. Loss of independent ambulation occurs by age 12 in most patients. Dilated cardiomyopathy is nearly universal by the late teenage years. Respiratory insufficiency requiring ventilatory support develops in the second or third decade. Scoliosis worsens after loss of ambulation. Cognitive impairment with a mean IQ approximately one standard deviation below normal is well documented. DMD pathogenic variants are identified by multiplex ligation-dependent probe amplification or sequencing.",
      "paragraph_count": 1,
      "sentence_count": 9,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Affected boys typically present with delayed motor milestones, particularly delayed walking, between 12 and 18 months. Gowers sign, in which the child uses the hands to walk up the legs when rising from the floor, is a classic finding. Pseudohypertrophy of the calf muscles is noted in early childhood. Loss of independent ambulation occurs by age 12 in most patients. Dilated cardiomyopathy is nearly universal by the late teenage years. Respiratory insufficiency requiring ventilatory support develops in the second or third decade. Scoliosis worsens after loss of ambulation. Cognitive impairment with a mean IQ approximately one standard deviation below normal is well documented. DMD pathogenic variants are identified by multiplex ligation-dependent probe amplification or sequencing.",
          "char_start": 0,
          "char_end": 790,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Affected boys typically present with delayed motor milestones, particularly delayed walking, between 12 and 18 months.",
              "char_start": 0,
              "char_end": 118
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Gowers sign, in which the child uses the hands to walk up the legs when rising from the floor, is a classic finding.",
              "char_start": 119,
              "char_end": 235
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Pseudohypertrophy of the calf muscles is noted in early childhood.",
              "char_start": 236,
              "char_end": 302
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Loss of independent ambulation occurs by age 12 in most patients.",
              "char_start": 303,
              "char_end": 368
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Dilated cardiomyopathy is nearly universal by the late teenage years.",
              "char_start": 369,
              "char_end": 438
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Respiratory insufficiency requiring ventilatory support develops in the second or third decade.",
              "char_start": 439,
              "char_end": 534
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Scoliosis worsens after loss of ambulation.",
              "char_start": 535,
              "char_end": 578
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Cognitive impairment with a mean IQ approximately one standard deviation below normal is well documented.",
              "char_start": 579,
              "char_end": 684
            },
            {
              "sentence_id": "p1_s9",
              "sentence_index": 9,
              "text": "DMD pathogenic variants are identified by multiplex ligation-dependent probe amplification or sequencing.",
              "char_start": 685,
              "char_end": 790
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Affected boys typically present with delayed motor milestones, particularly delayed walking, between 12 and 18 months.",
          "char_start": 0,
          "char_end": 118
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Gowers sign, in which the child uses the hands to walk up the legs when rising from the floor, is a classic finding.",
          "char_start": 119,
          "char_end": 235
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Pseudohypertrophy of the calf muscles is noted in early childhood.",
          "char_start": 236,
          "char_end": 302
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Loss of independent ambulation occurs by age 12 in most patients.",
          "char_start": 303,
          "char_end": 368
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Dilated cardiomyopathy is nearly universal by the late teenage years.",
          "char_start": 369,
          "char_end": 438
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Respiratory insufficiency requiring ventilatory support develops in the second or third decade.",
          "char_start": 439,
          "char_end": 534
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Scoliosis worsens after loss of ambulation.",
          "char_start": 535,
          "char_end": 578
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Cognitive impairment with a mean IQ approximately one standard deviation below normal is well documented.",
          "char_start": 579,
          "char_end": 684
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s9",
          "sentence_index": 9,
          "text": "DMD pathogenic variants are identified by multiplex ligation-dependent probe amplification or sequencing.",
          "char_start": 685,
          "char_end": 790
        }
      ]
    }
  },
  {
    "id": "disc-010",
    "chapter_title": "Noonan Syndrome",
    "existing_anchors": [
      {
        "hpo_label": "Short stature",
        "match_texts": [
          "short stature"
        ]
      },
      {
        "hpo_label": "Pulmonary valve stenosis",
        "match_texts": [
          "pulmonary valve stenosis",
          "pulmonic stenosis"
        ]
      }
    ],
    "clinical_text": "Characteristic facial features include widely spaced eyes, low-set posteriorly rotated ears, and a deeply grooved philtrum. Webbed neck (pterygium colli) is present in approximately 25% of individuals. Pectus excavatum and pectus carinatum are common chest deformities. Cryptorchidism is found in the majority of affected males. Feeding difficulties in infancy often require nasogastric tube support. Mild intellectual disability is present in approximately one third of individuals, though many have normal cognition. Coagulation factor deficiencies and platelet dysfunction contribute to a bleeding tendency. Lymphedema may be present at birth or develop later.",
    "expectedNewCandidates": [
      {
        "label": "hypertelorism",
        "status": "present"
      },
      {
        "label": "low-set ears",
        "status": "present"
      },
      {
        "label": "posteriorly rotated ears",
        "status": "present"
      },
      {
        "label": "deeply grooved philtrum",
        "status": "present"
      },
      {
        "label": "webbed neck",
        "status": "present"
      },
      {
        "label": "pectus excavatum",
        "status": "present"
      },
      {
        "label": "pectus carinatum",
        "status": "present"
      },
      {
        "label": "cryptorchidism",
        "status": "present"
      },
      {
        "label": "feeding difficulties",
        "status": "present"
      },
      {
        "label": "mild intellectual disability",
        "status": "present"
      },
      {
        "label": "bleeding tendency",
        "status": "present"
      },
      {
        "label": "lymphedema",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Short stature",
        "reason": "already_in_anchors"
      },
      {
        "label": "Pulmonary valve stenosis",
        "reason": "already_in_anchors"
      },
      {
        "label": "nasogastric tube",
        "reason": "treatment_or_management"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "widely spaced eyes",
        "status": "present"
      },
      {
        "label": "coagulation factor deficiency",
        "status": "present"
      },
      {
        "label": "platelet dysfunction",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Noonan Syndrome",
      "clinical_text": "Characteristic facial features include widely spaced eyes, low-set posteriorly rotated ears, and a deeply grooved philtrum. Webbed neck (pterygium colli) is present in approximately 25% of individuals. Pectus excavatum and pectus carinatum are common chest deformities. Cryptorchidism is found in the majority of affected males. Feeding difficulties in infancy often require nasogastric tube support. Mild intellectual disability is present in approximately one third of individuals, though many have normal cognition. Coagulation factor deficiencies and platelet dysfunction contribute to a bleeding tendency. Lymphedema may be present at birth or develop later.",
      "paragraph_count": 1,
      "sentence_count": 8,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Characteristic facial features include widely spaced eyes, low-set posteriorly rotated ears, and a deeply grooved philtrum. Webbed neck (pterygium colli) is present in approximately 25% of individuals. Pectus excavatum and pectus carinatum are common chest deformities. Cryptorchidism is found in the majority of affected males. Feeding difficulties in infancy often require nasogastric tube support. Mild intellectual disability is present in approximately one third of individuals, though many have normal cognition. Coagulation factor deficiencies and platelet dysfunction contribute to a bleeding tendency. Lymphedema may be present at birth or develop later.",
          "char_start": 0,
          "char_end": 663,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Characteristic facial features include widely spaced eyes, low-set posteriorly rotated ears, and a deeply grooved philtrum.",
              "char_start": 0,
              "char_end": 123
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Webbed neck (pterygium colli) is present in approximately 25% of individuals.",
              "char_start": 124,
              "char_end": 201
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Pectus excavatum and pectus carinatum are common chest deformities.",
              "char_start": 202,
              "char_end": 269
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Cryptorchidism is found in the majority of affected males.",
              "char_start": 270,
              "char_end": 328
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Feeding difficulties in infancy often require nasogastric tube support.",
              "char_start": 329,
              "char_end": 400
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Mild intellectual disability is present in approximately one third of individuals, though many have normal cognition.",
              "char_start": 401,
              "char_end": 518
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Coagulation factor deficiencies and platelet dysfunction contribute to a bleeding tendency.",
              "char_start": 519,
              "char_end": 610
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Lymphedema may be present at birth or develop later.",
              "char_start": 611,
              "char_end": 663
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Characteristic facial features include widely spaced eyes, low-set posteriorly rotated ears, and a deeply grooved philtrum.",
          "char_start": 0,
          "char_end": 123
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Webbed neck (pterygium colli) is present in approximately 25% of individuals.",
          "char_start": 124,
          "char_end": 201
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Pectus excavatum and pectus carinatum are common chest deformities.",
          "char_start": 202,
          "char_end": 269
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Cryptorchidism is found in the majority of affected males.",
          "char_start": 270,
          "char_end": 328
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Feeding difficulties in infancy often require nasogastric tube support.",
          "char_start": 329,
          "char_end": 400
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Mild intellectual disability is present in approximately one third of individuals, though many have normal cognition.",
          "char_start": 401,
          "char_end": 518
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Coagulation factor deficiencies and platelet dysfunction contribute to a bleeding tendency.",
          "char_start": 519,
          "char_end": 610
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Lymphedema may be present at birth or develop later.",
          "char_start": 611,
          "char_end": 663
        }
      ]
    }
  },
  {
    "id": "disc-011",
    "chapter_title": "Phenylketonuria",
    "existing_anchors": [
      {
        "hpo_label": "Intellectual disability",
        "match_texts": [
          "intellectual disability",
          "intellectual impairment"
        ]
      }
    ],
    "clinical_text": "Untreated infants appear normal at birth but develop progressive cognitive decline during the first year of life. Microcephaly, seizures, and eczematous skin rash are common in untreated individuals. A characteristic musty or mousy body odor results from phenylalanine metabolites. Lighter hair and skin pigmentation relative to unaffected siblings is observed due to impaired melanin synthesis. Behavioral abnormalities including hyperactivity, self-injurious behavior, and anxiety are well described. Treatment with a phenylalanine-restricted diet initiated in the newborn period prevents most neurological complications.",
    "expectedNewCandidates": [
      {
        "label": "microcephaly",
        "status": "present"
      },
      {
        "label": "seizures",
        "status": "present"
      },
      {
        "label": "eczematous skin rash",
        "status": "present"
      },
      {
        "label": "musty body odor",
        "status": "present"
      },
      {
        "label": "hypopigmentation",
        "status": "present"
      },
      {
        "label": "hyperactivity",
        "status": "present"
      },
      {
        "label": "self-injurious behavior",
        "status": "present"
      },
      {
        "label": "anxiety",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Intellectual disability",
        "reason": "already_in_anchors"
      },
      {
        "label": "phenylalanine-restricted diet",
        "reason": "treatment_or_management"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "cognitive decline",
        "status": "present"
      },
      {
        "label": "light hair",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Phenylketonuria",
      "clinical_text": "Untreated infants appear normal at birth but develop progressive cognitive decline during the first year of life. Microcephaly, seizures, and eczematous skin rash are common in untreated individuals. A characteristic musty or mousy body odor results from phenylalanine metabolites. Lighter hair and skin pigmentation relative to unaffected siblings is observed due to impaired melanin synthesis. Behavioral abnormalities including hyperactivity, self-injurious behavior, and anxiety are well described. Treatment with a phenylalanine-restricted diet initiated in the newborn period prevents most neurological complications.",
      "paragraph_count": 1,
      "sentence_count": 6,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Untreated infants appear normal at birth but develop progressive cognitive decline during the first year of life. Microcephaly, seizures, and eczematous skin rash are common in untreated individuals. A characteristic musty or mousy body odor results from phenylalanine metabolites. Lighter hair and skin pigmentation relative to unaffected siblings is observed due to impaired melanin synthesis. Behavioral abnormalities including hyperactivity, self-injurious behavior, and anxiety are well described. Treatment with a phenylalanine-restricted diet initiated in the newborn period prevents most neurological complications.",
          "char_start": 0,
          "char_end": 623,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Untreated infants appear normal at birth but develop progressive cognitive decline during the first year of life.",
              "char_start": 0,
              "char_end": 113
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Microcephaly, seizures, and eczematous skin rash are common in untreated individuals.",
              "char_start": 114,
              "char_end": 199
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "A characteristic musty or mousy body odor results from phenylalanine metabolites.",
              "char_start": 200,
              "char_end": 281
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Lighter hair and skin pigmentation relative to unaffected siblings is observed due to impaired melanin synthesis.",
              "char_start": 282,
              "char_end": 395
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Behavioral abnormalities including hyperactivity, self-injurious behavior, and anxiety are well described.",
              "char_start": 396,
              "char_end": 502
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Treatment with a phenylalanine-restricted diet initiated in the newborn period prevents most neurological complications.",
              "char_start": 503,
              "char_end": 623
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Untreated infants appear normal at birth but develop progressive cognitive decline during the first year of life.",
          "char_start": 0,
          "char_end": 113
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Microcephaly, seizures, and eczematous skin rash are common in untreated individuals.",
          "char_start": 114,
          "char_end": 199
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "A characteristic musty or mousy body odor results from phenylalanine metabolites.",
          "char_start": 200,
          "char_end": 281
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Lighter hair and skin pigmentation relative to unaffected siblings is observed due to impaired melanin synthesis.",
          "char_start": 282,
          "char_end": 395
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Behavioral abnormalities including hyperactivity, self-injurious behavior, and anxiety are well described.",
          "char_start": 396,
          "char_end": 502
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Treatment with a phenylalanine-restricted diet initiated in the newborn period prevents most neurological complications.",
          "char_start": 503,
          "char_end": 623
        }
      ]
    }
  },
  {
    "id": "disc-012",
    "chapter_title": "Ehlers-Danlos Syndrome, Classical Type",
    "existing_anchors": [
      {
        "hpo_label": "Joint hypermobility",
        "match_texts": [
          "joint hypermobility",
          "generalized joint hypermobility"
        ]
      },
      {
        "hpo_label": "Skin hyperextensibility",
        "match_texts": [
          "skin hyperextensibility"
        ]
      }
    ],
    "clinical_text": "Skin fragility with easy bruising is a hallmark. Atrophic scarring, particularly over the knees, elbows, and forehead, produces characteristic \"cigarette paper\" scars. Molluscoid pseudotumors may develop at pressure points. Recurrent joint dislocations, especially of the shoulder and patella, are common. Chronic pain is reported by the majority of adults. Mitral valve prolapse has been identified in a subset of individuals. Premature rupture of membranes may complicate pregnancies. Wound healing is typically delayed.",
    "expectedNewCandidates": [
      {
        "label": "skin fragility",
        "status": "present"
      },
      {
        "label": "easy bruising",
        "status": "present"
      },
      {
        "label": "atrophic scarring",
        "status": "present"
      },
      {
        "label": "molluscoid pseudotumors",
        "status": "present"
      },
      {
        "label": "recurrent joint dislocations",
        "status": "present"
      },
      {
        "label": "chronic pain",
        "status": "present"
      },
      {
        "label": "mitral valve prolapse",
        "status": "present"
      },
      {
        "label": "delayed wound healing",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Joint hypermobility",
        "reason": "already_in_anchors"
      },
      {
        "label": "Skin hyperextensibility",
        "reason": "already_in_anchors"
      },
      {
        "label": "premature rupture of membranes",
        "reason": "not_a_phenotype"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "shoulder dislocation",
        "status": "present"
      },
      {
        "label": "patellar dislocation",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Ehlers-Danlos Syndrome, Classical Type",
      "clinical_text": "Skin fragility with easy bruising is a hallmark. Atrophic scarring, particularly over the knees, elbows, and forehead, produces characteristic \"cigarette paper\" scars. Molluscoid pseudotumors may develop at pressure points. Recurrent joint dislocations, especially of the shoulder and patella, are common. Chronic pain is reported by the majority of adults. Mitral valve prolapse has been identified in a subset of individuals. Premature rupture of membranes may complicate pregnancies. Wound healing is typically delayed.",
      "paragraph_count": 1,
      "sentence_count": 8,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Skin fragility with easy bruising is a hallmark. Atrophic scarring, particularly over the knees, elbows, and forehead, produces characteristic \"cigarette paper\" scars. Molluscoid pseudotumors may develop at pressure points. Recurrent joint dislocations, especially of the shoulder and patella, are common. Chronic pain is reported by the majority of adults. Mitral valve prolapse has been identified in a subset of individuals. Premature rupture of membranes may complicate pregnancies. Wound healing is typically delayed.",
          "char_start": 0,
          "char_end": 522,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Skin fragility with easy bruising is a hallmark.",
              "char_start": 0,
              "char_end": 48
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Atrophic scarring, particularly over the knees, elbows, and forehead, produces characteristic \"cigarette paper\" scars.",
              "char_start": 49,
              "char_end": 167
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Molluscoid pseudotumors may develop at pressure points.",
              "char_start": 168,
              "char_end": 223
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Recurrent joint dislocations, especially of the shoulder and patella, are common.",
              "char_start": 224,
              "char_end": 305
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Chronic pain is reported by the majority of adults.",
              "char_start": 306,
              "char_end": 357
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Mitral valve prolapse has been identified in a subset of individuals.",
              "char_start": 358,
              "char_end": 427
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Premature rupture of membranes may complicate pregnancies.",
              "char_start": 428,
              "char_end": 486
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Wound healing is typically delayed.",
              "char_start": 487,
              "char_end": 522
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Skin fragility with easy bruising is a hallmark.",
          "char_start": 0,
          "char_end": 48
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Atrophic scarring, particularly over the knees, elbows, and forehead, produces characteristic \"cigarette paper\" scars.",
          "char_start": 49,
          "char_end": 167
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Molluscoid pseudotumors may develop at pressure points.",
          "char_start": 168,
          "char_end": 223
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Recurrent joint dislocations, especially of the shoulder and patella, are common.",
          "char_start": 224,
          "char_end": 305
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Chronic pain is reported by the majority of adults.",
          "char_start": 306,
          "char_end": 357
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Mitral valve prolapse has been identified in a subset of individuals.",
          "char_start": 358,
          "char_end": 427
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Premature rupture of membranes may complicate pregnancies.",
          "char_start": 428,
          "char_end": 486
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Wound healing is typically delayed.",
          "char_start": 487,
          "char_end": 522
        }
      ]
    }
  },
  {
    "id": "disc-013",
    "chapter_title": "Huntington Disease",
    "existing_anchors": [
      {
        "hpo_label": "Chorea",
        "match_texts": [
          "chorea",
          "choreiform movements"
        ]
      }
    ],
    "clinical_text": "The clinical triad consists of motor impairment, cognitive decline, and psychiatric disturbance. Personality changes, depression, and irritability often precede the onset of motor symptoms by several years. As the disease advances, rigidity and bradykinesia replace chorea as the dominant motor features. Dysarthria and dysphagia become progressively severe. Weight loss is common and multifactorial. Eye movement abnormalities, particularly impaired saccade initiation, are an early finding. The juvenile form, accounting for approximately 5% of cases, presents with parkinsonism, seizures, and rapid cognitive deterioration. HTT CAG repeat length is the primary determinant of age at onset.",
    "expectedNewCandidates": [
      {
        "label": "cognitive decline",
        "status": "present"
      },
      {
        "label": "depression",
        "status": "present"
      },
      {
        "label": "irritability",
        "status": "present"
      },
      {
        "label": "rigidity",
        "status": "present"
      },
      {
        "label": "bradykinesia",
        "status": "present"
      },
      {
        "label": "dysarthria",
        "status": "present"
      },
      {
        "label": "dysphagia",
        "status": "present"
      },
      {
        "label": "weight loss",
        "status": "present"
      },
      {
        "label": "impaired saccade initiation",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Chorea",
        "reason": "already_in_anchors"
      },
      {
        "label": "HTT",
        "reason": "gene_or_variant"
      },
      {
        "label": "CAG repeat",
        "reason": "gene_or_variant"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "personality changes",
        "status": "present"
      },
      {
        "label": "parkinsonism",
        "status": "present"
      },
      {
        "label": "seizures",
        "status": "present"
      },
      {
        "label": "eye movement abnormalities",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Huntington Disease",
      "clinical_text": "The clinical triad consists of motor impairment, cognitive decline, and psychiatric disturbance. Personality changes, depression, and irritability often precede the onset of motor symptoms by several years. As the disease advances, rigidity and bradykinesia replace chorea as the dominant motor features. Dysarthria and dysphagia become progressively severe. Weight loss is common and multifactorial. Eye movement abnormalities, particularly impaired saccade initiation, are an early finding. The juvenile form, accounting for approximately 5% of cases, presents with parkinsonism, seizures, and rapid cognitive deterioration. HTT CAG repeat length is the primary determinant of age at onset.",
      "paragraph_count": 1,
      "sentence_count": 8,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "The clinical triad consists of motor impairment, cognitive decline, and psychiatric disturbance. Personality changes, depression, and irritability often precede the onset of motor symptoms by several years. As the disease advances, rigidity and bradykinesia replace chorea as the dominant motor features. Dysarthria and dysphagia become progressively severe. Weight loss is common and multifactorial. Eye movement abnormalities, particularly impaired saccade initiation, are an early finding. The juvenile form, accounting for approximately 5% of cases, presents with parkinsonism, seizures, and rapid cognitive deterioration. HTT CAG repeat length is the primary determinant of age at onset.",
          "char_start": 0,
          "char_end": 692,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "The clinical triad consists of motor impairment, cognitive decline, and psychiatric disturbance.",
              "char_start": 0,
              "char_end": 96
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Personality changes, depression, and irritability often precede the onset of motor symptoms by several years.",
              "char_start": 97,
              "char_end": 206
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "As the disease advances, rigidity and bradykinesia replace chorea as the dominant motor features.",
              "char_start": 207,
              "char_end": 304
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Dysarthria and dysphagia become progressively severe.",
              "char_start": 305,
              "char_end": 358
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Weight loss is common and multifactorial.",
              "char_start": 359,
              "char_end": 400
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Eye movement abnormalities, particularly impaired saccade initiation, are an early finding.",
              "char_start": 401,
              "char_end": 492
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "The juvenile form, accounting for approximately 5% of cases, presents with parkinsonism, seizures, and rapid cognitive deterioration.",
              "char_start": 493,
              "char_end": 626
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "HTT CAG repeat length is the primary determinant of age at onset.",
              "char_start": 627,
              "char_end": 692
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "The clinical triad consists of motor impairment, cognitive decline, and psychiatric disturbance.",
          "char_start": 0,
          "char_end": 96
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Personality changes, depression, and irritability often precede the onset of motor symptoms by several years.",
          "char_start": 97,
          "char_end": 206
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "As the disease advances, rigidity and bradykinesia replace chorea as the dominant motor features.",
          "char_start": 207,
          "char_end": 304
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Dysarthria and dysphagia become progressively severe.",
          "char_start": 305,
          "char_end": 358
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Weight loss is common and multifactorial.",
          "char_start": 359,
          "char_end": 400
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Eye movement abnormalities, particularly impaired saccade initiation, are an early finding.",
          "char_start": 401,
          "char_end": 492
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "The juvenile form, accounting for approximately 5% of cases, presents with parkinsonism, seizures, and rapid cognitive deterioration.",
          "char_start": 493,
          "char_end": 626
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "HTT CAG repeat length is the primary determinant of age at onset.",
          "char_start": 627,
          "char_end": 692
        }
      ]
    }
  },
  {
    "id": "disc-014",
    "chapter_title": "Cystic Fibrosis",
    "existing_anchors": [
      {
        "hpo_label": "Recurrent respiratory infections",
        "match_texts": [
          "recurrent pulmonary infections",
          "recurrent respiratory infections"
        ]
      },
      {
        "hpo_label": "Exocrine pancreatic insufficiency",
        "match_texts": [
          "pancreatic insufficiency"
        ]
      }
    ],
    "clinical_text": "Chronic sinusitis with nasal polyposis is common. Progressive bronchiectasis leads to respiratory failure, which remains the primary cause of morbidity and mortality. Meconium ileus presents in approximately 15% of affected neonates. Males are almost universally infertile due to congenital bilateral absence of the vas deferens. Hepatobiliary complications including focal biliary cirrhosis develop in a subset of patients. CF-related diabetes mellitus increases in prevalence with age. Growth failure and nutritional deficiency are common despite enzyme replacement therapy. Clubbing of the digits develops in patients with chronic pulmonary disease.",
    "expectedNewCandidates": [
      {
        "label": "chronic sinusitis",
        "status": "present"
      },
      {
        "label": "nasal polyposis",
        "status": "present"
      },
      {
        "label": "bronchiectasis",
        "status": "present"
      },
      {
        "label": "respiratory failure",
        "status": "present"
      },
      {
        "label": "meconium ileus",
        "status": "present"
      },
      {
        "label": "infertility",
        "status": "present"
      },
      {
        "label": "congenital bilateral absence of the vas deferens",
        "status": "present"
      },
      {
        "label": "focal biliary cirrhosis",
        "status": "present"
      },
      {
        "label": "diabetes mellitus",
        "status": "present"
      },
      {
        "label": "growth failure",
        "status": "present"
      },
      {
        "label": "digital clubbing",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Recurrent respiratory infections",
        "reason": "already_in_anchors"
      },
      {
        "label": "Exocrine pancreatic insufficiency",
        "reason": "already_in_anchors"
      },
      {
        "label": "enzyme replacement therapy",
        "reason": "treatment_or_management"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "nutritional deficiency",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Cystic Fibrosis",
      "clinical_text": "Chronic sinusitis with nasal polyposis is common. Progressive bronchiectasis leads to respiratory failure, which remains the primary cause of morbidity and mortality. Meconium ileus presents in approximately 15% of affected neonates. Males are almost universally infertile due to congenital bilateral absence of the vas deferens. Hepatobiliary complications including focal biliary cirrhosis develop in a subset of patients. CF-related diabetes mellitus increases in prevalence with age. Growth failure and nutritional deficiency are common despite enzyme replacement therapy. Clubbing of the digits develops in patients with chronic pulmonary disease.",
      "paragraph_count": 1,
      "sentence_count": 8,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Chronic sinusitis with nasal polyposis is common. Progressive bronchiectasis leads to respiratory failure, which remains the primary cause of morbidity and mortality. Meconium ileus presents in approximately 15% of affected neonates. Males are almost universally infertile due to congenital bilateral absence of the vas deferens. Hepatobiliary complications including focal biliary cirrhosis develop in a subset of patients. CF-related diabetes mellitus increases in prevalence with age. Growth failure and nutritional deficiency are common despite enzyme replacement therapy. Clubbing of the digits develops in patients with chronic pulmonary disease.",
          "char_start": 0,
          "char_end": 652,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Chronic sinusitis with nasal polyposis is common.",
              "char_start": 0,
              "char_end": 49
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Progressive bronchiectasis leads to respiratory failure, which remains the primary cause of morbidity and mortality.",
              "char_start": 50,
              "char_end": 166
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Meconium ileus presents in approximately 15% of affected neonates.",
              "char_start": 167,
              "char_end": 233
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Males are almost universally infertile due to congenital bilateral absence of the vas deferens.",
              "char_start": 234,
              "char_end": 329
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Hepatobiliary complications including focal biliary cirrhosis develop in a subset of patients.",
              "char_start": 330,
              "char_end": 424
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "CF-related diabetes mellitus increases in prevalence with age.",
              "char_start": 425,
              "char_end": 487
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Growth failure and nutritional deficiency are common despite enzyme replacement therapy.",
              "char_start": 488,
              "char_end": 576
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Clubbing of the digits develops in patients with chronic pulmonary disease.",
              "char_start": 577,
              "char_end": 652
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Chronic sinusitis with nasal polyposis is common.",
          "char_start": 0,
          "char_end": 49
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Progressive bronchiectasis leads to respiratory failure, which remains the primary cause of morbidity and mortality.",
          "char_start": 50,
          "char_end": 166
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Meconium ileus presents in approximately 15% of affected neonates.",
          "char_start": 167,
          "char_end": 233
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Males are almost universally infertile due to congenital bilateral absence of the vas deferens.",
          "char_start": 234,
          "char_end": 329
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Hepatobiliary complications including focal biliary cirrhosis develop in a subset of patients.",
          "char_start": 330,
          "char_end": 424
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "CF-related diabetes mellitus increases in prevalence with age.",
          "char_start": 425,
          "char_end": 487
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Growth failure and nutritional deficiency are common despite enzyme replacement therapy.",
          "char_start": 488,
          "char_end": 576
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Clubbing of the digits develops in patients with chronic pulmonary disease.",
          "char_start": 577,
          "char_end": 652
        }
      ]
    }
  },
  {
    "id": "disc-015",
    "chapter_title": "Spinal Muscular Atrophy",
    "existing_anchors": [
      {
        "hpo_label": "Hypotonia",
        "match_texts": [
          "hypotonia",
          "severe hypotonia"
        ]
      },
      {
        "hpo_label": "Muscle weakness",
        "match_texts": [
          "progressive muscle weakness"
        ]
      }
    ],
    "clinical_text": "In the most severe form (SMA type I), affected infants never achieve the ability to sit without support. Fasciculations of the tongue are a characteristic finding. Deep tendon reflexes are absent. Respiratory failure from intercostal muscle weakness occurs in the first two years. Paradoxical breathing with a bell-shaped chest deformity results from diaphragmatic predominance. Feeding difficulties and failure to thrive are common. Scoliosis develops after loss of ambulation in later-onset forms. Joint contractures may develop in non-ambulatory patients. Cognition is normal.",
    "expectedNewCandidates": [
      {
        "label": "inability to sit without support",
        "status": "present"
      },
      {
        "label": "tongue fasciculations",
        "status": "present"
      },
      {
        "label": "absent deep tendon reflexes",
        "status": "present"
      },
      {
        "label": "respiratory failure",
        "status": "present"
      },
      {
        "label": "bell-shaped chest",
        "status": "present"
      },
      {
        "label": "feeding difficulties",
        "status": "present"
      },
      {
        "label": "failure to thrive",
        "status": "present"
      },
      {
        "label": "scoliosis",
        "status": "present"
      },
      {
        "label": "joint contractures",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Hypotonia",
        "reason": "already_in_anchors"
      },
      {
        "label": "Muscle weakness",
        "reason": "already_in_anchors"
      },
      {
        "label": "cognition",
        "reason": "normal_or_preserved"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "areflexia",
        "status": "present"
      },
      {
        "label": "paradoxical breathing",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Spinal Muscular Atrophy",
      "clinical_text": "In the most severe form (SMA type I), affected infants never achieve the ability to sit without support. Fasciculations of the tongue are a characteristic finding. Deep tendon reflexes are absent. Respiratory failure from intercostal muscle weakness occurs in the first two years. Paradoxical breathing with a bell-shaped chest deformity results from diaphragmatic predominance. Feeding difficulties and failure to thrive are common. Scoliosis develops after loss of ambulation in later-onset forms. Joint contractures may develop in non-ambulatory patients. Cognition is normal.",
      "paragraph_count": 1,
      "sentence_count": 9,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "In the most severe form (SMA type I), affected infants never achieve the ability to sit without support. Fasciculations of the tongue are a characteristic finding. Deep tendon reflexes are absent. Respiratory failure from intercostal muscle weakness occurs in the first two years. Paradoxical breathing with a bell-shaped chest deformity results from diaphragmatic predominance. Feeding difficulties and failure to thrive are common. Scoliosis develops after loss of ambulation in later-onset forms. Joint contractures may develop in non-ambulatory patients. Cognition is normal.",
          "char_start": 0,
          "char_end": 579,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "In the most severe form (SMA type I), affected infants never achieve the ability to sit without support.",
              "char_start": 0,
              "char_end": 104
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Fasciculations of the tongue are a characteristic finding.",
              "char_start": 105,
              "char_end": 163
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Deep tendon reflexes are absent.",
              "char_start": 164,
              "char_end": 196
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Respiratory failure from intercostal muscle weakness occurs in the first two years.",
              "char_start": 197,
              "char_end": 280
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Paradoxical breathing with a bell-shaped chest deformity results from diaphragmatic predominance.",
              "char_start": 281,
              "char_end": 378
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Feeding difficulties and failure to thrive are common.",
              "char_start": 379,
              "char_end": 433
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Scoliosis develops after loss of ambulation in later-onset forms.",
              "char_start": 434,
              "char_end": 499
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Joint contractures may develop in non-ambulatory patients.",
              "char_start": 500,
              "char_end": 558
            },
            {
              "sentence_id": "p1_s9",
              "sentence_index": 9,
              "text": "Cognition is normal.",
              "char_start": 559,
              "char_end": 579
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "In the most severe form (SMA type I), affected infants never achieve the ability to sit without support.",
          "char_start": 0,
          "char_end": 104
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Fasciculations of the tongue are a characteristic finding.",
          "char_start": 105,
          "char_end": 163
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Deep tendon reflexes are absent.",
          "char_start": 164,
          "char_end": 196
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Respiratory failure from intercostal muscle weakness occurs in the first two years.",
          "char_start": 197,
          "char_end": 280
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Paradoxical breathing with a bell-shaped chest deformity results from diaphragmatic predominance.",
          "char_start": 281,
          "char_end": 378
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Feeding difficulties and failure to thrive are common.",
          "char_start": 379,
          "char_end": 433
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Scoliosis develops after loss of ambulation in later-onset forms.",
          "char_start": 434,
          "char_end": 499
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Joint contractures may develop in non-ambulatory patients.",
          "char_start": 500,
          "char_end": 558
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s9",
          "sentence_index": 9,
          "text": "Cognition is normal.",
          "char_start": 559,
          "char_end": 579
        }
      ]
    }
  },
  {
    "id": "disc-016",
    "chapter_title": "Achondroplasia",
    "existing_anchors": [
      {
        "hpo_label": "Short stature",
        "match_texts": [
          "short stature",
          "disproportionate short stature"
        ]
      },
      {
        "hpo_label": "Rhizomelic limb shortening",
        "match_texts": [
          "rhizomelic shortening"
        ]
      }
    ],
    "clinical_text": "Macrocephaly with frontal bossing is present at birth. Midface hypoplasia contributes to upper airway obstruction and obstructive sleep apnea. Foramen magnum stenosis can cause cervicomedullary compression in infancy. Spinal stenosis with neurogenic claudication develops in adulthood. Trident hand configuration is characteristic. Genu varum (bow legs) is typical. Motor milestones are delayed relative to average but intelligence is normal. Recurrent otitis media is common during childhood and may lead to conductive hearing loss. FGFR3 gain-of-function variants account for essentially all cases.",
    "expectedNewCandidates": [
      {
        "label": "macrocephaly",
        "status": "present"
      },
      {
        "label": "frontal bossing",
        "status": "present"
      },
      {
        "label": "midface hypoplasia",
        "status": "present"
      },
      {
        "label": "obstructive sleep apnea",
        "status": "present"
      },
      {
        "label": "foramen magnum stenosis",
        "status": "present"
      },
      {
        "label": "spinal stenosis",
        "status": "present"
      },
      {
        "label": "trident hand",
        "status": "present"
      },
      {
        "label": "genu varum",
        "status": "present"
      },
      {
        "label": "delayed motor milestones",
        "status": "present"
      },
      {
        "label": "recurrent otitis media",
        "status": "present"
      },
      {
        "label": "conductive hearing loss",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Short stature",
        "reason": "already_in_anchors"
      },
      {
        "label": "Rhizomelic limb shortening",
        "reason": "already_in_anchors"
      },
      {
        "label": "intelligence",
        "reason": "normal_or_preserved"
      },
      {
        "label": "FGFR3",
        "reason": "gene_or_variant"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "upper airway obstruction",
        "status": "present"
      },
      {
        "label": "cervicomedullary compression",
        "status": "present"
      },
      {
        "label": "neurogenic claudication",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Achondroplasia",
      "clinical_text": "Macrocephaly with frontal bossing is present at birth. Midface hypoplasia contributes to upper airway obstruction and obstructive sleep apnea. Foramen magnum stenosis can cause cervicomedullary compression in infancy. Spinal stenosis with neurogenic claudication develops in adulthood. Trident hand configuration is characteristic. Genu varum (bow legs) is typical. Motor milestones are delayed relative to average but intelligence is normal. Recurrent otitis media is common during childhood and may lead to conductive hearing loss. FGFR3 gain-of-function variants account for essentially all cases.",
      "paragraph_count": 1,
      "sentence_count": 9,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Macrocephaly with frontal bossing is present at birth. Midface hypoplasia contributes to upper airway obstruction and obstructive sleep apnea. Foramen magnum stenosis can cause cervicomedullary compression in infancy. Spinal stenosis with neurogenic claudication develops in adulthood. Trident hand configuration is characteristic. Genu varum (bow legs) is typical. Motor milestones are delayed relative to average but intelligence is normal. Recurrent otitis media is common during childhood and may lead to conductive hearing loss. FGFR3 gain-of-function variants account for essentially all cases.",
          "char_start": 0,
          "char_end": 600,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Macrocephaly with frontal bossing is present at birth.",
              "char_start": 0,
              "char_end": 54
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Midface hypoplasia contributes to upper airway obstruction and obstructive sleep apnea.",
              "char_start": 55,
              "char_end": 142
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Foramen magnum stenosis can cause cervicomedullary compression in infancy.",
              "char_start": 143,
              "char_end": 217
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Spinal stenosis with neurogenic claudication develops in adulthood.",
              "char_start": 218,
              "char_end": 285
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Trident hand configuration is characteristic.",
              "char_start": 286,
              "char_end": 331
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Genu varum (bow legs) is typical.",
              "char_start": 332,
              "char_end": 365
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Motor milestones are delayed relative to average but intelligence is normal.",
              "char_start": 366,
              "char_end": 442
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Recurrent otitis media is common during childhood and may lead to conductive hearing loss.",
              "char_start": 443,
              "char_end": 533
            },
            {
              "sentence_id": "p1_s9",
              "sentence_index": 9,
              "text": "FGFR3 gain-of-function variants account for essentially all cases.",
              "char_start": 534,
              "char_end": 600
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Macrocephaly with frontal bossing is present at birth.",
          "char_start": 0,
          "char_end": 54
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Midface hypoplasia contributes to upper airway obstruction and obstructive sleep apnea.",
          "char_start": 55,
          "char_end": 142
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Foramen magnum stenosis can cause cervicomedullary compression in infancy.",
          "char_start": 143,
          "char_end": 217
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Spinal stenosis with neurogenic claudication develops in adulthood.",
          "char_start": 218,
          "char_end": 285
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Trident hand configuration is characteristic.",
          "char_start": 286,
          "char_end": 331
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Genu varum (bow legs) is typical.",
          "char_start": 332,
          "char_end": 365
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Motor milestones are delayed relative to average but intelligence is normal.",
          "char_start": 366,
          "char_end": 442
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Recurrent otitis media is common during childhood and may lead to conductive hearing loss.",
          "char_start": 443,
          "char_end": 533
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s9",
          "sentence_index": 9,
          "text": "FGFR3 gain-of-function variants account for essentially all cases.",
          "char_start": 534,
          "char_end": 600
        }
      ]
    }
  },
  {
    "id": "disc-017",
    "chapter_title": "Sickle Cell Disease",
    "existing_anchors": [
      {
        "hpo_label": "Hemolytic anemia",
        "match_texts": [
          "chronic hemolytic anemia"
        ]
      }
    ],
    "clinical_text": "Vaso-occlusive pain crises are the hallmark clinical event. Splenic sequestration crises occur primarily in early childhood, and functional asplenia develops by age 5 in most patients with the homozygous form. Acute chest syndrome, characterized by fever, chest pain, and pulmonary infiltrate, is a leading cause of hospitalization. Stroke occurs in approximately 10% of children. Avascular necrosis of the femoral head causes chronic hip pain in adults. Priapism affects approximately 35% of males. Chronic kidney disease develops in many adults. Retinopathy, particularly the proliferative form, is a significant complication. Hydroxyurea therapy reduces the frequency of pain crises and acute chest syndrome.",
    "expectedNewCandidates": [
      {
        "label": "vaso-occlusive pain crises",
        "status": "present"
      },
      {
        "label": "splenic sequestration",
        "status": "present"
      },
      {
        "label": "functional asplenia",
        "status": "present"
      },
      {
        "label": "acute chest syndrome",
        "status": "present"
      },
      {
        "label": "stroke",
        "status": "present"
      },
      {
        "label": "avascular necrosis",
        "status": "present"
      },
      {
        "label": "priapism",
        "status": "present"
      },
      {
        "label": "chronic kidney disease",
        "status": "present"
      },
      {
        "label": "retinopathy",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Hemolytic anemia",
        "reason": "already_in_anchors"
      },
      {
        "label": "hydroxyurea",
        "reason": "treatment_or_management"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "chronic hip pain",
        "status": "present"
      },
      {
        "label": "fever",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Sickle Cell Disease",
      "clinical_text": "Vaso-occlusive pain crises are the hallmark clinical event. Splenic sequestration crises occur primarily in early childhood, and functional asplenia develops by age 5 in most patients with the homozygous form. Acute chest syndrome, characterized by fever, chest pain, and pulmonary infiltrate, is a leading cause of hospitalization. Stroke occurs in approximately 10% of children. Avascular necrosis of the femoral head causes chronic hip pain in adults. Priapism affects approximately 35% of males. Chronic kidney disease develops in many adults. Retinopathy, particularly the proliferative form, is a significant complication. Hydroxyurea therapy reduces the frequency of pain crises and acute chest syndrome.",
      "paragraph_count": 1,
      "sentence_count": 9,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Vaso-occlusive pain crises are the hallmark clinical event. Splenic sequestration crises occur primarily in early childhood, and functional asplenia develops by age 5 in most patients with the homozygous form. Acute chest syndrome, characterized by fever, chest pain, and pulmonary infiltrate, is a leading cause of hospitalization. Stroke occurs in approximately 10% of children. Avascular necrosis of the femoral head causes chronic hip pain in adults. Priapism affects approximately 35% of males. Chronic kidney disease develops in many adults. Retinopathy, particularly the proliferative form, is a significant complication. Hydroxyurea therapy reduces the frequency of pain crises and acute chest syndrome.",
          "char_start": 0,
          "char_end": 711,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Vaso-occlusive pain crises are the hallmark clinical event.",
              "char_start": 0,
              "char_end": 59
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Splenic sequestration crises occur primarily in early childhood, and functional asplenia develops by age 5 in most patients with the homozygous form.",
              "char_start": 60,
              "char_end": 209
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Acute chest syndrome, characterized by fever, chest pain, and pulmonary infiltrate, is a leading cause of hospitalization.",
              "char_start": 210,
              "char_end": 332
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Stroke occurs in approximately 10% of children.",
              "char_start": 333,
              "char_end": 380
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Avascular necrosis of the femoral head causes chronic hip pain in adults.",
              "char_start": 381,
              "char_end": 454
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Priapism affects approximately 35% of males.",
              "char_start": 455,
              "char_end": 499
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Chronic kidney disease develops in many adults.",
              "char_start": 500,
              "char_end": 547
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Retinopathy, particularly the proliferative form, is a significant complication.",
              "char_start": 548,
              "char_end": 628
            },
            {
              "sentence_id": "p1_s9",
              "sentence_index": 9,
              "text": "Hydroxyurea therapy reduces the frequency of pain crises and acute chest syndrome.",
              "char_start": 629,
              "char_end": 711
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Vaso-occlusive pain crises are the hallmark clinical event.",
          "char_start": 0,
          "char_end": 59
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Splenic sequestration crises occur primarily in early childhood, and functional asplenia develops by age 5 in most patients with the homozygous form.",
          "char_start": 60,
          "char_end": 209
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Acute chest syndrome, characterized by fever, chest pain, and pulmonary infiltrate, is a leading cause of hospitalization.",
          "char_start": 210,
          "char_end": 332
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Stroke occurs in approximately 10% of children.",
          "char_start": 333,
          "char_end": 380
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Avascular necrosis of the femoral head causes chronic hip pain in adults.",
          "char_start": 381,
          "char_end": 454
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Priapism affects approximately 35% of males.",
          "char_start": 455,
          "char_end": 499
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Chronic kidney disease develops in many adults.",
          "char_start": 500,
          "char_end": 547
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Retinopathy, particularly the proliferative form, is a significant complication.",
          "char_start": 548,
          "char_end": 628
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s9",
          "sentence_index": 9,
          "text": "Hydroxyurea therapy reduces the frequency of pain crises and acute chest syndrome.",
          "char_start": 629,
          "char_end": 711
        }
      ]
    }
  },
  {
    "id": "disc-019",
    "chapter_title": "Osteogenesis Imperfecta",
    "existing_anchors": [
      {
        "hpo_label": "Recurrent fractures",
        "match_texts": [
          "recurrent fractures",
          "multiple fractures"
        ]
      },
      {
        "hpo_label": "Blue sclerae",
        "match_texts": [
          "blue sclerae"
        ]
      }
    ],
    "clinical_text": "Short stature is proportionate and ranges from mildly to severely affected depending on the type. Dentinogenesis imperfecta, characterized by translucent, discolored teeth prone to fracture, occurs in some subtypes. Progressive hearing loss, typically mixed conductive and sensorineural, develops in adulthood. Joint hypermobility is common in milder forms. Basilar invagination, in which the odontoid process migrates superiorly, can cause serious neurological compromise. Wormian bones are frequently observed on skull radiographs. Bone density measurements are routinely low. Bisphosphonate therapy is the mainstay of medical management.",
    "expectedNewCandidates": [
      {
        "label": "short stature",
        "status": "present"
      },
      {
        "label": "dentinogenesis imperfecta",
        "status": "present"
      },
      {
        "label": "progressive hearing loss",
        "status": "present"
      },
      {
        "label": "joint hypermobility",
        "status": "present"
      },
      {
        "label": "basilar invagination",
        "status": "present"
      },
      {
        "label": "Wormian bones",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Recurrent fractures",
        "reason": "already_in_anchors"
      },
      {
        "label": "Blue sclerae",
        "reason": "already_in_anchors"
      },
      {
        "label": "bone density measurements",
        "reason": "lab_or_test_method"
      },
      {
        "label": "bisphosphonate",
        "reason": "treatment_or_management"
      },
      {
        "label": "skull radiographs",
        "reason": "lab_or_test_method"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "decreased bone mineral density",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Osteogenesis Imperfecta",
      "clinical_text": "Short stature is proportionate and ranges from mildly to severely affected depending on the type. Dentinogenesis imperfecta, characterized by translucent, discolored teeth prone to fracture, occurs in some subtypes. Progressive hearing loss, typically mixed conductive and sensorineural, develops in adulthood. Joint hypermobility is common in milder forms. Basilar invagination, in which the odontoid process migrates superiorly, can cause serious neurological compromise. Wormian bones are frequently observed on skull radiographs. Bone density measurements are routinely low. Bisphosphonate therapy is the mainstay of medical management.",
      "paragraph_count": 1,
      "sentence_count": 8,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Short stature is proportionate and ranges from mildly to severely affected depending on the type. Dentinogenesis imperfecta, characterized by translucent, discolored teeth prone to fracture, occurs in some subtypes. Progressive hearing loss, typically mixed conductive and sensorineural, develops in adulthood. Joint hypermobility is common in milder forms. Basilar invagination, in which the odontoid process migrates superiorly, can cause serious neurological compromise. Wormian bones are frequently observed on skull radiographs. Bone density measurements are routinely low. Bisphosphonate therapy is the mainstay of medical management.",
          "char_start": 0,
          "char_end": 640,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Short stature is proportionate and ranges from mildly to severely affected depending on the type.",
              "char_start": 0,
              "char_end": 97
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Dentinogenesis imperfecta, characterized by translucent, discolored teeth prone to fracture, occurs in some subtypes.",
              "char_start": 98,
              "char_end": 215
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Progressive hearing loss, typically mixed conductive and sensorineural, develops in adulthood.",
              "char_start": 216,
              "char_end": 310
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Joint hypermobility is common in milder forms.",
              "char_start": 311,
              "char_end": 357
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Basilar invagination, in which the odontoid process migrates superiorly, can cause serious neurological compromise.",
              "char_start": 358,
              "char_end": 473
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Wormian bones are frequently observed on skull radiographs.",
              "char_start": 474,
              "char_end": 533
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Bone density measurements are routinely low.",
              "char_start": 534,
              "char_end": 578
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Bisphosphonate therapy is the mainstay of medical management.",
              "char_start": 579,
              "char_end": 640
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Short stature is proportionate and ranges from mildly to severely affected depending on the type.",
          "char_start": 0,
          "char_end": 97
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Dentinogenesis imperfecta, characterized by translucent, discolored teeth prone to fracture, occurs in some subtypes.",
          "char_start": 98,
          "char_end": 215
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Progressive hearing loss, typically mixed conductive and sensorineural, develops in adulthood.",
          "char_start": 216,
          "char_end": 310
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Joint hypermobility is common in milder forms.",
          "char_start": 311,
          "char_end": 357
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Basilar invagination, in which the odontoid process migrates superiorly, can cause serious neurological compromise.",
          "char_start": 358,
          "char_end": 473
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Wormian bones are frequently observed on skull radiographs.",
          "char_start": 474,
          "char_end": 533
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Bone density measurements are routinely low.",
          "char_start": 534,
          "char_end": 578
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Bisphosphonate therapy is the mainstay of medical management.",
          "char_start": 579,
          "char_end": 640
        }
      ]
    }
  },
  {
    "id": "disc-022",
    "chapter_title": "Hereditary Hemorrhagic Telangiectasia",
    "existing_anchors": [
      {
        "hpo_label": "Epistaxis",
        "match_texts": [
          "epistaxis",
          "recurrent nosebleeds"
        ]
      },
      {
        "hpo_label": "Telangiectasia",
        "match_texts": [
          "telangiectases",
          "mucocutaneous telangiectases"
        ]
      }
    ],
    "clinical_text": "Pulmonary arteriovenous malformations are found in approximately 50% of individuals and can cause hypoxemia, paradoxical emboli leading to stroke or brain abscess. Hepatic vascular malformations may result in high-output cardiac failure, portal hypertension, or biliary ischemia. Cerebral arteriovenous malformations occur in about 10%. Iron deficiency anemia results from chronic blood loss. Gastrointestinal bleeding from mucosal telangiectases increases with age and may require transfusion. The disorder is inherited in an autosomal dominant manner with age-related penetrance.",
    "expectedNewCandidates": [
      {
        "label": "pulmonary arteriovenous malformations",
        "status": "present"
      },
      {
        "label": "hypoxemia",
        "status": "present"
      },
      {
        "label": "stroke",
        "status": "present"
      },
      {
        "label": "brain abscess",
        "status": "present"
      },
      {
        "label": "hepatic vascular malformations",
        "status": "present"
      },
      {
        "label": "high-output cardiac failure",
        "status": "present"
      },
      {
        "label": "portal hypertension",
        "status": "present"
      },
      {
        "label": "cerebral arteriovenous malformations",
        "status": "present"
      },
      {
        "label": "iron deficiency anemia",
        "status": "present"
      },
      {
        "label": "gastrointestinal bleeding",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Epistaxis",
        "reason": "already_in_anchors"
      },
      {
        "label": "Telangiectasia",
        "reason": "already_in_anchors"
      },
      {
        "label": "autosomal dominant",
        "reason": "not_a_phenotype"
      },
      {
        "label": "transfusion",
        "reason": "treatment_or_management"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "biliary ischemia",
        "status": "present"
      },
      {
        "label": "paradoxical emboli",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Hereditary Hemorrhagic Telangiectasia",
      "clinical_text": "Pulmonary arteriovenous malformations are found in approximately 50% of individuals and can cause hypoxemia, paradoxical emboli leading to stroke or brain abscess. Hepatic vascular malformations may result in high-output cardiac failure, portal hypertension, or biliary ischemia. Cerebral arteriovenous malformations occur in about 10%. Iron deficiency anemia results from chronic blood loss. Gastrointestinal bleeding from mucosal telangiectases increases with age and may require transfusion. The disorder is inherited in an autosomal dominant manner with age-related penetrance.",
      "paragraph_count": 1,
      "sentence_count": 6,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Pulmonary arteriovenous malformations are found in approximately 50% of individuals and can cause hypoxemia, paradoxical emboli leading to stroke or brain abscess. Hepatic vascular malformations may result in high-output cardiac failure, portal hypertension, or biliary ischemia. Cerebral arteriovenous malformations occur in about 10%. Iron deficiency anemia results from chronic blood loss. Gastrointestinal bleeding from mucosal telangiectases increases with age and may require transfusion. The disorder is inherited in an autosomal dominant manner with age-related penetrance.",
          "char_start": 0,
          "char_end": 581,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Pulmonary arteriovenous malformations are found in approximately 50% of individuals and can cause hypoxemia, paradoxical emboli leading to stroke or brain abscess.",
              "char_start": 0,
              "char_end": 163
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Hepatic vascular malformations may result in high-output cardiac failure, portal hypertension, or biliary ischemia.",
              "char_start": 164,
              "char_end": 279
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Cerebral arteriovenous malformations occur in about 10%.",
              "char_start": 280,
              "char_end": 336
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Iron deficiency anemia results from chronic blood loss.",
              "char_start": 337,
              "char_end": 392
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Gastrointestinal bleeding from mucosal telangiectases increases with age and may require transfusion.",
              "char_start": 393,
              "char_end": 494
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "The disorder is inherited in an autosomal dominant manner with age-related penetrance.",
              "char_start": 495,
              "char_end": 581
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Pulmonary arteriovenous malformations are found in approximately 50% of individuals and can cause hypoxemia, paradoxical emboli leading to stroke or brain abscess.",
          "char_start": 0,
          "char_end": 163
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Hepatic vascular malformations may result in high-output cardiac failure, portal hypertension, or biliary ischemia.",
          "char_start": 164,
          "char_end": 279
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Cerebral arteriovenous malformations occur in about 10%.",
          "char_start": 280,
          "char_end": 336
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Iron deficiency anemia results from chronic blood loss.",
          "char_start": 337,
          "char_end": 392
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Gastrointestinal bleeding from mucosal telangiectases increases with age and may require transfusion.",
          "char_start": 393,
          "char_end": 494
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "The disorder is inherited in an autosomal dominant manner with age-related penetrance.",
          "char_start": 495,
          "char_end": 581
        }
      ]
    }
  },
  {
    "id": "disc-023",
    "chapter_title": "Gaucher Disease Type 1",
    "existing_anchors": [
      {
        "hpo_label": "Hepatosplenomegaly",
        "match_texts": [
          "hepatosplenomegaly",
          "splenomegaly"
        ]
      }
    ],
    "clinical_text": "Bone involvement is the primary source of morbidity and includes avascular necrosis, pathologic fractures, bone crises (episodes of acute bone pain), and Erlenmeyer flask deformity of the distal femur. Thrombocytopenia and anemia result from hypersplenism and marrow infiltration. Fatigue is a common complaint. Growth retardation is observed in some children. Pulmonary hypertension is a rare but serious complication. Neurologic involvement is absent in type 1 disease. Enzyme replacement therapy with imiglucerase or velaglucerase alfa is effective.",
    "expectedNewCandidates": [
      {
        "label": "avascular necrosis",
        "status": "present"
      },
      {
        "label": "pathologic fractures",
        "status": "present"
      },
      {
        "label": "bone crises",
        "status": "present"
      },
      {
        "label": "Erlenmeyer flask deformity",
        "status": "present"
      },
      {
        "label": "thrombocytopenia",
        "status": "present"
      },
      {
        "label": "anemia",
        "status": "present"
      },
      {
        "label": "fatigue",
        "status": "present"
      },
      {
        "label": "growth retardation",
        "status": "present"
      },
      {
        "label": "pulmonary hypertension",
        "status": "present"
      },
      {
        "label": "neurologic involvement",
        "status": "excluded"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Hepatosplenomegaly",
        "reason": "already_in_anchors"
      },
      {
        "label": "imiglucerase",
        "reason": "treatment_or_management"
      },
      {
        "label": "velaglucerase alfa",
        "reason": "treatment_or_management"
      },
      {
        "label": "enzyme replacement therapy",
        "reason": "treatment_or_management"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "hypersplenism",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Gaucher Disease Type 1",
      "clinical_text": "Bone involvement is the primary source of morbidity and includes avascular necrosis, pathologic fractures, bone crises (episodes of acute bone pain), and Erlenmeyer flask deformity of the distal femur. Thrombocytopenia and anemia result from hypersplenism and marrow infiltration. Fatigue is a common complaint. Growth retardation is observed in some children. Pulmonary hypertension is a rare but serious complication. Neurologic involvement is absent in type 1 disease. Enzyme replacement therapy with imiglucerase or velaglucerase alfa is effective.",
      "paragraph_count": 1,
      "sentence_count": 7,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Bone involvement is the primary source of morbidity and includes avascular necrosis, pathologic fractures, bone crises (episodes of acute bone pain), and Erlenmeyer flask deformity of the distal femur. Thrombocytopenia and anemia result from hypersplenism and marrow infiltration. Fatigue is a common complaint. Growth retardation is observed in some children. Pulmonary hypertension is a rare but serious complication. Neurologic involvement is absent in type 1 disease. Enzyme replacement therapy with imiglucerase or velaglucerase alfa is effective.",
          "char_start": 0,
          "char_end": 552,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Bone involvement is the primary source of morbidity and includes avascular necrosis, pathologic fractures, bone crises (episodes of acute bone pain), and Erlenmeyer flask deformity of the distal femur.",
              "char_start": 0,
              "char_end": 201
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Thrombocytopenia and anemia result from hypersplenism and marrow infiltration.",
              "char_start": 202,
              "char_end": 280
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Fatigue is a common complaint.",
              "char_start": 281,
              "char_end": 311
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Growth retardation is observed in some children.",
              "char_start": 312,
              "char_end": 360
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Pulmonary hypertension is a rare but serious complication.",
              "char_start": 361,
              "char_end": 419
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Neurologic involvement is absent in type 1 disease.",
              "char_start": 420,
              "char_end": 471
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Enzyme replacement therapy with imiglucerase or velaglucerase alfa is effective.",
              "char_start": 472,
              "char_end": 552
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Bone involvement is the primary source of morbidity and includes avascular necrosis, pathologic fractures, bone crises (episodes of acute bone pain), and Erlenmeyer flask deformity of the distal femur.",
          "char_start": 0,
          "char_end": 201
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Thrombocytopenia and anemia result from hypersplenism and marrow infiltration.",
          "char_start": 202,
          "char_end": 280
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Fatigue is a common complaint.",
          "char_start": 281,
          "char_end": 311
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Growth retardation is observed in some children.",
          "char_start": 312,
          "char_end": 360
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Pulmonary hypertension is a rare but serious complication.",
          "char_start": 361,
          "char_end": 419
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Neurologic involvement is absent in type 1 disease.",
          "char_start": 420,
          "char_end": 471
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Enzyme replacement therapy with imiglucerase or velaglucerase alfa is effective.",
          "char_start": 472,
          "char_end": 552
        }
      ]
    }
  },
  {
    "id": "disc-024",
    "chapter_title": "Fragile X Syndrome",
    "existing_anchors": [
      {
        "hpo_label": "Intellectual disability",
        "match_texts": [
          "intellectual disability",
          "cognitive impairment"
        ]
      },
      {
        "hpo_label": "Macroorchidism",
        "match_texts": [
          "macroorchidism"
        ]
      }
    ],
    "clinical_text": "Large prominent ears and a long face with a prominent jaw are characteristic in post-pubertal males. Joint hypermobility and pes planus are common musculoskeletal findings. Mitral valve prolapse is identified in a subset of adults. Behavioral features include attention deficit hyperactivity disorder, social anxiety, and gaze aversion. Autism spectrum disorder is diagnosed in approximately 25%–30% of males. Seizures occur in 10%–20%. Recurrent otitis media is frequent in childhood. Carrier females may have premature ovarian insufficiency. Tremor and ataxia (FXTAS) develop in a proportion of older male carriers.",
    "expectedNewCandidates": [
      {
        "label": "large ears",
        "status": "present"
      },
      {
        "label": "long face",
        "status": "present"
      },
      {
        "label": "prominent jaw",
        "status": "present"
      },
      {
        "label": "joint hypermobility",
        "status": "present"
      },
      {
        "label": "pes planus",
        "status": "present"
      },
      {
        "label": "mitral valve prolapse",
        "status": "present"
      },
      {
        "label": "attention deficit hyperactivity disorder",
        "status": "present"
      },
      {
        "label": "social anxiety",
        "status": "present"
      },
      {
        "label": "gaze aversion",
        "status": "present"
      },
      {
        "label": "autism spectrum disorder",
        "status": "present"
      },
      {
        "label": "seizures",
        "status": "present"
      },
      {
        "label": "recurrent otitis media",
        "status": "present"
      },
      {
        "label": "premature ovarian insufficiency",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Intellectual disability",
        "reason": "already_in_anchors"
      },
      {
        "label": "Macroorchidism",
        "reason": "already_in_anchors"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "tremor",
        "status": "present"
      },
      {
        "label": "ataxia",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Fragile X Syndrome",
      "clinical_text": "Large prominent ears and a long face with a prominent jaw are characteristic in post-pubertal males. Joint hypermobility and pes planus are common musculoskeletal findings. Mitral valve prolapse is identified in a subset of adults. Behavioral features include attention deficit hyperactivity disorder, social anxiety, and gaze aversion. Autism spectrum disorder is diagnosed in approximately 25%–30% of males. Seizures occur in 10%–20%. Recurrent otitis media is frequent in childhood. Carrier females may have premature ovarian insufficiency. Tremor and ataxia (FXTAS) develop in a proportion of older male carriers.",
      "paragraph_count": 1,
      "sentence_count": 9,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Large prominent ears and a long face with a prominent jaw are characteristic in post-pubertal males. Joint hypermobility and pes planus are common musculoskeletal findings. Mitral valve prolapse is identified in a subset of adults. Behavioral features include attention deficit hyperactivity disorder, social anxiety, and gaze aversion. Autism spectrum disorder is diagnosed in approximately 25%–30% of males. Seizures occur in 10%–20%. Recurrent otitis media is frequent in childhood. Carrier females may have premature ovarian insufficiency. Tremor and ataxia (FXTAS) develop in a proportion of older male carriers.",
          "char_start": 0,
          "char_end": 617,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Large prominent ears and a long face with a prominent jaw are characteristic in post-pubertal males.",
              "char_start": 0,
              "char_end": 100
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Joint hypermobility and pes planus are common musculoskeletal findings.",
              "char_start": 101,
              "char_end": 172
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Mitral valve prolapse is identified in a subset of adults.",
              "char_start": 173,
              "char_end": 231
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Behavioral features include attention deficit hyperactivity disorder, social anxiety, and gaze aversion.",
              "char_start": 232,
              "char_end": 336
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Autism spectrum disorder is diagnosed in approximately 25%–30% of males.",
              "char_start": 337,
              "char_end": 409
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Seizures occur in 10%–20%.",
              "char_start": 410,
              "char_end": 436
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Recurrent otitis media is frequent in childhood.",
              "char_start": 437,
              "char_end": 485
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Carrier females may have premature ovarian insufficiency.",
              "char_start": 486,
              "char_end": 543
            },
            {
              "sentence_id": "p1_s9",
              "sentence_index": 9,
              "text": "Tremor and ataxia (FXTAS) develop in a proportion of older male carriers.",
              "char_start": 544,
              "char_end": 617
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Large prominent ears and a long face with a prominent jaw are characteristic in post-pubertal males.",
          "char_start": 0,
          "char_end": 100
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Joint hypermobility and pes planus are common musculoskeletal findings.",
          "char_start": 101,
          "char_end": 172
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Mitral valve prolapse is identified in a subset of adults.",
          "char_start": 173,
          "char_end": 231
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Behavioral features include attention deficit hyperactivity disorder, social anxiety, and gaze aversion.",
          "char_start": 232,
          "char_end": 336
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Autism spectrum disorder is diagnosed in approximately 25%–30% of males.",
          "char_start": 337,
          "char_end": 409
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Seizures occur in 10%–20%.",
          "char_start": 410,
          "char_end": 436
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Recurrent otitis media is frequent in childhood.",
          "char_start": 437,
          "char_end": 485
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Carrier females may have premature ovarian insufficiency.",
          "char_start": 486,
          "char_end": 543
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s9",
          "sentence_index": 9,
          "text": "Tremor and ataxia (FXTAS) develop in a proportion of older male carriers.",
          "char_start": 544,
          "char_end": 617
        }
      ]
    }
  },
  {
    "id": "disc-025",
    "chapter_title": "Hereditary Spherocytosis",
    "existing_anchors": [
      {
        "hpo_label": "Hemolytic anemia",
        "match_texts": [
          "hemolytic anemia",
          "chronic hemolysis"
        ]
      },
      {
        "hpo_label": "Splenomegaly",
        "match_texts": [
          "splenomegaly"
        ]
      }
    ],
    "clinical_text": "Jaundice is the most common presenting feature in neonates and may require phototherapy or exchange transfusion. Pigment gallstones develop in approximately 50% of unsplenectomized patients by middle age. Aplastic crises triggered by parvovirus B19 infection can cause life-threatening drops in hemoglobin. Chronic fatigue is common. An elevated reticulocyte count and increased mean corpuscular hemoglobin concentration are characteristic laboratory findings. The osmotic fragility test and eosin-5-maleimide binding test are used for diagnosis.",
    "expectedNewCandidates": [
      {
        "label": "jaundice",
        "status": "present"
      },
      {
        "label": "gallstones",
        "status": "present"
      },
      {
        "label": "aplastic crises",
        "status": "present"
      },
      {
        "label": "fatigue",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Hemolytic anemia",
        "reason": "already_in_anchors"
      },
      {
        "label": "Splenomegaly",
        "reason": "already_in_anchors"
      },
      {
        "label": "reticulocyte count",
        "reason": "lab_or_test_method"
      },
      {
        "label": "mean corpuscular hemoglobin concentration",
        "reason": "lab_or_test_method"
      },
      {
        "label": "osmotic fragility test",
        "reason": "lab_or_test_method"
      },
      {
        "label": "eosin-5-maleimide binding test",
        "reason": "lab_or_test_method"
      },
      {
        "label": "phototherapy",
        "reason": "treatment_or_management"
      },
      {
        "label": "exchange transfusion",
        "reason": "treatment_or_management"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "elevated reticulocyte count",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Hereditary Spherocytosis",
      "clinical_text": "Jaundice is the most common presenting feature in neonates and may require phototherapy or exchange transfusion. Pigment gallstones develop in approximately 50% of unsplenectomized patients by middle age. Aplastic crises triggered by parvovirus B19 infection can cause life-threatening drops in hemoglobin. Chronic fatigue is common. An elevated reticulocyte count and increased mean corpuscular hemoglobin concentration are characteristic laboratory findings. The osmotic fragility test and eosin-5-maleimide binding test are used for diagnosis.",
      "paragraph_count": 1,
      "sentence_count": 6,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Jaundice is the most common presenting feature in neonates and may require phototherapy or exchange transfusion. Pigment gallstones develop in approximately 50% of unsplenectomized patients by middle age. Aplastic crises triggered by parvovirus B19 infection can cause life-threatening drops in hemoglobin. Chronic fatigue is common. An elevated reticulocyte count and increased mean corpuscular hemoglobin concentration are characteristic laboratory findings. The osmotic fragility test and eosin-5-maleimide binding test are used for diagnosis.",
          "char_start": 0,
          "char_end": 546,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Jaundice is the most common presenting feature in neonates and may require phototherapy or exchange transfusion.",
              "char_start": 0,
              "char_end": 112
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Pigment gallstones develop in approximately 50% of unsplenectomized patients by middle age.",
              "char_start": 113,
              "char_end": 204
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Aplastic crises triggered by parvovirus B19 infection can cause life-threatening drops in hemoglobin.",
              "char_start": 205,
              "char_end": 306
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Chronic fatigue is common.",
              "char_start": 307,
              "char_end": 333
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "An elevated reticulocyte count and increased mean corpuscular hemoglobin concentration are characteristic laboratory findings.",
              "char_start": 334,
              "char_end": 460
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "The osmotic fragility test and eosin-5-maleimide binding test are used for diagnosis.",
              "char_start": 461,
              "char_end": 546
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Jaundice is the most common presenting feature in neonates and may require phototherapy or exchange transfusion.",
          "char_start": 0,
          "char_end": 112
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Pigment gallstones develop in approximately 50% of unsplenectomized patients by middle age.",
          "char_start": 113,
          "char_end": 204
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Aplastic crises triggered by parvovirus B19 infection can cause life-threatening drops in hemoglobin.",
          "char_start": 205,
          "char_end": 306
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Chronic fatigue is common.",
          "char_start": 307,
          "char_end": 333
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "An elevated reticulocyte count and increased mean corpuscular hemoglobin concentration are characteristic laboratory findings.",
          "char_start": 334,
          "char_end": 460
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "The osmotic fragility test and eosin-5-maleimide binding test are used for diagnosis.",
          "char_start": 461,
          "char_end": 546
        }
      ]
    }
  },
  {
    "id": "disc-026",
    "chapter_title": "Alport Syndrome",
    "existing_anchors": [
      {
        "hpo_label": "Hematuria",
        "match_texts": [
          "hematuria",
          "microscopic hematuria"
        ]
      },
      {
        "hpo_label": "Sensorineural hearing impairment",
        "match_texts": [
          "sensorineural hearing loss"
        ]
      }
    ],
    "clinical_text": "Progressive nephropathy leading to end-stage renal disease is the hallmark of X-linked Alport syndrome and typically occurs in males between the second and fourth decades. Proteinuria develops as the disease advances. Anterior lenticonus, a forward protrusion of the lens, is pathognomonic when present. Dot-and-fleck retinopathy is observed in a substantial proportion. Leiomyomatosis of the esophagus and tracheobronchial tree has been reported in rare cases associated with deletions extending into COL4A6. Carrier females typically have microscopic hematuria and a milder course.",
    "expectedNewCandidates": [
      {
        "label": "progressive nephropathy",
        "status": "present"
      },
      {
        "label": "end-stage renal disease",
        "status": "present"
      },
      {
        "label": "proteinuria",
        "status": "present"
      },
      {
        "label": "anterior lenticonus",
        "status": "present"
      },
      {
        "label": "dot-and-fleck retinopathy",
        "status": "present"
      },
      {
        "label": "leiomyomatosis",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Hematuria",
        "reason": "already_in_anchors"
      },
      {
        "label": "Sensorineural hearing impairment",
        "reason": "already_in_anchors"
      },
      {
        "label": "COL4A6",
        "reason": "gene_or_variant"
      }
    ],
    "acceptableExtraCandidates": [],
    "clinical_structure": {
      "chapter_title": "Alport Syndrome",
      "clinical_text": "Progressive nephropathy leading to end-stage renal disease is the hallmark of X-linked Alport syndrome and typically occurs in males between the second and fourth decades. Proteinuria develops as the disease advances. Anterior lenticonus, a forward protrusion of the lens, is pathognomonic when present. Dot-and-fleck retinopathy is observed in a substantial proportion. Leiomyomatosis of the esophagus and tracheobronchial tree has been reported in rare cases associated with deletions extending into COL4A6. Carrier females typically have microscopic hematuria and a milder course.",
      "paragraph_count": 1,
      "sentence_count": 6,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Progressive nephropathy leading to end-stage renal disease is the hallmark of X-linked Alport syndrome and typically occurs in males between the second and fourth decades. Proteinuria develops as the disease advances. Anterior lenticonus, a forward protrusion of the lens, is pathognomonic when present. Dot-and-fleck retinopathy is observed in a substantial proportion. Leiomyomatosis of the esophagus and tracheobronchial tree has been reported in rare cases associated with deletions extending into COL4A6. Carrier females typically have microscopic hematuria and a milder course.",
          "char_start": 0,
          "char_end": 583,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Progressive nephropathy leading to end-stage renal disease is the hallmark of X-linked Alport syndrome and typically occurs in males between the second and fourth decades.",
              "char_start": 0,
              "char_end": 171
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Proteinuria develops as the disease advances.",
              "char_start": 172,
              "char_end": 217
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Anterior lenticonus, a forward protrusion of the lens, is pathognomonic when present.",
              "char_start": 218,
              "char_end": 303
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Dot-and-fleck retinopathy is observed in a substantial proportion.",
              "char_start": 304,
              "char_end": 370
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Leiomyomatosis of the esophagus and tracheobronchial tree has been reported in rare cases associated with deletions extending into COL4A6.",
              "char_start": 371,
              "char_end": 509
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Carrier females typically have microscopic hematuria and a milder course.",
              "char_start": 510,
              "char_end": 583
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Progressive nephropathy leading to end-stage renal disease is the hallmark of X-linked Alport syndrome and typically occurs in males between the second and fourth decades.",
          "char_start": 0,
          "char_end": 171
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Proteinuria develops as the disease advances.",
          "char_start": 172,
          "char_end": 217
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Anterior lenticonus, a forward protrusion of the lens, is pathognomonic when present.",
          "char_start": 218,
          "char_end": 303
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Dot-and-fleck retinopathy is observed in a substantial proportion.",
          "char_start": 304,
          "char_end": 370
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Leiomyomatosis of the esophagus and tracheobronchial tree has been reported in rare cases associated with deletions extending into COL4A6.",
          "char_start": 371,
          "char_end": 509
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Carrier females typically have microscopic hematuria and a milder course.",
          "char_start": 510,
          "char_end": 583
        }
      ]
    }
  },
  {
    "id": "disc-027",
    "chapter_title": "Pompe Disease",
    "existing_anchors": [
      {
        "hpo_label": "Cardiomegaly",
        "match_texts": [
          "cardiomegaly",
          "massive cardiomegaly"
        ]
      },
      {
        "hpo_label": "Hypotonia",
        "match_texts": [
          "generalized hypotonia",
          "hypotonia"
        ]
      }
    ],
    "clinical_text": "In the infantile form, affected infants present with feeding difficulties, failure to thrive, and macroglossia. A hypertrophic cardiomyopathy with a short PR interval on electrocardiogram is characteristic. Death from cardiorespiratory failure occurs within the first year of life without treatment. The late-onset form presents with progressive proximal myopathy and respiratory insufficiency. Elevated serum creatine kinase levels are seen but may be only mildly elevated in late-onset disease. Acid alpha-glucosidase enzyme activity measured in dried blood spots is used for screening. Enzyme replacement therapy with alglucosidase alfa has significantly improved survival in the infantile form.",
    "expectedNewCandidates": [
      {
        "label": "feeding difficulties",
        "status": "present"
      },
      {
        "label": "failure to thrive",
        "status": "present"
      },
      {
        "label": "macroglossia",
        "status": "present"
      },
      {
        "label": "hypertrophic cardiomyopathy",
        "status": "present"
      },
      {
        "label": "progressive proximal myopathy",
        "status": "present"
      },
      {
        "label": "respiratory insufficiency",
        "status": "present"
      },
      {
        "label": "elevated creatine kinase",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Cardiomegaly",
        "reason": "already_in_anchors"
      },
      {
        "label": "Hypotonia",
        "reason": "already_in_anchors"
      },
      {
        "label": "acid alpha-glucosidase",
        "reason": "lab_or_test_method"
      },
      {
        "label": "dried blood spots",
        "reason": "lab_or_test_method"
      },
      {
        "label": "alglucosidase alfa",
        "reason": "treatment_or_management"
      },
      {
        "label": "enzyme replacement therapy",
        "reason": "treatment_or_management"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "short PR interval",
        "status": "present"
      },
      {
        "label": "cardiorespiratory failure",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Pompe Disease",
      "clinical_text": "In the infantile form, affected infants present with feeding difficulties, failure to thrive, and macroglossia. A hypertrophic cardiomyopathy with a short PR interval on electrocardiogram is characteristic. Death from cardiorespiratory failure occurs within the first year of life without treatment. The late-onset form presents with progressive proximal myopathy and respiratory insufficiency. Elevated serum creatine kinase levels are seen but may be only mildly elevated in late-onset disease. Acid alpha-glucosidase enzyme activity measured in dried blood spots is used for screening. Enzyme replacement therapy with alglucosidase alfa has significantly improved survival in the infantile form.",
      "paragraph_count": 1,
      "sentence_count": 7,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "In the infantile form, affected infants present with feeding difficulties, failure to thrive, and macroglossia. A hypertrophic cardiomyopathy with a short PR interval on electrocardiogram is characteristic. Death from cardiorespiratory failure occurs within the first year of life without treatment. The late-onset form presents with progressive proximal myopathy and respiratory insufficiency. Elevated serum creatine kinase levels are seen but may be only mildly elevated in late-onset disease. Acid alpha-glucosidase enzyme activity measured in dried blood spots is used for screening. Enzyme replacement therapy with alglucosidase alfa has significantly improved survival in the infantile form.",
          "char_start": 0,
          "char_end": 698,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "In the infantile form, affected infants present with feeding difficulties, failure to thrive, and macroglossia.",
              "char_start": 0,
              "char_end": 111
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "A hypertrophic cardiomyopathy with a short PR interval on electrocardiogram is characteristic.",
              "char_start": 112,
              "char_end": 206
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Death from cardiorespiratory failure occurs within the first year of life without treatment.",
              "char_start": 207,
              "char_end": 299
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "The late-onset form presents with progressive proximal myopathy and respiratory insufficiency.",
              "char_start": 300,
              "char_end": 394
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Elevated serum creatine kinase levels are seen but may be only mildly elevated in late-onset disease.",
              "char_start": 395,
              "char_end": 496
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Acid alpha-glucosidase enzyme activity measured in dried blood spots is used for screening.",
              "char_start": 497,
              "char_end": 588
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Enzyme replacement therapy with alglucosidase alfa has significantly improved survival in the infantile form.",
              "char_start": 589,
              "char_end": 698
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "In the infantile form, affected infants present with feeding difficulties, failure to thrive, and macroglossia.",
          "char_start": 0,
          "char_end": 111
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "A hypertrophic cardiomyopathy with a short PR interval on electrocardiogram is characteristic.",
          "char_start": 112,
          "char_end": 206
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Death from cardiorespiratory failure occurs within the first year of life without treatment.",
          "char_start": 207,
          "char_end": 299
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "The late-onset form presents with progressive proximal myopathy and respiratory insufficiency.",
          "char_start": 300,
          "char_end": 394
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Elevated serum creatine kinase levels are seen but may be only mildly elevated in late-onset disease.",
          "char_start": 395,
          "char_end": 496
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Acid alpha-glucosidase enzyme activity measured in dried blood spots is used for screening.",
          "char_start": 497,
          "char_end": 588
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Enzyme replacement therapy with alglucosidase alfa has significantly improved survival in the infantile form.",
          "char_start": 589,
          "char_end": 698
        }
      ]
    }
  },
  {
    "id": "disc-028",
    "chapter_title": "Charcot-Marie-Tooth Disease Type 1A",
    "existing_anchors": [
      {
        "hpo_label": "Peripheral neuropathy",
        "match_texts": [
          "demyelinating peripheral neuropathy"
        ]
      },
      {
        "hpo_label": "Distal muscle weakness",
        "match_texts": [
          "distal muscle weakness",
          "distal weakness"
        ]
      }
    ],
    "clinical_text": "Slowly progressive distal sensory loss in a stocking-glove distribution is typical. Pes cavus and hammertoe deformities develop during childhood or adolescence. Depressed or absent deep tendon reflexes are a consistent finding. Reduced nerve conduction velocities are the electrophysiologic hallmark. Foot drop and steppage gait develop as the disease progresses. Hand weakness and thenar atrophy appear later. Scoliosis occurs in a minority. Hearing is preserved. Pain and fatigue are underrecognized but significant symptoms. PMP22 duplication on chromosome 17p accounts for 70%–80% of cases.",
    "expectedNewCandidates": [
      {
        "label": "distal sensory loss",
        "status": "present"
      },
      {
        "label": "pes cavus",
        "status": "present"
      },
      {
        "label": "hammertoe deformity",
        "status": "present"
      },
      {
        "label": "absent deep tendon reflexes",
        "status": "present"
      },
      {
        "label": "foot drop",
        "status": "present"
      },
      {
        "label": "steppage gait",
        "status": "present"
      },
      {
        "label": "hand weakness",
        "status": "present"
      },
      {
        "label": "thenar atrophy",
        "status": "present"
      },
      {
        "label": "scoliosis",
        "status": "present"
      },
      {
        "label": "pain",
        "status": "present"
      },
      {
        "label": "fatigue",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Peripheral neuropathy",
        "reason": "already_in_anchors"
      },
      {
        "label": "Distal muscle weakness",
        "reason": "already_in_anchors"
      },
      {
        "label": "hearing",
        "reason": "normal_or_preserved"
      },
      {
        "label": "nerve conduction velocities",
        "reason": "lab_or_test_method"
      },
      {
        "label": "PMP22",
        "reason": "gene_or_variant"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "depressed deep tendon reflexes",
        "status": "present"
      },
      {
        "label": "reduced nerve conduction velocity",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Charcot-Marie-Tooth Disease Type 1A",
      "clinical_text": "Slowly progressive distal sensory loss in a stocking-glove distribution is typical. Pes cavus and hammertoe deformities develop during childhood or adolescence. Depressed or absent deep tendon reflexes are a consistent finding. Reduced nerve conduction velocities are the electrophysiologic hallmark. Foot drop and steppage gait develop as the disease progresses. Hand weakness and thenar atrophy appear later. Scoliosis occurs in a minority. Hearing is preserved. Pain and fatigue are underrecognized but significant symptoms. PMP22 duplication on chromosome 17p accounts for 70%–80% of cases.",
      "paragraph_count": 1,
      "sentence_count": 10,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Slowly progressive distal sensory loss in a stocking-glove distribution is typical. Pes cavus and hammertoe deformities develop during childhood or adolescence. Depressed or absent deep tendon reflexes are a consistent finding. Reduced nerve conduction velocities are the electrophysiologic hallmark. Foot drop and steppage gait develop as the disease progresses. Hand weakness and thenar atrophy appear later. Scoliosis occurs in a minority. Hearing is preserved. Pain and fatigue are underrecognized but significant symptoms. PMP22 duplication on chromosome 17p accounts for 70%–80% of cases.",
          "char_start": 0,
          "char_end": 594,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Slowly progressive distal sensory loss in a stocking-glove distribution is typical.",
              "char_start": 0,
              "char_end": 83
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Pes cavus and hammertoe deformities develop during childhood or adolescence.",
              "char_start": 84,
              "char_end": 160
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Depressed or absent deep tendon reflexes are a consistent finding.",
              "char_start": 161,
              "char_end": 227
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Reduced nerve conduction velocities are the electrophysiologic hallmark.",
              "char_start": 228,
              "char_end": 300
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Foot drop and steppage gait develop as the disease progresses.",
              "char_start": 301,
              "char_end": 363
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Hand weakness and thenar atrophy appear later.",
              "char_start": 364,
              "char_end": 410
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Scoliosis occurs in a minority.",
              "char_start": 411,
              "char_end": 442
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Hearing is preserved.",
              "char_start": 443,
              "char_end": 464
            },
            {
              "sentence_id": "p1_s9",
              "sentence_index": 9,
              "text": "Pain and fatigue are underrecognized but significant symptoms.",
              "char_start": 465,
              "char_end": 527
            },
            {
              "sentence_id": "p1_s10",
              "sentence_index": 10,
              "text": "PMP22 duplication on chromosome 17p accounts for 70%–80% of cases.",
              "char_start": 528,
              "char_end": 594
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Slowly progressive distal sensory loss in a stocking-glove distribution is typical.",
          "char_start": 0,
          "char_end": 83
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Pes cavus and hammertoe deformities develop during childhood or adolescence.",
          "char_start": 84,
          "char_end": 160
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Depressed or absent deep tendon reflexes are a consistent finding.",
          "char_start": 161,
          "char_end": 227
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Reduced nerve conduction velocities are the electrophysiologic hallmark.",
          "char_start": 228,
          "char_end": 300
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Foot drop and steppage gait develop as the disease progresses.",
          "char_start": 301,
          "char_end": 363
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Hand weakness and thenar atrophy appear later.",
          "char_start": 364,
          "char_end": 410
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Scoliosis occurs in a minority.",
          "char_start": 411,
          "char_end": 442
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Hearing is preserved.",
          "char_start": 443,
          "char_end": 464
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s9",
          "sentence_index": 9,
          "text": "Pain and fatigue are underrecognized but significant symptoms.",
          "char_start": 465,
          "char_end": 527
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s10",
          "sentence_index": 10,
          "text": "PMP22 duplication on chromosome 17p accounts for 70%–80% of cases.",
          "char_start": 528,
          "char_end": 594
        }
      ]
    }
  },
  {
    "id": "disc-029",
    "chapter_title": "Down Syndrome",
    "existing_anchors": [
      {
        "hpo_label": "Intellectual disability",
        "match_texts": [
          "intellectual disability"
        ]
      },
      {
        "hpo_label": "Hypotonia",
        "match_texts": [
          "hypotonia"
        ]
      }
    ],
    "clinical_text": "Congenital heart defects are present in approximately 40%–50% of affected individuals, with atrioventricular septal defect being the most common. Duodenal atresia or stenosis occurs in approximately 5%. Hearing loss, both conductive and sensorineural, affects the majority. Atlantoaxial instability requires screening before participation in certain sports. Hypothyroidism is common and should be monitored annually. Leukemia occurs with increased frequency in childhood. Alzheimer disease neuropathology develops in essentially all adults by the fourth decade, though clinical dementia onset varies. Obstructive sleep apnea is frequent.",
    "expectedNewCandidates": [
      {
        "label": "congenital heart defects",
        "status": "present"
      },
      {
        "label": "atrioventricular septal defect",
        "status": "present"
      },
      {
        "label": "duodenal atresia",
        "status": "present"
      },
      {
        "label": "hearing loss",
        "status": "present"
      },
      {
        "label": "atlantoaxial instability",
        "status": "present"
      },
      {
        "label": "hypothyroidism",
        "status": "present"
      },
      {
        "label": "leukemia",
        "status": "present"
      },
      {
        "label": "dementia",
        "status": "present"
      },
      {
        "label": "obstructive sleep apnea",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Intellectual disability",
        "reason": "already_in_anchors"
      },
      {
        "label": "Hypotonia",
        "reason": "already_in_anchors"
      },
      {
        "label": "Alzheimer disease",
        "reason": "not_a_phenotype"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "duodenal stenosis",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Down Syndrome",
      "clinical_text": "Congenital heart defects are present in approximately 40%–50% of affected individuals, with atrioventricular septal defect being the most common. Duodenal atresia or stenosis occurs in approximately 5%. Hearing loss, both conductive and sensorineural, affects the majority. Atlantoaxial instability requires screening before participation in certain sports. Hypothyroidism is common and should be monitored annually. Leukemia occurs with increased frequency in childhood. Alzheimer disease neuropathology develops in essentially all adults by the fourth decade, though clinical dementia onset varies. Obstructive sleep apnea is frequent.",
      "paragraph_count": 1,
      "sentence_count": 8,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Congenital heart defects are present in approximately 40%–50% of affected individuals, with atrioventricular septal defect being the most common. Duodenal atresia or stenosis occurs in approximately 5%. Hearing loss, both conductive and sensorineural, affects the majority. Atlantoaxial instability requires screening before participation in certain sports. Hypothyroidism is common and should be monitored annually. Leukemia occurs with increased frequency in childhood. Alzheimer disease neuropathology develops in essentially all adults by the fourth decade, though clinical dementia onset varies. Obstructive sleep apnea is frequent.",
          "char_start": 0,
          "char_end": 637,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Congenital heart defects are present in approximately 40%–50% of affected individuals, with atrioventricular septal defect being the most common.",
              "char_start": 0,
              "char_end": 145
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Duodenal atresia or stenosis occurs in approximately 5%.",
              "char_start": 146,
              "char_end": 202
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Hearing loss, both conductive and sensorineural, affects the majority.",
              "char_start": 203,
              "char_end": 273
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Atlantoaxial instability requires screening before participation in certain sports.",
              "char_start": 274,
              "char_end": 357
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Hypothyroidism is common and should be monitored annually.",
              "char_start": 358,
              "char_end": 416
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Leukemia occurs with increased frequency in childhood.",
              "char_start": 417,
              "char_end": 471
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Alzheimer disease neuropathology develops in essentially all adults by the fourth decade, though clinical dementia onset varies.",
              "char_start": 472,
              "char_end": 600
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Obstructive sleep apnea is frequent.",
              "char_start": 601,
              "char_end": 637
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Congenital heart defects are present in approximately 40%–50% of affected individuals, with atrioventricular septal defect being the most common.",
          "char_start": 0,
          "char_end": 145
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Duodenal atresia or stenosis occurs in approximately 5%.",
          "char_start": 146,
          "char_end": 202
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Hearing loss, both conductive and sensorineural, affects the majority.",
          "char_start": 203,
          "char_end": 273
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Atlantoaxial instability requires screening before participation in certain sports.",
          "char_start": 274,
          "char_end": 357
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Hypothyroidism is common and should be monitored annually.",
          "char_start": 358,
          "char_end": 416
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Leukemia occurs with increased frequency in childhood.",
          "char_start": 417,
          "char_end": 471
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Alzheimer disease neuropathology develops in essentially all adults by the fourth decade, though clinical dementia onset varies.",
          "char_start": 472,
          "char_end": 600
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Obstructive sleep apnea is frequent.",
          "char_start": 601,
          "char_end": 637
        }
      ]
    }
  },
  {
    "id": "disc-030",
    "chapter_title": "Myotonic Dystrophy Type 1",
    "existing_anchors": [
      {
        "hpo_label": "Myotonia",
        "match_texts": [
          "myotonia",
          "grip myotonia"
        ]
      },
      {
        "hpo_label": "Muscle weakness",
        "match_texts": [
          "progressive muscle weakness"
        ]
      }
    ],
    "clinical_text": "Ptosis and facial weakness give the face a characteristic elongated appearance. Cataracts, specifically iridescent posterior subcapsular cataracts, are present in virtually all affected adults. Cardiac conduction defects, including first-degree heart block and bundle branch block, may progress to complete heart block requiring pacemaker insertion. Excessive daytime sleepiness is a significant quality of life concern independent of sleep apnea. Insulin resistance and diabetes mellitus are common. Frontal balding occurs in males. Testicular atrophy and decreased fertility are features in males. Cognitive impairment, particularly executive dysfunction, is increasingly recognized.",
    "expectedNewCandidates": [
      {
        "label": "ptosis",
        "status": "present"
      },
      {
        "label": "facial weakness",
        "status": "present"
      },
      {
        "label": "cataracts",
        "status": "present"
      },
      {
        "label": "cardiac conduction defects",
        "status": "present"
      },
      {
        "label": "excessive daytime sleepiness",
        "status": "present"
      },
      {
        "label": "insulin resistance",
        "status": "present"
      },
      {
        "label": "diabetes mellitus",
        "status": "present"
      },
      {
        "label": "frontal balding",
        "status": "present"
      },
      {
        "label": "testicular atrophy",
        "status": "present"
      },
      {
        "label": "cognitive impairment",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Myotonia",
        "reason": "already_in_anchors"
      },
      {
        "label": "Muscle weakness",
        "reason": "already_in_anchors"
      },
      {
        "label": "pacemaker insertion",
        "reason": "treatment_or_management"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "decreased fertility",
        "status": "present"
      },
      {
        "label": "executive dysfunction",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Myotonic Dystrophy Type 1",
      "clinical_text": "Ptosis and facial weakness give the face a characteristic elongated appearance. Cataracts, specifically iridescent posterior subcapsular cataracts, are present in virtually all affected adults. Cardiac conduction defects, including first-degree heart block and bundle branch block, may progress to complete heart block requiring pacemaker insertion. Excessive daytime sleepiness is a significant quality of life concern independent of sleep apnea. Insulin resistance and diabetes mellitus are common. Frontal balding occurs in males. Testicular atrophy and decreased fertility are features in males. Cognitive impairment, particularly executive dysfunction, is increasingly recognized.",
      "paragraph_count": 1,
      "sentence_count": 8,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Ptosis and facial weakness give the face a characteristic elongated appearance. Cataracts, specifically iridescent posterior subcapsular cataracts, are present in virtually all affected adults. Cardiac conduction defects, including first-degree heart block and bundle branch block, may progress to complete heart block requiring pacemaker insertion. Excessive daytime sleepiness is a significant quality of life concern independent of sleep apnea. Insulin resistance and diabetes mellitus are common. Frontal balding occurs in males. Testicular atrophy and decreased fertility are features in males. Cognitive impairment, particularly executive dysfunction, is increasingly recognized.",
          "char_start": 0,
          "char_end": 685,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Ptosis and facial weakness give the face a characteristic elongated appearance.",
              "char_start": 0,
              "char_end": 79
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Cataracts, specifically iridescent posterior subcapsular cataracts, are present in virtually all affected adults.",
              "char_start": 80,
              "char_end": 193
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Cardiac conduction defects, including first-degree heart block and bundle branch block, may progress to complete heart block requiring pacemaker insertion.",
              "char_start": 194,
              "char_end": 349
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Excessive daytime sleepiness is a significant quality of life concern independent of sleep apnea.",
              "char_start": 350,
              "char_end": 447
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Insulin resistance and diabetes mellitus are common.",
              "char_start": 448,
              "char_end": 500
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Frontal balding occurs in males.",
              "char_start": 501,
              "char_end": 533
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Testicular atrophy and decreased fertility are features in males.",
              "char_start": 534,
              "char_end": 599
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Cognitive impairment, particularly executive dysfunction, is increasingly recognized.",
              "char_start": 600,
              "char_end": 685
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Ptosis and facial weakness give the face a characteristic elongated appearance.",
          "char_start": 0,
          "char_end": 79
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Cataracts, specifically iridescent posterior subcapsular cataracts, are present in virtually all affected adults.",
          "char_start": 80,
          "char_end": 193
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Cardiac conduction defects, including first-degree heart block and bundle branch block, may progress to complete heart block requiring pacemaker insertion.",
          "char_start": 194,
          "char_end": 349
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Excessive daytime sleepiness is a significant quality of life concern independent of sleep apnea.",
          "char_start": 350,
          "char_end": 447
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Insulin resistance and diabetes mellitus are common.",
          "char_start": 448,
          "char_end": 500
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Frontal balding occurs in males.",
          "char_start": 501,
          "char_end": 533
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Testicular atrophy and decreased fertility are features in males.",
          "char_start": 534,
          "char_end": 599
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Cognitive impairment, particularly executive dysfunction, is increasingly recognized.",
          "char_start": 600,
          "char_end": 685
        }
      ]
    }
  },
  {
    "id": "disc-031",
    "chapter_title": "Hereditary Hemochromatosis",
    "existing_anchors": [
      {
        "hpo_label": "Hepatic iron overload",
        "match_texts": [
          "hepatic iron overload",
          "iron overload"
        ]
      }
    ],
    "clinical_text": "Liver fibrosis progressing to cirrhosis is the primary hepatic complication. Hepatocellular carcinoma risk is markedly increased in those with cirrhosis. Diabetes mellitus results from pancreatic iron deposition. Skin hyperpigmentation gives a bronzed appearance. Hypogonadotropic hypogonadism manifests as decreased libido, impotence, and amenorrhea. Arthropathy, characteristically involving the second and third metacarpophalangeal joints, is a common early symptom. Dilated cardiomyopathy and cardiac arrhythmias may occur. Serum ferritin and transferrin saturation are the primary screening tests. Phlebotomy is the treatment of choice.",
    "expectedNewCandidates": [
      {
        "label": "liver fibrosis",
        "status": "present"
      },
      {
        "label": "cirrhosis",
        "status": "present"
      },
      {
        "label": "hepatocellular carcinoma",
        "status": "present"
      },
      {
        "label": "diabetes mellitus",
        "status": "present"
      },
      {
        "label": "skin hyperpigmentation",
        "status": "present"
      },
      {
        "label": "hypogonadotropic hypogonadism",
        "status": "present"
      },
      {
        "label": "arthropathy",
        "status": "present"
      },
      {
        "label": "dilated cardiomyopathy",
        "status": "present"
      },
      {
        "label": "cardiac arrhythmias",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Hepatic iron overload",
        "reason": "already_in_anchors"
      },
      {
        "label": "serum ferritin",
        "reason": "lab_or_test_method"
      },
      {
        "label": "transferrin saturation",
        "reason": "lab_or_test_method"
      },
      {
        "label": "phlebotomy",
        "reason": "treatment_or_management"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "decreased libido",
        "status": "present"
      },
      {
        "label": "amenorrhea",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Hereditary Hemochromatosis",
      "clinical_text": "Liver fibrosis progressing to cirrhosis is the primary hepatic complication. Hepatocellular carcinoma risk is markedly increased in those with cirrhosis. Diabetes mellitus results from pancreatic iron deposition. Skin hyperpigmentation gives a bronzed appearance. Hypogonadotropic hypogonadism manifests as decreased libido, impotence, and amenorrhea. Arthropathy, characteristically involving the second and third metacarpophalangeal joints, is a common early symptom. Dilated cardiomyopathy and cardiac arrhythmias may occur. Serum ferritin and transferrin saturation are the primary screening tests. Phlebotomy is the treatment of choice.",
      "paragraph_count": 1,
      "sentence_count": 9,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Liver fibrosis progressing to cirrhosis is the primary hepatic complication. Hepatocellular carcinoma risk is markedly increased in those with cirrhosis. Diabetes mellitus results from pancreatic iron deposition. Skin hyperpigmentation gives a bronzed appearance. Hypogonadotropic hypogonadism manifests as decreased libido, impotence, and amenorrhea. Arthropathy, characteristically involving the second and third metacarpophalangeal joints, is a common early symptom. Dilated cardiomyopathy and cardiac arrhythmias may occur. Serum ferritin and transferrin saturation are the primary screening tests. Phlebotomy is the treatment of choice.",
          "char_start": 0,
          "char_end": 641,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Liver fibrosis progressing to cirrhosis is the primary hepatic complication.",
              "char_start": 0,
              "char_end": 76
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Hepatocellular carcinoma risk is markedly increased in those with cirrhosis.",
              "char_start": 77,
              "char_end": 153
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Diabetes mellitus results from pancreatic iron deposition.",
              "char_start": 154,
              "char_end": 212
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Skin hyperpigmentation gives a bronzed appearance.",
              "char_start": 213,
              "char_end": 263
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Hypogonadotropic hypogonadism manifests as decreased libido, impotence, and amenorrhea.",
              "char_start": 264,
              "char_end": 351
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Arthropathy, characteristically involving the second and third metacarpophalangeal joints, is a common early symptom.",
              "char_start": 352,
              "char_end": 469
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Dilated cardiomyopathy and cardiac arrhythmias may occur.",
              "char_start": 470,
              "char_end": 527
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Serum ferritin and transferrin saturation are the primary screening tests.",
              "char_start": 528,
              "char_end": 602
            },
            {
              "sentence_id": "p1_s9",
              "sentence_index": 9,
              "text": "Phlebotomy is the treatment of choice.",
              "char_start": 603,
              "char_end": 641
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Liver fibrosis progressing to cirrhosis is the primary hepatic complication.",
          "char_start": 0,
          "char_end": 76
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Hepatocellular carcinoma risk is markedly increased in those with cirrhosis.",
          "char_start": 77,
          "char_end": 153
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Diabetes mellitus results from pancreatic iron deposition.",
          "char_start": 154,
          "char_end": 212
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Skin hyperpigmentation gives a bronzed appearance.",
          "char_start": 213,
          "char_end": 263
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Hypogonadotropic hypogonadism manifests as decreased libido, impotence, and amenorrhea.",
          "char_start": 264,
          "char_end": 351
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Arthropathy, characteristically involving the second and third metacarpophalangeal joints, is a common early symptom.",
          "char_start": 352,
          "char_end": 469
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Dilated cardiomyopathy and cardiac arrhythmias may occur.",
          "char_start": 470,
          "char_end": 527
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Serum ferritin and transferrin saturation are the primary screening tests.",
          "char_start": 528,
          "char_end": 602
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s9",
          "sentence_index": 9,
          "text": "Phlebotomy is the treatment of choice.",
          "char_start": 603,
          "char_end": 641
        }
      ]
    }
  },
  {
    "id": "disc-032",
    "chapter_title": "Alagille Syndrome",
    "existing_anchors": [
      {
        "hpo_label": "Cholestasis",
        "match_texts": [
          "cholestasis",
          "neonatal cholestasis"
        ]
      },
      {
        "hpo_label": "Butterfly vertebrae",
        "match_texts": [
          "butterfly vertebrae"
        ]
      }
    ],
    "clinical_text": "Bile duct paucity on liver biopsy is a defining histologic feature. Congenital heart defects, most commonly peripheral pulmonary stenosis, are present in over 90%. Posterior embryotoxon, a prominent Schwalbe line at the edge of the cornea, is the characteristic ocular finding. A distinctive facial appearance with broad forehead, deep-set eyes, and pointed chin becomes more apparent with age. Renal abnormalities including renal dysplasia and renal tubular acidosis are described. Growth failure is common. Intracranial hemorrhage from moyamoya-like vasculopathy is an uncommon but serious complication. Pruritus from cholestasis is often severe and is a major indication for liver transplantation.",
    "expectedNewCandidates": [
      {
        "label": "bile duct paucity",
        "status": "present"
      },
      {
        "label": "peripheral pulmonary stenosis",
        "status": "present"
      },
      {
        "label": "posterior embryotoxon",
        "status": "present"
      },
      {
        "label": "broad forehead",
        "status": "present"
      },
      {
        "label": "deep-set eyes",
        "status": "present"
      },
      {
        "label": "pointed chin",
        "status": "present"
      },
      {
        "label": "renal dysplasia",
        "status": "present"
      },
      {
        "label": "renal tubular acidosis",
        "status": "present"
      },
      {
        "label": "growth failure",
        "status": "present"
      },
      {
        "label": "intracranial hemorrhage",
        "status": "present"
      },
      {
        "label": "pruritus",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Cholestasis",
        "reason": "already_in_anchors"
      },
      {
        "label": "Butterfly vertebrae",
        "reason": "already_in_anchors"
      },
      {
        "label": "liver biopsy",
        "reason": "lab_or_test_method"
      },
      {
        "label": "liver transplantation",
        "reason": "treatment_or_management"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "moyamoya vasculopathy",
        "status": "present"
      },
      {
        "label": "congenital heart defects",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Alagille Syndrome",
      "clinical_text": "Bile duct paucity on liver biopsy is a defining histologic feature. Congenital heart defects, most commonly peripheral pulmonary stenosis, are present in over 90%. Posterior embryotoxon, a prominent Schwalbe line at the edge of the cornea, is the characteristic ocular finding. A distinctive facial appearance with broad forehead, deep-set eyes, and pointed chin becomes more apparent with age. Renal abnormalities including renal dysplasia and renal tubular acidosis are described. Growth failure is common. Intracranial hemorrhage from moyamoya-like vasculopathy is an uncommon but serious complication. Pruritus from cholestasis is often severe and is a major indication for liver transplantation.",
      "paragraph_count": 1,
      "sentence_count": 8,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Bile duct paucity on liver biopsy is a defining histologic feature. Congenital heart defects, most commonly peripheral pulmonary stenosis, are present in over 90%. Posterior embryotoxon, a prominent Schwalbe line at the edge of the cornea, is the characteristic ocular finding. A distinctive facial appearance with broad forehead, deep-set eyes, and pointed chin becomes more apparent with age. Renal abnormalities including renal dysplasia and renal tubular acidosis are described. Growth failure is common. Intracranial hemorrhage from moyamoya-like vasculopathy is an uncommon but serious complication. Pruritus from cholestasis is often severe and is a major indication for liver transplantation.",
          "char_start": 0,
          "char_end": 700,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Bile duct paucity on liver biopsy is a defining histologic feature.",
              "char_start": 0,
              "char_end": 67
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Congenital heart defects, most commonly peripheral pulmonary stenosis, are present in over 90%.",
              "char_start": 68,
              "char_end": 163
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Posterior embryotoxon, a prominent Schwalbe line at the edge of the cornea, is the characteristic ocular finding.",
              "char_start": 164,
              "char_end": 277
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "A distinctive facial appearance with broad forehead, deep-set eyes, and pointed chin becomes more apparent with age.",
              "char_start": 278,
              "char_end": 394
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Renal abnormalities including renal dysplasia and renal tubular acidosis are described.",
              "char_start": 395,
              "char_end": 482
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Growth failure is common.",
              "char_start": 483,
              "char_end": 508
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Intracranial hemorrhage from moyamoya-like vasculopathy is an uncommon but serious complication.",
              "char_start": 509,
              "char_end": 605
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Pruritus from cholestasis is often severe and is a major indication for liver transplantation.",
              "char_start": 606,
              "char_end": 700
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Bile duct paucity on liver biopsy is a defining histologic feature.",
          "char_start": 0,
          "char_end": 67
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Congenital heart defects, most commonly peripheral pulmonary stenosis, are present in over 90%.",
          "char_start": 68,
          "char_end": 163
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Posterior embryotoxon, a prominent Schwalbe line at the edge of the cornea, is the characteristic ocular finding.",
          "char_start": 164,
          "char_end": 277
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "A distinctive facial appearance with broad forehead, deep-set eyes, and pointed chin becomes more apparent with age.",
          "char_start": 278,
          "char_end": 394
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Renal abnormalities including renal dysplasia and renal tubular acidosis are described.",
          "char_start": 395,
          "char_end": 482
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Growth failure is common.",
          "char_start": 483,
          "char_end": 508
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Intracranial hemorrhage from moyamoya-like vasculopathy is an uncommon but serious complication.",
          "char_start": 509,
          "char_end": 605
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Pruritus from cholestasis is often severe and is a major indication for liver transplantation.",
          "char_start": 606,
          "char_end": 700
        }
      ]
    }
  },
  {
    "id": "disc-033",
    "chapter_title": "Fabry Disease",
    "existing_anchors": [
      {
        "hpo_label": "Angiokeratoma",
        "match_texts": [
          "angiokeratomas",
          "angiokeratoma"
        ]
      }
    ],
    "clinical_text": "Acroparesthesias, described as episodic burning pain in the hands and feet, are the most common childhood symptom. Hypohidrosis or anhidrosis leads to heat intolerance. Cornea verticillata, a whorl-like opacity of the corneal epithelium, is present in most affected males and many carrier females. Progressive nephropathy with proteinuria culminates in end-stage renal disease in untreated males by the fourth or fifth decade. Hypertrophic cardiomyopathy and cardiac arrhythmias are major sources of morbidity. Cerebrovascular disease, including transient ischemic attacks and stroke, occurs at a young age. Gastrointestinal symptoms including abdominal pain, diarrhea, and nausea are common but often unrecognized. Enzyme replacement therapy with agalsidase alfa or agalsidase beta is available.",
    "expectedNewCandidates": [
      {
        "label": "acroparesthesias",
        "status": "present"
      },
      {
        "label": "hypohidrosis",
        "status": "present"
      },
      {
        "label": "cornea verticillata",
        "status": "present"
      },
      {
        "label": "proteinuria",
        "status": "present"
      },
      {
        "label": "end-stage renal disease",
        "status": "present"
      },
      {
        "label": "hypertrophic cardiomyopathy",
        "status": "present"
      },
      {
        "label": "cardiac arrhythmias",
        "status": "present"
      },
      {
        "label": "stroke",
        "status": "present"
      },
      {
        "label": "abdominal pain",
        "status": "present"
      },
      {
        "label": "diarrhea",
        "status": "present"
      },
      {
        "label": "nausea",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Angiokeratoma",
        "reason": "already_in_anchors"
      },
      {
        "label": "agalsidase alfa",
        "reason": "treatment_or_management"
      },
      {
        "label": "agalsidase beta",
        "reason": "treatment_or_management"
      },
      {
        "label": "enzyme replacement therapy",
        "reason": "treatment_or_management"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "heat intolerance",
        "status": "present"
      },
      {
        "label": "transient ischemic attacks",
        "status": "present"
      },
      {
        "label": "progressive nephropathy",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Fabry Disease",
      "clinical_text": "Acroparesthesias, described as episodic burning pain in the hands and feet, are the most common childhood symptom. Hypohidrosis or anhidrosis leads to heat intolerance. Cornea verticillata, a whorl-like opacity of the corneal epithelium, is present in most affected males and many carrier females. Progressive nephropathy with proteinuria culminates in end-stage renal disease in untreated males by the fourth or fifth decade. Hypertrophic cardiomyopathy and cardiac arrhythmias are major sources of morbidity. Cerebrovascular disease, including transient ischemic attacks and stroke, occurs at a young age. Gastrointestinal symptoms including abdominal pain, diarrhea, and nausea are common but often unrecognized. Enzyme replacement therapy with agalsidase alfa or agalsidase beta is available.",
      "paragraph_count": 1,
      "sentence_count": 8,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Acroparesthesias, described as episodic burning pain in the hands and feet, are the most common childhood symptom. Hypohidrosis or anhidrosis leads to heat intolerance. Cornea verticillata, a whorl-like opacity of the corneal epithelium, is present in most affected males and many carrier females. Progressive nephropathy with proteinuria culminates in end-stage renal disease in untreated males by the fourth or fifth decade. Hypertrophic cardiomyopathy and cardiac arrhythmias are major sources of morbidity. Cerebrovascular disease, including transient ischemic attacks and stroke, occurs at a young age. Gastrointestinal symptoms including abdominal pain, diarrhea, and nausea are common but often unrecognized. Enzyme replacement therapy with agalsidase alfa or agalsidase beta is available.",
          "char_start": 0,
          "char_end": 796,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Acroparesthesias, described as episodic burning pain in the hands and feet, are the most common childhood symptom.",
              "char_start": 0,
              "char_end": 114
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Hypohidrosis or anhidrosis leads to heat intolerance.",
              "char_start": 115,
              "char_end": 168
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Cornea verticillata, a whorl-like opacity of the corneal epithelium, is present in most affected males and many carrier females.",
              "char_start": 169,
              "char_end": 297
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Progressive nephropathy with proteinuria culminates in end-stage renal disease in untreated males by the fourth or fifth decade.",
              "char_start": 298,
              "char_end": 426
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Hypertrophic cardiomyopathy and cardiac arrhythmias are major sources of morbidity.",
              "char_start": 427,
              "char_end": 510
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Cerebrovascular disease, including transient ischemic attacks and stroke, occurs at a young age.",
              "char_start": 511,
              "char_end": 607
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Gastrointestinal symptoms including abdominal pain, diarrhea, and nausea are common but often unrecognized.",
              "char_start": 608,
              "char_end": 715
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Enzyme replacement therapy with agalsidase alfa or agalsidase beta is available.",
              "char_start": 716,
              "char_end": 796
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Acroparesthesias, described as episodic burning pain in the hands and feet, are the most common childhood symptom.",
          "char_start": 0,
          "char_end": 114
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Hypohidrosis or anhidrosis leads to heat intolerance.",
          "char_start": 115,
          "char_end": 168
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Cornea verticillata, a whorl-like opacity of the corneal epithelium, is present in most affected males and many carrier females.",
          "char_start": 169,
          "char_end": 297
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Progressive nephropathy with proteinuria culminates in end-stage renal disease in untreated males by the fourth or fifth decade.",
          "char_start": 298,
          "char_end": 426
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Hypertrophic cardiomyopathy and cardiac arrhythmias are major sources of morbidity.",
          "char_start": 427,
          "char_end": 510
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Cerebrovascular disease, including transient ischemic attacks and stroke, occurs at a young age.",
          "char_start": 511,
          "char_end": 607
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Gastrointestinal symptoms including abdominal pain, diarrhea, and nausea are common but often unrecognized.",
          "char_start": 608,
          "char_end": 715
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Enzyme replacement therapy with agalsidase alfa or agalsidase beta is available.",
          "char_start": 716,
          "char_end": 796
        }
      ]
    }
  },
  {
    "id": "disc-034",
    "chapter_title": "Stickler Syndrome",
    "existing_anchors": [
      {
        "hpo_label": "Myopia",
        "match_texts": [
          "high myopia",
          "severe myopia"
        ]
      },
      {
        "hpo_label": "Cleft palate",
        "match_texts": [
          "cleft palate"
        ]
      }
    ],
    "clinical_text": "Vitreous abnormalities are characteristic and include an optically empty vitreous or beaded vitreous strands. Retinal detachment occurs in approximately 50%–65% of individuals with type 1 and is the most significant ophthalmologic complication. Sensorineural hearing loss of varying severity develops in the majority. Joint hypermobility with early-onset osteoarthritis, particularly of the hips and knees, is a common musculoskeletal finding. Midface hypoplasia with a flat facial profile is typical. Pierre Robin sequence, consisting of micrognathia, glossoptosis, and airway obstruction, is observed in some affected neonates. Mitral valve prolapse has been described.",
    "expectedNewCandidates": [
      {
        "label": "vitreous abnormalities",
        "status": "present"
      },
      {
        "label": "retinal detachment",
        "status": "present"
      },
      {
        "label": "sensorineural hearing loss",
        "status": "present"
      },
      {
        "label": "joint hypermobility",
        "status": "present"
      },
      {
        "label": "early-onset osteoarthritis",
        "status": "present"
      },
      {
        "label": "midface hypoplasia",
        "status": "present"
      },
      {
        "label": "Pierre Robin sequence",
        "status": "present"
      },
      {
        "label": "micrognathia",
        "status": "present"
      },
      {
        "label": "mitral valve prolapse",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Myopia",
        "reason": "already_in_anchors"
      },
      {
        "label": "Cleft palate",
        "reason": "already_in_anchors"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "glossoptosis",
        "status": "present"
      },
      {
        "label": "airway obstruction",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Stickler Syndrome",
      "clinical_text": "Vitreous abnormalities are characteristic and include an optically empty vitreous or beaded vitreous strands. Retinal detachment occurs in approximately 50%–65% of individuals with type 1 and is the most significant ophthalmologic complication. Sensorineural hearing loss of varying severity develops in the majority. Joint hypermobility with early-onset osteoarthritis, particularly of the hips and knees, is a common musculoskeletal finding. Midface hypoplasia with a flat facial profile is typical. Pierre Robin sequence, consisting of micrognathia, glossoptosis, and airway obstruction, is observed in some affected neonates. Mitral valve prolapse has been described.",
      "paragraph_count": 1,
      "sentence_count": 7,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Vitreous abnormalities are characteristic and include an optically empty vitreous or beaded vitreous strands. Retinal detachment occurs in approximately 50%–65% of individuals with type 1 and is the most significant ophthalmologic complication. Sensorineural hearing loss of varying severity develops in the majority. Joint hypermobility with early-onset osteoarthritis, particularly of the hips and knees, is a common musculoskeletal finding. Midface hypoplasia with a flat facial profile is typical. Pierre Robin sequence, consisting of micrognathia, glossoptosis, and airway obstruction, is observed in some affected neonates. Mitral valve prolapse has been described.",
          "char_start": 0,
          "char_end": 671,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Vitreous abnormalities are characteristic and include an optically empty vitreous or beaded vitreous strands.",
              "char_start": 0,
              "char_end": 109
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Retinal detachment occurs in approximately 50%–65% of individuals with type 1 and is the most significant ophthalmologic complication.",
              "char_start": 110,
              "char_end": 244
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Sensorineural hearing loss of varying severity develops in the majority.",
              "char_start": 245,
              "char_end": 317
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Joint hypermobility with early-onset osteoarthritis, particularly of the hips and knees, is a common musculoskeletal finding.",
              "char_start": 318,
              "char_end": 443
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Midface hypoplasia with a flat facial profile is typical.",
              "char_start": 444,
              "char_end": 501
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Pierre Robin sequence, consisting of micrognathia, glossoptosis, and airway obstruction, is observed in some affected neonates.",
              "char_start": 502,
              "char_end": 629
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Mitral valve prolapse has been described.",
              "char_start": 630,
              "char_end": 671
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Vitreous abnormalities are characteristic and include an optically empty vitreous or beaded vitreous strands.",
          "char_start": 0,
          "char_end": 109
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Retinal detachment occurs in approximately 50%–65% of individuals with type 1 and is the most significant ophthalmologic complication.",
          "char_start": 110,
          "char_end": 244
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Sensorineural hearing loss of varying severity develops in the majority.",
          "char_start": 245,
          "char_end": 317
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Joint hypermobility with early-onset osteoarthritis, particularly of the hips and knees, is a common musculoskeletal finding.",
          "char_start": 318,
          "char_end": 443
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Midface hypoplasia with a flat facial profile is typical.",
          "char_start": 444,
          "char_end": 501
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Pierre Robin sequence, consisting of micrognathia, glossoptosis, and airway obstruction, is observed in some affected neonates.",
          "char_start": 502,
          "char_end": 629
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Mitral valve prolapse has been described.",
          "char_start": 630,
          "char_end": 671
        }
      ]
    }
  },
  {
    "id": "disc-035",
    "chapter_title": "Maple Syrup Urine Disease",
    "existing_anchors": [
      {
        "hpo_label": "Intellectual disability",
        "match_texts": [
          "intellectual disability"
        ]
      }
    ],
    "clinical_text": "Affected neonates present in the first week of life with poor feeding, lethargy, and a distinctive sweet maple syrup odor in the urine and cerumen. Encephalopathy with opisthotonus and alternating hypertonia and hypotonia develops rapidly without treatment. Seizures may occur during metabolic crises. Cerebral edema is the most dangerous acute complication. Between episodes, individuals on dietary management may have normal development, though many have subtle motor and cognitive deficits. Pancreatitis has been reported as a late complication. Plasma amino acid analysis showing elevated leucine, isoleucine, and valine with a pathognomonic alloisoleucine peak is diagnostic. Lifelong dietary restriction of branched-chain amino acids is the cornerstone of treatment.",
    "expectedNewCandidates": [
      {
        "label": "poor feeding",
        "status": "present"
      },
      {
        "label": "lethargy",
        "status": "present"
      },
      {
        "label": "sweet maple syrup odor",
        "status": "present"
      },
      {
        "label": "encephalopathy",
        "status": "present"
      },
      {
        "label": "opisthotonus",
        "status": "present"
      },
      {
        "label": "hypertonia",
        "status": "present"
      },
      {
        "label": "hypotonia",
        "status": "present"
      },
      {
        "label": "seizures",
        "status": "present"
      },
      {
        "label": "cerebral edema",
        "status": "present"
      },
      {
        "label": "pancreatitis",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Intellectual disability",
        "reason": "already_in_anchors"
      },
      {
        "label": "plasma amino acid analysis",
        "reason": "lab_or_test_method"
      },
      {
        "label": "branched-chain amino acids",
        "reason": "treatment_or_management"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "elevated leucine",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Maple Syrup Urine Disease",
      "clinical_text": "Affected neonates present in the first week of life with poor feeding, lethargy, and a distinctive sweet maple syrup odor in the urine and cerumen. Encephalopathy with opisthotonus and alternating hypertonia and hypotonia develops rapidly without treatment. Seizures may occur during metabolic crises. Cerebral edema is the most dangerous acute complication. Between episodes, individuals on dietary management may have normal development, though many have subtle motor and cognitive deficits. Pancreatitis has been reported as a late complication. Plasma amino acid analysis showing elevated leucine, isoleucine, and valine with a pathognomonic alloisoleucine peak is diagnostic. Lifelong dietary restriction of branched-chain amino acids is the cornerstone of treatment.",
      "paragraph_count": 1,
      "sentence_count": 8,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Affected neonates present in the first week of life with poor feeding, lethargy, and a distinctive sweet maple syrup odor in the urine and cerumen. Encephalopathy with opisthotonus and alternating hypertonia and hypotonia develops rapidly without treatment. Seizures may occur during metabolic crises. Cerebral edema is the most dangerous acute complication. Between episodes, individuals on dietary management may have normal development, though many have subtle motor and cognitive deficits. Pancreatitis has been reported as a late complication. Plasma amino acid analysis showing elevated leucine, isoleucine, and valine with a pathognomonic alloisoleucine peak is diagnostic. Lifelong dietary restriction of branched-chain amino acids is the cornerstone of treatment.",
          "char_start": 0,
          "char_end": 772,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Affected neonates present in the first week of life with poor feeding, lethargy, and a distinctive sweet maple syrup odor in the urine and cerumen.",
              "char_start": 0,
              "char_end": 147
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Encephalopathy with opisthotonus and alternating hypertonia and hypotonia develops rapidly without treatment.",
              "char_start": 148,
              "char_end": 257
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Seizures may occur during metabolic crises.",
              "char_start": 258,
              "char_end": 301
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Cerebral edema is the most dangerous acute complication.",
              "char_start": 302,
              "char_end": 358
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Between episodes, individuals on dietary management may have normal development, though many have subtle motor and cognitive deficits.",
              "char_start": 359,
              "char_end": 493
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Pancreatitis has been reported as a late complication.",
              "char_start": 494,
              "char_end": 548
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Plasma amino acid analysis showing elevated leucine, isoleucine, and valine with a pathognomonic alloisoleucine peak is diagnostic.",
              "char_start": 549,
              "char_end": 680
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Lifelong dietary restriction of branched-chain amino acids is the cornerstone of treatment.",
              "char_start": 681,
              "char_end": 772
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Affected neonates present in the first week of life with poor feeding, lethargy, and a distinctive sweet maple syrup odor in the urine and cerumen.",
          "char_start": 0,
          "char_end": 147
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Encephalopathy with opisthotonus and alternating hypertonia and hypotonia develops rapidly without treatment.",
          "char_start": 148,
          "char_end": 257
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Seizures may occur during metabolic crises.",
          "char_start": 258,
          "char_end": 301
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Cerebral edema is the most dangerous acute complication.",
          "char_start": 302,
          "char_end": 358
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Between episodes, individuals on dietary management may have normal development, though many have subtle motor and cognitive deficits.",
          "char_start": 359,
          "char_end": 493
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Pancreatitis has been reported as a late complication.",
          "char_start": 494,
          "char_end": 548
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Plasma amino acid analysis showing elevated leucine, isoleucine, and valine with a pathognomonic alloisoleucine peak is diagnostic.",
          "char_start": 549,
          "char_end": 680
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Lifelong dietary restriction of branched-chain amino acids is the cornerstone of treatment.",
          "char_start": 681,
          "char_end": 772
        }
      ]
    }
  },
  {
    "id": "disc-036",
    "chapter_title": "Beckwith-Wiedemann Syndrome",
    "existing_anchors": [
      {
        "hpo_label": "Macrosomia",
        "match_texts": [
          "macrosomia",
          "overgrowth"
        ]
      },
      {
        "hpo_label": "Omphalocele",
        "match_texts": [
          "omphalocele"
        ]
      }
    ],
    "clinical_text": "Macroglossia is present in the majority and may cause feeding difficulties and airway compromise in neonates. Hemihyperplasia, which may be segmental or involve an entire side of the body, is an important finding associated with increased tumor risk. Ear creases or pits are minor but diagnostically useful features. Neonatal hypoglycemia, often transient but occasionally persistent, requires monitoring. An increased risk of embryonal tumors, particularly Wilms tumor and hepatoblastoma, necessitates surveillance with abdominal ultrasound and serum alpha-fetoprotein through at least age 7. Visceromegaly involving the kidneys, liver, and spleen is common. Characteristic molecular findings include loss of methylation at IC2 or gain of methylation at IC1 on chromosome 11p15.",
    "expectedNewCandidates": [
      {
        "label": "macroglossia",
        "status": "present"
      },
      {
        "label": "hemihyperplasia",
        "status": "present"
      },
      {
        "label": "ear creases",
        "status": "present"
      },
      {
        "label": "ear pits",
        "status": "present"
      },
      {
        "label": "neonatal hypoglycemia",
        "status": "present"
      },
      {
        "label": "Wilms tumor",
        "status": "present"
      },
      {
        "label": "hepatoblastoma",
        "status": "present"
      },
      {
        "label": "visceromegaly",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Macrosomia",
        "reason": "already_in_anchors"
      },
      {
        "label": "Omphalocele",
        "reason": "already_in_anchors"
      },
      {
        "label": "abdominal ultrasound",
        "reason": "lab_or_test_method"
      },
      {
        "label": "serum alpha-fetoprotein",
        "reason": "lab_or_test_method"
      },
      {
        "label": "IC2",
        "reason": "gene_or_variant"
      },
      {
        "label": "IC1",
        "reason": "gene_or_variant"
      },
      {
        "label": "chromosome 11p15",
        "reason": "gene_or_variant"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "feeding difficulties",
        "status": "present"
      },
      {
        "label": "airway compromise",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Beckwith-Wiedemann Syndrome",
      "clinical_text": "Macroglossia is present in the majority and may cause feeding difficulties and airway compromise in neonates. Hemihyperplasia, which may be segmental or involve an entire side of the body, is an important finding associated with increased tumor risk. Ear creases or pits are minor but diagnostically useful features. Neonatal hypoglycemia, often transient but occasionally persistent, requires monitoring. An increased risk of embryonal tumors, particularly Wilms tumor and hepatoblastoma, necessitates surveillance with abdominal ultrasound and serum alpha-fetoprotein through at least age 7. Visceromegaly involving the kidneys, liver, and spleen is common. Characteristic molecular findings include loss of methylation at IC2 or gain of methylation at IC1 on chromosome 11p15.",
      "paragraph_count": 1,
      "sentence_count": 7,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Macroglossia is present in the majority and may cause feeding difficulties and airway compromise in neonates. Hemihyperplasia, which may be segmental or involve an entire side of the body, is an important finding associated with increased tumor risk. Ear creases or pits are minor but diagnostically useful features. Neonatal hypoglycemia, often transient but occasionally persistent, requires monitoring. An increased risk of embryonal tumors, particularly Wilms tumor and hepatoblastoma, necessitates surveillance with abdominal ultrasound and serum alpha-fetoprotein through at least age 7. Visceromegaly involving the kidneys, liver, and spleen is common. Characteristic molecular findings include loss of methylation at IC2 or gain of methylation at IC1 on chromosome 11p15.",
          "char_start": 0,
          "char_end": 779,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Macroglossia is present in the majority and may cause feeding difficulties and airway compromise in neonates.",
              "char_start": 0,
              "char_end": 109
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Hemihyperplasia, which may be segmental or involve an entire side of the body, is an important finding associated with increased tumor risk.",
              "char_start": 110,
              "char_end": 250
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Ear creases or pits are minor but diagnostically useful features.",
              "char_start": 251,
              "char_end": 316
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Neonatal hypoglycemia, often transient but occasionally persistent, requires monitoring.",
              "char_start": 317,
              "char_end": 405
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "An increased risk of embryonal tumors, particularly Wilms tumor and hepatoblastoma, necessitates surveillance with abdominal ultrasound and serum alpha-fetoprotein through at least age 7.",
              "char_start": 406,
              "char_end": 593
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Visceromegaly involving the kidneys, liver, and spleen is common.",
              "char_start": 594,
              "char_end": 659
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Characteristic molecular findings include loss of methylation at IC2 or gain of methylation at IC1 on chromosome 11p15.",
              "char_start": 660,
              "char_end": 779
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Macroglossia is present in the majority and may cause feeding difficulties and airway compromise in neonates.",
          "char_start": 0,
          "char_end": 109
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Hemihyperplasia, which may be segmental or involve an entire side of the body, is an important finding associated with increased tumor risk.",
          "char_start": 110,
          "char_end": 250
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Ear creases or pits are minor but diagnostically useful features.",
          "char_start": 251,
          "char_end": 316
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Neonatal hypoglycemia, often transient but occasionally persistent, requires monitoring.",
          "char_start": 317,
          "char_end": 405
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "An increased risk of embryonal tumors, particularly Wilms tumor and hepatoblastoma, necessitates surveillance with abdominal ultrasound and serum alpha-fetoprotein through at least age 7.",
          "char_start": 406,
          "char_end": 593
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Visceromegaly involving the kidneys, liver, and spleen is common.",
          "char_start": 594,
          "char_end": 659
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Characteristic molecular findings include loss of methylation at IC2 or gain of methylation at IC1 on chromosome 11p15.",
          "char_start": 660,
          "char_end": 779
        }
      ]
    }
  },
  {
    "id": "disc-037",
    "chapter_title": "Usher Syndrome Type I",
    "existing_anchors": [
      {
        "hpo_label": "Sensorineural hearing impairment",
        "match_texts": [
          "congenital profound sensorineural hearing loss"
        ]
      },
      {
        "hpo_label": "Rod-cone dystrophy",
        "match_texts": [
          "retinitis pigmentosa"
        ]
      }
    ],
    "clinical_text": "Vestibular areflexia is present from birth and results in delayed motor milestones, particularly delayed independent walking, often not achieved until 18 months or later. Night blindness is typically the first visual symptom and appears in the first decade. Progressive visual field constriction leads to tunnel vision and eventually severe visual impairment or blindness. Cataracts may develop as a secondary complication. Balance difficulties persist throughout life and falls are common. Cochlear implantation is the primary auditory habilitation strategy.",
    "expectedNewCandidates": [
      {
        "label": "vestibular areflexia",
        "status": "present"
      },
      {
        "label": "delayed motor milestones",
        "status": "present"
      },
      {
        "label": "night blindness",
        "status": "present"
      },
      {
        "label": "visual field constriction",
        "status": "present"
      },
      {
        "label": "cataracts",
        "status": "present"
      },
      {
        "label": "balance difficulties",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Sensorineural hearing impairment",
        "reason": "already_in_anchors"
      },
      {
        "label": "Rod-cone dystrophy",
        "reason": "already_in_anchors"
      },
      {
        "label": "retinitis pigmentosa",
        "reason": "already_in_anchors"
      },
      {
        "label": "cochlear implantation",
        "reason": "treatment_or_management"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "delayed walking",
        "status": "present"
      },
      {
        "label": "tunnel vision",
        "status": "present"
      },
      {
        "label": "visual impairment",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Usher Syndrome Type I",
      "clinical_text": "Vestibular areflexia is present from birth and results in delayed motor milestones, particularly delayed independent walking, often not achieved until 18 months or later. Night blindness is typically the first visual symptom and appears in the first decade. Progressive visual field constriction leads to tunnel vision and eventually severe visual impairment or blindness. Cataracts may develop as a secondary complication. Balance difficulties persist throughout life and falls are common. Cochlear implantation is the primary auditory habilitation strategy.",
      "paragraph_count": 1,
      "sentence_count": 6,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Vestibular areflexia is present from birth and results in delayed motor milestones, particularly delayed independent walking, often not achieved until 18 months or later. Night blindness is typically the first visual symptom and appears in the first decade. Progressive visual field constriction leads to tunnel vision and eventually severe visual impairment or blindness. Cataracts may develop as a secondary complication. Balance difficulties persist throughout life and falls are common. Cochlear implantation is the primary auditory habilitation strategy.",
          "char_start": 0,
          "char_end": 559,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Vestibular areflexia is present from birth and results in delayed motor milestones, particularly delayed independent walking, often not achieved until 18 months or later.",
              "char_start": 0,
              "char_end": 170
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Night blindness is typically the first visual symptom and appears in the first decade.",
              "char_start": 171,
              "char_end": 257
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Progressive visual field constriction leads to tunnel vision and eventually severe visual impairment or blindness.",
              "char_start": 258,
              "char_end": 372
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Cataracts may develop as a secondary complication.",
              "char_start": 373,
              "char_end": 423
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Balance difficulties persist throughout life and falls are common.",
              "char_start": 424,
              "char_end": 490
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Cochlear implantation is the primary auditory habilitation strategy.",
              "char_start": 491,
              "char_end": 559
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Vestibular areflexia is present from birth and results in delayed motor milestones, particularly delayed independent walking, often not achieved until 18 months or later.",
          "char_start": 0,
          "char_end": 170
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Night blindness is typically the first visual symptom and appears in the first decade.",
          "char_start": 171,
          "char_end": 257
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Progressive visual field constriction leads to tunnel vision and eventually severe visual impairment or blindness.",
          "char_start": 258,
          "char_end": 372
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Cataracts may develop as a secondary complication.",
          "char_start": 373,
          "char_end": 423
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Balance difficulties persist throughout life and falls are common.",
          "char_start": 424,
          "char_end": 490
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Cochlear implantation is the primary auditory habilitation strategy.",
          "char_start": 491,
          "char_end": 559
        }
      ]
    }
  },
  {
    "id": "disc-039",
    "chapter_title": "Congenital Adrenal Hyperplasia due to 21-Hydroxylase Deficiency",
    "existing_anchors": [
      {
        "hpo_label": "Ambiguous genitalia",
        "match_texts": [
          "ambiguous genitalia",
          "virilization of external genitalia"
        ]
      }
    ],
    "clinical_text": "In the classic salt-wasting form, affected neonates develop adrenal crisis with hyponatremia, hyperkalemia, and hypotension in the first weeks of life if untreated. The simple virilizing form presents with progressive virilization including accelerated growth, advanced bone age, premature pubarche, and eventual short adult stature from early epiphyseal fusion. In the nonclassic form, females may present with hirsutism, acne, menstrual irregularity, and infertility. Elevated 17-hydroxyprogesterone on newborn screening is used for diagnosis. Glucocorticoid and mineralocorticoid replacement is the standard of care.",
    "expectedNewCandidates": [
      {
        "label": "adrenal crisis",
        "status": "present"
      },
      {
        "label": "hyponatremia",
        "status": "present"
      },
      {
        "label": "hyperkalemia",
        "status": "present"
      },
      {
        "label": "hypotension",
        "status": "present"
      },
      {
        "label": "accelerated growth",
        "status": "present"
      },
      {
        "label": "advanced bone age",
        "status": "present"
      },
      {
        "label": "premature pubarche",
        "status": "present"
      },
      {
        "label": "short adult stature",
        "status": "present"
      },
      {
        "label": "hirsutism",
        "status": "present"
      },
      {
        "label": "acne",
        "status": "present"
      },
      {
        "label": "menstrual irregularity",
        "status": "present"
      },
      {
        "label": "infertility",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Ambiguous genitalia",
        "reason": "already_in_anchors"
      },
      {
        "label": "17-hydroxyprogesterone",
        "reason": "lab_or_test_method"
      },
      {
        "label": "newborn screening",
        "reason": "lab_or_test_method"
      },
      {
        "label": "glucocorticoid replacement",
        "reason": "treatment_or_management"
      },
      {
        "label": "mineralocorticoid replacement",
        "reason": "treatment_or_management"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "progressive virilization",
        "status": "present"
      },
      {
        "label": "early epiphyseal fusion",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Congenital Adrenal Hyperplasia due to 21-Hydroxylase Deficiency",
      "clinical_text": "In the classic salt-wasting form, affected neonates develop adrenal crisis with hyponatremia, hyperkalemia, and hypotension in the first weeks of life if untreated. The simple virilizing form presents with progressive virilization including accelerated growth, advanced bone age, premature pubarche, and eventual short adult stature from early epiphyseal fusion. In the nonclassic form, females may present with hirsutism, acne, menstrual irregularity, and infertility. Elevated 17-hydroxyprogesterone on newborn screening is used for diagnosis. Glucocorticoid and mineralocorticoid replacement is the standard of care.",
      "paragraph_count": 1,
      "sentence_count": 5,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "In the classic salt-wasting form, affected neonates develop adrenal crisis with hyponatremia, hyperkalemia, and hypotension in the first weeks of life if untreated. The simple virilizing form presents with progressive virilization including accelerated growth, advanced bone age, premature pubarche, and eventual short adult stature from early epiphyseal fusion. In the nonclassic form, females may present with hirsutism, acne, menstrual irregularity, and infertility. Elevated 17-hydroxyprogesterone on newborn screening is used for diagnosis. Glucocorticoid and mineralocorticoid replacement is the standard of care.",
          "char_start": 0,
          "char_end": 619,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "In the classic salt-wasting form, affected neonates develop adrenal crisis with hyponatremia, hyperkalemia, and hypotension in the first weeks of life if untreated.",
              "char_start": 0,
              "char_end": 164
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "The simple virilizing form presents with progressive virilization including accelerated growth, advanced bone age, premature pubarche, and eventual short adult stature from early epiphyseal fusion.",
              "char_start": 165,
              "char_end": 362
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "In the nonclassic form, females may present with hirsutism, acne, menstrual irregularity, and infertility.",
              "char_start": 363,
              "char_end": 469
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Elevated 17-hydroxyprogesterone on newborn screening is used for diagnosis.",
              "char_start": 470,
              "char_end": 545
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Glucocorticoid and mineralocorticoid replacement is the standard of care.",
              "char_start": 546,
              "char_end": 619
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "In the classic salt-wasting form, affected neonates develop adrenal crisis with hyponatremia, hyperkalemia, and hypotension in the first weeks of life if untreated.",
          "char_start": 0,
          "char_end": 164
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "The simple virilizing form presents with progressive virilization including accelerated growth, advanced bone age, premature pubarche, and eventual short adult stature from early epiphyseal fusion.",
          "char_start": 165,
          "char_end": 362
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "In the nonclassic form, females may present with hirsutism, acne, menstrual irregularity, and infertility.",
          "char_start": 363,
          "char_end": 469
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Elevated 17-hydroxyprogesterone on newborn screening is used for diagnosis.",
          "char_start": 470,
          "char_end": 545
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Glucocorticoid and mineralocorticoid replacement is the standard of care.",
          "char_start": 546,
          "char_end": 619
        }
      ]
    }
  },
  {
    "id": "disc-040",
    "chapter_title": "Bardet-Biedl Syndrome",
    "existing_anchors": [
      {
        "hpo_label": "Rod-cone dystrophy",
        "match_texts": [
          "retinal dystrophy",
          "rod-cone dystrophy"
        ]
      },
      {
        "hpo_label": "Obesity",
        "match_texts": [
          "obesity",
          "truncal obesity"
        ]
      }
    ],
    "clinical_text": "Postaxial polydactyly is present at birth in approximately 70% of individuals. Renal anomalies, including renal dysplasia and progressive chronic kidney disease, are a major cause of morbidity and mortality. Cognitive impairment ranging from learning difficulties to moderate intellectual disability is common. Hypogonadism manifests as delayed puberty and infertility. Speech delay is frequent. Diabetes mellitus develops in a subset of adults. Hepatic fibrosis may be identified on imaging or biopsy. Anosmia has been described. Night blindness is typically the earliest visual symptom, followed by progressive peripheral visual field loss.",
    "expectedNewCandidates": [
      {
        "label": "postaxial polydactyly",
        "status": "present"
      },
      {
        "label": "renal dysplasia",
        "status": "present"
      },
      {
        "label": "chronic kidney disease",
        "status": "present"
      },
      {
        "label": "cognitive impairment",
        "status": "present"
      },
      {
        "label": "hypogonadism",
        "status": "present"
      },
      {
        "label": "delayed puberty",
        "status": "present"
      },
      {
        "label": "infertility",
        "status": "present"
      },
      {
        "label": "speech delay",
        "status": "present"
      },
      {
        "label": "diabetes mellitus",
        "status": "present"
      },
      {
        "label": "hepatic fibrosis",
        "status": "present"
      },
      {
        "label": "anosmia",
        "status": "present"
      },
      {
        "label": "night blindness",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Rod-cone dystrophy",
        "reason": "already_in_anchors"
      },
      {
        "label": "Obesity",
        "reason": "already_in_anchors"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "renal anomalies",
        "status": "present"
      },
      {
        "label": "peripheral visual field loss",
        "status": "present"
      },
      {
        "label": "learning difficulties",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Bardet-Biedl Syndrome",
      "clinical_text": "Postaxial polydactyly is present at birth in approximately 70% of individuals. Renal anomalies, including renal dysplasia and progressive chronic kidney disease, are a major cause of morbidity and mortality. Cognitive impairment ranging from learning difficulties to moderate intellectual disability is common. Hypogonadism manifests as delayed puberty and infertility. Speech delay is frequent. Diabetes mellitus develops in a subset of adults. Hepatic fibrosis may be identified on imaging or biopsy. Anosmia has been described. Night blindness is typically the earliest visual symptom, followed by progressive peripheral visual field loss.",
      "paragraph_count": 1,
      "sentence_count": 9,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Postaxial polydactyly is present at birth in approximately 70% of individuals. Renal anomalies, including renal dysplasia and progressive chronic kidney disease, are a major cause of morbidity and mortality. Cognitive impairment ranging from learning difficulties to moderate intellectual disability is common. Hypogonadism manifests as delayed puberty and infertility. Speech delay is frequent. Diabetes mellitus develops in a subset of adults. Hepatic fibrosis may be identified on imaging or biopsy. Anosmia has been described. Night blindness is typically the earliest visual symptom, followed by progressive peripheral visual field loss.",
          "char_start": 0,
          "char_end": 642,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Postaxial polydactyly is present at birth in approximately 70% of individuals.",
              "char_start": 0,
              "char_end": 78
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Renal anomalies, including renal dysplasia and progressive chronic kidney disease, are a major cause of morbidity and mortality.",
              "char_start": 79,
              "char_end": 207
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Cognitive impairment ranging from learning difficulties to moderate intellectual disability is common.",
              "char_start": 208,
              "char_end": 310
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Hypogonadism manifests as delayed puberty and infertility.",
              "char_start": 311,
              "char_end": 369
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Speech delay is frequent.",
              "char_start": 370,
              "char_end": 395
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Diabetes mellitus develops in a subset of adults.",
              "char_start": 396,
              "char_end": 445
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Hepatic fibrosis may be identified on imaging or biopsy.",
              "char_start": 446,
              "char_end": 502
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Anosmia has been described.",
              "char_start": 503,
              "char_end": 530
            },
            {
              "sentence_id": "p1_s9",
              "sentence_index": 9,
              "text": "Night blindness is typically the earliest visual symptom, followed by progressive peripheral visual field loss.",
              "char_start": 531,
              "char_end": 642
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Postaxial polydactyly is present at birth in approximately 70% of individuals.",
          "char_start": 0,
          "char_end": 78
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Renal anomalies, including renal dysplasia and progressive chronic kidney disease, are a major cause of morbidity and mortality.",
          "char_start": 79,
          "char_end": 207
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Cognitive impairment ranging from learning difficulties to moderate intellectual disability is common.",
          "char_start": 208,
          "char_end": 310
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Hypogonadism manifests as delayed puberty and infertility.",
          "char_start": 311,
          "char_end": 369
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Speech delay is frequent.",
          "char_start": 370,
          "char_end": 395
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Diabetes mellitus develops in a subset of adults.",
          "char_start": 396,
          "char_end": 445
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Hepatic fibrosis may be identified on imaging or biopsy.",
          "char_start": 446,
          "char_end": 502
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Anosmia has been described.",
          "char_start": 503,
          "char_end": 530
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s9",
          "sentence_index": 9,
          "text": "Night blindness is typically the earliest visual symptom, followed by progressive peripheral visual field loss.",
          "char_start": 531,
          "char_end": 642
        }
      ]
    }
  },
  {
    "id": "disc-041",
    "chapter_title": "CHARGE Syndrome",
    "existing_anchors": [
      {
        "hpo_label": "Coloboma",
        "match_texts": [
          "coloboma",
          "ocular coloboma"
        ]
      },
      {
        "hpo_label": "Choanal atresia",
        "match_texts": [
          "choanal atresia"
        ]
      }
    ],
    "clinical_text": "Congenital heart defects are present in approximately 75%–85% of individuals, with tetralogy of Fallot and atrioventricular canal defect being the most common. Hearing loss, which may be mixed, sensorineural, or conductive, is nearly universal. Semicircular canal aplasia or hypoplasia causes vestibular dysfunction and contributes to delayed motor milestones. Cranial nerve abnormalities, particularly facial palsy and glossopharyngeal dysfunction causing swallowing difficulties, are distinctive features. Genital anomalies include micropenis, cryptorchidism, and labial hypoplasia. Growth retardation is common. Tracheoesophageal fistula occurs in a subset. CHD7 pathogenic variants are identified in the majority.",
    "expectedNewCandidates": [
      {
        "label": "congenital heart defects",
        "status": "present"
      },
      {
        "label": "tetralogy of Fallot",
        "status": "present"
      },
      {
        "label": "hearing loss",
        "status": "present"
      },
      {
        "label": "semicircular canal hypoplasia",
        "status": "present"
      },
      {
        "label": "vestibular dysfunction",
        "status": "present"
      },
      {
        "label": "delayed motor milestones",
        "status": "present"
      },
      {
        "label": "facial palsy",
        "status": "present"
      },
      {
        "label": "swallowing difficulties",
        "status": "present"
      },
      {
        "label": "micropenis",
        "status": "present"
      },
      {
        "label": "cryptorchidism",
        "status": "present"
      },
      {
        "label": "growth retardation",
        "status": "present"
      },
      {
        "label": "tracheoesophageal fistula",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Coloboma",
        "reason": "already_in_anchors"
      },
      {
        "label": "Choanal atresia",
        "reason": "already_in_anchors"
      },
      {
        "label": "CHD7",
        "reason": "gene_or_variant"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "atrioventricular canal defect",
        "status": "present"
      },
      {
        "label": "labial hypoplasia",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "CHARGE Syndrome",
      "clinical_text": "Congenital heart defects are present in approximately 75%–85% of individuals, with tetralogy of Fallot and atrioventricular canal defect being the most common. Hearing loss, which may be mixed, sensorineural, or conductive, is nearly universal. Semicircular canal aplasia or hypoplasia causes vestibular dysfunction and contributes to delayed motor milestones. Cranial nerve abnormalities, particularly facial palsy and glossopharyngeal dysfunction causing swallowing difficulties, are distinctive features. Genital anomalies include micropenis, cryptorchidism, and labial hypoplasia. Growth retardation is common. Tracheoesophageal fistula occurs in a subset. CHD7 pathogenic variants are identified in the majority.",
      "paragraph_count": 1,
      "sentence_count": 8,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Congenital heart defects are present in approximately 75%–85% of individuals, with tetralogy of Fallot and atrioventricular canal defect being the most common. Hearing loss, which may be mixed, sensorineural, or conductive, is nearly universal. Semicircular canal aplasia or hypoplasia causes vestibular dysfunction and contributes to delayed motor milestones. Cranial nerve abnormalities, particularly facial palsy and glossopharyngeal dysfunction causing swallowing difficulties, are distinctive features. Genital anomalies include micropenis, cryptorchidism, and labial hypoplasia. Growth retardation is common. Tracheoesophageal fistula occurs in a subset. CHD7 pathogenic variants are identified in the majority.",
          "char_start": 0,
          "char_end": 717,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Congenital heart defects are present in approximately 75%–85% of individuals, with tetralogy of Fallot and atrioventricular canal defect being the most common.",
              "char_start": 0,
              "char_end": 159
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Hearing loss, which may be mixed, sensorineural, or conductive, is nearly universal.",
              "char_start": 160,
              "char_end": 244
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Semicircular canal aplasia or hypoplasia causes vestibular dysfunction and contributes to delayed motor milestones.",
              "char_start": 245,
              "char_end": 360
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Cranial nerve abnormalities, particularly facial palsy and glossopharyngeal dysfunction causing swallowing difficulties, are distinctive features.",
              "char_start": 361,
              "char_end": 507
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Genital anomalies include micropenis, cryptorchidism, and labial hypoplasia.",
              "char_start": 508,
              "char_end": 584
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Growth retardation is common.",
              "char_start": 585,
              "char_end": 614
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Tracheoesophageal fistula occurs in a subset.",
              "char_start": 615,
              "char_end": 660
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "CHD7 pathogenic variants are identified in the majority.",
              "char_start": 661,
              "char_end": 717
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Congenital heart defects are present in approximately 75%–85% of individuals, with tetralogy of Fallot and atrioventricular canal defect being the most common.",
          "char_start": 0,
          "char_end": 159
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Hearing loss, which may be mixed, sensorineural, or conductive, is nearly universal.",
          "char_start": 160,
          "char_end": 244
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Semicircular canal aplasia or hypoplasia causes vestibular dysfunction and contributes to delayed motor milestones.",
          "char_start": 245,
          "char_end": 360
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Cranial nerve abnormalities, particularly facial palsy and glossopharyngeal dysfunction causing swallowing difficulties, are distinctive features.",
          "char_start": 361,
          "char_end": 507
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Genital anomalies include micropenis, cryptorchidism, and labial hypoplasia.",
          "char_start": 508,
          "char_end": 584
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Growth retardation is common.",
          "char_start": 585,
          "char_end": 614
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Tracheoesophageal fistula occurs in a subset.",
          "char_start": 615,
          "char_end": 660
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "CHD7 pathogenic variants are identified in the majority.",
          "char_start": 661,
          "char_end": 717
        }
      ]
    }
  },
  {
    "id": "disc-042",
    "chapter_title": "Familial Hypercholesterolemia",
    "existing_anchors": [
      {
        "hpo_label": "Elevated LDL cholesterol",
        "match_texts": [
          "elevated LDL cholesterol",
          "hypercholesterolemia"
        ]
      }
    ],
    "clinical_text": "Tendon xanthomas, particularly of the Achilles tendons and extensor tendons of the hands, are pathognomonic but may not appear until the third decade. Corneal arcus before age 45 is a suggestive finding. Premature atherosclerotic cardiovascular disease, including myocardial infarction and angina, is the major complication. Xanthelasma may be present. In homozygous individuals, aortic valve disease and supravalvular aortic stenosis from cholesterol deposition can occur in childhood. Blood pressure is normal unless secondary vascular disease develops. Cascade family screening using LDL cholesterol measurement or genetic testing is recommended. Statin therapy is the first-line treatment.",
    "expectedNewCandidates": [
      {
        "label": "tendon xanthomas",
        "status": "present"
      },
      {
        "label": "corneal arcus",
        "status": "present"
      },
      {
        "label": "xanthelasma",
        "status": "present"
      },
      {
        "label": "aortic valve disease",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Elevated LDL cholesterol",
        "reason": "already_in_anchors"
      },
      {
        "label": "blood pressure",
        "reason": "normal_or_preserved"
      },
      {
        "label": "LDL cholesterol measurement",
        "reason": "lab_or_test_method"
      },
      {
        "label": "genetic testing",
        "reason": "lab_or_test_method"
      },
      {
        "label": "statin therapy",
        "reason": "treatment_or_management"
      },
      {
        "label": "premature atherosclerotic cardiovascular disease",
        "reason": "not_a_phenotype"
      },
      {
        "label": "myocardial infarction",
        "reason": "conditional_or_risk_only"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "supravalvular aortic stenosis",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Familial Hypercholesterolemia",
      "clinical_text": "Tendon xanthomas, particularly of the Achilles tendons and extensor tendons of the hands, are pathognomonic but may not appear until the third decade. Corneal arcus before age 45 is a suggestive finding. Premature atherosclerotic cardiovascular disease, including myocardial infarction and angina, is the major complication. Xanthelasma may be present. In homozygous individuals, aortic valve disease and supravalvular aortic stenosis from cholesterol deposition can occur in childhood. Blood pressure is normal unless secondary vascular disease develops. Cascade family screening using LDL cholesterol measurement or genetic testing is recommended. Statin therapy is the first-line treatment.",
      "paragraph_count": 1,
      "sentence_count": 8,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Tendon xanthomas, particularly of the Achilles tendons and extensor tendons of the hands, are pathognomonic but may not appear until the third decade. Corneal arcus before age 45 is a suggestive finding. Premature atherosclerotic cardiovascular disease, including myocardial infarction and angina, is the major complication. Xanthelasma may be present. In homozygous individuals, aortic valve disease and supravalvular aortic stenosis from cholesterol deposition can occur in childhood. Blood pressure is normal unless secondary vascular disease develops. Cascade family screening using LDL cholesterol measurement or genetic testing is recommended. Statin therapy is the first-line treatment.",
          "char_start": 0,
          "char_end": 693,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Tendon xanthomas, particularly of the Achilles tendons and extensor tendons of the hands, are pathognomonic but may not appear until the third decade.",
              "char_start": 0,
              "char_end": 150
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Corneal arcus before age 45 is a suggestive finding.",
              "char_start": 151,
              "char_end": 203
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Premature atherosclerotic cardiovascular disease, including myocardial infarction and angina, is the major complication.",
              "char_start": 204,
              "char_end": 324
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Xanthelasma may be present.",
              "char_start": 325,
              "char_end": 352
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "In homozygous individuals, aortic valve disease and supravalvular aortic stenosis from cholesterol deposition can occur in childhood.",
              "char_start": 353,
              "char_end": 486
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Blood pressure is normal unless secondary vascular disease develops.",
              "char_start": 487,
              "char_end": 555
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Cascade family screening using LDL cholesterol measurement or genetic testing is recommended.",
              "char_start": 556,
              "char_end": 649
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Statin therapy is the first-line treatment.",
              "char_start": 650,
              "char_end": 693
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Tendon xanthomas, particularly of the Achilles tendons and extensor tendons of the hands, are pathognomonic but may not appear until the third decade.",
          "char_start": 0,
          "char_end": 150
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Corneal arcus before age 45 is a suggestive finding.",
          "char_start": 151,
          "char_end": 203
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Premature atherosclerotic cardiovascular disease, including myocardial infarction and angina, is the major complication.",
          "char_start": 204,
          "char_end": 324
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Xanthelasma may be present.",
          "char_start": 325,
          "char_end": 352
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "In homozygous individuals, aortic valve disease and supravalvular aortic stenosis from cholesterol deposition can occur in childhood.",
          "char_start": 353,
          "char_end": 486
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Blood pressure is normal unless secondary vascular disease develops.",
          "char_start": 487,
          "char_end": 555
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Cascade family screening using LDL cholesterol measurement or genetic testing is recommended.",
          "char_start": 556,
          "char_end": 649
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Statin therapy is the first-line treatment.",
          "char_start": 650,
          "char_end": 693
        }
      ]
    }
  },
  {
    "id": "disc-043",
    "chapter_title": "MECP2 Duplication Syndrome",
    "existing_anchors": [
      {
        "hpo_label": "Intellectual disability",
        "match_texts": [
          "severe intellectual disability"
        ]
      },
      {
        "hpo_label": "Recurrent respiratory infections",
        "match_texts": [
          "recurrent respiratory infections"
        ]
      }
    ],
    "clinical_text": "All affected males have absent or severely limited speech. Hypotonia in infancy transitions to spasticity in the lower limbs during childhood. Seizures develop in the majority by the second decade and are often refractory to treatment. Drooling is a common problem. Constipation is present in most individuals. Gastrointestinal dysmotility may be severe. Facial features are not distinctive in early life but a narrow face with prominent nose may develop. Progressive spastic paraparesis with loss of ambulation occurs in many individuals. Autistic features are described in a subset.",
    "expectedNewCandidates": [
      {
        "label": "absent speech",
        "status": "present"
      },
      {
        "label": "hypotonia",
        "status": "present"
      },
      {
        "label": "spasticity",
        "status": "present"
      },
      {
        "label": "seizures",
        "status": "present"
      },
      {
        "label": "drooling",
        "status": "present"
      },
      {
        "label": "constipation",
        "status": "present"
      },
      {
        "label": "gastrointestinal dysmotility",
        "status": "present"
      },
      {
        "label": "loss of ambulation",
        "status": "present"
      },
      {
        "label": "autistic features",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Intellectual disability",
        "reason": "already_in_anchors"
      },
      {
        "label": "Recurrent respiratory infections",
        "reason": "already_in_anchors"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "narrow face",
        "status": "present"
      },
      {
        "label": "prominent nose",
        "status": "present"
      },
      {
        "label": "spastic paraparesis",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "MECP2 Duplication Syndrome",
      "clinical_text": "All affected males have absent or severely limited speech. Hypotonia in infancy transitions to spasticity in the lower limbs during childhood. Seizures develop in the majority by the second decade and are often refractory to treatment. Drooling is a common problem. Constipation is present in most individuals. Gastrointestinal dysmotility may be severe. Facial features are not distinctive in early life but a narrow face with prominent nose may develop. Progressive spastic paraparesis with loss of ambulation occurs in many individuals. Autistic features are described in a subset.",
      "paragraph_count": 1,
      "sentence_count": 9,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "All affected males have absent or severely limited speech. Hypotonia in infancy transitions to spasticity in the lower limbs during childhood. Seizures develop in the majority by the second decade and are often refractory to treatment. Drooling is a common problem. Constipation is present in most individuals. Gastrointestinal dysmotility may be severe. Facial features are not distinctive in early life but a narrow face with prominent nose may develop. Progressive spastic paraparesis with loss of ambulation occurs in many individuals. Autistic features are described in a subset.",
          "char_start": 0,
          "char_end": 584,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "All affected males have absent or severely limited speech.",
              "char_start": 0,
              "char_end": 58
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Hypotonia in infancy transitions to spasticity in the lower limbs during childhood.",
              "char_start": 59,
              "char_end": 142
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Seizures develop in the majority by the second decade and are often refractory to treatment.",
              "char_start": 143,
              "char_end": 235
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Drooling is a common problem.",
              "char_start": 236,
              "char_end": 265
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Constipation is present in most individuals.",
              "char_start": 266,
              "char_end": 310
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Gastrointestinal dysmotility may be severe.",
              "char_start": 311,
              "char_end": 354
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Facial features are not distinctive in early life but a narrow face with prominent nose may develop.",
              "char_start": 355,
              "char_end": 455
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Progressive spastic paraparesis with loss of ambulation occurs in many individuals.",
              "char_start": 456,
              "char_end": 539
            },
            {
              "sentence_id": "p1_s9",
              "sentence_index": 9,
              "text": "Autistic features are described in a subset.",
              "char_start": 540,
              "char_end": 584
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "All affected males have absent or severely limited speech.",
          "char_start": 0,
          "char_end": 58
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Hypotonia in infancy transitions to spasticity in the lower limbs during childhood.",
          "char_start": 59,
          "char_end": 142
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Seizures develop in the majority by the second decade and are often refractory to treatment.",
          "char_start": 143,
          "char_end": 235
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Drooling is a common problem.",
          "char_start": 236,
          "char_end": 265
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Constipation is present in most individuals.",
          "char_start": 266,
          "char_end": 310
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Gastrointestinal dysmotility may be severe.",
          "char_start": 311,
          "char_end": 354
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Facial features are not distinctive in early life but a narrow face with prominent nose may develop.",
          "char_start": 355,
          "char_end": 455
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Progressive spastic paraparesis with loss of ambulation occurs in many individuals.",
          "char_start": 456,
          "char_end": 539
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s9",
          "sentence_index": 9,
          "text": "Autistic features are described in a subset.",
          "char_start": 540,
          "char_end": 584
        }
      ]
    }
  },
  {
    "id": "disc-044",
    "chapter_title": "Alpha-1 Antitrypsin Deficiency",
    "existing_anchors": [
      {
        "hpo_label": "Emphysema",
        "match_texts": [
          "panacinar emphysema",
          "emphysema"
        ]
      }
    ],
    "clinical_text": "Chronic obstructive pulmonary disease with accelerated decline in FEV1 is the predominant pulmonary manifestation, typically presenting in the third to fifth decade, earlier in smokers. Bronchiectasis may coexist. Hepatic involvement ranges from neonatal cholestasis and childhood hepatitis to cirrhosis and hepatocellular carcinoma in adults. Panniculitis, a necrotizing inflammation of subcutaneous fat, is a rare but characteristic skin manifestation. Vasculitis, particularly c-ANCA-positive granulomatosis with polyangiitis, has been associated. Alpha-1 antitrypsin serum levels and phenotyping by isoelectric focusing confirm the diagnosis. Augmentation therapy with pooled human alpha-1 antitrypsin is available for lung disease.",
    "expectedNewCandidates": [
      {
        "label": "chronic obstructive pulmonary disease",
        "status": "present"
      },
      {
        "label": "bronchiectasis",
        "status": "present"
      },
      {
        "label": "neonatal cholestasis",
        "status": "present"
      },
      {
        "label": "cirrhosis",
        "status": "present"
      },
      {
        "label": "hepatocellular carcinoma",
        "status": "present"
      },
      {
        "label": "panniculitis",
        "status": "present"
      },
      {
        "label": "vasculitis",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Emphysema",
        "reason": "already_in_anchors"
      },
      {
        "label": "alpha-1 antitrypsin serum levels",
        "reason": "lab_or_test_method"
      },
      {
        "label": "isoelectric focusing",
        "reason": "lab_or_test_method"
      },
      {
        "label": "augmentation therapy",
        "reason": "treatment_or_management"
      },
      {
        "label": "FEV1",
        "reason": "lab_or_test_method"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "childhood hepatitis",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Alpha-1 Antitrypsin Deficiency",
      "clinical_text": "Chronic obstructive pulmonary disease with accelerated decline in FEV1 is the predominant pulmonary manifestation, typically presenting in the third to fifth decade, earlier in smokers. Bronchiectasis may coexist. Hepatic involvement ranges from neonatal cholestasis and childhood hepatitis to cirrhosis and hepatocellular carcinoma in adults. Panniculitis, a necrotizing inflammation of subcutaneous fat, is a rare but characteristic skin manifestation. Vasculitis, particularly c-ANCA-positive granulomatosis with polyangiitis, has been associated. Alpha-1 antitrypsin serum levels and phenotyping by isoelectric focusing confirm the diagnosis. Augmentation therapy with pooled human alpha-1 antitrypsin is available for lung disease.",
      "paragraph_count": 1,
      "sentence_count": 7,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Chronic obstructive pulmonary disease with accelerated decline in FEV1 is the predominant pulmonary manifestation, typically presenting in the third to fifth decade, earlier in smokers. Bronchiectasis may coexist. Hepatic involvement ranges from neonatal cholestasis and childhood hepatitis to cirrhosis and hepatocellular carcinoma in adults. Panniculitis, a necrotizing inflammation of subcutaneous fat, is a rare but characteristic skin manifestation. Vasculitis, particularly c-ANCA-positive granulomatosis with polyangiitis, has been associated. Alpha-1 antitrypsin serum levels and phenotyping by isoelectric focusing confirm the diagnosis. Augmentation therapy with pooled human alpha-1 antitrypsin is available for lung disease.",
          "char_start": 0,
          "char_end": 736,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Chronic obstructive pulmonary disease with accelerated decline in FEV1 is the predominant pulmonary manifestation, typically presenting in the third to fifth decade, earlier in smokers.",
              "char_start": 0,
              "char_end": 185
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Bronchiectasis may coexist.",
              "char_start": 186,
              "char_end": 213
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Hepatic involvement ranges from neonatal cholestasis and childhood hepatitis to cirrhosis and hepatocellular carcinoma in adults.",
              "char_start": 214,
              "char_end": 343
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Panniculitis, a necrotizing inflammation of subcutaneous fat, is a rare but characteristic skin manifestation.",
              "char_start": 344,
              "char_end": 454
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Vasculitis, particularly c-ANCA-positive granulomatosis with polyangiitis, has been associated.",
              "char_start": 455,
              "char_end": 550
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Alpha-1 antitrypsin serum levels and phenotyping by isoelectric focusing confirm the diagnosis.",
              "char_start": 551,
              "char_end": 646
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Augmentation therapy with pooled human alpha-1 antitrypsin is available for lung disease.",
              "char_start": 647,
              "char_end": 736
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Chronic obstructive pulmonary disease with accelerated decline in FEV1 is the predominant pulmonary manifestation, typically presenting in the third to fifth decade, earlier in smokers.",
          "char_start": 0,
          "char_end": 185
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Bronchiectasis may coexist.",
          "char_start": 186,
          "char_end": 213
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Hepatic involvement ranges from neonatal cholestasis and childhood hepatitis to cirrhosis and hepatocellular carcinoma in adults.",
          "char_start": 214,
          "char_end": 343
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Panniculitis, a necrotizing inflammation of subcutaneous fat, is a rare but characteristic skin manifestation.",
          "char_start": 344,
          "char_end": 454
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Vasculitis, particularly c-ANCA-positive granulomatosis with polyangiitis, has been associated.",
          "char_start": 455,
          "char_end": 550
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Alpha-1 antitrypsin serum levels and phenotyping by isoelectric focusing confirm the diagnosis.",
          "char_start": 551,
          "char_end": 646
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Augmentation therapy with pooled human alpha-1 antitrypsin is available for lung disease.",
          "char_start": 647,
          "char_end": 736
        }
      ]
    }
  },
  {
    "id": "disc-045",
    "chapter_title": "Cockayne Syndrome",
    "existing_anchors": [
      {
        "hpo_label": "Growth failure",
        "match_texts": [
          "severe postnatal growth failure"
        ]
      },
      {
        "hpo_label": "Microcephaly",
        "match_texts": [
          "progressive microcephaly"
        ]
      }
    ],
    "clinical_text": "Characteristic facial features include sunken eyes, a prominent beaked nose, and large ears giving a cachectic appearance. Cutaneous photosensitivity, particularly a severe sunburn reaction, is present in most individuals. Retinal pigmentary degeneration with progressive visual loss occurs. Sensorineural hearing loss is common and progressive. Cerebellar ataxia with tremor and spasticity develop with disease progression. Peripheral neuropathy with loss of deep tendon reflexes is a consistent finding. Dental caries are frequent due to enamel hypoplasia. Cataracts develop in many individuals. Cold hands and feet reflect peripheral vasomotor dysfunction. Intracranial calcifications, particularly in the basal ganglia, are visible on neuroimaging.",
    "expectedNewCandidates": [
      {
        "label": "sunken eyes",
        "status": "present"
      },
      {
        "label": "prominent nose",
        "status": "present"
      },
      {
        "label": "photosensitivity",
        "status": "present"
      },
      {
        "label": "retinal pigmentary degeneration",
        "status": "present"
      },
      {
        "label": "sensorineural hearing loss",
        "status": "present"
      },
      {
        "label": "cerebellar ataxia",
        "status": "present"
      },
      {
        "label": "tremor",
        "status": "present"
      },
      {
        "label": "spasticity",
        "status": "present"
      },
      {
        "label": "peripheral neuropathy",
        "status": "present"
      },
      {
        "label": "absent deep tendon reflexes",
        "status": "present"
      },
      {
        "label": "dental caries",
        "status": "present"
      },
      {
        "label": "cataracts",
        "status": "present"
      },
      {
        "label": "intracranial calcifications",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Growth failure",
        "reason": "already_in_anchors"
      },
      {
        "label": "Microcephaly",
        "reason": "already_in_anchors"
      },
      {
        "label": "neuroimaging",
        "reason": "lab_or_test_method"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "enamel hypoplasia",
        "status": "present"
      },
      {
        "label": "large ears",
        "status": "present"
      },
      {
        "label": "cachectic appearance",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Cockayne Syndrome",
      "clinical_text": "Characteristic facial features include sunken eyes, a prominent beaked nose, and large ears giving a cachectic appearance. Cutaneous photosensitivity, particularly a severe sunburn reaction, is present in most individuals. Retinal pigmentary degeneration with progressive visual loss occurs. Sensorineural hearing loss is common and progressive. Cerebellar ataxia with tremor and spasticity develop with disease progression. Peripheral neuropathy with loss of deep tendon reflexes is a consistent finding. Dental caries are frequent due to enamel hypoplasia. Cataracts develop in many individuals. Cold hands and feet reflect peripheral vasomotor dysfunction. Intracranial calcifications, particularly in the basal ganglia, are visible on neuroimaging.",
      "paragraph_count": 1,
      "sentence_count": 10,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Characteristic facial features include sunken eyes, a prominent beaked nose, and large ears giving a cachectic appearance. Cutaneous photosensitivity, particularly a severe sunburn reaction, is present in most individuals. Retinal pigmentary degeneration with progressive visual loss occurs. Sensorineural hearing loss is common and progressive. Cerebellar ataxia with tremor and spasticity develop with disease progression. Peripheral neuropathy with loss of deep tendon reflexes is a consistent finding. Dental caries are frequent due to enamel hypoplasia. Cataracts develop in many individuals. Cold hands and feet reflect peripheral vasomotor dysfunction. Intracranial calcifications, particularly in the basal ganglia, are visible on neuroimaging.",
          "char_start": 0,
          "char_end": 752,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Characteristic facial features include sunken eyes, a prominent beaked nose, and large ears giving a cachectic appearance.",
              "char_start": 0,
              "char_end": 122
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Cutaneous photosensitivity, particularly a severe sunburn reaction, is present in most individuals.",
              "char_start": 123,
              "char_end": 222
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Retinal pigmentary degeneration with progressive visual loss occurs.",
              "char_start": 223,
              "char_end": 291
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Sensorineural hearing loss is common and progressive.",
              "char_start": 292,
              "char_end": 345
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Cerebellar ataxia with tremor and spasticity develop with disease progression.",
              "char_start": 346,
              "char_end": 424
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Peripheral neuropathy with loss of deep tendon reflexes is a consistent finding.",
              "char_start": 425,
              "char_end": 505
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Dental caries are frequent due to enamel hypoplasia.",
              "char_start": 506,
              "char_end": 558
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Cataracts develop in many individuals.",
              "char_start": 559,
              "char_end": 597
            },
            {
              "sentence_id": "p1_s9",
              "sentence_index": 9,
              "text": "Cold hands and feet reflect peripheral vasomotor dysfunction.",
              "char_start": 598,
              "char_end": 659
            },
            {
              "sentence_id": "p1_s10",
              "sentence_index": 10,
              "text": "Intracranial calcifications, particularly in the basal ganglia, are visible on neuroimaging.",
              "char_start": 660,
              "char_end": 752
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Characteristic facial features include sunken eyes, a prominent beaked nose, and large ears giving a cachectic appearance.",
          "char_start": 0,
          "char_end": 122
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Cutaneous photosensitivity, particularly a severe sunburn reaction, is present in most individuals.",
          "char_start": 123,
          "char_end": 222
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Retinal pigmentary degeneration with progressive visual loss occurs.",
          "char_start": 223,
          "char_end": 291
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Sensorineural hearing loss is common and progressive.",
          "char_start": 292,
          "char_end": 345
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Cerebellar ataxia with tremor and spasticity develop with disease progression.",
          "char_start": 346,
          "char_end": 424
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Peripheral neuropathy with loss of deep tendon reflexes is a consistent finding.",
          "char_start": 425,
          "char_end": 505
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Dental caries are frequent due to enamel hypoplasia.",
          "char_start": 506,
          "char_end": 558
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Cataracts develop in many individuals.",
          "char_start": 559,
          "char_end": 597
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s9",
          "sentence_index": 9,
          "text": "Cold hands and feet reflect peripheral vasomotor dysfunction.",
          "char_start": 598,
          "char_end": 659
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s10",
          "sentence_index": 10,
          "text": "Intracranial calcifications, particularly in the basal ganglia, are visible on neuroimaging.",
          "char_start": 660,
          "char_end": 752
        }
      ]
    }
  },
  {
    "id": "disc-046",
    "chapter_title": "Treacher Collins Syndrome",
    "existing_anchors": [
      {
        "hpo_label": "Malar hypoplasia",
        "match_texts": [
          "malar hypoplasia",
          "zygomatic hypoplasia"
        ]
      },
      {
        "hpo_label": "Micrognathia",
        "match_texts": [
          "micrognathia",
          "mandibular hypoplasia"
        ]
      }
    ],
    "clinical_text": "Conductive hearing loss secondary to external auditory canal atresia and ossicular chain malformation is present in most individuals. Coloboma of the lower eyelid is characteristic. Downslanting palpebral fissures are a consistent feature. Absence of lower eyelid lashes is common. Cleft palate occurs in approximately 30%. Choanal atresia or stenosis is rare but has been reported. Airway compromise from micrognathia and glossoptosis can be life-threatening in neonates and may require tracheostomy. Intelligence is typically normal. TCOF1 pathogenic variants account for the majority of cases.",
    "expectedNewCandidates": [
      {
        "label": "conductive hearing loss",
        "status": "present"
      },
      {
        "label": "external auditory canal atresia",
        "status": "present"
      },
      {
        "label": "ossicular chain malformation",
        "status": "present"
      },
      {
        "label": "coloboma of the lower eyelid",
        "status": "present"
      },
      {
        "label": "downslanting palpebral fissures",
        "status": "present"
      },
      {
        "label": "absence of lower eyelid lashes",
        "status": "present"
      },
      {
        "label": "cleft palate",
        "status": "present"
      },
      {
        "label": "airway compromise",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Malar hypoplasia",
        "reason": "already_in_anchors"
      },
      {
        "label": "Micrognathia",
        "reason": "already_in_anchors"
      },
      {
        "label": "intelligence",
        "reason": "normal_or_preserved"
      },
      {
        "label": "TCOF1",
        "reason": "gene_or_variant"
      },
      {
        "label": "tracheostomy",
        "reason": "treatment_or_management"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "choanal atresia",
        "status": "present"
      },
      {
        "label": "glossoptosis",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Treacher Collins Syndrome",
      "clinical_text": "Conductive hearing loss secondary to external auditory canal atresia and ossicular chain malformation is present in most individuals. Coloboma of the lower eyelid is characteristic. Downslanting palpebral fissures are a consistent feature. Absence of lower eyelid lashes is common. Cleft palate occurs in approximately 30%. Choanal atresia or stenosis is rare but has been reported. Airway compromise from micrognathia and glossoptosis can be life-threatening in neonates and may require tracheostomy. Intelligence is typically normal. TCOF1 pathogenic variants account for the majority of cases.",
      "paragraph_count": 1,
      "sentence_count": 9,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Conductive hearing loss secondary to external auditory canal atresia and ossicular chain malformation is present in most individuals. Coloboma of the lower eyelid is characteristic. Downslanting palpebral fissures are a consistent feature. Absence of lower eyelid lashes is common. Cleft palate occurs in approximately 30%. Choanal atresia or stenosis is rare but has been reported. Airway compromise from micrognathia and glossoptosis can be life-threatening in neonates and may require tracheostomy. Intelligence is typically normal. TCOF1 pathogenic variants account for the majority of cases.",
          "char_start": 0,
          "char_end": 596,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Conductive hearing loss secondary to external auditory canal atresia and ossicular chain malformation is present in most individuals.",
              "char_start": 0,
              "char_end": 133
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Coloboma of the lower eyelid is characteristic.",
              "char_start": 134,
              "char_end": 181
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Downslanting palpebral fissures are a consistent feature.",
              "char_start": 182,
              "char_end": 239
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Absence of lower eyelid lashes is common.",
              "char_start": 240,
              "char_end": 281
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Cleft palate occurs in approximately 30%.",
              "char_start": 282,
              "char_end": 323
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Choanal atresia or stenosis is rare but has been reported.",
              "char_start": 324,
              "char_end": 382
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Airway compromise from micrognathia and glossoptosis can be life-threatening in neonates and may require tracheostomy.",
              "char_start": 383,
              "char_end": 501
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Intelligence is typically normal.",
              "char_start": 502,
              "char_end": 535
            },
            {
              "sentence_id": "p1_s9",
              "sentence_index": 9,
              "text": "TCOF1 pathogenic variants account for the majority of cases.",
              "char_start": 536,
              "char_end": 596
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Conductive hearing loss secondary to external auditory canal atresia and ossicular chain malformation is present in most individuals.",
          "char_start": 0,
          "char_end": 133
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Coloboma of the lower eyelid is characteristic.",
          "char_start": 134,
          "char_end": 181
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Downslanting palpebral fissures are a consistent feature.",
          "char_start": 182,
          "char_end": 239
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Absence of lower eyelid lashes is common.",
          "char_start": 240,
          "char_end": 281
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Cleft palate occurs in approximately 30%.",
          "char_start": 282,
          "char_end": 323
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Choanal atresia or stenosis is rare but has been reported.",
          "char_start": 324,
          "char_end": 382
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Airway compromise from micrognathia and glossoptosis can be life-threatening in neonates and may require tracheostomy.",
          "char_start": 383,
          "char_end": 501
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Intelligence is typically normal.",
          "char_start": 502,
          "char_end": 535
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s9",
          "sentence_index": 9,
          "text": "TCOF1 pathogenic variants account for the majority of cases.",
          "char_start": 536,
          "char_end": 596
        }
      ]
    }
  },
  {
    "id": "disc-047",
    "chapter_title": "Aarskog-Scott Syndrome",
    "existing_anchors": [
      {
        "hpo_label": "Short stature",
        "match_texts": [
          "short stature"
        ]
      },
      {
        "hpo_label": "Shawl scrotum",
        "match_texts": [
          "shawl scrotum"
        ]
      }
    ],
    "clinical_text": "Facial features include widely spaced eyes, a widow peak hairline, anteverted nares, and a broad nasal bridge. Brachydactyly with clinodactyly of the fifth finger and interdigital webbing are typical hand findings. Joint hypermobility is common. Cryptorchidism is frequently present. Inguinal hernias occur in a subset. Mild to moderate intellectual disability is reported in a proportion of individuals, though many have normal intelligence. Behavioral problems including attention deficit and hyperactivity are noted. A single palmar crease may be present. FGD1 pathogenic variants are causative.",
    "expectedNewCandidates": [
      {
        "label": "hypertelorism",
        "status": "present"
      },
      {
        "label": "widow peak",
        "status": "present"
      },
      {
        "label": "anteverted nares",
        "status": "present"
      },
      {
        "label": "broad nasal bridge",
        "status": "present"
      },
      {
        "label": "brachydactyly",
        "status": "present"
      },
      {
        "label": "clinodactyly",
        "status": "present"
      },
      {
        "label": "interdigital webbing",
        "status": "present"
      },
      {
        "label": "joint hypermobility",
        "status": "present"
      },
      {
        "label": "cryptorchidism",
        "status": "present"
      },
      {
        "label": "inguinal hernia",
        "status": "present"
      },
      {
        "label": "attention deficit",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Short stature",
        "reason": "already_in_anchors"
      },
      {
        "label": "Shawl scrotum",
        "reason": "already_in_anchors"
      },
      {
        "label": "FGD1",
        "reason": "gene_or_variant"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "widely spaced eyes",
        "status": "present"
      },
      {
        "label": "single palmar crease",
        "status": "present"
      },
      {
        "label": "hyperactivity",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Aarskog-Scott Syndrome",
      "clinical_text": "Facial features include widely spaced eyes, a widow peak hairline, anteverted nares, and a broad nasal bridge. Brachydactyly with clinodactyly of the fifth finger and interdigital webbing are typical hand findings. Joint hypermobility is common. Cryptorchidism is frequently present. Inguinal hernias occur in a subset. Mild to moderate intellectual disability is reported in a proportion of individuals, though many have normal intelligence. Behavioral problems including attention deficit and hyperactivity are noted. A single palmar crease may be present. FGD1 pathogenic variants are causative.",
      "paragraph_count": 1,
      "sentence_count": 9,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Facial features include widely spaced eyes, a widow peak hairline, anteverted nares, and a broad nasal bridge. Brachydactyly with clinodactyly of the fifth finger and interdigital webbing are typical hand findings. Joint hypermobility is common. Cryptorchidism is frequently present. Inguinal hernias occur in a subset. Mild to moderate intellectual disability is reported in a proportion of individuals, though many have normal intelligence. Behavioral problems including attention deficit and hyperactivity are noted. A single palmar crease may be present. FGD1 pathogenic variants are causative.",
          "char_start": 0,
          "char_end": 598,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Facial features include widely spaced eyes, a widow peak hairline, anteverted nares, and a broad nasal bridge.",
              "char_start": 0,
              "char_end": 110
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Brachydactyly with clinodactyly of the fifth finger and interdigital webbing are typical hand findings.",
              "char_start": 111,
              "char_end": 214
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Joint hypermobility is common.",
              "char_start": 215,
              "char_end": 245
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Cryptorchidism is frequently present.",
              "char_start": 246,
              "char_end": 283
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Inguinal hernias occur in a subset.",
              "char_start": 284,
              "char_end": 319
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Mild to moderate intellectual disability is reported in a proportion of individuals, though many have normal intelligence.",
              "char_start": 320,
              "char_end": 442
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Behavioral problems including attention deficit and hyperactivity are noted.",
              "char_start": 443,
              "char_end": 519
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "A single palmar crease may be present.",
              "char_start": 520,
              "char_end": 558
            },
            {
              "sentence_id": "p1_s9",
              "sentence_index": 9,
              "text": "FGD1 pathogenic variants are causative.",
              "char_start": 559,
              "char_end": 598
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Facial features include widely spaced eyes, a widow peak hairline, anteverted nares, and a broad nasal bridge.",
          "char_start": 0,
          "char_end": 110
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Brachydactyly with clinodactyly of the fifth finger and interdigital webbing are typical hand findings.",
          "char_start": 111,
          "char_end": 214
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Joint hypermobility is common.",
          "char_start": 215,
          "char_end": 245
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Cryptorchidism is frequently present.",
          "char_start": 246,
          "char_end": 283
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Inguinal hernias occur in a subset.",
          "char_start": 284,
          "char_end": 319
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Mild to moderate intellectual disability is reported in a proportion of individuals, though many have normal intelligence.",
          "char_start": 320,
          "char_end": 442
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Behavioral problems including attention deficit and hyperactivity are noted.",
          "char_start": 443,
          "char_end": 519
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "A single palmar crease may be present.",
          "char_start": 520,
          "char_end": 558
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s9",
          "sentence_index": 9,
          "text": "FGD1 pathogenic variants are causative.",
          "char_start": 559,
          "char_end": 598
        }
      ]
    }
  },
  {
    "id": "disc-049",
    "chapter_title": "Cornelia de Lange Syndrome",
    "existing_anchors": [
      {
        "hpo_label": "Growth retardation",
        "match_texts": [
          "prenatal and postnatal growth retardation"
        ]
      },
      {
        "hpo_label": "Limb reduction defects",
        "match_texts": [
          "upper limb reduction defects"
        ]
      }
    ],
    "clinical_text": "The characteristic facial appearance includes synophrys (confluent eyebrows), long eyelashes, a short upturned nose, thin downturned lips, and micrognathia. Hirsutism of the back and extremities is common. Gastroesophageal reflux is a major source of morbidity and may cause feeding refusal, chronic vomiting, and aspiration. Hearing loss, usually sensorineural, affects approximately 80%. Intellectual disability ranges from mild to profound and correlates with the degree of structural limb involvement. Behavioral features include self-injurious behavior, autistic-like traits, and avoidance of social interaction. Seizures occur in approximately 20%. Cryptorchidism is found in most affected males.",
    "expectedNewCandidates": [
      {
        "label": "synophrys",
        "status": "present"
      },
      {
        "label": "long eyelashes",
        "status": "present"
      },
      {
        "label": "short nose",
        "status": "present"
      },
      {
        "label": "thin lips",
        "status": "present"
      },
      {
        "label": "micrognathia",
        "status": "present"
      },
      {
        "label": "hirsutism",
        "status": "present"
      },
      {
        "label": "gastroesophageal reflux",
        "status": "present"
      },
      {
        "label": "hearing loss",
        "status": "present"
      },
      {
        "label": "intellectual disability",
        "status": "present"
      },
      {
        "label": "self-injurious behavior",
        "status": "present"
      },
      {
        "label": "seizures",
        "status": "present"
      },
      {
        "label": "cryptorchidism",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Growth retardation",
        "reason": "already_in_anchors"
      },
      {
        "label": "Limb reduction defects",
        "reason": "already_in_anchors"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "chronic vomiting",
        "status": "present"
      },
      {
        "label": "feeding refusal",
        "status": "present"
      },
      {
        "label": "autistic-like traits",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Cornelia de Lange Syndrome",
      "clinical_text": "The characteristic facial appearance includes synophrys (confluent eyebrows), long eyelashes, a short upturned nose, thin downturned lips, and micrognathia. Hirsutism of the back and extremities is common. Gastroesophageal reflux is a major source of morbidity and may cause feeding refusal, chronic vomiting, and aspiration. Hearing loss, usually sensorineural, affects approximately 80%. Intellectual disability ranges from mild to profound and correlates with the degree of structural limb involvement. Behavioral features include self-injurious behavior, autistic-like traits, and avoidance of social interaction. Seizures occur in approximately 20%. Cryptorchidism is found in most affected males.",
      "paragraph_count": 1,
      "sentence_count": 8,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "The characteristic facial appearance includes synophrys (confluent eyebrows), long eyelashes, a short upturned nose, thin downturned lips, and micrognathia. Hirsutism of the back and extremities is common. Gastroesophageal reflux is a major source of morbidity and may cause feeding refusal, chronic vomiting, and aspiration. Hearing loss, usually sensorineural, affects approximately 80%. Intellectual disability ranges from mild to profound and correlates with the degree of structural limb involvement. Behavioral features include self-injurious behavior, autistic-like traits, and avoidance of social interaction. Seizures occur in approximately 20%. Cryptorchidism is found in most affected males.",
          "char_start": 0,
          "char_end": 702,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "The characteristic facial appearance includes synophrys (confluent eyebrows), long eyelashes, a short upturned nose, thin downturned lips, and micrognathia.",
              "char_start": 0,
              "char_end": 156
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Hirsutism of the back and extremities is common.",
              "char_start": 157,
              "char_end": 205
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Gastroesophageal reflux is a major source of morbidity and may cause feeding refusal, chronic vomiting, and aspiration.",
              "char_start": 206,
              "char_end": 325
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Hearing loss, usually sensorineural, affects approximately 80%.",
              "char_start": 326,
              "char_end": 389
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Intellectual disability ranges from mild to profound and correlates with the degree of structural limb involvement.",
              "char_start": 390,
              "char_end": 505
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Behavioral features include self-injurious behavior, autistic-like traits, and avoidance of social interaction.",
              "char_start": 506,
              "char_end": 617
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Seizures occur in approximately 20%.",
              "char_start": 618,
              "char_end": 654
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Cryptorchidism is found in most affected males.",
              "char_start": 655,
              "char_end": 702
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "The characteristic facial appearance includes synophrys (confluent eyebrows), long eyelashes, a short upturned nose, thin downturned lips, and micrognathia.",
          "char_start": 0,
          "char_end": 156
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Hirsutism of the back and extremities is common.",
          "char_start": 157,
          "char_end": 205
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Gastroesophageal reflux is a major source of morbidity and may cause feeding refusal, chronic vomiting, and aspiration.",
          "char_start": 206,
          "char_end": 325
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Hearing loss, usually sensorineural, affects approximately 80%.",
          "char_start": 326,
          "char_end": 389
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Intellectual disability ranges from mild to profound and correlates with the degree of structural limb involvement.",
          "char_start": 390,
          "char_end": 505
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Behavioral features include self-injurious behavior, autistic-like traits, and avoidance of social interaction.",
          "char_start": 506,
          "char_end": 617
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Seizures occur in approximately 20%.",
          "char_start": 618,
          "char_end": 654
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Cryptorchidism is found in most affected males.",
          "char_start": 655,
          "char_end": 702
        }
      ]
    }
  },
  {
    "id": "disc-050",
    "chapter_title": "Hereditary Fructose Intolerance",
    "existing_anchors": [
      {
        "hpo_label": "Hepatomegaly",
        "match_texts": [
          "hepatomegaly"
        ]
      }
    ],
    "clinical_text": "Symptoms begin when fructose, sucrose, or sorbitol are introduced into the diet, typically at weaning. Acute exposure causes nausea, vomiting, abdominal pain, and hypoglycemia. Chronic exposure leads to failure to thrive, hepatic dysfunction progressing to cirrhosis, and renal tubular dysfunction. Generalized aminoaciduria and lactic acidosis reflect metabolic derangement. An aversion to sweets and fruit is a remarkably consistent reported behavior and is protective. Dental caries are less common than expected due to fructose avoidance. Aldolase B enzyme assay or ALDOB molecular testing confirms the diagnosis. Treatment consists of strict lifelong avoidance of fructose, sucrose, and sorbitol.",
    "expectedNewCandidates": [
      {
        "label": "nausea",
        "status": "present"
      },
      {
        "label": "vomiting",
        "status": "present"
      },
      {
        "label": "abdominal pain",
        "status": "present"
      },
      {
        "label": "hypoglycemia",
        "status": "present"
      },
      {
        "label": "failure to thrive",
        "status": "present"
      },
      {
        "label": "hepatic dysfunction",
        "status": "present"
      },
      {
        "label": "cirrhosis",
        "status": "present"
      },
      {
        "label": "renal tubular dysfunction",
        "status": "present"
      },
      {
        "label": "lactic acidosis",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Hepatomegaly",
        "reason": "already_in_anchors"
      },
      {
        "label": "aldolase B enzyme assay",
        "reason": "lab_or_test_method"
      },
      {
        "label": "ALDOB",
        "reason": "gene_or_variant"
      },
      {
        "label": "fructose avoidance",
        "reason": "treatment_or_management"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "aminoaciduria",
        "status": "present"
      },
      {
        "label": "aversion to sweets",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Hereditary Fructose Intolerance",
      "clinical_text": "Symptoms begin when fructose, sucrose, or sorbitol are introduced into the diet, typically at weaning. Acute exposure causes nausea, vomiting, abdominal pain, and hypoglycemia. Chronic exposure leads to failure to thrive, hepatic dysfunction progressing to cirrhosis, and renal tubular dysfunction. Generalized aminoaciduria and lactic acidosis reflect metabolic derangement. An aversion to sweets and fruit is a remarkably consistent reported behavior and is protective. Dental caries are less common than expected due to fructose avoidance. Aldolase B enzyme assay or ALDOB molecular testing confirms the diagnosis. Treatment consists of strict lifelong avoidance of fructose, sucrose, and sorbitol.",
      "paragraph_count": 1,
      "sentence_count": 8,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Symptoms begin when fructose, sucrose, or sorbitol are introduced into the diet, typically at weaning. Acute exposure causes nausea, vomiting, abdominal pain, and hypoglycemia. Chronic exposure leads to failure to thrive, hepatic dysfunction progressing to cirrhosis, and renal tubular dysfunction. Generalized aminoaciduria and lactic acidosis reflect metabolic derangement. An aversion to sweets and fruit is a remarkably consistent reported behavior and is protective. Dental caries are less common than expected due to fructose avoidance. Aldolase B enzyme assay or ALDOB molecular testing confirms the diagnosis. Treatment consists of strict lifelong avoidance of fructose, sucrose, and sorbitol.",
          "char_start": 0,
          "char_end": 701,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Symptoms begin when fructose, sucrose, or sorbitol are introduced into the diet, typically at weaning.",
              "char_start": 0,
              "char_end": 102
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Acute exposure causes nausea, vomiting, abdominal pain, and hypoglycemia.",
              "char_start": 103,
              "char_end": 176
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Chronic exposure leads to failure to thrive, hepatic dysfunction progressing to cirrhosis, and renal tubular dysfunction.",
              "char_start": 177,
              "char_end": 298
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Generalized aminoaciduria and lactic acidosis reflect metabolic derangement.",
              "char_start": 299,
              "char_end": 375
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "An aversion to sweets and fruit is a remarkably consistent reported behavior and is protective.",
              "char_start": 376,
              "char_end": 471
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Dental caries are less common than expected due to fructose avoidance.",
              "char_start": 472,
              "char_end": 542
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Aldolase B enzyme assay or ALDOB molecular testing confirms the diagnosis.",
              "char_start": 543,
              "char_end": 617
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Treatment consists of strict lifelong avoidance of fructose, sucrose, and sorbitol.",
              "char_start": 618,
              "char_end": 701
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Symptoms begin when fructose, sucrose, or sorbitol are introduced into the diet, typically at weaning.",
          "char_start": 0,
          "char_end": 102
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Acute exposure causes nausea, vomiting, abdominal pain, and hypoglycemia.",
          "char_start": 103,
          "char_end": 176
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Chronic exposure leads to failure to thrive, hepatic dysfunction progressing to cirrhosis, and renal tubular dysfunction.",
          "char_start": 177,
          "char_end": 298
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Generalized aminoaciduria and lactic acidosis reflect metabolic derangement.",
          "char_start": 299,
          "char_end": 375
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "An aversion to sweets and fruit is a remarkably consistent reported behavior and is protective.",
          "char_start": 376,
          "char_end": 471
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Dental caries are less common than expected due to fructose avoidance.",
          "char_start": 472,
          "char_end": 542
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Aldolase B enzyme assay or ALDOB molecular testing confirms the diagnosis.",
          "char_start": 543,
          "char_end": 617
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Treatment consists of strict lifelong avoidance of fructose, sucrose, and sorbitol.",
          "char_start": 618,
          "char_end": 701
        }
      ]
    }
  },
  {
    "id": "disc-052",
    "chapter_title": "Ataxia-Telangiectasia",
    "existing_anchors": [
      {
        "hpo_label": "Ataxia",
        "match_texts": [
          "progressive cerebellar ataxia"
        ]
      },
      {
        "hpo_label": "Telangiectasia",
        "match_texts": [
          "oculocutaneous telangiectases"
        ]
      }
    ],
    "clinical_text": "Immunodeficiency with decreased levels of IgA and IgG subclasses leads to recurrent sinopulmonary infections. There is a significantly increased susceptibility to malignancy, particularly lymphoma and leukemia. Elevated serum alpha-fetoprotein is a characteristic laboratory finding but is not itself a phenotype. Oculomotor apraxia manifests as difficulty initiating voluntary eye movements. Dystonia and choreoathetosis may develop. Insulin resistance and glucose intolerance are increasingly recognized. Ovarian failure with premature menopause has been documented in females. Heterozygous carriers of ATM pathogenic variants may have a moderately increased risk of breast cancer but this remains controversial and should not be proposed as a patient phenotype.",
    "expectedNewCandidates": [
      {
        "label": "immunodeficiency",
        "status": "present"
      },
      {
        "label": "recurrent sinopulmonary infections",
        "status": "present"
      },
      {
        "label": "lymphoma",
        "status": "present"
      },
      {
        "label": "leukemia",
        "status": "present"
      },
      {
        "label": "oculomotor apraxia",
        "status": "present"
      },
      {
        "label": "dystonia",
        "status": "present"
      },
      {
        "label": "choreoathetosis",
        "status": "present"
      },
      {
        "label": "insulin resistance",
        "status": "present"
      },
      {
        "label": "glucose intolerance",
        "status": "present"
      },
      {
        "label": "ovarian failure",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Ataxia",
        "reason": "already_in_anchors"
      },
      {
        "label": "Telangiectasia",
        "reason": "already_in_anchors"
      },
      {
        "label": "alpha-fetoprotein",
        "reason": "lab_or_test_method"
      },
      {
        "label": "ATM",
        "reason": "gene_or_variant"
      },
      {
        "label": "breast cancer",
        "reason": "conditional_or_risk_only"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "decreased IgA",
        "status": "present"
      },
      {
        "label": "premature menopause",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Ataxia-Telangiectasia",
      "clinical_text": "Immunodeficiency with decreased levels of IgA and IgG subclasses leads to recurrent sinopulmonary infections. There is a significantly increased susceptibility to malignancy, particularly lymphoma and leukemia. Elevated serum alpha-fetoprotein is a characteristic laboratory finding but is not itself a phenotype. Oculomotor apraxia manifests as difficulty initiating voluntary eye movements. Dystonia and choreoathetosis may develop. Insulin resistance and glucose intolerance are increasingly recognized. Ovarian failure with premature menopause has been documented in females. Heterozygous carriers of ATM pathogenic variants may have a moderately increased risk of breast cancer but this remains controversial and should not be proposed as a patient phenotype.",
      "paragraph_count": 1,
      "sentence_count": 8,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Immunodeficiency with decreased levels of IgA and IgG subclasses leads to recurrent sinopulmonary infections. There is a significantly increased susceptibility to malignancy, particularly lymphoma and leukemia. Elevated serum alpha-fetoprotein is a characteristic laboratory finding but is not itself a phenotype. Oculomotor apraxia manifests as difficulty initiating voluntary eye movements. Dystonia and choreoathetosis may develop. Insulin resistance and glucose intolerance are increasingly recognized. Ovarian failure with premature menopause has been documented in females. Heterozygous carriers of ATM pathogenic variants may have a moderately increased risk of breast cancer but this remains controversial and should not be proposed as a patient phenotype.",
          "char_start": 0,
          "char_end": 764,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Immunodeficiency with decreased levels of IgA and IgG subclasses leads to recurrent sinopulmonary infections.",
              "char_start": 0,
              "char_end": 109
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "There is a significantly increased susceptibility to malignancy, particularly lymphoma and leukemia.",
              "char_start": 110,
              "char_end": 210
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Elevated serum alpha-fetoprotein is a characteristic laboratory finding but is not itself a phenotype.",
              "char_start": 211,
              "char_end": 313
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Oculomotor apraxia manifests as difficulty initiating voluntary eye movements.",
              "char_start": 314,
              "char_end": 392
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Dystonia and choreoathetosis may develop.",
              "char_start": 393,
              "char_end": 434
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Insulin resistance and glucose intolerance are increasingly recognized.",
              "char_start": 435,
              "char_end": 506
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Ovarian failure with premature menopause has been documented in females.",
              "char_start": 507,
              "char_end": 579
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Heterozygous carriers of ATM pathogenic variants may have a moderately increased risk of breast cancer but this remains controversial and should not be proposed as a patient phenotype.",
              "char_start": 580,
              "char_end": 764
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Immunodeficiency with decreased levels of IgA and IgG subclasses leads to recurrent sinopulmonary infections.",
          "char_start": 0,
          "char_end": 109
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "There is a significantly increased susceptibility to malignancy, particularly lymphoma and leukemia.",
          "char_start": 110,
          "char_end": 210
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Elevated serum alpha-fetoprotein is a characteristic laboratory finding but is not itself a phenotype.",
          "char_start": 211,
          "char_end": 313
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Oculomotor apraxia manifests as difficulty initiating voluntary eye movements.",
          "char_start": 314,
          "char_end": 392
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Dystonia and choreoathetosis may develop.",
          "char_start": 393,
          "char_end": 434
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Insulin resistance and glucose intolerance are increasingly recognized.",
          "char_start": 435,
          "char_end": 506
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Ovarian failure with premature menopause has been documented in females.",
          "char_start": 507,
          "char_end": 579
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Heterozygous carriers of ATM pathogenic variants may have a moderately increased risk of breast cancer but this remains controversial and should not be proposed as a patient phenotype.",
          "char_start": 580,
          "char_end": 764
        }
      ]
    }
  },
  {
    "id": "disc-054",
    "chapter_title": "Phelan-McDermid Syndrome",
    "existing_anchors": [
      {
        "hpo_label": "Global developmental delay",
        "match_texts": [
          "global developmental delay"
        ]
      },
      {
        "hpo_label": "Hypotonia",
        "match_texts": [
          "neonatal hypotonia"
        ]
      }
    ],
    "clinical_text": "Most individuals with Phelan-McDermid syndrome have absent or severely delayed expressive language, although receptive language skills are often relatively stronger. Many individuals never develop functional speech, relying instead on augmentative communication devices. Behavioral features overlap with autism spectrum disorder, with poor eye contact, repetitive behaviors, and sensory processing differences being common. Sleep disturbance including difficulty falling asleep and frequent nighttime awakenings is reported by most families. Tolerance to pain appears to be increased. Chewing on non-food items (pica) is observed frequently. Seizures develop in a proportion of individuals, sometimes after a period of apparent neurological stability. Renal anomalies have not been reported. Lymphedema is not a feature of this disorder.",
    "expectedNewCandidates": [
      {
        "label": "absent expressive language",
        "status": "present"
      },
      {
        "label": "autism spectrum disorder",
        "status": "present"
      },
      {
        "label": "poor eye contact",
        "status": "present"
      },
      {
        "label": "repetitive behaviors",
        "status": "present"
      },
      {
        "label": "sensory processing differences",
        "status": "present"
      },
      {
        "label": "sleep disturbance",
        "status": "present"
      },
      {
        "label": "increased pain tolerance",
        "status": "present"
      },
      {
        "label": "pica",
        "status": "present"
      },
      {
        "label": "seizures",
        "status": "present"
      },
      {
        "label": "renal anomalies",
        "status": "excluded"
      },
      {
        "label": "lymphedema",
        "status": "excluded"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Global developmental delay",
        "reason": "already_in_anchors"
      },
      {
        "label": "Hypotonia",
        "reason": "already_in_anchors"
      },
      {
        "label": "Phelan-McDermid syndrome",
        "reason": "not_a_phenotype"
      },
      {
        "label": "augmentative communication devices",
        "reason": "treatment_or_management"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "delayed speech",
        "status": "present"
      },
      {
        "label": "difficulty falling asleep",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Phelan-McDermid Syndrome",
      "clinical_text": "Most individuals with Phelan-McDermid syndrome have absent or severely delayed expressive language, although receptive language skills are often relatively stronger. Many individuals never develop functional speech, relying instead on augmentative communication devices. Behavioral features overlap with autism spectrum disorder, with poor eye contact, repetitive behaviors, and sensory processing differences being common. Sleep disturbance including difficulty falling asleep and frequent nighttime awakenings is reported by most families. Tolerance to pain appears to be increased. Chewing on non-food items (pica) is observed frequently. Seizures develop in a proportion of individuals, sometimes after a period of apparent neurological stability. Renal anomalies have not been reported. Lymphedema is not a feature of this disorder.",
      "paragraph_count": 1,
      "sentence_count": 9,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Most individuals with Phelan-McDermid syndrome have absent or severely delayed expressive language, although receptive language skills are often relatively stronger. Many individuals never develop functional speech, relying instead on augmentative communication devices. Behavioral features overlap with autism spectrum disorder, with poor eye contact, repetitive behaviors, and sensory processing differences being common. Sleep disturbance including difficulty falling asleep and frequent nighttime awakenings is reported by most families. Tolerance to pain appears to be increased. Chewing on non-food items (pica) is observed frequently. Seizures develop in a proportion of individuals, sometimes after a period of apparent neurological stability. Renal anomalies have not been reported. Lymphedema is not a feature of this disorder.",
          "char_start": 0,
          "char_end": 837,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Most individuals with Phelan-McDermid syndrome have absent or severely delayed expressive language, although receptive language skills are often relatively stronger.",
              "char_start": 0,
              "char_end": 165
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Many individuals never develop functional speech, relying instead on augmentative communication devices.",
              "char_start": 166,
              "char_end": 270
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Behavioral features overlap with autism spectrum disorder, with poor eye contact, repetitive behaviors, and sensory processing differences being common.",
              "char_start": 271,
              "char_end": 423
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Sleep disturbance including difficulty falling asleep and frequent nighttime awakenings is reported by most families.",
              "char_start": 424,
              "char_end": 541
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Tolerance to pain appears to be increased.",
              "char_start": 542,
              "char_end": 584
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Chewing on non-food items (pica) is observed frequently.",
              "char_start": 585,
              "char_end": 641
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Seizures develop in a proportion of individuals, sometimes after a period of apparent neurological stability.",
              "char_start": 642,
              "char_end": 751
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Renal anomalies have not been reported.",
              "char_start": 752,
              "char_end": 791
            },
            {
              "sentence_id": "p1_s9",
              "sentence_index": 9,
              "text": "Lymphedema is not a feature of this disorder.",
              "char_start": 792,
              "char_end": 837
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Most individuals with Phelan-McDermid syndrome have absent or severely delayed expressive language, although receptive language skills are often relatively stronger.",
          "char_start": 0,
          "char_end": 165
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Many individuals never develop functional speech, relying instead on augmentative communication devices.",
          "char_start": 166,
          "char_end": 270
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Behavioral features overlap with autism spectrum disorder, with poor eye contact, repetitive behaviors, and sensory processing differences being common.",
          "char_start": 271,
          "char_end": 423
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Sleep disturbance including difficulty falling asleep and frequent nighttime awakenings is reported by most families.",
          "char_start": 424,
          "char_end": 541
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Tolerance to pain appears to be increased.",
          "char_start": 542,
          "char_end": 584
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Chewing on non-food items (pica) is observed frequently.",
          "char_start": 585,
          "char_end": 641
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Seizures develop in a proportion of individuals, sometimes after a period of apparent neurological stability.",
          "char_start": 642,
          "char_end": 751
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Renal anomalies have not been reported.",
          "char_start": 752,
          "char_end": 791
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s9",
          "sentence_index": 9,
          "text": "Lymphedema is not a feature of this disorder.",
          "char_start": 792,
          "char_end": 837
        }
      ]
    }
  },
  {
    "id": "disc-056",
    "chapter_title": "KBG Syndrome",
    "existing_anchors": [
      {
        "hpo_label": "Macrodontia",
        "match_texts": [
          "macrodontia of the upper central incisors"
        ]
      },
      {
        "hpo_label": "Short stature",
        "match_texts": [
          "short stature"
        ]
      }
    ],
    "clinical_text": "Intellectual disability, usually mild, is present in the majority but a subset of individuals have normal intelligence. Skeletal findings include costal anomalies (specifically cervical ribs), delayed bone age, and brachydactyly. Seizures occur in approximately 30% and may be generalized or focal. Round face with a prominent forehead and widely spaced eyes are typical facial features in childhood. Cryptorchidism is common in males. Hearing loss, typically conductive, is described. Feeding difficulties in infancy are reported. ANKRD11 loss-of-function variants are causative. The syndrome may predispose to congenital heart defects but this association requires further study.",
    "expectedNewCandidates": [
      {
        "label": "intellectual disability",
        "status": "present"
      },
      {
        "label": "costal anomalies",
        "status": "present"
      },
      {
        "label": "cervical ribs",
        "status": "present"
      },
      {
        "label": "delayed bone age",
        "status": "present"
      },
      {
        "label": "brachydactyly",
        "status": "present"
      },
      {
        "label": "seizures",
        "status": "present"
      },
      {
        "label": "round face",
        "status": "present"
      },
      {
        "label": "prominent forehead",
        "status": "present"
      },
      {
        "label": "hypertelorism",
        "status": "present"
      },
      {
        "label": "cryptorchidism",
        "status": "present"
      },
      {
        "label": "hearing loss",
        "status": "present"
      },
      {
        "label": "feeding difficulties",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Macrodontia",
        "reason": "already_in_anchors"
      },
      {
        "label": "Short stature",
        "reason": "already_in_anchors"
      },
      {
        "label": "ANKRD11",
        "reason": "gene_or_variant"
      },
      {
        "label": "congenital heart defects",
        "reason": "conditional_or_risk_only"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "widely spaced eyes",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "KBG Syndrome",
      "clinical_text": "Intellectual disability, usually mild, is present in the majority but a subset of individuals have normal intelligence. Skeletal findings include costal anomalies (specifically cervical ribs), delayed bone age, and brachydactyly. Seizures occur in approximately 30% and may be generalized or focal. Round face with a prominent forehead and widely spaced eyes are typical facial features in childhood. Cryptorchidism is common in males. Hearing loss, typically conductive, is described. Feeding difficulties in infancy are reported. ANKRD11 loss-of-function variants are causative. The syndrome may predispose to congenital heart defects but this association requires further study.",
      "paragraph_count": 1,
      "sentence_count": 9,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Intellectual disability, usually mild, is present in the majority but a subset of individuals have normal intelligence. Skeletal findings include costal anomalies (specifically cervical ribs), delayed bone age, and brachydactyly. Seizures occur in approximately 30% and may be generalized or focal. Round face with a prominent forehead and widely spaced eyes are typical facial features in childhood. Cryptorchidism is common in males. Hearing loss, typically conductive, is described. Feeding difficulties in infancy are reported. ANKRD11 loss-of-function variants are causative. The syndrome may predispose to congenital heart defects but this association requires further study.",
          "char_start": 0,
          "char_end": 681,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Intellectual disability, usually mild, is present in the majority but a subset of individuals have normal intelligence.",
              "char_start": 0,
              "char_end": 119
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Skeletal findings include costal anomalies (specifically cervical ribs), delayed bone age, and brachydactyly.",
              "char_start": 120,
              "char_end": 229
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Seizures occur in approximately 30% and may be generalized or focal.",
              "char_start": 230,
              "char_end": 298
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Round face with a prominent forehead and widely spaced eyes are typical facial features in childhood.",
              "char_start": 299,
              "char_end": 400
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Cryptorchidism is common in males.",
              "char_start": 401,
              "char_end": 435
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Hearing loss, typically conductive, is described.",
              "char_start": 436,
              "char_end": 485
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Feeding difficulties in infancy are reported.",
              "char_start": 486,
              "char_end": 531
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "ANKRD11 loss-of-function variants are causative.",
              "char_start": 532,
              "char_end": 580
            },
            {
              "sentence_id": "p1_s9",
              "sentence_index": 9,
              "text": "The syndrome may predispose to congenital heart defects but this association requires further study.",
              "char_start": 581,
              "char_end": 681
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Intellectual disability, usually mild, is present in the majority but a subset of individuals have normal intelligence.",
          "char_start": 0,
          "char_end": 119
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Skeletal findings include costal anomalies (specifically cervical ribs), delayed bone age, and brachydactyly.",
          "char_start": 120,
          "char_end": 229
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Seizures occur in approximately 30% and may be generalized or focal.",
          "char_start": 230,
          "char_end": 298
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Round face with a prominent forehead and widely spaced eyes are typical facial features in childhood.",
          "char_start": 299,
          "char_end": 400
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Cryptorchidism is common in males.",
          "char_start": 401,
          "char_end": 435
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Hearing loss, typically conductive, is described.",
          "char_start": 436,
          "char_end": 485
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Feeding difficulties in infancy are reported.",
          "char_start": 486,
          "char_end": 531
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "ANKRD11 loss-of-function variants are causative.",
          "char_start": 532,
          "char_end": 580
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s9",
          "sentence_index": 9,
          "text": "The syndrome may predispose to congenital heart defects but this association requires further study.",
          "char_start": 581,
          "char_end": 681
        }
      ]
    }
  },
  {
    "id": "disc-057",
    "chapter_title": "MYH9-Related Disease",
    "existing_anchors": [
      {
        "hpo_label": "Thrombocytopenia",
        "match_texts": [
          "macrothrombocytopenia",
          "thrombocytopenia"
        ]
      }
    ],
    "clinical_text": "Dohle-like leukocyte inclusions on peripheral blood smear are the morphologic hallmark but are not a phenotype and should not be anchored. Sensorineural hearing loss develops in approximately 50% of individuals, typically during the second to fourth decade. Nephropathy presenting as proteinuria and progressing to end-stage renal disease occurs in roughly 25%. Presenile cataracts affect about 20%. Bleeding tendency manifests primarily as easy bruising, menorrhagia, and prolonged bleeding after surgery or dental procedures. Platelet aggregation studies are normal. Mean platelet volume is elevated on automated complete blood count.",
    "expectedNewCandidates": [
      {
        "label": "sensorineural hearing loss",
        "status": "present"
      },
      {
        "label": "nephropathy",
        "status": "present"
      },
      {
        "label": "proteinuria",
        "status": "present"
      },
      {
        "label": "end-stage renal disease",
        "status": "present"
      },
      {
        "label": "presenile cataracts",
        "status": "present"
      },
      {
        "label": "easy bruising",
        "status": "present"
      },
      {
        "label": "menorrhagia",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Thrombocytopenia",
        "reason": "already_in_anchors"
      },
      {
        "label": "Dohle-like leukocyte inclusions",
        "reason": "lab_or_test_method"
      },
      {
        "label": "peripheral blood smear",
        "reason": "lab_or_test_method"
      },
      {
        "label": "platelet aggregation studies",
        "reason": "lab_or_test_method"
      },
      {
        "label": "mean platelet volume",
        "reason": "lab_or_test_method"
      },
      {
        "label": "complete blood count",
        "reason": "lab_or_test_method"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "bleeding tendency",
        "status": "present"
      },
      {
        "label": "prolonged bleeding",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "MYH9-Related Disease",
      "clinical_text": "Dohle-like leukocyte inclusions on peripheral blood smear are the morphologic hallmark but are not a phenotype and should not be anchored. Sensorineural hearing loss develops in approximately 50% of individuals, typically during the second to fourth decade. Nephropathy presenting as proteinuria and progressing to end-stage renal disease occurs in roughly 25%. Presenile cataracts affect about 20%. Bleeding tendency manifests primarily as easy bruising, menorrhagia, and prolonged bleeding after surgery or dental procedures. Platelet aggregation studies are normal. Mean platelet volume is elevated on automated complete blood count.",
      "paragraph_count": 1,
      "sentence_count": 7,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Dohle-like leukocyte inclusions on peripheral blood smear are the morphologic hallmark but are not a phenotype and should not be anchored. Sensorineural hearing loss develops in approximately 50% of individuals, typically during the second to fourth decade. Nephropathy presenting as proteinuria and progressing to end-stage renal disease occurs in roughly 25%. Presenile cataracts affect about 20%. Bleeding tendency manifests primarily as easy bruising, menorrhagia, and prolonged bleeding after surgery or dental procedures. Platelet aggregation studies are normal. Mean platelet volume is elevated on automated complete blood count.",
          "char_start": 0,
          "char_end": 636,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Dohle-like leukocyte inclusions on peripheral blood smear are the morphologic hallmark but are not a phenotype and should not be anchored.",
              "char_start": 0,
              "char_end": 138
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Sensorineural hearing loss develops in approximately 50% of individuals, typically during the second to fourth decade.",
              "char_start": 139,
              "char_end": 257
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Nephropathy presenting as proteinuria and progressing to end-stage renal disease occurs in roughly 25%.",
              "char_start": 258,
              "char_end": 361
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Presenile cataracts affect about 20%.",
              "char_start": 362,
              "char_end": 399
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Bleeding tendency manifests primarily as easy bruising, menorrhagia, and prolonged bleeding after surgery or dental procedures.",
              "char_start": 400,
              "char_end": 527
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Platelet aggregation studies are normal.",
              "char_start": 528,
              "char_end": 568
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Mean platelet volume is elevated on automated complete blood count.",
              "char_start": 569,
              "char_end": 636
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Dohle-like leukocyte inclusions on peripheral blood smear are the morphologic hallmark but are not a phenotype and should not be anchored.",
          "char_start": 0,
          "char_end": 138
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Sensorineural hearing loss develops in approximately 50% of individuals, typically during the second to fourth decade.",
          "char_start": 139,
          "char_end": 257
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Nephropathy presenting as proteinuria and progressing to end-stage renal disease occurs in roughly 25%.",
          "char_start": 258,
          "char_end": 361
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Presenile cataracts affect about 20%.",
          "char_start": 362,
          "char_end": 399
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Bleeding tendency manifests primarily as easy bruising, menorrhagia, and prolonged bleeding after surgery or dental procedures.",
          "char_start": 400,
          "char_end": 527
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Platelet aggregation studies are normal.",
          "char_start": 528,
          "char_end": 568
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Mean platelet volume is elevated on automated complete blood count.",
          "char_start": 569,
          "char_end": 636
        }
      ]
    }
  },
  {
    "id": "disc-058",
    "chapter_title": "Joubert Syndrome",
    "existing_anchors": [
      {
        "hpo_label": "Molar tooth sign",
        "match_texts": [
          "molar tooth sign on MRI"
        ]
      },
      {
        "hpo_label": "Hypotonia",
        "match_texts": [
          "hypotonia"
        ]
      }
    ],
    "clinical_text": "Episodic hyperpnea alternating with apnea in the neonatal period is a distinctive and diagnostically useful breathing pattern; however, it typically resolves with age and should not be considered a persistent phenotype in older patients. Oculomotor apraxia is present in most individuals. Ataxia becomes evident with ambulation. Intellectual disability of variable degree is common, though a small number of individuals have normal or borderline cognitive function. Retinal dystrophy develops in a subset (Joubert syndrome with retinal involvement). Nephronophthisis is the most common renal manifestation. Hepatic fibrosis may occur. Polydactyly is observed in some genetic subtypes. Coloboma has been reported.",
    "expectedNewCandidates": [
      {
        "label": "episodic hyperpnea",
        "status": "present"
      },
      {
        "label": "apnea",
        "status": "present"
      },
      {
        "label": "oculomotor apraxia",
        "status": "present"
      },
      {
        "label": "ataxia",
        "status": "present"
      },
      {
        "label": "intellectual disability",
        "status": "present"
      },
      {
        "label": "retinal dystrophy",
        "status": "present"
      },
      {
        "label": "nephronophthisis",
        "status": "present"
      },
      {
        "label": "hepatic fibrosis",
        "status": "present"
      },
      {
        "label": "polydactyly",
        "status": "present"
      },
      {
        "label": "coloboma",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Molar tooth sign",
        "reason": "already_in_anchors"
      },
      {
        "label": "Hypotonia",
        "reason": "already_in_anchors"
      },
      {
        "label": "MRI",
        "reason": "lab_or_test_method"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "breathing irregularities",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Joubert Syndrome",
      "clinical_text": "Episodic hyperpnea alternating with apnea in the neonatal period is a distinctive and diagnostically useful breathing pattern; however, it typically resolves with age and should not be considered a persistent phenotype in older patients. Oculomotor apraxia is present in most individuals. Ataxia becomes evident with ambulation. Intellectual disability of variable degree is common, though a small number of individuals have normal or borderline cognitive function. Retinal dystrophy develops in a subset (Joubert syndrome with retinal involvement). Nephronophthisis is the most common renal manifestation. Hepatic fibrosis may occur. Polydactyly is observed in some genetic subtypes. Coloboma has been reported.",
      "paragraph_count": 1,
      "sentence_count": 9,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Episodic hyperpnea alternating with apnea in the neonatal period is a distinctive and diagnostically useful breathing pattern; however, it typically resolves with age and should not be considered a persistent phenotype in older patients. Oculomotor apraxia is present in most individuals. Ataxia becomes evident with ambulation. Intellectual disability of variable degree is common, though a small number of individuals have normal or borderline cognitive function. Retinal dystrophy develops in a subset (Joubert syndrome with retinal involvement). Nephronophthisis is the most common renal manifestation. Hepatic fibrosis may occur. Polydactyly is observed in some genetic subtypes. Coloboma has been reported.",
          "char_start": 0,
          "char_end": 712,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Episodic hyperpnea alternating with apnea in the neonatal period is a distinctive and diagnostically useful breathing pattern; however, it typically resolves with age and should not be considered a persistent phenotype in older patients.",
              "char_start": 0,
              "char_end": 237
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Oculomotor apraxia is present in most individuals.",
              "char_start": 238,
              "char_end": 288
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Ataxia becomes evident with ambulation.",
              "char_start": 289,
              "char_end": 328
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Intellectual disability of variable degree is common, though a small number of individuals have normal or borderline cognitive function.",
              "char_start": 329,
              "char_end": 465
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Retinal dystrophy develops in a subset (Joubert syndrome with retinal involvement).",
              "char_start": 466,
              "char_end": 549
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Nephronophthisis is the most common renal manifestation.",
              "char_start": 550,
              "char_end": 606
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Hepatic fibrosis may occur.",
              "char_start": 607,
              "char_end": 634
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Polydactyly is observed in some genetic subtypes.",
              "char_start": 635,
              "char_end": 684
            },
            {
              "sentence_id": "p1_s9",
              "sentence_index": 9,
              "text": "Coloboma has been reported.",
              "char_start": 685,
              "char_end": 712
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Episodic hyperpnea alternating with apnea in the neonatal period is a distinctive and diagnostically useful breathing pattern; however, it typically resolves with age and should not be considered a persistent phenotype in older patients.",
          "char_start": 0,
          "char_end": 237
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Oculomotor apraxia is present in most individuals.",
          "char_start": 238,
          "char_end": 288
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Ataxia becomes evident with ambulation.",
          "char_start": 289,
          "char_end": 328
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Intellectual disability of variable degree is common, though a small number of individuals have normal or borderline cognitive function.",
          "char_start": 329,
          "char_end": 465
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Retinal dystrophy develops in a subset (Joubert syndrome with retinal involvement).",
          "char_start": 466,
          "char_end": 549
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Nephronophthisis is the most common renal manifestation.",
          "char_start": 550,
          "char_end": 606
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Hepatic fibrosis may occur.",
          "char_start": 607,
          "char_end": 634
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Polydactyly is observed in some genetic subtypes.",
          "char_start": 635,
          "char_end": 684
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s9",
          "sentence_index": 9,
          "text": "Coloboma has been reported.",
          "char_start": 685,
          "char_end": 712
        }
      ]
    }
  },
  {
    "id": "disc-059",
    "chapter_title": "Li-Fraumeni Syndrome",
    "existing_anchors": [],
    "clinical_text": "Li-Fraumeni syndrome is a hereditary cancer predisposition syndrome caused by germline pathogenic variants in TP53. Affected individuals have an elevated lifetime risk for multiple malignancies including soft tissue sarcoma, osteosarcoma, premenopausal breast cancer, brain tumors (particularly gliomas and choroid plexus carcinomas), adrenocortical carcinoma, and leukemia. The risk of any cancer by age 30 is approximately 50%. Whole-body MRI surveillance is recommended annually beginning in childhood. No consistent dysmorphic features or developmental abnormalities have been reported. Physical examination is typically unremarkable between cancer episodes.",
    "expectedNewCandidates": [
      {
        "label": "soft tissue sarcoma",
        "status": "present"
      },
      {
        "label": "osteosarcoma",
        "status": "present"
      },
      {
        "label": "breast cancer",
        "status": "present"
      },
      {
        "label": "brain tumors",
        "status": "present"
      },
      {
        "label": "adrenocortical carcinoma",
        "status": "present"
      },
      {
        "label": "leukemia",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Li-Fraumeni syndrome",
        "reason": "not_a_phenotype"
      },
      {
        "label": "TP53",
        "reason": "gene_or_variant"
      },
      {
        "label": "whole-body MRI",
        "reason": "lab_or_test_method"
      },
      {
        "label": "dysmorphic features",
        "reason": "normal_or_preserved"
      },
      {
        "label": "physical examination",
        "reason": "normal_or_preserved"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "glioma",
        "status": "present"
      },
      {
        "label": "choroid plexus carcinoma",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Li-Fraumeni Syndrome",
      "clinical_text": "Li-Fraumeni syndrome is a hereditary cancer predisposition syndrome caused by germline pathogenic variants in TP53. Affected individuals have an elevated lifetime risk for multiple malignancies including soft tissue sarcoma, osteosarcoma, premenopausal breast cancer, brain tumors (particularly gliomas and choroid plexus carcinomas), adrenocortical carcinoma, and leukemia. The risk of any cancer by age 30 is approximately 50%. Whole-body MRI surveillance is recommended annually beginning in childhood. No consistent dysmorphic features or developmental abnormalities have been reported. Physical examination is typically unremarkable between cancer episodes.",
      "paragraph_count": 1,
      "sentence_count": 6,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Li-Fraumeni syndrome is a hereditary cancer predisposition syndrome caused by germline pathogenic variants in TP53. Affected individuals have an elevated lifetime risk for multiple malignancies including soft tissue sarcoma, osteosarcoma, premenopausal breast cancer, brain tumors (particularly gliomas and choroid plexus carcinomas), adrenocortical carcinoma, and leukemia. The risk of any cancer by age 30 is approximately 50%. Whole-body MRI surveillance is recommended annually beginning in childhood. No consistent dysmorphic features or developmental abnormalities have been reported. Physical examination is typically unremarkable between cancer episodes.",
          "char_start": 0,
          "char_end": 662,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Li-Fraumeni syndrome is a hereditary cancer predisposition syndrome caused by germline pathogenic variants in TP53.",
              "char_start": 0,
              "char_end": 115
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Affected individuals have an elevated lifetime risk for multiple malignancies including soft tissue sarcoma, osteosarcoma, premenopausal breast cancer, brain tumors (particularly gliomas and choroid plexus carcinomas), adrenocortical carcinoma, and leukemia.",
              "char_start": 116,
              "char_end": 374
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "The risk of any cancer by age 30 is approximately 50%.",
              "char_start": 375,
              "char_end": 429
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Whole-body MRI surveillance is recommended annually beginning in childhood.",
              "char_start": 430,
              "char_end": 505
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "No consistent dysmorphic features or developmental abnormalities have been reported.",
              "char_start": 506,
              "char_end": 590
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Physical examination is typically unremarkable between cancer episodes.",
              "char_start": 591,
              "char_end": 662
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Li-Fraumeni syndrome is a hereditary cancer predisposition syndrome caused by germline pathogenic variants in TP53.",
          "char_start": 0,
          "char_end": 115
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Affected individuals have an elevated lifetime risk for multiple malignancies including soft tissue sarcoma, osteosarcoma, premenopausal breast cancer, brain tumors (particularly gliomas and choroid plexus carcinomas), adrenocortical carcinoma, and leukemia.",
          "char_start": 116,
          "char_end": 374
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "The risk of any cancer by age 30 is approximately 50%.",
          "char_start": 375,
          "char_end": 429
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Whole-body MRI surveillance is recommended annually beginning in childhood.",
          "char_start": 430,
          "char_end": 505
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "No consistent dysmorphic features or developmental abnormalities have been reported.",
          "char_start": 506,
          "char_end": 590
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Physical examination is typically unremarkable between cancer episodes.",
          "char_start": 591,
          "char_end": 662
        }
      ]
    }
  },
  {
    "id": "disc-060",
    "chapter_title": "FOXP1 Syndrome",
    "existing_anchors": [
      {
        "hpo_label": "Intellectual disability",
        "match_texts": [
          "intellectual disability"
        ]
      },
      {
        "hpo_label": "Speech delay",
        "match_texts": [
          "speech and language delay"
        ]
      }
    ],
    "clinical_text": "Motor developmental milestones are mildly delayed but most children achieve independent walking. Hypotonia is present in infancy but improves with age. Expressive language is more severely affected than receptive; many individuals use two- to three-word phrases by school age, but complex sentences remain difficult. Behavioral features resemble those of autism spectrum disorder, with perseverative interests and difficulty with transitions. Anxiety is common in older children and adults. Strabismus has been reported in a proportion. Congenital heart defects have not been consistently observed. Obesity develops in some individuals in adolescence. Hypertonia has not been described. Brain MRI is nonspecific.",
    "expectedNewCandidates": [
      {
        "label": "delayed motor milestones",
        "status": "present"
      },
      {
        "label": "hypotonia",
        "status": "present"
      },
      {
        "label": "autism spectrum features",
        "status": "present"
      },
      {
        "label": "anxiety",
        "status": "present"
      },
      {
        "label": "strabismus",
        "status": "present"
      },
      {
        "label": "congenital heart defects",
        "status": "excluded"
      },
      {
        "label": "obesity",
        "status": "present"
      },
      {
        "label": "hypertonia",
        "status": "excluded"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Intellectual disability",
        "reason": "already_in_anchors"
      },
      {
        "label": "Speech delay",
        "reason": "already_in_anchors"
      },
      {
        "label": "Brain MRI",
        "reason": "lab_or_test_method"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "impaired expressive language",
        "status": "present"
      },
      {
        "label": "perseverative interests",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "FOXP1 Syndrome",
      "clinical_text": "Motor developmental milestones are mildly delayed but most children achieve independent walking. Hypotonia is present in infancy but improves with age. Expressive language is more severely affected than receptive; many individuals use two- to three-word phrases by school age, but complex sentences remain difficult. Behavioral features resemble those of autism spectrum disorder, with perseverative interests and difficulty with transitions. Anxiety is common in older children and adults. Strabismus has been reported in a proportion. Congenital heart defects have not been consistently observed. Obesity develops in some individuals in adolescence. Hypertonia has not been described. Brain MRI is nonspecific.",
      "paragraph_count": 1,
      "sentence_count": 10,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Motor developmental milestones are mildly delayed but most children achieve independent walking. Hypotonia is present in infancy but improves with age. Expressive language is more severely affected than receptive; many individuals use two- to three-word phrases by school age, but complex sentences remain difficult. Behavioral features resemble those of autism spectrum disorder, with perseverative interests and difficulty with transitions. Anxiety is common in older children and adults. Strabismus has been reported in a proportion. Congenital heart defects have not been consistently observed. Obesity develops in some individuals in adolescence. Hypertonia has not been described. Brain MRI is nonspecific.",
          "char_start": 0,
          "char_end": 712,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Motor developmental milestones are mildly delayed but most children achieve independent walking.",
              "char_start": 0,
              "char_end": 96
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Hypotonia is present in infancy but improves with age.",
              "char_start": 97,
              "char_end": 151
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Expressive language is more severely affected than receptive; many individuals use two- to three-word phrases by school age, but complex sentences remain difficult.",
              "char_start": 152,
              "char_end": 316
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Behavioral features resemble those of autism spectrum disorder, with perseverative interests and difficulty with transitions.",
              "char_start": 317,
              "char_end": 442
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Anxiety is common in older children and adults.",
              "char_start": 443,
              "char_end": 490
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Strabismus has been reported in a proportion.",
              "char_start": 491,
              "char_end": 536
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Congenital heart defects have not been consistently observed.",
              "char_start": 537,
              "char_end": 598
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Obesity develops in some individuals in adolescence.",
              "char_start": 599,
              "char_end": 651
            },
            {
              "sentence_id": "p1_s9",
              "sentence_index": 9,
              "text": "Hypertonia has not been described.",
              "char_start": 652,
              "char_end": 686
            },
            {
              "sentence_id": "p1_s10",
              "sentence_index": 10,
              "text": "Brain MRI is nonspecific.",
              "char_start": 687,
              "char_end": 712
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Motor developmental milestones are mildly delayed but most children achieve independent walking.",
          "char_start": 0,
          "char_end": 96
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Hypotonia is present in infancy but improves with age.",
          "char_start": 97,
          "char_end": 151
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Expressive language is more severely affected than receptive; many individuals use two- to three-word phrases by school age, but complex sentences remain difficult.",
          "char_start": 152,
          "char_end": 316
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Behavioral features resemble those of autism spectrum disorder, with perseverative interests and difficulty with transitions.",
          "char_start": 317,
          "char_end": 442
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Anxiety is common in older children and adults.",
          "char_start": 443,
          "char_end": 490
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Strabismus has been reported in a proportion.",
          "char_start": 491,
          "char_end": 536
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Congenital heart defects have not been consistently observed.",
          "char_start": 537,
          "char_end": 598
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Obesity develops in some individuals in adolescence.",
          "char_start": 599,
          "char_end": 651
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s9",
          "sentence_index": 9,
          "text": "Hypertonia has not been described.",
          "char_start": 652,
          "char_end": 686
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s10",
          "sentence_index": 10,
          "text": "Brain MRI is nonspecific.",
          "char_start": 687,
          "char_end": 712
        }
      ]
    }
  },
  {
    "id": "disc-061",
    "chapter_title": "Autosomal Dominant Polycystic Kidney Disease",
    "existing_anchors": [
      {
        "hpo_label": "Renal cysts",
        "match_texts": [
          "bilateral renal cysts"
        ]
      }
    ],
    "clinical_text": "Hypertension is the most common early clinical finding and frequently precedes decline in renal function. Chronic pain in the flanks and back results from cyst expansion. Hepatic cysts are the most frequent extrarenal manifestation and are more numerous in women. Intracranial aneurysms occur in approximately 8% of patients, with a higher prevalence in those with a family history of subarachnoid hemorrhage. Mitral valve prolapse and aortic root dilation have been associated. Colonic diverticulosis may occur with increased frequency. End-stage renal disease develops in approximately 50% of individuals by age 60. The total kidney volume measured by MRI is a validated biomarker for disease progression. Tolvaptan, a vasopressin V2 receptor antagonist, slows the rate of kidney growth.",
    "expectedNewCandidates": [
      {
        "label": "hypertension",
        "status": "present"
      },
      {
        "label": "chronic pain",
        "status": "present"
      },
      {
        "label": "hepatic cysts",
        "status": "present"
      },
      {
        "label": "intracranial aneurysms",
        "status": "present"
      },
      {
        "label": "mitral valve prolapse",
        "status": "present"
      },
      {
        "label": "aortic root dilation",
        "status": "present"
      },
      {
        "label": "end-stage renal disease",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Renal cysts",
        "reason": "already_in_anchors"
      },
      {
        "label": "Autosomal Dominant Polycystic Kidney Disease",
        "reason": "not_a_phenotype"
      },
      {
        "label": "total kidney volume",
        "reason": "lab_or_test_method"
      },
      {
        "label": "MRI",
        "reason": "lab_or_test_method"
      },
      {
        "label": "tolvaptan",
        "reason": "treatment_or_management"
      },
      {
        "label": "colonic diverticulosis",
        "reason": "conditional_or_risk_only"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "flank pain",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Autosomal Dominant Polycystic Kidney Disease",
      "clinical_text": "Hypertension is the most common early clinical finding and frequently precedes decline in renal function. Chronic pain in the flanks and back results from cyst expansion. Hepatic cysts are the most frequent extrarenal manifestation and are more numerous in women. Intracranial aneurysms occur in approximately 8% of patients, with a higher prevalence in those with a family history of subarachnoid hemorrhage. Mitral valve prolapse and aortic root dilation have been associated. Colonic diverticulosis may occur with increased frequency. End-stage renal disease develops in approximately 50% of individuals by age 60. The total kidney volume measured by MRI is a validated biomarker for disease progression. Tolvaptan, a vasopressin V2 receptor antagonist, slows the rate of kidney growth.",
      "paragraph_count": 1,
      "sentence_count": 9,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Hypertension is the most common early clinical finding and frequently precedes decline in renal function. Chronic pain in the flanks and back results from cyst expansion. Hepatic cysts are the most frequent extrarenal manifestation and are more numerous in women. Intracranial aneurysms occur in approximately 8% of patients, with a higher prevalence in those with a family history of subarachnoid hemorrhage. Mitral valve prolapse and aortic root dilation have been associated. Colonic diverticulosis may occur with increased frequency. End-stage renal disease develops in approximately 50% of individuals by age 60. The total kidney volume measured by MRI is a validated biomarker for disease progression. Tolvaptan, a vasopressin V2 receptor antagonist, slows the rate of kidney growth.",
          "char_start": 0,
          "char_end": 789,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Hypertension is the most common early clinical finding and frequently precedes decline in renal function.",
              "char_start": 0,
              "char_end": 105
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Chronic pain in the flanks and back results from cyst expansion.",
              "char_start": 106,
              "char_end": 170
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Hepatic cysts are the most frequent extrarenal manifestation and are more numerous in women.",
              "char_start": 171,
              "char_end": 263
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Intracranial aneurysms occur in approximately 8% of patients, with a higher prevalence in those with a family history of subarachnoid hemorrhage.",
              "char_start": 264,
              "char_end": 409
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Mitral valve prolapse and aortic root dilation have been associated.",
              "char_start": 410,
              "char_end": 478
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Colonic diverticulosis may occur with increased frequency.",
              "char_start": 479,
              "char_end": 537
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "End-stage renal disease develops in approximately 50% of individuals by age 60.",
              "char_start": 538,
              "char_end": 617
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "The total kidney volume measured by MRI is a validated biomarker for disease progression.",
              "char_start": 618,
              "char_end": 707
            },
            {
              "sentence_id": "p1_s9",
              "sentence_index": 9,
              "text": "Tolvaptan, a vasopressin V2 receptor antagonist, slows the rate of kidney growth.",
              "char_start": 708,
              "char_end": 789
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Hypertension is the most common early clinical finding and frequently precedes decline in renal function.",
          "char_start": 0,
          "char_end": 105
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Chronic pain in the flanks and back results from cyst expansion.",
          "char_start": 106,
          "char_end": 170
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Hepatic cysts are the most frequent extrarenal manifestation and are more numerous in women.",
          "char_start": 171,
          "char_end": 263
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Intracranial aneurysms occur in approximately 8% of patients, with a higher prevalence in those with a family history of subarachnoid hemorrhage.",
          "char_start": 264,
          "char_end": 409
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Mitral valve prolapse and aortic root dilation have been associated.",
          "char_start": 410,
          "char_end": 478
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Colonic diverticulosis may occur with increased frequency.",
          "char_start": 479,
          "char_end": 537
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "End-stage renal disease develops in approximately 50% of individuals by age 60.",
          "char_start": 538,
          "char_end": 617
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "The total kidney volume measured by MRI is a validated biomarker for disease progression.",
          "char_start": 618,
          "char_end": 707
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s9",
          "sentence_index": 9,
          "text": "Tolvaptan, a vasopressin V2 receptor antagonist, slows the rate of kidney growth.",
          "char_start": 708,
          "char_end": 789
        }
      ]
    }
  },
  {
    "id": "disc-062",
    "chapter_title": "Floating-Harbor Syndrome",
    "existing_anchors": [
      {
        "hpo_label": "Short stature",
        "match_texts": [
          "short stature",
          "proportionate short stature"
        ]
      },
      {
        "hpo_label": "Delayed bone age",
        "match_texts": [
          "significantly delayed bone age"
        ]
      }
    ],
    "clinical_text": "The facial appearance is distinctive, with a triangular face, deep-set eyes, long eyelashes, a broad bulbous nose, a thin upper lip with a wide mouth, and low-set ears. Expressive language delay is disproportionately severe relative to cognitive ability; most individuals eventually develop intelligible speech, but articulation remains impaired. Intellectual ability ranges from borderline to moderate intellectual disability. Celiac disease has been reported in multiple individuals but its status as a true association versus coincidence remains uncertain. Skeletal findings include clinodactyly and short thumbs. Constipation is a frequent complaint. Behavioral difficulties including stubbornness and attention problems are described by families. SRCAP truncating variants are causative.",
    "expectedNewCandidates": [
      {
        "label": "triangular face",
        "status": "present"
      },
      {
        "label": "deep-set eyes",
        "status": "present"
      },
      {
        "label": "long eyelashes",
        "status": "present"
      },
      {
        "label": "broad bulbous nose",
        "status": "present"
      },
      {
        "label": "thin upper lip",
        "status": "present"
      },
      {
        "label": "low-set ears",
        "status": "present"
      },
      {
        "label": "expressive language delay",
        "status": "present"
      },
      {
        "label": "intellectual disability",
        "status": "present"
      },
      {
        "label": "clinodactyly",
        "status": "present"
      },
      {
        "label": "short thumbs",
        "status": "present"
      },
      {
        "label": "constipation",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Short stature",
        "reason": "already_in_anchors"
      },
      {
        "label": "Delayed bone age",
        "reason": "already_in_anchors"
      },
      {
        "label": "SRCAP",
        "reason": "gene_or_variant"
      },
      {
        "label": "celiac disease",
        "reason": "conditional_or_risk_only"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "articulation impairment",
        "status": "present"
      },
      {
        "label": "wide mouth",
        "status": "present"
      },
      {
        "label": "attention problems",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Floating-Harbor Syndrome",
      "clinical_text": "The facial appearance is distinctive, with a triangular face, deep-set eyes, long eyelashes, a broad bulbous nose, a thin upper lip with a wide mouth, and low-set ears. Expressive language delay is disproportionately severe relative to cognitive ability; most individuals eventually develop intelligible speech, but articulation remains impaired. Intellectual ability ranges from borderline to moderate intellectual disability. Celiac disease has been reported in multiple individuals but its status as a true association versus coincidence remains uncertain. Skeletal findings include clinodactyly and short thumbs. Constipation is a frequent complaint. Behavioral difficulties including stubbornness and attention problems are described by families. SRCAP truncating variants are causative.",
      "paragraph_count": 1,
      "sentence_count": 8,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "The facial appearance is distinctive, with a triangular face, deep-set eyes, long eyelashes, a broad bulbous nose, a thin upper lip with a wide mouth, and low-set ears. Expressive language delay is disproportionately severe relative to cognitive ability; most individuals eventually develop intelligible speech, but articulation remains impaired. Intellectual ability ranges from borderline to moderate intellectual disability. Celiac disease has been reported in multiple individuals but its status as a true association versus coincidence remains uncertain. Skeletal findings include clinodactyly and short thumbs. Constipation is a frequent complaint. Behavioral difficulties including stubbornness and attention problems are described by families. SRCAP truncating variants are causative.",
          "char_start": 0,
          "char_end": 792,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "The facial appearance is distinctive, with a triangular face, deep-set eyes, long eyelashes, a broad bulbous nose, a thin upper lip with a wide mouth, and low-set ears.",
              "char_start": 0,
              "char_end": 168
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Expressive language delay is disproportionately severe relative to cognitive ability; most individuals eventually develop intelligible speech, but articulation remains impaired.",
              "char_start": 169,
              "char_end": 346
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Intellectual ability ranges from borderline to moderate intellectual disability.",
              "char_start": 347,
              "char_end": 427
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Celiac disease has been reported in multiple individuals but its status as a true association versus coincidence remains uncertain.",
              "char_start": 428,
              "char_end": 559
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Skeletal findings include clinodactyly and short thumbs.",
              "char_start": 560,
              "char_end": 616
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Constipation is a frequent complaint.",
              "char_start": 617,
              "char_end": 654
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Behavioral difficulties including stubbornness and attention problems are described by families.",
              "char_start": 655,
              "char_end": 751
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "SRCAP truncating variants are causative.",
              "char_start": 752,
              "char_end": 792
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "The facial appearance is distinctive, with a triangular face, deep-set eyes, long eyelashes, a broad bulbous nose, a thin upper lip with a wide mouth, and low-set ears.",
          "char_start": 0,
          "char_end": 168
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Expressive language delay is disproportionately severe relative to cognitive ability; most individuals eventually develop intelligible speech, but articulation remains impaired.",
          "char_start": 169,
          "char_end": 346
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Intellectual ability ranges from borderline to moderate intellectual disability.",
          "char_start": 347,
          "char_end": 427
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Celiac disease has been reported in multiple individuals but its status as a true association versus coincidence remains uncertain.",
          "char_start": 428,
          "char_end": 559
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Skeletal findings include clinodactyly and short thumbs.",
          "char_start": 560,
          "char_end": 616
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Constipation is a frequent complaint.",
          "char_start": 617,
          "char_end": 654
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Behavioral difficulties including stubbornness and attention problems are described by families.",
          "char_start": 655,
          "char_end": 751
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "SRCAP truncating variants are causative.",
          "char_start": 752,
          "char_end": 792
        }
      ]
    }
  },
  {
    "id": "disc-063",
    "chapter_title": "Hereditary Angioedema",
    "existing_anchors": [
      {
        "hpo_label": "Angioedema",
        "match_texts": [
          "recurrent angioedema"
        ]
      }
    ],
    "clinical_text": "Attacks involve subcutaneous swelling of the extremities, face, and genitalia, as well as submucosal edema of the gastrointestinal tract causing severe abdominal pain, nausea, vomiting, and diarrhea. Laryngeal edema is the most dangerous manifestation and the leading cause of death when untreated. Episodes are self-limited, typically resolving within 72 hours without treatment. Erythema marginatum, a non-pruritic serpiginous rash, may precede or accompany attacks. Between episodes, patients are entirely asymptomatic. C4 levels are persistently low. C1 inhibitor functional assay is the confirmatory test. Acute attacks are treated with C1 inhibitor concentrate, icatibant, or ecallantide. Long-term prophylaxis with lanadelumab or oral androgens is available.",
    "expectedNewCandidates": [
      {
        "label": "subcutaneous swelling",
        "status": "present"
      },
      {
        "label": "abdominal pain",
        "status": "present"
      },
      {
        "label": "nausea",
        "status": "present"
      },
      {
        "label": "vomiting",
        "status": "present"
      },
      {
        "label": "diarrhea",
        "status": "present"
      },
      {
        "label": "laryngeal edema",
        "status": "present"
      },
      {
        "label": "erythema marginatum",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Angioedema",
        "reason": "already_in_anchors"
      },
      {
        "label": "C4 levels",
        "reason": "lab_or_test_method"
      },
      {
        "label": "C1 inhibitor functional assay",
        "reason": "lab_or_test_method"
      },
      {
        "label": "C1 inhibitor concentrate",
        "reason": "treatment_or_management"
      },
      {
        "label": "icatibant",
        "reason": "treatment_or_management"
      },
      {
        "label": "ecallantide",
        "reason": "treatment_or_management"
      },
      {
        "label": "lanadelumab",
        "reason": "treatment_or_management"
      },
      {
        "label": "oral androgens",
        "reason": "treatment_or_management"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "gastrointestinal edema",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Hereditary Angioedema",
      "clinical_text": "Attacks involve subcutaneous swelling of the extremities, face, and genitalia, as well as submucosal edema of the gastrointestinal tract causing severe abdominal pain, nausea, vomiting, and diarrhea. Laryngeal edema is the most dangerous manifestation and the leading cause of death when untreated. Episodes are self-limited, typically resolving within 72 hours without treatment. Erythema marginatum, a non-pruritic serpiginous rash, may precede or accompany attacks. Between episodes, patients are entirely asymptomatic. C4 levels are persistently low. C1 inhibitor functional assay is the confirmatory test. Acute attacks are treated with C1 inhibitor concentrate, icatibant, or ecallantide. Long-term prophylaxis with lanadelumab or oral androgens is available.",
      "paragraph_count": 1,
      "sentence_count": 9,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Attacks involve subcutaneous swelling of the extremities, face, and genitalia, as well as submucosal edema of the gastrointestinal tract causing severe abdominal pain, nausea, vomiting, and diarrhea. Laryngeal edema is the most dangerous manifestation and the leading cause of death when untreated. Episodes are self-limited, typically resolving within 72 hours without treatment. Erythema marginatum, a non-pruritic serpiginous rash, may precede or accompany attacks. Between episodes, patients are entirely asymptomatic. C4 levels are persistently low. C1 inhibitor functional assay is the confirmatory test. Acute attacks are treated with C1 inhibitor concentrate, icatibant, or ecallantide. Long-term prophylaxis with lanadelumab or oral androgens is available.",
          "char_start": 0,
          "char_end": 765,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Attacks involve subcutaneous swelling of the extremities, face, and genitalia, as well as submucosal edema of the gastrointestinal tract causing severe abdominal pain, nausea, vomiting, and diarrhea.",
              "char_start": 0,
              "char_end": 199
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Laryngeal edema is the most dangerous manifestation and the leading cause of death when untreated.",
              "char_start": 200,
              "char_end": 298
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Episodes are self-limited, typically resolving within 72 hours without treatment.",
              "char_start": 299,
              "char_end": 380
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Erythema marginatum, a non-pruritic serpiginous rash, may precede or accompany attacks.",
              "char_start": 381,
              "char_end": 468
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Between episodes, patients are entirely asymptomatic.",
              "char_start": 469,
              "char_end": 522
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "C4 levels are persistently low.",
              "char_start": 523,
              "char_end": 554
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "C1 inhibitor functional assay is the confirmatory test.",
              "char_start": 555,
              "char_end": 610
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Acute attacks are treated with C1 inhibitor concentrate, icatibant, or ecallantide.",
              "char_start": 611,
              "char_end": 694
            },
            {
              "sentence_id": "p1_s9",
              "sentence_index": 9,
              "text": "Long-term prophylaxis with lanadelumab or oral androgens is available.",
              "char_start": 695,
              "char_end": 765
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Attacks involve subcutaneous swelling of the extremities, face, and genitalia, as well as submucosal edema of the gastrointestinal tract causing severe abdominal pain, nausea, vomiting, and diarrhea.",
          "char_start": 0,
          "char_end": 199
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Laryngeal edema is the most dangerous manifestation and the leading cause of death when untreated.",
          "char_start": 200,
          "char_end": 298
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Episodes are self-limited, typically resolving within 72 hours without treatment.",
          "char_start": 299,
          "char_end": 380
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Erythema marginatum, a non-pruritic serpiginous rash, may precede or accompany attacks.",
          "char_start": 381,
          "char_end": 468
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Between episodes, patients are entirely asymptomatic.",
          "char_start": 469,
          "char_end": 522
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "C4 levels are persistently low.",
          "char_start": 523,
          "char_end": 554
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "C1 inhibitor functional assay is the confirmatory test.",
          "char_start": 555,
          "char_end": 610
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Acute attacks are treated with C1 inhibitor concentrate, icatibant, or ecallantide.",
          "char_start": 611,
          "char_end": 694
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s9",
          "sentence_index": 9,
          "text": "Long-term prophylaxis with lanadelumab or oral androgens is available.",
          "char_start": 695,
          "char_end": 765
        }
      ]
    }
  },
  {
    "id": "disc-064",
    "chapter_title": "MECP2-Related Disorders in Males",
    "existing_anchors": [
      {
        "hpo_label": "Intellectual disability",
        "match_texts": [
          "severe intellectual disability"
        ]
      }
    ],
    "clinical_text": "Males with pathogenic MECP2 variants present a broad phenotypic spectrum. Severe neonatal encephalopathy with hypotonia, apneic episodes, and early death characterizes the most severe presentation. Less severely affected males have progressive spasticity, loss of previously acquired motor and cognitive skills, dystonia, and intractable epilepsy. Breathing abnormalities including periodic breathing during sleep have been documented. Gastrointestinal dysmotility with chronic constipation is frequent. Klinefelter syndrome (47,XXY karyotype) in combination with a MECP2 variant can produce a Rett-like phenotype in males, but this is a cytogenetic diagnosis, not a phenotype. Growth parameters are generally within the normal range in the first year of life.",
    "expectedNewCandidates": [
      {
        "label": "neonatal encephalopathy",
        "status": "present"
      },
      {
        "label": "hypotonia",
        "status": "present"
      },
      {
        "label": "apneic episodes",
        "status": "present"
      },
      {
        "label": "spasticity",
        "status": "present"
      },
      {
        "label": "loss of motor skills",
        "status": "present"
      },
      {
        "label": "loss of cognitive skills",
        "status": "present"
      },
      {
        "label": "dystonia",
        "status": "present"
      },
      {
        "label": "intractable epilepsy",
        "status": "present"
      },
      {
        "label": "periodic breathing",
        "status": "present"
      },
      {
        "label": "chronic constipation",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Intellectual disability",
        "reason": "already_in_anchors"
      },
      {
        "label": "MECP2",
        "reason": "gene_or_variant"
      },
      {
        "label": "Klinefelter syndrome",
        "reason": "not_a_phenotype"
      },
      {
        "label": "47,XXY",
        "reason": "gene_or_variant"
      },
      {
        "label": "growth parameters",
        "reason": "normal_or_preserved"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "developmental regression",
        "status": "present"
      },
      {
        "label": "gastrointestinal dysmotility",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "MECP2-Related Disorders in Males",
      "clinical_text": "Males with pathogenic MECP2 variants present a broad phenotypic spectrum. Severe neonatal encephalopathy with hypotonia, apneic episodes, and early death characterizes the most severe presentation. Less severely affected males have progressive spasticity, loss of previously acquired motor and cognitive skills, dystonia, and intractable epilepsy. Breathing abnormalities including periodic breathing during sleep have been documented. Gastrointestinal dysmotility with chronic constipation is frequent. Klinefelter syndrome (47,XXY karyotype) in combination with a MECP2 variant can produce a Rett-like phenotype in males, but this is a cytogenetic diagnosis, not a phenotype. Growth parameters are generally within the normal range in the first year of life.",
      "paragraph_count": 1,
      "sentence_count": 7,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Males with pathogenic MECP2 variants present a broad phenotypic spectrum. Severe neonatal encephalopathy with hypotonia, apneic episodes, and early death characterizes the most severe presentation. Less severely affected males have progressive spasticity, loss of previously acquired motor and cognitive skills, dystonia, and intractable epilepsy. Breathing abnormalities including periodic breathing during sleep have been documented. Gastrointestinal dysmotility with chronic constipation is frequent. Klinefelter syndrome (47,XXY karyotype) in combination with a MECP2 variant can produce a Rett-like phenotype in males, but this is a cytogenetic diagnosis, not a phenotype. Growth parameters are generally within the normal range in the first year of life.",
          "char_start": 0,
          "char_end": 760,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Males with pathogenic MECP2 variants present a broad phenotypic spectrum.",
              "char_start": 0,
              "char_end": 73
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Severe neonatal encephalopathy with hypotonia, apneic episodes, and early death characterizes the most severe presentation.",
              "char_start": 74,
              "char_end": 197
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Less severely affected males have progressive spasticity, loss of previously acquired motor and cognitive skills, dystonia, and intractable epilepsy.",
              "char_start": 198,
              "char_end": 347
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Breathing abnormalities including periodic breathing during sleep have been documented.",
              "char_start": 348,
              "char_end": 435
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Gastrointestinal dysmotility with chronic constipation is frequent.",
              "char_start": 436,
              "char_end": 503
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Klinefelter syndrome (47,XXY karyotype) in combination with a MECP2 variant can produce a Rett-like phenotype in males, but this is a cytogenetic diagnosis, not a phenotype.",
              "char_start": 504,
              "char_end": 677
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Growth parameters are generally within the normal range in the first year of life.",
              "char_start": 678,
              "char_end": 760
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Males with pathogenic MECP2 variants present a broad phenotypic spectrum.",
          "char_start": 0,
          "char_end": 73
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Severe neonatal encephalopathy with hypotonia, apneic episodes, and early death characterizes the most severe presentation.",
          "char_start": 74,
          "char_end": 197
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Less severely affected males have progressive spasticity, loss of previously acquired motor and cognitive skills, dystonia, and intractable epilepsy.",
          "char_start": 198,
          "char_end": 347
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Breathing abnormalities including periodic breathing during sleep have been documented.",
          "char_start": 348,
          "char_end": 435
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Gastrointestinal dysmotility with chronic constipation is frequent.",
          "char_start": 436,
          "char_end": 503
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Klinefelter syndrome (47,XXY karyotype) in combination with a MECP2 variant can produce a Rett-like phenotype in males, but this is a cytogenetic diagnosis, not a phenotype.",
          "char_start": 504,
          "char_end": 677
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Growth parameters are generally within the normal range in the first year of life.",
          "char_start": 678,
          "char_end": 760
        }
      ]
    }
  },
  {
    "id": "disc-071",
    "chapter_title": "Rett Syndrome (Regression-Heavy)",
    "existing_anchors": [
      {
        "hpo_label": "Stereotypic hand movements",
        "match_texts": [
          "stereotypic hand movements"
        ]
      }
    ],
    "clinical_text": "After a period of seemingly normal early development, previously acquired skills including walking, talking, and purposeful hand use were progressively lost between 12 and 30 months. The child who once spoke in two-word phrases became nonverbal. Independent ambulation, which had been achieved at 14 months, was lost by age 4 years. These children never regained the skills they lost.",
    "expectedNewCandidates": [
      {
        "label": "loss of previously acquired walking",
        "status": "present"
      },
      {
        "label": "loss of previously acquired speech",
        "status": "present"
      },
      {
        "label": "loss of purposeful hand use",
        "status": "present"
      },
      {
        "label": "developmental regression",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Stereotypic hand movements",
        "reason": "already_in_anchors"
      },
      {
        "label": "normal early development",
        "reason": "normal_or_preserved"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "absent speech",
        "status": "present"
      },
      {
        "label": "loss of ambulation",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Rett Syndrome (Regression-Heavy)",
      "clinical_text": "After a period of seemingly normal early development, previously acquired skills including walking, talking, and purposeful hand use were progressively lost between 12 and 30 months. The child who once spoke in two-word phrases became nonverbal. Independent ambulation, which had been achieved at 14 months, was lost by age 4 years. These children never regained the skills they lost.",
      "paragraph_count": 1,
      "sentence_count": 4,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "After a period of seemingly normal early development, previously acquired skills including walking, talking, and purposeful hand use were progressively lost between 12 and 30 months. The child who once spoke in two-word phrases became nonverbal. Independent ambulation, which had been achieved at 14 months, was lost by age 4 years. These children never regained the skills they lost.",
          "char_start": 0,
          "char_end": 384,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "After a period of seemingly normal early development, previously acquired skills including walking, talking, and purposeful hand use were progressively lost between 12 and 30 months.",
              "char_start": 0,
              "char_end": 182
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "The child who once spoke in two-word phrases became nonverbal.",
              "char_start": 183,
              "char_end": 245
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Independent ambulation, which had been achieved at 14 months, was lost by age 4 years.",
              "char_start": 246,
              "char_end": 332
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "These children never regained the skills they lost.",
              "char_start": 333,
              "char_end": 384
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "After a period of seemingly normal early development, previously acquired skills including walking, talking, and purposeful hand use were progressively lost between 12 and 30 months.",
          "char_start": 0,
          "char_end": 182
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "The child who once spoke in two-word phrases became nonverbal.",
          "char_start": 183,
          "char_end": 245
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Independent ambulation, which had been achieved at 14 months, was lost by age 4 years.",
          "char_start": 246,
          "char_end": 332
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "These children never regained the skills they lost.",
          "char_start": 333,
          "char_end": 384
        }
      ]
    }
  },
  {
    "id": "disc-072",
    "chapter_title": "Episodic Ataxia Type 2",
    "existing_anchors": [
      {
        "hpo_label": "Ataxia",
        "match_texts": [
          "episodic ataxia"
        ]
      }
    ],
    "clinical_text": "Episodic ataxia type 2 is an autosomal dominant disorder caused by pathogenic variants in CACNA1A. Attacks of ataxia last hours and are triggered by stress, exertion, or caffeine. Interictal nystagmus is present between attacks and may be the sole finding on examination. Progressive cerebellar atrophy visible on MRI may develop over decades. Migraine with or without aura co-occurs in approximately 50%. Acetazolamide dramatically reduces attack frequency in most individuals but is a treatment intervention, not a phenotype.",
    "expectedNewCandidates": [
      {
        "label": "nystagmus",
        "status": "present"
      },
      {
        "label": "cerebellar atrophy",
        "status": "present"
      },
      {
        "label": "migraine",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Ataxia",
        "reason": "already_in_anchors"
      },
      {
        "label": "Episodic ataxia type 2",
        "reason": "not_a_phenotype"
      },
      {
        "label": "CACNA1A",
        "reason": "gene_or_variant"
      },
      {
        "label": "autosomal dominant",
        "reason": "not_a_phenotype"
      },
      {
        "label": "MRI",
        "reason": "lab_or_test_method"
      },
      {
        "label": "acetazolamide",
        "reason": "treatment_or_management"
      }
    ],
    "acceptableExtraCandidates": [],
    "clinical_structure": {
      "chapter_title": "Episodic Ataxia Type 2",
      "clinical_text": "Episodic ataxia type 2 is an autosomal dominant disorder caused by pathogenic variants in CACNA1A. Attacks of ataxia last hours and are triggered by stress, exertion, or caffeine. Interictal nystagmus is present between attacks and may be the sole finding on examination. Progressive cerebellar atrophy visible on MRI may develop over decades. Migraine with or without aura co-occurs in approximately 50%. Acetazolamide dramatically reduces attack frequency in most individuals but is a treatment intervention, not a phenotype.",
      "paragraph_count": 1,
      "sentence_count": 6,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Episodic ataxia type 2 is an autosomal dominant disorder caused by pathogenic variants in CACNA1A. Attacks of ataxia last hours and are triggered by stress, exertion, or caffeine. Interictal nystagmus is present between attacks and may be the sole finding on examination. Progressive cerebellar atrophy visible on MRI may develop over decades. Migraine with or without aura co-occurs in approximately 50%. Acetazolamide dramatically reduces attack frequency in most individuals but is a treatment intervention, not a phenotype.",
          "char_start": 0,
          "char_end": 527,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Episodic ataxia type 2 is an autosomal dominant disorder caused by pathogenic variants in CACNA1A.",
              "char_start": 0,
              "char_end": 98
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Attacks of ataxia last hours and are triggered by stress, exertion, or caffeine.",
              "char_start": 99,
              "char_end": 179
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Interictal nystagmus is present between attacks and may be the sole finding on examination.",
              "char_start": 180,
              "char_end": 271
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Progressive cerebellar atrophy visible on MRI may develop over decades.",
              "char_start": 272,
              "char_end": 343
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Migraine with or without aura co-occurs in approximately 50%.",
              "char_start": 344,
              "char_end": 405
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Acetazolamide dramatically reduces attack frequency in most individuals but is a treatment intervention, not a phenotype.",
              "char_start": 406,
              "char_end": 527
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Episodic ataxia type 2 is an autosomal dominant disorder caused by pathogenic variants in CACNA1A.",
          "char_start": 0,
          "char_end": 98
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Attacks of ataxia last hours and are triggered by stress, exertion, or caffeine.",
          "char_start": 99,
          "char_end": 179
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Interictal nystagmus is present between attacks and may be the sole finding on examination.",
          "char_start": 180,
          "char_end": 271
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Progressive cerebellar atrophy visible on MRI may develop over decades.",
          "char_start": 272,
          "char_end": 343
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Migraine with or without aura co-occurs in approximately 50%.",
          "char_start": 344,
          "char_end": 405
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Acetazolamide dramatically reduces attack frequency in most individuals but is a treatment intervention, not a phenotype.",
          "char_start": 406,
          "char_end": 527
        }
      ]
    }
  },
  {
    "id": "disc-073",
    "chapter_title": "Crigler-Najjar Syndrome Type I",
    "existing_anchors": [
      {
        "hpo_label": "Jaundice",
        "match_texts": [
          "severe unconjugated hyperbilirubinemia",
          "neonatal jaundice"
        ]
      }
    ],
    "clinical_text": "Without treatment, progressive kernicterus develops in infancy, manifesting as hypotonia evolving to opisthotonus, oculomotor abnormalities, sensorineural hearing loss, and severe intellectual disability. Dental enamel hypoplasia may result from bilirubin deposition. Phototherapy for 10–12 hours daily is the mainstay of treatment throughout childhood. Liver transplantation is curative. Serum total bilirubin and direct bilirubin levels are monitored. UGT1A1 biallelic pathogenic variants are causative. In the absence of kernicterus, neurologic examination is normal.",
    "expectedNewCandidates": [
      {
        "label": "kernicterus",
        "status": "present"
      },
      {
        "label": "hypotonia",
        "status": "present"
      },
      {
        "label": "opisthotonus",
        "status": "present"
      },
      {
        "label": "oculomotor abnormalities",
        "status": "present"
      },
      {
        "label": "sensorineural hearing loss",
        "status": "present"
      },
      {
        "label": "intellectual disability",
        "status": "present"
      },
      {
        "label": "dental enamel hypoplasia",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Jaundice",
        "reason": "already_in_anchors"
      },
      {
        "label": "phototherapy",
        "reason": "treatment_or_management"
      },
      {
        "label": "liver transplantation",
        "reason": "treatment_or_management"
      },
      {
        "label": "serum total bilirubin",
        "reason": "lab_or_test_method"
      },
      {
        "label": "direct bilirubin",
        "reason": "lab_or_test_method"
      },
      {
        "label": "UGT1A1",
        "reason": "gene_or_variant"
      },
      {
        "label": "neurologic examination",
        "reason": "normal_or_preserved"
      }
    ],
    "acceptableExtraCandidates": [],
    "clinical_structure": {
      "chapter_title": "Crigler-Najjar Syndrome Type I",
      "clinical_text": "Without treatment, progressive kernicterus develops in infancy, manifesting as hypotonia evolving to opisthotonus, oculomotor abnormalities, sensorineural hearing loss, and severe intellectual disability. Dental enamel hypoplasia may result from bilirubin deposition. Phototherapy for 10–12 hours daily is the mainstay of treatment throughout childhood. Liver transplantation is curative. Serum total bilirubin and direct bilirubin levels are monitored. UGT1A1 biallelic pathogenic variants are causative. In the absence of kernicterus, neurologic examination is normal.",
      "paragraph_count": 1,
      "sentence_count": 7,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Without treatment, progressive kernicterus develops in infancy, manifesting as hypotonia evolving to opisthotonus, oculomotor abnormalities, sensorineural hearing loss, and severe intellectual disability. Dental enamel hypoplasia may result from bilirubin deposition. Phototherapy for 10–12 hours daily is the mainstay of treatment throughout childhood. Liver transplantation is curative. Serum total bilirubin and direct bilirubin levels are monitored. UGT1A1 biallelic pathogenic variants are causative. In the absence of kernicterus, neurologic examination is normal.",
          "char_start": 0,
          "char_end": 570,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Without treatment, progressive kernicterus develops in infancy, manifesting as hypotonia evolving to opisthotonus, oculomotor abnormalities, sensorineural hearing loss, and severe intellectual disability.",
              "char_start": 0,
              "char_end": 204
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Dental enamel hypoplasia may result from bilirubin deposition.",
              "char_start": 205,
              "char_end": 267
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Phototherapy for 10–12 hours daily is the mainstay of treatment throughout childhood.",
              "char_start": 268,
              "char_end": 353
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Liver transplantation is curative.",
              "char_start": 354,
              "char_end": 388
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Serum total bilirubin and direct bilirubin levels are monitored.",
              "char_start": 389,
              "char_end": 453
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "UGT1A1 biallelic pathogenic variants are causative.",
              "char_start": 454,
              "char_end": 505
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "In the absence of kernicterus, neurologic examination is normal.",
              "char_start": 506,
              "char_end": 570
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Without treatment, progressive kernicterus develops in infancy, manifesting as hypotonia evolving to opisthotonus, oculomotor abnormalities, sensorineural hearing loss, and severe intellectual disability.",
          "char_start": 0,
          "char_end": 204
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Dental enamel hypoplasia may result from bilirubin deposition.",
          "char_start": 205,
          "char_end": 267
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Phototherapy for 10–12 hours daily is the mainstay of treatment throughout childhood.",
          "char_start": 268,
          "char_end": 353
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Liver transplantation is curative.",
          "char_start": 354,
          "char_end": 388
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Serum total bilirubin and direct bilirubin levels are monitored.",
          "char_start": 389,
          "char_end": 453
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "UGT1A1 biallelic pathogenic variants are causative.",
          "char_start": 454,
          "char_end": 505
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "In the absence of kernicterus, neurologic examination is normal.",
          "char_start": 506,
          "char_end": 570
        }
      ]
    }
  },
  {
    "id": "disc-074",
    "chapter_title": "Waardenburg Syndrome Type I",
    "existing_anchors": [
      {
        "hpo_label": "Sensorineural hearing impairment",
        "match_texts": [
          "sensorineural hearing loss"
        ]
      },
      {
        "hpo_label": "Heterochromia iridis",
        "match_texts": [
          "heterochromia iridis"
        ]
      }
    ],
    "clinical_text": "Dystopia canthorum, defined as lateral displacement of the inner canthi, is the defining feature of type I and is measured using the W index. A white forelock or premature graying of hair is present in 20%–50%. Skin depigmentation patches may be present at birth. Broad nasal root contributes to the characteristic facial appearance. Synophrys occurs in some. PAX3 pathogenic variants are causative. Waardenburg syndrome type I should not be confused with Waardenburg syndrome type II, which lacks dystopia canthorum. The syndrome is named after Dutch ophthalmologist Petrus Johannes Waardenburg.",
    "expectedNewCandidates": [
      {
        "label": "dystopia canthorum",
        "status": "present"
      },
      {
        "label": "white forelock",
        "status": "present"
      },
      {
        "label": "premature graying of hair",
        "status": "present"
      },
      {
        "label": "skin depigmentation",
        "status": "present"
      },
      {
        "label": "broad nasal root",
        "status": "present"
      },
      {
        "label": "synophrys",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Sensorineural hearing impairment",
        "reason": "already_in_anchors"
      },
      {
        "label": "Heterochromia iridis",
        "reason": "already_in_anchors"
      },
      {
        "label": "PAX3",
        "reason": "gene_or_variant"
      },
      {
        "label": "W index",
        "reason": "lab_or_test_method"
      },
      {
        "label": "Waardenburg syndrome type I",
        "reason": "not_a_phenotype"
      },
      {
        "label": "Waardenburg syndrome type II",
        "reason": "not_a_phenotype"
      }
    ],
    "acceptableExtraCandidates": [],
    "clinical_structure": {
      "chapter_title": "Waardenburg Syndrome Type I",
      "clinical_text": "Dystopia canthorum, defined as lateral displacement of the inner canthi, is the defining feature of type I and is measured using the W index. A white forelock or premature graying of hair is present in 20%–50%. Skin depigmentation patches may be present at birth. Broad nasal root contributes to the characteristic facial appearance. Synophrys occurs in some. PAX3 pathogenic variants are causative. Waardenburg syndrome type I should not be confused with Waardenburg syndrome type II, which lacks dystopia canthorum. The syndrome is named after Dutch ophthalmologist Petrus Johannes Waardenburg.",
      "paragraph_count": 1,
      "sentence_count": 8,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Dystopia canthorum, defined as lateral displacement of the inner canthi, is the defining feature of type I and is measured using the W index. A white forelock or premature graying of hair is present in 20%–50%. Skin depigmentation patches may be present at birth. Broad nasal root contributes to the characteristic facial appearance. Synophrys occurs in some. PAX3 pathogenic variants are causative. Waardenburg syndrome type I should not be confused with Waardenburg syndrome type II, which lacks dystopia canthorum. The syndrome is named after Dutch ophthalmologist Petrus Johannes Waardenburg.",
          "char_start": 0,
          "char_end": 596,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Dystopia canthorum, defined as lateral displacement of the inner canthi, is the defining feature of type I and is measured using the W index.",
              "char_start": 0,
              "char_end": 141
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "A white forelock or premature graying of hair is present in 20%–50%.",
              "char_start": 142,
              "char_end": 210
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Skin depigmentation patches may be present at birth.",
              "char_start": 211,
              "char_end": 263
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Broad nasal root contributes to the characteristic facial appearance.",
              "char_start": 264,
              "char_end": 333
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Synophrys occurs in some.",
              "char_start": 334,
              "char_end": 359
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "PAX3 pathogenic variants are causative.",
              "char_start": 360,
              "char_end": 399
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Waardenburg syndrome type I should not be confused with Waardenburg syndrome type II, which lacks dystopia canthorum.",
              "char_start": 400,
              "char_end": 517
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "The syndrome is named after Dutch ophthalmologist Petrus Johannes Waardenburg.",
              "char_start": 518,
              "char_end": 596
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Dystopia canthorum, defined as lateral displacement of the inner canthi, is the defining feature of type I and is measured using the W index.",
          "char_start": 0,
          "char_end": 141
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "A white forelock or premature graying of hair is present in 20%–50%.",
          "char_start": 142,
          "char_end": 210
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Skin depigmentation patches may be present at birth.",
          "char_start": 211,
          "char_end": 263
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Broad nasal root contributes to the characteristic facial appearance.",
          "char_start": 264,
          "char_end": 333
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Synophrys occurs in some.",
          "char_start": 334,
          "char_end": 359
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "PAX3 pathogenic variants are causative.",
          "char_start": 360,
          "char_end": 399
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Waardenburg syndrome type I should not be confused with Waardenburg syndrome type II, which lacks dystopia canthorum.",
          "char_start": 400,
          "char_end": 517
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "The syndrome is named after Dutch ophthalmologist Petrus Johannes Waardenburg.",
          "char_start": 518,
          "char_end": 596
        }
      ]
    }
  },
  {
    "id": "disc-075",
    "chapter_title": "Empty Chapter Edge Case",
    "existing_anchors": [
      {
        "hpo_label": "Seizure",
        "match_texts": [
          "seizures"
        ]
      },
      {
        "hpo_label": "Intellectual disability",
        "match_texts": [
          "intellectual disability"
        ]
      },
      {
        "hpo_label": "Hypotonia",
        "match_texts": [
          "hypotonia"
        ]
      },
      {
        "hpo_label": "Microcephaly",
        "match_texts": [
          "microcephaly"
        ]
      },
      {
        "hpo_label": "Feeding difficulties",
        "match_texts": [
          "feeding difficulties"
        ]
      }
    ],
    "clinical_text": "The clinical features include seizures, intellectual disability, hypotonia, microcephaly, and feeding difficulties. The disorder is inherited in an autosomal recessive manner. The diagnosis is established by identification of biallelic pathogenic variants in GENE1 by molecular genetic testing.",
    "expectedNewCandidates": [],
    "mustNotPropose": [
      {
        "label": "Seizure",
        "reason": "already_in_anchors"
      },
      {
        "label": "Intellectual disability",
        "reason": "already_in_anchors"
      },
      {
        "label": "Hypotonia",
        "reason": "already_in_anchors"
      },
      {
        "label": "Microcephaly",
        "reason": "already_in_anchors"
      },
      {
        "label": "Feeding difficulties",
        "reason": "already_in_anchors"
      },
      {
        "label": "autosomal recessive",
        "reason": "not_a_phenotype"
      },
      {
        "label": "GENE1",
        "reason": "gene_or_variant"
      },
      {
        "label": "molecular genetic testing",
        "reason": "lab_or_test_method"
      }
    ],
    "acceptableExtraCandidates": [],
    "clinical_structure": {
      "chapter_title": "Empty Chapter Edge Case",
      "clinical_text": "The clinical features include seizures, intellectual disability, hypotonia, microcephaly, and feeding difficulties. The disorder is inherited in an autosomal recessive manner. The diagnosis is established by identification of biallelic pathogenic variants in GENE1 by molecular genetic testing.",
      "paragraph_count": 1,
      "sentence_count": 3,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "The clinical features include seizures, intellectual disability, hypotonia, microcephaly, and feeding difficulties. The disorder is inherited in an autosomal recessive manner. The diagnosis is established by identification of biallelic pathogenic variants in GENE1 by molecular genetic testing.",
          "char_start": 0,
          "char_end": 294,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "The clinical features include seizures, intellectual disability, hypotonia, microcephaly, and feeding difficulties.",
              "char_start": 0,
              "char_end": 115
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "The disorder is inherited in an autosomal recessive manner.",
              "char_start": 116,
              "char_end": 175
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "The diagnosis is established by identification of biallelic pathogenic variants in GENE1 by molecular genetic testing.",
              "char_start": 176,
              "char_end": 294
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "The clinical features include seizures, intellectual disability, hypotonia, microcephaly, and feeding difficulties.",
          "char_start": 0,
          "char_end": 115
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "The disorder is inherited in an autosomal recessive manner.",
          "char_start": 116,
          "char_end": 175
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "The diagnosis is established by identification of biallelic pathogenic variants in GENE1 by molecular genetic testing.",
          "char_start": 176,
          "char_end": 294
        }
      ]
    }
  },
  {
    "id": "disc-076",
    "chapter_title": "Biotinidase Deficiency",
    "existing_anchors": [
      {
        "hpo_label": "Seizure",
        "match_texts": [
          "seizures"
        ]
      }
    ],
    "clinical_text": "Untreated profound biotinidase deficiency presents with hypotonia, skin rash (typically eczematous or seborrheic), alopecia (which may be partial or total), ataxia, developmental delay, hearing loss, optic atrophy, and metabolic acidosis. Breathing problems including hyperventilation, laryngeal stridor, and apnea have been reported. Fungal infections including chronic mucocutaneous candidiasis occur due to impaired immunity. With early and continued biotin supplementation at 5–20 mg daily, individuals remain asymptomatic. Newborn screening by measurement of biotinidase enzyme activity in dried blood spots has made early diagnosis possible. Serum biotinidase activity levels are confirmatory.",
    "expectedNewCandidates": [
      {
        "label": "hypotonia",
        "status": "present"
      },
      {
        "label": "skin rash",
        "status": "present"
      },
      {
        "label": "alopecia",
        "status": "present"
      },
      {
        "label": "ataxia",
        "status": "present"
      },
      {
        "label": "developmental delay",
        "status": "present"
      },
      {
        "label": "hearing loss",
        "status": "present"
      },
      {
        "label": "optic atrophy",
        "status": "present"
      },
      {
        "label": "metabolic acidosis",
        "status": "present"
      },
      {
        "label": "hyperventilation",
        "status": "present"
      },
      {
        "label": "laryngeal stridor",
        "status": "present"
      },
      {
        "label": "apnea",
        "status": "present"
      },
      {
        "label": "chronic mucocutaneous candidiasis",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Seizure",
        "reason": "already_in_anchors"
      },
      {
        "label": "biotin supplementation",
        "reason": "treatment_or_management"
      },
      {
        "label": "newborn screening",
        "reason": "lab_or_test_method"
      },
      {
        "label": "biotinidase enzyme activity",
        "reason": "lab_or_test_method"
      },
      {
        "label": "dried blood spots",
        "reason": "lab_or_test_method"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "impaired immunity",
        "status": "present"
      },
      {
        "label": "breathing problems",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Biotinidase Deficiency",
      "clinical_text": "Untreated profound biotinidase deficiency presents with hypotonia, skin rash (typically eczematous or seborrheic), alopecia (which may be partial or total), ataxia, developmental delay, hearing loss, optic atrophy, and metabolic acidosis. Breathing problems including hyperventilation, laryngeal stridor, and apnea have been reported. Fungal infections including chronic mucocutaneous candidiasis occur due to impaired immunity. With early and continued biotin supplementation at 5–20 mg daily, individuals remain asymptomatic. Newborn screening by measurement of biotinidase enzyme activity in dried blood spots has made early diagnosis possible. Serum biotinidase activity levels are confirmatory.",
      "paragraph_count": 1,
      "sentence_count": 6,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Untreated profound biotinidase deficiency presents with hypotonia, skin rash (typically eczematous or seborrheic), alopecia (which may be partial or total), ataxia, developmental delay, hearing loss, optic atrophy, and metabolic acidosis. Breathing problems including hyperventilation, laryngeal stridor, and apnea have been reported. Fungal infections including chronic mucocutaneous candidiasis occur due to impaired immunity. With early and continued biotin supplementation at 5–20 mg daily, individuals remain asymptomatic. Newborn screening by measurement of biotinidase enzyme activity in dried blood spots has made early diagnosis possible. Serum biotinidase activity levels are confirmatory.",
          "char_start": 0,
          "char_end": 699,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Untreated profound biotinidase deficiency presents with hypotonia, skin rash (typically eczematous or seborrheic), alopecia (which may be partial or total), ataxia, developmental delay, hearing loss, optic atrophy, and metabolic acidosis.",
              "char_start": 0,
              "char_end": 238
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Breathing problems including hyperventilation, laryngeal stridor, and apnea have been reported.",
              "char_start": 239,
              "char_end": 334
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Fungal infections including chronic mucocutaneous candidiasis occur due to impaired immunity.",
              "char_start": 335,
              "char_end": 428
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "With early and continued biotin supplementation at 5–20 mg daily, individuals remain asymptomatic.",
              "char_start": 429,
              "char_end": 527
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Newborn screening by measurement of biotinidase enzyme activity in dried blood spots has made early diagnosis possible.",
              "char_start": 528,
              "char_end": 647
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Serum biotinidase activity levels are confirmatory.",
              "char_start": 648,
              "char_end": 699
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Untreated profound biotinidase deficiency presents with hypotonia, skin rash (typically eczematous or seborrheic), alopecia (which may be partial or total), ataxia, developmental delay, hearing loss, optic atrophy, and metabolic acidosis.",
          "char_start": 0,
          "char_end": 238
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Breathing problems including hyperventilation, laryngeal stridor, and apnea have been reported.",
          "char_start": 239,
          "char_end": 334
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Fungal infections including chronic mucocutaneous candidiasis occur due to impaired immunity.",
          "char_start": 335,
          "char_end": 428
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "With early and continued biotin supplementation at 5–20 mg daily, individuals remain asymptomatic.",
          "char_start": 429,
          "char_end": 527
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Newborn screening by measurement of biotinidase enzyme activity in dried blood spots has made early diagnosis possible.",
          "char_start": 528,
          "char_end": 647
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Serum biotinidase activity levels are confirmatory.",
          "char_start": 648,
          "char_end": 699
        }
      ]
    }
  },
  {
    "id": "disc-078",
    "chapter_title": "Sotos Syndrome",
    "existing_anchors": [
      {
        "hpo_label": "Overgrowth",
        "match_texts": [
          "childhood overgrowth",
          "tall stature"
        ]
      },
      {
        "hpo_label": "Macrocephaly",
        "match_texts": [
          "macrocephaly"
        ]
      }
    ],
    "clinical_text": "Advanced bone age is almost always present. Intellectual disability, usually mild, is common though some individuals have borderline or normal intelligence. Behavioral features include tantrums, poor social interaction, anxiety, and phobias. Neonatal hypotonia and feeding difficulties are common early features. A distinctive facial gestalt includes a long face, broad prominent forehead, sparse frontotemporal hair, downslanting palpebral fissures, malar flushing, and a pointed chin. Scoliosis develops in some. Cardiac anomalies, particularly atrial and ventricular septal defects, are found in a minority. Seizures occur in approximately 15%. An increased incidence of tumors has been reported but the magnitude of risk is debated and surveillance recommendations are not standardized.",
    "expectedNewCandidates": [
      {
        "label": "advanced bone age",
        "status": "present"
      },
      {
        "label": "intellectual disability",
        "status": "present"
      },
      {
        "label": "anxiety",
        "status": "present"
      },
      {
        "label": "neonatal hypotonia",
        "status": "present"
      },
      {
        "label": "feeding difficulties",
        "status": "present"
      },
      {
        "label": "long face",
        "status": "present"
      },
      {
        "label": "broad forehead",
        "status": "present"
      },
      {
        "label": "downslanting palpebral fissures",
        "status": "present"
      },
      {
        "label": "pointed chin",
        "status": "present"
      },
      {
        "label": "scoliosis",
        "status": "present"
      },
      {
        "label": "seizures",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Overgrowth",
        "reason": "already_in_anchors"
      },
      {
        "label": "Macrocephaly",
        "reason": "already_in_anchors"
      },
      {
        "label": "tumors",
        "reason": "conditional_or_risk_only"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "tantrums",
        "status": "present"
      },
      {
        "label": "sparse frontotemporal hair",
        "status": "present"
      },
      {
        "label": "cardiac anomalies",
        "status": "present"
      },
      {
        "label": "malar flushing",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Sotos Syndrome",
      "clinical_text": "Advanced bone age is almost always present. Intellectual disability, usually mild, is common though some individuals have borderline or normal intelligence. Behavioral features include tantrums, poor social interaction, anxiety, and phobias. Neonatal hypotonia and feeding difficulties are common early features. A distinctive facial gestalt includes a long face, broad prominent forehead, sparse frontotemporal hair, downslanting palpebral fissures, malar flushing, and a pointed chin. Scoliosis develops in some. Cardiac anomalies, particularly atrial and ventricular septal defects, are found in a minority. Seizures occur in approximately 15%. An increased incidence of tumors has been reported but the magnitude of risk is debated and surveillance recommendations are not standardized.",
      "paragraph_count": 1,
      "sentence_count": 9,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Advanced bone age is almost always present. Intellectual disability, usually mild, is common though some individuals have borderline or normal intelligence. Behavioral features include tantrums, poor social interaction, anxiety, and phobias. Neonatal hypotonia and feeding difficulties are common early features. A distinctive facial gestalt includes a long face, broad prominent forehead, sparse frontotemporal hair, downslanting palpebral fissures, malar flushing, and a pointed chin. Scoliosis develops in some. Cardiac anomalies, particularly atrial and ventricular septal defects, are found in a minority. Seizures occur in approximately 15%. An increased incidence of tumors has been reported but the magnitude of risk is debated and surveillance recommendations are not standardized.",
          "char_start": 0,
          "char_end": 790,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Advanced bone age is almost always present.",
              "char_start": 0,
              "char_end": 43
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Intellectual disability, usually mild, is common though some individuals have borderline or normal intelligence.",
              "char_start": 44,
              "char_end": 156
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Behavioral features include tantrums, poor social interaction, anxiety, and phobias.",
              "char_start": 157,
              "char_end": 241
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Neonatal hypotonia and feeding difficulties are common early features.",
              "char_start": 242,
              "char_end": 312
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "A distinctive facial gestalt includes a long face, broad prominent forehead, sparse frontotemporal hair, downslanting palpebral fissures, malar flushing, and a pointed chin.",
              "char_start": 313,
              "char_end": 486
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Scoliosis develops in some.",
              "char_start": 487,
              "char_end": 514
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Cardiac anomalies, particularly atrial and ventricular septal defects, are found in a minority.",
              "char_start": 515,
              "char_end": 610
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Seizures occur in approximately 15%.",
              "char_start": 611,
              "char_end": 647
            },
            {
              "sentence_id": "p1_s9",
              "sentence_index": 9,
              "text": "An increased incidence of tumors has been reported but the magnitude of risk is debated and surveillance recommendations are not standardized.",
              "char_start": 648,
              "char_end": 790
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Advanced bone age is almost always present.",
          "char_start": 0,
          "char_end": 43
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Intellectual disability, usually mild, is common though some individuals have borderline or normal intelligence.",
          "char_start": 44,
          "char_end": 156
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Behavioral features include tantrums, poor social interaction, anxiety, and phobias.",
          "char_start": 157,
          "char_end": 241
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Neonatal hypotonia and feeding difficulties are common early features.",
          "char_start": 242,
          "char_end": 312
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "A distinctive facial gestalt includes a long face, broad prominent forehead, sparse frontotemporal hair, downslanting palpebral fissures, malar flushing, and a pointed chin.",
          "char_start": 313,
          "char_end": 486
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Scoliosis develops in some.",
          "char_start": 487,
          "char_end": 514
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Cardiac anomalies, particularly atrial and ventricular septal defects, are found in a minority.",
          "char_start": 515,
          "char_end": 610
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Seizures occur in approximately 15%.",
          "char_start": 611,
          "char_end": 647
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s9",
          "sentence_index": 9,
          "text": "An increased incidence of tumors has been reported but the magnitude of risk is debated and surveillance recommendations are not standardized.",
          "char_start": 648,
          "char_end": 790
        }
      ]
    }
  },
  {
    "id": "disc-079",
    "chapter_title": "Niemann-Pick Disease Type C",
    "existing_anchors": [
      {
        "hpo_label": "Hepatosplenomegaly",
        "match_texts": [
          "hepatosplenomegaly",
          "neonatal hepatosplenomegaly"
        ]
      }
    ],
    "clinical_text": "Vertical supranuclear gaze palsy, initially affecting downward saccades, is the most characteristic neurologic sign and may precede other symptoms by years. Gelastic cataplexy (sudden loss of muscle tone triggered by laughter) is highly suggestive when present. Progressive cerebellar ataxia develops. Dysarthria and dysphagia worsen with disease progression. Dystonia may be generalized or segmental. Cognitive decline progresses to dementia. Psychiatric manifestations including psychosis and behavioral disturbance may dominate the clinical picture in adolescent or adult-onset cases. Neonatal cholestatic jaundice may be the first clinical clue. Filipin staining of cultured fibroblasts was historically the gold standard confirmatory test. Plasma oxysterol levels (particularly cholestane-3β,5α,6β-triol) are now used as a biomarker. Miglustat is approved for neurological manifestations in some countries.",
    "expectedNewCandidates": [
      {
        "label": "vertical supranuclear gaze palsy",
        "status": "present"
      },
      {
        "label": "gelastic cataplexy",
        "status": "present"
      },
      {
        "label": "cerebellar ataxia",
        "status": "present"
      },
      {
        "label": "dysarthria",
        "status": "present"
      },
      {
        "label": "dysphagia",
        "status": "present"
      },
      {
        "label": "dystonia",
        "status": "present"
      },
      {
        "label": "cognitive decline",
        "status": "present"
      },
      {
        "label": "psychosis",
        "status": "present"
      },
      {
        "label": "neonatal cholestatic jaundice",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Hepatosplenomegaly",
        "reason": "already_in_anchors"
      },
      {
        "label": "filipin staining",
        "reason": "lab_or_test_method"
      },
      {
        "label": "cultured fibroblasts",
        "reason": "lab_or_test_method"
      },
      {
        "label": "plasma oxysterol",
        "reason": "lab_or_test_method"
      },
      {
        "label": "cholestane-3β,5α,6β-triol",
        "reason": "lab_or_test_method"
      },
      {
        "label": "miglustat",
        "reason": "treatment_or_management"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "dementia",
        "status": "present"
      },
      {
        "label": "behavioral disturbance",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Niemann-Pick Disease Type C",
      "clinical_text": "Vertical supranuclear gaze palsy, initially affecting downward saccades, is the most characteristic neurologic sign and may precede other symptoms by years. Gelastic cataplexy (sudden loss of muscle tone triggered by laughter) is highly suggestive when present. Progressive cerebellar ataxia develops. Dysarthria and dysphagia worsen with disease progression. Dystonia may be generalized or segmental. Cognitive decline progresses to dementia. Psychiatric manifestations including psychosis and behavioral disturbance may dominate the clinical picture in adolescent or adult-onset cases. Neonatal cholestatic jaundice may be the first clinical clue. Filipin staining of cultured fibroblasts was historically the gold standard confirmatory test. Plasma oxysterol levels (particularly cholestane-3β,5α,6β-triol) are now used as a biomarker. Miglustat is approved for neurological manifestations in some countries.",
      "paragraph_count": 1,
      "sentence_count": 11,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Vertical supranuclear gaze palsy, initially affecting downward saccades, is the most characteristic neurologic sign and may precede other symptoms by years. Gelastic cataplexy (sudden loss of muscle tone triggered by laughter) is highly suggestive when present. Progressive cerebellar ataxia develops. Dysarthria and dysphagia worsen with disease progression. Dystonia may be generalized or segmental. Cognitive decline progresses to dementia. Psychiatric manifestations including psychosis and behavioral disturbance may dominate the clinical picture in adolescent or adult-onset cases. Neonatal cholestatic jaundice may be the first clinical clue. Filipin staining of cultured fibroblasts was historically the gold standard confirmatory test. Plasma oxysterol levels (particularly cholestane-3β,5α,6β-triol) are now used as a biomarker. Miglustat is approved for neurological manifestations in some countries.",
          "char_start": 0,
          "char_end": 911,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Vertical supranuclear gaze palsy, initially affecting downward saccades, is the most characteristic neurologic sign and may precede other symptoms by years.",
              "char_start": 0,
              "char_end": 156
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Gelastic cataplexy (sudden loss of muscle tone triggered by laughter) is highly suggestive when present.",
              "char_start": 157,
              "char_end": 261
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Progressive cerebellar ataxia develops.",
              "char_start": 262,
              "char_end": 301
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Dysarthria and dysphagia worsen with disease progression.",
              "char_start": 302,
              "char_end": 359
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Dystonia may be generalized or segmental.",
              "char_start": 360,
              "char_end": 401
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Cognitive decline progresses to dementia.",
              "char_start": 402,
              "char_end": 443
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Psychiatric manifestations including psychosis and behavioral disturbance may dominate the clinical picture in adolescent or adult-onset cases.",
              "char_start": 444,
              "char_end": 587
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Neonatal cholestatic jaundice may be the first clinical clue.",
              "char_start": 588,
              "char_end": 649
            },
            {
              "sentence_id": "p1_s9",
              "sentence_index": 9,
              "text": "Filipin staining of cultured fibroblasts was historically the gold standard confirmatory test.",
              "char_start": 650,
              "char_end": 744
            },
            {
              "sentence_id": "p1_s10",
              "sentence_index": 10,
              "text": "Plasma oxysterol levels (particularly cholestane-3β,5α,6β-triol) are now used as a biomarker.",
              "char_start": 745,
              "char_end": 838
            },
            {
              "sentence_id": "p1_s11",
              "sentence_index": 11,
              "text": "Miglustat is approved for neurological manifestations in some countries.",
              "char_start": 839,
              "char_end": 911
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Vertical supranuclear gaze palsy, initially affecting downward saccades, is the most characteristic neurologic sign and may precede other symptoms by years.",
          "char_start": 0,
          "char_end": 156
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Gelastic cataplexy (sudden loss of muscle tone triggered by laughter) is highly suggestive when present.",
          "char_start": 157,
          "char_end": 261
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Progressive cerebellar ataxia develops.",
          "char_start": 262,
          "char_end": 301
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Dysarthria and dysphagia worsen with disease progression.",
          "char_start": 302,
          "char_end": 359
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Dystonia may be generalized or segmental.",
          "char_start": 360,
          "char_end": 401
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Cognitive decline progresses to dementia.",
          "char_start": 402,
          "char_end": 443
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Psychiatric manifestations including psychosis and behavioral disturbance may dominate the clinical picture in adolescent or adult-onset cases.",
          "char_start": 444,
          "char_end": 587
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Neonatal cholestatic jaundice may be the first clinical clue.",
          "char_start": 588,
          "char_end": 649
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s9",
          "sentence_index": 9,
          "text": "Filipin staining of cultured fibroblasts was historically the gold standard confirmatory test.",
          "char_start": 650,
          "char_end": 744
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s10",
          "sentence_index": 10,
          "text": "Plasma oxysterol levels (particularly cholestane-3β,5α,6β-triol) are now used as a biomarker.",
          "char_start": 745,
          "char_end": 838
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s11",
          "sentence_index": 11,
          "text": "Miglustat is approved for neurological manifestations in some countries.",
          "char_start": 839,
          "char_end": 911
        }
      ]
    }
  },
  {
    "id": "disc-083",
    "chapter_title": "All Normal Edge Case",
    "existing_anchors": [
      {
        "hpo_label": "Seizure",
        "match_texts": [
          "seizures"
        ]
      }
    ],
    "clinical_text": "Neurological examination is normal between seizure episodes. Cognitive function is age-appropriate. Motor development is normal. Speech and language development are normal. Vision and hearing are normal. Growth parameters are within the normal range. Brain MRI is unremarkable. There are no dysmorphic features.",
    "expectedNewCandidates": [],
    "mustNotPropose": [
      {
        "label": "Seizure",
        "reason": "already_in_anchors"
      },
      {
        "label": "neurological examination",
        "reason": "normal_or_preserved"
      },
      {
        "label": "cognitive function",
        "reason": "normal_or_preserved"
      },
      {
        "label": "motor development",
        "reason": "normal_or_preserved"
      },
      {
        "label": "speech",
        "reason": "normal_or_preserved"
      },
      {
        "label": "language",
        "reason": "normal_or_preserved"
      },
      {
        "label": "vision",
        "reason": "normal_or_preserved"
      },
      {
        "label": "hearing",
        "reason": "normal_or_preserved"
      },
      {
        "label": "growth parameters",
        "reason": "normal_or_preserved"
      },
      {
        "label": "Brain MRI",
        "reason": "lab_or_test_method"
      },
      {
        "label": "dysmorphic features",
        "reason": "normal_or_preserved"
      }
    ],
    "acceptableExtraCandidates": [],
    "clinical_structure": {
      "chapter_title": "All Normal Edge Case",
      "clinical_text": "Neurological examination is normal between seizure episodes. Cognitive function is age-appropriate. Motor development is normal. Speech and language development are normal. Vision and hearing are normal. Growth parameters are within the normal range. Brain MRI is unremarkable. There are no dysmorphic features.",
      "paragraph_count": 1,
      "sentence_count": 8,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Neurological examination is normal between seizure episodes. Cognitive function is age-appropriate. Motor development is normal. Speech and language development are normal. Vision and hearing are normal. Growth parameters are within the normal range. Brain MRI is unremarkable. There are no dysmorphic features.",
          "char_start": 0,
          "char_end": 311,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Neurological examination is normal between seizure episodes.",
              "char_start": 0,
              "char_end": 60
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Cognitive function is age-appropriate.",
              "char_start": 61,
              "char_end": 99
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Motor development is normal.",
              "char_start": 100,
              "char_end": 128
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Speech and language development are normal.",
              "char_start": 129,
              "char_end": 172
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Vision and hearing are normal.",
              "char_start": 173,
              "char_end": 203
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Growth parameters are within the normal range.",
              "char_start": 204,
              "char_end": 250
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Brain MRI is unremarkable.",
              "char_start": 251,
              "char_end": 277
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "There are no dysmorphic features.",
              "char_start": 278,
              "char_end": 311
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Neurological examination is normal between seizure episodes.",
          "char_start": 0,
          "char_end": 60
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Cognitive function is age-appropriate.",
          "char_start": 61,
          "char_end": 99
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Motor development is normal.",
          "char_start": 100,
          "char_end": 128
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Speech and language development are normal.",
          "char_start": 129,
          "char_end": 172
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Vision and hearing are normal.",
          "char_start": 173,
          "char_end": 203
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Growth parameters are within the normal range.",
          "char_start": 204,
          "char_end": 250
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Brain MRI is unremarkable.",
          "char_start": 251,
          "char_end": 277
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "There are no dysmorphic features.",
          "char_start": 278,
          "char_end": 311
        }
      ]
    }
  },
  {
    "id": "disc-085",
    "chapter_title": "Multiple Exclusions Edge Case",
    "existing_anchors": [
      {
        "hpo_label": "Intellectual disability",
        "match_texts": [
          "intellectual disability"
        ]
      },
      {
        "hpo_label": "Epilepsy",
        "match_texts": [
          "epilepsy"
        ]
      }
    ],
    "clinical_text": "Hepatic involvement has not been reported. Cardiac evaluation including echocardiography is normal in all individuals examined to date. Renal anomalies are not a feature. Hearing loss has not been documented. Skeletal survey reveals no osseous abnormalities. Ophthalmologic evaluation shows no retinal or optic nerve pathology. Endocrine function is preserved. There is no evidence of immunodeficiency. The only extracerebral finding is mild constipation, reported by approximately half of families.",
    "expectedNewCandidates": [
      {
        "label": "hepatic involvement",
        "status": "excluded"
      },
      {
        "label": "cardiac abnormalities",
        "status": "excluded"
      },
      {
        "label": "renal anomalies",
        "status": "excluded"
      },
      {
        "label": "hearing loss",
        "status": "excluded"
      },
      {
        "label": "skeletal abnormalities",
        "status": "excluded"
      },
      {
        "label": "retinal pathology",
        "status": "excluded"
      },
      {
        "label": "immunodeficiency",
        "status": "excluded"
      },
      {
        "label": "constipation",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Intellectual disability",
        "reason": "already_in_anchors"
      },
      {
        "label": "Epilepsy",
        "reason": "already_in_anchors"
      },
      {
        "label": "echocardiography",
        "reason": "lab_or_test_method"
      },
      {
        "label": "skeletal survey",
        "reason": "lab_or_test_method"
      },
      {
        "label": "ophthalmologic evaluation",
        "reason": "lab_or_test_method"
      },
      {
        "label": "endocrine function",
        "reason": "normal_or_preserved"
      }
    ],
    "acceptableExtraCandidates": [],
    "clinical_structure": {
      "chapter_title": "Multiple Exclusions Edge Case",
      "clinical_text": "Hepatic involvement has not been reported. Cardiac evaluation including echocardiography is normal in all individuals examined to date. Renal anomalies are not a feature. Hearing loss has not been documented. Skeletal survey reveals no osseous abnormalities. Ophthalmologic evaluation shows no retinal or optic nerve pathology. Endocrine function is preserved. There is no evidence of immunodeficiency. The only extracerebral finding is mild constipation, reported by approximately half of families.",
      "paragraph_count": 1,
      "sentence_count": 9,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Hepatic involvement has not been reported. Cardiac evaluation including echocardiography is normal in all individuals examined to date. Renal anomalies are not a feature. Hearing loss has not been documented. Skeletal survey reveals no osseous abnormalities. Ophthalmologic evaluation shows no retinal or optic nerve pathology. Endocrine function is preserved. There is no evidence of immunodeficiency. The only extracerebral finding is mild constipation, reported by approximately half of families.",
          "char_start": 0,
          "char_end": 499,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Hepatic involvement has not been reported.",
              "char_start": 0,
              "char_end": 42
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Cardiac evaluation including echocardiography is normal in all individuals examined to date.",
              "char_start": 43,
              "char_end": 135
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Renal anomalies are not a feature.",
              "char_start": 136,
              "char_end": 170
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Hearing loss has not been documented.",
              "char_start": 171,
              "char_end": 208
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Skeletal survey reveals no osseous abnormalities.",
              "char_start": 209,
              "char_end": 258
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Ophthalmologic evaluation shows no retinal or optic nerve pathology.",
              "char_start": 259,
              "char_end": 327
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Endocrine function is preserved.",
              "char_start": 328,
              "char_end": 360
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "There is no evidence of immunodeficiency.",
              "char_start": 361,
              "char_end": 402
            },
            {
              "sentence_id": "p1_s9",
              "sentence_index": 9,
              "text": "The only extracerebral finding is mild constipation, reported by approximately half of families.",
              "char_start": 403,
              "char_end": 499
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Hepatic involvement has not been reported.",
          "char_start": 0,
          "char_end": 42
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Cardiac evaluation including echocardiography is normal in all individuals examined to date.",
          "char_start": 43,
          "char_end": 135
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Renal anomalies are not a feature.",
          "char_start": 136,
          "char_end": 170
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Hearing loss has not been documented.",
          "char_start": 171,
          "char_end": 208
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Skeletal survey reveals no osseous abnormalities.",
          "char_start": 209,
          "char_end": 258
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Ophthalmologic evaluation shows no retinal or optic nerve pathology.",
          "char_start": 259,
          "char_end": 327
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Endocrine function is preserved.",
          "char_start": 328,
          "char_end": 360
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "There is no evidence of immunodeficiency.",
          "char_start": 361,
          "char_end": 402
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s9",
          "sentence_index": 9,
          "text": "The only extracerebral finding is mild constipation, reported by approximately half of families.",
          "char_start": 403,
          "char_end": 499
        }
      ]
    }
  },
  {
    "id": "disc-086",
    "chapter_title": "Ambiguous Phenotype vs Disease Name",
    "existing_anchors": [],
    "clinical_text": "Episodic ataxia with myokymia (EA1) is caused by KCNA1 pathogenic variants. Spinocerebellar ataxia type 6 (SCA6) results from CAG expansions in CACNA1A. Friedreich ataxia, the most common recessive ataxia, is caused by GAA expansions in FXN. Ataxia-telangiectasia is associated with immunodeficiency and cancer predisposition. Each of these disorders includes progressive ataxia as a core feature, but they differ in associated findings, age of onset, and genetic mechanism.",
    "expectedNewCandidates": [
      {
        "label": "progressive ataxia",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Episodic ataxia with myokymia",
        "reason": "not_a_phenotype"
      },
      {
        "label": "EA1",
        "reason": "not_a_phenotype"
      },
      {
        "label": "Spinocerebellar ataxia type 6",
        "reason": "not_a_phenotype"
      },
      {
        "label": "SCA6",
        "reason": "not_a_phenotype"
      },
      {
        "label": "Friedreich ataxia",
        "reason": "not_a_phenotype"
      },
      {
        "label": "Ataxia-telangiectasia",
        "reason": "not_a_phenotype"
      },
      {
        "label": "KCNA1",
        "reason": "gene_or_variant"
      },
      {
        "label": "CACNA1A",
        "reason": "gene_or_variant"
      },
      {
        "label": "FXN",
        "reason": "gene_or_variant"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "myokymia",
        "status": "present"
      },
      {
        "label": "immunodeficiency",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Ambiguous Phenotype vs Disease Name",
      "clinical_text": "Episodic ataxia with myokymia (EA1) is caused by KCNA1 pathogenic variants. Spinocerebellar ataxia type 6 (SCA6) results from CAG expansions in CACNA1A. Friedreich ataxia, the most common recessive ataxia, is caused by GAA expansions in FXN. Ataxia-telangiectasia is associated with immunodeficiency and cancer predisposition. Each of these disorders includes progressive ataxia as a core feature, but they differ in associated findings, age of onset, and genetic mechanism.",
      "paragraph_count": 1,
      "sentence_count": 5,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Episodic ataxia with myokymia (EA1) is caused by KCNA1 pathogenic variants. Spinocerebellar ataxia type 6 (SCA6) results from CAG expansions in CACNA1A. Friedreich ataxia, the most common recessive ataxia, is caused by GAA expansions in FXN. Ataxia-telangiectasia is associated with immunodeficiency and cancer predisposition. Each of these disorders includes progressive ataxia as a core feature, but they differ in associated findings, age of onset, and genetic mechanism.",
          "char_start": 0,
          "char_end": 474,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Episodic ataxia with myokymia (EA1) is caused by KCNA1 pathogenic variants.",
              "char_start": 0,
              "char_end": 75
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Spinocerebellar ataxia type 6 (SCA6) results from CAG expansions in CACNA1A.",
              "char_start": 76,
              "char_end": 152
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Friedreich ataxia, the most common recessive ataxia, is caused by GAA expansions in FXN.",
              "char_start": 153,
              "char_end": 241
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Ataxia-telangiectasia is associated with immunodeficiency and cancer predisposition.",
              "char_start": 242,
              "char_end": 326
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Each of these disorders includes progressive ataxia as a core feature, but they differ in associated findings, age of onset, and genetic mechanism.",
              "char_start": 327,
              "char_end": 474
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Episodic ataxia with myokymia (EA1) is caused by KCNA1 pathogenic variants.",
          "char_start": 0,
          "char_end": 75
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Spinocerebellar ataxia type 6 (SCA6) results from CAG expansions in CACNA1A.",
          "char_start": 76,
          "char_end": 152
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Friedreich ataxia, the most common recessive ataxia, is caused by GAA expansions in FXN.",
          "char_start": 153,
          "char_end": 241
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Ataxia-telangiectasia is associated with immunodeficiency and cancer predisposition.",
          "char_start": 242,
          "char_end": 326
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Each of these disorders includes progressive ataxia as a core feature, but they differ in associated findings, age of onset, and genetic mechanism.",
          "char_start": 327,
          "char_end": 474
        }
      ]
    }
  },
  {
    "id": "disc-087",
    "chapter_title": "Surveillance Paragraph Edge Case",
    "existing_anchors": [
      {
        "hpo_label": "Cardiomyopathy",
        "match_texts": [
          "cardiomyopathy"
        ]
      }
    ],
    "clinical_text": "Surveillance recommendations include annual echocardiography beginning at diagnosis, Holter monitoring every 1–2 years, pulmonary function tests annually after age 10, fasting glucose and HbA1c annually, audiometry every 2 years, ophthalmologic examination annually, scoliosis screening at each clinic visit, and bone density assessment by DXA every 3–5 years. Genetic counseling should be offered to all first-degree relatives. Referral to a multidisciplinary clinic with experience in neuromuscular disorders is recommended.",
    "expectedNewCandidates": [],
    "mustNotPropose": [
      {
        "label": "Cardiomyopathy",
        "reason": "already_in_anchors"
      },
      {
        "label": "echocardiography",
        "reason": "lab_or_test_method"
      },
      {
        "label": "Holter monitoring",
        "reason": "lab_or_test_method"
      },
      {
        "label": "pulmonary function tests",
        "reason": "lab_or_test_method"
      },
      {
        "label": "fasting glucose",
        "reason": "lab_or_test_method"
      },
      {
        "label": "HbA1c",
        "reason": "lab_or_test_method"
      },
      {
        "label": "audiometry",
        "reason": "lab_or_test_method"
      },
      {
        "label": "ophthalmologic examination",
        "reason": "lab_or_test_method"
      },
      {
        "label": "DXA",
        "reason": "lab_or_test_method"
      },
      {
        "label": "genetic counseling",
        "reason": "treatment_or_management"
      },
      {
        "label": "multidisciplinary clinic",
        "reason": "treatment_or_management"
      },
      {
        "label": "scoliosis screening",
        "reason": "lab_or_test_method"
      }
    ],
    "acceptableExtraCandidates": [],
    "clinical_structure": {
      "chapter_title": "Surveillance Paragraph Edge Case",
      "clinical_text": "Surveillance recommendations include annual echocardiography beginning at diagnosis, Holter monitoring every 1–2 years, pulmonary function tests annually after age 10, fasting glucose and HbA1c annually, audiometry every 2 years, ophthalmologic examination annually, scoliosis screening at each clinic visit, and bone density assessment by DXA every 3–5 years. Genetic counseling should be offered to all first-degree relatives. Referral to a multidisciplinary clinic with experience in neuromuscular disorders is recommended.",
      "paragraph_count": 1,
      "sentence_count": 3,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Surveillance recommendations include annual echocardiography beginning at diagnosis, Holter monitoring every 1–2 years, pulmonary function tests annually after age 10, fasting glucose and HbA1c annually, audiometry every 2 years, ophthalmologic examination annually, scoliosis screening at each clinic visit, and bone density assessment by DXA every 3–5 years. Genetic counseling should be offered to all first-degree relatives. Referral to a multidisciplinary clinic with experience in neuromuscular disorders is recommended.",
          "char_start": 0,
          "char_end": 526,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Surveillance recommendations include annual echocardiography beginning at diagnosis, Holter monitoring every 1–2 years, pulmonary function tests annually after age 10, fasting glucose and HbA1c annually, audiometry every 2 years, ophthalmologic examination annually, scoliosis screening at each clinic visit, and bone density assessment by DXA every 3–5 years.",
              "char_start": 0,
              "char_end": 360
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Genetic counseling should be offered to all first-degree relatives.",
              "char_start": 361,
              "char_end": 428
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Referral to a multidisciplinary clinic with experience in neuromuscular disorders is recommended.",
              "char_start": 429,
              "char_end": 526
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Surveillance recommendations include annual echocardiography beginning at diagnosis, Holter monitoring every 1–2 years, pulmonary function tests annually after age 10, fasting glucose and HbA1c annually, audiometry every 2 years, ophthalmologic examination annually, scoliosis screening at each clinic visit, and bone density assessment by DXA every 3–5 years.",
          "char_start": 0,
          "char_end": 360
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Genetic counseling should be offered to all first-degree relatives.",
          "char_start": 361,
          "char_end": 428
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Referral to a multidisciplinary clinic with experience in neuromuscular disorders is recommended.",
          "char_start": 429,
          "char_end": 526
        }
      ]
    }
  },
  {
    "id": "disc-088",
    "chapter_title": "Implied vs Explicit Phenotypes",
    "existing_anchors": [
      {
        "hpo_label": "Intellectual disability",
        "match_texts": [
          "intellectual disability"
        ]
      }
    ],
    "clinical_text": "The child was unable to sit without support at 12 months. She never crawled. First steps were not achieved until 30 months. At age 5, she could walk short distances but fell frequently. She could not run. Speech was limited to single words. She could not dress or feed herself independently. She was not toilet-trained at age 7. She attended a special education program.",
    "expectedNewCandidates": [
      {
        "label": "inability to sit without support",
        "status": "present"
      },
      {
        "label": "delayed walking",
        "status": "present"
      },
      {
        "label": "frequent falls",
        "status": "present"
      },
      {
        "label": "limited speech",
        "status": "present"
      },
      {
        "label": "impaired self-care",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Intellectual disability",
        "reason": "already_in_anchors"
      },
      {
        "label": "special education",
        "reason": "treatment_or_management"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "gross motor delay",
        "status": "present"
      },
      {
        "label": "speech delay",
        "status": "present"
      },
      {
        "label": "delayed motor milestones",
        "status": "present"
      },
      {
        "label": "gait instability",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Implied vs Explicit Phenotypes",
      "clinical_text": "The child was unable to sit without support at 12 months. She never crawled. First steps were not achieved until 30 months. At age 5, she could walk short distances but fell frequently. She could not run. Speech was limited to single words. She could not dress or feed herself independently. She was not toilet-trained at age 7. She attended a special education program.",
      "paragraph_count": 1,
      "sentence_count": 9,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "The child was unable to sit without support at 12 months. She never crawled. First steps were not achieved until 30 months. At age 5, she could walk short distances but fell frequently. She could not run. Speech was limited to single words. She could not dress or feed herself independently. She was not toilet-trained at age 7. She attended a special education program.",
          "char_start": 0,
          "char_end": 370,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "The child was unable to sit without support at 12 months.",
              "char_start": 0,
              "char_end": 57
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "She never crawled.",
              "char_start": 58,
              "char_end": 76
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "First steps were not achieved until 30 months.",
              "char_start": 77,
              "char_end": 123
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "At age 5, she could walk short distances but fell frequently.",
              "char_start": 124,
              "char_end": 185
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "She could not run.",
              "char_start": 186,
              "char_end": 204
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Speech was limited to single words.",
              "char_start": 205,
              "char_end": 240
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "She could not dress or feed herself independently.",
              "char_start": 241,
              "char_end": 291
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "She was not toilet-trained at age 7.",
              "char_start": 292,
              "char_end": 328
            },
            {
              "sentence_id": "p1_s9",
              "sentence_index": 9,
              "text": "She attended a special education program.",
              "char_start": 329,
              "char_end": 370
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "The child was unable to sit without support at 12 months.",
          "char_start": 0,
          "char_end": 57
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "She never crawled.",
          "char_start": 58,
          "char_end": 76
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "First steps were not achieved until 30 months.",
          "char_start": 77,
          "char_end": 123
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "At age 5, she could walk short distances but fell frequently.",
          "char_start": 124,
          "char_end": 185
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "She could not run.",
          "char_start": 186,
          "char_end": 204
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Speech was limited to single words.",
          "char_start": 205,
          "char_end": 240
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "She could not dress or feed herself independently.",
          "char_start": 241,
          "char_end": 291
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "She was not toilet-trained at age 7.",
          "char_start": 292,
          "char_end": 328
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s9",
          "sentence_index": 9,
          "text": "She attended a special education program.",
          "char_start": 329,
          "char_end": 370
        }
      ]
    }
  },
  {
    "id": "disc-089",
    "chapter_title": "Risk and Predisposition Paragraph",
    "existing_anchors": [
      {
        "hpo_label": "Macrocephaly",
        "match_texts": [
          "macrocephaly"
        ]
      }
    ],
    "clinical_text": "Heterozygous carriers may have a slightly increased risk of thyroid nodules. There is a theoretical predisposition to insulin resistance, though this has not been consistently demonstrated. An association with autism spectrum disorder has been suggested in preliminary studies but requires confirmation. Carriers may be at moderately increased risk for breast cancer based on a single retrospective cohort. The potential for renal cell carcinoma in carriers remains speculative. None of these associations should be treated as established phenotypes for the carrier state.",
    "expectedNewCandidates": [],
    "mustNotPropose": [
      {
        "label": "Macrocephaly",
        "reason": "already_in_anchors"
      },
      {
        "label": "thyroid nodules",
        "reason": "conditional_or_risk_only"
      },
      {
        "label": "insulin resistance",
        "reason": "conditional_or_risk_only"
      },
      {
        "label": "autism spectrum disorder",
        "reason": "conditional_or_risk_only"
      },
      {
        "label": "breast cancer",
        "reason": "conditional_or_risk_only"
      },
      {
        "label": "renal cell carcinoma",
        "reason": "conditional_or_risk_only"
      }
    ],
    "acceptableExtraCandidates": [],
    "clinical_structure": {
      "chapter_title": "Risk and Predisposition Paragraph",
      "clinical_text": "Heterozygous carriers may have a slightly increased risk of thyroid nodules. There is a theoretical predisposition to insulin resistance, though this has not been consistently demonstrated. An association with autism spectrum disorder has been suggested in preliminary studies but requires confirmation. Carriers may be at moderately increased risk for breast cancer based on a single retrospective cohort. The potential for renal cell carcinoma in carriers remains speculative. None of these associations should be treated as established phenotypes for the carrier state.",
      "paragraph_count": 1,
      "sentence_count": 6,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Heterozygous carriers may have a slightly increased risk of thyroid nodules. There is a theoretical predisposition to insulin resistance, though this has not been consistently demonstrated. An association with autism spectrum disorder has been suggested in preliminary studies but requires confirmation. Carriers may be at moderately increased risk for breast cancer based on a single retrospective cohort. The potential for renal cell carcinoma in carriers remains speculative. None of these associations should be treated as established phenotypes for the carrier state.",
          "char_start": 0,
          "char_end": 572,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Heterozygous carriers may have a slightly increased risk of thyroid nodules.",
              "char_start": 0,
              "char_end": 76
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "There is a theoretical predisposition to insulin resistance, though this has not been consistently demonstrated.",
              "char_start": 77,
              "char_end": 189
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "An association with autism spectrum disorder has been suggested in preliminary studies but requires confirmation.",
              "char_start": 190,
              "char_end": 303
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Carriers may be at moderately increased risk for breast cancer based on a single retrospective cohort.",
              "char_start": 304,
              "char_end": 406
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "The potential for renal cell carcinoma in carriers remains speculative.",
              "char_start": 407,
              "char_end": 478
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "None of these associations should be treated as established phenotypes for the carrier state.",
              "char_start": 479,
              "char_end": 572
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Heterozygous carriers may have a slightly increased risk of thyroid nodules.",
          "char_start": 0,
          "char_end": 76
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "There is a theoretical predisposition to insulin resistance, though this has not been consistently demonstrated.",
          "char_start": 77,
          "char_end": 189
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "An association with autism spectrum disorder has been suggested in preliminary studies but requires confirmation.",
          "char_start": 190,
          "char_end": 303
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Carriers may be at moderately increased risk for breast cancer based on a single retrospective cohort.",
          "char_start": 304,
          "char_end": 406
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "The potential for renal cell carcinoma in carriers remains speculative.",
          "char_start": 407,
          "char_end": 478
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "None of these associations should be treated as established phenotypes for the carrier state.",
          "char_start": 479,
          "char_end": 572
        }
      ]
    }
  },
  {
    "id": "disc-090",
    "chapter_title": "Table Headers and Junk Text",
    "existing_anchors": [
      {
        "hpo_label": "Seizure",
        "match_texts": [
          "seizures"
        ]
      }
    ],
    "clinical_text": "Clinical Characteristics\n\nSuggestive Findings\n\nThe following clinical findings suggest the diagnosis:\n\nView in own window\n\nTable 1. Clinical Features\n\nFeature\tFrequency\n\nSeizures\t100%\nIntellectual disability\t95%\nMicrocephaly\t80%\nSpasticity\t75%\n\nEstablishing the Diagnosis\n\nThe diagnosis is established in a proband with the above clinical features and biallelic pathogenic variants in GENE3 identified by molecular genetic testing.\n\nMolecular Genetics\n\nGene. GENE3\n\nGene structure. GENE3 comprises 12 exons.\n\nPathogenic variants. See Table 2.",
    "expectedNewCandidates": [
      {
        "label": "intellectual disability",
        "status": "present"
      },
      {
        "label": "microcephaly",
        "status": "present"
      },
      {
        "label": "spasticity",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Seizure",
        "reason": "already_in_anchors"
      },
      {
        "label": "Clinical Characteristics",
        "reason": "table_or_heading_junk"
      },
      {
        "label": "Suggestive Findings",
        "reason": "table_or_heading_junk"
      },
      {
        "label": "View in own window",
        "reason": "table_or_heading_junk"
      },
      {
        "label": "Establishing the Diagnosis",
        "reason": "table_or_heading_junk"
      },
      {
        "label": "Molecular Genetics",
        "reason": "table_or_heading_junk"
      },
      {
        "label": "GENE3",
        "reason": "gene_or_variant"
      },
      {
        "label": "molecular genetic testing",
        "reason": "lab_or_test_method"
      }
    ],
    "acceptableExtraCandidates": [],
    "clinical_structure": {
      "chapter_title": "Table Headers and Junk Text",
      "clinical_text": "Clinical Characteristics\n\nSuggestive Findings\n\nThe following clinical findings suggest the diagnosis:\n\nView in own window\n\nTable 1. Clinical Features\n\nFeature\tFrequency\n\nSeizures\t100%\nIntellectual disability\t95%\nMicrocephaly\t80%\nSpasticity\t75%\n\nEstablishing the Diagnosis\n\nThe diagnosis is established in a proband with the above clinical features and biallelic pathogenic variants in GENE3 identified by molecular genetic testing.\n\nMolecular Genetics\n\nGene. GENE3\n\nGene structure. GENE3 comprises 12 exons.\n\nPathogenic variants. See Table 2.",
      "paragraph_count": 13,
      "sentence_count": 17,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Clinical Characteristics",
          "char_start": 0,
          "char_end": 24,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Clinical Characteristics",
              "char_start": 0,
              "char_end": 24
            }
          ]
        },
        {
          "paragraph_id": "p2",
          "paragraph_index": 2,
          "text": "Suggestive Findings",
          "char_start": 26,
          "char_end": 45,
          "sentences": [
            {
              "sentence_id": "p2_s1",
              "sentence_index": 1,
              "text": "Suggestive Findings",
              "char_start": 26,
              "char_end": 45
            }
          ]
        },
        {
          "paragraph_id": "p3",
          "paragraph_index": 3,
          "text": "The following clinical findings suggest the diagnosis:",
          "char_start": 47,
          "char_end": 101,
          "sentences": [
            {
              "sentence_id": "p3_s1",
              "sentence_index": 1,
              "text": "The following clinical findings suggest the diagnosis:",
              "char_start": 47,
              "char_end": 101
            }
          ]
        },
        {
          "paragraph_id": "p4",
          "paragraph_index": 4,
          "text": "View in own window",
          "char_start": 103,
          "char_end": 121,
          "sentences": [
            {
              "sentence_id": "p4_s1",
              "sentence_index": 1,
              "text": "View in own window",
              "char_start": 103,
              "char_end": 121
            }
          ]
        },
        {
          "paragraph_id": "p5",
          "paragraph_index": 5,
          "text": "Table 1. Clinical Features",
          "char_start": 123,
          "char_end": 149,
          "sentences": [
            {
              "sentence_id": "p5_s1",
              "sentence_index": 1,
              "text": "Table 1.",
              "char_start": 123,
              "char_end": 131
            },
            {
              "sentence_id": "p5_s2",
              "sentence_index": 2,
              "text": "Clinical Features",
              "char_start": 132,
              "char_end": 149
            }
          ]
        },
        {
          "paragraph_id": "p6",
          "paragraph_index": 6,
          "text": "Feature\tFrequency",
          "char_start": 151,
          "char_end": 168,
          "sentences": [
            {
              "sentence_id": "p6_s1",
              "sentence_index": 1,
              "text": "Feature\tFrequency",
              "char_start": 151,
              "char_end": 168
            }
          ]
        },
        {
          "paragraph_id": "p7",
          "paragraph_index": 7,
          "text": "Seizures\t100%\nIntellectual disability\t95%\nMicrocephaly\t80%\nSpasticity\t75%",
          "char_start": 170,
          "char_end": 243,
          "sentences": [
            {
              "sentence_id": "p7_s1",
              "sentence_index": 1,
              "text": "Seizures\t100%\nIntellectual disability\t95%\nMicrocephaly\t80%\nSpasticity\t75%",
              "char_start": 170,
              "char_end": 243
            }
          ]
        },
        {
          "paragraph_id": "p8",
          "paragraph_index": 8,
          "text": "Establishing the Diagnosis",
          "char_start": 245,
          "char_end": 271,
          "sentences": [
            {
              "sentence_id": "p8_s1",
              "sentence_index": 1,
              "text": "Establishing the Diagnosis",
              "char_start": 245,
              "char_end": 271
            }
          ]
        },
        {
          "paragraph_id": "p9",
          "paragraph_index": 9,
          "text": "The diagnosis is established in a proband with the above clinical features and biallelic pathogenic variants in GENE3 identified by molecular genetic testing.",
          "char_start": 273,
          "char_end": 431,
          "sentences": [
            {
              "sentence_id": "p9_s1",
              "sentence_index": 1,
              "text": "The diagnosis is established in a proband with the above clinical features and biallelic pathogenic variants in GENE3 identified by molecular genetic testing.",
              "char_start": 273,
              "char_end": 431
            }
          ]
        },
        {
          "paragraph_id": "p10",
          "paragraph_index": 10,
          "text": "Molecular Genetics",
          "char_start": 433,
          "char_end": 451,
          "sentences": [
            {
              "sentence_id": "p10_s1",
              "sentence_index": 1,
              "text": "Molecular Genetics",
              "char_start": 433,
              "char_end": 451
            }
          ]
        },
        {
          "paragraph_id": "p11",
          "paragraph_index": 11,
          "text": "Gene. GENE3",
          "char_start": 453,
          "char_end": 464,
          "sentences": [
            {
              "sentence_id": "p11_s1",
              "sentence_index": 1,
              "text": "Gene.",
              "char_start": 453,
              "char_end": 458
            },
            {
              "sentence_id": "p11_s2",
              "sentence_index": 2,
              "text": "GENE3",
              "char_start": 459,
              "char_end": 464
            }
          ]
        },
        {
          "paragraph_id": "p12",
          "paragraph_index": 12,
          "text": "Gene structure. GENE3 comprises 12 exons.",
          "char_start": 466,
          "char_end": 507,
          "sentences": [
            {
              "sentence_id": "p12_s1",
              "sentence_index": 1,
              "text": "Gene structure.",
              "char_start": 466,
              "char_end": 481
            },
            {
              "sentence_id": "p12_s2",
              "sentence_index": 2,
              "text": "GENE3 comprises 12 exons.",
              "char_start": 482,
              "char_end": 507
            }
          ]
        },
        {
          "paragraph_id": "p13",
          "paragraph_index": 13,
          "text": "Pathogenic variants. See Table 2.",
          "char_start": 509,
          "char_end": 542,
          "sentences": [
            {
              "sentence_id": "p13_s1",
              "sentence_index": 1,
              "text": "Pathogenic variants.",
              "char_start": 509,
              "char_end": 529
            },
            {
              "sentence_id": "p13_s2",
              "sentence_index": 2,
              "text": "See Table 2.",
              "char_start": 530,
              "char_end": 542
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Clinical Characteristics",
          "char_start": 0,
          "char_end": 24
        },
        {
          "paragraph_id": "p2",
          "sentence_id": "p2_s1",
          "sentence_index": 1,
          "text": "Suggestive Findings",
          "char_start": 26,
          "char_end": 45
        },
        {
          "paragraph_id": "p3",
          "sentence_id": "p3_s1",
          "sentence_index": 1,
          "text": "The following clinical findings suggest the diagnosis:",
          "char_start": 47,
          "char_end": 101
        },
        {
          "paragraph_id": "p4",
          "sentence_id": "p4_s1",
          "sentence_index": 1,
          "text": "View in own window",
          "char_start": 103,
          "char_end": 121
        },
        {
          "paragraph_id": "p5",
          "sentence_id": "p5_s1",
          "sentence_index": 1,
          "text": "Table 1.",
          "char_start": 123,
          "char_end": 131
        },
        {
          "paragraph_id": "p5",
          "sentence_id": "p5_s2",
          "sentence_index": 2,
          "text": "Clinical Features",
          "char_start": 132,
          "char_end": 149
        },
        {
          "paragraph_id": "p6",
          "sentence_id": "p6_s1",
          "sentence_index": 1,
          "text": "Feature\tFrequency",
          "char_start": 151,
          "char_end": 168
        },
        {
          "paragraph_id": "p7",
          "sentence_id": "p7_s1",
          "sentence_index": 1,
          "text": "Seizures\t100%\nIntellectual disability\t95%\nMicrocephaly\t80%\nSpasticity\t75%",
          "char_start": 170,
          "char_end": 243
        },
        {
          "paragraph_id": "p8",
          "sentence_id": "p8_s1",
          "sentence_index": 1,
          "text": "Establishing the Diagnosis",
          "char_start": 245,
          "char_end": 271
        },
        {
          "paragraph_id": "p9",
          "sentence_id": "p9_s1",
          "sentence_index": 1,
          "text": "The diagnosis is established in a proband with the above clinical features and biallelic pathogenic variants in GENE3 identified by molecular genetic testing.",
          "char_start": 273,
          "char_end": 431
        },
        {
          "paragraph_id": "p10",
          "sentence_id": "p10_s1",
          "sentence_index": 1,
          "text": "Molecular Genetics",
          "char_start": 433,
          "char_end": 451
        },
        {
          "paragraph_id": "p11",
          "sentence_id": "p11_s1",
          "sentence_index": 1,
          "text": "Gene.",
          "char_start": 453,
          "char_end": 458
        },
        {
          "paragraph_id": "p11",
          "sentence_id": "p11_s2",
          "sentence_index": 2,
          "text": "GENE3",
          "char_start": 459,
          "char_end": 464
        },
        {
          "paragraph_id": "p12",
          "sentence_id": "p12_s1",
          "sentence_index": 1,
          "text": "Gene structure.",
          "char_start": 466,
          "char_end": 481
        },
        {
          "paragraph_id": "p12",
          "sentence_id": "p12_s2",
          "sentence_index": 2,
          "text": "GENE3 comprises 12 exons.",
          "char_start": 482,
          "char_end": 507
        },
        {
          "paragraph_id": "p13",
          "sentence_id": "p13_s1",
          "sentence_index": 1,
          "text": "Pathogenic variants.",
          "char_start": 509,
          "char_end": 529
        },
        {
          "paragraph_id": "p13",
          "sentence_id": "p13_s2",
          "sentence_index": 2,
          "text": "See Table 2.",
          "char_start": 530,
          "char_end": 542
        }
      ]
    }
  },
  {
    "id": "disc-091",
    "chapter_title": "Synonym Overlap With Anchors",
    "existing_anchors": [
      {
        "hpo_label": "Sensorineural hearing impairment",
        "match_texts": [
          "sensorineural hearing loss",
          "hearing impairment"
        ]
      },
      {
        "hpo_label": "Seizure",
        "match_texts": [
          "seizures",
          "epilepsy",
          "convulsions"
        ]
      }
    ],
    "clinical_text": "Bilateral sensorineural deafness is congenital and profound. Fits were noted in the neonatal period. Febrile convulsions occurred repeatedly during infancy. Hearing aids were ineffective and cochlear implantation was performed at age 2. The epilepsy was controlled with levetiracetam by age 5.",
    "expectedNewCandidates": [],
    "mustNotPropose": [
      {
        "label": "Sensorineural hearing impairment",
        "reason": "already_in_anchors"
      },
      {
        "label": "sensorineural deafness",
        "reason": "already_in_anchors"
      },
      {
        "label": "deafness",
        "reason": "already_in_anchors"
      },
      {
        "label": "hearing loss",
        "reason": "already_in_anchors"
      },
      {
        "label": "Seizure",
        "reason": "already_in_anchors"
      },
      {
        "label": "fits",
        "reason": "already_in_anchors"
      },
      {
        "label": "convulsions",
        "reason": "already_in_anchors"
      },
      {
        "label": "epilepsy",
        "reason": "already_in_anchors"
      },
      {
        "label": "hearing aids",
        "reason": "treatment_or_management"
      },
      {
        "label": "cochlear implantation",
        "reason": "treatment_or_management"
      },
      {
        "label": "levetiracetam",
        "reason": "treatment_or_management"
      }
    ],
    "acceptableExtraCandidates": [],
    "clinical_structure": {
      "chapter_title": "Synonym Overlap With Anchors",
      "clinical_text": "Bilateral sensorineural deafness is congenital and profound. Fits were noted in the neonatal period. Febrile convulsions occurred repeatedly during infancy. Hearing aids were ineffective and cochlear implantation was performed at age 2. The epilepsy was controlled with levetiracetam by age 5.",
      "paragraph_count": 1,
      "sentence_count": 5,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Bilateral sensorineural deafness is congenital and profound. Fits were noted in the neonatal period. Febrile convulsions occurred repeatedly during infancy. Hearing aids were ineffective and cochlear implantation was performed at age 2. The epilepsy was controlled with levetiracetam by age 5.",
          "char_start": 0,
          "char_end": 293,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Bilateral sensorineural deafness is congenital and profound.",
              "char_start": 0,
              "char_end": 60
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Fits were noted in the neonatal period.",
              "char_start": 61,
              "char_end": 100
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Febrile convulsions occurred repeatedly during infancy.",
              "char_start": 101,
              "char_end": 156
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Hearing aids were ineffective and cochlear implantation was performed at age 2.",
              "char_start": 157,
              "char_end": 236
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "The epilepsy was controlled with levetiracetam by age 5.",
              "char_start": 237,
              "char_end": 293
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Bilateral sensorineural deafness is congenital and profound.",
          "char_start": 0,
          "char_end": 60
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Fits were noted in the neonatal period.",
          "char_start": 61,
          "char_end": 100
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Febrile convulsions occurred repeatedly during infancy.",
          "char_start": 101,
          "char_end": 156
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Hearing aids were ineffective and cochlear implantation was performed at age 2.",
          "char_start": 157,
          "char_end": 236
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "The epilepsy was controlled with levetiracetam by age 5.",
          "char_start": 237,
          "char_end": 293
        }
      ]
    }
  },
  {
    "id": "disc-092",
    "chapter_title": "Subtle Implied Phenotypes",
    "existing_anchors": [
      {
        "hpo_label": "Intellectual disability",
        "match_texts": [
          "intellectual disability"
        ]
      }
    ],
    "clinical_text": "By age 3, the child had not spoken her first word. She communicated solely through gestures and a few signs. She was not yet walking at 24 months, though she could pull to stand with support. Nighttime sleep was fragmented, with multiple awakenings and difficulty returning to sleep. Mealtimes were prolonged due to difficulty chewing solid foods, and she accepted only pureed textures. She showed no interest in other children and preferred to play alone, engaging in repetitive spinning of objects for extended periods.",
    "expectedNewCandidates": [
      {
        "label": "absent speech",
        "status": "present"
      },
      {
        "label": "delayed walking",
        "status": "present"
      },
      {
        "label": "sleep disturbance",
        "status": "present"
      },
      {
        "label": "feeding difficulties",
        "status": "present"
      },
      {
        "label": "difficulty chewing",
        "status": "present"
      },
      {
        "label": "social withdrawal",
        "status": "present"
      },
      {
        "label": "repetitive behaviors",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Intellectual disability",
        "reason": "already_in_anchors"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "gross motor delay",
        "status": "present"
      },
      {
        "label": "autistic features",
        "status": "present"
      },
      {
        "label": "speech delay",
        "status": "present"
      },
      {
        "label": "oral motor dysfunction",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Subtle Implied Phenotypes",
      "clinical_text": "By age 3, the child had not spoken her first word. She communicated solely through gestures and a few signs. She was not yet walking at 24 months, though she could pull to stand with support. Nighttime sleep was fragmented, with multiple awakenings and difficulty returning to sleep. Mealtimes were prolonged due to difficulty chewing solid foods, and she accepted only pureed textures. She showed no interest in other children and preferred to play alone, engaging in repetitive spinning of objects for extended periods.",
      "paragraph_count": 1,
      "sentence_count": 6,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "By age 3, the child had not spoken her first word. She communicated solely through gestures and a few signs. She was not yet walking at 24 months, though she could pull to stand with support. Nighttime sleep was fragmented, with multiple awakenings and difficulty returning to sleep. Mealtimes were prolonged due to difficulty chewing solid foods, and she accepted only pureed textures. She showed no interest in other children and preferred to play alone, engaging in repetitive spinning of objects for extended periods.",
          "char_start": 0,
          "char_end": 521,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "By age 3, the child had not spoken her first word.",
              "char_start": 0,
              "char_end": 50
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "She communicated solely through gestures and a few signs.",
              "char_start": 51,
              "char_end": 108
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "She was not yet walking at 24 months, though she could pull to stand with support.",
              "char_start": 109,
              "char_end": 191
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Nighttime sleep was fragmented, with multiple awakenings and difficulty returning to sleep.",
              "char_start": 192,
              "char_end": 283
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Mealtimes were prolonged due to difficulty chewing solid foods, and she accepted only pureed textures.",
              "char_start": 284,
              "char_end": 386
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "She showed no interest in other children and preferred to play alone, engaging in repetitive spinning of objects for extended periods.",
              "char_start": 387,
              "char_end": 521
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "By age 3, the child had not spoken her first word.",
          "char_start": 0,
          "char_end": 50
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "She communicated solely through gestures and a few signs.",
          "char_start": 51,
          "char_end": 108
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "She was not yet walking at 24 months, though she could pull to stand with support.",
          "char_start": 109,
          "char_end": 191
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Nighttime sleep was fragmented, with multiple awakenings and difficulty returning to sleep.",
          "char_start": 192,
          "char_end": 283
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Mealtimes were prolonged due to difficulty chewing solid foods, and she accepted only pureed textures.",
          "char_start": 284,
          "char_end": 386
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "She showed no interest in other children and preferred to play alone, engaging in repetitive spinning of objects for extended periods.",
          "char_start": 387,
          "char_end": 521
        }
      ]
    }
  },
  {
    "id": "disc-093",
    "chapter_title": "Mixed Present and Excluded Complex",
    "existing_anchors": [
      {
        "hpo_label": "Ataxia",
        "match_texts": [
          "cerebellar ataxia"
        ]
      },
      {
        "hpo_label": "Peripheral neuropathy",
        "match_texts": [
          "peripheral neuropathy"
        ]
      }
    ],
    "clinical_text": "Scoliosis is present in approximately 75% of individuals. Cardiomyopathy develops in most patients, with hypertrophic cardiomyopathy being more common than dilated. Seizures have not been reported. Cognitive function is uniformly preserved. Hearing is normal. Optic atrophy has not been documented in this disorder. Diabetes mellitus develops in 10%–30%. Pes cavus and hammertoe deformities are frequent. Sensorineural hearing loss is not a feature.",
    "expectedNewCandidates": [
      {
        "label": "scoliosis",
        "status": "present"
      },
      {
        "label": "hypertrophic cardiomyopathy",
        "status": "present"
      },
      {
        "label": "seizures",
        "status": "excluded"
      },
      {
        "label": "optic atrophy",
        "status": "excluded"
      },
      {
        "label": "diabetes mellitus",
        "status": "present"
      },
      {
        "label": "pes cavus",
        "status": "present"
      },
      {
        "label": "hammertoe deformity",
        "status": "present"
      },
      {
        "label": "sensorineural hearing loss",
        "status": "excluded"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Ataxia",
        "reason": "already_in_anchors"
      },
      {
        "label": "Peripheral neuropathy",
        "reason": "already_in_anchors"
      },
      {
        "label": "cognitive function",
        "reason": "normal_or_preserved"
      },
      {
        "label": "hearing",
        "reason": "normal_or_preserved"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "cardiomyopathy",
        "status": "present"
      },
      {
        "label": "dilated cardiomyopathy",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Mixed Present and Excluded Complex",
      "clinical_text": "Scoliosis is present in approximately 75% of individuals. Cardiomyopathy develops in most patients, with hypertrophic cardiomyopathy being more common than dilated. Seizures have not been reported. Cognitive function is uniformly preserved. Hearing is normal. Optic atrophy has not been documented in this disorder. Diabetes mellitus develops in 10%–30%. Pes cavus and hammertoe deformities are frequent. Sensorineural hearing loss is not a feature.",
      "paragraph_count": 1,
      "sentence_count": 9,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Scoliosis is present in approximately 75% of individuals. Cardiomyopathy develops in most patients, with hypertrophic cardiomyopathy being more common than dilated. Seizures have not been reported. Cognitive function is uniformly preserved. Hearing is normal. Optic atrophy has not been documented in this disorder. Diabetes mellitus develops in 10%–30%. Pes cavus and hammertoe deformities are frequent. Sensorineural hearing loss is not a feature.",
          "char_start": 0,
          "char_end": 449,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Scoliosis is present in approximately 75% of individuals.",
              "char_start": 0,
              "char_end": 57
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Cardiomyopathy develops in most patients, with hypertrophic cardiomyopathy being more common than dilated.",
              "char_start": 58,
              "char_end": 164
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Seizures have not been reported.",
              "char_start": 165,
              "char_end": 197
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Cognitive function is uniformly preserved.",
              "char_start": 198,
              "char_end": 240
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Hearing is normal.",
              "char_start": 241,
              "char_end": 259
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Optic atrophy has not been documented in this disorder.",
              "char_start": 260,
              "char_end": 315
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Diabetes mellitus develops in 10%–30%.",
              "char_start": 316,
              "char_end": 354
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Pes cavus and hammertoe deformities are frequent.",
              "char_start": 355,
              "char_end": 404
            },
            {
              "sentence_id": "p1_s9",
              "sentence_index": 9,
              "text": "Sensorineural hearing loss is not a feature.",
              "char_start": 405,
              "char_end": 449
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Scoliosis is present in approximately 75% of individuals.",
          "char_start": 0,
          "char_end": 57
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Cardiomyopathy develops in most patients, with hypertrophic cardiomyopathy being more common than dilated.",
          "char_start": 58,
          "char_end": 164
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Seizures have not been reported.",
          "char_start": 165,
          "char_end": 197
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Cognitive function is uniformly preserved.",
          "char_start": 198,
          "char_end": 240
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Hearing is normal.",
          "char_start": 241,
          "char_end": 259
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Optic atrophy has not been documented in this disorder.",
          "char_start": 260,
          "char_end": 315
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Diabetes mellitus develops in 10%–30%.",
          "char_start": 316,
          "char_end": 354
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Pes cavus and hammertoe deformities are frequent.",
          "char_start": 355,
          "char_end": 404
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s9",
          "sentence_index": 9,
          "text": "Sensorineural hearing loss is not a feature.",
          "char_start": 405,
          "char_end": 449
        }
      ]
    }
  },
  {
    "id": "disc-094",
    "chapter_title": "Prognosis and Natural History Heavy",
    "existing_anchors": [
      {
        "hpo_label": "Seizure",
        "match_texts": [
          "seizures"
        ]
      },
      {
        "hpo_label": "Intellectual disability",
        "match_texts": [
          "intellectual disability"
        ]
      }
    ],
    "clinical_text": "Life expectancy is reduced, with most individuals surviving into the third to fifth decade. The most common causes of death are pneumonia from aspiration, status epilepticus, and sudden unexpected death in epilepsy. Quality of life is significantly impacted by the severity of motor disability. Most individuals require full-time caregiving. Transition from pediatric to adult services is often challenging. Families report significant caregiver burden. Palliative care consultation should be considered for those with advanced disease.",
    "expectedNewCandidates": [],
    "mustNotPropose": [
      {
        "label": "Seizure",
        "reason": "already_in_anchors"
      },
      {
        "label": "Intellectual disability",
        "reason": "already_in_anchors"
      },
      {
        "label": "pneumonia",
        "reason": "conditional_or_risk_only"
      },
      {
        "label": "palliative care",
        "reason": "treatment_or_management"
      },
      {
        "label": "caregiver burden",
        "reason": "not_a_phenotype"
      },
      {
        "label": "reduced life expectancy",
        "reason": "not_a_phenotype"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "dysphagia",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Prognosis and Natural History Heavy",
      "clinical_text": "Life expectancy is reduced, with most individuals surviving into the third to fifth decade. The most common causes of death are pneumonia from aspiration, status epilepticus, and sudden unexpected death in epilepsy. Quality of life is significantly impacted by the severity of motor disability. Most individuals require full-time caregiving. Transition from pediatric to adult services is often challenging. Families report significant caregiver burden. Palliative care consultation should be considered for those with advanced disease.",
      "paragraph_count": 1,
      "sentence_count": 7,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Life expectancy is reduced, with most individuals surviving into the third to fifth decade. The most common causes of death are pneumonia from aspiration, status epilepticus, and sudden unexpected death in epilepsy. Quality of life is significantly impacted by the severity of motor disability. Most individuals require full-time caregiving. Transition from pediatric to adult services is often challenging. Families report significant caregiver burden. Palliative care consultation should be considered for those with advanced disease.",
          "char_start": 0,
          "char_end": 536,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Life expectancy is reduced, with most individuals surviving into the third to fifth decade.",
              "char_start": 0,
              "char_end": 91
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "The most common causes of death are pneumonia from aspiration, status epilepticus, and sudden unexpected death in epilepsy.",
              "char_start": 92,
              "char_end": 215
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Quality of life is significantly impacted by the severity of motor disability.",
              "char_start": 216,
              "char_end": 294
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Most individuals require full-time caregiving.",
              "char_start": 295,
              "char_end": 341
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Transition from pediatric to adult services is often challenging.",
              "char_start": 342,
              "char_end": 407
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Families report significant caregiver burden.",
              "char_start": 408,
              "char_end": 453
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Palliative care consultation should be considered for those with advanced disease.",
              "char_start": 454,
              "char_end": 536
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Life expectancy is reduced, with most individuals surviving into the third to fifth decade.",
          "char_start": 0,
          "char_end": 91
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "The most common causes of death are pneumonia from aspiration, status epilepticus, and sudden unexpected death in epilepsy.",
          "char_start": 92,
          "char_end": 215
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Quality of life is significantly impacted by the severity of motor disability.",
          "char_start": 216,
          "char_end": 294
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Most individuals require full-time caregiving.",
          "char_start": 295,
          "char_end": 341
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Transition from pediatric to adult services is often challenging.",
          "char_start": 342,
          "char_end": 407
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Families report significant caregiver burden.",
          "char_start": 408,
          "char_end": 453
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Palliative care consultation should be considered for those with advanced disease.",
          "char_start": 454,
          "char_end": 536
        }
      ]
    }
  },
  {
    "id": "disc-095",
    "chapter_title": "Subtle Anchor Synonym Collision",
    "existing_anchors": [
      {
        "hpo_label": "Dystonia",
        "match_texts": [
          "dystonia",
          "generalized dystonia"
        ]
      },
      {
        "hpo_label": "Intellectual disability",
        "match_texts": [
          "intellectual disability",
          "cognitive impairment"
        ]
      }
    ],
    "clinical_text": "Involuntary sustained muscle contractions cause abnormal posturing of the limbs and trunk. Cognitive decline begins in childhood and progresses relentlessly. Slurred speech develops as orobuccal dystonia worsens. Swallowing becomes increasingly unsafe, and aspiration pneumonia is a leading cause of death. Fixed skeletal deformities may result from chronic dystonic posturing. Psychiatric symptoms including depression and psychosis have been reported.",
    "expectedNewCandidates": [
      {
        "label": "dysarthria",
        "status": "present"
      },
      {
        "label": "dysphagia",
        "status": "present"
      },
      {
        "label": "skeletal deformities",
        "status": "present"
      },
      {
        "label": "depression",
        "status": "present"
      },
      {
        "label": "psychosis",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Dystonia",
        "reason": "already_in_anchors"
      },
      {
        "label": "involuntary sustained muscle contractions",
        "reason": "already_in_anchors"
      },
      {
        "label": "abnormal posturing",
        "reason": "already_in_anchors"
      },
      {
        "label": "orobuccal dystonia",
        "reason": "already_in_anchors"
      },
      {
        "label": "Intellectual disability",
        "reason": "already_in_anchors"
      },
      {
        "label": "cognitive decline",
        "reason": "already_in_anchors"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "slurred speech",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Subtle Anchor Synonym Collision",
      "clinical_text": "Involuntary sustained muscle contractions cause abnormal posturing of the limbs and trunk. Cognitive decline begins in childhood and progresses relentlessly. Slurred speech develops as orobuccal dystonia worsens. Swallowing becomes increasingly unsafe, and aspiration pneumonia is a leading cause of death. Fixed skeletal deformities may result from chronic dystonic posturing. Psychiatric symptoms including depression and psychosis have been reported.",
      "paragraph_count": 1,
      "sentence_count": 6,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Involuntary sustained muscle contractions cause abnormal posturing of the limbs and trunk. Cognitive decline begins in childhood and progresses relentlessly. Slurred speech develops as orobuccal dystonia worsens. Swallowing becomes increasingly unsafe, and aspiration pneumonia is a leading cause of death. Fixed skeletal deformities may result from chronic dystonic posturing. Psychiatric symptoms including depression and psychosis have been reported.",
          "char_start": 0,
          "char_end": 453,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Involuntary sustained muscle contractions cause abnormal posturing of the limbs and trunk.",
              "char_start": 0,
              "char_end": 90
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Cognitive decline begins in childhood and progresses relentlessly.",
              "char_start": 91,
              "char_end": 157
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Slurred speech develops as orobuccal dystonia worsens.",
              "char_start": 158,
              "char_end": 212
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Swallowing becomes increasingly unsafe, and aspiration pneumonia is a leading cause of death.",
              "char_start": 213,
              "char_end": 306
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Fixed skeletal deformities may result from chronic dystonic posturing.",
              "char_start": 307,
              "char_end": 377
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Psychiatric symptoms including depression and psychosis have been reported.",
              "char_start": 378,
              "char_end": 453
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Involuntary sustained muscle contractions cause abnormal posturing of the limbs and trunk.",
          "char_start": 0,
          "char_end": 90
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Cognitive decline begins in childhood and progresses relentlessly.",
          "char_start": 91,
          "char_end": 157
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Slurred speech develops as orobuccal dystonia worsens.",
          "char_start": 158,
          "char_end": 212
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Swallowing becomes increasingly unsafe, and aspiration pneumonia is a leading cause of death.",
          "char_start": 213,
          "char_end": 306
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Fixed skeletal deformities may result from chronic dystonic posturing.",
          "char_start": 307,
          "char_end": 377
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Psychiatric symptoms including depression and psychosis have been reported.",
          "char_start": 378,
          "char_end": 453
        }
      ]
    }
  },
  {
    "id": "disc-096",
    "chapter_title": "Adjacent Phenotype and Disease Name",
    "existing_anchors": [],
    "clinical_text": "In spinocerebellar ataxia type 7, progressive cerebellar ataxia is accompanied by a distinctive cone-rod dystrophy causing progressive visual loss. Dysphagia and dysarthria develop as bulbar function declines. In infantile-onset cases, cardiac involvement including patent ductus arteriosus has been reported. Spinocerebellar ataxia type 7 is caused by CAG expansions in ATXN7.",
    "expectedNewCandidates": [
      {
        "label": "progressive cerebellar ataxia",
        "status": "present"
      },
      {
        "label": "cone-rod dystrophy",
        "status": "present"
      },
      {
        "label": "progressive visual loss",
        "status": "present"
      },
      {
        "label": "dysphagia",
        "status": "present"
      },
      {
        "label": "dysarthria",
        "status": "present"
      },
      {
        "label": "patent ductus arteriosus",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "spinocerebellar ataxia type 7",
        "reason": "not_a_phenotype"
      },
      {
        "label": "SCA7",
        "reason": "not_a_phenotype"
      },
      {
        "label": "ATXN7",
        "reason": "gene_or_variant"
      },
      {
        "label": "CAG expansions",
        "reason": "gene_or_variant"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "bulbar dysfunction",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Adjacent Phenotype and Disease Name",
      "clinical_text": "In spinocerebellar ataxia type 7, progressive cerebellar ataxia is accompanied by a distinctive cone-rod dystrophy causing progressive visual loss. Dysphagia and dysarthria develop as bulbar function declines. In infantile-onset cases, cardiac involvement including patent ductus arteriosus has been reported. Spinocerebellar ataxia type 7 is caused by CAG expansions in ATXN7.",
      "paragraph_count": 1,
      "sentence_count": 4,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "In spinocerebellar ataxia type 7, progressive cerebellar ataxia is accompanied by a distinctive cone-rod dystrophy causing progressive visual loss. Dysphagia and dysarthria develop as bulbar function declines. In infantile-onset cases, cardiac involvement including patent ductus arteriosus has been reported. Spinocerebellar ataxia type 7 is caused by CAG expansions in ATXN7.",
          "char_start": 0,
          "char_end": 377,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "In spinocerebellar ataxia type 7, progressive cerebellar ataxia is accompanied by a distinctive cone-rod dystrophy causing progressive visual loss.",
              "char_start": 0,
              "char_end": 147
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Dysphagia and dysarthria develop as bulbar function declines.",
              "char_start": 148,
              "char_end": 209
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "In infantile-onset cases, cardiac involvement including patent ductus arteriosus has been reported.",
              "char_start": 210,
              "char_end": 309
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Spinocerebellar ataxia type 7 is caused by CAG expansions in ATXN7.",
              "char_start": 310,
              "char_end": 377
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "In spinocerebellar ataxia type 7, progressive cerebellar ataxia is accompanied by a distinctive cone-rod dystrophy causing progressive visual loss.",
          "char_start": 0,
          "char_end": 147
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Dysphagia and dysarthria develop as bulbar function declines.",
          "char_start": 148,
          "char_end": 209
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "In infantile-onset cases, cardiac involvement including patent ductus arteriosus has been reported.",
          "char_start": 210,
          "char_end": 309
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Spinocerebellar ataxia type 7 is caused by CAG expansions in ATXN7.",
          "char_start": 310,
          "char_end": 377
        }
      ]
    }
  },
  {
    "id": "disc-097",
    "chapter_title": "Differential Diagnosis Contamination",
    "existing_anchors": [
      {
        "hpo_label": "Seizure",
        "match_texts": [
          "seizures"
        ]
      },
      {
        "hpo_label": "Microcephaly",
        "match_texts": [
          "microcephaly"
        ]
      }
    ],
    "clinical_text": "The differential diagnosis includes Rett syndrome, Angelman syndrome, Pitt-Hopkins syndrome, and FOXG1 syndrome. Rett syndrome can be distinguished by the presence of stereotypic hand movements and breathing irregularities. Angelman syndrome typically features a happy demeanor and characteristic EEG pattern. Pitt-Hopkins syndrome is characterized by distinctive facial features and episodic hyperventilation. Unlike these conditions, the present disorder does not include cardiac defects, and skeletal survey is normal.",
    "expectedNewCandidates": [
      {
        "label": "cardiac defects",
        "status": "excluded"
      },
      {
        "label": "skeletal abnormalities",
        "status": "excluded"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Seizure",
        "reason": "already_in_anchors"
      },
      {
        "label": "Microcephaly",
        "reason": "already_in_anchors"
      },
      {
        "label": "Rett syndrome",
        "reason": "not_a_phenotype"
      },
      {
        "label": "Angelman syndrome",
        "reason": "not_a_phenotype"
      },
      {
        "label": "Pitt-Hopkins syndrome",
        "reason": "not_a_phenotype"
      },
      {
        "label": "FOXG1 syndrome",
        "reason": "not_a_phenotype"
      },
      {
        "label": "stereotypic hand movements",
        "reason": "not_a_phenotype"
      },
      {
        "label": "breathing irregularities",
        "reason": "not_a_phenotype"
      },
      {
        "label": "happy demeanor",
        "reason": "not_a_phenotype"
      },
      {
        "label": "episodic hyperventilation",
        "reason": "not_a_phenotype"
      },
      {
        "label": "skeletal survey",
        "reason": "lab_or_test_method"
      },
      {
        "label": "EEG",
        "reason": "lab_or_test_method"
      }
    ],
    "acceptableExtraCandidates": [],
    "clinical_structure": {
      "chapter_title": "Differential Diagnosis Contamination",
      "clinical_text": "The differential diagnosis includes Rett syndrome, Angelman syndrome, Pitt-Hopkins syndrome, and FOXG1 syndrome. Rett syndrome can be distinguished by the presence of stereotypic hand movements and breathing irregularities. Angelman syndrome typically features a happy demeanor and characteristic EEG pattern. Pitt-Hopkins syndrome is characterized by distinctive facial features and episodic hyperventilation. Unlike these conditions, the present disorder does not include cardiac defects, and skeletal survey is normal.",
      "paragraph_count": 1,
      "sentence_count": 5,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "The differential diagnosis includes Rett syndrome, Angelman syndrome, Pitt-Hopkins syndrome, and FOXG1 syndrome. Rett syndrome can be distinguished by the presence of stereotypic hand movements and breathing irregularities. Angelman syndrome typically features a happy demeanor and characteristic EEG pattern. Pitt-Hopkins syndrome is characterized by distinctive facial features and episodic hyperventilation. Unlike these conditions, the present disorder does not include cardiac defects, and skeletal survey is normal.",
          "char_start": 0,
          "char_end": 521,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "The differential diagnosis includes Rett syndrome, Angelman syndrome, Pitt-Hopkins syndrome, and FOXG1 syndrome.",
              "char_start": 0,
              "char_end": 112
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Rett syndrome can be distinguished by the presence of stereotypic hand movements and breathing irregularities.",
              "char_start": 113,
              "char_end": 223
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Angelman syndrome typically features a happy demeanor and characteristic EEG pattern.",
              "char_start": 224,
              "char_end": 309
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Pitt-Hopkins syndrome is characterized by distinctive facial features and episodic hyperventilation.",
              "char_start": 310,
              "char_end": 410
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Unlike these conditions, the present disorder does not include cardiac defects, and skeletal survey is normal.",
              "char_start": 411,
              "char_end": 521
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "The differential diagnosis includes Rett syndrome, Angelman syndrome, Pitt-Hopkins syndrome, and FOXG1 syndrome.",
          "char_start": 0,
          "char_end": 112
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Rett syndrome can be distinguished by the presence of stereotypic hand movements and breathing irregularities.",
          "char_start": 113,
          "char_end": 223
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Angelman syndrome typically features a happy demeanor and characteristic EEG pattern.",
          "char_start": 224,
          "char_end": 309
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Pitt-Hopkins syndrome is characterized by distinctive facial features and episodic hyperventilation.",
          "char_start": 310,
          "char_end": 410
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Unlike these conditions, the present disorder does not include cardiac defects, and skeletal survey is normal.",
          "char_start": 411,
          "char_end": 521
        }
      ]
    }
  },
  {
    "id": "disc-098",
    "chapter_title": "Carrier Phenotype vs Affected Phenotype",
    "existing_anchors": [
      {
        "hpo_label": "Dystrophinopathy",
        "match_texts": [
          "dystrophinopathy"
        ]
      }
    ],
    "clinical_text": "Female carriers of DMD pathogenic variants are typically asymptomatic. However, approximately 2.5%–7.8% of carriers develop manifesting symptoms ranging from mild myalgia and elevated CK to progressive limb-girdle weakness resembling late-onset dystrophinopathy. Dilated cardiomyopathy may develop in carriers independently of skeletal muscle symptoms and requires surveillance by echocardiography. X-inactivation skewing is the proposed mechanism for symptomatic carriers. Prenatal testing and preimplantation genetic diagnosis are available for at-risk pregnancies.",
    "expectedNewCandidates": [
      {
        "label": "myalgia",
        "status": "present"
      },
      {
        "label": "elevated CK",
        "status": "present"
      },
      {
        "label": "limb-girdle weakness",
        "status": "present"
      },
      {
        "label": "dilated cardiomyopathy",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Dystrophinopathy",
        "reason": "already_in_anchors"
      },
      {
        "label": "DMD",
        "reason": "gene_or_variant"
      },
      {
        "label": "echocardiography",
        "reason": "lab_or_test_method"
      },
      {
        "label": "prenatal testing",
        "reason": "lab_or_test_method"
      },
      {
        "label": "preimplantation genetic diagnosis",
        "reason": "lab_or_test_method"
      },
      {
        "label": "X-inactivation skewing",
        "reason": "gene_or_variant"
      }
    ],
    "acceptableExtraCandidates": [],
    "clinical_structure": {
      "chapter_title": "Carrier Phenotype vs Affected Phenotype",
      "clinical_text": "Female carriers of DMD pathogenic variants are typically asymptomatic. However, approximately 2.5%–7.8% of carriers develop manifesting symptoms ranging from mild myalgia and elevated CK to progressive limb-girdle weakness resembling late-onset dystrophinopathy. Dilated cardiomyopathy may develop in carriers independently of skeletal muscle symptoms and requires surveillance by echocardiography. X-inactivation skewing is the proposed mechanism for symptomatic carriers. Prenatal testing and preimplantation genetic diagnosis are available for at-risk pregnancies.",
      "paragraph_count": 1,
      "sentence_count": 5,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Female carriers of DMD pathogenic variants are typically asymptomatic. However, approximately 2.5%–7.8% of carriers develop manifesting symptoms ranging from mild myalgia and elevated CK to progressive limb-girdle weakness resembling late-onset dystrophinopathy. Dilated cardiomyopathy may develop in carriers independently of skeletal muscle symptoms and requires surveillance by echocardiography. X-inactivation skewing is the proposed mechanism for symptomatic carriers. Prenatal testing and preimplantation genetic diagnosis are available for at-risk pregnancies.",
          "char_start": 0,
          "char_end": 567,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Female carriers of DMD pathogenic variants are typically asymptomatic.",
              "char_start": 0,
              "char_end": 70
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "However, approximately 2.5%–7.8% of carriers develop manifesting symptoms ranging from mild myalgia and elevated CK to progressive limb-girdle weakness resembling late-onset dystrophinopathy.",
              "char_start": 71,
              "char_end": 262
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Dilated cardiomyopathy may develop in carriers independently of skeletal muscle symptoms and requires surveillance by echocardiography.",
              "char_start": 263,
              "char_end": 398
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "X-inactivation skewing is the proposed mechanism for symptomatic carriers.",
              "char_start": 399,
              "char_end": 473
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Prenatal testing and preimplantation genetic diagnosis are available for at-risk pregnancies.",
              "char_start": 474,
              "char_end": 567
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Female carriers of DMD pathogenic variants are typically asymptomatic.",
          "char_start": 0,
          "char_end": 70
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "However, approximately 2.5%–7.8% of carriers develop manifesting symptoms ranging from mild myalgia and elevated CK to progressive limb-girdle weakness resembling late-onset dystrophinopathy.",
          "char_start": 71,
          "char_end": 262
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Dilated cardiomyopathy may develop in carriers independently of skeletal muscle symptoms and requires surveillance by echocardiography.",
          "char_start": 263,
          "char_end": 398
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "X-inactivation skewing is the proposed mechanism for symptomatic carriers.",
          "char_start": 399,
          "char_end": 473
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Prenatal testing and preimplantation genetic diagnosis are available for at-risk pregnancies.",
          "char_start": 474,
          "char_end": 567
        }
      ]
    }
  },
  {
    "id": "disc-099",
    "chapter_title": "Management-Only Paragraph Edge Case",
    "existing_anchors": [
      {
        "hpo_label": "Seizure",
        "match_texts": [
          "seizures"
        ]
      },
      {
        "hpo_label": "Intellectual disability",
        "match_texts": [
          "intellectual disability"
        ]
      }
    ],
    "clinical_text": "Management of seizures typically involves levetiracetam or valproic acid as first-line agents. Carbamazepine and phenytoin should be avoided as they may exacerbate seizures. Physical therapy is recommended to maintain mobility. Occupational therapy addresses fine motor skills and activities of daily living. Speech-language therapy targets communication goals. Behavioral intervention programs may be beneficial for aggression and self-injury. Annual developmental assessment is recommended. Families should be connected with support groups and respite care services.",
    "expectedNewCandidates": [],
    "mustNotPropose": [
      {
        "label": "Seizure",
        "reason": "already_in_anchors"
      },
      {
        "label": "Intellectual disability",
        "reason": "already_in_anchors"
      },
      {
        "label": "levetiracetam",
        "reason": "treatment_or_management"
      },
      {
        "label": "valproic acid",
        "reason": "treatment_or_management"
      },
      {
        "label": "carbamazepine",
        "reason": "treatment_or_management"
      },
      {
        "label": "phenytoin",
        "reason": "treatment_or_management"
      },
      {
        "label": "physical therapy",
        "reason": "treatment_or_management"
      },
      {
        "label": "occupational therapy",
        "reason": "treatment_or_management"
      },
      {
        "label": "speech-language therapy",
        "reason": "treatment_or_management"
      },
      {
        "label": "behavioral intervention",
        "reason": "treatment_or_management"
      },
      {
        "label": "developmental assessment",
        "reason": "lab_or_test_method"
      },
      {
        "label": "support groups",
        "reason": "treatment_or_management"
      },
      {
        "label": "respite care",
        "reason": "treatment_or_management"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "aggression",
        "status": "present"
      },
      {
        "label": "self-injury",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Management-Only Paragraph Edge Case",
      "clinical_text": "Management of seizures typically involves levetiracetam or valproic acid as first-line agents. Carbamazepine and phenytoin should be avoided as they may exacerbate seizures. Physical therapy is recommended to maintain mobility. Occupational therapy addresses fine motor skills and activities of daily living. Speech-language therapy targets communication goals. Behavioral intervention programs may be beneficial for aggression and self-injury. Annual developmental assessment is recommended. Families should be connected with support groups and respite care services.",
      "paragraph_count": 1,
      "sentence_count": 8,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Management of seizures typically involves levetiracetam or valproic acid as first-line agents. Carbamazepine and phenytoin should be avoided as they may exacerbate seizures. Physical therapy is recommended to maintain mobility. Occupational therapy addresses fine motor skills and activities of daily living. Speech-language therapy targets communication goals. Behavioral intervention programs may be beneficial for aggression and self-injury. Annual developmental assessment is recommended. Families should be connected with support groups and respite care services.",
          "char_start": 0,
          "char_end": 568,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Management of seizures typically involves levetiracetam or valproic acid as first-line agents.",
              "char_start": 0,
              "char_end": 94
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Carbamazepine and phenytoin should be avoided as they may exacerbate seizures.",
              "char_start": 95,
              "char_end": 173
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Physical therapy is recommended to maintain mobility.",
              "char_start": 174,
              "char_end": 227
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Occupational therapy addresses fine motor skills and activities of daily living.",
              "char_start": 228,
              "char_end": 308
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Speech-language therapy targets communication goals.",
              "char_start": 309,
              "char_end": 361
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Behavioral intervention programs may be beneficial for aggression and self-injury.",
              "char_start": 362,
              "char_end": 444
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Annual developmental assessment is recommended.",
              "char_start": 445,
              "char_end": 492
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Families should be connected with support groups and respite care services.",
              "char_start": 493,
              "char_end": 568
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Management of seizures typically involves levetiracetam or valproic acid as first-line agents.",
          "char_start": 0,
          "char_end": 94
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Carbamazepine and phenytoin should be avoided as they may exacerbate seizures.",
          "char_start": 95,
          "char_end": 173
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Physical therapy is recommended to maintain mobility.",
          "char_start": 174,
          "char_end": 227
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Occupational therapy addresses fine motor skills and activities of daily living.",
          "char_start": 228,
          "char_end": 308
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Speech-language therapy targets communication goals.",
          "char_start": 309,
          "char_end": 361
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Behavioral intervention programs may be beneficial for aggression and self-injury.",
          "char_start": 362,
          "char_end": 444
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Annual developmental assessment is recommended.",
          "char_start": 445,
          "char_end": 492
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Families should be connected with support groups and respite care services.",
          "char_start": 493,
          "char_end": 568
        }
      ]
    }
  }
];

module.exports = {
  DISCOVERY_BENCHMARK,
  DISCOVERY_BENCHMARK_RAW: DISCOVERY_BENCHMARK
};
