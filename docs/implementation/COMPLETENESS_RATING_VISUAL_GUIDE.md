# Completeness Rating System - Visual Guide

## Component Examples

### StarRating Component

#### Small Size (sm)
```
★★★☆☆ 60
```
- Used in: Repository list items, workbench
- Size: 12px stars
- Compact, fits inline with metadata

#### Medium Size (md)
```
★★★★☆ 85
```
- Used in: Repository detail page, modal headers
- Size: 14px stars
- Default size, good for primary display

#### Large Size (lg)
```
★★★★★ 100
```
- Used in: Feature highlights, dashboards
- Size: 18px stars
- Prominent display for emphasis

### Score to Stars Mapping

```
Score Range  │ Stars │ Visual       │ Quality
─────────────┼───────┼──────────────┼─────────────────
  0 -  20    │   1   │ ★☆☆☆☆        │ Needs Work
 21 -  40    │   2   │ ★★☆☆☆        │ Fair
 41 -  60    │   3   │ ★★★☆☆        │ Good
 61 -  80    │   4   │ ★★★★☆        │ Very Good
 81 - 100    │   5   │ ★★★★★        │ Excellent
```

### AnalysisStatus States

#### 1. Pending (Not Started)
```
┌─────────────────┐
│ → analyze       │
└─────────────────┘
```

#### 2. Processing (In Progress)
```
┌─────────────────────────┐
│ ◌ analyzing (45%)...    │
└─────────────────────────┘
```

#### 3. Completed (Success)
```
★★★★☆ 82
```

#### 4. Failed (Error)
```
┌─────────────────┐
│ ↻ retry analysis│ failed
└─────────────────┘
```

## CompletenessBreakdown Modal Layout

```
┌────────────────────────────────────────────────┐
│  completeness breakdown                    ✕   │
│  ★★★★☆ 75/100 points                           │
├────────────────────────────────────────────────┤
│                                                │
│  README Quality                      18/25     │
│  Clear project description, installation...    │
│  ████████████████░░░░░░░░              72%     │
│  How to improve:                               │
│  • Add installation instructions               │
│  • Include usage examples                      │
│                                                │
│  Package Manager                     10/10     │
│  Valid package.json, requirements.txt...       │
│  ████████████████████████████         100%     │
│  ✓                                             │
│                                                │
│  Test Coverage                       11/15     │
│  Unit tests, integration tests, CI runs        │
│  ███████████████████░░░░░░░           73%      │
│  How to improve:                               │
│  • Add unit tests for core functionality       │
│  • Set up test framework (Jest, pytest, etc.)  │
│                                                │
│  [... more categories ...]                     │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │ 💡 Quick wins to improve your score:     │ │
│  │ • README Quality: Add installation...    │ │
│  │ • Test Coverage: Add unit tests for...   │ │
│  │ • Documentation: Add CONTRIBUTING.md     │ │
│  └──────────────────────────────────────────┘ │
│                                                │
├────────────────────────────────────────────────┤
│                                        [close] │
└────────────────────────────────────────────────┘
```

## Integration Locations

### 1. Home Page (Yard Lot)
```
┌────────────────────────────────────────────────┐
│  ▲  1. nextjs-dashboard                        │
│  42    owner/nextjs-dashboard • TypeScript     │
│        Production-ready Next.js dashboard      │
│        12,543 stars • 2,341 forks • 2d ago     │
│        ★★★★☆                                   │
│                                                │
│  ▲  2. react-components                        │
│  38    owner/react-components • JavaScript     │
│        Reusable React component library        │
│        8,921 stars • 1,234 forks • 5d ago      │
│        → analyze                               │
└────────────────────────────────────────────────┘
```

### 2. Repository Detail Page
```
┌────────────────────────────────────────────────┐
│  ← back to yard lot                            │
├────────────────────────────────────────────────┤
│  ▲  owner/repository-name                      │
│  42                                            │
│  votes                                         │
│                                                │
│  A great repository for...                     │
│                                                │
│  → View on GitHub • 12,543 stars • 2,341 forks │
├────────────────────────────────────────────────┤
│  Repository Info  │  Engagement                │
│  Owner: username  │  Upvotes: 42               │
│  Added: 2d ago    │  Followers: 15             │
│  License: MIT     │  Views: 234                │
│                   │                            │
│                   │  Repository Analysis       │
│                   │  Completeness Score:       │
│                   │  ★★★★☆ view breakdown      │
│                   │                            │
│                   │  No AI assistance detected │
└────────────────────────────────────────────────┘
```

### 3. Workbench
```
┌────────────────────────────────────────────────┐
│  the workbench                                 │
│  Your private workspace for managing projects  │
├────────────────────────────────────────────────┤
│  your repositories                             │
├────────────────────────────────────────────────┤
│  owner/my-project                      seeker  │
│  My awesome project description                │
│  42 votes • 15 follows • 234 views             │
│  ★★★★☆                                         │
│  code review    bug fixes                      │
│                                                │
│  owner/new-project                             │
│  Just getting started                          │
│  5 votes • 2 follows • 45 views                │
│  → analyze                                     │
└────────────────────────────────────────────────┘
```

## Color Palette

```
Component         │ Color               │ CSS Variable
──────────────────┼─────────────────────┼─────────────────
Filled Stars      │ #FF6600 (Orange)    │ --yard-orange
Empty Stars       │ #828282 (Gray 30%)  │ --yard-gray
Progress Bar Fill │ #FF6600 (Orange)    │ --yard-orange
Progress Bar Bg   │ #F0F0F0 (Lt Gray)   │ --yard-light-gray
Modal Backdrop    │ #000000 (30%)       │ black + opacity
Border            │ #E0E0E0             │ --yard-border
Quick Wins Bg     │ #FFF5E6 (Lt Orange) │ --yard-light-orange
```

## Typography Scale

```
Element               │ Font Family      │ Size  │ Weight
──────────────────────┼──────────────────┼───────┼────────
Star Rating           │ System           │ varies│ normal
Score Numbers         │ JetBrains Mono   │ 13px  │ normal
Category Names        │ JetBrains Mono   │ 14px  │ 600
Descriptions          │ Inter            │ 12px  │ normal
Modal Title           │ JetBrains Mono   │ 18px  │ 700
Improvement Tips      │ Inter            │ 12px  │ normal
```

## Spacing & Layout

### StarRating Component
- Gap between stars: 0.25rem (sm), 0.5rem (md), 0.75rem (lg)
- Gap to score text: 0.25rem
- Star sizes: 12px (sm), 16px (md), 20px (lg)

### CompletenessBreakdown Modal
- Modal max-width: 672px (2xl)
- Padding: 16px all sides
- Content max-height: 60vh (scrollable)
- Category spacing: 16px between items
- Progress bar height: 8px

### AnalysisStatus
- Button padding: 12px horizontal, 4px vertical
- Gap between spinner and text: 8px
- Spinner size: 12px (sm), 16px (md)

## Responsive Behavior

### Mobile (< 640px)
- Modal takes full width minus 16px margin
- Star sizes remain the same for readability
- Category names may wrap if too long
- Progress bars stack on narrow screens

### Tablet (640px - 1024px)
- Modal centered with max-width
- Two-column layout maintained
- No significant changes

### Desktop (> 1024px)
- Full modal layout as designed
- Hover states more prominent
- Keyboard navigation highlighted

## Animation & Transitions

```css
Star Fill:    transition-all duration-200
Progress Bar: transition-all duration-500
Modal Open:   fade-in + scale animation (CSS)
Spinner:      continuous rotation animation
```

## Accessibility Features

### Screen Reader Text
```
StarRating:
"Repository completeness score: 75 out of 100, 4 stars"

AnalysisStatus (Processing):
"analyzing 45%" + loading spinner

AnalysisStatus (Pending):
"analyze" button

Modal:
"completeness breakdown" (dialog title)
Each category: "18 out of 25 points, 72% complete"
```

### Keyboard Navigation
```
Tab Order:
1. Star rating (if clickable)
2. "view breakdown" link
3. Modal close button
4. Modal close button (footer)
5. Close via Escape key
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Safari (iOS 14+)
- Chrome Mobile

All modern browsers with CSS Grid and Flexbox support.

## Print Styles

When printing repository pages:
- Stars render as Unicode characters: ★☆
- Progress bars show percentage text
- Modal content flattens (no overlay)
- Colors convert to grayscale-friendly values

## Dark Mode Considerations

Current implementation uses light mode variables. For future dark mode:

```css
Dark Mode Suggestion:
--yard-bg: #1a1a1a
--yard-fg: #e0e0e0
--yard-orange: #ff8533 (lighter orange)
--yard-gray: #999999
Stars: Keep orange for consistency
```

## Performance Notes

- SVG stars are inline (no HTTP requests)
- Modal lazy-loads breakdown data
- Polling uses 3-second interval
- No heavy animations or transitions
- Components are client-side only where needed

## Common UI Patterns

### Loading State Pattern
```
Before: [Analyze Button]
During: [Spinner + "analyzing..."]
After:  [★★★★☆ Rating]
```

### Error State Pattern
```
Failed: [↻ retry analysis] [failed]
       └─ Retry button    └─ Error text
```

### Empty State Pattern
```
No Analysis: → analyze
             └─ Call to action
```

This visual guide helps designers and developers understand how components appear and behave across the Vibeyard application.
