import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CalcResult } from '@/lib/types';

const AMPEL_CONFIG = {
  gruen: { color: '#47a875', label: 'Gut aufgestellt' },
  gelb:  { color: '#c8a245', label: 'Ausbaufähig'    },
  rot:   { color: '#b83c3c', label: 'Handlungsbedarf' },
} as const;

interface Props {
  result: CalcResult;
  onContinue: () => void;
}

export function EhrlicherMoment({ result, onContinue }: Props) {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const fullText = result.ehrlichText;
  const [displayed, setDisplayed] = useState(prefersReducedMotion ? fullText : '');
  const [showAmpel, setShowAmpel] = useState(prefersReducedMotion);
  const [showButton, setShowButton] = useState(prefersReducedMotion);

  useEffect(() => {
    if (prefersReducedMotion) return;

    let charIndex = 0;
    const charDelay = Math.min(1500 / fullText.length, 60);
    let intervalId: ReturnType<typeof setInterval>;
    let ampelId: ReturnType<typeof setTimeout>;
    let buttonId: ReturnType<typeof setTimeout>;

    const startId = setTimeout(() => {
      intervalId = setInterval(() => {
        charIndex++;
        setDisplayed(fullText.slice(0, charIndex));
        if (charIndex >= fullText.length) {
          clearInterval(intervalId);
          ampelId = setTimeout(() => setShowAmpel(true), 300);
          buttonId = setTimeout(() => setShowButton(true), 600);
        }
      }, charDelay);
    }, 200);

    return () => {
      clearTimeout(startId);
      clearInterval(intervalId);
      clearTimeout(ampelId);
      clearTimeout(buttonId);
    };
  }, [fullText, prefersReducedMotion]);

  const ampel = AMPEL_CONFIG[result.ampel];

  return (
    <div
      className="flex h-full min-h-0 flex-col items-center justify-center overflow-y-auto bg-transparent px-6 py-12 gap-10 animate-in fade-in duration-500"
      role="main"
      aria-labelledby="ehrlicher-moment-heading"
    >
      <span className="text-sm font-semibold tracking-tight text-foreground self-start w-full max-w-lg mx-auto">
        <a href="/" className="hover:text-primary transition-colors" aria-label="alterli — zur Startseite">
          alter<span className="text-primary">li</span>
        </a>
      </span>

      <div className="w-full max-w-lg mx-auto space-y-8">
        <blockquote
          aria-live="polite"
          aria-atomic="false"
          className="rounded-xl border border-border bg-card p-6 sm:p-8"
        >
          <p
            id="ehrlicher-moment-heading"
            className="font-serif leading-relaxed text-foreground"
            style={{ fontSize: 'clamp(18px, 3.5vw, 24px)', fontStyle: 'italic' }}
          >
            {displayed.length > 0 && <span aria-hidden="true">„</span>}
            {displayed}
            {displayed.length === fullText.length && displayed.length > 0 && (
              <span aria-hidden="true">"</span>
            )}
          </p>
        </blockquote>

        <div
          className="flex items-center gap-3 transition-opacity duration-300"
          style={{ opacity: showAmpel ? 1 : 0 }}
          aria-hidden={!showAmpel}
        >
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{
              background: ampel.color,
              boxShadow: `0 0 6px ${ampel.color}cc`,
            }}
            aria-hidden="true"
          />
          <span className="text-sm text-foreground">{ampel.label}</span>
        </div>

        <div
          className="transition-opacity duration-300"
          style={{ opacity: showButton ? 1 : 0 }}
          aria-hidden={!showButton}
        >
          <Button
            onClick={onContinue}
            disabled={!showButton}
            size="lg"
            aria-label="Zur vollständigen Analyse wechseln"
          >
            Zur Analyse
            <ArrowRight size={16} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
