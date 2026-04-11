# Gemini 11-20 Handoff

Date: 2026-04-08

## Purpose

Train Gemini in parallel on the same `11-20` continuation surface as the Opus-compatible path, but with stricter instructions.

Gemini should target the same output schema so the two accounts remain comparable and interchangeable downstream.

## Exact `hard20` entries 11-20

Source fixture:
- [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/stage3DiscoveryBenchmarkDevHard20.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/stage3DiscoveryBenchmarkDevHard20.json)

Entries:

1. `disc-067` — `Dravet Syndrome`
2. `disc-068` — `ZAP70-Related Combined Immunodeficiency`
3. `disc-069` — `PTEN Hamartoma Tumor Syndrome`
4. `disc-070` — `Coffin-Siris Syndrome`
5. `disc-077` — `Congenital Disorder of Glycosylation Type Ia`
6. `disc-080` — `Dense Lab and Treatment Paragraph`
7. `disc-081` — `Neonatal Presentation Edge Case`
8. `disc-082` — `Minimal New Findings Edge Case`
9. `disc-084` — `Heavy Gene and Variant Paragraph`
10. `disc-100` — `Kitchen Sink Stress Test`

Real disease chapters:
- `11-15`

Synthetic benchmark stress cases:
- `16-20`

## Core requirement

Gemini should use the same outer shape as the Opus-compatible `11-20` handoff:

- keep top-level `chapter`
- keep top-level `phenotypes.present / excluded / uncertain`
- keep top-level `ancillary_clinical_evidence`
- keep top-level `context_metadata`
- keep top-level `context_notes`
- keep phenotype `label`
- add `clinical_role`
- add `evidence_refs`
- add `qualifiers`
- add `context_evidence_refs`

This keeps Gemini aligned with the real trained `1-10` Opus batch while adding grounded evidence pointers.

## Input to Gemini

Do not ask Gemini to split or number sentences.

Pre-index the source deterministically in code and provide:
- chapter metadata
- section headings
- numbered sentence index

Example input surface:

```json
{
  "chapter": {
    "title": "Dravet Syndrome: An Overview",
    "source": "Cureus",
    "source_url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC6713249/",
    "source_date": "2019-06-26"
  },
  "sentence_index": [
    {
      "sentence_id": "S1",
      "section": "Introduction and background",
      "text": "Dravet syndrome is a rare form of early-onset genetic epilepsy syndrome."
    },
    {
      "sentence_id": "S2",
      "section": "Clinical presentation",
      "text": "Main symptoms are refractory seizures, developmental delay, cognitive impairment and motor dysfunction."
    }
  ]
}
```

## Canonical splitter logic

If Gemini is asked to generate, mirror, or reason about the preprocessing code, hand it the canonical splitter logic instead of letting it invent a new one.

Canonical implementation:
- [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/lib/genereviewsPipeline.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/lib/genereviewsPipeline.js)

Relevant functions:
- `splitSentenceEntries(text, baseOffset = 0)`
- `splitParagraphEntries(text)`
- `buildClinicalTextStructureFromSections(sections)`

Splitter rules:
- first-pass boundary regex:
  - `/(?<=[.!?])\s+(?=[A-Z0-9])/g`
- then apply deterministic merge repair for non-terminal abbreviations

Current abbreviation repair policy:
- merge a provisional sentence with the next one if the left fragment is short and ends with a non-terminal abbreviation
- supported non-terminal abbreviations include:
  - `U.S.`
  - `U.K.`
  - `Mr.`
  - `Mrs.`
  - `Ms.`
  - `Dr.`
  - `Prof.`
  - `Sr.`
  - `Jr.`
  - `vs.`
  - `No.`
  - `Fig.`
  - `Eq.`
  - `Ref.`

Canonical ID/output rules:
- paragraph IDs:
  - `p1`
  - `p2`
- sentence IDs:
  - `p1_s1`
  - `p1_s2`
  - `p2_s1`
- preserve:
  - `section_id`
  - `section_heading`
  - `paragraph_id`
  - `char_start`
  - `char_end`

Gemini should follow this preprocessing contract if it is asked to code the sentence indexer.

## Target schema

```json
{
  "chapter": {
    "nbk_id": "string|null",
    "title": "string",
    "mode": "discovery",
    "source": "string|null",
    "source_url": "string|null",
    "source_date": "string|null"
  },
  "phenotypes": {
    "present": [
      {
        "label": "string",
        "clinical_role": "primary | complication | descriptor",
        "evidence_refs": ["S1"],
        "qualifiers": {
          "onset": "string | null",
          "frequency": "string | null",
          "severity": "string | null",
          "progression": "string | null",
          "trigger": "string | null",
          "treatment_response": "string | null",
          "pathophysiology": "string | null",
          "laterality": "string | null",
          "distribution": "string | null",
          "anatomical_site": "string | null",
          "morphology": "string | null",
          "subtype_context": "string | null"
        }
      }
    ],
    "excluded": [
      {
        "label": "string",
        "clinical_role": "primary | complication | descriptor",
        "evidence_refs": ["S2"],
        "qualifiers": {
          "onset": "string | null",
          "frequency": "string | null",
          "severity": "string | null",
          "progression": "string | null",
          "trigger": "string | null",
          "treatment_response": "string | null",
          "pathophysiology": "string | null",
          "laterality": "string | null",
          "distribution": "string | null",
          "anatomical_site": "string | null",
          "morphology": "string | null",
          "subtype_context": "string | null"
        }
      }
    ],
    "uncertain": [
      {
        "label": "string",
        "clinical_role": "primary | complication | descriptor",
        "evidence_refs": ["S3"],
        "qualifiers": {
          "onset": "string | null",
          "frequency": "string | null",
          "severity": "string | null",
          "progression": "string | null",
          "trigger": "string | null",
          "treatment_response": "string | null",
          "pathophysiology": "string | null",
          "laterality": "string | null",
          "distribution": "string | null",
          "anatomical_site": "string | null",
          "morphology": "string | null",
          "subtype_context": "string | null"
        }
      }
    ]
  },
  "ancillary_clinical_evidence": {
    "laboratory": [
      {
        "finding": "string",
        "assertion": "present | absent | uncertain",
        "evidence_refs": ["S7"]
      }
    ],
    "imaging": [],
    "pathology": [],
    "electrophysiology": [],
    "treatment_response": [],
    "clinical_test": [],
    "management_context": [],
    "other": []
  },
  "context_metadata": {
    "onset": "string",
    "inheritance": "string",
    "gene": "string",
    "prevalence": "string",
    "prognosis": "string",
    "natural_history": "string",
    "family_risk": "string",
    "founder_variant": "string",
    "biomarker": "string",
    "therapeutic_landscape": "string"
  },
  "context_evidence_refs": {
    "onset": ["S10"],
    "inheritance": ["S11"],
    "gene": ["S12"],
    "prevalence": ["S13"],
    "prognosis": ["S14"],
    "natural_history": ["S15"],
    "family_risk": ["S16"],
    "founder_variant": [],
    "biomarker": [],
    "therapeutic_landscape": ["S17"]
  },
  "context_notes": []
}
```

## Gemini-specific strict rules

Gemini needs tighter instructions than Opus. Use these rules explicitly:

1. Return JSON only.
2. Return one JSON object only.
3. Do not wrap the JSON in markdown.
4. Do not add commentary before or after the JSON.
5. Use exactly the keys shown in the schema.
6. Do not invent sentence IDs.
7. Use only sentence IDs that appear in the provided `sentence_index`.
8. Every phenotype row must include at least one `evidence_refs` entry.
9. Use exactly one `evidence_refs` entry by default.
10. Use multiple `evidence_refs` only when one claim truly requires more than one sentence.
11. Do not merge different time periods, trigger contexts, or disease phases into one qualifier string unless the source explicitly presents them as one claim.
12. Prefer omission over speculation.
13. Keep qualifiers short and source-faithful.
14. Do not generate `source_quote`, `source_section`, `evidence_scope`, or location objects.
15. Do not copy the sentence text into the output.
16. `label` should be a concise clinical finding, not a full sentence.
17. Do not use mortality or outcome language as `severity`.
18. Use `clinical_role=complication` for complications and mortality causes that are not primary syndrome-defining phenotype edges.
19. Use `clinical_role=descriptor` when the item is a feature of another finding rather than an independent phenotype edge.
20. If a finding belongs in ancillary evidence or disease context rather than a phenotype row, move it there.

## Common Gemini failure modes to prevent

### Over-merging evidence

Bad:
- one row uses `S38` and `S40` to synthesize a long onset string across two disease phases

Good:
- use one sentence by default
- split into separate rows if the source clearly supports separate clinical statements

### Over-interpreting severity

Bad:
- `severity: "common cause of death"`

Good:
- move mortality/outcome framing into:
  - `clinical_role=complication`
  - `context_metadata.prognosis`
  - `context_notes` if needed

### Promoting descriptors to primary phenotypes

Bad:
- every subcomponent of a broader cognitive or seizure statement becomes an independent primary edge

Good:
- use `clinical_role=descriptor` when the item is clearly part of another finding

### Mixing phenotype and ancillary evidence

Bad:
- putting `MRI typically normal` in phenotypes
- putting drug approval statements in phenotypes

Good:
- imaging stays in `ancillary_clinical_evidence.imaging`
- treatment approval and therapy lines stay in:
  - `ancillary_clinical_evidence.treatment_response`
  - `ancillary_clinical_evidence.management_context`
  - `context_metadata.therapeutic_landscape`

## Exact qualifier mapping

- age or timing detail
  - `qualifiers.onset`
- recurrent / progressive / episodic / worsening / improving detail
  - `qualifiers.progression`
- trigger detail like fever / exercise / lights
  - `qualifiers.trigger`
- mild / severe / marked / profound detail
  - `qualifiers.severity`
- refractory / responsive / drug-resistant detail
  - `qualifiers.treatment_response`
- left / right / bilateral / asymmetric detail
  - `qualifiers.laterality`
- proximal / distal / focal / diffuse detail
  - `qualifiers.distribution`
- lower-limb / retina / hearing / craniofacial subsite detail
  - `qualifiers.anatomical_site`
- shape / structural appearance detail
  - `qualifiers.morphology`
- subtype wording
  - `qualifiers.subtype_context`
- explicit mechanism wording
  - `qualifiers.pathophysiology`

## Copy-paste Gemini prompt

```text
You are extracting structured rare-disease chapter data from sentence-indexed clinical text.

You will receive:
- chapter metadata
- section-aware numbered sentences in `sentence_index`

Your job is to return ONE JSON object matching the exact schema shown below.

CRITICAL OUTPUT RULES
- Return JSON only.
- Return one JSON object only.
- Do not use markdown.
- Do not include any explanation outside the JSON.
- Use exactly the keys shown in the schema.
- Do not invent sentence IDs.
- Use only `evidence_refs` that exist in the provided `sentence_index`.
- Do not output `source_quote`, `source_section`, `evidence_scope`, or location objects.
- Do not copy sentence text into the output.

SCHEMA
{
  "chapter": {
    "nbk_id": "string|null",
    "title": "string",
    "mode": "discovery",
    "source": "string|null",
    "source_url": "string|null",
    "source_date": "string|null"
  },
  "phenotypes": {
    "present": [
      {
        "label": "string",
        "clinical_role": "primary | complication | descriptor",
        "evidence_refs": ["S1"],
        "qualifiers": {
          "onset": "string | null",
          "frequency": "string | null",
          "severity": "string | null",
          "progression": "string | null",
          "trigger": "string | null",
          "treatment_response": "string | null",
          "pathophysiology": "string | null",
          "laterality": "string | null",
          "distribution": "string | null",
          "anatomical_site": "string | null",
          "morphology": "string | null",
          "subtype_context": "string | null"
        }
      }
    ],
    "excluded": [],
    "uncertain": []
  },
  "ancillary_clinical_evidence": {
    "laboratory": [],
    "imaging": [],
    "pathology": [],
    "electrophysiology": [],
    "treatment_response": [],
    "clinical_test": [],
    "management_context": [],
    "other": []
  },
  "context_metadata": {
    "onset": "string",
    "inheritance": "string",
    "gene": "string",
    "prevalence": "string",
    "prognosis": "string",
    "natural_history": "string",
    "family_risk": "string",
    "founder_variant": "string",
    "biomarker": "string",
    "therapeutic_landscape": "string"
  },
  "context_evidence_refs": {
    "onset": [],
    "inheritance": [],
    "gene": [],
    "prevalence": [],
    "prognosis": [],
    "natural_history": [],
    "family_risk": [],
    "founder_variant": [],
    "biomarker": [],
    "therapeutic_landscape": []
  },
  "context_notes": []
}

PHENOTYPE RULES
- Keep the old outer schema shape:
  - `phenotypes.present`
  - `phenotypes.excluded`
  - `phenotypes.uncertain`
- One phenotype finding per row.
- `label` should be a concise clinical finding, not a copied sentence.
- Every phenotype row must have at least one `evidence_refs` entry.
- Use exactly one `evidence_refs` entry by default.
- Use multiple `evidence_refs` only when one claim truly requires more than one sentence.
- Keep qualifiers short and source-faithful.
- Do not merge different time periods, trigger contexts, or disease phases into one qualifier string unless the source explicitly presents them as one claim.
- Use:
  - `clinical_role=primary` for independent syndrome-defining phenotype findings
  - `clinical_role=complication` for complications or mortality causes
  - `clinical_role=descriptor` for features of another finding rather than independent phenotype edges
- Do not put mortality/outcome language into `severity`.

QUALIFIER MAPPING
- age or timing -> `onset`
- progression / recurrent / episodic / worsening / improving -> `progression`
- fever / exercise / lights / stress triggers -> `trigger`
- mild / severe / marked / profound -> `severity`
- refractory / responsive / drug-resistant -> `treatment_response`
- left / right / bilateral / asymmetric -> `laterality`
- proximal / distal / focal / diffuse -> `distribution`
- more precise body location -> `anatomical_site`
- shape or appearance -> `morphology`
- subtype wording -> `subtype_context`
- explicit mechanism wording -> `pathophysiology`

ANCILLARY RULES
- Non-phenotype evidence belongs in `ancillary_clinical_evidence`.
- Each ancillary entry must be an object with:
  - `finding`
  - `assertion`
  - `evidence_refs`
- Use ancillary buckets for lab, imaging, electrophysiology, pathology, clinical tests, treatment response, management context, and other non-phenotype evidence.

CONTEXT RULES
- Keep `context_metadata` values concise.
- Every populated `context_metadata` key should have matching `context_evidence_refs`.
- Use `context_notes` only for short high-value caveats.

QUALITY BAR
- Prefer omission over speculation.
- Do not invent evidence.
- Do not invent sentence IDs.
- Do not invent qualifiers unsupported by the evidence sentence.
- Keep the output reviewable, stable, and schema-exact.
```

## Shortest Gemini instruction

If a shorter prompt is needed, the minimum safe instruction is:

- keep the Opus-compatible outer schema
- add `clinical_role`, `evidence_refs`, `qualifiers`, and `context_evidence_refs`
- use only provided sentence IDs
- default to one evidence ref per row
- do not output quote/location fields
- keep qualifiers short and source-faithful
- prefer omission over speculation

## Splitter delta for Gemini

If Gemini also needs the preprocessing brief, append this:

```text
Use the canonical Genovy splitter logic.

- Split first on /(?<=[.!?])\s+(?=[A-Z0-9])/g
- Then repair bad abbreviation splits deterministically
- Merge fragments ending in short non-terminal abbreviations like:
  - U.S.
  - U.K.
  - Dr.
  - Mr.
  - Mrs.
  - Ms.
  - Prof.
  - Jr.
  - Sr.
  - vs.
  - No.
  - Fig.
  - Eq.
  - Ref.
- Emit paragraph-aware sentence IDs like p1_s1, p1_s2, p2_s1
- Preserve section_id, section_heading, paragraph_id, char_start, and char_end
- Do not invent a different splitting strategy
```
