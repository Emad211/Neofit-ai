## NeoFit Nutrition Stage 4/10 completed — Vision + LLM identity pipeline

Head: `b1f2ff0c09e26710ef37ede39d650b74958dc83c`

- Text flow: local catalog first, LLM only after weak/no local match.
- Photo flow: explicit upload consent, on-device preparation, Vision identity candidates, local catalog resolution.
- Vision fallback: LLM may interpret Vision labels plus user wording when direct catalog mapping fails.
- Ambiguity: mixed plates, close alternatives, weak matches, low confidence and provider warnings require user confirmation.
- Nutrition authority: calories, macros, portions and ranges always come from the local IFKB/USDA catalog.
- LLM/Vision nutrition and invented amounts remain forbidden.
- Manual logging remains fully offline.

Mobile CI run `30677797117` (#538): success.

- deterministic tests: success
- 13,486-record audit: success
- 261-food dataset build: success
- Expo Doctor: success
- strict TypeScript: success
- Android export: success

Dataset artifact: `8811106671`
Digest: `sha256:c84d0b026d5616aef22e068aff09db10c8c2e853744b5795a79ab26f79eaec23`

PR remains Draft.
