import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import type { CalcParams } from '@/lib/types';

interface Props {
  params: CalcParams;
  onChange: (update: Partial<CalcParams>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepSzenario({ params, onChange, onNext, onBack }: Props) {
  const fruehRenteAktiv = params.fruehRente > 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold tracking-tight mb-1">Szenarien & Ziel</h2>
        <p className="text-sm text-muted-foreground">Was-wäre-wenn — und was du im Alter brauchst.</p>
      </div>

      {/* Wunschrente */}
      <section aria-labelledby="section-ziel">
        <h3 id="section-ziel" className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
          Rentenziel
        </h3>
        <div className="space-y-1.5">
          <Label htmlFor="wunschrente">Gewünschtes Netto-Renteneinkommen / Monat</Label>
          <div className="relative">
            <Input
              id="wunschrente"
              type="number"
              min={0}
              step={100}
              value={params.wunschrente}
              onChange={(e) => onChange({ wunschrente: Math.max(0, +e.target.value) })}
              aria-label="Gewünschtes monatliches Nettoeinkommen im Ruhestand in Euro"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">€</span>
          </div>
        </div>
      </section>

      <Separator />

      {/* Frühpension */}
      <section aria-labelledby="section-fruehenrente">
        <h3 id="section-fruehenrente" className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
          Frühpension
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="fruehenrente-toggle">Ich plane vor 67 in Rente zu gehen</Label>
            <Switch
              id="fruehenrente-toggle"
              checked={fruehRenteAktiv}
              onCheckedChange={(v) => onChange({ fruehRente: v ? 63 : 0 })}
              aria-label="Frührenteneintritt aktivieren"
            />
          </div>
          {fruehRenteAktiv && (
            <div className="space-y-1.5">
              <Label htmlFor="fruehenrente-alter">
                Rentenalter: <strong>{params.fruehRente} Jahre</strong>
                <span className="text-muted-foreground text-xs ml-2">
                  (Abschlag: {Math.round(Math.max(0, 67 - params.fruehRente) * 3.6)}%)
                </span>
              </Label>
              <Slider
                id="fruehenrente-alter"
                min={55} max={66} step={1}
                value={[params.fruehRente]}
                onValueChange={([v]) => onChange({ fruehRente: v })}
                aria-valuemin={55}
                aria-valuemax={66}
                aria-valuenow={params.fruehRente}
                aria-valuetext={`${params.fruehRente} Jahre, Abschlag ${Math.round(Math.max(0, 67 - params.fruehRente) * 3.6)} Prozent`}
                aria-label="Gewünschtes Rentenalter"
              />
            </div>
          )}
        </div>
      </section>

      <Separator />

      {/* Inflation */}
      <section aria-labelledby="section-inflation">
        <h3 id="section-inflation" className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
          Annahmen
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="inflation">Kaufkraftverlust berücksichtigen</Label>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Zeigt Kapitalwerte in heutiger Kaufkraft (ca. 2% p.a. Inflation)
            </p>
          </div>
          <Switch
            id="inflation"
            checked={params.inflation}
            onCheckedChange={(v) => onChange({ inflation: v })}
            aria-label="Inflation und Kaufkraftverlust in der Projektion berücksichtigen"
          />
        </div>
      </section>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} aria-label="Zurück zu den Eingaben">
          <ChevronLeft size={16} aria-hidden="true" />
          Zurück
        </Button>
        <Button onClick={onNext} className="flex-1 sm:flex-none" aria-label="Zur Ergebnisansicht">
          Analyse starten
          <ChevronRight size={16} aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
