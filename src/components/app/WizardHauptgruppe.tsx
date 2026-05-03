import { useRef } from 'react';
import { Briefcase, Building2, Wrench, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HAUPTGRUPPEN } from '@/lib/groups';
import type { CalcParams, Hauptgruppe } from '@/lib/types';
import type { LucideIcon } from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  Briefcase, Building2, Wrench, Scale,
};

interface Props {
  params: CalcParams;
  onChange: (update: Partial<CalcParams>) => void;
  /** Called after 400ms; AlterliApp navigates to next step */
  onAutoAdvance: () => void;
}

export function WizardHauptgruppe({ params, onChange, onAutoAdvance }: Props) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleSelect = (id: Hauptgruppe) => {
    clearTimeout(timerRef.current);
    onChange({ hauptgruppe: id, untergruppe: '' });
    timerRef.current = setTimeout(onAutoAdvance, 400);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2
          className="font-medium tracking-tight text-foreground"
          style={{ fontSize: 'clamp(20px, 4vw, 28px)' }}
        >
          Wie bist du beschäftigt?
        </h2>
      </div>

      <div
        role="radiogroup"
        aria-label="Beschäftigungsart wählen"
        className="grid grid-cols-2 gap-3"
      >
        {HAUPTGRUPPEN.map(({ id, label, sub, iconName }) => {
          const Icon = ICONS[iconName];
          const selected = params.hauptgruppe === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => handleSelect(id)}
              className={cn(
                'flex flex-col gap-3 p-4 min-h-[80px] rounded-lg border text-left',
                'transition-all duration-150 focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2',
                selected
                  ? 'border-[var(--gold)] bg-[var(--gold-dim)]'
                  : 'border-border bg-transparent hover:border-foreground/20',
              )}
            >
              <Icon
                size={18}
                aria-hidden="true"
                className={selected ? 'text-[var(--gold)]' : 'text-muted-foreground'}
              />
              <div>
                <div className="text-sm font-medium text-foreground">{label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
