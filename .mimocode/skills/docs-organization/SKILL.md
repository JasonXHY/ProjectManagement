---
name: docs-organization
description: Use when creating, moving, or organizing documentation files in the project. Ensures consistent directory structure, naming conventions, and index maintenance.
---

# Documentation Organization

This skill enforces the document organization methodology for PMAer.

## Directory Structure

```
docs/
├── 00-INDEX.md           # Agent navigation entry point
├── 01-specs/             # Requirements, specs, data models
├── 02-plans/             # Implementation plans (move to 03 when done)
├── 03-reports/           # Retrospectives, review reports
├── 04-guides/            # Dev guides, user manuals
├── 05-issues/            # Bug investigations, audits
├── 06-archive/           # Completed/historical documents
├── 99-mockups/           # HTML prototypes
└── screenshots/          # Screenshots
```

## Naming Convention

Format: `[date]-[type]-[brief].md`

Type codes:
- `spec` → 01-specs/
- `plan` → 02-plans/
- `report` → 03-reports/
- `guide` → 04-guides/
- `issue` → 05-issues/

## Rules

1. **Always check 00-INDEX.md first** before creating a new document
2. **Create in the correct directory** based on document type
3. **Rename to convention** if moving existing files
4. **Update 00-INDEX.md** after creating or moving any document
5. **Archive completed plans** — move from 02-plans/ to 03-reports/ when implementation is done

## Agent Workflow

1. Need to create a doc? → Check 00-INDEX.md for existing similar docs
2. Creating a spec? → 01-specs/
3. Creating a plan? → 02-plans/
4. Done implementing? → Move plan to 03-reports/
5. Found a bug? → 05-issues/
6. Bug fixed? → Move to 06-archive/

## Index Maintenance

After any file operation (create/move/delete), update `docs/00-INDEX.md`:
- Add new entry to the appropriate section
- Update "Last Updated" date
- Update file counts in directory listing
