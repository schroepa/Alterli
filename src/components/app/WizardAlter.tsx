import { Slider } from '@/components/ui/slider';
import type { CalcParams } from '@/lib/types';

interface Props {
  params: CalcParams;
  onChange: (update: Partial<CalcParams>) => void;
}

export function WizardAlter({ params, onChange }: Props) {
  const jahreLeft = 67 - params.alter;

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h2
          className="font-medium tracking-tight text-foreground"
          style={{ fontSize: 'clamp(20px, 4vw, 28px)' }}
        >
          Wie alt bist du?
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Je früher wir wissen wie viel Zeit du noch hast, desto besser können wir
          einschätzen was möglich ist.
        </p>
      </div>

      <div className="space-y-6">
        <div className="text-center">
          <span
            className="text-5xl font-light tabular-nums"
            style={{ color: 'var(--gold)' }}
            aria-live="polite"
            aria-atomic="true"
            aria-label={`Alter: ${params.alter} Jahre`}
          >
            {params.alter}
          </span>
        </div>

        <Slider
          min={18}
          max={66}
          step={1}
          value={[params.alter]}
          onValueChange={([v]) => onChange({ alter: v })}
          aria-label="Alter"
          aria-valuemin={18}
          aria-valuemax={66}
          aria-valuenow={params.alter}
          aria-valuetext={`${params.alter} Jahre`}
          className="[&_[data-slot=slider-range]]:bg-[var(--gold)] [&_[data-slot=thumb]]:border-[var(--gold)] [&_[data-slot=thumb]]:bg-[var(--gold)]"
        />

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>18</span>
          <span className="text-sm text-foreground">
            {jahreLeft > 0
              ? `${jahreLeft} Jahre bis zur Rente`
              : 'Rentenalter erreicht'}
          </span>
          <span>66</span>
        </div>
      </div>
    </div>
  );
}
