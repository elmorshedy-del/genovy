import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateGroundedExternalReportsAgainstManualAudit } from '../src/lib/externalPhenotypeExtractionEval.js';

test('evaluateGroundedExternalReportsAgainstManualAudit measures useful_new recall against manual audit targets', () => {
  const reports = [
    {
      stage: 'external_extraction_grounded',
      chapter: {
        chapter_key: 'williams_syndrome',
        title: 'Williams Syndrome'
      },
      candidates: [
        {
          label: 'textural aversion',
          status: 'present',
          sentence_id: 'p15_s3',
          evidence_text: 'textural aversion'
        },
        {
          label: 'sleep disturbance',
          status: 'present',
          sentence_id: 'p20_s2',
          evidence_text: 'sleep disturbance'
        }
      ]
    }
  ];

  const manualAudit = {
    chapters: [
      {
        chapter_key: 'williams_syndrome',
        entries: [
          {
            sentence_id: 'p15_s3',
            evidence_text: 'textural aversion',
            bucket: 'useful_new'
          },
          {
            sentence_id: 'p15_s4',
            evidence_text: 'Prolonged colic',
            bucket: 'useful_new'
          },
          {
            sentence_id: 'p16_s2',
            evidence_text: 'delayed attainment of motor milestones',
            bucket: 'anchor_covered_semantic'
          }
        ]
      }
    ]
  };

  const evaluation = evaluateGroundedExternalReportsAgainstManualAudit(reports, manualAudit);
  assert.equal(evaluation.total_chapters_evaluated, 1);
  assert.equal(evaluation.useful_new_target_total, 2);
  assert.equal(evaluation.matched_useful_new_total, 1);
  assert.equal(evaluation.useful_new_recall, 0.5);
  assert.equal(evaluation.chapter_reports[0].missed_targets.length, 1);
  assert.equal(evaluation.chapter_reports[0].unmatched_predicted_candidates.length, 1);
});

test('evaluateGroundedExternalReportsAgainstManualAudit supports grounded raw report shapes', () => {
  const reports = [
    {
      chapter_key: 'vexas_syndrome',
      nonduplicate_predictions: [
        {
          label: 'Unprovoked thrombosis',
          status: 'present',
          sentence_id: 'p9_s1',
          evidence_text: 'Unprovoked thrombosis'
        },
        {
          label: 'Clonal hematopoiesis',
          status: 'present',
          sentence_id: 'p20_s1',
          evidence_text: 'Clonal hematopoiesis'
        }
      ]
    }
  ];

  const manualAudit = {
    chapters: [
      {
        chapter_key: 'vexas_syndrome',
        entries: [
          {
            sentence_id: 'p9_s1',
            evidence_text: 'Unprovoked thrombosis',
            bucket: 'useful_new'
          },
          {
            sentence_id: 'p27_s3',
            evidence_text: 'macrocytic anemia',
            bucket: 'useful_new'
          }
        ]
      }
    ]
  };

  const evaluation = evaluateGroundedExternalReportsAgainstManualAudit(reports, manualAudit);
  assert.equal(evaluation.total_chapters_evaluated, 1);
  assert.equal(evaluation.useful_new_target_total, 2);
  assert.equal(evaluation.matched_useful_new_total, 1);
  assert.equal(evaluation.useful_new_recall, 0.5);
  assert.equal(evaluation.chapter_reports[0].unmatched_predicted_candidates.length, 1);
});
