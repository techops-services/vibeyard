#!/usr/bin/env python3
"""
Validates a feature specification for completeness and quality.

Usage:
    python validate_spec.py <spec_file.md>

Checks:
- All required sections are present
- Each section has substantive content (not just placeholders)
- Acceptance criteria are testable and specific
- No TODO markers or placeholder text remain
"""

import sys
import re
from pathlib import Path
from typing import List, Tuple


REQUIRED_SECTIONS = [
    "Problem Statement",
    "Requirements",
    "Acceptance Criteria",
    "Technical Approach",
]

OPTIONAL_SECTIONS = [
    "UI/UX",
    "User Needs",
    "Architecture",
    "Design Considerations",
]

PLACEHOLDER_PATTERNS = [
    r"\[TODO\]",
    r"\[TBD\]",
    r"\[To be (written|determined|decided|added)\]",
    r"\[Insert .+\]",
    r"\[Fill in .+\]",
    r"\.\.\.",
]


def read_spec(file_path: str) -> str:
    """Read the specification file."""
    try:
        return Path(file_path).read_text(encoding='utf-8')
    except FileNotFoundError:
        print(f"❌ Error: File not found: {file_path}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        sys.exit(1)


def extract_sections(content: str) -> dict:
    """Extract sections from the markdown content."""
    sections = {}
    current_section = None
    current_content = []

    for line in content.split('\n'):
        # Check for section headers (## Section Name)
        header_match = re.match(r'^##\s+(.+)$', line)
        if header_match:
            # Save previous section
            if current_section:
                sections[current_section] = '\n'.join(current_content).strip()
            # Start new section
            current_section = header_match.group(1)
            current_content = []
        elif current_section:
            current_content.append(line)

    # Save last section
    if current_section:
        sections[current_section] = '\n'.join(current_content).strip()

    return sections


def check_required_sections(sections: dict) -> List[str]:
    """Check if all required sections are present."""
    issues = []
    section_keys = [s.lower() for s in sections.keys()]

    for required in REQUIRED_SECTIONS:
        # Check if any section contains the required text (case-insensitive, partial match)
        if not any(required.lower() in key for key in section_keys):
            issues.append(f"Missing required section: {required}")

    return issues


def check_section_content(sections: dict) -> List[str]:
    """Check if sections have substantive content."""
    issues = []

    for section_name, content in sections.items():
        # Skip very short sections (less than 50 characters suggests placeholder)
        if len(content.strip()) < 50:
            issues.append(f"Section '{section_name}' has minimal content (< 50 chars)")

        # Check for common placeholder text
        for pattern in PLACEHOLDER_PATTERNS:
            if re.search(pattern, content, re.IGNORECASE):
                issues.append(f"Section '{section_name}' contains placeholder text: {pattern}")

    return issues


def check_acceptance_criteria(sections: dict) -> List[str]:
    """Check if acceptance criteria are specific and testable."""
    issues = []

    # Find the acceptance criteria section
    ac_section = None
    for section_name, content in sections.items():
        if 'acceptance criteria' in section_name.lower():
            ac_section = content
            break

    if not ac_section:
        return ["No Acceptance Criteria section found"]

    # Check for bullet points or numbered lists
    has_list_items = bool(re.search(r'^\s*[-*\d]+[\.)]\s+', ac_section, re.MULTILINE))
    if not has_list_items:
        issues.append("Acceptance Criteria should be formatted as a list")

    # Check for vague language
    vague_terms = ['should', 'might', 'could', 'possibly', 'maybe', 'approximately']
    for term in vague_terms:
        if term in ac_section.lower():
            issues.append(f"Acceptance Criteria contains vague term '{term}' - use specific, testable criteria")

    return issues


def validate_spec(file_path: str) -> Tuple[bool, List[str], List[str]]:
    """
    Validate a feature specification.

    Returns:
        Tuple of (is_valid, errors, warnings)
    """
    content = read_spec(file_path)
    sections = extract_sections(content)

    errors = []
    warnings = []

    # Check required sections
    section_issues = check_required_sections(sections)
    errors.extend(section_issues)

    # Check section content
    content_issues = check_section_content(sections)
    errors.extend(content_issues)

    # Check acceptance criteria (warnings only)
    ac_issues = check_acceptance_criteria(sections)
    warnings.extend(ac_issues)

    is_valid = len(errors) == 0

    return is_valid, errors, warnings


def main():
    if len(sys.argv) != 2:
        print("Usage: python validate_spec.py <spec_file.md>")
        sys.exit(1)

    file_path = sys.argv[1]

    print(f"Validating specification: {file_path}")
    print("=" * 60)

    is_valid, errors, warnings = validate_spec(file_path)

    if errors:
        print("\n❌ Errors found:")
        for error in errors:
            print(f"  • {error}")

    if warnings:
        print("\n⚠️  Warnings:")
        for warning in warnings:
            print(f"  • {warning}")

    if is_valid and not warnings:
        print("\n✅ Specification is valid and complete!")
        sys.exit(0)
    elif is_valid:
        print("\n✅ Specification is valid (with warnings)")
        sys.exit(0)
    else:
        print(f"\n❌ Specification validation failed with {len(errors)} error(s)")
        sys.exit(1)


if __name__ == "__main__":
    main()
