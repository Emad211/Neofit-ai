'use client';

import { useFormStatus } from 'react-dom';

export function CreateCycleButton() {
  const { pending } = useFormStatus();
  return (
    <button className="is-primary" type="submit" disabled={pending}>
      {pending ? 'در حال ساخت چرخه...' : 'ساخت چرخهٔ دوره'}
    </button>
  );
}
