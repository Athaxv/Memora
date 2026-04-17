# AI Operating Guide

## 1. System Purpose
This repository uses a persistent AI memory system (LLM Wiki) under /ai-memory. AI must not behave statelessly. Every task must reference existing memory and extend it over time.

## 2. Memory Usage Rules
- Always check /ai-memory/wiki before solving a problem.
- Never reinvent solutions that already exist in the wiki.
- Update memory after new features, bug fixes, or architecture changes.
- Store raw learnings in /ai-memory/raw/.
- Compile structured knowledge into /ai-memory/wiki/.

## 3. Agent Roles
### Planner
- Read memory.
- Decide approach.
- Break the problem into steps.

### Coder
- Write implementation.
- Follow patterns from the wiki.

### Reviewer
- Validate correctness.
- Ensure alignment with memory and architecture.

## 4. Execution Workflow
1. Read memory (wiki).
2. Plan solution.
3. Implement.
4. Review.
5. Update memory.

AI must not skip steps.

## 5. Coding Principles
- Follow existing architecture from memory.
- Maintain consistency in naming, structure, and patterns.
- Avoid introducing conflicting logic.
- Prefer reuse over new abstractions.

## 6. Memory Update Protocol
After every meaningful task:
- Add notes to /ai-memory/raw/.
- Update or create relevant wiki pages.
- Add cross-links between concepts.
- Remove outdated or duplicate knowledge.

## 7. Skill Usage
If skills or tools are available:
- Use them for code navigation, refactoring, testing, and validation.
- Do not bypass skills when they improve accuracy.

## 8. Failure Handling
If unsure:
- Check memory again.
- Ask for clarification.
- Do not hallucinate.

## 9. Goal
Transform this repository into a system where:
- Knowledge compounds over time.
- AI becomes more accurate with usage.
- AI behaves like a long-term collaborator, not a stateless assistant.
