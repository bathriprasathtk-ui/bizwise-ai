import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '../../lib/cn';

const CONTROL =
  'w-full min-h-[44px] rounded-xl border bg-surface px-3 py-2 text-sm text-heading placeholder:text-subtle transition-colors disabled:cursor-not-allowed disabled:bg-surface-muted';

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  optionalLabel?: string;
  children: ReactNode;
  className?: string;
}

export function Field({ id, label, hint, error, required, optionalLabel, children, className }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="flex items-baseline gap-1 text-sm font-medium text-heading">
        {label}
        {required ? (
          <span aria-hidden="true" className="text-brand-700 dark:text-brand-300">
            *
          </span>
        ) : null}
        {optionalLabel ? <span className="text-xs font-normal text-subtle">{optionalLabel}</span> : null}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-xs leading-relaxed text-subtle">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, hint?: string, error?: string): string | undefined {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
  optionalLabel?: string;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { id, label, hint, error, required, optionalLabel, className, containerClassName, ...rest },
  ref,
) {
  return (
    <Field
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      optionalLabel={optionalLabel}
      className={containerClassName}
    >
      <input
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        required={required}
        className={cn(CONTROL, error ? 'border-red-400' : 'border-line', className)}
        {...rest}
      />
    </Field>
  );
});

interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

export function SelectInput({ id, label, hint, error, required, children, className, ...rest }: SelectInputProps) {
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        required={required}
        className={cn(CONTROL, 'appearance-none pr-9', error ? 'border-red-400' : 'border-line', className)}
        {...rest}
      >
        {children}
      </select>
    </Field>
  );
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optionalLabel?: string;
}

export function TextArea({ id, label, hint, error, required, optionalLabel, className, ...rest }: TextAreaProps) {
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required} optionalLabel={optionalLabel}>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        required={required}
        className={cn(CONTROL, 'min-h-[96px] py-2.5', error ? 'border-red-400' : 'border-line', className)}
        {...rest}
      />
    </Field>
  );
}
