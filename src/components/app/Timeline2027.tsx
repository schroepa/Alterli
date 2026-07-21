import { CalendarClock } from 'lucide-react';
import { GlossarTerm } from './GlossarTerm';

/** Reform-Stichtag Altersvorsorgedepot (vereinfacht: 1. Jan 2027) */
const REFORM = new Date(2027, 0, 1);

function monthsUntil(target: Date, from = new Date()): number {
  const y = target.getFullYear() - from.getFullYear();
  const m = target.getMonth() - from.getMonth();
  let total = y * 12 + m;
  if (from.getDate() > target.getDate()) total -= 1;
  return Math.max(0, total);
}

interface Props {
  hatRiester: boolean;
}

export function Timeline2027({ hatRiester }: Props) {
  const months = monthsUntil(REFORM);
  const past = months === 0 && new Date() >= REFORM;

  if (!hatRiester) return null;

  return (
    <section
      aria-labelledby="timeline-heading"
      className="rounded-lg border border-border bg-card p-4 sm:p-5 space-y-3"
    >
      <div className="flex items-start gap-3">
        <CalendarClock
          size={18}
          className="text-primary shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div className="space-y-1 min-w-0">
          <h3
            id="timeline-heading"
            className="text-sm font-medium text-foreground"
          >
            Timeline bis zum{' '}
            <GlossarTerm term="depot2027">Altersvorsorgedepot 2027</GlossarTerm>
          </h3>
          {past ? (
            <p className="text-xs text-muted-foreground leading-relaxed">
              Der Reformzeitpunkt ist erreicht bzw. überschritten. Prüfe, ob ein Wechsel
              für dich freigeschaltet ist — Regeln können sich noch konkretisieren.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground leading-relaxed">
              Noch ca. <strong className="text-foreground font-medium">{months} Monate</strong> mit
              der bisherigen Riester-Zulagenlogik. Bis dahin: Zulagen mitnehmen oder
              Beitragsfreiheit als Brücke erwägen.
            </p>
          )}
        </div>
      </div>

      {!past && (
        <div
          className="h-2 rounded-full bg-muted overflow-hidden"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.min(100, Math.round(((24 - Math.min(months, 24)) / 24) * 100))}
          aria-label={`${months} Monate bis Januar 2027`}
        >
          <div
            className="h-full bg-primary transition-all"
            style={{
              width: `${Math.min(100, Math.max(4, ((24 - Math.min(months, 24)) / 24) * 100))}%`,
            }}
          />
        </div>
      )}
    </section>
  );
}
