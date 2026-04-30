import { useState, useMemo } from 'react';
import { calc } from '@/lib/calc';
import { INIT_PARAMS } from '@/lib/types';
import type { CalcParams } from '@/lib/types';
import { StepBerufsgruppe } from './app/StepBerufsgruppe';
import { StepEingabe } from './app/StepEingabe';
import { StepSzenario } from './app/StepSzenario';
import { StepErgebnis } from './app/StepErgebnis';

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS: Record<Step, string> = {
  1: 'Berufsgruppe',
  2: 'Eingaben',
  3: 'Szenarien',
  4: 'Ergebnis',
};

export default function AlterliApp() {
  const [step, setStep] = useState<Step>(1);
  const [params, setParams] = useState<CalcParams>(INIT_PARAMS);

  const result = useMemo(() => {
    if (params.hauptgruppe === '' || params.untergruppe === '') return null;
    return calc(params);
  }, [params]);

  const onChange = (update: Partial<CalcParams>) =>
    setParams((p) => ({ ...p, ...update }));

  const onReset = () => {
    setParams(INIT_PARAMS);
    setStep(1);
  };

  return (
    <div className="w-full">
      {/* Screen reader step announcer */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        Schritt {step} von 4: {STEP_LABELS[step]}
      </div>

      {/* Step progress indicator */}
      <nav aria-label="Fortschritt" className="border-b border-border px-6 py-3">
        <ol role="list" className="flex items-center gap-1">
          {([1, 2, 3, 4] as Step[]).map((s) => (
            <li key={s} role="listitem" className="flex items-center gap-1">
              <span
                aria-current={step === s ? 'step' : undefined}
                className={`text-[10px] font-medium px-2.5 py-1 rounded-full transition-colors ${
                  s === step
                    ? 'bg-primary text-primary-foreground'
                    : s < step
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                {s < step ? (
                  <span aria-label={`${STEP_LABELS[s]} — abgeschlossen`}>{STEP_LABELS[s]}</span>
                ) : (
                  <span aria-label={s === step ? `${STEP_LABELS[s]} — aktuell` : STEP_LABELS[s]}>
                    {STEP_LABELS[s]}
                  </span>
                )}
              </span>
              {s < 4 && (
                <span aria-hidden="true" className="text-muted-foreground/30 text-xs">›</span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Step content */}
      <div className="px-6 py-8 max-w-2xl mx-auto">
        {step === 1 && (
          <StepBerufsgruppe
            params={params}
            onChange={onChange}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <StepEingabe
            params={params}
            onChange={onChange}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <StepSzenario
            params={params}
            onChange={onChange}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && result && (
          <StepErgebnis
            result={result}
            params={params}
            onReset={onReset}
          />
        )}
        {step === 4 && !result && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <p>Bitte gehe zurück und wähle eine Berufsgruppe.</p>
            <button
              onClick={() => setStep(1)}
              className="mt-4 text-primary underline underline-offset-2 hover:text-primary/80"
            >
              Zurück zu Schritt 1
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
