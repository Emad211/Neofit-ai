```markdown
# Neofit-ai Development Patterns

> Auto-generated skill from repository analysis

## Overview

This skill teaches you the core development and data management patterns used in the Neofit-ai repository, a TypeScript-based project focused on structured data releases, ingestion pipelines, and research documentation. You'll learn the coding conventions, file organization, and step-by-step workflows for managing data releases, staging data, research logs, and documentation updates. This guide also covers test patterns and provides quick commands for common tasks.

## Coding Conventions

### File Naming

- **CamelCase** is used for file names.
  - Example: `dataIngestion.ts`, `releaseNotes.md`

### Import Style

- **Alias imports** are preferred.
  - Example:
    ```typescript
    import { processData } from '@utils/dataProcessor';
    ```

### Export Style

- **Mixed** (both named and default exports are used).
  - Named export:
    ```typescript
    export function processData() { ... }
    ```
  - Default export:
    ```typescript
    export default DataManager;
    ```

### Commit Patterns

- **Prefixes:** `feat`, `ci`, `data`, `docs`, `fix`
- **Message Example:** `feat: add manifest for v0.3 release`
- **Average Length:** ~51 characters

## Workflows

### Release Version Workflow

**Trigger:** When someone wants to publish a new IFKB data release version.  
**Command:** `/new-release`

1. Create a new `manifest.json` under `mobile/data/ifkb/releases/{version}/`.
2. Add or update `README.md`, `RELEASE_NOTES.md`, and/or `STATUS.md` under `releases/{version}/`.
3. Optionally, add `SUPERSEDED.md` if this release supersedes a previous one.
4. Update the main project `README.md` to reflect the new release.

**Example Directory Structure:**
```
mobile/data/ifkb/releases/0.3/
  ├── manifest.json
  ├── README.md
  ├── RELEASE_NOTES.md
  ├── STATUS.md
  └── SUPERSEDED.md (optional)
```

---

### Staging Data Ingestion Workflow

**Trigger:** When someone wants to ingest or update source data for a new or corrective release.  
**Command:** `/ingest-staging-data`

1. Add or update any of the following files under `mobile/data/ifkb/staging/{version}/`:
    - `source-observations.csv`
    - `qa-issues.csv`
    - `food-qa-summary.csv`
    - `selected-foundation-foods.csv`
    - `mobile-projection-candidates.csv`
2. If this is a corrective release, use a new sub-version (e.g., `0.2.1`, `0.5.1`).

**Example Directory Structure:**
```
mobile/data/ifkb/staging/0.3/
  ├── source-observations.csv
  ├── qa-issues.csv
  ├── food-qa-summary.csv
  ├── selected-foundation-foods.csv
  └── mobile-projection-candidates.csv
```

---

### Research Log and Summary Workflow

**Trigger:** When someone wants to document research outcomes or scientific review for a release.  
**Command:** `/log-research`

1. Add or update research log or summary files under `mobile/data/ifkb/research/research-log-v{version}.csv` or `mobile/data/ifkb/research/v{version}/`.
2. Include files such as:
    - `research-log-v{version}.csv`
    - `run-summary.md`
    - `scientific-review-summary.csv`
    - `variability-summary.csv`
    - `gap-resolution.csv`

**Example Directory Structure:**
```
mobile/data/ifkb/research/v0.3/
  ├── run-summary.md
  ├── scientific-review-summary.csv
  ├── variability-summary.csv
  └── gap-resolution.csv
```

---

### Documentation Update Workflow

**Trigger:** When someone wants to document a new release, pipeline, or workflow update.  
**Command:** `/update-docs`

1. Update or add `README.md` in the main data directory or under `pipelines/{pipeline}/`.
2. Add or update release notes, status, or roadmap files such as:
    - `RELEASE_NOTES.md`
    - `roadmap-to-v1.csv`

**Example Directory Structure:**
```
mobile/data/ifkb/
  ├── README.md
  ├── pipelines/
  │   └── {pipeline}/
  │       └── README.md
  └── releases/
      └── {version}/
          ├── RELEASE_NOTES.md
          └── roadmap-to-v1.csv
```

## Testing Patterns

- **Test Framework:** Unknown (not detected)
- **File Pattern:** Test files are named with the `.test.ts` suffix.
  - Example: `dataProcessor.test.ts`
- **Typical Structure:**
    ```typescript
    // dataProcessor.test.ts
    import { processData } from '@utils/dataProcessor';

    describe('processData', () => {
      it('should process input data correctly', () => {
        // test implementation
      });
    });
    ```

## Commands

| Command               | Purpose                                                        |
|-----------------------|----------------------------------------------------------------|
| /new-release          | Create and document a new data release version                 |
| /ingest-staging-data  | Add or update staging data files for a specific release        |
| /log-research         | Record research decisions, logs, and summaries for a release   |
| /update-docs          | Update documentation for new releases or workflow changes      |
```
