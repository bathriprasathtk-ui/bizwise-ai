import { MailCheck } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/AuthLayout';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { TextInput } from '../../components/ui/Field';
import { useAuth } from '../../context/AuthContext';
import { validateEmail, validatePassword, type FormErrors } from '../../lib/validation';

export function SignupPage() {
  const { signUp, session, loading } = useAuth();
  const navigate = useNavigate();

  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate('/app/dashboard', { replace: true });
  }, [loading, session, navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: FormErrors = {};

    if (businessName.trim().length > 120) {
      nextErrors.businessName = 'Keep the business name under 120 characters.';
    }
    const emailError = validateEmail(email);
    if (emailError) nextErrors.email = emailError;
    const passwordError = validatePassword(password);
    if (passwordError) nextErrors.password = passwordError;
    if (confirmPassword !== password) nextErrors.confirmPassword = 'Passwords do not match.';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setFormError(null);
    try {
      const result = await signUp(email, password, businessName);
      if (result.needsEmailConfirmation) {
        setConfirmationSent(true);
      } else {
        navigate('/app/dashboard', { replace: true });
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'We could not create your account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmationSent) {
    return (
      <AuthLayout
        title="Check your inbox"
        description={`We sent a confirmation link to ${email.trim()}. Open it to activate your account, then sign in.`}
        footer={
          <Link to="/login" className="font-medium text-brand-700 underline-offset-4 hover:underline dark:text-brand-300">
            Back to sign in
          </Link>
        }
      >
        <div className="flex items-start gap-3 rounded-xl border border-line bg-surface-muted p-4">
          <MailCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-700 dark:text-brand-300" />
          <p className="text-sm leading-relaxed text-body">
            No email after a few minutes? Check your spam folder. If confirmations are disabled in your Supabase
            project you can sign in right away instead.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      description="Start with your business name — you can add numbers in the next step."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-700 underline-offset-4 hover:underline dark:text-brand-300">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError ? <Alert tone="error">{formError}</Alert> : null}

        <TextInput
          id="signup-business"
          label="Business name"
          optionalLabel="(optional)"
          value={businessName}
          onChange={(event) => setBusinessName(event.target.value)}
          error={errors.businessName}
          placeholder="Acme Coffee Co."
          autoComplete="organization"
          hint="You can change this later in Settings."
        />

        <TextInput
          id="signup-email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
          placeholder="you@business.com"
        />

        <TextInput
          id="signup-password"
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
          hint="At least 8 characters."
        />

        <TextInput
          id="signup-confirm"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          error={errors.confirmPassword}
        />

        <Button type="submit" fullWidth loading={submitting}>
          {submitting ? 'Creating your account…' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  );
}
