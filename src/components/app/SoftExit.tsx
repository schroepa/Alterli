import { AlertCircle, ChevronLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VW_LABELS } from '@/lib/groups';

interface Props {
  selectedVW: string;
  onBack: () => void;
  onForce: () => void;
}

export function SoftExit({ selectedVW, onBack, onForce }: Props) {
  const label = VW_LABELS[selectedVW] ?? 'diesem Berufsstand';

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto bg-background px-6 py-8">
      <header className="mb-8">
        <a href="/" className="text-sm font-semibold tracking-tight hover:text-primary transition-colors" aria-label="alterli — zur Startseite">
          alter<span className="text-primary">li</span>
        </a>
      </header>

      <main id="soft-exit-content" className="flex-1 max-w-lg mx-auto w-full space-y-8">
        <div className="flex items-start gap-4">
          <div className="mt-1 w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center shrink-0">
            <AlertCircle size={20} className="text-amber-600 dark:text-amber-400" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Für {label} können wir nur eingeschränkt helfen
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Versorgungswerke folgen eigenen Gesetzen und bieten eigene Altersversorgung —
              getrennt vom staatlichen Rentensystem. Die Berechnungslogik von alterli ist
              darauf nicht ausgelegt.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 space-y-3">
          <p className="text-sm font-medium text-foreground">Was du stattdessen tun kannst:</p>
          <ul className="space-y-2 text-sm text-muted-foreground" role="list">
            <li role="listitem" className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" aria-hidden="true" />
              Wende dich direkt an dein Versorgungswerk für eine persönliche Analyse
            </li>
            <li role="listitem" className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" aria-hidden="true" />
              Ein unabhängiger Rentenberater (kein Versicherungsverkäufer) kann helfen
            </li>
            <li role="listitem" className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" aria-hidden="true" />
              Rürup und ETF-Anlagen lassen sich mit alterli trotzdem analysieren
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Button
            variant="outline"
            onClick={onBack}
            aria-label="Zurück zur Gruppenauswahl"
          >
            <ChevronLeft size={16} aria-hidden="true" />
            Andere Gruppe wählen
          </Button>
          <Button
            variant="ghost"
            onClick={onForce}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Vereinfachte Analyse ohne Versorgungswerk-Leistungen starten"
          >
            Vereinfacht analysieren
            <ArrowRight size={16} aria-hidden="true" />
          </Button>
        </div>
      </main>
    </div>
  );
}
