# 2026-03-22 Phase 1 Identity-Repair Sweep

## Question

How many repaired genes actually matched the feared `U2AF2` pattern of “canonical identity exists, but no disease or phenotype evidence is attached”?

## Lineage

- small working clone lineage at the time:
  - `81,870` entities
- environment:
  - `genovy-v1-working-20260322`

## Files generated together

- [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/identity-repair-sweep-phase1-20260322.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/identity-repair-sweep-phase1-20260322.md)

## Result

At that lineage:

- repaired genes identified: `2`
- empty shell genes: `1`
- fully connected repaired genes: `1`
- `U2AF2` looked like the only true empty shell
- `RPGRIP1` was healthy

## Why it matters

This was a correct finding for the small lineage that was being queried at the time, but it was later over-generalized. After the DB lineage correction, real `v1-working` showed that `U2AF2` was not empty there.

So this experiment remains useful, but only with the lineage caveat attached.

## Status

- `superseded in part by later lineage correction`
