import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { GlossarTerm } from './GlossarTerm';
import { StepperSlider } from './StepperSlider';
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

        <StepperSlider
          label="Alter"
          min={18}
          max={66}
          step={1}
          value={params.alter}
          onChange={(v) => onChange({ alter: v })}
          valueText={`${params.alter} Jahre`}
          minLabel="18"
          maxLabel="66"
          centerLabel={
            jahreLeft > 0
              ? `${jahreLeft} Jahre bis zur Rente`
              : 'Rentenalter erreicht'
          }
        />
      </div>

      <div className="space-y-3 border-t border-border pt-8">
        <Label id="geschlecht-label" className="text-sm text-foreground">
          Geschlecht{' '}
          <span className="text-muted-foreground font-normal">(für Lebenserwartung)</span>
        </Label>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Beeinflusst nur die geschätzte Rentenbezugsdauer — keine anderen Annahmen.
        </p>
        <RadioGroup
          value={params.geschlecht}
          onValueChange={(v) => {
            if (v === 'w' || v === 'm') onChange({ geschlecht: v });
          }}
          aria-labelledby="geschlecht-label"
          className="gap-2"
        >
          {(
            [
              { value: 'w', label: 'Weiblich' },
              { value: 'm', label: 'Männlich' },
            ] as const
          ).map(({ value, label }) => {
            const id = `geschlecht-${value}`;
            return (
              <label
                key={value}
                htmlFor={id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 transition-colors hover:bg-accent/40 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
              >
                <RadioGroupItem id={id} value={value} />
                <span className="text-sm font-medium text-foreground">{label}</span>
              </label>
            );
          })}
        </RadioGroup>
        <p className="text-[11px] text-muted-foreground">
          Statistische{' '}
          <GlossarTerm term="basisrente">Basisrente</GlossarTerm>
          {' '}bleibt unabhängig davon gleich modelliert.
        </p>
      </div>
    </div>
  );
}
