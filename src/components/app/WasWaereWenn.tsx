import { useMemo, useState } from 'react';
import { Baby, Heart, Wallet, Clock, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { calc } from '@/lib/calc';
import { fmtEur, cn } from '@/lib/utils';
import type { CalcParams, CalcResult } from '@/lib/types';
import { GlossarTerm } from './GlossarTerm';

type SzenarioId = 'kind' | 'heirat' | 'gehalt' | 'fruehrente';

interface SzenarioDef {
  id: SzenarioId;
  label: string;
  hint: string;
  icon: typeof Baby;
  apply: (p: CalcParams) => CalcParams;
  available: (p: CalcParams) => boolean;
}

const SZENARIEN: SzenarioDef[] = [
  {
    id: 'kind',
    label: '+1 Kind',
    hint: 'Kinderzulage +300 €/Jahr',
    icon: Baby,
    apply: (p) => ({ ...p, kinder: Math.min(8, p.kinder + 1) }),
    available: (p) => p.kinder < 8,
  },
  {
    id: 'heirat',
    label: 'Heirat / Partnerschaft',
    hint: 'Partner-Status aktiv',
    icon: Heart,
    apply: (p) => ({ ...p, verheiratet: true }),
    available: (p) => !p.verheiratet,
  },
  {
    id: 'gehalt',
    label: '+500 € Gehalt',
    hint: 'Brutto / Monat',
    icon: Wallet,
    apply: (p) => ({ ...p, bruttoMonat: p.bruttoMonat + 500 }),
    available: () => true,
  },
  {
    id: 'fruehrente',
    label: 'Rente mit 63',
    hint: 'Frühabschläge einrechnen',
    icon: Clock,
    apply: (p) => ({ ...p, fruehRente: 63 }),
    available: (p) => (p.fruehRente || 67) > 63,
  },
];

interface Props {
  params: CalcParams;
  baseResult: CalcResult;
}

export function WasWaereWenn({ params, baseResult }: Props) {
  const [active, setActive] = useState<Set<SzenarioId>>(new Set());

  const scenarioParams = useMemo(() => {
    let p = { ...params };
    for (const s of SZENARIEN) {
      if (active.has(s.id) && s.available(params)) {
        p = s.apply(p);
      }
    }
    return p;
  }, [params, active]);

  const scenarioResult = useMemo(() => {
    if (active.size === 0) return null;
    try {
      return calc(scenarioParams);
    } catch {
      return null;
    }
  }, [scenarioParams, active.size]);

  const setOn = (id: SzenarioId, on: boolean) => {
    setActive((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const reset = () => setActive(new Set());

  const deltaLuecke =
    scenarioResult != null ? scenarioResult.luecke - baseResult.luecke : 0;
  const deltaGesamt =
    scenarioResult != null ? scenarioResult.gesamtRente - baseResult.gesamtRente : 0;
  const deltaZulage =
    scenarioResult != null ? scenarioResult.zulage - baseResult.zulage : 0;

  return (
    <section aria-labelledby="was-waere-wenn-heading" className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3
            id="was-waere-wenn-heading"
            className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1"
          >
            Was-wäre-wenn
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Schalte Lebensereignisse um und sieh, wie sich{' '}
            <GlossarTerm term="versorgungsluecke">Lücke</GlossarTerm>, Einkommen und Zulage ändern —
            alles lokal, ohne Speicherung. Mehrfachauswahl möglich.
          </p>
        </div>
        {active.size > 0 && (
          <Button variant="ghost" size="sm" onClick={reset} aria-label="Szenarien zurücksetzen">
            <RotateCcw size={14} aria-hidden="true" />
            Reset
          </Button>
        )}
      </div>

      <div className="grid gap-2" role="group" aria-label="Szenarien wählen">
        {SZENARIEN.map((s) => {
          const on = active.has(s.id);
          const avail = s.available(params);
          const disabled = !avail && !on;
          const Icon = s.icon;
          const id = `szenario-${s.id}`;
          return (
            <label
              key={s.id}
              htmlFor={id}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background px-3 py-2.5 transition-colors',
                'hover:bg-accent/40 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5',
                disabled && 'cursor-not-allowed opacity-50',
              )}
            >
              <Checkbox
                id={id}
                checked={on}
                disabled={disabled}
                onCheckedChange={(checked) => setOn(s.id, checked === true)}
                className="mt-0.5"
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <Icon size={14} aria-hidden="true" />
                  {s.label}
                </span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground">{s.hint}</span>
              </span>
            </label>
          );
        })}
      </div>

      {scenarioResult && (
        <div
          className="rounded-lg border border-primary/25 bg-primary/5 p-4 space-y-3"
          aria-live="polite"
        >
          <div className="flex flex-wrap gap-2">
            {[...active].map((sid) => (
              <Badge key={sid} variant="secondary" className="text-[10px]">
                {SZENARIEN.find((s) => s.id === sid)?.label}
              </Badge>
            ))}
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                Alterseinkommen
              </dt>
              <dd className="font-semibold tabular-nums">
                {fmtEur(scenarioResult.gesamtRente)}
                <Delta value={deltaGesamt} />
              </dd>
              <dd className="text-[10px] text-muted-foreground">
                vorher {fmtEur(baseResult.gesamtRente)}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                Versorgungslücke
              </dt>
              <dd className="font-semibold tabular-nums">
                {scenarioResult.luecke > 0 ? `−${fmtEur(scenarioResult.luecke)}` : 'Keine'}
                <Delta value={deltaLuecke} invertGood />
              </dd>
              <dd className="text-[10px] text-muted-foreground">
                vorher {baseResult.luecke > 0 ? `−${fmtEur(baseResult.luecke)}` : 'keine'}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                Zulage / Jahr
              </dt>
              <dd className="font-semibold tabular-nums">
                {fmtEur(scenarioResult.zulage)}
                <Delta value={deltaZulage} />
              </dd>
              <dd className="text-[10px] text-muted-foreground">
                vorher {fmtEur(baseResult.zulage)}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </section>
  );
}

function Delta({
  value,
  invertGood,
}: {
  value: number;
  /** Wenn true: negativer Wert ist gut (z. B. kleinere Lücke) */
  invertGood?: boolean;
}) {
  if (value === 0) return null;
  const good = invertGood ? value < 0 : value > 0;
  const sign = value > 0 ? '+' : '−';
  return (
    <span
      className={cn(
        'ml-1.5 text-xs font-medium',
        good ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive',
      )}
    >
      ({sign}{fmtEur(Math.abs(value))})
    </span>
  );
}
