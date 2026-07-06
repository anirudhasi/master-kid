# Master-Kids v2 — Architecture Documentation

Generated during the v2 re-architecture sessions (July 2026). Reading order:

1. `../CLAUDE.md` — project context, seam rules, session protocol (lives at repo root)
2. `adr/ADR-000-architecture-style.md` — governing decision: modular monolith + strangler-fig
3. `00-FOUNDATION-ARCHITECTURE.md` — module registry (M1–M13 + S1), build sequence
4. `STAGE0-REORG-PLAN.md` — how existing code migrates into module seams
5. `modules/` — all module specs in stage order:
   M13 event bus → M1 identity → M12 notifications → M2 parent → M3 child →
   M9 commerce → M4 coach → M8 learning content → M6 discovery → M7 community →
   M5 school → M10 admin → M11 customer service → S1 intelligent layer

## Status board

| Doc | Status |
|---|---|
| ADR-000 | **Accepted** (2026-07-05) |
| Foundation architecture | Accepted with ADR-000 (annotated: M3/M8 ownership refinement) |
| Stage 0 re-org plan | Awaiting sign-off |
| M13 event bus · M1 identity · M12 notifications | Awaiting sign-off (Stage 1) |
| M2 parent · M3 child · M9 commerce | Awaiting sign-off (Stage 2) |
| M4 coach · M8 learning content | Awaiting sign-off (Stage 3) |
| M6 discovery · M7 community | Awaiting sign-off (Stage 4) |
| M5 school | Awaiting sign-off (Stage 5) |
| M10 admin · M11 customer service | Awaiting sign-off (Stage 6) |
| S1 intelligent layer | Awaiting sign-off (gated on M8 contract freeze) |

## Conventions

- New decisions → new numbered ADR in `adr/`. ADRs are immutable; supersede, don't edit.
- New module specs → `modules/M<n>-<name>.md`, using the same section structure as M1/M13.
- Update this status board as documents are signed off.
