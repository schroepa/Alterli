import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface WizardLayoutProps {
  step: number;
  totalSteps: number;
  stepKey: number;
  slideDir: 'forward' | 'back' | null;
  onBack?: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
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
    <div className="flex h-full min-h-0 w-full flex-col bg-background">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 sm:px-6">
        <a
          href="/"
          className="text-sm font-semibold tracking-tight text-foreground hover:text-primary transition-colors"
          aria-label="alterli — zur Startseite"
        >
          alter<span className="text-primary">li</span>
        </a>
        <div className="flex items-center gap-2">
          <span
            className="text-xs tabular-nums text-muted-foreground lg:hidden"
            aria-label={`Schritt ${step} von ${totalSteps}`}
          >
            {step} / {totalSteps}
          </span>
          <span className="hidden text-xs text-muted-foreground lg:inline">
            Schritt {step} von {totalSteps} · {STEP_LABELS[step - 1]}
          </span>
          <ThemeToggle />
        </div>
      </header>

      {/* Progress (mobile) */}
      <div
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={0}
        aria-valuemax={totalSteps}
        aria-label={`Fortschritt: Schritt ${step} von ${totalSteps}`}
        className="h-1 shrink-0 bg-muted lg:hidden"
      >
        <div
          className="h-full transition-all duration-300 ease-out"
          style={{ width: `${pct}%`, background: 'var(--gold)' }}
        />
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside
          className="hidden w-52 shrink-0 flex-col gap-1 overflow-y-auto border-r border-border px-3 py-6 xl:w-56 lg:flex"
          aria-label="Wizard-Fortschritt"
        >
          <ol className="space-y-0.5">
            {STEP_LABELS.map((label, i) => {
              const n = i + 1;
              const done = n < step;
              const current = n === step;
              return (
                <li key={label}>
                  <div
                    className={cn(
                      'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm',
                      current && 'bg-primary/10 font-medium text-foreground',
                      done && 'text-muted-foreground',
                      !done && !current && 'text-muted-foreground/55',
                    )}
                    aria-current={current ? 'step' : undefined}
                  >
                    <span
                      className={cn(
                        'flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] tabular-nums',
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

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          <div
            key={stepKey}
            className={cn(
              'mx-auto w-full max-w-lg px-4 py-6 sm:max-w-xl sm:px-6 sm:py-8 lg:max-w-2xl lg:py-10',
              slideDir === 'forward' && 'wizard-slide-forward',
              slideDir === 'back' && 'wizard-slide-back',
            )}
          >
            {children}
          </div>
        </div>
      </div>

      {/* Footer — immer sichtbar am unteren Rand der App-Shell */}
      <footer className="z-10 flex shrink-0 items-center justify-between gap-4 border-t border-border bg-background px-4 py-3 sm:px-6 safe-pb">
        <div className="min-w-[5rem]">
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
            <span className="text-[10px] text-muted-foreground select-none hidden sm:inline">
              Keine Datenspeicherung
            </span>
          )}
        </div>
        <Button onClick={onNext} disabled={nextDisabled} size="lg" className="min-w-[8.5rem]">
          {nextLabel ?? 'Weiter'}
          <ChevronRight size={16} aria-hidden="true" />
        </Button>
      </footer>
    </div>
  );
}
