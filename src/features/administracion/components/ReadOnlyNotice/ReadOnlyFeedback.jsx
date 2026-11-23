import { useEffect, useState } from 'react';

import { observeReadOnlyRejections } from '../../api/observeReadOnlyRejections.js';
import { ReadOnlyNotice } from './ReadOnlyNotice.jsx';

export function ReadOnlyFeedback() {
  const [message, setMessage] = useState(null);

  useEffect(() => observeReadOnlyRejections(setMessage), []);

  if (message === null) return null;

  return (
    <div className="px-[var(--space-4)] pt-[var(--space-4)] md:px-[var(--space-6)] lg:px-[var(--space-8)]">
      <ReadOnlyNotice role="alert">{message || undefined}</ReadOnlyNotice>
    </div>
  );
}
