import { ChevronRight, ChevronLeft, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { CalcParams } from '@/lib/types';

interface Props {
  params: CalcParams;
  onChange: (update: Partial<CalcParams>) => void;
  onNext: () => void;
  onBack: () => void;
}

const TIPS: Record<string, string> = {
  zvE:     'Zu versteuerndes Einkommen — Basis für Steuersatz und Riester-Eigenbeitrag.',
  zulage:  'Staatliche Förderung die jährlich auf deinen Riester-Vertrag eingezahlt wird.',
  steuerv: 'Betrag den du durch den Sonderausgabenabzug (max. 2.100 €) bei der Steuererklärung zurückbekommst.',
  rurup:   'Basisrente für Selbstständige — steuerlich absetzbar bis 27.566 € jährlich.',
  avd:     'Altersvorsorgedepot — Riester-Nachfolger ab Januar 2027. Anlage in Aktien, Fonds, ETFs.',
  bu:      'Berufsunfähigkeitsversicherung. Sichert dein Einkommen bei dauerhafter Arbeitsunfähigkeit.',
  vbl:     'VBL-Zusatzversorgung für Beschäftigte im öffentlichen Dienst — zusätzlich zur gesetzlichen Rente.',
  pension: 'Beamtenpension — ersetzt die gesetzliche Rente. Höhe abhängig von Besoldungsgruppe und Dienstjahren.',
};

function TipIcon({ tip }: { tip: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`Erklärung: ${TIPS[tip]}`}
            className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-muted-foreground/30 text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors ml-1"
          >
            <Info size={10} aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-[200px] text-xs">
          {TIPS[tip]}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function FieldRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`space-y-1.5 ${className ?? ''}`}>{children}</div>;
}

export function StepEingabe({ params, onChange, onNext, onBack }: Props) {
  const isSelbst = params.hauptgruppe === 'selbst' || params.hauptgruppe === 'freiberuf';

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold tracking-tight mb-1">Deine Angaben</h2>
        <p className="text-sm text-muted-foreground">Alle Daten bleiben lokal in deinem Browser.</p>
      </div>

      {/* Persönliches */}
      <section aria-labelledby="section-personal">
        <h3 id="section-personal" className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
          Persönliches
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <FieldRow>
            <Label htmlFor="alter">Alter: <strong>{params.alter} Jahre</strong></Label>
            <Slider
              id="alter"
              min={18} max={64} step={1}
              value={[params.alter]}
              onValueChange={([v]) => onChange({ alter: v })}
              aria-valuemin={18}
              aria-valuemax={64}
              aria-valuenow={params.alter}
              aria-valuetext={`${params.alter} Jahre`}
              aria-label="Aktuelles Alter"
            />
          </FieldRow>

          <FieldRow>
            <Label htmlFor="geschlecht">Geschlecht</Label>
            <Select
              value={params.geschlecht}
              onValueChange={(v) => onChange({ geschlecht: v as 'w' | 'm' })}
            >
              <SelectTrigger id="geschlecht" aria-label="Geschlecht auswählen">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="w">Weiblich</SelectItem>
                <SelectItem value="m">Männlich</SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>
        </div>
      </section>

      <Separator />

      {/* Einkommen */}
      <section aria-labelledby="section-income">
        <h3 id="section-income" className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
          Einkommen
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {!isSelbst && (
            <FieldRow>
              <Label htmlFor="brutto">Bruttogehalt / Monat</Label>
              <div className="relative">
                <Input
                  id="brutto"
                  type="number"
                  min={0}
                  step={100}
                  value={params.bruttoMonat}
                  onChange={(e) => onChange({ bruttoMonat: Math.max(0, +e.target.value) })}
                  aria-label="Monatliches Bruttogehalt in Euro"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">€</span>
              </div>
            </FieldRow>
          )}
          {isSelbst && (
            <FieldRow>
              <Label htmlFor="gewerbe">Monatlicher Gewinn (netto)</Label>
              <div className="relative">
                <Input
                  id="gewerbe"
                  type="number"
                  min={0}
                  step={100}
                  value={params.gewerbeMonat}
                  onChange={(e) => onChange({ gewerbeMonat: Math.max(0, +e.target.value) })}
                  aria-label="Monatlicher Gewinn in Euro"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">€</span>
              </div>
            </FieldRow>
          )}
        </div>
      </section>

      <Separator />

      {/* Lebenssituation */}
      <section aria-labelledby="section-life">
        <h3 id="section-life" className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
          Lebenssituation
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="verheiratet">Verheiratet / eingetragene Lebenspartnerschaft</Label>
            </div>
            <Switch
              id="verheiratet"
              checked={params.verheiratet}
              onCheckedChange={(v) => onChange({ verheiratet: v })}
              aria-label="Verheiratet oder eingetragene Lebenspartnerschaft"
            />
          </div>

          <FieldRow>
            <Label htmlFor="kinder">
              Kinder mit Riester-Anspruch: <strong>{params.kinder}</strong>
            </Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline" size="sm"
                onClick={() => onChange({ kinder: Math.max(0, params.kinder - 1) })}
                aria-label="Anzahl Kinder verringern"
                disabled={params.kinder === 0}
              >−</Button>
              <span className="w-6 text-center text-sm font-medium tabular-nums" aria-live="polite">{params.kinder}</span>
              <Button
                variant="outline" size="sm"
                onClick={() => onChange({ kinder: Math.min(8, params.kinder + 1) })}
                aria-label="Anzahl Kinder erhöhen"
              >+</Button>
            </div>
          </FieldRow>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="hatbu" className="flex items-center gap-1">
                BU-Versicherung vorhanden
                <TipIcon tip="bu" />
              </Label>
            </div>
            <Switch
              id="hatbu"
              checked={params.hatBU}
              onCheckedChange={(v) => onChange({ hatBU: v })}
              aria-label="Berufsunfähigkeitsversicherung vorhanden"
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* Altersvorsorge */}
      {(params.hauptgruppe === 'angestellt' || params.hauptgruppe === 'oeffentlich') && (
        <section aria-labelledby="section-vorsorge">
          <h3 id="section-vorsorge" className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
            Altersvorsorge
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="hatriester">Riester-Vertrag vorhanden</Label>
              <Switch
                id="hatriester"
                checked={params.hatRiester}
                onCheckedChange={(v) => onChange({ hatRiester: v })}
                aria-label="Riester-Vertrag vorhanden"
              />
            </div>
            {params.hatRiester && (
              <FieldRow>
                <Label htmlFor="jahreRiester">
                  Riester läuft seit: <strong>{params.jahreRiester} Jahren</strong>
                </Label>
                <Slider
                  id="jahreRiester"
                  min={0} max={40} step={1}
                  value={[params.jahreRiester]}
                  onValueChange={([v]) => onChange({ jahreRiester: v })}
                  aria-valuemin={0}
                  aria-valuemax={40}
                  aria-valuenow={params.jahreRiester}
                  aria-valuetext={`${params.jahreRiester} Jahre`}
                  aria-label="Laufzeit des Riester-Vertrags in Jahren"
                />
              </FieldRow>
            )}
            {params.verheiratet && params.hatRiester && (
              <div className="flex items-center justify-between">
                <Label htmlFor="partnerriester">Partner:in hat eigenen Riester</Label>
                <Switch
                  id="partnerriester"
                  checked={params.partnerRiester}
                  onCheckedChange={(v) => onChange({ partnerRiester: v })}
                  aria-label="Lebenspartner:in hat eigenen Riester-Vertrag"
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} aria-label="Zurück zur Berufsgruppe">
          <ChevronLeft size={16} aria-hidden="true" />
          Zurück
        </Button>
        <Button onClick={onNext} className="flex-1 sm:flex-none" aria-label="Weiter zu den Szenarien">
          Weiter
          <ChevronRight size={16} aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
