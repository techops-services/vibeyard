import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import VibeCodPage from '../page'

describe('VibeCodPage', () => {
  it('renders the page header', () => {
    render(<VibeCodPage />)
    expect(screen.getByText('vibecoding guide')).toBeInTheDocument()
  })

  it('renders the Get Started with a Template section', () => {
    render(<VibeCodPage />)

    // Template section should exist
    expect(screen.getByText('Get Started with a Template')).toBeInTheDocument()

    // Should have a link to the template repository
    const templateLink = screen.getByRole('link', { name: /use this template/i })
    expect(templateLink).toBeInTheDocument()
    expect(templateLink).toHaveAttribute('href', 'https://github.com/techops-services/vibecode-template')
    expect(templateLink).toHaveAttribute('target', '_blank')
    expect(templateLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('displays template quick start instructions', () => {
    render(<VibeCodPage />)

    expect(screen.getByText(/Copy \.claude directory and CLAUDE\.md/i)).toBeInTheDocument()
    expect(screen.getByText(/Customize CLAUDE\.md with your project details/i)).toBeInTheDocument()
  })

  it('lists what is included in the template', () => {
    render(<VibeCodPage />)

    // Should mention agents
    expect(screen.getByText(/7 specialized agents/i)).toBeInTheDocument()

    // Should mention skills/workflows
    expect(screen.getByText(/production workflows/i)).toBeInTheDocument()

    // Should mention MCP servers
    expect(screen.getByText(/MCP servers for Memory, Atlassian/i)).toBeInTheDocument()
  })

  it('renders all main sections', () => {
    render(<VibeCodPage />)

    // Template section (first after header)
    expect(screen.getByText('Get Started with a Template')).toBeInTheDocument()

    // What is Vibecoding section
    expect(screen.getByText('What is Vibecoding?')).toBeInTheDocument()

    // Best Practices heading
    expect(screen.getByText('Best Practices with Claude Code')).toBeInTheDocument()

    // Using Agents
    expect(screen.getByText('Using Agents')).toBeInTheDocument()

    // Using Skills
    expect(screen.getByText('Using Skills')).toBeInTheDocument()

    // Using MCP Servers
    expect(screen.getByText('Using MCP Servers')).toBeInTheDocument()
  })
})
