import { useState, useMemo, useRef, useCallback } from 'react';
import { calc } from '@/lib/calc';
import { INIT_PARAMS } from '@/lib/types';
import type { CalcParams } from '@/lib/types';
import { WizardLayout } from './app/WizardLayout';
import { WizardHauptgruppe } from './app/WizardHauptgruppe';
import { WizardUntergruppe } from './app/WizardUntergruppe';
import { WizardAlter } from './app/WizardAlter';
import { WizardEinkommen } from './app/WizardEinkommen';
import { WizardLeben } from './app/WizardLeben';
import { WizardVorsorge } from './app/WizardVorsorge';
import { WizardZiel } from './app/WizardZiel';
import { SoftExit } from './app/SoftExit';
import { Transition } from './app/Transition';
import { EhrlicherMoment } from './app/EhrlicherMoment';
import { StepErgebnis } from './app/StepErgebnis';

type Screen = 'wizard' | 'soft-exit' | 'transition' | 'ehrlicher-moment' | 'result';
type WizardStep = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const TOTAL_STEPS = 7;

export default function AlterliApp() {
  const [screen, setScreen] = useState<Screen>('wizard');
  const [wizardStep, setWizardStep] = useState<WizardStep>(0);
  const [slideDir, setSlideDir] = useState<'forward' | 'back' | null>(null);
  const [params, setParams] = useState<CalcParams>(INIT_PARAMS);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout>>();

  const result = useMemo(() => {
    if (!params.hauptgruppe || !params.untergruppe) return null;
    try { return calc(params); } catch { return null; }
  }, [params]);

  const onChange = useCallback(
    (update: Partial<CalcParams>) => setParams((p) => ({ ...p, ...update })),
    [],
  );

  const goForward = useCallback(() => {
    clearTimeout(autoAdvanceTimer.current);
    if (wizardStep < 6) {
      setSlideDir('forward');
      setWizardStep((s) => (s + 1) as WizardStep);
    } else {
      setScreen('transition');
    }
  }, [wizardStep]);

  const goBack = useCallback(() => {
    clearTimeout(autoAdvanceTimer.current);
    if (wizardStep > 0) {
      setSlideDir('back');
      setWizardStep((s) => (s - 1) as WizardStep);
    }
  }, [wizardStep]);

  const scheduleAutoAdvance = useCallback(() => {
    goForward();
  }, [goForward]);

  const handleSoftExit = useCallback(() => {
    setScreen('soft-exit');
  }, []);

  const handleSoftExitBack = useCallback(() => {
    setScreen('wizard');
    setSlideDir('back');
    setWizardStep(1);
    onChange({ untergruppe: '' });
  }, [onChange]);

  const handleSoftExitForce = useCallback(() => {
    onChange({ untergruppe: 'freiberuf_sonstig' });
    setScreen('wizard');
    setSlideDir('forward');
    setWizardStep(2);
  }, [onChange]);

  const handleTransitionDone = useCallback(() => {
    setScreen('ehrlicher-moment');
  }, []);

  const handleEhrlicherMomentContinue = useCallback(() => {
    setScreen('result');
  }, []);

  const handleReset = useCallback(() => {
    clearTimeout(autoAdvanceTimer.current);
    setParams(INIT_PARAMS);
    setScreen('wizard');
    setWizardStep(0);
    setSlideDir(null);
  }, []);

  if (screen === 'soft-exit') {
    return (
      <SoftExit
        selectedVW={params.untergruppe}
        onBack={handleSoftExitBack}
        onForce={handleSoftExitForce}
      />
    );
  }

  if (screen === 'transition') {
    return <Transition onDone={handleTransitionDone} />;
  }

  if (screen === 'ehrlicher-moment' && result) {
    return (
      <EhrlicherMoment
        result={result}
        onContinue={handleEhrlicherMomentContinue}
      />
    );
  }

  if (screen === 'result' && result) {
    return (
      <div className="px-6 py-8 max-w-2xl mx-auto">
        <StepErgebnis result={result} params={params} onReset={handleReset} />
      </div>
    );
  }

  const nextDisabled: boolean = (() => {
    switch (wizardStep) {
      case 0: return params.hauptgruppe === '';
      case 1: return params.untergruppe === '' || params.untergruppe.startsWith('vw_');
      case 3: return params.bruttoMonat <= 0;
      default: return false;
    }
  })();

  const nextLabel = wizardStep === 6 ? 'Analyse starten' : undefined;

  const wizardContent = (() => {
    switch (wizardStep) {
      case 0: return (
        <WizardHauptgruppe
          params={params}
          onChange={onChange}
          onAutoAdvance={scheduleAutoAdvance}
        />
      );
      case 1: return (
        <WizardUntergruppe
          params={params}
          onChange={onChange}
          onSoftExit={handleSoftExit}
          onAutoAdvance={scheduleAutoAdvance}
        />
      );
      case 2: return <WizardAlter params={params} onChange={onChange} />;
      case 3: return <WizardEinkommen params={params} onChange={onChange} />;
      case 4: return <WizardLeben params={params} onChange={onChange} />;
      case 5: return <WizardVorsorge params={params} onChange={onChange} />;
      case 6: return <WizardZiel params={params} onChange={onChange} />;
    }
  })();

  return (
    <>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        Schritt {wizardStep + 1} von {TOTAL_STEPS}
      </div>

      <WizardLayout
        step={wizardStep + 1}
        totalSteps={TOTAL_STEPS}
        stepKey={wizardStep}
        slideDir={slideDir}
        onBack={wizardStep > 0 ? goBack : undefined}
        onNext={goForward}
        nextDisabled={nextDisabled}
        nextLabel={nextLabel}
      >
        {wizardContent}
      </WizardLayout>
    </>
  );
}
