// Password strength indicator component

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null;

  const getStrength = (pwd: string) => {
    let strength = 0;

    // Length check
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;

    // Character variety checks
    if (/[a-z]/.test(pwd)) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;

    // Return 0-4 scale
    if (strength <= 2) return { score: 1, label: 'Weak', color: 'bg-[var(--color-error)]' };
    if (strength <= 4) return { score: 2, label: 'Fair', color: 'bg-[#f59e0b]' };
    if (strength <= 5) return { score: 3, label: 'Good', color: 'bg-[var(--color-success)]' };
    return { score: 4, label: 'Strong', color: 'bg-[var(--color-success)]' };
  };

  const strength = getStrength(password);
  const widthPercentage = (strength.score / 4) * 100;

  return (
    <div className="mt-2 space-y-1">
      {/* Strength bar */}
      <div className="h-1 bg-[var(--color-border)] rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${strength.color}`}
          style={{ width: `${widthPercentage}%` }}
        />
      </div>

      {/* Strength label */}
      <p className="text-xs text-[var(--color-text-tertiary)]">
        Password strength: <span className="font-medium text-[var(--color-text-secondary)]">{strength.label}</span>
      </p>
    </div>
  );
}
