# Design QA

- Source visual truth: `/Users/ching/.codex/generated_images/01a1bf59-be4e-7eb1-8282-00beed8f225b/exec-4929fab4-0637-45b4-a40d-5a8d4602623f.png`
- Implementation: `http://localhost:4173/`
- Desktop comparison viewport: default in-app browser viewport, approximately 1012 × 900 CSS px, DPR 1
- Responsive check viewport: 390 × 844 CSS px, DPR 1
- Source pixels: 1488 × 1058
- State compared: initial order brief; additional functional evidence captured at final settlement
- Density normalization: composition compared by relative regions because the source and implementation use different landscape viewport proportions

**Full-view comparison evidence**

The implementation preserves the selected concept's four primary regions: slim resource header, order/workshop hero, restrained ledger surface, and full-width rose action. It also preserves the dark charcoal-green surfaces, rose/mint accent discipline, lightweight Traditional Chinese display typography, tabular figures, and documentary bamboo craft imagery. The implementation intentionally replaces the static mock ledger with a playable order brief because the selected visual is the opening state of a multi-step game.

**Focused region comparison evidence**

- Hero: large two-line serif title, short mint rule, editorial body copy, and large rose countdown/size figures match the source hierarchy.
- Order panel: rose price, fine row dividers, muted labels, and dark raised surface match the source component anatomy.
- Header: live resources use lightweight icons, compact labels, and tabular figures without pure-black borders.
- Primary action: full-width rose bar remains visually dominant and keyboard focus uses a double-ring shadow.
- Settlement: tested through all six decisions; progressive ledger reveal displays income, direct costs, operating surplus, owner labour, overhead, economic profit, margin, and accounting verification.

**Required fidelity surfaces**

- Fonts and typography: Noto Serif TC and Noto Sans TC provide an appropriate two-family match. Dark-theme weights remain 300–400; display and body wrapping are readable.
- Spacing and layout rhythm: desktop two-column hero and decision layouts retain generous whitespace; the 390 px layout collapses without horizontal body overflow.
- Colors and visual tokens: four non-black surfaces differ by 1–3% lightness; mint and rose remain semantic and restrained.
- Image quality and asset fidelity: dedicated generated documentary photograph is sharp, correctly cropped, locally stored, and matches the reference art direction.
- Copy and content: Traditional Chinese terminology follows the canonical accounting vocabulary; disclosures identify mocked commercial and non-medical game data.

**Interaction and accessibility evidence**

- Primary journey tested: accept order → price → craft method → staffing → production → change request → installation → settlement.
- Three-order opening tested: each order loads its own price, deposit, material, labour, logistics, workshop-hour baseline, and dynamically recalculated quote choices.
- Bamboo-tying labour interaction tested: four documentary image cards guide the player through aligning bamboo, wrapping cord, tightening the knot, and checking the joint, with locked/current/completed states and responsive layouts.
- Installation labour interaction tested: six documentary image cards show coordinated transport and positioning of the dragon column, phoenix top, signboard, side frames, and lighting rig without claiming fictional weights or calorie expenditure.
- Decision feedback tested: every business choice now pauses on a plain-language result card before advancing, with monetary, time, energy, craft, safety, and inheritance changes shown explicitly.
- Labour judgment tested: image cards are shuffled, the requested task is stated, incorrect selections explain the expected action, and attempts are counted without changing the accounting ledger.
- Apprentice perspective tested: the separate teaching scenario reconciles workdays, allowances, paid and unpaid hours, effective hourly income, living-cost assumption, and month-end balance without mixing those figures into the canonical order ledger.
- Ending causality tested: the final screen lists each selected decision and its recorded effects in order.
- Immersion pass tested: optional interface tones remain off by default, incorrect labour selections deduct one energy point without changing the ledger, and late-stage background treatment reflects night work and low energy.
- Ending pacing tested: the long ending is split into order result, annual pressure, and decision review scenes with distinct transitions.
- Modal reliability tested: apprentice and reflection dialogs render through the document portal, remain visible from a scrolled ending, trap keyboard focus, close from the visible control or backdrop, and restore focus on exit.
- Labour experiences tested: four ordered bamboo-binding targets and six ordered carrying/positioning targets gate the relevant decisions without changing medical or accounting data.
- Ending tested: annual revenue, direct costs, owner labour, twelve months of fixed costs, contribution per order, break-even annual order count, and monthly equivalent are visible and recalculated by the canonical accounting engine.
- Reflection tested: three animated modal questions appear sequentially and end with a local-only response summary.
- Radio decisions expose `role="radio"` and `aria-checked`; progress navigation is labelled.
- Keyboard focus has no outline and uses the required deep double-ring shadow.
- `prefers-reduced-motion` is supported.
- Browser console: no warnings or errors observed.

**Comparison history**

- Initial pass: final settlement's annual projection reused per-order economic profit and then subtracted only four additional months, which could conflict with the canonical annual model.
- Fix: annual projection now recalculates annual revenue, annual direct costs, annual owner labour, and twelve months of actual fixed costs; per-order overhead allocation is not reused.
- Post-fix evidence: accounting unit tests, production build, and Sites worker tests all pass.

**Findings**

No actionable P0, P1, or P2 design differences remain. The implementation expands the selected static concept into the requested playable flow while preserving its visual hierarchy.

**Follow-up Polish**

- P3: a future pass could add per-character 30 ms stagger to selected narrative passages; the current screen-level blur reveal already preserves readability and reduced-motion behavior.

final result: passed
