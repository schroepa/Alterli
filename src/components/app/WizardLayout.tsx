import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface WizardLayoutProps {
  /** 1-based step number shown in header ("2 / 7") */
  step: number;
  totalSteps: number;
  /** React key forwarded to the animation wrapper — change it to trigger slide */
  stepKey: number;
  slideDir: 'forward' | 'back' | null;
  onBack?: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  /** Override "Weiter" label (e.g. "Analyse starten") */
  nextLabel?: string;
  children: ReactNode;
}

export function WizardLayout({
  step,
  totalSteps,
  stepKey,
  slideDir,
  onBack,
  onNext,
  nextDisabled,
  nextLabel,
  children,
}: WizardLayoutProps) {
  const pct = Math.round((step / totalSteps) * 100);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-4 shrink-0">
        <span className="text-sm font-semibold tracking-tight">alterli</span>
        <span
          className="text-xs text-muted-foreground tabular-nums"
          aria-label={`Schritt ${step} von ${totalSteps}`}
        >
          {step} / {totalSteps}
        </span>
      </header>

      {/* ── Progress bar ────────────────────────────────────────── */}
      <div
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label={`Fortschritt: Schritt ${step} von ${totalSteps}`}
        className="h-1 bg-muted shrink-0"
      >
        <div
          className="h-full transition-all duration-300 ease-out"
          style={{ width: `${pct}%`, background: 'var(--gold)' }}
        />
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        <div
          key={stepKey}
          className={cn(
            'px-6 py-10 max-w-lg mx-auto',
            slideDir === 'forward' && 'wizard-slide-forward',
            slideDir === 'back'    && 'wizard-slide-back',
          )}
        >
          {children}
        </div>
      </div>

      {/* ── Bottom nav ──────────────────────────────────────────── */}
      <footer className="shrink-0 border-t border-border bg-background px-6 py-4 flex items-center justify-between gap-4">
        <div>
          {onBack ? (
            <Button
              variant="ghost"
              onClick={onBack}
              aria-label="Zurück zum vorherigen Schritt"
            >
              <ChevronLeft size={16} aria-hidden="true" />
              Zurück
            </Button>
          ) : (
            <span />
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <Button
            onClick={onNext}
            disabled={nextDisabled}
            aria-label={nextLabel ?? 'Weiter zum nächsten Schritt'}
          >
            {nextLabel ?? 'Weiter'}
            <ChevronRight size={16} aria-hidden="true" />
          </Button>
          <p className="text-[10px] text-muted-foreground select-none">
            Keine Datenspeicherung · Kostenlos
          </p>
        </div>
      </footer>
    </div>
  );
}
