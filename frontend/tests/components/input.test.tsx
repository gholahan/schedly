import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/input';

describe('Input component', () => {
  it('renders with placeholder and error', () => {
    render(<Input placeholder="Enter email" error="Invalid email" />);
    expect(screen.getByPlaceholderText(/enter email/i)).toBeInTheDocument();
    expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
  });

  it('onChange fires with correct value', async () => {
    const onChange = vi.fn();
    render(<Input placeholder="Type here" onChange={onChange} />);

    const input = screen.getByPlaceholderText(/type here/i);
    await userEvent.type(input, 'hello');

    expect(onChange).toHaveBeenCalled();
    expect(input).toHaveValue('hello');
  });

  it('handles disabled state', () => {
    render(<Input disabled placeholder="Disabled input" />);
    expect(screen.getByPlaceholderText(/disabled input/i)).toBeDisabled();
  });
});
