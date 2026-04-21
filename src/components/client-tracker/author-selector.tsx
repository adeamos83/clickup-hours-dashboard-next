'use client';

import { useCallback, useState } from 'react';

const STORAGE_KEY = 'client-tracker-author';
const AUTHORS = ['Ade', 'Dre'] as const;
export type TrackerAuthor = (typeof AUTHORS)[number];

function readStoredAuthor(): TrackerAuthor {
  if (typeof window === 'undefined') return 'Ade';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'Dre' ? 'Dre' : 'Ade';
}

export function useTrackerAuthor(): [TrackerAuthor, (a: TrackerAuthor) => void] {
  const [author, setAuthorState] = useState<TrackerAuthor>(readStoredAuthor);

  const setAuthor = useCallback((a: TrackerAuthor) => {
    setAuthorState(a);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, a);
    }
  }, []);

  return [author, setAuthor];
}

export function AuthorSelector({
  author,
  onChange,
  label = 'Commenting as',
}: {
  author: TrackerAuthor;
  onChange: (a: TrackerAuthor) => void;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex overflow-hidden rounded-md border border-border text-xs">
        {AUTHORS.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => onChange(a)}
            className={`px-2.5 py-1 font-medium transition-colors ${
              author === a
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground hover:bg-muted'
            }`}
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}
