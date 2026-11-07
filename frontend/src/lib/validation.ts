export type FormErrors = Record<string, string>;

export interface EntryFormState {
  periodLabel: string;
  revenue: string;
  cogs: string;
  operatingExpenses: string;
  cashOnHand: string;
  notes: string;
}

export function emptyEntryForm(): EntryFormState {
  return {
    periodLabel: '',
    revenue: '',
    cogs: '',
    operatingExpenses: '',
    cashOnHand: '',
    notes: '',
  };
}

function parseAmount(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, '');
  if (trimmed === '') return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

export function toAmount(raw: string): number {
  return parseAmount(raw) ?? 0;
}

const MONEY_FIELDS: { field: keyof EntryFormState; label: string }[] = [
  { field: 'revenue', label: 'Revenue' },
  { field: 'cogs', label: 'Cost of goods sold' },
  { field: 'operatingExpenses', label: 'Operating expenses' },
  { field: 'cashOnHand', label: 'Cash on hand' },
];

export function validateEntryForm(values: EntryFormState): FormErrors {
  const errors: FormErrors = {};

  const periodLabel = values.periodLabel.trim();
  if (periodLabel.length === 0) {
    errors.periodLabel = 'Give this period a label, for example “March 2026”.';
  } else if (periodLabel.length > 60) {
    errors.periodLabel = 'Keep the label under 60 characters.';
  }

  for (const { field, label } of MONEY_FIELDS) {
    const raw = values[field];
    if (raw.trim() === '') {
      errors[field] = `${label} is required. Enter 0 if it does not apply.`;
      continue;
    }
    const parsed = parseAmount(raw);
    if (parsed === null) {
      errors[field] = 'Enter a valid number.';
      continue;
    }
    if (parsed < 0) {
      errors[field] = 'Amount cannot be negative.';
    } else if (parsed > 1_000_000_000_000) {
      errors[field] = 'That amount is too large.';
    }
  }

  if (values.notes.trim().length > 500) {
    errors.notes = 'Keep notes under 500 characters.';
  }

  return errors;
}

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (trimmed.length === 0) return 'Enter your email address.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) return 'Enter a valid email address.';
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length === 0) return 'Enter a password.';
  if (password.length < 8) return 'Use at least 8 characters.';
  if (password.length > 72) return 'Passwords can be at most 72 characters.';
  return null;
}

/** Turns Supabase auth errors into copy a business owner can act on. */
export function friendlyAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes('invalid login credentials')) {
    return 'Email or password is incorrect. Try again or reset your password.';
  }
  if (normalized.includes('email not confirmed')) {
    return 'Confirm your email address first — check your inbox for the link we sent.';
  }
  if (normalized.includes('user already registered') || normalized.includes('already been registered')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (normalized.includes('password should be at least')) {
    return 'Use a password with at least 8 characters.';
  }
  if (normalized.includes('rate limit') || normalized.includes('only request this after')) {
    return 'Too many attempts. Wait a minute and try again.';
  }
  if (normalized.includes('unable to validate email') || normalized.includes('invalid email')) {
    return 'That email address does not look right.';
  }
  if (normalized.includes('same password')) {
    return 'Choose a password you have not used before.';
  }
  if (normalized.includes('network') || normalized.includes('fetch')) {
    return 'We could not reach the authentication service. Check your connection and try again.';
  }

  return message;
}
