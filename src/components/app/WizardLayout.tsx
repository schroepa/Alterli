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

const STEP_LABELS = [
  'Beschäftigung',
  'Details',
  'Alter',
  'Einkommen',
  'Leben',
  'Vorsorge',
  'Ziel',
];

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
    <div className="flex flex-col min-h-screen bg-background lg:min-h-[min(100vh,900px)]">
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 shrink-0 lg:border-b lg:border-border">
        <span className="text-sm font-semibold tracking-tight">alterli</span>
        <span
          className="text-xs text-muted-foreground tabular-nums lg:hidden"
          aria-label={`Schritt ${step} von ${totalSteps}`}
        >
          {step} / {totalSteps}
        </span>
        <span className="hidden lg:inline text-xs text-muted-foreground">
          Schritt {step} von {totalSteps} · {STEP_LABELS[step - 1]}
        </span>
      </header>

      {/* ── Progress bar (mobile/tablet) ────────────────────────── */}
      <div
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={0}
        aria-valuemax={totalSteps}
        aria-label={`Fortschritt: Schritt ${step} von ${totalSteps}`}
        className="h-1 bg-muted shrink-0 lg:hidden"
      >
        <div
          className="h-full transition-all duration-300 ease-out"
          style={{ width: `${pct}%`, background: 'var(--gold)' }}
        />
      </div>

      {/* ── Body: sidebar (desktop) + content ───────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop step rail */}
        <aside
          className="hidden lg:flex w-56 xl:w-64 shrink-0 flex-col gap-1 border-r border-border px-4 py-8"
          aria-label="Wizard-Fortschritt"
        >
          <ol className="space-y-1">
            {STEP_LABELS.map((label, i) => {
              const n = i + 1;
              const done = n < step;
              const current = n === step;
              return (
                <li key={label}>
                  <div
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm',
                      current && 'bg-primary/10 text-foreground font-medium',
                      done && 'text-muted-foreground',
                      !done && !current && 'text-muted-foreground/60',
                    )}
                    aria-current={current ? 'step' : undefined}
                  >
                    <span
                      className={cn(
                        'flex size-6 items-center justify-center rounded-full text-[11px] tabular-nums shrink-0',
                        current && 'bg-primary text-primary-foreground',
                        done && 'bg-primary/20 text-primary',
                        !done && !current && 'bg-muted text-muted-foreground',
                      )}
                    >
                      {n}
                    </span>
                    {label}
                  </div>
                </li>
              );
            })}
          </ol>
        </aside>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div
            key={stepKey}
            className={cn(
              'px-4 sm:px-6 py-8 sm:py-10 mx-auto w-full',
              'max-w-lg md:max-w-xl lg:max-w-2xl lg:py-12',
              slideDir === 'forward' && 'wizard-slide-forward',
              slideDir === 'back' && 'wizard-slide-back',
            )}
          >
            {children}
          </div>
        </div>
      </div>

      {/* ── Bottom nav ──────────────────────────────────────────── */}
      <footer className="shrink-0 border-t border-border bg-background px-4 sm:px-6 py-4 flex items-center justify-between gap-4 lg:pl-[calc(14rem+1.5rem)] xl:pl-[calc(16rem+1.5rem)]">
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
          <Button onClick={onNext} disabled={nextDisabled}>
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
