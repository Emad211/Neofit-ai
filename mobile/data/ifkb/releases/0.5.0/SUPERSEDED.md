# IFKB 0.5.0 superseded by 0.5.1

A final cross-artifact audit found that the v0.5.0 mobile/research projection hardcoded `B-candidate` for all 27 source-complete records.

This did **not** affect:

- FDC IDs
- source nutrient observations
- sample or laboratory results
- food attributes
- conversion factors
- automated QA findings

The error affected only the provisional evidence-grade label. Under the IFKB rubric:

- match-quality `A` may be labelled `B-candidate`
- documented close match-quality `C` may not exceed `C-candidate`

Release 0.5.1 corrects the distribution to 18 B-candidates and 9 C-candidates. Release 0.5.0 is retained for audit and must not be used for projection.
