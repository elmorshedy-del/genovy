## Integrity Findings 2026-03-26

This note captures the main structural failures uncovered during preservation and the hard corrections now in place.

### 1. Railway CLI drift was real

Problem:
- the canonical working clone path had no explicit Railway link
- Railway CLI inherited the parent-path mapping:
  - `/Users/ahmedelmorshedy -> just-grace`

Correction:
- the canonical working clone path was relinked explicitly to:
  - project: `invigorating-integrity`
  - environment: `genovy-v1-working-20260322`
  - service: `genovy`

### 2. Multiple DB lineages were mixed during analysis

This was the biggest audit correction.

Small lineage:
- `production` app DB
- `genovy-v0-freeze-20260322` app DB
- entity count: `81,870`
- no live ClinVar-derived gene-side bridge surface
- `U2AF2` had `0` subject relationships there

Large lineage:
- real Railway `genovy-v1-working-20260322` app DB
- entity count: `3,251,168`
- live ClinVar-derived bridge is present
- `U2AF2` has direct `associated_with_disease` edges there

Consequence:
- earlier small-lineage SQL was wrongly treated as if it described the real working DB
- any conclusions drawn from that assumption must be re-validated against the real `v1-working` lineage

### 3. Railway environment duplication is not enough as a DB backup

Created duplicate envs:
- `prod-pres-0326`
- `v0-pres-0326`
- `v1-pres-0326`

Finding:
- these are useful labeled app/config preservation copies
- but the app-selected DB service in those duplicate environments did not present the Genovy tables when queried

Therefore:
- the authoritative DB backups are the local compressed dumps in the backup root
- environment duplication alone must not be treated as a trusted DB snapshot

### 4. ClinVar bridge code was not erased

Confirmed:
- ClinVar bridge implementation is still in committed code history
- run54 post-ClinVar benchmark artifacts still exist
- the actual real `v1-working` DB still contains a large ClinVar-derived bridge surface

So the earlier fear that the ClinVar bridge had simply vanished was incorrect.

### 5. What actually regressed

The real regression was structural trust, not just code:
- ambiguous environment targeting
- split file state across two repos
- mixed DB lineages during audit
- local session continuity drift making it easier to lose the active frame

### 6. Hard rule from this point

Every benchmark/audit result must record:
- exact repo path
- exact git branch/commit
- exact Railway environment
- exact DB lineage
- exact output artifact path

No result is allowed to stand without those anchors.
