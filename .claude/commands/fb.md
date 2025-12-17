# FlowTrails Feedback Command

Claim and work on the next feedback item from the queue.

## Instructions

When this command is invoked:

### Step 1: Claim Feedback
Run the feedback script to claim the next item:
```bash
node fetch-feedback.js
```

### Step 2: Display Feedback Verbatim
**CRITICAL**: Before ANY analysis, display the feedback exactly as shown:

```
## Claimed Feedback: [Title]

**ID:** [document-id]
**Type:** [bug/feature/enhancement]
**Priority:** [low/medium/high]
**Created:** [timestamp]

---

**Description:**
[Full feedback text exactly as provided]

---

**Previous Notes:** [if any]

---
```

### Step 3: Assess Complexity
Determine the complexity level:

- **TRIVIAL**: Text changes, CSS tweaks, config updates (1-2 files)
- **MEDIUM**: Clear bugs, straightforward features (2-5 files)
- **COMPLEX**: Multi-module changes, architecture decisions, UX overhauls

### Step 4: Present Assessment
```
## Assessment

**Complexity:** [TRIVIAL/MEDIUM/COMPLEX]
**Estimated Changes:** [list of files/areas]
**Approach:** [brief strategy]

Ready to implement?
```

### Step 5: Get Approval
Wait for user confirmation before proceeding.

### Step 6: Implement
Work on the feedback item following FlowTrails architecture patterns:
- Service contracts in `contracts/`
- Implementations in `implementations/`
- Components ≤150 lines
- Use Svelte 5 runes

### Step 7: Complete
When done, update the status:
```bash
node fetch-feedback.js <id> completed "Summary of what was done"
```

Provide testing instructions to the user.

---

## Quick Commands

```bash
# Claim next item
node fetch-feedback.js

# View queue
node fetch-feedback.js list

# View specific item
node fetch-feedback.js <id>

# Update status
node fetch-feedback.js <id> <status> "notes"

# Update priority
node fetch-feedback.js <id> priority <low|medium|high>
```

## Valid Statuses
- `new` - Unclaimed
- `in-progress` - Being worked on
- `completed` - Ready for release
- `archived` - Released or declined
