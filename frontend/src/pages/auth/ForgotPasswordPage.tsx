import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../../components/AuthLayout';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { TextInput } from '../../components/ui/Field';
import { useAuth } from '../../context/AuthContext';
import { validateEmail, type FormErrors } from '../../lib/validation';

export function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const emailError = validateEmail(email);
    if (emailError) {
      setErrors({ email: emailError });
      return;
    }

    setErrors({});
    setSubmitting(true);
    setFormError(null);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'We could not send the reset email. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Reset your password"
      description="Enter the email you signed up with and we will send a secure reset link."
      footer={
        <Link to="/login" className="font-medium text-brand-700 underline-offset-4 hover:underline dark:text-brand-300">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <Alert tone="success">
          If an account exists for <strong>{email.trim()}</strong>, a reset link is on its way. The link expires
          after one hour.
        </Alert>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {formError ? <Alert tone="error">{formError}</Alert> : null}

          <TextInput
            id="reset-email"
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={errors.email}
            placeholder="you@business.com"
          />

          <Button type="submit" fullWidth loading={submitting}>
            {submitting ? 'Sending the link…' : 'Send reset link'}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
