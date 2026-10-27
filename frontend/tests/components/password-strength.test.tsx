import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PasswordStrength } from '@/components/ui/password-strength';

describe('PasswordStrength component', () => {
  it('does not render when password is empty', () => {
    const { container } = render(<PasswordStrength password="" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders strength score and label for weak password', () => {
    render(<PasswordStrength password="abc" />);
    expect(screen.getByText(/password strength:/i)).toBeInTheDocument();
    expect(screen.getByText(/weak/i)).toBeInTheDocument();
  });

  it('renders strength label for strong password', () => {
    render(<PasswordStrength password="StrongPassword123!" />);
    expect(screen.getByText(/strong/i)).toBeInTheDocument();
  });
});
