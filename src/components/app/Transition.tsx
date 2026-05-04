import { useEffect } from 'react';

interface Props {
  onDone: () => void;
}

export function Transition({ onDone }: Props) {
  useEffect(() => {
    const id = setTimeout(onDone, 800);
    return () => clearTimeout(id);
  }, [onDone]);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-background gap-6 px-6"
      role="status"
      aria-live="polite"
      aria-label="Analyse wird berechnet"
    >
      <div
        className="w-8 h-8 rounded-full border-2 border-muted border-t-[var(--gold)] animate-spin"
        aria-hidden="true"
      />
      <p className="text-sm text-muted-foreground animate-pulse">
        Wir berechnen deine Analyse…
      </p>
    </div>
  );
}
