const DISCOVERY_BENCHMARK = [
  {
    "id": "disc-018",
    "chapter_title": "Prader-Willi Syndrome",
    "existing_anchors": [
      {
        "hpo_label": "Hypotonia",
        "match_texts": [
          "neonatal hypotonia",
          "severe hypotonia"
        ]
      },
      {
        "hpo_label": "Obesity",
        "match_texts": [
          "obesity",
          "central obesity"
        ]
      }
    ],
    "clinical_text": "Feeding difficulties in infancy are severe, often requiring gavage feeding, and contrast sharply with the hyperphagia that develops between ages 2 and 6. Short stature is universal if untreated with growth hormone. Hypogonadism manifests as cryptorchidism and scrotal hypoplasia in males and delayed or incomplete pubertal development in both sexes. Mild to moderate intellectual disability is typical. Behavioral problems including temper tantrums, obsessive-compulsive features, and skin picking are major management concerns. Characteristic facial features include a narrow bifrontal diameter, almond-shaped palpebral fissures, and a thin upper lip. Strabismus is present in over 50% of individuals. Sleep-disordered breathing is common. Scoliosis develops in the majority.",
    "expectedNewCandidates": [
      {
        "label": "feeding difficulties",
        "status": "present"
      },
      {
        "label": "hyperphagia",
        "status": "present"
      },
      {
        "label": "short stature",
        "status": "present"
      },
      {
        "label": "hypogonadism",
        "status": "present"
      },
      {
        "label": "cryptorchidism",
        "status": "present"
      },
      {
        "label": "delayed pubertal development",
        "status": "present"
      },
      {
        "label": "mild intellectual disability",
        "status": "present"
      },
      {
        "label": "temper tantrums",
        "status": "present"
      },
      {
        "label": "obsessive-compulsive features",
        "status": "present"
      },
      {
        "label": "skin picking",
        "status": "present"
      },
      {
        "label": "narrow bifrontal diameter",
        "status": "present"
      },
      {
        "label": "almond-shaped palpebral fissures",
        "status": "present"
      },
      {
        "label": "thin upper lip",
        "status": "present"
      },
      {
        "label": "strabismus",
        "status": "present"
      },
      {
        "label": "sleep-disordered breathing",
        "status": "present"
      },
      {
        "label": "scoliosis",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Hypotonia",
        "reason": "already_in_anchors"
      },
      {
        "label": "Obesity",
        "reason": "already_in_anchors"
      },
      {
        "label": "growth hormone",
        "reason": "treatment_or_management"
      },
      {
        "label": "gavage feeding",
        "reason": "treatment_or_management"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "scrotal hypoplasia",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Prader-Willi Syndrome",
      "clinical_text": "Feeding difficulties in infancy are severe, often requiring gavage feeding, and contrast sharply with the hyperphagia that develops between ages 2 and 6. Short stature is universal if untreated with growth hormone. Hypogonadism manifests as cryptorchidism and scrotal hypoplasia in males and delayed or incomplete pubertal development in both sexes. Mild to moderate intellectual disability is typical. Behavioral problems including temper tantrums, obsessive-compulsive features, and skin picking are major management concerns. Characteristic facial features include a narrow bifrontal diameter, almond-shaped palpebral fissures, and a thin upper lip. Strabismus is present in over 50% of individuals. Sleep-disordered breathing is common. Scoliosis develops in the majority.",
      "paragraph_count": 1,
      "sentence_count": 9,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Feeding difficulties in infancy are severe, often requiring gavage feeding, and contrast sharply with the hyperphagia that develops between ages 2 and 6. Short stature is universal if untreated with growth hormone. Hypogonadism manifests as cryptorchidism and scrotal hypoplasia in males and delayed or incomplete pubertal development in both sexes. Mild to moderate intellectual disability is typical. Behavioral problems including temper tantrums, obsessive-compulsive features, and skin picking are major management concerns. Characteristic facial features include a narrow bifrontal diameter, almond-shaped palpebral fissures, and a thin upper lip. Strabismus is present in over 50% of individuals. Sleep-disordered breathing is common. Scoliosis develops in the majority.",
          "char_start": 0,
          "char_end": 776,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Feeding difficulties in infancy are severe, often requiring gavage feeding, and contrast sharply with the hyperphagia that develops between ages 2 and 6.",
              "char_start": 0,
              "char_end": 153
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Short stature is universal if untreated with growth hormone.",
              "char_start": 154,
              "char_end": 214
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Hypogonadism manifests as cryptorchidism and scrotal hypoplasia in males and delayed or incomplete pubertal development in both sexes.",
              "char_start": 215,
              "char_end": 349
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Mild to moderate intellectual disability is typical.",
              "char_start": 350,
              "char_end": 402
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Behavioral problems including temper tantrums, obsessive-compulsive features, and skin picking are major management concerns.",
              "char_start": 403,
              "char_end": 528
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Characteristic facial features include a narrow bifrontal diameter, almond-shaped palpebral fissures, and a thin upper lip.",
              "char_start": 529,
              "char_end": 652
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Strabismus is present in over 50% of individuals.",
              "char_start": 653,
              "char_end": 702
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Sleep-disordered breathing is common.",
              "char_start": 703,
              "char_end": 740
            },
            {
              "sentence_id": "p1_s9",
              "sentence_index": 9,
              "text": "Scoliosis develops in the majority.",
              "char_start": 741,
              "char_end": 776
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Feeding difficulties in infancy are severe, often requiring gavage feeding, and contrast sharply with the hyperphagia that develops between ages 2 and 6.",
          "char_start": 0,
          "char_end": 153
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Short stature is universal if untreated with growth hormone.",
          "char_start": 154,
          "char_end": 214
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Hypogonadism manifests as cryptorchidism and scrotal hypoplasia in males and delayed or incomplete pubertal development in both sexes.",
          "char_start": 215,
          "char_end": 349
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Mild to moderate intellectual disability is typical.",
          "char_start": 350,
          "char_end": 402
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Behavioral problems including temper tantrums, obsessive-compulsive features, and skin picking are major management concerns.",
          "char_start": 403,
          "char_end": 528
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Characteristic facial features include a narrow bifrontal diameter, almond-shaped palpebral fissures, and a thin upper lip.",
          "char_start": 529,
          "char_end": 652
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Strabismus is present in over 50% of individuals.",
          "char_start": 653,
          "char_end": 702
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Sleep-disordered breathing is common.",
          "char_start": 703,
          "char_end": 740
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s9",
          "sentence_index": 9,
          "text": "Scoliosis develops in the majority.",
          "char_start": 741,
          "char_end": 776
        }
      ]
    }
  },
  {
    "id": "disc-020",
    "chapter_title": "Kabuki Syndrome",
    "existing_anchors": [
      {
        "hpo_label": "Intellectual disability",
        "match_texts": [
          "intellectual disability"
        ]
      },
      {
        "hpo_label": "Characteristic facies",
        "match_texts": [
          "characteristic facial features"
        ]
      }
    ],
    "clinical_text": "Postnatal growth deficiency leading to short stature is observed in the majority. Skeletal anomalies include persistent fetal fingertip pads, brachydactyly, clinodactyly, and vertebral abnormalities. Congenital heart defects, most commonly coarctation of the aorta and septal defects, occur in approximately 40% of patients. Hearing loss, usually conductive, is present in about 25%. Cleft palate or submucous cleft palate is a recognized feature. Renal malformations including horseshoe kidney and hydronephrosis have been described. Premature thelarche occurs in females. Susceptibility to recurrent infections due to hypogammaglobulinemia is noted. KMT2D and KDM6A are the two known causative genes.",
    "expectedNewCandidates": [
      {
        "label": "short stature",
        "status": "present"
      },
      {
        "label": "persistent fetal fingertip pads",
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
        "label": "vertebral abnormalities",
        "status": "present"
      },
      {
        "label": "congenital heart defects",
        "status": "present"
      },
      {
        "label": "coarctation of the aorta",
        "status": "present"
      },
      {
        "label": "hearing loss",
        "status": "present"
      },
      {
        "label": "cleft palate",
        "status": "present"
      },
      {
        "label": "horseshoe kidney",
        "status": "present"
      },
      {
        "label": "hydronephrosis",
        "status": "present"
      },
      {
        "label": "premature thelarche",
        "status": "present"
      },
      {
        "label": "recurrent infections",
        "status": "present"
      },
      {
        "label": "hypogammaglobulinemia",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Intellectual disability",
        "reason": "already_in_anchors"
      },
      {
        "label": "Characteristic facies",
        "reason": "already_in_anchors"
      },
      {
        "label": "KMT2D",
        "reason": "gene_or_variant"
      },
      {
        "label": "KDM6A",
        "reason": "gene_or_variant"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "septal defects",
        "status": "present"
      },
      {
        "label": "renal malformations",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Kabuki Syndrome",
      "clinical_text": "Postnatal growth deficiency leading to short stature is observed in the majority. Skeletal anomalies include persistent fetal fingertip pads, brachydactyly, clinodactyly, and vertebral abnormalities. Congenital heart defects, most commonly coarctation of the aorta and septal defects, occur in approximately 40% of patients. Hearing loss, usually conductive, is present in about 25%. Cleft palate or submucous cleft palate is a recognized feature. Renal malformations including horseshoe kidney and hydronephrosis have been described. Premature thelarche occurs in females. Susceptibility to recurrent infections due to hypogammaglobulinemia is noted. KMT2D and KDM6A are the two known causative genes.",
      "paragraph_count": 1,
      "sentence_count": 9,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Postnatal growth deficiency leading to short stature is observed in the majority. Skeletal anomalies include persistent fetal fingertip pads, brachydactyly, clinodactyly, and vertebral abnormalities. Congenital heart defects, most commonly coarctation of the aorta and septal defects, occur in approximately 40% of patients. Hearing loss, usually conductive, is present in about 25%. Cleft palate or submucous cleft palate is a recognized feature. Renal malformations including horseshoe kidney and hydronephrosis have been described. Premature thelarche occurs in females. Susceptibility to recurrent infections due to hypogammaglobulinemia is noted. KMT2D and KDM6A are the two known causative genes.",
          "char_start": 0,
          "char_end": 702,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Postnatal growth deficiency leading to short stature is observed in the majority.",
              "char_start": 0,
              "char_end": 81
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Skeletal anomalies include persistent fetal fingertip pads, brachydactyly, clinodactyly, and vertebral abnormalities.",
              "char_start": 82,
              "char_end": 199
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Congenital heart defects, most commonly coarctation of the aorta and septal defects, occur in approximately 40% of patients.",
              "char_start": 200,
              "char_end": 324
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Hearing loss, usually conductive, is present in about 25%.",
              "char_start": 325,
              "char_end": 383
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Cleft palate or submucous cleft palate is a recognized feature.",
              "char_start": 384,
              "char_end": 447
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Renal malformations including horseshoe kidney and hydronephrosis have been described.",
              "char_start": 448,
              "char_end": 534
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Premature thelarche occurs in females.",
              "char_start": 535,
              "char_end": 573
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Susceptibility to recurrent infections due to hypogammaglobulinemia is noted.",
              "char_start": 574,
              "char_end": 651
            },
            {
              "sentence_id": "p1_s9",
              "sentence_index": 9,
              "text": "KMT2D and KDM6A are the two known causative genes.",
              "char_start": 652,
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
          "text": "Postnatal growth deficiency leading to short stature is observed in the majority.",
          "char_start": 0,
          "char_end": 81
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Skeletal anomalies include persistent fetal fingertip pads, brachydactyly, clinodactyly, and vertebral abnormalities.",
          "char_start": 82,
          "char_end": 199
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Congenital heart defects, most commonly coarctation of the aorta and septal defects, occur in approximately 40% of patients.",
          "char_start": 200,
          "char_end": 324
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Hearing loss, usually conductive, is present in about 25%.",
          "char_start": 325,
          "char_end": 383
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Cleft palate or submucous cleft palate is a recognized feature.",
          "char_start": 384,
          "char_end": 447
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Renal malformations including horseshoe kidney and hydronephrosis have been described.",
          "char_start": 448,
          "char_end": 534
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Premature thelarche occurs in females.",
          "char_start": 535,
          "char_end": 573
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Susceptibility to recurrent infections due to hypogammaglobulinemia is noted.",
          "char_start": 574,
          "char_end": 651
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s9",
          "sentence_index": 9,
          "text": "KMT2D and KDM6A are the two known causative genes.",
          "char_start": 652,
          "char_end": 702
        }
      ]
    }
  },
  {
    "id": "disc-021",
    "chapter_title": "Williams Syndrome",
    "existing_anchors": [
      {
        "hpo_label": "Supravalvular aortic stenosis",
        "match_texts": [
          "supravalvular aortic stenosis",
          "SVAS"
        ]
      },
      {
        "hpo_label": "Intellectual disability",
        "match_texts": [
          "intellectual disability"
        ]
      }
    ],
    "clinical_text": "Peripheral pulmonary stenosis is common in infancy and usually resolves. Hypercalcemia in infancy may cause irritability and feeding difficulties. Characteristic facial features include a broad forehead, periorbital fullness, stellate iris pattern, short nose, full lips, and a wide mouth. The behavioral profile is distinctive, with an overly friendly personality, excessive empathy, and anxiety. Attention deficit is common. Hypothyroidism develops in approximately 15%. Connective tissue laxity contributes to joint hypermobility, inguinal hernia, and a hoarse voice. Hypertension is common in adults.",
    "expectedNewCandidates": [
      {
        "label": "peripheral pulmonary stenosis",
        "status": "present"
      },
      {
        "label": "hypercalcemia",
        "status": "present"
      },
      {
        "label": "irritability",
        "status": "present"
      },
      {
        "label": "feeding difficulties",
        "status": "present"
      },
      {
        "label": "broad forehead",
        "status": "present"
      },
      {
        "label": "stellate iris pattern",
        "status": "present"
      },
      {
        "label": "short nose",
        "status": "present"
      },
      {
        "label": "full lips",
        "status": "present"
      },
      {
        "label": "wide mouth",
        "status": "present"
      },
      {
        "label": "overly friendly personality",
        "status": "present"
      },
      {
        "label": "anxiety",
        "status": "present"
      },
      {
        "label": "attention deficit",
        "status": "present"
      },
      {
        "label": "hypothyroidism",
        "status": "present"
      },
      {
        "label": "joint hypermobility",
        "status": "present"
      },
      {
        "label": "inguinal hernia",
        "status": "present"
      },
      {
        "label": "hoarse voice",
        "status": "present"
      },
      {
        "label": "hypertension",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Supravalvular aortic stenosis",
        "reason": "already_in_anchors"
      },
      {
        "label": "Intellectual disability",
        "reason": "already_in_anchors"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "periorbital fullness",
        "status": "present"
      },
      {
        "label": "connective tissue laxity",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Williams Syndrome",
      "clinical_text": "Peripheral pulmonary stenosis is common in infancy and usually resolves. Hypercalcemia in infancy may cause irritability and feeding difficulties. Characteristic facial features include a broad forehead, periorbital fullness, stellate iris pattern, short nose, full lips, and a wide mouth. The behavioral profile is distinctive, with an overly friendly personality, excessive empathy, and anxiety. Attention deficit is common. Hypothyroidism develops in approximately 15%. Connective tissue laxity contributes to joint hypermobility, inguinal hernia, and a hoarse voice. Hypertension is common in adults.",
      "paragraph_count": 1,
      "sentence_count": 8,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Peripheral pulmonary stenosis is common in infancy and usually resolves. Hypercalcemia in infancy may cause irritability and feeding difficulties. Characteristic facial features include a broad forehead, periorbital fullness, stellate iris pattern, short nose, full lips, and a wide mouth. The behavioral profile is distinctive, with an overly friendly personality, excessive empathy, and anxiety. Attention deficit is common. Hypothyroidism develops in approximately 15%. Connective tissue laxity contributes to joint hypermobility, inguinal hernia, and a hoarse voice. Hypertension is common in adults.",
          "char_start": 0,
          "char_end": 604,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Peripheral pulmonary stenosis is common in infancy and usually resolves.",
              "char_start": 0,
              "char_end": 72
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Hypercalcemia in infancy may cause irritability and feeding difficulties.",
              "char_start": 73,
              "char_end": 146
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Characteristic facial features include a broad forehead, periorbital fullness, stellate iris pattern, short nose, full lips, and a wide mouth.",
              "char_start": 147,
              "char_end": 289
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "The behavioral profile is distinctive, with an overly friendly personality, excessive empathy, and anxiety.",
              "char_start": 290,
              "char_end": 397
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Attention deficit is common.",
              "char_start": 398,
              "char_end": 426
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Hypothyroidism develops in approximately 15%.",
              "char_start": 427,
              "char_end": 472
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Connective tissue laxity contributes to joint hypermobility, inguinal hernia, and a hoarse voice.",
              "char_start": 473,
              "char_end": 570
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Hypertension is common in adults.",
              "char_start": 571,
              "char_end": 604
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Peripheral pulmonary stenosis is common in infancy and usually resolves.",
          "char_start": 0,
          "char_end": 72
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Hypercalcemia in infancy may cause irritability and feeding difficulties.",
          "char_start": 73,
          "char_end": 146
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Characteristic facial features include a broad forehead, periorbital fullness, stellate iris pattern, short nose, full lips, and a wide mouth.",
          "char_start": 147,
          "char_end": 289
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "The behavioral profile is distinctive, with an overly friendly personality, excessive empathy, and anxiety.",
          "char_start": 290,
          "char_end": 397
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Attention deficit is common.",
          "char_start": 398,
          "char_end": 426
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Hypothyroidism develops in approximately 15%.",
          "char_start": 427,
          "char_end": 472
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Connective tissue laxity contributes to joint hypermobility, inguinal hernia, and a hoarse voice.",
          "char_start": 473,
          "char_end": 570
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Hypertension is common in adults.",
          "char_start": 571,
          "char_end": 604
        }
      ]
    }
  },
  {
    "id": "disc-038",
    "chapter_title": "Loeys-Dietz Syndrome",
    "existing_anchors": [
      {
        "hpo_label": "Aortic aneurysm",
        "match_texts": [
          "aortic aneurysm",
          "aortic root aneurysm"
        ]
      },
      {
        "hpo_label": "Arterial tortuosity",
        "match_texts": [
          "arterial tortuosity"
        ]
      }
    ],
    "clinical_text": "Craniofacial features include widely spaced eyes, bifid uvula or cleft palate, and craniosynostosis. Aneurysms may involve any arterial segment and can dissect or rupture at smaller diameters than typically seen in Marfan syndrome. Cervical spine instability has been reported. Scoliosis and pectus deformity are common skeletal findings. Club foot is present in a subset. Thin translucent skin with easy bruising and wide atrophic scars reflects the underlying connective tissue fragility. Allergic and eosinophilic gastrointestinal disease is increasingly recognized. Pathogenic variants in TGFBR1, TGFBR2, SMAD3, TGFB2, or TGFB3 are causative.",
    "expectedNewCandidates": [
      {
        "label": "hypertelorism",
        "status": "present"
      },
      {
        "label": "bifid uvula",
        "status": "present"
      },
      {
        "label": "cleft palate",
        "status": "present"
      },
      {
        "label": "craniosynostosis",
        "status": "present"
      },
      {
        "label": "cervical spine instability",
        "status": "present"
      },
      {
        "label": "scoliosis",
        "status": "present"
      },
      {
        "label": "pectus deformity",
        "status": "present"
      },
      {
        "label": "club foot",
        "status": "present"
      },
      {
        "label": "thin skin",
        "status": "present"
      },
      {
        "label": "easy bruising",
        "status": "present"
      },
      {
        "label": "atrophic scars",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Aortic aneurysm",
        "reason": "already_in_anchors"
      },
      {
        "label": "Arterial tortuosity",
        "reason": "already_in_anchors"
      },
      {
        "label": "TGFBR1",
        "reason": "gene_or_variant"
      },
      {
        "label": "TGFBR2",
        "reason": "gene_or_variant"
      },
      {
        "label": "SMAD3",
        "reason": "gene_or_variant"
      },
      {
        "label": "Marfan syndrome",
        "reason": "not_a_phenotype"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "widely spaced eyes",
        "status": "present"
      },
      {
        "label": "eosinophilic gastrointestinal disease",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Loeys-Dietz Syndrome",
      "clinical_text": "Craniofacial features include widely spaced eyes, bifid uvula or cleft palate, and craniosynostosis. Aneurysms may involve any arterial segment and can dissect or rupture at smaller diameters than typically seen in Marfan syndrome. Cervical spine instability has been reported. Scoliosis and pectus deformity are common skeletal findings. Club foot is present in a subset. Thin translucent skin with easy bruising and wide atrophic scars reflects the underlying connective tissue fragility. Allergic and eosinophilic gastrointestinal disease is increasingly recognized. Pathogenic variants in TGFBR1, TGFBR2, SMAD3, TGFB2, or TGFB3 are causative.",
      "paragraph_count": 1,
      "sentence_count": 8,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Craniofacial features include widely spaced eyes, bifid uvula or cleft palate, and craniosynostosis. Aneurysms may involve any arterial segment and can dissect or rupture at smaller diameters than typically seen in Marfan syndrome. Cervical spine instability has been reported. Scoliosis and pectus deformity are common skeletal findings. Club foot is present in a subset. Thin translucent skin with easy bruising and wide atrophic scars reflects the underlying connective tissue fragility. Allergic and eosinophilic gastrointestinal disease is increasingly recognized. Pathogenic variants in TGFBR1, TGFBR2, SMAD3, TGFB2, or TGFB3 are causative.",
          "char_start": 0,
          "char_end": 646,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Craniofacial features include widely spaced eyes, bifid uvula or cleft palate, and craniosynostosis.",
              "char_start": 0,
              "char_end": 100
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Aneurysms may involve any arterial segment and can dissect or rupture at smaller diameters than typically seen in Marfan syndrome.",
              "char_start": 101,
              "char_end": 231
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Cervical spine instability has been reported.",
              "char_start": 232,
              "char_end": 277
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Scoliosis and pectus deformity are common skeletal findings.",
              "char_start": 278,
              "char_end": 338
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Club foot is present in a subset.",
              "char_start": 339,
              "char_end": 372
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Thin translucent skin with easy bruising and wide atrophic scars reflects the underlying connective tissue fragility.",
              "char_start": 373,
              "char_end": 490
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Allergic and eosinophilic gastrointestinal disease is increasingly recognized.",
              "char_start": 491,
              "char_end": 569
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Pathogenic variants in TGFBR1, TGFBR2, SMAD3, TGFB2, or TGFB3 are causative.",
              "char_start": 570,
              "char_end": 646
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Craniofacial features include widely spaced eyes, bifid uvula or cleft palate, and craniosynostosis.",
          "char_start": 0,
          "char_end": 100
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Aneurysms may involve any arterial segment and can dissect or rupture at smaller diameters than typically seen in Marfan syndrome.",
          "char_start": 101,
          "char_end": 231
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Cervical spine instability has been reported.",
          "char_start": 232,
          "char_end": 277
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Scoliosis and pectus deformity are common skeletal findings.",
          "char_start": 278,
          "char_end": 338
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Club foot is present in a subset.",
          "char_start": 339,
          "char_end": 372
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Thin translucent skin with easy bruising and wide atrophic scars reflects the underlying connective tissue fragility.",
          "char_start": 373,
          "char_end": 490
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Allergic and eosinophilic gastrointestinal disease is increasingly recognized.",
          "char_start": 491,
          "char_end": 569
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Pathogenic variants in TGFBR1, TGFBR2, SMAD3, TGFB2, or TGFB3 are causative.",
          "char_start": 570,
          "char_end": 646
        }
      ]
    }
  },
  {
    "id": "disc-048",
    "chapter_title": "Fanconi Anemia",
    "existing_anchors": [
      {
        "hpo_label": "Bone marrow failure",
        "match_texts": [
          "progressive bone marrow failure"
        ]
      },
      {
        "hpo_label": "Radial ray deficiency",
        "match_texts": [
          "radial ray anomalies",
          "absent thumbs"
        ]
      }
    ],
    "clinical_text": "Short stature is present in the majority. Abnormal skin pigmentation including cafe-au-lait macules, hypopigmentation, and generalized hyperpigmentation is common. Microcephaly is observed in approximately one third. Renal malformations including horseshoe kidney and ectopic kidney are found in about one third. Hypogonadism with decreased fertility occurs in both sexes. Microphthalmia and ear abnormalities may be present. There is a markedly elevated risk of acute myeloid leukemia and squamous cell carcinomas, particularly of the head and neck and anogenital region. Chromosomal breakage testing using diepoxybutane or mitomycin C is the standard diagnostic assay. Hematopoietic stem cell transplantation is curative for the hematologic manifestations.",
    "expectedNewCandidates": [
      {
        "label": "short stature",
        "status": "present"
      },
      {
        "label": "cafe-au-lait macules",
        "status": "present"
      },
      {
        "label": "hypopigmentation",
        "status": "present"
      },
      {
        "label": "hyperpigmentation",
        "status": "present"
      },
      {
        "label": "microcephaly",
        "status": "present"
      },
      {
        "label": "renal malformations",
        "status": "present"
      },
      {
        "label": "hypogonadism",
        "status": "present"
      },
      {
        "label": "decreased fertility",
        "status": "present"
      },
      {
        "label": "microphthalmia",
        "status": "present"
      },
      {
        "label": "ear abnormalities",
        "status": "present"
      },
      {
        "label": "acute myeloid leukemia",
        "status": "present"
      },
      {
        "label": "squamous cell carcinoma",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Bone marrow failure",
        "reason": "already_in_anchors"
      },
      {
        "label": "Radial ray deficiency",
        "reason": "already_in_anchors"
      },
      {
        "label": "diepoxybutane",
        "reason": "lab_or_test_method"
      },
      {
        "label": "mitomycin C",
        "reason": "lab_or_test_method"
      },
      {
        "label": "chromosomal breakage testing",
        "reason": "lab_or_test_method"
      },
      {
        "label": "hematopoietic stem cell transplantation",
        "reason": "treatment_or_management"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "horseshoe kidney",
        "status": "present"
      },
      {
        "label": "ectopic kidney",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Fanconi Anemia",
      "clinical_text": "Short stature is present in the majority. Abnormal skin pigmentation including cafe-au-lait macules, hypopigmentation, and generalized hyperpigmentation is common. Microcephaly is observed in approximately one third. Renal malformations including horseshoe kidney and ectopic kidney are found in about one third. Hypogonadism with decreased fertility occurs in both sexes. Microphthalmia and ear abnormalities may be present. There is a markedly elevated risk of acute myeloid leukemia and squamous cell carcinomas, particularly of the head and neck and anogenital region. Chromosomal breakage testing using diepoxybutane or mitomycin C is the standard diagnostic assay. Hematopoietic stem cell transplantation is curative for the hematologic manifestations.",
      "paragraph_count": 1,
      "sentence_count": 9,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Short stature is present in the majority. Abnormal skin pigmentation including cafe-au-lait macules, hypopigmentation, and generalized hyperpigmentation is common. Microcephaly is observed in approximately one third. Renal malformations including horseshoe kidney and ectopic kidney are found in about one third. Hypogonadism with decreased fertility occurs in both sexes. Microphthalmia and ear abnormalities may be present. There is a markedly elevated risk of acute myeloid leukemia and squamous cell carcinomas, particularly of the head and neck and anogenital region. Chromosomal breakage testing using diepoxybutane or mitomycin C is the standard diagnostic assay. Hematopoietic stem cell transplantation is curative for the hematologic manifestations.",
          "char_start": 0,
          "char_end": 758,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Short stature is present in the majority.",
              "char_start": 0,
              "char_end": 41
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Abnormal skin pigmentation including cafe-au-lait macules, hypopigmentation, and generalized hyperpigmentation is common.",
              "char_start": 42,
              "char_end": 163
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Microcephaly is observed in approximately one third.",
              "char_start": 164,
              "char_end": 216
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Renal malformations including horseshoe kidney and ectopic kidney are found in about one third.",
              "char_start": 217,
              "char_end": 312
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Hypogonadism with decreased fertility occurs in both sexes.",
              "char_start": 313,
              "char_end": 372
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Microphthalmia and ear abnormalities may be present.",
              "char_start": 373,
              "char_end": 425
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "There is a markedly elevated risk of acute myeloid leukemia and squamous cell carcinomas, particularly of the head and neck and anogenital region.",
              "char_start": 426,
              "char_end": 572
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Chromosomal breakage testing using diepoxybutane or mitomycin C is the standard diagnostic assay.",
              "char_start": 573,
              "char_end": 670
            },
            {
              "sentence_id": "p1_s9",
              "sentence_index": 9,
              "text": "Hematopoietic stem cell transplantation is curative for the hematologic manifestations.",
              "char_start": 671,
              "char_end": 758
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Short stature is present in the majority.",
          "char_start": 0,
          "char_end": 41
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Abnormal skin pigmentation including cafe-au-lait macules, hypopigmentation, and generalized hyperpigmentation is common.",
          "char_start": 42,
          "char_end": 163
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Microcephaly is observed in approximately one third.",
          "char_start": 164,
          "char_end": 216
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Renal malformations including horseshoe kidney and ectopic kidney are found in about one third.",
          "char_start": 217,
          "char_end": 312
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Hypogonadism with decreased fertility occurs in both sexes.",
          "char_start": 313,
          "char_end": 372
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Microphthalmia and ear abnormalities may be present.",
          "char_start": 373,
          "char_end": 425
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "There is a markedly elevated risk of acute myeloid leukemia and squamous cell carcinomas, particularly of the head and neck and anogenital region.",
          "char_start": 426,
          "char_end": 572
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Chromosomal breakage testing using diepoxybutane or mitomycin C is the standard diagnostic assay.",
          "char_start": 573,
          "char_end": 670
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s9",
          "sentence_index": 9,
          "text": "Hematopoietic stem cell transplantation is curative for the hematologic manifestations.",
          "char_start": 671,
          "char_end": 758
        }
      ]
    }
  },
  {
    "id": "disc-051",
    "chapter_title": "Zhu-Tokita-Takenouchi-Kim Syndrome",
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
    "clinical_text": "Most affected individuals never achieved the ability to walk independently. Spoken language is limited to fewer than 10 words in the majority. Seizures have not been reported in any individual to date. Growth parameters including height and weight are within normal limits. Brain MRI shows progressive cerebral atrophy and thin corpus callosum. Feeding difficulties requiring gastrostomy tube placement are frequent. Recurrent otitis media leads to conductive hearing loss in some. The disorder is caused by heterozygous pathogenic variants in SON and is inherited in an autosomal dominant manner, with most cases representing de novo events.",
    "expectedNewCandidates": [
      {
        "label": "inability to walk independently",
        "status": "present"
      },
      {
        "label": "limited speech",
        "status": "present"
      },
      {
        "label": "seizures",
        "status": "excluded"
      },
      {
        "label": "cerebral atrophy",
        "status": "present"
      },
      {
        "label": "thin corpus callosum",
        "status": "present"
      },
      {
        "label": "feeding difficulties",
        "status": "present"
      },
      {
        "label": "conductive hearing loss",
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
        "label": "height",
        "reason": "normal_or_preserved"
      },
      {
        "label": "weight",
        "reason": "normal_or_preserved"
      },
      {
        "label": "growth parameters",
        "reason": "normal_or_preserved"
      },
      {
        "label": "SON",
        "reason": "gene_or_variant"
      },
      {
        "label": "autosomal dominant",
        "reason": "not_a_phenotype"
      },
      {
        "label": "de novo",
        "reason": "not_a_phenotype"
      },
      {
        "label": "gastrostomy tube",
        "reason": "treatment_or_management"
      },
      {
        "label": "Brain MRI",
        "reason": "lab_or_test_method"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "absent ambulation",
        "status": "present"
      },
      {
        "label": "recurrent otitis media",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Zhu-Tokita-Takenouchi-Kim Syndrome",
      "clinical_text": "Most affected individuals never achieved the ability to walk independently. Spoken language is limited to fewer than 10 words in the majority. Seizures have not been reported in any individual to date. Growth parameters including height and weight are within normal limits. Brain MRI shows progressive cerebral atrophy and thin corpus callosum. Feeding difficulties requiring gastrostomy tube placement are frequent. Recurrent otitis media leads to conductive hearing loss in some. The disorder is caused by heterozygous pathogenic variants in SON and is inherited in an autosomal dominant manner, with most cases representing de novo events.",
      "paragraph_count": 1,
      "sentence_count": 8,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Most affected individuals never achieved the ability to walk independently. Spoken language is limited to fewer than 10 words in the majority. Seizures have not been reported in any individual to date. Growth parameters including height and weight are within normal limits. Brain MRI shows progressive cerebral atrophy and thin corpus callosum. Feeding difficulties requiring gastrostomy tube placement are frequent. Recurrent otitis media leads to conductive hearing loss in some. The disorder is caused by heterozygous pathogenic variants in SON and is inherited in an autosomal dominant manner, with most cases representing de novo events.",
          "char_start": 0,
          "char_end": 642,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Most affected individuals never achieved the ability to walk independently.",
              "char_start": 0,
              "char_end": 75
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Spoken language is limited to fewer than 10 words in the majority.",
              "char_start": 76,
              "char_end": 142
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Seizures have not been reported in any individual to date.",
              "char_start": 143,
              "char_end": 201
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Growth parameters including height and weight are within normal limits.",
              "char_start": 202,
              "char_end": 273
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Brain MRI shows progressive cerebral atrophy and thin corpus callosum.",
              "char_start": 274,
              "char_end": 344
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Feeding difficulties requiring gastrostomy tube placement are frequent.",
              "char_start": 345,
              "char_end": 416
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Recurrent otitis media leads to conductive hearing loss in some.",
              "char_start": 417,
              "char_end": 481
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "The disorder is caused by heterozygous pathogenic variants in SON and is inherited in an autosomal dominant manner, with most cases representing de novo events.",
              "char_start": 482,
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
          "text": "Most affected individuals never achieved the ability to walk independently.",
          "char_start": 0,
          "char_end": 75
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Spoken language is limited to fewer than 10 words in the majority.",
          "char_start": 76,
          "char_end": 142
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Seizures have not been reported in any individual to date.",
          "char_start": 143,
          "char_end": 201
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Growth parameters including height and weight are within normal limits.",
          "char_start": 202,
          "char_end": 273
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Brain MRI shows progressive cerebral atrophy and thin corpus callosum.",
          "char_start": 274,
          "char_end": 344
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Feeding difficulties requiring gastrostomy tube placement are frequent.",
          "char_start": 345,
          "char_end": 416
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Recurrent otitis media leads to conductive hearing loss in some.",
          "char_start": 417,
          "char_end": 481
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "The disorder is caused by heterozygous pathogenic variants in SON and is inherited in an autosomal dominant manner, with most cases representing de novo events.",
          "char_start": 482,
          "char_end": 642
        }
      ]
    }
  },
  {
    "id": "disc-053",
    "chapter_title": "Hereditary Spastic Paraplegia Type 4",
    "existing_anchors": [
      {
        "hpo_label": "Spastic paraplegia",
        "match_texts": [
          "progressive spastic paraplegia"
        ]
      }
    ],
    "clinical_text": "Clinical Characteristics\n\nHereditary spastic paraplegia type 4 (SPG4) is the most common form of autosomal dominant hereditary spastic paraplegia. The onset is typically in the third or fourth decade, though pediatric onset has been reported.\n\nSuggestive Findings\n\nThe following findings suggest SPG4:\n\nProgressive lower limb spasticity\nUrinary urgency and frequency\nMild distal sensory loss in the lower limbs\nPes cavus\n\nView in own window\n\nTable 1. Select Features of SPG4\n\nNeurologic examination reveals hyperreflexia and extensor plantar responses (Babinski sign). Vibratory sensation is reduced at the ankles. Cognitive function is preserved. SPAST pathogenic variants are identified by sequence analysis in the majority of cases.",
    "expectedNewCandidates": [
      {
        "label": "urinary urgency",
        "status": "present"
      },
      {
        "label": "distal sensory loss",
        "status": "present"
      },
      {
        "label": "pes cavus",
        "status": "present"
      },
      {
        "label": "hyperreflexia",
        "status": "present"
      },
      {
        "label": "extensor plantar responses",
        "status": "present"
      },
      {
        "label": "reduced vibratory sensation",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Spastic paraplegia",
        "reason": "already_in_anchors"
      },
      {
        "label": "Hereditary spastic paraplegia type 4",
        "reason": "not_a_phenotype"
      },
      {
        "label": "SPG4",
        "reason": "not_a_phenotype"
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
        "label": "cognitive function",
        "reason": "normal_or_preserved"
      },
      {
        "label": "SPAST",
        "reason": "gene_or_variant"
      },
      {
        "label": "autosomal dominant",
        "reason": "not_a_phenotype"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "Babinski sign",
        "status": "present"
      },
      {
        "label": "urinary frequency",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Hereditary Spastic Paraplegia Type 4",
      "clinical_text": "Clinical Characteristics\n\nHereditary spastic paraplegia type 4 (SPG4) is the most common form of autosomal dominant hereditary spastic paraplegia. The onset is typically in the third or fourth decade, though pediatric onset has been reported.\n\nSuggestive Findings\n\nThe following findings suggest SPG4:\n\nProgressive lower limb spasticity\nUrinary urgency and frequency\nMild distal sensory loss in the lower limbs\nPes cavus\n\nView in own window\n\nTable 1. Select Features of SPG4\n\nNeurologic examination reveals hyperreflexia and extensor plantar responses (Babinski sign). Vibratory sensation is reduced at the ankles. Cognitive function is preserved. SPAST pathogenic variants are identified by sequence analysis in the majority of cases.",
      "paragraph_count": 8,
      "sentence_count": 13,
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
          "text": "Hereditary spastic paraplegia type 4 (SPG4) is the most common form of autosomal dominant hereditary spastic paraplegia. The onset is typically in the third or fourth decade, though pediatric onset has been reported.",
          "char_start": 26,
          "char_end": 242,
          "sentences": [
            {
              "sentence_id": "p2_s1",
              "sentence_index": 1,
              "text": "Hereditary spastic paraplegia type 4 (SPG4) is the most common form of autosomal dominant hereditary spastic paraplegia.",
              "char_start": 26,
              "char_end": 146
            },
            {
              "sentence_id": "p2_s2",
              "sentence_index": 2,
              "text": "The onset is typically in the third or fourth decade, though pediatric onset has been reported.",
              "char_start": 147,
              "char_end": 242
            }
          ]
        },
        {
          "paragraph_id": "p3",
          "paragraph_index": 3,
          "text": "Suggestive Findings",
          "char_start": 244,
          "char_end": 263,
          "sentences": [
            {
              "sentence_id": "p3_s1",
              "sentence_index": 1,
              "text": "Suggestive Findings",
              "char_start": 244,
              "char_end": 263
            }
          ]
        },
        {
          "paragraph_id": "p4",
          "paragraph_index": 4,
          "text": "The following findings suggest SPG4:",
          "char_start": 265,
          "char_end": 301,
          "sentences": [
            {
              "sentence_id": "p4_s1",
              "sentence_index": 1,
              "text": "The following findings suggest SPG4:",
              "char_start": 265,
              "char_end": 301
            }
          ]
        },
        {
          "paragraph_id": "p5",
          "paragraph_index": 5,
          "text": "Progressive lower limb spasticity\nUrinary urgency and frequency\nMild distal sensory loss in the lower limbs\nPes cavus",
          "char_start": 303,
          "char_end": 420,
          "sentences": [
            {
              "sentence_id": "p5_s1",
              "sentence_index": 1,
              "text": "Progressive lower limb spasticity\nUrinary urgency and frequency\nMild distal sensory loss in the lower limbs\nPes cavus",
              "char_start": 303,
              "char_end": 420
            }
          ]
        },
        {
          "paragraph_id": "p6",
          "paragraph_index": 6,
          "text": "View in own window",
          "char_start": 422,
          "char_end": 440,
          "sentences": [
            {
              "sentence_id": "p6_s1",
              "sentence_index": 1,
              "text": "View in own window",
              "char_start": 422,
              "char_end": 440
            }
          ]
        },
        {
          "paragraph_id": "p7",
          "paragraph_index": 7,
          "text": "Table 1. Select Features of SPG4",
          "char_start": 442,
          "char_end": 474,
          "sentences": [
            {
              "sentence_id": "p7_s1",
              "sentence_index": 1,
              "text": "Table 1.",
              "char_start": 442,
              "char_end": 450
            },
            {
              "sentence_id": "p7_s2",
              "sentence_index": 2,
              "text": "Select Features of SPG4",
              "char_start": 451,
              "char_end": 474
            }
          ]
        },
        {
          "paragraph_id": "p8",
          "paragraph_index": 8,
          "text": "Neurologic examination reveals hyperreflexia and extensor plantar responses (Babinski sign). Vibratory sensation is reduced at the ankles. Cognitive function is preserved. SPAST pathogenic variants are identified by sequence analysis in the majority of cases.",
          "char_start": 476,
          "char_end": 735,
          "sentences": [
            {
              "sentence_id": "p8_s1",
              "sentence_index": 1,
              "text": "Neurologic examination reveals hyperreflexia and extensor plantar responses (Babinski sign).",
              "char_start": 476,
              "char_end": 568
            },
            {
              "sentence_id": "p8_s2",
              "sentence_index": 2,
              "text": "Vibratory sensation is reduced at the ankles.",
              "char_start": 569,
              "char_end": 614
            },
            {
              "sentence_id": "p8_s3",
              "sentence_index": 3,
              "text": "Cognitive function is preserved.",
              "char_start": 615,
              "char_end": 647
            },
            {
              "sentence_id": "p8_s4",
              "sentence_index": 4,
              "text": "SPAST pathogenic variants are identified by sequence analysis in the majority of cases.",
              "char_start": 648,
              "char_end": 735
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
          "text": "Hereditary spastic paraplegia type 4 (SPG4) is the most common form of autosomal dominant hereditary spastic paraplegia.",
          "char_start": 26,
          "char_end": 146
        },
        {
          "paragraph_id": "p2",
          "sentence_id": "p2_s2",
          "sentence_index": 2,
          "text": "The onset is typically in the third or fourth decade, though pediatric onset has been reported.",
          "char_start": 147,
          "char_end": 242
        },
        {
          "paragraph_id": "p3",
          "sentence_id": "p3_s1",
          "sentence_index": 1,
          "text": "Suggestive Findings",
          "char_start": 244,
          "char_end": 263
        },
        {
          "paragraph_id": "p4",
          "sentence_id": "p4_s1",
          "sentence_index": 1,
          "text": "The following findings suggest SPG4:",
          "char_start": 265,
          "char_end": 301
        },
        {
          "paragraph_id": "p5",
          "sentence_id": "p5_s1",
          "sentence_index": 1,
          "text": "Progressive lower limb spasticity\nUrinary urgency and frequency\nMild distal sensory loss in the lower limbs\nPes cavus",
          "char_start": 303,
          "char_end": 420
        },
        {
          "paragraph_id": "p6",
          "sentence_id": "p6_s1",
          "sentence_index": 1,
          "text": "View in own window",
          "char_start": 422,
          "char_end": 440
        },
        {
          "paragraph_id": "p7",
          "sentence_id": "p7_s1",
          "sentence_index": 1,
          "text": "Table 1.",
          "char_start": 442,
          "char_end": 450
        },
        {
          "paragraph_id": "p7",
          "sentence_id": "p7_s2",
          "sentence_index": 2,
          "text": "Select Features of SPG4",
          "char_start": 451,
          "char_end": 474
        },
        {
          "paragraph_id": "p8",
          "sentence_id": "p8_s1",
          "sentence_index": 1,
          "text": "Neurologic examination reveals hyperreflexia and extensor plantar responses (Babinski sign).",
          "char_start": 476,
          "char_end": 568
        },
        {
          "paragraph_id": "p8",
          "sentence_id": "p8_s2",
          "sentence_index": 2,
          "text": "Vibratory sensation is reduced at the ankles.",
          "char_start": 569,
          "char_end": 614
        },
        {
          "paragraph_id": "p8",
          "sentence_id": "p8_s3",
          "sentence_index": 3,
          "text": "Cognitive function is preserved.",
          "char_start": 615,
          "char_end": 647
        },
        {
          "paragraph_id": "p8",
          "sentence_id": "p8_s4",
          "sentence_index": 4,
          "text": "SPAST pathogenic variants are identified by sequence analysis in the majority of cases.",
          "char_start": 648,
          "char_end": 735
        }
      ]
    }
  },
  {
    "id": "disc-055",
    "chapter_title": "Mucopolysaccharidosis Type I (Hurler Syndrome)",
    "existing_anchors": [
      {
        "hpo_label": "Hepatosplenomegaly",
        "match_texts": [
          "hepatosplenomegaly"
        ]
      },
      {
        "hpo_label": "Dysostosis multiplex",
        "match_texts": [
          "dysostosis multiplex"
        ]
      }
    ],
    "clinical_text": "Progressive intellectual decline begins after an initial period of normal development. Corneal clouding is present in virtually all individuals. Coarse facial features with a broad nose, thick lips, frontal bossing, and macroglossia develop progressively. Recurrent upper respiratory infections and chronic otitis media are common. Cardiac valve thickening, particularly mitral and aortic valve disease, occurs. Inguinal and umbilical hernias are frequently the earliest clinical sign. Joint contractures with claw hand deformity develop. Carpal tunnel syndrome results from glycosaminoglycan deposition. Communicating hydrocephalus may develop. Elevated urinary glycosaminoglycans and deficient alpha-L-iduronidase enzyme activity are diagnostic. Hematopoietic stem cell transplantation and enzyme replacement therapy with laronidase are available treatments.",
    "expectedNewCandidates": [
      {
        "label": "intellectual decline",
        "status": "present"
      },
      {
        "label": "corneal clouding",
        "status": "present"
      },
      {
        "label": "coarse facial features",
        "status": "present"
      },
      {
        "label": "broad nose",
        "status": "present"
      },
      {
        "label": "thick lips",
        "status": "present"
      },
      {
        "label": "frontal bossing",
        "status": "present"
      },
      {
        "label": "macroglossia",
        "status": "present"
      },
      {
        "label": "recurrent upper respiratory infections",
        "status": "present"
      },
      {
        "label": "chronic otitis media",
        "status": "present"
      },
      {
        "label": "cardiac valve thickening",
        "status": "present"
      },
      {
        "label": "inguinal hernia",
        "status": "present"
      },
      {
        "label": "umbilical hernia",
        "status": "present"
      },
      {
        "label": "joint contractures",
        "status": "present"
      },
      {
        "label": "carpal tunnel syndrome",
        "status": "present"
      },
      {
        "label": "hydrocephalus",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Hepatosplenomegaly",
        "reason": "already_in_anchors"
      },
      {
        "label": "Dysostosis multiplex",
        "reason": "already_in_anchors"
      },
      {
        "label": "urinary glycosaminoglycans",
        "reason": "lab_or_test_method"
      },
      {
        "label": "alpha-L-iduronidase",
        "reason": "lab_or_test_method"
      },
      {
        "label": "laronidase",
        "reason": "treatment_or_management"
      },
      {
        "label": "hematopoietic stem cell transplantation",
        "reason": "treatment_or_management"
      },
      {
        "label": "enzyme replacement therapy",
        "reason": "treatment_or_management"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "claw hand deformity",
        "status": "present"
      },
      {
        "label": "mitral valve disease",
        "status": "present"
      },
      {
        "label": "aortic valve disease",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Mucopolysaccharidosis Type I (Hurler Syndrome)",
      "clinical_text": "Progressive intellectual decline begins after an initial period of normal development. Corneal clouding is present in virtually all individuals. Coarse facial features with a broad nose, thick lips, frontal bossing, and macroglossia develop progressively. Recurrent upper respiratory infections and chronic otitis media are common. Cardiac valve thickening, particularly mitral and aortic valve disease, occurs. Inguinal and umbilical hernias are frequently the earliest clinical sign. Joint contractures with claw hand deformity develop. Carpal tunnel syndrome results from glycosaminoglycan deposition. Communicating hydrocephalus may develop. Elevated urinary glycosaminoglycans and deficient alpha-L-iduronidase enzyme activity are diagnostic. Hematopoietic stem cell transplantation and enzyme replacement therapy with laronidase are available treatments.",
      "paragraph_count": 1,
      "sentence_count": 11,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Progressive intellectual decline begins after an initial period of normal development. Corneal clouding is present in virtually all individuals. Coarse facial features with a broad nose, thick lips, frontal bossing, and macroglossia develop progressively. Recurrent upper respiratory infections and chronic otitis media are common. Cardiac valve thickening, particularly mitral and aortic valve disease, occurs. Inguinal and umbilical hernias are frequently the earliest clinical sign. Joint contractures with claw hand deformity develop. Carpal tunnel syndrome results from glycosaminoglycan deposition. Communicating hydrocephalus may develop. Elevated urinary glycosaminoglycans and deficient alpha-L-iduronidase enzyme activity are diagnostic. Hematopoietic stem cell transplantation and enzyme replacement therapy with laronidase are available treatments.",
          "char_start": 0,
          "char_end": 860,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Progressive intellectual decline begins after an initial period of normal development.",
              "char_start": 0,
              "char_end": 86
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Corneal clouding is present in virtually all individuals.",
              "char_start": 87,
              "char_end": 144
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Coarse facial features with a broad nose, thick lips, frontal bossing, and macroglossia develop progressively.",
              "char_start": 145,
              "char_end": 255
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Recurrent upper respiratory infections and chronic otitis media are common.",
              "char_start": 256,
              "char_end": 331
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Cardiac valve thickening, particularly mitral and aortic valve disease, occurs.",
              "char_start": 332,
              "char_end": 411
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Inguinal and umbilical hernias are frequently the earliest clinical sign.",
              "char_start": 412,
              "char_end": 485
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Joint contractures with claw hand deformity develop.",
              "char_start": 486,
              "char_end": 538
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Carpal tunnel syndrome results from glycosaminoglycan deposition.",
              "char_start": 539,
              "char_end": 604
            },
            {
              "sentence_id": "p1_s9",
              "sentence_index": 9,
              "text": "Communicating hydrocephalus may develop.",
              "char_start": 605,
              "char_end": 645
            },
            {
              "sentence_id": "p1_s10",
              "sentence_index": 10,
              "text": "Elevated urinary glycosaminoglycans and deficient alpha-L-iduronidase enzyme activity are diagnostic.",
              "char_start": 646,
              "char_end": 747
            },
            {
              "sentence_id": "p1_s11",
              "sentence_index": 11,
              "text": "Hematopoietic stem cell transplantation and enzyme replacement therapy with laronidase are available treatments.",
              "char_start": 748,
              "char_end": 860
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Progressive intellectual decline begins after an initial period of normal development.",
          "char_start": 0,
          "char_end": 86
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Corneal clouding is present in virtually all individuals.",
          "char_start": 87,
          "char_end": 144
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Coarse facial features with a broad nose, thick lips, frontal bossing, and macroglossia develop progressively.",
          "char_start": 145,
          "char_end": 255
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Recurrent upper respiratory infections and chronic otitis media are common.",
          "char_start": 256,
          "char_end": 331
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Cardiac valve thickening, particularly mitral and aortic valve disease, occurs.",
          "char_start": 332,
          "char_end": 411
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Inguinal and umbilical hernias are frequently the earliest clinical sign.",
          "char_start": 412,
          "char_end": 485
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Joint contractures with claw hand deformity develop.",
          "char_start": 486,
          "char_end": 538
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Carpal tunnel syndrome results from glycosaminoglycan deposition.",
          "char_start": 539,
          "char_end": 604
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s9",
          "sentence_index": 9,
          "text": "Communicating hydrocephalus may develop.",
          "char_start": 605,
          "char_end": 645
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s10",
          "sentence_index": 10,
          "text": "Elevated urinary glycosaminoglycans and deficient alpha-L-iduronidase enzyme activity are diagnostic.",
          "char_start": 646,
          "char_end": 747
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s11",
          "sentence_index": 11,
          "text": "Hematopoietic stem cell transplantation and enzyme replacement therapy with laronidase are available treatments.",
          "char_start": 748,
          "char_end": 860
        }
      ]
    }
  },
  {
    "id": "disc-065",
    "chapter_title": "Spinocerebellar Ataxia Type 3 (Machado-Joseph Disease)",
    "existing_anchors": [
      {
        "hpo_label": "Ataxia",
        "match_texts": [
          "progressive cerebellar ataxia"
        ]
      }
    ],
    "clinical_text": "Spinocerebellar ataxia type 3 (SCA3), also known as Machado-Joseph disease, is the most common autosomal dominant ataxia worldwide. The phenotypic spectrum is highly variable even within families. External ophthalmoplegia and nystagmus are common eye findings. Dystonia, particularly of the face and limbs, is prominent in some individuals. Spasticity of the lower limbs may be the presenting feature. Peripheral neuropathy with fasciculations and muscle atrophy develops in some. Dysarthria and dysphagia become significant as the disease advances. Restless legs syndrome and excessive daytime sleepiness are underrecognized. Cognitive function is generally preserved until late stages, though executive dysfunction is documented. ATXN3 CAG repeat expansion is diagnostic.",
    "expectedNewCandidates": [
      {
        "label": "external ophthalmoplegia",
        "status": "present"
      },
      {
        "label": "nystagmus",
        "status": "present"
      },
      {
        "label": "dystonia",
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
        "label": "fasciculations",
        "status": "present"
      },
      {
        "label": "muscle atrophy",
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
        "label": "restless legs syndrome",
        "status": "present"
      },
      {
        "label": "excessive daytime sleepiness",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Ataxia",
        "reason": "already_in_anchors"
      },
      {
        "label": "Spinocerebellar ataxia type 3",
        "reason": "not_a_phenotype"
      },
      {
        "label": "SCA3",
        "reason": "not_a_phenotype"
      },
      {
        "label": "Machado-Joseph disease",
        "reason": "not_a_phenotype"
      },
      {
        "label": "ATXN3",
        "reason": "gene_or_variant"
      },
      {
        "label": "CAG repeat",
        "reason": "gene_or_variant"
      },
      {
        "label": "autosomal dominant",
        "reason": "not_a_phenotype"
      },
      {
        "label": "cognitive function",
        "reason": "normal_or_preserved"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "executive dysfunction",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Spinocerebellar Ataxia Type 3 (Machado-Joseph Disease)",
      "clinical_text": "Spinocerebellar ataxia type 3 (SCA3), also known as Machado-Joseph disease, is the most common autosomal dominant ataxia worldwide. The phenotypic spectrum is highly variable even within families. External ophthalmoplegia and nystagmus are common eye findings. Dystonia, particularly of the face and limbs, is prominent in some individuals. Spasticity of the lower limbs may be the presenting feature. Peripheral neuropathy with fasciculations and muscle atrophy develops in some. Dysarthria and dysphagia become significant as the disease advances. Restless legs syndrome and excessive daytime sleepiness are underrecognized. Cognitive function is generally preserved until late stages, though executive dysfunction is documented. ATXN3 CAG repeat expansion is diagnostic.",
      "paragraph_count": 1,
      "sentence_count": 10,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Spinocerebellar ataxia type 3 (SCA3), also known as Machado-Joseph disease, is the most common autosomal dominant ataxia worldwide. The phenotypic spectrum is highly variable even within families. External ophthalmoplegia and nystagmus are common eye findings. Dystonia, particularly of the face and limbs, is prominent in some individuals. Spasticity of the lower limbs may be the presenting feature. Peripheral neuropathy with fasciculations and muscle atrophy develops in some. Dysarthria and dysphagia become significant as the disease advances. Restless legs syndrome and excessive daytime sleepiness are underrecognized. Cognitive function is generally preserved until late stages, though executive dysfunction is documented. ATXN3 CAG repeat expansion is diagnostic.",
          "char_start": 0,
          "char_end": 773,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Spinocerebellar ataxia type 3 (SCA3), also known as Machado-Joseph disease, is the most common autosomal dominant ataxia worldwide.",
              "char_start": 0,
              "char_end": 131
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "The phenotypic spectrum is highly variable even within families.",
              "char_start": 132,
              "char_end": 196
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "External ophthalmoplegia and nystagmus are common eye findings.",
              "char_start": 197,
              "char_end": 260
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Dystonia, particularly of the face and limbs, is prominent in some individuals.",
              "char_start": 261,
              "char_end": 340
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Spasticity of the lower limbs may be the presenting feature.",
              "char_start": 341,
              "char_end": 401
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Peripheral neuropathy with fasciculations and muscle atrophy develops in some.",
              "char_start": 402,
              "char_end": 480
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Dysarthria and dysphagia become significant as the disease advances.",
              "char_start": 481,
              "char_end": 549
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Restless legs syndrome and excessive daytime sleepiness are underrecognized.",
              "char_start": 550,
              "char_end": 626
            },
            {
              "sentence_id": "p1_s9",
              "sentence_index": 9,
              "text": "Cognitive function is generally preserved until late stages, though executive dysfunction is documented.",
              "char_start": 627,
              "char_end": 731
            },
            {
              "sentence_id": "p1_s10",
              "sentence_index": 10,
              "text": "ATXN3 CAG repeat expansion is diagnostic.",
              "char_start": 732,
              "char_end": 773
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Spinocerebellar ataxia type 3 (SCA3), also known as Machado-Joseph disease, is the most common autosomal dominant ataxia worldwide.",
          "char_start": 0,
          "char_end": 131
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "The phenotypic spectrum is highly variable even within families.",
          "char_start": 132,
          "char_end": 196
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "External ophthalmoplegia and nystagmus are common eye findings.",
          "char_start": 197,
          "char_end": 260
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Dystonia, particularly of the face and limbs, is prominent in some individuals.",
          "char_start": 261,
          "char_end": 340
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Spasticity of the lower limbs may be the presenting feature.",
          "char_start": 341,
          "char_end": 401
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Peripheral neuropathy with fasciculations and muscle atrophy develops in some.",
          "char_start": 402,
          "char_end": 480
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Dysarthria and dysphagia become significant as the disease advances.",
          "char_start": 481,
          "char_end": 549
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Restless legs syndrome and excessive daytime sleepiness are underrecognized.",
          "char_start": 550,
          "char_end": 626
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s9",
          "sentence_index": 9,
          "text": "Cognitive function is generally preserved until late stages, though executive dysfunction is documented.",
          "char_start": 627,
          "char_end": 731
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s10",
          "sentence_index": 10,
          "text": "ATXN3 CAG repeat expansion is diagnostic.",
          "char_start": 732,
          "char_end": 773
        }
      ]
    }
  },
  {
    "id": "disc-066",
    "chapter_title": "SATB2-Associated Syndrome",
    "existing_anchors": [
      {
        "hpo_label": "Intellectual disability",
        "match_texts": [
          "intellectual disability"
        ]
      },
      {
        "hpo_label": "Cleft palate",
        "match_texts": [
          "cleft palate",
          "submucous cleft palate"
        ]
      }
    ],
    "clinical_text": "Absent or severely limited speech is the single most defining feature; virtually all reported individuals older than age 3 years have fewer than 50 functional words, and many rely exclusively on nonverbal communication. Behavioral features include a jovial, friendly disposition similar to Angelman syndrome, along with teeth grinding (bruxism), and intermittent aggression or self-injury. Dental anomalies such as crowded teeth, malocclusion, and delayed eruption are nearly universal. Osteopenia or osteoporosis is common and may predispose to pathologic fractures. Feeding difficulties with dysphagia are present in a majority during infancy. Drooling persists beyond the expected age. Seizures have been reported in approximately 25%. Sleep disturbance has been described but not systematically studied. Growth and head circumference are typically within the normal range.",
    "expectedNewCandidates": [
      {
        "label": "absent speech",
        "status": "present"
      },
      {
        "label": "bruxism",
        "status": "present"
      },
      {
        "label": "aggression",
        "status": "present"
      },
      {
        "label": "self-injurious behavior",
        "status": "present"
      },
      {
        "label": "dental anomalies",
        "status": "present"
      },
      {
        "label": "osteopenia",
        "status": "present"
      },
      {
        "label": "feeding difficulties",
        "status": "present"
      },
      {
        "label": "dysphagia",
        "status": "present"
      },
      {
        "label": "drooling",
        "status": "present"
      },
      {
        "label": "seizures",
        "status": "present"
      },
      {
        "label": "sleep disturbance",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Intellectual disability",
        "reason": "already_in_anchors"
      },
      {
        "label": "Cleft palate",
        "reason": "already_in_anchors"
      },
      {
        "label": "growth",
        "reason": "normal_or_preserved"
      },
      {
        "label": "head circumference",
        "reason": "normal_or_preserved"
      },
      {
        "label": "Angelman syndrome",
        "reason": "not_a_phenotype"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "friendly disposition",
        "status": "present"
      },
      {
        "label": "malocclusion",
        "status": "present"
      },
      {
        "label": "osteoporosis",
        "status": "present"
      },
      {
        "label": "pathologic fractures",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "SATB2-Associated Syndrome",
      "clinical_text": "Absent or severely limited speech is the single most defining feature; virtually all reported individuals older than age 3 years have fewer than 50 functional words, and many rely exclusively on nonverbal communication. Behavioral features include a jovial, friendly disposition similar to Angelman syndrome, along with teeth grinding (bruxism), and intermittent aggression or self-injury. Dental anomalies such as crowded teeth, malocclusion, and delayed eruption are nearly universal. Osteopenia or osteoporosis is common and may predispose to pathologic fractures. Feeding difficulties with dysphagia are present in a majority during infancy. Drooling persists beyond the expected age. Seizures have been reported in approximately 25%. Sleep disturbance has been described but not systematically studied. Growth and head circumference are typically within the normal range.",
      "paragraph_count": 1,
      "sentence_count": 9,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Absent or severely limited speech is the single most defining feature; virtually all reported individuals older than age 3 years have fewer than 50 functional words, and many rely exclusively on nonverbal communication. Behavioral features include a jovial, friendly disposition similar to Angelman syndrome, along with teeth grinding (bruxism), and intermittent aggression or self-injury. Dental anomalies such as crowded teeth, malocclusion, and delayed eruption are nearly universal. Osteopenia or osteoporosis is common and may predispose to pathologic fractures. Feeding difficulties with dysphagia are present in a majority during infancy. Drooling persists beyond the expected age. Seizures have been reported in approximately 25%. Sleep disturbance has been described but not systematically studied. Growth and head circumference are typically within the normal range.",
          "char_start": 0,
          "char_end": 876,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Absent or severely limited speech is the single most defining feature; virtually all reported individuals older than age 3 years have fewer than 50 functional words, and many rely exclusively on nonverbal communication.",
              "char_start": 0,
              "char_end": 219
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Behavioral features include a jovial, friendly disposition similar to Angelman syndrome, along with teeth grinding (bruxism), and intermittent aggression or self-injury.",
              "char_start": 220,
              "char_end": 389
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Dental anomalies such as crowded teeth, malocclusion, and delayed eruption are nearly universal.",
              "char_start": 390,
              "char_end": 486
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Osteopenia or osteoporosis is common and may predispose to pathologic fractures.",
              "char_start": 487,
              "char_end": 567
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Feeding difficulties with dysphagia are present in a majority during infancy.",
              "char_start": 568,
              "char_end": 645
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Drooling persists beyond the expected age.",
              "char_start": 646,
              "char_end": 688
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Seizures have been reported in approximately 25%.",
              "char_start": 689,
              "char_end": 738
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Sleep disturbance has been described but not systematically studied.",
              "char_start": 739,
              "char_end": 807
            },
            {
              "sentence_id": "p1_s9",
              "sentence_index": 9,
              "text": "Growth and head circumference are typically within the normal range.",
              "char_start": 808,
              "char_end": 876
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Absent or severely limited speech is the single most defining feature; virtually all reported individuals older than age 3 years have fewer than 50 functional words, and many rely exclusively on nonverbal communication.",
          "char_start": 0,
          "char_end": 219
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Behavioral features include a jovial, friendly disposition similar to Angelman syndrome, along with teeth grinding (bruxism), and intermittent aggression or self-injury.",
          "char_start": 220,
          "char_end": 389
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Dental anomalies such as crowded teeth, malocclusion, and delayed eruption are nearly universal.",
          "char_start": 390,
          "char_end": 486
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Osteopenia or osteoporosis is common and may predispose to pathologic fractures.",
          "char_start": 487,
          "char_end": 567
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Feeding difficulties with dysphagia are present in a majority during infancy.",
          "char_start": 568,
          "char_end": 645
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Drooling persists beyond the expected age.",
          "char_start": 646,
          "char_end": 688
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Seizures have been reported in approximately 25%.",
          "char_start": 689,
          "char_end": 738
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Sleep disturbance has been described but not systematically studied.",
          "char_start": 739,
          "char_end": 807
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s9",
          "sentence_index": 9,
          "text": "Growth and head circumference are typically within the normal range.",
          "char_start": 808,
          "char_end": 876
        }
      ]
    }
  },
  {
    "id": "disc-067",
    "chapter_title": "Dravet Syndrome",
    "existing_anchors": [
      {
        "hpo_label": "Seizure",
        "match_texts": [
          "seizures",
          "febrile seizures",
          "intractable epilepsy"
        ]
      }
    ],
    "clinical_text": "Initial development is normal until the onset of prolonged febrile and afebrile convulsions in the first year of life. Developmental stagnation and subsequent regression become apparent in the second year. Ataxia and crouched gait develop. Myoclonus may be present. Status epilepticus is frequent and a major source of morbidity. Sudden unexpected death in epilepsy (SUDEP) is a significant cause of mortality. Dysautonomia manifesting as temperature dysregulation, excessive sweating, and orthostatic intolerance has been described. SCN1A pathogenic variants are identified in over 80% of individuals. Sodium channel blockers such as carbamazepine and phenytoin are contraindicated as they may exacerbate seizures. Stiripentol, clobazam, and valproic acid are recommended first-line therapies.",
    "expectedNewCandidates": [
      {
        "label": "developmental regression",
        "status": "present"
      },
      {
        "label": "ataxia",
        "status": "present"
      },
      {
        "label": "crouched gait",
        "status": "present"
      },
      {
        "label": "myoclonus",
        "status": "present"
      },
      {
        "label": "status epilepticus",
        "status": "present"
      },
      {
        "label": "dysautonomia",
        "status": "present"
      },
      {
        "label": "temperature dysregulation",
        "status": "present"
      },
      {
        "label": "excessive sweating",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Seizure",
        "reason": "already_in_anchors"
      },
      {
        "label": "Dravet Syndrome",
        "reason": "not_a_phenotype"
      },
      {
        "label": "SCN1A",
        "reason": "gene_or_variant"
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
        "label": "stiripentol",
        "reason": "treatment_or_management"
      },
      {
        "label": "clobazam",
        "reason": "treatment_or_management"
      },
      {
        "label": "valproic acid",
        "reason": "treatment_or_management"
      },
      {
        "label": "SUDEP",
        "reason": "not_a_phenotype"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "developmental stagnation",
        "status": "present"
      },
      {
        "label": "orthostatic intolerance",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Dravet Syndrome",
      "clinical_text": "Initial development is normal until the onset of prolonged febrile and afebrile convulsions in the first year of life. Developmental stagnation and subsequent regression become apparent in the second year. Ataxia and crouched gait develop. Myoclonus may be present. Status epilepticus is frequent and a major source of morbidity. Sudden unexpected death in epilepsy (SUDEP) is a significant cause of mortality. Dysautonomia manifesting as temperature dysregulation, excessive sweating, and orthostatic intolerance has been described. SCN1A pathogenic variants are identified in over 80% of individuals. Sodium channel blockers such as carbamazepine and phenytoin are contraindicated as they may exacerbate seizures. Stiripentol, clobazam, and valproic acid are recommended first-line therapies.",
      "paragraph_count": 1,
      "sentence_count": 10,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Initial development is normal until the onset of prolonged febrile and afebrile convulsions in the first year of life. Developmental stagnation and subsequent regression become apparent in the second year. Ataxia and crouched gait develop. Myoclonus may be present. Status epilepticus is frequent and a major source of morbidity. Sudden unexpected death in epilepsy (SUDEP) is a significant cause of mortality. Dysautonomia manifesting as temperature dysregulation, excessive sweating, and orthostatic intolerance has been described. SCN1A pathogenic variants are identified in over 80% of individuals. Sodium channel blockers such as carbamazepine and phenytoin are contraindicated as they may exacerbate seizures. Stiripentol, clobazam, and valproic acid are recommended first-line therapies.",
          "char_start": 0,
          "char_end": 794,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Initial development is normal until the onset of prolonged febrile and afebrile convulsions in the first year of life.",
              "char_start": 0,
              "char_end": 118
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Developmental stagnation and subsequent regression become apparent in the second year.",
              "char_start": 119,
              "char_end": 205
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Ataxia and crouched gait develop.",
              "char_start": 206,
              "char_end": 239
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Myoclonus may be present.",
              "char_start": 240,
              "char_end": 265
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Status epilepticus is frequent and a major source of morbidity.",
              "char_start": 266,
              "char_end": 329
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Sudden unexpected death in epilepsy (SUDEP) is a significant cause of mortality.",
              "char_start": 330,
              "char_end": 410
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Dysautonomia manifesting as temperature dysregulation, excessive sweating, and orthostatic intolerance has been described.",
              "char_start": 411,
              "char_end": 533
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "SCN1A pathogenic variants are identified in over 80% of individuals.",
              "char_start": 534,
              "char_end": 602
            },
            {
              "sentence_id": "p1_s9",
              "sentence_index": 9,
              "text": "Sodium channel blockers such as carbamazepine and phenytoin are contraindicated as they may exacerbate seizures.",
              "char_start": 603,
              "char_end": 715
            },
            {
              "sentence_id": "p1_s10",
              "sentence_index": 10,
              "text": "Stiripentol, clobazam, and valproic acid are recommended first-line therapies.",
              "char_start": 716,
              "char_end": 794
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Initial development is normal until the onset of prolonged febrile and afebrile convulsions in the first year of life.",
          "char_start": 0,
          "char_end": 118
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Developmental stagnation and subsequent regression become apparent in the second year.",
          "char_start": 119,
          "char_end": 205
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Ataxia and crouched gait develop.",
          "char_start": 206,
          "char_end": 239
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Myoclonus may be present.",
          "char_start": 240,
          "char_end": 265
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Status epilepticus is frequent and a major source of morbidity.",
          "char_start": 266,
          "char_end": 329
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Sudden unexpected death in epilepsy (SUDEP) is a significant cause of mortality.",
          "char_start": 330,
          "char_end": 410
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Dysautonomia manifesting as temperature dysregulation, excessive sweating, and orthostatic intolerance has been described.",
          "char_start": 411,
          "char_end": 533
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "SCN1A pathogenic variants are identified in over 80% of individuals.",
          "char_start": 534,
          "char_end": 602
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s9",
          "sentence_index": 9,
          "text": "Sodium channel blockers such as carbamazepine and phenytoin are contraindicated as they may exacerbate seizures.",
          "char_start": 603,
          "char_end": 715
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s10",
          "sentence_index": 10,
          "text": "Stiripentol, clobazam, and valproic acid are recommended first-line therapies.",
          "char_start": 716,
          "char_end": 794
        }
      ]
    }
  },
  {
    "id": "disc-068",
    "chapter_title": "ZAP70-Related Combined Immunodeficiency",
    "existing_anchors": [
      {
        "hpo_label": "T-cell immunodeficiency",
        "match_texts": [
          "T-cell immunodeficiency",
          "selective CD8 T-cell deficiency"
        ]
      }
    ],
    "clinical_text": "Recurrent and severe infections beginning in early infancy are the cardinal manifestation. Pneumocystis jirovecii pneumonia, chronic diarrhea with failure to thrive, and persistent oral thrush are common presentations. Eczematous dermatitis resembling atopic dermatitis may be present. Lymphocyte subset analysis reveals markedly decreased CD8+ T cells with relatively preserved CD4+ T cell numbers. T-cell receptor excision circles (TRECs) may be low or normal on newborn screening. Hypogammaglobulinemia develops in some individuals. Autoimmune cytopenias including hemolytic anemia and thrombocytopenia are reported. ZAP70 biallelic pathogenic variants are causative. Hematopoietic stem cell transplantation is the only curative treatment. Without transplantation, most patients succumb to infection before age 2 years.",
    "expectedNewCandidates": [
      {
        "label": "recurrent severe infections",
        "status": "present"
      },
      {
        "label": "pneumonia",
        "status": "present"
      },
      {
        "label": "chronic diarrhea",
        "status": "present"
      },
      {
        "label": "failure to thrive",
        "status": "present"
      },
      {
        "label": "oral thrush",
        "status": "present"
      },
      {
        "label": "eczematous dermatitis",
        "status": "present"
      },
      {
        "label": "hypogammaglobulinemia",
        "status": "present"
      },
      {
        "label": "hemolytic anemia",
        "status": "present"
      },
      {
        "label": "thrombocytopenia",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "T-cell immunodeficiency",
        "reason": "already_in_anchors"
      },
      {
        "label": "CD8+ T cells",
        "reason": "lab_or_test_method"
      },
      {
        "label": "CD4+ T cell numbers",
        "reason": "lab_or_test_method"
      },
      {
        "label": "T-cell receptor excision circles",
        "reason": "lab_or_test_method"
      },
      {
        "label": "TRECs",
        "reason": "lab_or_test_method"
      },
      {
        "label": "lymphocyte subset analysis",
        "reason": "lab_or_test_method"
      },
      {
        "label": "newborn screening",
        "reason": "lab_or_test_method"
      },
      {
        "label": "ZAP70",
        "reason": "gene_or_variant"
      },
      {
        "label": "hematopoietic stem cell transplantation",
        "reason": "treatment_or_management"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "autoimmune cytopenias",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "ZAP70-Related Combined Immunodeficiency",
      "clinical_text": "Recurrent and severe infections beginning in early infancy are the cardinal manifestation. Pneumocystis jirovecii pneumonia, chronic diarrhea with failure to thrive, and persistent oral thrush are common presentations. Eczematous dermatitis resembling atopic dermatitis may be present. Lymphocyte subset analysis reveals markedly decreased CD8+ T cells with relatively preserved CD4+ T cell numbers. T-cell receptor excision circles (TRECs) may be low or normal on newborn screening. Hypogammaglobulinemia develops in some individuals. Autoimmune cytopenias including hemolytic anemia and thrombocytopenia are reported. ZAP70 biallelic pathogenic variants are causative. Hematopoietic stem cell transplantation is the only curative treatment. Without transplantation, most patients succumb to infection before age 2 years.",
      "paragraph_count": 1,
      "sentence_count": 10,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Recurrent and severe infections beginning in early infancy are the cardinal manifestation. Pneumocystis jirovecii pneumonia, chronic diarrhea with failure to thrive, and persistent oral thrush are common presentations. Eczematous dermatitis resembling atopic dermatitis may be present. Lymphocyte subset analysis reveals markedly decreased CD8+ T cells with relatively preserved CD4+ T cell numbers. T-cell receptor excision circles (TRECs) may be low or normal on newborn screening. Hypogammaglobulinemia develops in some individuals. Autoimmune cytopenias including hemolytic anemia and thrombocytopenia are reported. ZAP70 biallelic pathogenic variants are causative. Hematopoietic stem cell transplantation is the only curative treatment. Without transplantation, most patients succumb to infection before age 2 years.",
          "char_start": 0,
          "char_end": 822,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Recurrent and severe infections beginning in early infancy are the cardinal manifestation.",
              "char_start": 0,
              "char_end": 90
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Pneumocystis jirovecii pneumonia, chronic diarrhea with failure to thrive, and persistent oral thrush are common presentations.",
              "char_start": 91,
              "char_end": 218
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Eczematous dermatitis resembling atopic dermatitis may be present.",
              "char_start": 219,
              "char_end": 285
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Lymphocyte subset analysis reveals markedly decreased CD8+ T cells with relatively preserved CD4+ T cell numbers.",
              "char_start": 286,
              "char_end": 399
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "T-cell receptor excision circles (TRECs) may be low or normal on newborn screening.",
              "char_start": 400,
              "char_end": 483
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Hypogammaglobulinemia develops in some individuals.",
              "char_start": 484,
              "char_end": 535
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Autoimmune cytopenias including hemolytic anemia and thrombocytopenia are reported.",
              "char_start": 536,
              "char_end": 619
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "ZAP70 biallelic pathogenic variants are causative.",
              "char_start": 620,
              "char_end": 670
            },
            {
              "sentence_id": "p1_s9",
              "sentence_index": 9,
              "text": "Hematopoietic stem cell transplantation is the only curative treatment.",
              "char_start": 671,
              "char_end": 742
            },
            {
              "sentence_id": "p1_s10",
              "sentence_index": 10,
              "text": "Without transplantation, most patients succumb to infection before age 2 years.",
              "char_start": 743,
              "char_end": 822
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Recurrent and severe infections beginning in early infancy are the cardinal manifestation.",
          "char_start": 0,
          "char_end": 90
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Pneumocystis jirovecii pneumonia, chronic diarrhea with failure to thrive, and persistent oral thrush are common presentations.",
          "char_start": 91,
          "char_end": 218
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Eczematous dermatitis resembling atopic dermatitis may be present.",
          "char_start": 219,
          "char_end": 285
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Lymphocyte subset analysis reveals markedly decreased CD8+ T cells with relatively preserved CD4+ T cell numbers.",
          "char_start": 286,
          "char_end": 399
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "T-cell receptor excision circles (TRECs) may be low or normal on newborn screening.",
          "char_start": 400,
          "char_end": 483
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Hypogammaglobulinemia develops in some individuals.",
          "char_start": 484,
          "char_end": 535
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Autoimmune cytopenias including hemolytic anemia and thrombocytopenia are reported.",
          "char_start": 536,
          "char_end": 619
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "ZAP70 biallelic pathogenic variants are causative.",
          "char_start": 620,
          "char_end": 670
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s9",
          "sentence_index": 9,
          "text": "Hematopoietic stem cell transplantation is the only curative treatment.",
          "char_start": 671,
          "char_end": 742
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s10",
          "sentence_index": 10,
          "text": "Without transplantation, most patients succumb to infection before age 2 years.",
          "char_start": 743,
          "char_end": 822
        }
      ]
    }
  },
  {
    "id": "disc-069",
    "chapter_title": "PTEN Hamartoma Tumor Syndrome",
    "existing_anchors": [
      {
        "hpo_label": "Macrocephaly",
        "match_texts": [
          "macrocephaly"
        ]
      }
    ],
    "clinical_text": "Multiple hamartomatous polyps of the gastrointestinal tract are characteristic. Mucocutaneous features include trichilemmomas, acral keratoses, oral papillomas, and penile freckling. Thyroid disease including multinodular goiter, follicular adenoma, and thyroid carcinoma are common. There is a significantly elevated lifetime risk for breast cancer (85%), endometrial cancer (28%), and colorectal cancer (9%). Lipomas and vascular malformations may be present. Autism spectrum disorder and developmental delay occur in a proportion of individuals with germline PTEN variants, particularly in children presenting with macrocephaly. Adults may develop cerebellar dysplastic gangliocytoma (Lhermitte-Duclos disease). Breast MRI surveillance should begin at age 30 or 5 years before the earliest known family diagnosis.",
    "expectedNewCandidates": [
      {
        "label": "hamartomatous polyps",
        "status": "present"
      },
      {
        "label": "trichilemmomas",
        "status": "present"
      },
      {
        "label": "acral keratoses",
        "status": "present"
      },
      {
        "label": "oral papillomas",
        "status": "present"
      },
      {
        "label": "penile freckling",
        "status": "present"
      },
      {
        "label": "multinodular goiter",
        "status": "present"
      },
      {
        "label": "thyroid carcinoma",
        "status": "present"
      },
      {
        "label": "breast cancer",
        "status": "present"
      },
      {
        "label": "endometrial cancer",
        "status": "present"
      },
      {
        "label": "lipomas",
        "status": "present"
      },
      {
        "label": "vascular malformations",
        "status": "present"
      },
      {
        "label": "autism spectrum disorder",
        "status": "present"
      },
      {
        "label": "developmental delay",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Macrocephaly",
        "reason": "already_in_anchors"
      },
      {
        "label": "PTEN",
        "reason": "gene_or_variant"
      },
      {
        "label": "PTEN Hamartoma Tumor Syndrome",
        "reason": "not_a_phenotype"
      },
      {
        "label": "Lhermitte-Duclos disease",
        "reason": "not_a_phenotype"
      },
      {
        "label": "breast MRI",
        "reason": "lab_or_test_method"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "colorectal cancer",
        "status": "present"
      },
      {
        "label": "follicular adenoma",
        "status": "present"
      },
      {
        "label": "cerebellar dysplastic gangliocytoma",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "PTEN Hamartoma Tumor Syndrome",
      "clinical_text": "Multiple hamartomatous polyps of the gastrointestinal tract are characteristic. Mucocutaneous features include trichilemmomas, acral keratoses, oral papillomas, and penile freckling. Thyroid disease including multinodular goiter, follicular adenoma, and thyroid carcinoma are common. There is a significantly elevated lifetime risk for breast cancer (85%), endometrial cancer (28%), and colorectal cancer (9%). Lipomas and vascular malformations may be present. Autism spectrum disorder and developmental delay occur in a proportion of individuals with germline PTEN variants, particularly in children presenting with macrocephaly. Adults may develop cerebellar dysplastic gangliocytoma (Lhermitte-Duclos disease). Breast MRI surveillance should begin at age 30 or 5 years before the earliest known family diagnosis.",
      "paragraph_count": 1,
      "sentence_count": 8,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Multiple hamartomatous polyps of the gastrointestinal tract are characteristic. Mucocutaneous features include trichilemmomas, acral keratoses, oral papillomas, and penile freckling. Thyroid disease including multinodular goiter, follicular adenoma, and thyroid carcinoma are common. There is a significantly elevated lifetime risk for breast cancer (85%), endometrial cancer (28%), and colorectal cancer (9%). Lipomas and vascular malformations may be present. Autism spectrum disorder and developmental delay occur in a proportion of individuals with germline PTEN variants, particularly in children presenting with macrocephaly. Adults may develop cerebellar dysplastic gangliocytoma (Lhermitte-Duclos disease). Breast MRI surveillance should begin at age 30 or 5 years before the earliest known family diagnosis.",
          "char_start": 0,
          "char_end": 816,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Multiple hamartomatous polyps of the gastrointestinal tract are characteristic.",
              "char_start": 0,
              "char_end": 79
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Mucocutaneous features include trichilemmomas, acral keratoses, oral papillomas, and penile freckling.",
              "char_start": 80,
              "char_end": 182
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Thyroid disease including multinodular goiter, follicular adenoma, and thyroid carcinoma are common.",
              "char_start": 183,
              "char_end": 283
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "There is a significantly elevated lifetime risk for breast cancer (85%), endometrial cancer (28%), and colorectal cancer (9%).",
              "char_start": 284,
              "char_end": 410
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Lipomas and vascular malformations may be present.",
              "char_start": 411,
              "char_end": 461
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Autism spectrum disorder and developmental delay occur in a proportion of individuals with germline PTEN variants, particularly in children presenting with macrocephaly.",
              "char_start": 462,
              "char_end": 631
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Adults may develop cerebellar dysplastic gangliocytoma (Lhermitte-Duclos disease).",
              "char_start": 632,
              "char_end": 714
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Breast MRI surveillance should begin at age 30 or 5 years before the earliest known family diagnosis.",
              "char_start": 715,
              "char_end": 816
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Multiple hamartomatous polyps of the gastrointestinal tract are characteristic.",
          "char_start": 0,
          "char_end": 79
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Mucocutaneous features include trichilemmomas, acral keratoses, oral papillomas, and penile freckling.",
          "char_start": 80,
          "char_end": 182
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Thyroid disease including multinodular goiter, follicular adenoma, and thyroid carcinoma are common.",
          "char_start": 183,
          "char_end": 283
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "There is a significantly elevated lifetime risk for breast cancer (85%), endometrial cancer (28%), and colorectal cancer (9%).",
          "char_start": 284,
          "char_end": 410
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Lipomas and vascular malformations may be present.",
          "char_start": 411,
          "char_end": 461
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Autism spectrum disorder and developmental delay occur in a proportion of individuals with germline PTEN variants, particularly in children presenting with macrocephaly.",
          "char_start": 462,
          "char_end": 631
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Adults may develop cerebellar dysplastic gangliocytoma (Lhermitte-Duclos disease).",
          "char_start": 632,
          "char_end": 714
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Breast MRI surveillance should begin at age 30 or 5 years before the earliest known family diagnosis.",
          "char_start": 715,
          "char_end": 816
        }
      ]
    }
  },
  {
    "id": "disc-070",
    "chapter_title": "Coffin-Siris Syndrome",
    "existing_anchors": [
      {
        "hpo_label": "Intellectual disability",
        "match_texts": [
          "intellectual disability"
        ]
      },
      {
        "hpo_label": "Hypoplastic fifth fingernail",
        "match_texts": [
          "hypoplastic fifth fingernails",
          "hypoplastic nails"
        ]
      }
    ],
    "clinical_text": "Coarse facial features with a wide nose, thick lips, and bushy eyebrows develop over time. Hypertrichosis is common, particularly on the back and limbs. Feeding difficulties in infancy frequently require prolonged nasogastric or gastrostomy feeding. Growth deficiency with short stature is present in most. Sparse scalp hair is observed. Hypotonia in infancy is typical. Speech is delayed and may remain limited. Congenital heart defects occur in approximately 20%. Corpus callosum abnormalities are the most frequent brain MRI finding. Seizures have been reported in a minority. Hearing loss has been variably described. Vision is generally normal. ARID1B pathogenic variants are identified in the majority of cases.",
    "expectedNewCandidates": [
      {
        "label": "coarse facial features",
        "status": "present"
      },
      {
        "label": "wide nose",
        "status": "present"
      },
      {
        "label": "thick lips",
        "status": "present"
      },
      {
        "label": "bushy eyebrows",
        "status": "present"
      },
      {
        "label": "hypertrichosis",
        "status": "present"
      },
      {
        "label": "feeding difficulties",
        "status": "present"
      },
      {
        "label": "short stature",
        "status": "present"
      },
      {
        "label": "sparse scalp hair",
        "status": "present"
      },
      {
        "label": "hypotonia",
        "status": "present"
      },
      {
        "label": "speech delay",
        "status": "present"
      },
      {
        "label": "congenital heart defects",
        "status": "present"
      },
      {
        "label": "corpus callosum abnormalities",
        "status": "present"
      },
      {
        "label": "seizures",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Intellectual disability",
        "reason": "already_in_anchors"
      },
      {
        "label": "Hypoplastic fifth fingernail",
        "reason": "already_in_anchors"
      },
      {
        "label": "vision",
        "reason": "normal_or_preserved"
      },
      {
        "label": "ARID1B",
        "reason": "gene_or_variant"
      },
      {
        "label": "Brain MRI",
        "reason": "lab_or_test_method"
      },
      {
        "label": "gastrostomy",
        "reason": "treatment_or_management"
      },
      {
        "label": "nasogastric",
        "reason": "treatment_or_management"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "hearing loss",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Coffin-Siris Syndrome",
      "clinical_text": "Coarse facial features with a wide nose, thick lips, and bushy eyebrows develop over time. Hypertrichosis is common, particularly on the back and limbs. Feeding difficulties in infancy frequently require prolonged nasogastric or gastrostomy feeding. Growth deficiency with short stature is present in most. Sparse scalp hair is observed. Hypotonia in infancy is typical. Speech is delayed and may remain limited. Congenital heart defects occur in approximately 20%. Corpus callosum abnormalities are the most frequent brain MRI finding. Seizures have been reported in a minority. Hearing loss has been variably described. Vision is generally normal. ARID1B pathogenic variants are identified in the majority of cases.",
      "paragraph_count": 1,
      "sentence_count": 13,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Coarse facial features with a wide nose, thick lips, and bushy eyebrows develop over time. Hypertrichosis is common, particularly on the back and limbs. Feeding difficulties in infancy frequently require prolonged nasogastric or gastrostomy feeding. Growth deficiency with short stature is present in most. Sparse scalp hair is observed. Hypotonia in infancy is typical. Speech is delayed and may remain limited. Congenital heart defects occur in approximately 20%. Corpus callosum abnormalities are the most frequent brain MRI finding. Seizures have been reported in a minority. Hearing loss has been variably described. Vision is generally normal. ARID1B pathogenic variants are identified in the majority of cases.",
          "char_start": 0,
          "char_end": 717,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Coarse facial features with a wide nose, thick lips, and bushy eyebrows develop over time.",
              "char_start": 0,
              "char_end": 90
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Hypertrichosis is common, particularly on the back and limbs.",
              "char_start": 91,
              "char_end": 152
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Feeding difficulties in infancy frequently require prolonged nasogastric or gastrostomy feeding.",
              "char_start": 153,
              "char_end": 249
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Growth deficiency with short stature is present in most.",
              "char_start": 250,
              "char_end": 306
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Sparse scalp hair is observed.",
              "char_start": 307,
              "char_end": 337
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Hypotonia in infancy is typical.",
              "char_start": 338,
              "char_end": 370
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Speech is delayed and may remain limited.",
              "char_start": 371,
              "char_end": 412
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Congenital heart defects occur in approximately 20%.",
              "char_start": 413,
              "char_end": 465
            },
            {
              "sentence_id": "p1_s9",
              "sentence_index": 9,
              "text": "Corpus callosum abnormalities are the most frequent brain MRI finding.",
              "char_start": 466,
              "char_end": 536
            },
            {
              "sentence_id": "p1_s10",
              "sentence_index": 10,
              "text": "Seizures have been reported in a minority.",
              "char_start": 537,
              "char_end": 579
            },
            {
              "sentence_id": "p1_s11",
              "sentence_index": 11,
              "text": "Hearing loss has been variably described.",
              "char_start": 580,
              "char_end": 621
            },
            {
              "sentence_id": "p1_s12",
              "sentence_index": 12,
              "text": "Vision is generally normal.",
              "char_start": 622,
              "char_end": 649
            },
            {
              "sentence_id": "p1_s13",
              "sentence_index": 13,
              "text": "ARID1B pathogenic variants are identified in the majority of cases.",
              "char_start": 650,
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
          "text": "Coarse facial features with a wide nose, thick lips, and bushy eyebrows develop over time.",
          "char_start": 0,
          "char_end": 90
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Hypertrichosis is common, particularly on the back and limbs.",
          "char_start": 91,
          "char_end": 152
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Feeding difficulties in infancy frequently require prolonged nasogastric or gastrostomy feeding.",
          "char_start": 153,
          "char_end": 249
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Growth deficiency with short stature is present in most.",
          "char_start": 250,
          "char_end": 306
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Sparse scalp hair is observed.",
          "char_start": 307,
          "char_end": 337
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Hypotonia in infancy is typical.",
          "char_start": 338,
          "char_end": 370
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Speech is delayed and may remain limited.",
          "char_start": 371,
          "char_end": 412
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Congenital heart defects occur in approximately 20%.",
          "char_start": 413,
          "char_end": 465
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s9",
          "sentence_index": 9,
          "text": "Corpus callosum abnormalities are the most frequent brain MRI finding.",
          "char_start": 466,
          "char_end": 536
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s10",
          "sentence_index": 10,
          "text": "Seizures have been reported in a minority.",
          "char_start": 537,
          "char_end": 579
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s11",
          "sentence_index": 11,
          "text": "Hearing loss has been variably described.",
          "char_start": 580,
          "char_end": 621
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s12",
          "sentence_index": 12,
          "text": "Vision is generally normal.",
          "char_start": 622,
          "char_end": 649
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s13",
          "sentence_index": 13,
          "text": "ARID1B pathogenic variants are identified in the majority of cases.",
          "char_start": 650,
          "char_end": 717
        }
      ]
    }
  },
  {
    "id": "disc-077",
    "chapter_title": "Congenital Disorder of Glycosylation Type Ia",
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
    "clinical_text": "Inverted nipples and abnormal subcutaneous fat distribution (fat pads) are characteristic physical findings in infancy, but neither persists reliably into adulthood and their absence should not exclude the diagnosis in older patients. Cerebellar hypoplasia is present on MRI in essentially all individuals and is nonprogressive. Strabismus and abnormal eye movements are common. Hepatic involvement includes elevated transaminases, hepatomegaly, and protein-losing enteropathy. Pericardial effusion has been described. Coagulopathy due to both pro- and anticoagulant factor deficiencies creates a complex hemostatic picture. Stroke-like episodes may occur. Seizures develop in approximately one third. Peripheral neuropathy with absent reflexes is present. Isoelectric focusing of serum transferrin shows a type 1 pattern and is the initial screening test.",
    "expectedNewCandidates": [
      {
        "label": "inverted nipples",
        "status": "present"
      },
      {
        "label": "abnormal fat distribution",
        "status": "present"
      },
      {
        "label": "cerebellar hypoplasia",
        "status": "present"
      },
      {
        "label": "strabismus",
        "status": "present"
      },
      {
        "label": "abnormal eye movements",
        "status": "present"
      },
      {
        "label": "elevated transaminases",
        "status": "present"
      },
      {
        "label": "hepatomegaly",
        "status": "present"
      },
      {
        "label": "protein-losing enteropathy",
        "status": "present"
      },
      {
        "label": "pericardial effusion",
        "status": "present"
      },
      {
        "label": "coagulopathy",
        "status": "present"
      },
      {
        "label": "stroke-like episodes",
        "status": "present"
      },
      {
        "label": "seizures",
        "status": "present"
      },
      {
        "label": "peripheral neuropathy",
        "status": "present"
      },
      {
        "label": "absent reflexes",
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
        "label": "isoelectric focusing",
        "reason": "lab_or_test_method"
      },
      {
        "label": "serum transferrin",
        "reason": "lab_or_test_method"
      },
      {
        "label": "MRI",
        "reason": "lab_or_test_method"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "fat pads",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Congenital Disorder of Glycosylation Type Ia",
      "clinical_text": "Inverted nipples and abnormal subcutaneous fat distribution (fat pads) are characteristic physical findings in infancy, but neither persists reliably into adulthood and their absence should not exclude the diagnosis in older patients. Cerebellar hypoplasia is present on MRI in essentially all individuals and is nonprogressive. Strabismus and abnormal eye movements are common. Hepatic involvement includes elevated transaminases, hepatomegaly, and protein-losing enteropathy. Pericardial effusion has been described. Coagulopathy due to both pro- and anticoagulant factor deficiencies creates a complex hemostatic picture. Stroke-like episodes may occur. Seizures develop in approximately one third. Peripheral neuropathy with absent reflexes is present. Isoelectric focusing of serum transferrin shows a type 1 pattern and is the initial screening test.",
      "paragraph_count": 1,
      "sentence_count": 10,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Inverted nipples and abnormal subcutaneous fat distribution (fat pads) are characteristic physical findings in infancy, but neither persists reliably into adulthood and their absence should not exclude the diagnosis in older patients. Cerebellar hypoplasia is present on MRI in essentially all individuals and is nonprogressive. Strabismus and abnormal eye movements are common. Hepatic involvement includes elevated transaminases, hepatomegaly, and protein-losing enteropathy. Pericardial effusion has been described. Coagulopathy due to both pro- and anticoagulant factor deficiencies creates a complex hemostatic picture. Stroke-like episodes may occur. Seizures develop in approximately one third. Peripheral neuropathy with absent reflexes is present. Isoelectric focusing of serum transferrin shows a type 1 pattern and is the initial screening test.",
          "char_start": 0,
          "char_end": 856,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Inverted nipples and abnormal subcutaneous fat distribution (fat pads) are characteristic physical findings in infancy, but neither persists reliably into adulthood and their absence should not exclude the diagnosis in older patients.",
              "char_start": 0,
              "char_end": 234
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Cerebellar hypoplasia is present on MRI in essentially all individuals and is nonprogressive.",
              "char_start": 235,
              "char_end": 328
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Strabismus and abnormal eye movements are common.",
              "char_start": 329,
              "char_end": 378
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Hepatic involvement includes elevated transaminases, hepatomegaly, and protein-losing enteropathy.",
              "char_start": 379,
              "char_end": 477
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Pericardial effusion has been described.",
              "char_start": 478,
              "char_end": 518
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Coagulopathy due to both pro- and anticoagulant factor deficiencies creates a complex hemostatic picture.",
              "char_start": 519,
              "char_end": 624
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Stroke-like episodes may occur.",
              "char_start": 625,
              "char_end": 656
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Seizures develop in approximately one third.",
              "char_start": 657,
              "char_end": 701
            },
            {
              "sentence_id": "p1_s9",
              "sentence_index": 9,
              "text": "Peripheral neuropathy with absent reflexes is present.",
              "char_start": 702,
              "char_end": 756
            },
            {
              "sentence_id": "p1_s10",
              "sentence_index": 10,
              "text": "Isoelectric focusing of serum transferrin shows a type 1 pattern and is the initial screening test.",
              "char_start": 757,
              "char_end": 856
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Inverted nipples and abnormal subcutaneous fat distribution (fat pads) are characteristic physical findings in infancy, but neither persists reliably into adulthood and their absence should not exclude the diagnosis in older patients.",
          "char_start": 0,
          "char_end": 234
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Cerebellar hypoplasia is present on MRI in essentially all individuals and is nonprogressive.",
          "char_start": 235,
          "char_end": 328
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Strabismus and abnormal eye movements are common.",
          "char_start": 329,
          "char_end": 378
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Hepatic involvement includes elevated transaminases, hepatomegaly, and protein-losing enteropathy.",
          "char_start": 379,
          "char_end": 477
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Pericardial effusion has been described.",
          "char_start": 478,
          "char_end": 518
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Coagulopathy due to both pro- and anticoagulant factor deficiencies creates a complex hemostatic picture.",
          "char_start": 519,
          "char_end": 624
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Stroke-like episodes may occur.",
          "char_start": 625,
          "char_end": 656
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Seizures develop in approximately one third.",
          "char_start": 657,
          "char_end": 701
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s9",
          "sentence_index": 9,
          "text": "Peripheral neuropathy with absent reflexes is present.",
          "char_start": 702,
          "char_end": 756
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s10",
          "sentence_index": 10,
          "text": "Isoelectric focusing of serum transferrin shows a type 1 pattern and is the initial screening test.",
          "char_start": 757,
          "char_end": 856
        }
      ]
    }
  },
  {
    "id": "disc-080",
    "chapter_title": "Dense Lab and Treatment Paragraph",
    "existing_anchors": [
      {
        "hpo_label": "Anemia",
        "match_texts": [
          "anemia"
        ]
      }
    ],
    "clinical_text": "Evaluation should include a complete blood count with reticulocyte count, peripheral blood smear, serum ferritin, total iron-binding capacity, serum haptoglobin, lactate dehydrogenase, direct and indirect bilirubin, direct antiglobulin test (Coombs test), hemoglobin electrophoresis, and flow cytometry for CD55 and CD59. For ongoing management, folic acid supplementation at 1 mg daily is recommended. Patients with symptomatic anemia may require red blood cell transfusion. Eculizumab, a complement C5 inhibitor, has transformed the treatment of paroxysmal nocturnal hemoglobinuria. Ravulizumab offers the advantage of less frequent dosing. Allogeneic hematopoietic stem cell transplantation remains the only curative option.",
    "expectedNewCandidates": [],
    "mustNotPropose": [
      {
        "label": "Anemia",
        "reason": "already_in_anchors"
      },
      {
        "label": "complete blood count",
        "reason": "lab_or_test_method"
      },
      {
        "label": "reticulocyte count",
        "reason": "lab_or_test_method"
      },
      {
        "label": "peripheral blood smear",
        "reason": "lab_or_test_method"
      },
      {
        "label": "serum ferritin",
        "reason": "lab_or_test_method"
      },
      {
        "label": "total iron-binding capacity",
        "reason": "lab_or_test_method"
      },
      {
        "label": "serum haptoglobin",
        "reason": "lab_or_test_method"
      },
      {
        "label": "lactate dehydrogenase",
        "reason": "lab_or_test_method"
      },
      {
        "label": "direct antiglobulin test",
        "reason": "lab_or_test_method"
      },
      {
        "label": "hemoglobin electrophoresis",
        "reason": "lab_or_test_method"
      },
      {
        "label": "flow cytometry",
        "reason": "lab_or_test_method"
      },
      {
        "label": "folic acid",
        "reason": "treatment_or_management"
      },
      {
        "label": "red blood cell transfusion",
        "reason": "treatment_or_management"
      },
      {
        "label": "eculizumab",
        "reason": "treatment_or_management"
      },
      {
        "label": "ravulizumab",
        "reason": "treatment_or_management"
      },
      {
        "label": "hematopoietic stem cell transplantation",
        "reason": "treatment_or_management"
      }
    ],
    "acceptableExtraCandidates": [],
    "clinical_structure": {
      "chapter_title": "Dense Lab and Treatment Paragraph",
      "clinical_text": "Evaluation should include a complete blood count with reticulocyte count, peripheral blood smear, serum ferritin, total iron-binding capacity, serum haptoglobin, lactate dehydrogenase, direct and indirect bilirubin, direct antiglobulin test (Coombs test), hemoglobin electrophoresis, and flow cytometry for CD55 and CD59. For ongoing management, folic acid supplementation at 1 mg daily is recommended. Patients with symptomatic anemia may require red blood cell transfusion. Eculizumab, a complement C5 inhibitor, has transformed the treatment of paroxysmal nocturnal hemoglobinuria. Ravulizumab offers the advantage of less frequent dosing. Allogeneic hematopoietic stem cell transplantation remains the only curative option.",
      "paragraph_count": 1,
      "sentence_count": 6,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Evaluation should include a complete blood count with reticulocyte count, peripheral blood smear, serum ferritin, total iron-binding capacity, serum haptoglobin, lactate dehydrogenase, direct and indirect bilirubin, direct antiglobulin test (Coombs test), hemoglobin electrophoresis, and flow cytometry for CD55 and CD59. For ongoing management, folic acid supplementation at 1 mg daily is recommended. Patients with symptomatic anemia may require red blood cell transfusion. Eculizumab, a complement C5 inhibitor, has transformed the treatment of paroxysmal nocturnal hemoglobinuria. Ravulizumab offers the advantage of less frequent dosing. Allogeneic hematopoietic stem cell transplantation remains the only curative option.",
          "char_start": 0,
          "char_end": 727,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Evaluation should include a complete blood count with reticulocyte count, peripheral blood smear, serum ferritin, total iron-binding capacity, serum haptoglobin, lactate dehydrogenase, direct and indirect bilirubin, direct antiglobulin test (Coombs test), hemoglobin electrophoresis, and flow cytometry for CD55 and CD59.",
              "char_start": 0,
              "char_end": 321
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "For ongoing management, folic acid supplementation at 1 mg daily is recommended.",
              "char_start": 322,
              "char_end": 402
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Patients with symptomatic anemia may require red blood cell transfusion.",
              "char_start": 403,
              "char_end": 475
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Eculizumab, a complement C5 inhibitor, has transformed the treatment of paroxysmal nocturnal hemoglobinuria.",
              "char_start": 476,
              "char_end": 584
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Ravulizumab offers the advantage of less frequent dosing.",
              "char_start": 585,
              "char_end": 642
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Allogeneic hematopoietic stem cell transplantation remains the only curative option.",
              "char_start": 643,
              "char_end": 727
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Evaluation should include a complete blood count with reticulocyte count, peripheral blood smear, serum ferritin, total iron-binding capacity, serum haptoglobin, lactate dehydrogenase, direct and indirect bilirubin, direct antiglobulin test (Coombs test), hemoglobin electrophoresis, and flow cytometry for CD55 and CD59.",
          "char_start": 0,
          "char_end": 321
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "For ongoing management, folic acid supplementation at 1 mg daily is recommended.",
          "char_start": 322,
          "char_end": 402
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Patients with symptomatic anemia may require red blood cell transfusion.",
          "char_start": 403,
          "char_end": 475
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Eculizumab, a complement C5 inhibitor, has transformed the treatment of paroxysmal nocturnal hemoglobinuria.",
          "char_start": 476,
          "char_end": 584
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Ravulizumab offers the advantage of less frequent dosing.",
          "char_start": 585,
          "char_end": 642
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Allogeneic hematopoietic stem cell transplantation remains the only curative option.",
          "char_start": 643,
          "char_end": 727
        }
      ]
    }
  },
  {
    "id": "disc-081",
    "chapter_title": "Neonatal Presentation Edge Case",
    "existing_anchors": [],
    "clinical_text": "The proband presented at birth with profound hypotonia, absent cry, absent suck reflex, and respiratory failure requiring immediate intubation. Facial dysmorphism included downslanting palpebral fissures, micrognathia, and low-set posteriorly rotated ears. Bilateral talipes equinovarus was present. Echocardiography revealed a large ventricular septal defect. Cranial ultrasound demonstrated bilateral germinal matrix hemorrhage. Brain MRI performed at day 14 showed diffuse cerebral atrophy and a thin corpus callosum. Chromosomal microarray identified a de novo 2.5-Mb deletion at 1q21.1.",
    "expectedNewCandidates": [
      {
        "label": "profound hypotonia",
        "status": "present"
      },
      {
        "label": "absent cry",
        "status": "present"
      },
      {
        "label": "absent suck reflex",
        "status": "present"
      },
      {
        "label": "respiratory failure",
        "status": "present"
      },
      {
        "label": "downslanting palpebral fissures",
        "status": "present"
      },
      {
        "label": "micrognathia",
        "status": "present"
      },
      {
        "label": "low-set ears",
        "status": "present"
      },
      {
        "label": "talipes equinovarus",
        "status": "present"
      },
      {
        "label": "ventricular septal defect",
        "status": "present"
      },
      {
        "label": "germinal matrix hemorrhage",
        "status": "present"
      },
      {
        "label": "cerebral atrophy",
        "status": "present"
      },
      {
        "label": "thin corpus callosum",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "echocardiography",
        "reason": "lab_or_test_method"
      },
      {
        "label": "cranial ultrasound",
        "reason": "lab_or_test_method"
      },
      {
        "label": "Brain MRI",
        "reason": "lab_or_test_method"
      },
      {
        "label": "chromosomal microarray",
        "reason": "lab_or_test_method"
      },
      {
        "label": "1q21.1 deletion",
        "reason": "gene_or_variant"
      },
      {
        "label": "intubation",
        "reason": "treatment_or_management"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "posteriorly rotated ears",
        "status": "present"
      },
      {
        "label": "facial dysmorphism",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Neonatal Presentation Edge Case",
      "clinical_text": "The proband presented at birth with profound hypotonia, absent cry, absent suck reflex, and respiratory failure requiring immediate intubation. Facial dysmorphism included downslanting palpebral fissures, micrognathia, and low-set posteriorly rotated ears. Bilateral talipes equinovarus was present. Echocardiography revealed a large ventricular septal defect. Cranial ultrasound demonstrated bilateral germinal matrix hemorrhage. Brain MRI performed at day 14 showed diffuse cerebral atrophy and a thin corpus callosum. Chromosomal microarray identified a de novo 2.5-Mb deletion at 1q21.1.",
      "paragraph_count": 1,
      "sentence_count": 7,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "The proband presented at birth with profound hypotonia, absent cry, absent suck reflex, and respiratory failure requiring immediate intubation. Facial dysmorphism included downslanting palpebral fissures, micrognathia, and low-set posteriorly rotated ears. Bilateral talipes equinovarus was present. Echocardiography revealed a large ventricular septal defect. Cranial ultrasound demonstrated bilateral germinal matrix hemorrhage. Brain MRI performed at day 14 showed diffuse cerebral atrophy and a thin corpus callosum. Chromosomal microarray identified a de novo 2.5-Mb deletion at 1q21.1.",
          "char_start": 0,
          "char_end": 591,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "The proband presented at birth with profound hypotonia, absent cry, absent suck reflex, and respiratory failure requiring immediate intubation.",
              "char_start": 0,
              "char_end": 143
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Facial dysmorphism included downslanting palpebral fissures, micrognathia, and low-set posteriorly rotated ears.",
              "char_start": 144,
              "char_end": 256
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Bilateral talipes equinovarus was present.",
              "char_start": 257,
              "char_end": 299
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Echocardiography revealed a large ventricular septal defect.",
              "char_start": 300,
              "char_end": 360
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Cranial ultrasound demonstrated bilateral germinal matrix hemorrhage.",
              "char_start": 361,
              "char_end": 430
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Brain MRI performed at day 14 showed diffuse cerebral atrophy and a thin corpus callosum.",
              "char_start": 431,
              "char_end": 520
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "Chromosomal microarray identified a de novo 2.5-Mb deletion at 1q21.1.",
              "char_start": 521,
              "char_end": 591
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "The proband presented at birth with profound hypotonia, absent cry, absent suck reflex, and respiratory failure requiring immediate intubation.",
          "char_start": 0,
          "char_end": 143
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Facial dysmorphism included downslanting palpebral fissures, micrognathia, and low-set posteriorly rotated ears.",
          "char_start": 144,
          "char_end": 256
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Bilateral talipes equinovarus was present.",
          "char_start": 257,
          "char_end": 299
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Echocardiography revealed a large ventricular septal defect.",
          "char_start": 300,
          "char_end": 360
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Cranial ultrasound demonstrated bilateral germinal matrix hemorrhage.",
          "char_start": 361,
          "char_end": 430
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Brain MRI performed at day 14 showed diffuse cerebral atrophy and a thin corpus callosum.",
          "char_start": 431,
          "char_end": 520
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "Chromosomal microarray identified a de novo 2.5-Mb deletion at 1q21.1.",
          "char_start": 521,
          "char_end": 591
        }
      ]
    }
  },
  {
    "id": "disc-082",
    "chapter_title": "Minimal New Findings Edge Case",
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
        "hpo_label": "Microcephaly",
        "match_texts": [
          "microcephaly"
        ]
      },
      {
        "hpo_label": "Spasticity",
        "match_texts": [
          "spasticity"
        ]
      }
    ],
    "clinical_text": "The clinical presentation is characterized by seizures, intellectual disability, progressive microcephaly, and spasticity. Deep tendon reflexes are brisk. Brain MRI shows progressive cerebral atrophy. Electroencephalography demonstrates multifocal epileptiform discharges. Vision and hearing are normal. Growth parameters other than head circumference are within normal limits. The disorder is inherited in an autosomal recessive manner. Biallelic pathogenic variants in GENE2 are causative.",
    "expectedNewCandidates": [
      {
        "label": "cerebral atrophy",
        "status": "present"
      }
    ],
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
        "label": "Microcephaly",
        "reason": "already_in_anchors"
      },
      {
        "label": "Spasticity",
        "reason": "already_in_anchors"
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
        "label": "electroencephalography",
        "reason": "lab_or_test_method"
      },
      {
        "label": "autosomal recessive",
        "reason": "not_a_phenotype"
      },
      {
        "label": "GENE2",
        "reason": "gene_or_variant"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "brisk deep tendon reflexes",
        "status": "present"
      },
      {
        "label": "hyperreflexia",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Minimal New Findings Edge Case",
      "clinical_text": "The clinical presentation is characterized by seizures, intellectual disability, progressive microcephaly, and spasticity. Deep tendon reflexes are brisk. Brain MRI shows progressive cerebral atrophy. Electroencephalography demonstrates multifocal epileptiform discharges. Vision and hearing are normal. Growth parameters other than head circumference are within normal limits. The disorder is inherited in an autosomal recessive manner. Biallelic pathogenic variants in GENE2 are causative.",
      "paragraph_count": 1,
      "sentence_count": 8,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "The clinical presentation is characterized by seizures, intellectual disability, progressive microcephaly, and spasticity. Deep tendon reflexes are brisk. Brain MRI shows progressive cerebral atrophy. Electroencephalography demonstrates multifocal epileptiform discharges. Vision and hearing are normal. Growth parameters other than head circumference are within normal limits. The disorder is inherited in an autosomal recessive manner. Biallelic pathogenic variants in GENE2 are causative.",
          "char_start": 0,
          "char_end": 491,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "The clinical presentation is characterized by seizures, intellectual disability, progressive microcephaly, and spasticity.",
              "char_start": 0,
              "char_end": 122
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Deep tendon reflexes are brisk.",
              "char_start": 123,
              "char_end": 154
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Brain MRI shows progressive cerebral atrophy.",
              "char_start": 155,
              "char_end": 200
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Electroencephalography demonstrates multifocal epileptiform discharges.",
              "char_start": 201,
              "char_end": 272
            },
            {
              "sentence_id": "p1_s5",
              "sentence_index": 5,
              "text": "Vision and hearing are normal.",
              "char_start": 273,
              "char_end": 303
            },
            {
              "sentence_id": "p1_s6",
              "sentence_index": 6,
              "text": "Growth parameters other than head circumference are within normal limits.",
              "char_start": 304,
              "char_end": 377
            },
            {
              "sentence_id": "p1_s7",
              "sentence_index": 7,
              "text": "The disorder is inherited in an autosomal recessive manner.",
              "char_start": 378,
              "char_end": 437
            },
            {
              "sentence_id": "p1_s8",
              "sentence_index": 8,
              "text": "Biallelic pathogenic variants in GENE2 are causative.",
              "char_start": 438,
              "char_end": 491
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "The clinical presentation is characterized by seizures, intellectual disability, progressive microcephaly, and spasticity.",
          "char_start": 0,
          "char_end": 122
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Deep tendon reflexes are brisk.",
          "char_start": 123,
          "char_end": 154
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Brain MRI shows progressive cerebral atrophy.",
          "char_start": 155,
          "char_end": 200
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Electroencephalography demonstrates multifocal epileptiform discharges.",
          "char_start": 201,
          "char_end": 272
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s5",
          "sentence_index": 5,
          "text": "Vision and hearing are normal.",
          "char_start": 273,
          "char_end": 303
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s6",
          "sentence_index": 6,
          "text": "Growth parameters other than head circumference are within normal limits.",
          "char_start": 304,
          "char_end": 377
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s7",
          "sentence_index": 7,
          "text": "The disorder is inherited in an autosomal recessive manner.",
          "char_start": 378,
          "char_end": 437
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s8",
          "sentence_index": 8,
          "text": "Biallelic pathogenic variants in GENE2 are causative.",
          "char_start": 438,
          "char_end": 491
        }
      ]
    }
  },
  {
    "id": "disc-084",
    "chapter_title": "Heavy Gene and Variant Paragraph",
    "existing_anchors": [
      {
        "hpo_label": "Retinal dystrophy",
        "match_texts": [
          "retinal dystrophy"
        ]
      }
    ],
    "clinical_text": "Pathogenic variants in RPE65, CRB1, CEP290, GUCY2D, RPGRIP1, RDH12, LRAT, TULP1, SPATA7, AIPL1, LCA5, NMNAT1, KCNJ13, RD3, IQCB1, and DTHD1 have been associated with Leber congenital amaurosis. Biallelic variants in RPE65 are of particular clinical importance because voretigene neparvovec (Luxturna), an adeno-associated virus gene therapy vector, is approved for treatment. Genotype-phenotype correlations indicate that CEP290 variants are associated with a more severe phenotype including congenital blindness and oculodigital sign (eye pressing), while GUCY2D variants may be associated with better preserved visual function. Electroretinography is severely attenuated or absent.",
    "expectedNewCandidates": [
      {
        "label": "congenital blindness",
        "status": "present"
      },
      {
        "label": "oculodigital sign",
        "status": "present"
      }
    ],
    "mustNotPropose": [
      {
        "label": "Retinal dystrophy",
        "reason": "already_in_anchors"
      },
      {
        "label": "RPE65",
        "reason": "gene_or_variant"
      },
      {
        "label": "CRB1",
        "reason": "gene_or_variant"
      },
      {
        "label": "CEP290",
        "reason": "gene_or_variant"
      },
      {
        "label": "GUCY2D",
        "reason": "gene_or_variant"
      },
      {
        "label": "RPGRIP1",
        "reason": "gene_or_variant"
      },
      {
        "label": "RDH12",
        "reason": "gene_or_variant"
      },
      {
        "label": "LRAT",
        "reason": "gene_or_variant"
      },
      {
        "label": "TULP1",
        "reason": "gene_or_variant"
      },
      {
        "label": "SPATA7",
        "reason": "gene_or_variant"
      },
      {
        "label": "AIPL1",
        "reason": "gene_or_variant"
      },
      {
        "label": "voretigene neparvovec",
        "reason": "treatment_or_management"
      },
      {
        "label": "Luxturna",
        "reason": "treatment_or_management"
      },
      {
        "label": "Leber congenital amaurosis",
        "reason": "not_a_phenotype"
      },
      {
        "label": "electroretinography",
        "reason": "lab_or_test_method"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "eye pressing",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Heavy Gene and Variant Paragraph",
      "clinical_text": "Pathogenic variants in RPE65, CRB1, CEP290, GUCY2D, RPGRIP1, RDH12, LRAT, TULP1, SPATA7, AIPL1, LCA5, NMNAT1, KCNJ13, RD3, IQCB1, and DTHD1 have been associated with Leber congenital amaurosis. Biallelic variants in RPE65 are of particular clinical importance because voretigene neparvovec (Luxturna), an adeno-associated virus gene therapy vector, is approved for treatment. Genotype-phenotype correlations indicate that CEP290 variants are associated with a more severe phenotype including congenital blindness and oculodigital sign (eye pressing), while GUCY2D variants may be associated with better preserved visual function. Electroretinography is severely attenuated or absent.",
      "paragraph_count": 1,
      "sentence_count": 4,
      "paragraphs": [
        {
          "paragraph_id": "p1",
          "paragraph_index": 1,
          "text": "Pathogenic variants in RPE65, CRB1, CEP290, GUCY2D, RPGRIP1, RDH12, LRAT, TULP1, SPATA7, AIPL1, LCA5, NMNAT1, KCNJ13, RD3, IQCB1, and DTHD1 have been associated with Leber congenital amaurosis. Biallelic variants in RPE65 are of particular clinical importance because voretigene neparvovec (Luxturna), an adeno-associated virus gene therapy vector, is approved for treatment. Genotype-phenotype correlations indicate that CEP290 variants are associated with a more severe phenotype including congenital blindness and oculodigital sign (eye pressing), while GUCY2D variants may be associated with better preserved visual function. Electroretinography is severely attenuated or absent.",
          "char_start": 0,
          "char_end": 683,
          "sentences": [
            {
              "sentence_id": "p1_s1",
              "sentence_index": 1,
              "text": "Pathogenic variants in RPE65, CRB1, CEP290, GUCY2D, RPGRIP1, RDH12, LRAT, TULP1, SPATA7, AIPL1, LCA5, NMNAT1, KCNJ13, RD3, IQCB1, and DTHD1 have been associated with Leber congenital amaurosis.",
              "char_start": 0,
              "char_end": 193
            },
            {
              "sentence_id": "p1_s2",
              "sentence_index": 2,
              "text": "Biallelic variants in RPE65 are of particular clinical importance because voretigene neparvovec (Luxturna), an adeno-associated virus gene therapy vector, is approved for treatment.",
              "char_start": 194,
              "char_end": 375
            },
            {
              "sentence_id": "p1_s3",
              "sentence_index": 3,
              "text": "Genotype-phenotype correlations indicate that CEP290 variants are associated with a more severe phenotype including congenital blindness and oculodigital sign (eye pressing), while GUCY2D variants may be associated with better preserved visual function.",
              "char_start": 376,
              "char_end": 629
            },
            {
              "sentence_id": "p1_s4",
              "sentence_index": 4,
              "text": "Electroretinography is severely attenuated or absent.",
              "char_start": 630,
              "char_end": 683
            }
          ]
        }
      ],
      "sentences": [
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s1",
          "sentence_index": 1,
          "text": "Pathogenic variants in RPE65, CRB1, CEP290, GUCY2D, RPGRIP1, RDH12, LRAT, TULP1, SPATA7, AIPL1, LCA5, NMNAT1, KCNJ13, RD3, IQCB1, and DTHD1 have been associated with Leber congenital amaurosis.",
          "char_start": 0,
          "char_end": 193
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s2",
          "sentence_index": 2,
          "text": "Biallelic variants in RPE65 are of particular clinical importance because voretigene neparvovec (Luxturna), an adeno-associated virus gene therapy vector, is approved for treatment.",
          "char_start": 194,
          "char_end": 375
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s3",
          "sentence_index": 3,
          "text": "Genotype-phenotype correlations indicate that CEP290 variants are associated with a more severe phenotype including congenital blindness and oculodigital sign (eye pressing), while GUCY2D variants may be associated with better preserved visual function.",
          "char_start": 376,
          "char_end": 629
        },
        {
          "paragraph_id": "p1",
          "sentence_id": "p1_s4",
          "sentence_index": 4,
          "text": "Electroretinography is severely attenuated or absent.",
          "char_start": 630,
          "char_end": 683
        }
      ]
    }
  },
  {
    "id": "disc-100",
    "chapter_title": "Kitchen Sink Stress Test",
    "existing_anchors": [
      {
        "hpo_label": "Seizure",
        "match_texts": [
          "seizures",
          "epilepsy"
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
      }
    ],
    "clinical_text": "Clinical Characteristics\n\nSuggestive Findings\n\nThe child never walked independently and lost the ability to sit without support by age 3. Previously acquired babbling was lost; she became completely nonverbal. Scoliosis developed progressively. Stereotypic hand-wringing replaced purposeful hand use. Breathing irregularities including hyperventilation episodes and breath-holding spells were prominent during wakefulness. Growth deceleration led to short stature by age 5. Constipation was a persistent problem. Sleep was disrupted with frequent nighttime awakenings and early morning arousal.\n\nView in own window\n\nTable 1. Features of This Disorder\n\nHearing is preserved. Vision is normal. Cardiac evaluation by echocardiography is unremarkable. Renal ultrasound shows no anomalies. Liver function tests are within the reference range.\n\nGenetics\n\nThe disorder is caused by heterozygous pathogenic variants in MECP2 and is inherited in an X-linked dominant manner with reduced penetrance in males. Molecular genetic testing should include sequence analysis followed by deletion/duplication analysis if no variant is identified.\n\nManagement\n\nThere is no cure. Antiepileptic medications are used for seizure control. Melatonin may improve sleep. Physical therapy, occupational therapy, and augmentative communication devices are recommended. Scoliosis may require bracing or surgical correction. A multidisciplinary approach to management is essential.",
    "expectedNewCandidates": [
      {
        "label": "loss of independent ambulation",
        "status": "present"
      },
      {
        "label": "loss of sitting ability",
        "status": "present"
      },
      {
        "label": "loss of babbling",
        "status": "present"
      },
      {
        "label": "absent speech",
        "status": "present"
      },
      {
        "label": "scoliosis",
        "status": "present"
      },
      {
        "label": "stereotypic hand-wringing",
        "status": "present"
      },
      {
        "label": "loss of purposeful hand use",
        "status": "present"
      },
      {
        "label": "hyperventilation",
        "status": "present"
      },
      {
        "label": "breath-holding spells",
        "status": "present"
      },
      {
        "label": "short stature",
        "status": "present"
      },
      {
        "label": "constipation",
        "status": "present"
      },
      {
        "label": "sleep disturbance",
        "status": "present"
      }
    ],
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
        "label": "Genetics",
        "reason": "table_or_heading_junk"
      },
      {
        "label": "Management",
        "reason": "table_or_heading_junk"
      },
      {
        "label": "hearing",
        "reason": "normal_or_preserved"
      },
      {
        "label": "vision",
        "reason": "normal_or_preserved"
      },
      {
        "label": "cardiac evaluation",
        "reason": "normal_or_preserved"
      },
      {
        "label": "renal ultrasound",
        "reason": "normal_or_preserved"
      },
      {
        "label": "liver function tests",
        "reason": "normal_or_preserved"
      },
      {
        "label": "echocardiography",
        "reason": "lab_or_test_method"
      },
      {
        "label": "MECP2",
        "reason": "gene_or_variant"
      },
      {
        "label": "X-linked dominant",
        "reason": "not_a_phenotype"
      },
      {
        "label": "molecular genetic testing",
        "reason": "lab_or_test_method"
      },
      {
        "label": "antiepileptic medications",
        "reason": "treatment_or_management"
      },
      {
        "label": "melatonin",
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
        "label": "augmentative communication devices",
        "reason": "treatment_or_management"
      },
      {
        "label": "bracing",
        "reason": "treatment_or_management"
      },
      {
        "label": "surgical correction",
        "reason": "treatment_or_management"
      }
    ],
    "acceptableExtraCandidates": [
      {
        "label": "developmental regression",
        "status": "present"
      },
      {
        "label": "breathing irregularities",
        "status": "present"
      },
      {
        "label": "growth deceleration",
        "status": "present"
      },
      {
        "label": "frequent nighttime awakenings",
        "status": "present"
      }
    ],
    "clinical_structure": {
      "chapter_title": "Kitchen Sink Stress Test",
      "clinical_text": "Clinical Characteristics\n\nSuggestive Findings\n\nThe child never walked independently and lost the ability to sit without support by age 3. Previously acquired babbling was lost; she became completely nonverbal. Scoliosis developed progressively. Stereotypic hand-wringing replaced purposeful hand use. Breathing irregularities including hyperventilation episodes and breath-holding spells were prominent during wakefulness. Growth deceleration led to short stature by age 5. Constipation was a persistent problem. Sleep was disrupted with frequent nighttime awakenings and early morning arousal.\n\nView in own window\n\nTable 1. Features of This Disorder\n\nHearing is preserved. Vision is normal. Cardiac evaluation by echocardiography is unremarkable. Renal ultrasound shows no anomalies. Liver function tests are within the reference range.\n\nGenetics\n\nThe disorder is caused by heterozygous pathogenic variants in MECP2 and is inherited in an X-linked dominant manner with reduced penetrance in males. Molecular genetic testing should include sequence analysis followed by deletion/duplication analysis if no variant is identified.\n\nManagement\n\nThere is no cure. Antiepileptic medications are used for seizure control. Melatonin may improve sleep. Physical therapy, occupational therapy, and augmentative communication devices are recommended. Scoliosis may require bracing or surgical correction. A multidisciplinary approach to management is essential.",
      "paragraph_count": 10,
      "sentence_count": 28,
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
          "text": "The child never walked independently and lost the ability to sit without support by age 3. Previously acquired babbling was lost; she became completely nonverbal. Scoliosis developed progressively. Stereotypic hand-wringing replaced purposeful hand use. Breathing irregularities including hyperventilation episodes and breath-holding spells were prominent during wakefulness. Growth deceleration led to short stature by age 5. Constipation was a persistent problem. Sleep was disrupted with frequent nighttime awakenings and early morning arousal.",
          "char_start": 47,
          "char_end": 594,
          "sentences": [
            {
              "sentence_id": "p3_s1",
              "sentence_index": 1,
              "text": "The child never walked independently and lost the ability to sit without support by age 3.",
              "char_start": 47,
              "char_end": 137
            },
            {
              "sentence_id": "p3_s2",
              "sentence_index": 2,
              "text": "Previously acquired babbling was lost; she became completely nonverbal.",
              "char_start": 138,
              "char_end": 209
            },
            {
              "sentence_id": "p3_s3",
              "sentence_index": 3,
              "text": "Scoliosis developed progressively.",
              "char_start": 210,
              "char_end": 244
            },
            {
              "sentence_id": "p3_s4",
              "sentence_index": 4,
              "text": "Stereotypic hand-wringing replaced purposeful hand use.",
              "char_start": 245,
              "char_end": 300
            },
            {
              "sentence_id": "p3_s5",
              "sentence_index": 5,
              "text": "Breathing irregularities including hyperventilation episodes and breath-holding spells were prominent during wakefulness.",
              "char_start": 301,
              "char_end": 422
            },
            {
              "sentence_id": "p3_s6",
              "sentence_index": 6,
              "text": "Growth deceleration led to short stature by age 5.",
              "char_start": 423,
              "char_end": 473
            },
            {
              "sentence_id": "p3_s7",
              "sentence_index": 7,
              "text": "Constipation was a persistent problem.",
              "char_start": 474,
              "char_end": 512
            },
            {
              "sentence_id": "p3_s8",
              "sentence_index": 8,
              "text": "Sleep was disrupted with frequent nighttime awakenings and early morning arousal.",
              "char_start": 513,
              "char_end": 594
            }
          ]
        },
        {
          "paragraph_id": "p4",
          "paragraph_index": 4,
          "text": "View in own window",
          "char_start": 596,
          "char_end": 614,
          "sentences": [
            {
              "sentence_id": "p4_s1",
              "sentence_index": 1,
              "text": "View in own window",
              "char_start": 596,
              "char_end": 614
            }
          ]
        },
        {
          "paragraph_id": "p5",
          "paragraph_index": 5,
          "text": "Table 1. Features of This Disorder",
          "char_start": 616,
          "char_end": 650,
          "sentences": [
            {
              "sentence_id": "p5_s1",
              "sentence_index": 1,
              "text": "Table 1.",
              "char_start": 616,
              "char_end": 624
            },
            {
              "sentence_id": "p5_s2",
              "sentence_index": 2,
              "text": "Features of This Disorder",
              "char_start": 625,
              "char_end": 650
            }
          ]
        },
        {
          "paragraph_id": "p6",
          "paragraph_index": 6,
          "text": "Hearing is preserved. Vision is normal. Cardiac evaluation by echocardiography is unremarkable. Renal ultrasound shows no anomalies. Liver function tests are within the reference range.",
          "char_start": 652,
          "char_end": 837,
          "sentences": [
            {
              "sentence_id": "p6_s1",
              "sentence_index": 1,
              "text": "Hearing is preserved.",
              "char_start": 652,
              "char_end": 673
            },
            {
              "sentence_id": "p6_s2",
              "sentence_index": 2,
              "text": "Vision is normal.",
              "char_start": 674,
              "char_end": 691
            },
            {
              "sentence_id": "p6_s3",
              "sentence_index": 3,
              "text": "Cardiac evaluation by echocardiography is unremarkable.",
              "char_start": 692,
              "char_end": 747
            },
            {
              "sentence_id": "p6_s4",
              "sentence_index": 4,
              "text": "Renal ultrasound shows no anomalies.",
              "char_start": 748,
              "char_end": 784
            },
            {
              "sentence_id": "p6_s5",
              "sentence_index": 5,
              "text": "Liver function tests are within the reference range.",
              "char_start": 785,
              "char_end": 837
            }
          ]
        },
        {
          "paragraph_id": "p7",
          "paragraph_index": 7,
          "text": "Genetics",
          "char_start": 839,
          "char_end": 847,
          "sentences": [
            {
              "sentence_id": "p7_s1",
              "sentence_index": 1,
              "text": "Genetics",
              "char_start": 839,
              "char_end": 847
            }
          ]
        },
        {
          "paragraph_id": "p8",
          "paragraph_index": 8,
          "text": "The disorder is caused by heterozygous pathogenic variants in MECP2 and is inherited in an X-linked dominant manner with reduced penetrance in males. Molecular genetic testing should include sequence analysis followed by deletion/duplication analysis if no variant is identified.",
          "char_start": 849,
          "char_end": 1128,
          "sentences": [
            {
              "sentence_id": "p8_s1",
              "sentence_index": 1,
              "text": "The disorder is caused by heterozygous pathogenic variants in MECP2 and is inherited in an X-linked dominant manner with reduced penetrance in males.",
              "char_start": 849,
              "char_end": 998
            },
            {
              "sentence_id": "p8_s2",
              "sentence_index": 2,
              "text": "Molecular genetic testing should include sequence analysis followed by deletion/duplication analysis if no variant is identified.",
              "char_start": 999,
              "char_end": 1128
            }
          ]
        },
        {
          "paragraph_id": "p9",
          "paragraph_index": 9,
          "text": "Management",
          "char_start": 1130,
          "char_end": 1140,
          "sentences": [
            {
              "sentence_id": "p9_s1",
              "sentence_index": 1,
              "text": "Management",
              "char_start": 1130,
              "char_end": 1140
            }
          ]
        },
        {
          "paragraph_id": "p10",
          "paragraph_index": 10,
          "text": "There is no cure. Antiepileptic medications are used for seizure control. Melatonin may improve sleep. Physical therapy, occupational therapy, and augmentative communication devices are recommended. Scoliosis may require bracing or surgical correction. A multidisciplinary approach to management is essential.",
          "char_start": 1142,
          "char_end": 1451,
          "sentences": [
            {
              "sentence_id": "p10_s1",
              "sentence_index": 1,
              "text": "There is no cure.",
              "char_start": 1142,
              "char_end": 1159
            },
            {
              "sentence_id": "p10_s2",
              "sentence_index": 2,
              "text": "Antiepileptic medications are used for seizure control.",
              "char_start": 1160,
              "char_end": 1215
            },
            {
              "sentence_id": "p10_s3",
              "sentence_index": 3,
              "text": "Melatonin may improve sleep.",
              "char_start": 1216,
              "char_end": 1244
            },
            {
              "sentence_id": "p10_s4",
              "sentence_index": 4,
              "text": "Physical therapy, occupational therapy, and augmentative communication devices are recommended.",
              "char_start": 1245,
              "char_end": 1340
            },
            {
              "sentence_id": "p10_s5",
              "sentence_index": 5,
              "text": "Scoliosis may require bracing or surgical correction.",
              "char_start": 1341,
              "char_end": 1394
            },
            {
              "sentence_id": "p10_s6",
              "sentence_index": 6,
              "text": "A multidisciplinary approach to management is essential.",
              "char_start": 1395,
              "char_end": 1451
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
          "text": "The child never walked independently and lost the ability to sit without support by age 3.",
          "char_start": 47,
          "char_end": 137
        },
        {
          "paragraph_id": "p3",
          "sentence_id": "p3_s2",
          "sentence_index": 2,
          "text": "Previously acquired babbling was lost; she became completely nonverbal.",
          "char_start": 138,
          "char_end": 209
        },
        {
          "paragraph_id": "p3",
          "sentence_id": "p3_s3",
          "sentence_index": 3,
          "text": "Scoliosis developed progressively.",
          "char_start": 210,
          "char_end": 244
        },
        {
          "paragraph_id": "p3",
          "sentence_id": "p3_s4",
          "sentence_index": 4,
          "text": "Stereotypic hand-wringing replaced purposeful hand use.",
          "char_start": 245,
          "char_end": 300
        },
        {
          "paragraph_id": "p3",
          "sentence_id": "p3_s5",
          "sentence_index": 5,
          "text": "Breathing irregularities including hyperventilation episodes and breath-holding spells were prominent during wakefulness.",
          "char_start": 301,
          "char_end": 422
        },
        {
          "paragraph_id": "p3",
          "sentence_id": "p3_s6",
          "sentence_index": 6,
          "text": "Growth deceleration led to short stature by age 5.",
          "char_start": 423,
          "char_end": 473
        },
        {
          "paragraph_id": "p3",
          "sentence_id": "p3_s7",
          "sentence_index": 7,
          "text": "Constipation was a persistent problem.",
          "char_start": 474,
          "char_end": 512
        },
        {
          "paragraph_id": "p3",
          "sentence_id": "p3_s8",
          "sentence_index": 8,
          "text": "Sleep was disrupted with frequent nighttime awakenings and early morning arousal.",
          "char_start": 513,
          "char_end": 594
        },
        {
          "paragraph_id": "p4",
          "sentence_id": "p4_s1",
          "sentence_index": 1,
          "text": "View in own window",
          "char_start": 596,
          "char_end": 614
        },
        {
          "paragraph_id": "p5",
          "sentence_id": "p5_s1",
          "sentence_index": 1,
          "text": "Table 1.",
          "char_start": 616,
          "char_end": 624
        },
        {
          "paragraph_id": "p5",
          "sentence_id": "p5_s2",
          "sentence_index": 2,
          "text": "Features of This Disorder",
          "char_start": 625,
          "char_end": 650
        },
        {
          "paragraph_id": "p6",
          "sentence_id": "p6_s1",
          "sentence_index": 1,
          "text": "Hearing is preserved.",
          "char_start": 652,
          "char_end": 673
        },
        {
          "paragraph_id": "p6",
          "sentence_id": "p6_s2",
          "sentence_index": 2,
          "text": "Vision is normal.",
          "char_start": 674,
          "char_end": 691
        },
        {
          "paragraph_id": "p6",
          "sentence_id": "p6_s3",
          "sentence_index": 3,
          "text": "Cardiac evaluation by echocardiography is unremarkable.",
          "char_start": 692,
          "char_end": 747
        },
        {
          "paragraph_id": "p6",
          "sentence_id": "p6_s4",
          "sentence_index": 4,
          "text": "Renal ultrasound shows no anomalies.",
          "char_start": 748,
          "char_end": 784
        },
        {
          "paragraph_id": "p6",
          "sentence_id": "p6_s5",
          "sentence_index": 5,
          "text": "Liver function tests are within the reference range.",
          "char_start": 785,
          "char_end": 837
        },
        {
          "paragraph_id": "p7",
          "sentence_id": "p7_s1",
          "sentence_index": 1,
          "text": "Genetics",
          "char_start": 839,
          "char_end": 847
        },
        {
          "paragraph_id": "p8",
          "sentence_id": "p8_s1",
          "sentence_index": 1,
          "text": "The disorder is caused by heterozygous pathogenic variants in MECP2 and is inherited in an X-linked dominant manner with reduced penetrance in males.",
          "char_start": 849,
          "char_end": 998
        },
        {
          "paragraph_id": "p8",
          "sentence_id": "p8_s2",
          "sentence_index": 2,
          "text": "Molecular genetic testing should include sequence analysis followed by deletion/duplication analysis if no variant is identified.",
          "char_start": 999,
          "char_end": 1128
        },
        {
          "paragraph_id": "p9",
          "sentence_id": "p9_s1",
          "sentence_index": 1,
          "text": "Management",
          "char_start": 1130,
          "char_end": 1140
        },
        {
          "paragraph_id": "p10",
          "sentence_id": "p10_s1",
          "sentence_index": 1,
          "text": "There is no cure.",
          "char_start": 1142,
          "char_end": 1159
        },
        {
          "paragraph_id": "p10",
          "sentence_id": "p10_s2",
          "sentence_index": 2,
          "text": "Antiepileptic medications are used for seizure control.",
          "char_start": 1160,
          "char_end": 1215
        },
        {
          "paragraph_id": "p10",
          "sentence_id": "p10_s3",
          "sentence_index": 3,
          "text": "Melatonin may improve sleep.",
          "char_start": 1216,
          "char_end": 1244
        },
        {
          "paragraph_id": "p10",
          "sentence_id": "p10_s4",
          "sentence_index": 4,
          "text": "Physical therapy, occupational therapy, and augmentative communication devices are recommended.",
          "char_start": 1245,
          "char_end": 1340
        },
        {
          "paragraph_id": "p10",
          "sentence_id": "p10_s5",
          "sentence_index": 5,
          "text": "Scoliosis may require bracing or surgical correction.",
          "char_start": 1341,
          "char_end": 1394
        },
        {
          "paragraph_id": "p10",
          "sentence_id": "p10_s6",
          "sentence_index": 6,
          "text": "A multidisciplinary approach to management is essential.",
          "char_start": 1395,
          "char_end": 1451
        }
      ]
    }
  }
];

module.exports = {
  DISCOVERY_BENCHMARK,
  DISCOVERY_BENCHMARK_RAW: DISCOVERY_BENCHMARK
};
