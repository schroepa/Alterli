import { Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { fmtEur, cn } from '@/lib/utils';
import type { CalcResult, CalcParams } from '@/lib/types';

interface Schicht {
  id: string;
  label: string;
  value: number;
  className: string;
  barClassName: string;
}

interface Props {
  result: CalcResult;
  params: CalcParams;
}

function buildSchichten(result: CalcResult): Schicht[] {
  const layers: Schicht[] = [];

  if (result.g.istBeamter) {
    layers.push({
      id: 'basis',
      label: 'Pension (Basis)',
      value: result.pensionRente,
      className: 'text-foreground',
      barClassName: 'bg-slate-500 dark:bg-slate-400',
    });
  } else if (result.g.hatGRV) {
    layers.push({
      id: 'basis',
      label: 'Gesetzliche Rente (Basis)',
      value: result.gesetzRente,
      className: 'text-foreground',
      barClassName: 'bg-slate-500 dark:bg-slate-400',
    });
  }

  if (result.g.istTvoed && result.vblRente > 0) {
    layers.push({
      id: 'vbl',
      label: 'VBL-Zusatzversorgung',
      value: result.vblRente,
      className: 'text-foreground',
      barClassName: 'bg-sky-600 dark:bg-sky-500',
    });
  }

  if (result.hatRiester && result.riesterR > 0) {
    layers.push({
      id: 'riester',
      label: 'Riester (Aufstockung)',
      value: result.riesterR,
      className: 'text-primary',
      barClassName: 'bg-primary',
    });
  }

  if (result.meitErs > 0) {
    layers.push({
      id: 'miete',
      label: 'Mietersparnis (Eigennutzung)',
      value: result.meitErs,
      className: 'text-foreground',
      barClassName: 'bg-emerald-600 dark:bg-emerald-500',
    });
  }

  return layers.filter((l) => l.value > 0);
}

export function EinkommensSchichten({ result, params }: Props) {
  const schichten = buildSchichten(result);
  const maxWert = Math.max(params.wunschrente, result.gesamtRente, 1);
  const wunschPct = Math.min(100, (params.wunschrente / maxWert) * 100);
  const basisLabel = result.g.istBeamter ? 'Pension' : 'gesetzliche Rente';
  const zeigtAufstockung =
    result.hatRiester || result.meitErs > 0 || (result.g.istTvoed && result.vblRente > 0);

  return (
    <section
      aria-labelledby="schichten-heading"
      className="rounded-lg border border-border bg-card p-4 sm:p-5 space-y-5"
    >
      <div>
        <h3
          id="schichten-heading"
          className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1"
        >
          Einkommensbild im Alter
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Geschätztes monatliches Alterseinkommen — aufgebaut aus Basis und Aufstockung.
        </p>
      </div>

      {/* Stacked visual */}
      <div className="space-y-3" role="list" aria-label="Einkommensschichten">
        <div
          className="relative h-10 w-full rounded-md bg-muted overflow-hidden flex"
          role="img"
          aria-label={
            schichten.map((s) => `${s.label}: ${fmtEur(s.value)}`).join(', ') +
            `. Summe ${fmtEur(result.gesamtRente)}. Wunschrente ${fmtEur(params.wunschrente)}.`
          }
        >
          {schichten.map((s) => (
            <div
              key={s.id}
              className={cn('h-full transition-[width]', s.barClassName)}
              style={{ width: `${(s.value / maxWert) * 100}%` }}
              title={`${s.label}: ${fmtEur(s.value)}`}
            />
          ))}
          {/* Wunschrente marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-foreground/70"
            style={{ left: `${wunschPct}%` }}
            aria-hidden="true"
          />
        </div>

        <ul className="space-y-2" role="list">
          {schichten.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 min-w-0">
                <span
                  className={cn('size-2.5 rounded-sm shrink-0', s.barClassName)}
                  aria-hidden="true"
                />
                <span className="text-muted-foreground truncate">{s.label}</span>
              </span>
              <span className={cn('font-semibold tabular-nums shrink-0', s.className)}>
                {s.id === 'riester' || s.id === 'vbl' || s.id === 'miete' ? '+' : ''}
                {fmtEur(s.value)}
              </span>
            </li>
          ))}
          <li className="flex items-center justify-between gap-3 text-sm pt-2 border-t border-border">
            <span className="font-medium text-foreground">Summe Vorsorge</span>
            <span className="font-semibold tabular-nums text-foreground">
              {fmtEur(result.gesamtRente)}
            </span>
          </li>
          <li className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="w-2.5 border-t-2 border-dashed border-foreground/60" aria-hidden="true" />
              Wunschrente
            </span>
            <span className="font-medium tabular-nums text-muted-foreground">
              {fmtEur(params.wunschrente)}
            </span>
          </li>
          <li className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Versorgungslücke</span>
            <span
              className={cn(
                'font-semibold tabular-nums',
                result.luecke > 0
                  ? 'text-destructive'
                  : 'text-emerald-600 dark:text-emerald-400'
              )}
            >
              {result.luecke > 0 ? `−${fmtEur(result.luecke)}` : 'Keine Lücke'}
            </span>
          </li>
        </ul>
      </div>

      {zeigtAufstockung && (
        <Alert className="border-primary/25 bg-primary/5">
          <Info aria-hidden="true" />
          <AlertDescription>
            {result.hatRiester ? (
              <>
                Riester kommt <strong className="text-foreground font-medium">zusätzlich</strong> zur{' '}
                {basisLabel} — nicht statt ihrer. Die Summe oben ist dein geschätztes Gesamteinkommen
                im Alter.
              </>
            ) : (
              <>
                Die Aufstockung (z.&nbsp;B. VBL oder Mietersparnis) kommt{' '}
                <strong className="text-foreground font-medium">zusätzlich</strong> zur {basisLabel}.
              </>
            )}
          </AlertDescription>
        </Alert>
      )}
    </section>
  );
}
