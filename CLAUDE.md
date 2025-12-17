# Claude Code Guidelines for FlowTrails

> **Meta-instruction**: This file is a living document. Claude should actively help build it out based on patterns observed in conversations. When the user expresses a general policy, preference, or recurring frustration, Claude should ask: *"Would you like me to add this to CLAUDE.md so future sessions follow this pattern?"*

---

## Overview

FlowTrails is a video effect processing application designed to:
- **Standalone mode**: Operate as a full independent application
- **Integration mode**: Function as a feature module within TKA-SCRIBE

The architecture follows TKA-SCRIBE patterns exactly to enable seamless integration.

---

## File Size & Composition Philosophy

This project follows a **2025+ AI-assisted development approach**:

- **Prefer small, single-responsibility files** (20-80 lines typical, 150 max for components)
- **Composition over consolidation** - build features by composing small primitives
- **Don't warn about "too many files"** - AI navigation makes file count a non-issue
- **Each component should do ONE thing completely**
- **Extract aggressively** - if a component has multiple responsibilities, split it

### File Size Guidelines:
- **Components**: 20-150 lines
- **Services**: 80-200 lines
- **State factories**: 80-200 lines
- **Contracts/Interfaces**: 20-80 lines

### What's NOT a good split:
- Re-export files that just forward imports
- Wrapper components that add no logic
- Splitting cohesive logic across files just to reduce line count

---

## Technical Stack & Patterns

### Svelte 5
- Use **runes** (`$state`, `$derived`, `$effect`) not legacy reactive syntax
- Use `$props()` with TypeScript interfaces
- Prefer `$derived` over `$effect` when computing values
- Use `$derived.by()` for complex multi-line computations

### State Management
- Use **context + runes** for shared state, not stores
- Services resolved via InversifyJS DI container
- State factories return getter properties for encapsulation

### Dependency Injection
- **Service-to-service**: Constructor injection with `@inject()`
- **Component-to-service**: `resolve(TYPES.X)` at component boundary
- **Never** instantiate services directly with `new` in components

### Module Structure
```
module/
├── components/           # Svelte components (≤150 lines each)
├── domain/
│   ├── types.ts         # TypeScript interfaces
│   ├── models.ts        # Domain objects, constants
│   └── index.ts         # Barrel export
├── services/
│   ├── contracts/       # Interfaces only (I*.ts)
│   └── implementations/ # Service classes
├── state/               # Svelte 5 rune-based state (.svelte.ts)
└── index.ts             # Public exports (no implementations!)
```

### Styling
- Component-scoped `<style>` blocks
- CSS custom properties for design tokens
- Container queries (`cqw`, `cqh`) for component-relative sizing
- Mobile-first with progressive enhancement

---

## Feedback & Release Workflow

Full workflow documentation: `docs/FEEDBACK-WORKFLOW.md`

### Quick Reference:
- **4 statuses**: `new → in-progress → completed → archived`
- **Kanban phase** (new → in-progress): Active development
- **Staging phase** (completed): Items ready for next release
- **Release phase** (archived + fixedInVersion): Released and versioned

### Key Commands:
- `/fb` - Claim and work on feedback
- `/done` - Auto-create feedback for work just completed
- `node fetch-feedback.js` - CLI feedback management
- `node scripts/submit-feedback.js` - Submit new feedback

### /fb Command Behavior
When running `/fb`:
1. Display feedback verbatim before any analysis
2. Assess complexity (TRIVIAL/MEDIUM/COMPLEX)
3. Get user approval before implementing
4. Provide testing instructions when complete

### /done Command Behavior
When `/done` is called without matching feedback:
1. Auto-create a feedback item
2. Auto-complete it immediately
3. Mark internal-only if infrastructure work
4. Do NOT ask for confirmation - just do it

---

## Project-Specific Notes

- FlowTrails is a Svelte 5 + TypeScript application
- Uses InversifyJS for dependency injection
- WebGPU/WebGL render pipeline for video effects
- Focus on LED detection and trail effect processing

### User Identity
- **Primary developer**: Austen Cloud (austencloud@gmail.com)
- When submitting feedback via scripts, default to `--user austen`

### Integration with TKA-SCRIBE
When integrating as a TKA-SCRIBE feature:
- Place in `features/flowtrails/`
- Namespace DI types: `TYPES.FlowTrails.*`
- Use `FlowTrailsModule.svelte` as entry point

---

## Conversation Patterns

### When Claude should proactively ask about updating this file:
- User expresses frustration about Claude repeatedly doing something wrong
- User states a general principle ("I always want...", "Never do...", "My preference is...")
- User corrects Claude on an architectural decision
- A pattern emerges across multiple requests

---

*Last updated: 2025-12-16*
