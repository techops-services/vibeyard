# Feature Specification Workflow

This document provides detailed guidance on the hybrid workflow for creating feature specifications collaboratively with users.

## Workflow Overview

The hybrid approach combines interview-style questioning with iterative drafting:

1. **Discovery Phase**: Gather context through questions and exploration
2. **Section-by-Section Building**: For each section, ask questions → draft → refine
3. **Finalization**: Review, polish, and save to JIRA or Confluence

## Stage 1: Discovery Phase

**Goal:** Understand the feature idea, gather context, and explore existing work.

### Step 1: Initial Understanding

Start by understanding the basic feature idea and meta-context:

**Essential questions:**
1. What's the feature idea in one sentence?
2. Who is this feature for (target users/personas)?
3. What problem does it solve?
4. Where should the final spec be saved? (JIRA ticket, Confluence page, or both)

**Additional context questions (as needed):**
- Is there an existing JIRA ticket for this?
- Are there any constraints or requirements already known?
- What's driving the need for this feature now?

**Tone:** Keep questions conversational. Users can answer in shorthand or dump information however works best.

### Step 2: Search Existing Work

**Before building the spec, check if similar work exists:**

Ask the user: "Should I search JIRA and Confluence for related features or past decisions that might be relevant?"

If yes, search for:
- Similar features already implemented
- Related JIRA tickets (open or closed)
- Architectural decision records
- Past discussions or specs that might inform this work

**Report findings:**
- Summarize what was found
- Highlight anything that might impact the current feature
- Ask if they want to review any of these items before proceeding

### Step 3: Codebase Exploration

**Important:** Always explore the codebase to understand existing patterns.

Inform the user: "I'm going to explore the codebase to understand the existing architecture and patterns that will inform the technical approach."

See `codebase-analysis.md` for detailed guidance on what to explore.

**Report findings:**
- Current architecture relevant to this feature
- Existing patterns to follow
- Potential integration points
- Technical constraints or opportunities

### Step 4: Clarify Sections Needed

Based on the feature type and context gathered, propose which sections the spec should include:

**Standard sections (usually all included):**
- Problem Statement & User Needs
- Requirements & Acceptance Criteria
- Technical Approach & Architecture
- UI/UX Design Considerations

Ask: "Does this structure work, or should we adjust what's included?"

**Once agreed, create the initial document structure:**
- If using artifacts (claude.ai/Claude app): Use `create_file` to create artifact with all section headers and placeholders
- If in Claude Code: Create a markdown file in the working directory with section headers and placeholders

Inform the user that sections will be built one at a time, starting with whichever has the most unknowns.

## Stage 2: Section-by-Section Building

**Goal:** Build each section iteratively through questions, drafting, and refinement.

### Section Selection

**Ask which section to start with, but suggest:**
- For user-facing features: Start with Problem Statement
- For technical refactors: Start with Technical Approach
- For complex workflows: Start with UI/UX considerations
- Generally: Start with the section with the most unknowns

### For Each Section: The Five-Step Pattern

#### Step 1: Clarifying Questions

Announce: "Let's work on the [SECTION NAME] section. I have some questions about what should be included."

Generate 5-8 specific questions based on:
- Section purpose (see `spec-template.md`)
- Context already gathered
- Gaps in understanding

**Example questions for "Problem Statement":**
- Who specifically experiences this problem most?
- How often does this problem occur?
- What workarounds are users currently using?
- What's the business impact of not solving this?

Users can answer in shorthand or long-form, whatever works.

#### Step 2: Brainstorming Key Points

Based on answers, brainstorm 8-15 key points that might be included in this section.

Format as numbered list:
```
For the Problem Statement section, here are points to consider:
1. Sales team spends 15-20 min/report on manual exports
2. Error-prone process leads to data accuracy issues
3. Affects 10+ team members daily
4. Customer reporting delayed by manual process
...
```

At the end, offer: "I can brainstorm more options if helpful."

#### Step 3: Curation

Ask which points to keep, remove, or combine.

**Important:** If user gives freeform feedback ("looks good", "I like most of it") instead of numbered selections, extract their preferences and proceed. Don't force them to use numbers.

Examples of clear curation:
- "Keep 1,3,5,7,9"
- "Remove 2 (not relevant)"
- "Combine 8 and 10"

#### Step 4: Gap Check

Ask: "Based on what we're including, is there anything important missing for the [SECTION NAME] section?"

If user identifies gaps, add them to the list.

#### Step 5: Draft the Section

Announce: "I'll draft the [SECTION NAME] section now based on what you've selected."

Use `str_replace` to replace the placeholder for this section with drafted content.

**After drafting:**
- If using artifacts: Provide link and ask for feedback
- If using file: Confirm completion and ask for feedback

**Key instruction (especially for first section):**
"Instead of editing directly, please tell me what to change. This helps me learn your style for future sections. For example: 'Make the third paragraph more concise' or 'Remove the X bullet - already covered by Y'."

#### Step 6: Iterative Refinement

As user provides feedback:
- Use `str_replace` for all edits (never reprint the whole doc)
- If using artifacts: Provide link after each edit
- If using file: Confirm edits complete
- If user edits directly: Note what they changed for future sections

**Continue iterating** until user is satisfied.

After 3 iterations with no substantial changes, ask: "Can anything be removed without losing important information?"

When section is done, confirm and ask: "Is the [SECTION NAME] section complete? Ready to move to the next section?"

### Section Completion

Repeat the five-step pattern for all sections.

**When 80%+ complete:**
Announce: "I'm going to re-read the entire spec and check for flow, consistency, redundancy, and quality."

Provide feedback on:
- Overall coherence
- Inconsistencies or contradictions
- Generic filler or "slop" that should be removed
- Whether every sentence carries weight

## Stage 3: Finalization

**Goal:** Polish the spec and save it to the appropriate location.

### Final Review

When all sections are drafted:
1. Review complete spec for overall quality
2. Check that all required sections are present
3. Ensure acceptance criteria are testable
4. Verify technical approach is clear

Provide any final suggestions.

Ask: "Ready to save this spec, or do you want to refine anything else?"

### Saving the Spec

See `jira-confluence.md` for detailed instructions on creating/updating JIRA tickets and Confluence pages.

**Ask the user where to save:**
- JIRA ticket only
- Confluence page only
- Both (Confluence page with linked JIRA ticket)

**If both:**
1. Create Confluence page with full spec
2. Create or update JIRA ticket with summary and link to Confluence page

**Provide the links** to created items so user can review.

## Tips for Effective Facilitation

### Tone and Pacing

- **Be direct and procedural**: Don't oversell the process
- **Move efficiently**: Don't belabor points
- **Give agency**: Let user skip or adjust steps if needed
- **Acknowledge blockers**: If user seems frustrated, suggest ways to move faster

### Handling Deviations

- **User wants to skip exploration**: Confirm they're okay working without codebase context
- **User has existing draft**: Ask if they want to refine it section-by-section or start fresh
- **User wants different section order**: Follow their preference
- **User provides vague feedback**: Extract intent and proceed rather than forcing specific format

### Quality Over Speed

- Each iteration should make meaningful improvements
- Don't rush through sections just to finish
- The goal is a spec that effectively communicates the feature and guides implementation

### Context Management

- If gaps appear while building a section, stop and clarify
- Don't let assumptions accumulate
- Proactively ask when something isn't clear

### Document Management

- Use `create_file` for initial structure (if artifacts available)
- Use `str_replace` for all edits - never reprint entire document
- Provide links/confirmation after every change
- Keep the working document as single source of truth
