# RERE Behavior Diagnostic Shadow

Created: 2026-03-27T02:56:49.761Z

Case: PMID_29330883_Subject9

## Baseline

- Truth rank: 237
- Truth gene: RERE
- Top-1 gene: MED13

## Scenarios

### Remove Wrong-Side ADHD Only

Diagnostic shadow that removes the MED13 ADHD term, which was acting as a weak semantic fallback for compulsive behavior.

- Added to RERE: none
- Removed from MED13: HP:0007018
- Truth rank: 237
- Top-1 gene: MED13

### Add Right-Side Compulsive Behavior Only

Diagnostic shadow that adds exact compulsive behavior to the RERE disease branch without changing the outranker branch.

- Added to RERE: Compulsive behaviors
- Removed from MED13: none
- Truth rank: 209
- Top-1 gene: MED13

### Remove Wrong Side And Add Right Side

Diagnostic shadow that removes MED13 ADHD and adds exact compulsive behavior to the RERE disease branch.

- Added to RERE: Compulsive behaviors
- Removed from MED13: HP:0007018
- Truth rank: 209
- Top-1 gene: MED13

