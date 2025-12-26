# Confluence Documentation for Vibeyard

This directory contains comprehensive Confluence documentation for the Vibeyard project, formatted as Markdown files for easy import to Confluence.

## 📚 Documentation Files

### 1. Architecture Overview
**File:** [01-ARCHITECTURE-OVERVIEW.md](./01-ARCHITECTURE-OVERVIEW.md)

Comprehensive system architecture documentation including:
- System architecture diagrams (Mermaid)
- Technology stack with rationale
- Data models and ERD
- Integration points (GitHub, OpenAI, NextAuth)
- Infrastructure and deployment architecture
- Security architecture
- Performance and scalability strategies

**Confluence Target:** VIBE Space > Architecture

---

### 2. Phase 1 Implementation Guide
**File:** [02-PHASE1-IMPLEMENTATION-GUIDE.md](./02-PHASE1-IMPLEMENTATION-GUIDE.md)

Detailed implementation guide for Phase 1 development:
- Implementation roadmap (38-day timeline)
- Complete epic breakdown (11 epics, 64 tasks)
- Detailed task specifications with code examples
- Critical path analysis
- Sprint organization (8 two-week sprints)
- Developer onboarding guide
- Quality gates and definitions of done

**Confluence Target:** VIBE Space > Implementation > Phase 1

---

### 3. API Documentation
**File:** [03-API-DOCUMENTATION.md](./03-API-DOCUMENTATION.md)

Complete API reference documentation:
- Authentication flows
- Error handling standards
- Rate limiting policies
- 30+ API endpoint specifications
- Request/response examples
- Data model definitions
- SDK examples (TypeScript/JavaScript)
- Testing guidelines

**Confluence Target:** VIBE Space > API Documentation

---

### 4. Development Guidelines
**File:** [04-DEVELOPMENT-GUIDELINES.md](./04-DEVELOPMENT-GUIDELINES.md)

Comprehensive development standards and best practices:
- Code style and formatting rules
- Project structure guidelines
- TypeScript best practices
- React and Next.js patterns
- API development standards
- Database guidelines
- Testing requirements (80% coverage)
- Git workflow and commit conventions
- Code review process
- Security best practices
- Accessibility standards (WCAG 2.1 AA)

**Confluence Target:** VIBE Space > Development Guidelines

---

## 🚀 How to Upload to Confluence

### Option 1: Manual Upload (Recommended)

1. **Navigate to Confluence:**
   - Go to: https://techopsservices.atlassian.net/wiki/spaces/VIBE
   - Ensure you're in the **VIBE** space

2. **Create Parent Pages:**
   ```
   VIBE Space
   ├── Architecture
   ├── Implementation
   │   └── Phase 1
   ├── API Documentation
   └── Development Guidelines
   ```

3. **Import Each Document:**
   - Click "Create" > "Blank page"
   - Copy content from markdown file
   - Use Confluence's markdown importer or paste as markdown
   - Format mermaid diagrams (may need to use Confluence diagram tools)
   - Add page properties (labels, metadata)

4. **Add Cross-Links:**
   - Link related pages together
   - Create table of contents on space homepage
   - Add "Related Pages" sections

### Option 2: Automated Import

**Using Confluence CLI (if available):**

```bash
# Install Confluence CLI
npm install -g confluence-cli

# Configure credentials
confluence-cli config

# Upload documents
confluence-cli upload \
  --space VIBE \
  --title "Architecture Overview" \
  --file 01-ARCHITECTURE-OVERVIEW.md

confluence-cli upload \
  --space VIBE \
  --title "Phase 1 Implementation Guide" \
  --file 02-PHASE1-IMPLEMENTATION-GUIDE.md \
  --parent "Implementation"

confluence-cli upload \
  --space VIBE \
  --title "API Documentation" \
  --file 03-API-DOCUMENTATION.md

confluence-cli upload \
  --space VIBE \
  --title "Development Guidelines" \
  --file 04-DEVELOPMENT-GUIDELINES.md
```

### Option 3: Confluence API

Use the Atlassian MCP tools to programmatically create pages:

```typescript
// Example: Create Confluence page via API
import { createConfluencePage } from '@/mcp/atlassian'

await createConfluencePage({
  cloudId: 'techopsservices.atlassian.net',
  spaceId: 'VIBE',
  title: 'Architecture Overview',
  body: architectureContent,
  contentFormat: 'markdown'
})
```

---

## 📝 Mermaid Diagrams

The documentation includes several Mermaid diagrams for system architecture visualization:

### Architecture Overview Diagrams:
1. **High-Level Architecture** - Shows application layer, services, data layer, and external integrations
2. **Component Architecture** - Details frontend, state management, and API layer
3. **Data Flow Diagram** - Illustrates repository connection and analysis flow
4. **Infrastructure Diagram** - Kubernetes deployment architecture
5. **Entity Relationship Diagram** - Database schema relationships

### Implementation Guide Diagrams:
1. **Implementation Timeline** (Gantt chart) - 38-day roadmap
2. **Critical Path** - Sequential dependencies between key tasks

### Rendering Mermaid in Confluence:

**Option A: Use Confluence Mermaid Macro**
1. Install "Mermaid Diagrams for Confluence" app
2. Insert macro: `/mermaid`
3. Paste mermaid code

**Option B: Convert to Images**
```bash
# Install mermaid CLI
npm install -g @mermaid-js/mermaid-cli

# Convert diagrams to PNG
mmdc -i diagram.mmd -o diagram.png

# Upload images to Confluence
```

**Option C: Use Draw.io**
1. Convert mermaid to draw.io format
2. Use Confluence's built-in draw.io integration

---

## 🏷️ Confluence Page Properties

Add these labels/properties to each page:

### Architecture Overview
- **Labels:** `architecture`, `system-design`, `phase1`, `technical`
- **Status:** Draft → In Review → Published
- **Version:** 1.0
- **Last Updated:** 2025-12-25

### Phase 1 Implementation Guide
- **Labels:** `implementation`, `phase1`, `development`, `guide`
- **Status:** In Progress
- **Version:** 1.0
- **Sprint:** Sprint 2

### API Documentation
- **Labels:** `api`, `documentation`, `reference`, `developers`
- **Status:** Draft → Published
- **Version:** 1.0
- **API Version:** v1

### Development Guidelines
- **Labels:** `guidelines`, `standards`, `best-practices`, `coding`
- **Status:** Published
- **Version:** 1.0
- **Applies To:** All developers

---

## 🔗 Internal Links

Ensure these cross-references work in Confluence:

### From Architecture Overview:
- → Phase 1 Implementation Guide
- → API Documentation
- → Development Guidelines
- → Quick Start Guide (existing)

### From Implementation Guide:
- → Architecture Overview
- → API Documentation
- → Development Guidelines
- → TASKS.md (local)
- → JIRA tickets (VIBE-*)

### From API Documentation:
- → Architecture Overview
- → Development Guidelines
- → Testing Guidelines

### From Development Guidelines:
- → Architecture Overview
- → Phase 1 Implementation Guide
- → API Documentation

---

## 📊 Confluence Space Structure

Recommended organization:

```
VIBE Space (Home)
│
├── 📖 Getting Started
│   ├── README
│   ├── Quick Start Guide
│   └── Setup Instructions
│
├── 🏗️ Architecture
│   ├── Architecture Overview ⭐ NEW
│   ├── Technology Stack
│   └── Infrastructure
│
├── 💻 Development
│   ├── Development Guidelines ⭐ NEW
│   ├── Code Style Guide
│   └── Testing Strategy
│
├── 🚀 Implementation
│   ├── Phase 1 Implementation Guide ⭐ NEW
│   ├── Phase 1 Tasks (TASKS.md)
│   ├── Phase 2 Planning
│   └── Roadmap
│
├── 📡 API Documentation ⭐ NEW
│   ├── API Reference
│   ├── Authentication
│   ├── Endpoints
│   └── Data Models
│
├── 🧪 Testing
│   ├── Test Strategy
│   ├── Test Cases
│   └── QA Checklist
│
└── 🚢 Deployment
    ├── Deployment Guide
    ├── Kubernetes Setup
    └── CI/CD Pipeline
```

---

## 📋 Checklist for Upload

Before uploading to Confluence, ensure:

- [ ] All markdown files are complete
- [ ] Mermaid diagrams render correctly
- [ ] Code examples are properly formatted
- [ ] Internal links are converted to Confluence links
- [ ] External links work
- [ ] Images are uploaded (if any)
- [ ] Table of contents is accurate
- [ ] Page titles match file names
- [ ] Metadata/labels are added
- [ ] Related pages are linked
- [ ] Permissions are set correctly

---

## 🔄 Keeping Documentation Updated

### Update Frequency:
- **Architecture Overview:** Update when architecture changes
- **Implementation Guide:** Update at end of each sprint
- **API Documentation:** Update when APIs change
- **Development Guidelines:** Review quarterly

### Version Control:
- Keep markdown files in Git as source of truth
- Update Confluence pages when merging to main
- Tag documentation versions in Git

### Ownership:
- **Architecture:** Tech Lead
- **Implementation Guide:** Project Manager + Tech Lead
- **API Documentation:** Backend Developers
- **Development Guidelines:** All Developers (collaborative)

---

## 🆘 Troubleshooting

### Mermaid Diagrams Not Rendering:
1. Check if Mermaid app is installed in Confluence
2. Verify syntax is correct
3. Try rendering on mermaid.live first
4. Convert to image as fallback

### Formatting Issues:
1. Use Confluence markdown importer
2. Manually format tables if needed
3. Check code block syntax highlighting
4. Verify heading levels (H1, H2, H3)

### Broken Links:
1. Update relative links to Confluence page links
2. Use page IDs for stability
3. Test all links after upload

---

## 📞 Support

For questions about:
- **Content:** Contact Technical Writer or Tech Lead
- **Confluence Access:** Contact Confluence Admin
- **Technical Issues:** Create JIRA ticket in VIBE project

---

## 📈 Metrics

Track documentation effectiveness:
- Page views
- Search appearances
- Likes/reactions
- Comments/feedback
- Time on page

Use Confluence analytics to identify:
- Most valuable pages
- Pages needing updates
- Missing documentation

---

**Created:** 2025-12-25
**Last Updated:** 2025-12-25
**Maintainer:** Development Team
**Status:** Ready for Upload
