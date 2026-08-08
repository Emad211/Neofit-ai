'use client';

import { useFormStatus } from 'react-dom';

export function AuthSubmitButton({
  children,
  pendingLabel = 'در حال انجام...',
  disabled = false,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={disabled || pending} aria-disabled={disabled || pending}>
      {pending ? pendingLabel : children}
    </button>
  );
}
