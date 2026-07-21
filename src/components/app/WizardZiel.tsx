import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { fmtEur } from '@/lib/utils';
import type { CalcParams } from '@/lib/types';

const FRUEHRENTE_OPTIONS = [
  { value: '0',  label: 'Mit 67' },
  { value: '65', label: 'Mit 65' },
  { value: '63', label: 'Mit 63' },
  { value: '62', label: 'Mit 62' },
  { value: '60', label: 'Mit 60' },
] as const;

interface Props {
  params: CalcParams;
  onChange: (update: Partial<CalcParams>) => void;
}

export function WizardZiel({ params, onChange }: Props) {
  const rentenAlter = params.fruehRente || 67;
  const abzug = rentenAlter < 67
    ? ((67 - rentenAlter) * 3.6).toFixed(1)
    : null;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2
          className="font-medium tracking-tight text-foreground"
          style={{ fontSize: 'clamp(20px, 4vw, 28px)' }}
        >
          Was möchtest du im Alter monatlich zur Verfügung haben?
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Das ist dein persönlicher Maßstab. Wir zeigen dir ehrlich wie weit du
          davon entfernt bist — auf Basis von gesetzlicher Rente plus privater Vorsorge.
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <div className="text-center">
            <span
              className="text-4xl font-light tabular-nums"
              style={{ color: 'var(--gold)' }}
              aria-live="polite"
              aria-atomic="true"
              aria-label={`Wunschrente: ${fmtEur(params.wunschrente)} monatlich`}
            >
              {fmtEur(params.wunschrente)}
            </span>
          </div>
          <Slider
            min={500}
            max={5000}
            step={100}
            value={[params.wunschrente]}
            onValueChange={([v]) => onChange({ wunschrente: v })}
            aria-label="Gewünschte monatliche Rente"
            aria-valuemin={500}
            aria-valuemax={5000}
            aria-valuenow={params.wunschrente}
            aria-valuetext={`${fmtEur(params.wunschrente)} monatlich`}
            className="[&_[data-slot=slider-range]]:bg-[var(--gold)] [&_[data-slot=thumb]]:border-[var(--gold)] [&_[data-slot=thumb]]:bg-[var(--gold)]"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>500 €</span>
            <span>5.000 €</span>
          </div>
        </div>

        <div className="border-t border-border" />

        <div className="space-y-3">
          <Label className="text-sm text-foreground">Frühpension geplant?</Label>
          <ToggleGroup
            type="single"
            value={String(params.fruehRente)}
            onValueChange={(v) => {
              if (v !== '') onChange({ fruehRente: Number(v) });
            }}
            variant="outline"
            spacing={2}
            className="flex flex-wrap justify-start"
            aria-label="Rentenalter wählen"
          >
            {FRUEHRENTE_OPTIONS.map(({ value, label }) => (
              <ToggleGroupItem
                key={value}
                value={value}
                className="px-3 data-[state=on]:border-[var(--gold)] data-[state=on]:bg-[var(--gold-dim)] data-[state=on]:text-[var(--gold)]"
              >
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          {abzug && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Dauerhafter Abzug: {abzug} % ({67 - rentenAlter} Jahr{67 - rentenAlter !== 1 ? 'e' : ''} × 3,6 %)
            </p>
          )}
        </div>

        <div className="border-t border-border" />

        <div className="space-y-3">
          <Label className="text-sm text-muted-foreground">Planst du etwas Größeres? (optional)</Label>
          <p className="text-xs text-muted-foreground">
            Diese Angaben fließen noch nicht in die Berechnung ein — sie kommen in einer späteren Version.
          </p>
        </div>
      </div>
    </div>
  );
}
