import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { UNTERGRUPPEN, UNTERGRUPPE_CONTEXT } from '@/lib/groups';
import type { CalcParams, Hauptgruppe } from '@/lib/types';

const FRAGE: Record<Hauptgruppe, string> = {
  angestellt:  'Wie ist dein Arbeitsverhältnis?',
  oeffentlich: 'Bist du verbeamtet?',
  selbst:      'Wie arbeitest du?',
  freiberuf:   'Gehörst du einem Versorgungswerk an?',
};

interface Props {
  params: CalcParams;
  onChange: (update: Partial<CalcParams>) => void;
  /** Called when a softExit untergruppe is selected — AlterliApp switches to soft-exit screen */
  onSoftExit: () => void;
  /** Called after selection for non-VW groups (400ms auto-advance) */
  onAutoAdvance: () => void;
}

export function WizardUntergruppe({ params, onChange, onSoftExit, onAutoAdvance }: Props) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  if (!params.hauptgruppe) return null;

  const hg = params.hauptgruppe as Hauptgruppe;
  const options = UNTERGRUPPEN[hg] ?? [];
  const ctx = UNTERGRUPPE_CONTEXT[hg];

  const handleSelect = (id: string, isSoftExit: boolean) => {
    clearTimeout(timerRef.current);
    onChange({ untergruppe: id });
    if (isSoftExit) {
      onSoftExit();
    } else {
      timerRef.current = setTimeout(onAutoAdvance, 400);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2
          id="untergruppe-frage"
          className="font-medium tracking-tight text-foreground"
          style={{ fontSize: 'clamp(20px, 4vw, 28px)' }}
        >
          {FRAGE[hg]}
        </h2>
        {ctx && (
          <p className="text-sm text-muted-foreground leading-relaxed">{ctx}</p>
        )}
      </div>

      <div
        role="radiogroup"
        aria-labelledby="untergruppe-frage"
        className="flex flex-col gap-3"
      >
        {options.map(({ id, label, hint, softExit }) => {
          const selected = params.untergruppe === id;
          return (
            <Button
              key={id}
              type="button"
              variant="outline"
              role="radio"
              aria-checked={selected}
              onClick={() => handleSelect(id, !!softExit)}
              className={cn(
                'h-auto flex flex-col items-start gap-1 px-4 py-3 text-left whitespace-normal w-full',
                'focus-visible:ring-[var(--gold)]',
                selected
                  ? 'border-[var(--gold)] bg-[var(--gold-dim)] hover:bg-[var(--gold-dim)]'
                  : 'hover:border-foreground/20',
              )}
            >
              <span className="text-sm font-medium text-foreground">{label}</span>
              <span className="text-xs text-muted-foreground font-normal">{hint}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
