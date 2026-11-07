import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/AuthLayout';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { TextInput } from '../../components/ui/Field';
import { FullPageLoader } from '../../components/ui/StateViews';
import { useAuth } from '../../context/AuthContext';
import { validatePassword, type FormErrors } from '../../lib/validation';

export function ResetPasswordPage() {
  const { session, loading, updatePassword, signOut } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setWaited(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: FormErrors = {};
    const passwordError = validatePassword(password);
    if (passwordError) nextErrors.password = passwordError;
    if (confirmPassword !== password) nextErrors.confirmPassword = 'Passwords do not match.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setFormError(null);
    try {
      await updatePassword(password);
      setSaved(true);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'We could not update your password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleContinue() {
    try {
      await signOut();
    } catch {
      // Signing out is best effort; the redirect still works.
    }
    navigate('/login', { replace: true });
  }

  if (loading || (!session && !waited)) {
    return (
      <div className="min-h-screen bg-page">
        <FullPageLoader label="Verifying your reset link…" />
      </div>
    );
  }

  if (!session) {
    return (
      <AuthLayout
        title="This link has expired"
        description="Password reset links can only be used once and expire after an hour. Request a new one to continue."
        footer={
          <Link to="/login" className="font-medium text-brand-700 underline-offset-4 hover:underline dark:text-brand-300">
            Back to sign in
          </Link>
        }
      >
        <Link
          to="/forgot-password"
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-brand-700 px-4 text-sm font-medium text-white hover:bg-brand-800"
        >
          Request a new link
        </Link>
      </AuthLayout>
    );
  }

  if (saved) {
    return (
      <AuthLayout title="Password updated" description="Use your new password the next time you sign in.">
        <div className="space-y-4">
          <Alert tone="success">Your password has been changed successfully.</Alert>
          <Button fullWidth onClick={handleContinue}>
            Continue to sign in
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Choose a new password"
      description={`You are resetting the password for ${session.user.email ?? 'your account'}.`}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError ? <Alert tone="error">{formError}</Alert> : null}

        <TextInput
          id="new-password"
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
          hint="At least 8 characters."
        />

        <TextInput
          id="new-password-confirm"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          error={errors.confirmPassword}
        />

        <Button type="submit" fullWidth loading={submitting}>
          {submitting ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </AuthLayout>
  );
}
