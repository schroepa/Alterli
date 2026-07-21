import { Info } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { StepperSlider } from './StepperSlider';
import type { CalcParams } from '@/lib/types';

interface Props {
  params: CalcParams;
  onChange: (update: Partial<CalcParams>) => void;
}

export function WizardVorsorge({ params, onChange }: Props) {
  const isSelbst = params.hauptgruppe === 'selbst' || params.hauptgruppe === 'freiberuf';
  const isBeamter = params.untergruppe === 'beamter';
  const maxRiesterJahre = Math.max(1, params.alter - 18);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2
          className="font-medium tracking-tight text-foreground"
          style={{ fontSize: 'clamp(20px, 4vw, 28px)' }}
        >
          Was hast du bereits?
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Wir schauen was da ist — und was fehlt.
        </p>
      </div>

      <div className="space-y-6">
        {/* Riester / Rürup */}
        {isSelbst ? (
          <div className="rounded-lg border border-border bg-muted/30 p-4 flex gap-3">
            <Info size={16} className="text-muted-foreground mt-0.5 shrink-0" aria-hidden="true" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Rürup statt Riester</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Als Selbstständige:r ist die Rürup-Rente dein primäres gefördertes Instrument.
                Wir analysieren das automatisch.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="hatRiester" className="text-sm text-foreground cursor-pointer">
                  Riester-Vertrag vorhanden
                </Label>
                {isBeamter && (
                  <p className="text-xs text-muted-foreground">
                    Für Beamte optional — die Pension ist deine primäre Versorgung.
                  </p>
                )}
              </div>
              <Switch
                id="hatRiester"
                checked={params.hatRiester}
                onCheckedChange={(v) => onChange({ hatRiester: v })}
                aria-checked={params.hatRiester}
              />
            </div>

            <div className={cn('field-expand', params.hatRiester && 'open')}>
              <div>
                <div className="pt-3 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <Label className="text-muted-foreground">Wie viele Jahre läuft er?</Label>
                    <span
                      className="font-medium tabular-nums"
                      style={{ color: 'var(--gold)' }}
                      aria-live="polite"
                      aria-atomic="true"
                      aria-label={`${params.jahreRiester} Jahre`}
                    >
                      {params.jahreRiester}
                    </span>
                  </div>
                  <StepperSlider
                    label="Jahre des Riester-Vertrags"
                    min={1}
                    max={maxRiesterJahre}
                    step={1}
                    value={Math.min(params.jahreRiester, maxRiesterJahre)}
                    onChange={(v) => onChange({ jahreRiester: v })}
                    valueText={`${params.jahreRiester} Jahre`}
                    minLabel="1"
                    maxLabel={String(maxRiesterJahre)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-border" />

        {/* BU */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="hatBU" className="text-sm text-foreground cursor-pointer">
              BU- / Dienstunfähigkeitsversicherung
            </Label>
            <p className="text-xs text-muted-foreground">
              Schützt dein gesamtes Vorsorgekonzept bei Berufsunfähigkeit.
            </p>
          </div>
          <Switch
            id="hatBU"
            checked={params.hatBU}
            onCheckedChange={(v) => onChange({ hatBU: v })}
            aria-checked={params.hatBU}
          />
        </div>

        <div className="border-t border-border" />

        {/* Inflation */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="inflation" className="text-sm text-foreground cursor-pointer">
              Inflation berücksichtigen
            </Label>
            <p className="text-xs text-muted-foreground">
              Kaufkraftverlust von 2 % pro Jahr eingerechnet.
            </p>
          </div>
          <Switch
            id="inflation"
            checked={params.inflation}
            onCheckedChange={(v) => onChange({ inflation: v })}
            aria-checked={params.inflation}
          />
        </div>
      </div>
    </div>
  );
}
