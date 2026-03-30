# MedGemma Anchor Metadata Prompt

Use this prompt only for anchor-level metadata extraction, not whole-chapter extraction.

## Goal

Given:
- one disease name
- one anchored phenotype label
- 1-4 local evidence sentences

Extract only:
- frequency
- onset
- progression
- treatment_response

Return `null` for any field that is not explicitly supported.

## System Prompt

```text
You are an expert medical geneticist and clinical data abstractor.

Your task is to extract metadata for ONE phenotype feature from GeneReviews-style text.

Rules:
- Use only the provided text.
- Do not infer beyond the text.
- If a field is not explicitly supported, return null.
- Distinguish disease-level progression from phenotype-specific progression.
- Distinguish treatment or management recommendations from true treatment response.
- Copy the exact supporting sentence for every non-null evidence field.
- If you cannot provide the exact supporting sentence for a field, set that field and its evidence to null.
- Do not wrap the answer in markdown fences.
- Output exactly one JSON object and nothing else.
```

## User Prompt Template

```json
{
  "disease_name": "Disease name here",
  "chapter_title": "Clinical Description",
  "phenotype_label": "Phenotype label here",
  "text": [
    "Sentence 1.",
    "Sentence 2.",
    "Sentence 3."
  ],
  "task": "Extract metadata for the phenotype label only. Return exactly one JSON object with these keys: phenotype_label, frequency_raw, frequency_normalized, onset_raw, onset_normalized, progression_raw, treatment_response_raw, evidence_frequency, evidence_onset, evidence_progression, evidence_treatment_response."
}
```

## Expected Output Shape

```json
{
  "phenotype_label": "Seizure",
  "frequency_raw": "approximately 70% of affected individuals",
  "frequency_normalized": "70%",
  "onset_raw": "usually in infancy, between three and nine months of age",
  "onset_normalized": "infancy (3-9 months)",
  "progression_raw": "often progresses from focal seizures to generalized tonic-clonic seizures and may become more frequent over time",
  "treatment_response_raw": "frequently drug-resistant, although some individuals achieve partial control with valproate",
  "evidence_frequency": "Seizures occur in approximately 70% of affected individuals.",
  "evidence_onset": "Onset is usually in infancy, between three and nine months of age.",
  "evidence_progression": "The seizure disorder often progresses from focal seizures to generalized tonic-clonic seizures and may become more frequent over time.",
  "evidence_treatment_response": "Seizures are frequently drug-resistant, although some individuals achieve partial control with valproate."
}
```

## Smoke Test Findings

Two live endpoint probes were run against `google/medgemma-27b-it`.

### Test 1: Clean synthetic case

Input contained explicit:
- `70%` frequency
- `infancy` onset
- explicit progression
- explicit treatment response

Result:
- correct field extraction
- correct evidence extraction
- but returned markdown code fences

### Test 2: Harder mixed case

Input mixed:
- general management recommendations
- phenotype-specific frequency/onset
- disease-level progression
- phenotype-specific progression
- phenotype-specific treatment response

Result:
- correctly ignored general management guidance
- correctly kept phenotype-specific progression and treatment response
- but still had two production issues:
  - `frequency_normalized` came back as `0.3` instead of `30%`
  - evidence fields came back as `"text"` instead of the exact supporting sentence
  - response was wrapped in markdown code fences again

### Test 3: Stricter prompt with evidence guardrails

Prompt changes:
- explicitly required `EXACTLY one valid JSON object`
- explicitly banned markdown fences
- explicitly required exact supporting sentences
- explicitly required percentages to stay percentages

Result:
- `frequency_normalized` improved to `30%`
- exact evidence sentences were returned correctly
- phenotype-specific progression and treatment response were still extracted correctly
- the only remaining formatting issue was markdown code fences

Example returned values:
- `frequency_normalized = "30%"`
- `evidence_frequency = "Seizures occur in about 30% of affected children and usually begin in late infancy."`
- `treatment_response_raw = "usually responsive to levetiracetam"`

## Plug-In Decision

Do not plug MedGemma directly into the pipeline with the raw endpoint output yet.

It is now good enough to test as an anchor-level metadata model, but only with:
- stronger prompt constraints
- JSON cleanup that strips markdown fences
- post-validation that rejects placeholder evidence like `"text"` if they reappear
- deterministic normalization for frequency/onset after model extraction

Recommended use:
- keep deterministic frequency/onset extraction first
- use MedGemma only as fallback for missing anchor-level metadata
- reject any response that does not provide exact evidence sentences
