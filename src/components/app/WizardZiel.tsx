import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { fmtEur } from '@/lib/utils';
import { StepperSlider } from './StepperSlider';
import type { CalcParams } from '@/lib/types';

const FRUEHRENTE_OPTIONS = [
  { value: '0',  label: 'Regulär mit 67', hint: 'Ohne Frühabschlag' },
  { value: '65', label: 'Mit 65', hint: 'Frühabschlag möglich' },
  { value: '63', label: 'Mit 63', hint: 'Frühabschlag möglich' },
  { value: '62', label: 'Mit 62', hint: 'Frühabschlag möglich' },
  { value: '60', label: 'Mit 60', hint: 'Frühabschlag möglich' },
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
          <StepperSlider
            label="Gewünschte monatliche Rente"
            min={500}
            max={5000}
            step={100}
            value={params.wunschrente}
            onChange={(v) => onChange({ wunschrente: v })}
            valueText={`${fmtEur(params.wunschrente)} monatlich`}
            minLabel="500 €"
            maxLabel="5.000 €"
          />
        </div>

        <div className="border-t border-border" />

        <div className="space-y-3">
          <Label id="fruehpension-label" className="text-sm text-foreground">
            Frühpension geplant?
          </Label>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Wähle dein geplantes Rentenalter — bei früherem Start können Abschläge anfallen.
          </p>
          <RadioGroup
            value={String(params.fruehRente)}
            onValueChange={(v) => onChange({ fruehRente: Number(v) })}
            aria-labelledby="fruehpension-label"
            className="gap-2"
          >
            {FRUEHRENTE_OPTIONS.map(({ value, label, hint }) => {
              const id = `frueh-${value}`;
              return (
                <label
                  key={value}
                  htmlFor={id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 transition-colors hover:bg-accent/40 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                >
                  <RadioGroupItem id={id} value={value} />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-sm font-medium text-foreground">{label}</span>
                    <span className="text-[11px] text-muted-foreground">{hint}</span>
                  </span>
                </label>
              );
            })}
          </RadioGroup>

          {abzug && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Dauerhafter Abzug: {abzug} % ({67 - rentenAlter} Jahr{67 - rentenAlter !== 1 ? 'e' : ''} × 3,6 %)
            </p>
          )}
        </div>

        <div className="border-t border-border" />

        <div className="space-y-3">
          <Label className="text-sm text-muted-foreground">Was-wäre-wenn</Label>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Nach der Analyse kannst du Szenarien wie Kind, Partnerschaft oder Gehaltsplus
            live durchspielen — ohne die Eingaben hier vorab festzulegen.
          </p>
        </div>
      </div>
    </div>
  );
}
