import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface Props {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  /** Accessible name for the control group */
  label: string;
  valueText?: string;
  minLabel?: ReactNode;
  maxLabel?: ReactNode;
  centerLabel?: ReactNode;
  /** Wizard-Gold oder Default-Primary */
  accent?: 'gold' | 'primary';
  className?: string;
}

/**
 * Dicker Slider mit ±-Buttons (shadcn Button + Slider).
 * Gut bedienbar per Touch, Maus und Tastatur.
 */
export function StepperSlider({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  valueText,
  minLabel,
  maxLabel,
  centerLabel,
  accent = 'gold',
  className,
}: Props) {
  const clamped = Math.min(max, Math.max(min, value));
  const atMin = clamped <= min;
  const atMax = clamped >= max;

  const bump = (dir: -1 | 1) => {
    const next = Math.min(max, Math.max(min, clamped + dir * step));
    if (next !== clamped) onChange(next);
  };

  return (
    <div className={cn('space-y-3', className)} role="group" aria-label={label}>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 shrink-0 rounded-lg"
          onClick={() => bump(-1)}
          disabled={atMin}
          aria-label={`${label} verringern`}
        >
          <Minus size={18} aria-hidden="true" />
        </Button>

        <Slider
          min={min}
          max={max}
          step={step}
          value={[clamped]}
          onValueChange={([v]) => onChange(v)}
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={clamped}
          aria-valuetext={valueText ?? String(clamped)}
          className={cn(
            'min-w-0 flex-1',
            accent === 'gold' &&
              '[&_[data-slot=slider-range]]:bg-[var(--gold)] [&_[data-slot=slider-thumb]]:border-[var(--gold)] [&_[data-slot=slider-thumb]]:bg-[var(--gold)] [&_[data-slot=slider-thumb]]:ring-[var(--gold)]/30',
          )}
        />

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 shrink-0 rounded-lg"
          onClick={() => bump(1)}
          disabled={atMax}
          aria-label={`${label} erhöhen`}
        >
          <Plus size={18} aria-hidden="true" />
        </Button>
      </div>

      {(minLabel != null || maxLabel != null || centerLabel != null) && (
        <div className="flex justify-between gap-2 text-xs text-muted-foreground px-0.5">
          <span className="tabular-nums">{minLabel}</span>
          {centerLabel != null && (
            <span className="text-sm text-foreground text-center">{centerLabel}</span>
          )}
          <span className="tabular-nums text-right">{maxLabel}</span>
        </div>
      )}
    </div>
  );
}
