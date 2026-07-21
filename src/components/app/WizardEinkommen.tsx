import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { CalcParams } from '@/lib/types';

interface Props {
  params: CalcParams;
  onChange: (update: Partial<CalcParams>) => void;
}

export function WizardEinkommen({ params, onChange }: Props) {
  const isSelbst = params.hauptgruppe === 'selbst' || params.hauptgruppe === 'freiberuf';
  const [showNeben, setShowNeben] = useState(params.gewerbeMonat > 0);

  const hauptLabel = isSelbst
    ? 'Monatliche Einnahmen (nach Betriebsausgaben)'
    : 'Bruttogehalt / Monat';
  const hauptCtx = isSelbst
    ? 'Schätze deinen durchschnittlichen monatlichen Überschuss nach Ausgaben.'
    : 'Wir berechnen daraus deinen Riester-Eigenbeitrag und deinen Steuervorteil.';
  const nebenLabel = isSelbst ? 'Angestellten-Nebentätigkeit' : 'Nebeneinnahmen / Monat';

  const handleHaupt = (raw: string) => {
    const v = parseInt(raw.replace(/\D/g, ''), 10);
    onChange({ bruttoMonat: isNaN(v) ? 0 : v });
  };
  const handleNeben = (raw: string) => {
    const v = parseInt(raw.replace(/\D/g, ''), 10);
    onChange({ gewerbeMonat: isNaN(v) ? 0 : v });
  };

  const toggleNeben = (on: boolean) => {
    setShowNeben(on);
    if (!on) onChange({ gewerbeMonat: 0 });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2
          className="font-medium tracking-tight text-foreground"
          style={{ fontSize: 'clamp(20px, 4vw, 28px)' }}
        >
          Was verdienst du monatlich?
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{hauptCtx}</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="brutto" className="text-sm text-muted-foreground">
            {hauptLabel}
          </Label>
          <div className="relative">
            <Input
              id="brutto"
              inputMode="numeric"
              value={params.bruttoMonat === 0 ? '' : String(params.bruttoMonat)}
              onChange={(e) => handleHaupt(e.target.value)}
              placeholder="2.500"
              aria-required="true"
              className="pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              €
            </span>
          </div>
        </div>

        <div className="space-y-1 border-t border-border pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-0.5 min-w-0">
              <Label htmlFor="hatNeben" className="text-sm text-foreground cursor-pointer">
                Nebeneinkommen vorhanden
              </Label>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Einschalten, um einen zweiten Betrag anzugeben (Gewerbe, Freelance, Nebenjob).
              </p>
            </div>
            <Switch
              id="hatNeben"
              checked={showNeben}
              onCheckedChange={toggleNeben}
              aria-checked={showNeben}
              aria-controls="neben-felder"
            />
          </div>

          <div id="neben-felder" className={cn('field-expand', showNeben && 'open')}>
            <div>
              <div className="space-y-2 pt-4">
                <Label htmlFor="neben" className="text-sm text-muted-foreground">
                  {nebenLabel}
                </Label>
                <div className="relative">
                  <Input
                    id="neben"
                    inputMode="numeric"
                    value={params.gewerbeMonat === 0 ? '' : String(params.gewerbeMonat)}
                    onChange={(e) => handleNeben(e.target.value)}
                    placeholder="0"
                    className="pr-8"
                    aria-label={nebenLabel}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    €
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Monatlicher Zufluss aus Gewerbe, Freelance oder Nebentätigkeit
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
