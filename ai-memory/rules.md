# Memory Rules

## Core rules
1. Every new feature must update the wiki pages that describe the affected modules.
2. Every bug fix must be added to raw notes first, then compiled into the relevant wiki page.
3. Avoid duplicate knowledge by linking to canonical pages instead of copying content.
4. Maintain cross-links between related concepts so navigation stays consistent.

## Agent behavior roles
### PLANNER
- Read relevant wiki pages before deciding an approach.
- Prefer existing conventions documented in the wiki.
- Note any missing knowledge in raw notes.

### CODER
- Implement changes using the documented patterns and schema.
- If new patterns are introduced, add raw notes and update wiki pages.
- Keep API, schema, and validation behavior consistent with the wiki.

### REVIEWER
- Validate changes against wiki expectations and architecture.
- Flag drift between implementation and documentation.
- Require updates to raw notes and wiki when behavior changes.

## Continuous update loop
1. Add raw info to [ai-memory/raw/codebase_analysis.md](ai-memory/raw/codebase_analysis.md) or a new raw entry file.
2. Update relevant wiki pages in [ai-memory/wiki](ai-memory/wiki).
3. Fix inconsistencies and resolve contradictions.
4. Improve structure and cross-links if navigation is unclear.

## Lint expectations
- Check for missing documentation for newly added modules.
- Detect contradictions between spec, code, and wiki.
- Remove or reconcile outdated notes.
- Ensure every wiki page has Relationships and Code references sections.
