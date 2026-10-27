import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordInput } from '@/components/ui/password-input';

describe('PasswordInput component', () => {
  it('renders as type="password" by default', () => {
    render(<PasswordInput placeholder="Password" />);
    const input = screen.getByPlaceholderText(/password/i);
    expect(input).toHaveAttribute('type', 'password');
  });

  it('toggle button reveals password (type becomes "text") and hides again', async () => {
    render(<PasswordInput placeholder="Password" />);
    const input = screen.getByPlaceholderText(/password/i);
    expect(input).toHaveAttribute('type', 'password');

    const toggleButton = screen.getByRole('button');
    await userEvent.click(toggleButton);
    expect(input).toHaveAttribute('type', 'text');

    await userEvent.click(toggleButton);
    expect(input).toHaveAttribute('type', 'password');
  });
});
