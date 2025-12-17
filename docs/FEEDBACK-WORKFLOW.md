# FlowTrails Feedback Workflow

This document describes the feedback-to-release pipeline for FlowTrails.

---

## Overview

The feedback system uses a **4-status Kanban workflow**:

```
new → in-progress → completed → archived
```

- **Kanban Phase**: Active development (new → in-progress)
- **Staging Phase**: Ready for release (completed)
- **Release Phase**: Shipped (archived + fixedInVersion)

---

## Statuses

| Status | Meaning |
|--------|---------|
| `new` | Unclaimed, ready to pick up |
| `in-progress` | Agent is actively working on it |
| `completed` | Done, staged for next release |
| `archived` | Released or declined |

---

## Commands

### CLI Commands

```bash
# Claim next feedback item (priority order)
node fetch-feedback.js

# List all feedback with queue status
node fetch-feedback.js list

# View specific item
node fetch-feedback.js <id>

# Update status with notes
node fetch-feedback.js <id> <status> "notes"

# Update priority
node fetch-feedback.js <id> priority <low|medium|high>

# Submit new feedback
node scripts/submit-feedback.js "Title" "Description" --type bug --priority high
```

### Slash Commands

| Command | Purpose |
|---------|---------|
| `/fb` | Claim and work on next feedback item |
| `/done` | Auto-create feedback for completed work |

---

## Workflow Example

### 1. Submit Feedback
```bash
node scripts/submit-feedback.js "Add trail color picker" "Users should be able to customize trail colors" --type feature --priority medium
```

### 2. Claim & Work (`/fb`)
```
Agent runs: node fetch-feedback.js
→ Claims highest priority item
→ Status changes to "in-progress"
→ Agent implements the feature
```

### 3. Mark Complete
```bash
node fetch-feedback.js abc123 completed "Implemented color picker with HSL controls"
```

### 4. Release (Future)
When ready to release, completed items get archived with version tag.

---

## Priority System

| Priority | When to Use |
|----------|-------------|
| `high` | Blocking bugs, crashes, data loss |
| `medium` | Standard features and improvements |
| `low` | Nice-to-haves, polish, minor tweaks |

**Auto-claim order**: high → medium → low (oldest first within priority)

---

## Data Structure

```typescript
interface FlowTrailsFeedback {
  id: string;
  title: string;
  description: string;
  type: 'bug' | 'feature' | 'enhancement';
  priority: 'low' | 'medium' | 'high';
  status: 'new' | 'in-progress' | 'completed' | 'archived';

  userId: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  claimedAt?: Timestamp;

  adminNotes?: string;
  fixedInVersion?: string;
}
```

---

## Firebase Setup

**Collection**: `flowtrails-feedback`
**Credentials**: `serviceAccountKey.json` (same as TKA-SCRIBE or separate)

---

## Best Practices

1. **Always provide context** when submitting - module, expected vs actual behavior
2. **One item = one change** - don't bundle unrelated work
3. **Update status promptly** - don't leave items in-progress when done
4. **Add notes** when completing - explain what was changed
5. **Batch releases** - wait for multiple completed items before releasing

---

*Last updated: 2025-12-16*
