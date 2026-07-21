import { Minus, Plus } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CalcParams } from '@/lib/types';

interface Props {
  params: CalcParams;
  onChange: (update: Partial<CalcParams>) => void;
}

function Stepper({
  value, min = 0, max = 8, onChange, label,
}: { value: number; min?: number; max?: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="flex items-center gap-3" role="group" aria-label={label}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`${label} verringern`}
        className="size-9"
      >
        <Minus size={14} aria-hidden="true" />
      </Button>
      <span
        className="text-sm font-medium tabular-nums min-w-[2ch] text-center"
        style={{ color: 'var(--gold)' }}
        aria-live="polite"
        aria-atomic="true"
      >
        {value}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`${label} erhöhen`}
        className="size-9"
      >
        <Plus size={14} aria-hidden="true" />
      </Button>
    </div>
  );
}

export function WizardLeben({ params, onChange }: Props) {
  const handleKaltmiete = (raw: string) => {
    const v = parseInt(raw.replace(/\D/g, ''), 10);
    onChange({ kaltmiete: isNaN(v) ? 0 : v });
  };
  const handleRestschuld = (raw: string) => {
    const v = parseInt(raw.replace(/\D/g, ''), 10);
    onChange({ restschuld: isNaN(v) ? 0 : v });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2
          className="font-medium tracking-tight text-foreground"
          style={{ fontSize: 'clamp(20px, 4vw, 28px)' }}
        >
          Wie sieht dein Leben aus?
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Kinder und Partnerschaft verändern die staatliche Förderung erheblich.
        </p>
      </div>

      <div className="space-y-6">
        {/* Partnerschaft */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="verheiratet" className="text-sm text-foreground cursor-pointer">
              In einer Partnerschaft
            </Label>
            <Switch
              id="verheiratet"
              checked={params.verheiratet}
              onCheckedChange={(v) => onChange({ verheiratet: v, partnerRiester: v ? params.partnerRiester : false })}
              aria-checked={params.verheiratet}
            />
          </div>

          <div className={cn('field-expand', params.verheiratet && 'open')}>
            <div>
              <div className="pt-3 flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="partnerRiester" className="text-sm text-foreground cursor-pointer">
                    Partner:in hat Riester
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Ermöglicht mittelbaren Vertrag mit zusätzlicher Förderung.
                  </p>
                </div>
                <Switch
                  id="partnerRiester"
                  checked={params.partnerRiester}
                  onCheckedChange={(v) => onChange({ partnerRiester: v })}
                  aria-checked={params.partnerRiester}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Kinder */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm text-foreground">Kinder nach 2008</Label>
            <p className="text-xs text-muted-foreground">+300 € Staatszulage pro Kind / Jahr</p>
          </div>
          <Stepper
            value={params.kinder}
            onChange={(v) => onChange({ kinder: v })}
            label="Anzahl Kinder"
          />
        </div>

        <div className="border-t border-border" />

        {/* Immobilie */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="hatImmobilie" className="text-sm text-foreground cursor-pointer">
              Eigentum vorhanden
            </Label>
            <Switch
              id="hatImmobilie"
              checked={params.hatImmobilie}
              onCheckedChange={(v) => onChange({
                hatImmobilie: v,
                immobilieSelbst: v ? params.immobilieSelbst : false,
                kaltmiete: v ? params.kaltmiete : 0,
                restschuld: v ? params.restschuld : 0,
              })}
              aria-checked={params.hatImmobilie}
            />
          </div>

          <div className={cn('field-expand', params.hatImmobilie && 'open')}>
            <div>
              <div className="pt-3 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="immobilieSelbst" className="text-sm text-foreground cursor-pointer">
                      Selbst bewohnt
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Nur bei Eigennutzung ist Wohn-Riester möglich.
                    </p>
                  </div>
                  <Switch
                    id="immobilieSelbst"
                    checked={params.immobilieSelbst}
                    onCheckedChange={(v) => onChange({ immobilieSelbst: v })}
                    aria-checked={params.immobilieSelbst}
                  />
                </div>

                <div className={cn('field-expand', params.immobilieSelbst && 'open')}>
                  <div>
                    <div className="pt-2 space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="kaltmiete" className="text-sm text-muted-foreground">
                          Ersparte Kaltmiete / Monat
                        </Label>
                        <div className="relative">
                          <Input
                            id="kaltmiete"
                            inputMode="numeric"
                            value={params.kaltmiete === 0 ? '' : String(params.kaltmiete)}
                            onChange={(e) => handleKaltmiete(e.target.value)}
                            placeholder="800"
                            className="pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="restschuld" className="text-sm text-muted-foreground">
                          Restschuld Hypothek
                        </Label>
                        <div className="relative">
                          <Input
                            id="restschuld"
                            inputMode="numeric"
                            value={params.restschuld === 0 ? '' : String(params.restschuld)}
                            onChange={(e) => handleRestschuld(e.target.value)}
                            placeholder="0"
                            className="pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
