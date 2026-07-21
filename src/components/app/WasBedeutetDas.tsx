import { PiggyBank, TrendingDown } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { fmtEur } from '@/lib/utils';
import { GlossarTerm } from './GlossarTerm';
import type { CalcResult } from '@/lib/types';

interface Props {
  result: CalcResult;
}

/**
 * Übersetzt die Versorgungslücke in heutige Handlung: fehlender Kapitalstock + Sparrate.
 */
export function WasBedeutetDas({ result }: Props) {
  const { luecke, restjahre, rentendauer, gesamtRente } = result;
  const fehlKapital = Math.round(luecke * 12 * rentendauer);
  // Vereinfachte Sparrate: Kapital über Restjahre linear ansparen (ohne Zins)
  const sparrateMonat =
    restjahre > 0 && fehlKapital > 0
      ? Math.round(fehlKapital / (restjahre * 12))
      : 0;
  // Mit grobem 5 %-Zins-Äquivalent (PMT-Näherung)
  const r = 0.055 / 12;
  const n = restjahre * 12;
  const sparrateMitZins =
    fehlKapital > 0 && n > 0 && r > 0
      ? Math.round((fehlKapital * r) / (Math.pow(1 + r, n) - 1))
      : 0;

  if (luecke <= 0) {
    return (
      <section aria-labelledby="bedeutung-heading" className="space-y-3">
        <h3
          id="bedeutung-heading"
          className="text-xs font-medium text-muted-foreground uppercase tracking-widest"
        >
          Was bedeutet das heute?
        </h3>
        <Alert className="border-emerald-500/30 bg-emerald-500/5">
          <PiggyBank aria-hidden="true" />
          <AlertTitle className="text-sm">Ziel erreicht (Schätzung)</AlertTitle>
          <AlertDescription>
            Dein geschätztes Alterseinkommen von {fmtEur(gesamtRente)}/Monat deckt deine Wunschrente.
            Bleib dran — prüfe den Plan alle paar Jahre.
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  return (
    <section aria-labelledby="bedeutung-heading" className="space-y-4">
      <div>
        <h3
          id="bedeutung-heading"
          className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1"
        >
          Was bedeutet das heute?
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Die{' '}
          <GlossarTerm term="versorgungsluecke">Versorgungslücke</GlossarTerm>
          {' '}von {fmtEur(luecke)}/Monat übersetzt in Kapital und Sparrate — grob, aber handhabbar.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingDown size={14} aria-hidden="true" />
            <span className="text-[10px] uppercase tracking-widest">Fehlender Kapitalstock</span>
          </div>
          <p className="text-xl font-semibold tabular-nums text-foreground">
            {fmtEur(fehlKapital)}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {fmtEur(luecke)} × 12 × ca. {rentendauer} Rentenjahre
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <PiggyBank size={14} aria-hidden="true" />
            <span className="text-[10px] uppercase tracking-widest">Sparrate-Äquivalent</span>
          </div>
          <p className="text-xl font-semibold tabular-nums text-foreground">
            ~{fmtEur(sparrateMitZins || sparrateMonat)}
            <span className="text-sm font-normal text-muted-foreground"> / Mo.</span>
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {sparrateMitZins > 0
              ? `Mit grob 5,5 % Rendite über ${restjahre} Jahre (sonst ohne Zins: ${fmtEur(sparrateMonat)}/Mo.)`
              : `Linear über ${restjahre} Jahre, ohne Zinseszins`}
          </p>
        </div>
      </div>
    </section>
  );
}
