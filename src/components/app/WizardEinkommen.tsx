import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="checkbox"
              aria-checked={showNeben}
              onClick={() => {
                if (showNeben) {
                  setShowNeben(false);
                  onChange({ gewerbeMonat: 0 });
                } else {
                  setShowNeben(true);
                }
              }}
              className={cn(
                'text-sm px-3 py-1 rounded-md border transition-colors',
                showNeben
                  ? 'border-[var(--gold)] bg-[var(--gold-dim)] text-[var(--gold)]'
                  : 'border-border text-muted-foreground hover:border-foreground/30',
              )}
            >
              {showNeben ? 'Nebeneinkommen: ja' : 'Hast du Nebeneinkommen?'}
            </button>
          </div>

          <div className={cn('field-expand', showNeben && 'open')}>
            <div>
              <div className="space-y-2 pt-1">
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
