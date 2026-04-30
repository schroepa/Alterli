import { Briefcase, Building2, Radio, Package, ChevronRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { CalcParams, Hauptgruppe } from '@/lib/types';
import { cn } from '@/lib/utils';

interface Props {
  params: CalcParams;
  onChange: (update: Partial<CalcParams>) => void;
  onNext: () => void;
}

const HAUPTGRUPPEN = [
  { id: 'angestellt'  as Hauptgruppe, label: 'Angestellt', sub: 'Privatwirtschaft',        Icon: Briefcase },
  { id: 'oeffentlich' as Hauptgruppe, label: 'Öffentl. Dienst', sub: 'Beamte · TVöD · TV-L', Icon: Building2 },
  { id: 'selbst'      as Hauptgruppe, label: 'Selbstständig', sub: 'Gewerbe · Freischaffend', Icon: Radio },
  { id: 'freiberuf'   as Hauptgruppe, label: 'Freier Beruf', sub: 'Versorgungswerk · Sonstige', Icon: Package },
];

const UNTERGRUPPEN: Record<Hauptgruppe, Array<{ id: string; label: string; hint: string; softExit?: boolean }>> = {
  angestellt: [
    { id: 'vollzeit',  label: 'Vollzeit',              hint: 'Standard-Riester-Förderung' },
    { id: 'teilzeit',  label: 'Teilzeit',              hint: 'Anteilige Riester-Förderung' },
    { id: 'minijob',   label: 'Minijob (bis 556 €/Mo)', hint: 'Riester möglich, Eigenbeitrag beachten' },
  ],
  oeffentlich: [
    { id: 'beamter', label: 'Beamte:r',            hint: 'Pension statt Rente · Riester optional' },
    { id: 'tvoed',   label: 'Angestellt (TVöD/TV-L)', hint: 'GRV + VBL-Zusatzversorgung' },
  ],
  selbst: [
    { id: 'gewerbe',   label: 'Gewerbetreibend',          hint: 'Rürup als Hauptinstrument' },
    { id: 'freischaf', label: 'Freischaffend / Creative', hint: 'Rürup + ggf. KSK-Absicherung' },
  ],
  freiberuf: [
    { id: 'vw_arzt',   label: 'Arzt / Zahnarzt',         hint: 'Versorgungswerk · Hinweis',   softExit: true },
    { id: 'vw_anwalt', label: 'Rechtsanwalt / Notar',    hint: 'Versorgungswerk · Hinweis',   softExit: true },
    { id: 'vw_arch',   label: 'Architekt / Ingenieur',   hint: 'Versorgungswerk · Hinweis',   softExit: true },
    { id: 'vw_steuer', label: 'Steuerberater / WP',      hint: 'Versorgungswerk · Hinweis',   softExit: true },
    { id: 'freiberuf_sonstig', label: 'Sonstiger Freiberufler', hint: 'Ohne Versorgungswerk · Rürup' },
  ],
};

const VW_LABELS: Record<string, string> = {
  vw_arzt:   'Ärzten / Zahnärzten',
  vw_anwalt: 'Rechtsanwälten / Notaren',
  vw_arch:   'Architekten / Ingenieuren',
  vw_steuer: 'Steuerberatern / WP',
};

export function StepBerufsgruppe({ params, onChange, onNext }: Props) {
  const unterOptionen = params.hauptgruppe
    ? UNTERGRUPPEN[params.hauptgruppe as Hauptgruppe] ?? []
    : [];
  const isSoftExit = params.untergruppe?.startsWith('vw_');
  const canNext = params.hauptgruppe !== '' && params.untergruppe !== '';

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold tracking-tight mb-1">Deine Berufsgruppe</h2>
        <p className="text-sm text-muted-foreground">alterli berechnet nur was für dich relevant ist.</p>
      </div>

      {/* Hauptgruppe */}
      <fieldset>
        <legend className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
          Hauptgruppe
        </legend>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Berufsgruppe auswählen">
          {HAUPTGRUPPEN.map(({ id, label, sub, Icon }) => {
            const selected = params.hauptgruppe === id;
            return (
              <button
                key={id}
                role="radio"
                aria-checked={selected}
                onClick={() => onChange({ hauptgruppe: id, untergruppe: '' })}
                className={cn(
                  'flex items-start gap-3 p-4 rounded-lg border text-left transition-colors',
                  selected
                    ? 'border-primary bg-primary/8 text-foreground'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:bg-accent/30'
                )}
              >
                <Icon
                  size={16}
                  className={cn('mt-0.5 flex-shrink-0', selected ? 'text-primary' : 'text-muted-foreground')}
                  aria-hidden="true"
                />
                <span>
                  <span className={cn('block text-sm font-medium', selected ? 'text-foreground' : 'text-foreground/70')}>
                    {label}
                  </span>
                  <span className="block text-[11px] text-muted-foreground mt-0.5">{sub}</span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Untergruppe */}
      {params.hauptgruppe && (
        <fieldset>
          <legend className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
            Untergruppe
          </legend>
          <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="Untergruppe auswählen">
            {unterOptionen.map(({ id, label, hint }) => {
              const selected = params.untergruppe === id;
              return (
                <button
                  key={id}
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange({ untergruppe: id })}
                  className={cn(
                    'flex items-center justify-between px-4 py-3 rounded-md border text-left transition-colors',
                    selected
                      ? 'border-primary bg-primary/8'
                      : 'border-border bg-card hover:border-primary/50 hover:bg-accent/30'
                  )}
                >
                  <span>
                    <span className="block text-sm font-medium text-foreground">{label}</span>
                    <span className="block text-[11px] text-muted-foreground">{hint}</span>
                  </span>
                  {selected && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      className="text-primary flex-shrink-0" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* Soft Exit for Versorgungswerk */}
      {isSoftExit && (
        <Alert>
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>
            <strong className="block mb-1">Versorgungswerk erkannt</strong>
            Die Altersversorgung von {VW_LABELS[params.untergruppe] ?? 'Freiberuflern mit Versorgungswerk'} folgt
            eigenen Regeln die wir nicht zuverlässig berechnen können. Wende dich an einen spezialisierten
            Rentenberater. Du kannst alternativ "Sonstiger Freiberufler" wählen für eine vereinfachte Analyse.
          </AlertDescription>
        </Alert>
      )}

      <Button
        onClick={onNext}
        disabled={!canNext}
        className="w-full sm:w-auto"
        aria-label={canNext ? 'Weiter zu den Eingaben' : 'Bitte wähle zuerst deine Berufsgruppe'}
      >
        Weiter
        <ChevronRight size={16} aria-hidden="true" />
      </Button>
    </div>
  );
}
