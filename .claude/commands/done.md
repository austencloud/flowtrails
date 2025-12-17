# Auto-Create Feedback on Completion

When work has been completed but there's no existing feedback item tracking it, automatically create one.

## Instructions

### Step 1: Analyze Completed Work
Look at what was just accomplished in this conversation:
- What files were changed?
- What was the purpose?
- Is this user-facing or internal infrastructure?

### Step 2: Determine Type
- **bug**: Fixed something that was broken
- **feature**: Added new capability
- **enhancement**: Improved existing functionality

### Step 3: Auto-Create Feedback
Run the submit script:

```bash
node scripts/submit-feedback.js "<title>" "<description>" --type <type> --priority medium --user austen
```

**Title format**: Action verb + what was done
- "Fix WebGL rendering on resize"
- "Add trail color customization"
- "Implement VideoSyncService DI pattern"

**Description**: Brief summary of what was changed and why.

### Step 4: Auto-Complete
Immediately mark it as completed:

```bash
node fetch-feedback.js <new-id> completed "Auto-completed via /done command"
```

### Step 5: Report
Tell the user what was created:

```
✅ Created and completed feedback item:

**ID:** [id]
**Title:** [title]
**Type:** [type]

This work is now tracked and ready for the next release.
```

## Important Notes

- **DO NOT ask for confirmation** - just create and complete it
- Use `--user austen` for the default profile
- Keep titles concise (under 60 characters)
- For infrastructure/internal work, note it in the description
