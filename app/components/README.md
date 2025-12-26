# Vibeyard Components

This directory contains reusable React components for the Vibeyard application.

## AddRepoModal

A multi-step modal for adding repositories with optional collaboration settings.

### Features

- **Step 1: Repository Input**
  - Accepts GitHub repository URL or `owner/repo` format
  - Validates input format before proceeding
  - Parses and extracts owner and repository name

- **Step 2: Collaboration Options**
  - Optional configuration for collaboration features
  - Users can skip this step and add the repository without collaboration settings
  - Configures role, types, details, and acceptance status

### Usage

```tsx
import { AddRepoModal } from '@/app/components/AddRepoModal'

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Add Repository</button>
      <AddRepoModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  )
}
```

### Props

- `isOpen: boolean` - Controls modal visibility
- `onClose: () => void` - Callback when modal is closed

### Behavior

1. User enters repository URL/name
2. Modal validates format
3. User proceeds to collaboration options or skips
4. Modal submits to `/api/repositories` endpoint
5. On success, refreshes the page and closes modal
6. On error, displays error message in-place

## CollaborationOptionsForm

A reusable form component for configuring repository collaboration settings.

### Features

- **Role Selection** (radio buttons)
  - SEEKER - Looking for help
  - PROVIDER - Offering help
  - BOTH - Open to both

- **Collaboration Types** (checkboxes, multi-select)
  - CODE_REVIEW - Human code review requests
  - BUG_FIX_HELP - Help fixing specific issues
  - TEAM_FORMATION - Looking to form dev team
  - EXPERTISE_OFFER - Offering technical expertise
  - MENTORSHIP - Mentorship/guidance
  - GENERAL_COLLABORATION - General collaboration

- **Additional Details** (textarea)
  - Optional text field for describing collaboration needs/offers

- **Accepting Requests** (checkbox)
  - Toggle whether to accept collaboration requests for this repository

### Usage

```tsx
import { CollaborationOptionsForm } from '@/app/components/CollaborationOptionsForm'
import { CollaborationOptions } from '@/types/collaboration'

function MyComponent() {
  const [options, setOptions] = useState<CollaborationOptions>({
    role: 'SEEKER',
    types: [],
    details: '',
    isAccepting: false,
  })

  return (
    <CollaborationOptionsForm
      options={options}
      onChange={setOptions}
    />
  )
}
```

### Props

- `options: CollaborationOptions` - Current collaboration options state
- `onChange: (options: CollaborationOptions) => void` - Callback when options change

## AddRepoForm

A simple wrapper component that displays a button and manages the AddRepoModal state.

### Usage

```tsx
import { AddRepoForm } from '@/app/components/AddRepoForm'

function MyComponent() {
  return <AddRepoForm />
}
```

This component is used in the main layout to provide the "+ add repo" button.

## Design System

All components follow the "yard" aesthetic defined in `/app/globals.css`:

### CSS Classes

- `yard-button` - Orange button with hover states
- `yard-input` - Input fields with focus states
- `yard-meta` - Gray metadata text
- `mono` - Monospace font

### Colors

- `--yard-orange: #ff6600` - Primary action color
- `--yard-gray: #828282` - Secondary/meta text
- `--yard-border: #e0e0e0` - Border color
- `--yard-light-gray: #f0f0f0` - Background highlights
- `--yard-hover: #fff5e6` - Hover backgrounds

### Typography

- Body: Inter font family, 13px
- Code/Mono: JetBrains Mono

## Testing

Tests are located in `__tests__/` subdirectory:

- `AddRepoModal.test.tsx` - Tests for modal component
- `CollaborationOptionsForm.test.tsx` - Tests for form component

Run tests with:

```bash
npm test
```

## API Integration

The AddRepoModal component integrates with the `/api/repositories` endpoint:

### POST Request

```typescript
{
  owner: string,
  name: string,
  collaborationOptions?: {
    role: CollaborationRole,
    types: CollaborationType[],
    details?: string,
    isAccepting: boolean
  }
}
```

### Response

Returns the created repository object with all fields populated from GitHub API and collaboration settings.

## Future Enhancements

- Add repository preview in Step 2 (show fetched GitHub data)
- Add loading state while fetching GitHub data
- Add validation to prevent duplicate types selection
- Add character limit indicator for details field
- Add "Save as template" for collaboration preferences
