import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fmtEur, cn } from '@/lib/utils';
import type { CalcResult } from '@/lib/types';
import { calcRiesterSzenarien, type RiesterSzenario } from '@/lib/riesterSzenarien';

interface Props {
  result: CalcResult;
}

function SzenarioCard({ s }: { s: RiesterSzenario }) {
  const isKuendigen = s.aktion === 'kuendigen';

  return (
    <Card
      className={cn(
        'rounded-lg overflow-hidden',
        s.empfohlen && 'border-primary/50 ring-1 ring-primary/30',
        isKuendigen && 'border-destructive/30'
      )}
    >
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="font-sans text-sm font-semibold leading-snug">
            {s.label}
          </CardTitle>
          {s.empfohlen && (
            <Badge variant="default" className="shrink-0 text-[9px]">
              Empfohlen
            </Badge>
          )}
          {isKuendigen && !s.empfohlen && (
            <Badge variant="destructive" className="shrink-0 text-[9px]">
              Vorsicht
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs">{s.kurz}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <dl className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <dt className="text-muted-foreground">Private Säule / Mo.</dt>
            <dd className="font-semibold tabular-nums text-foreground">{fmtEur(s.monatsrente)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Gesamt inkl. Basis</dt>
            <dd className="font-semibold tabular-nums text-foreground">{fmtEur(s.gesamtMitBasis)}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-muted-foreground">Kapital am Ende (Schätzung)</dt>
            <dd className="font-semibold tabular-nums text-foreground">{fmtEur(s.endkapital)}</dd>
          </div>
        </dl>
        <p className="text-xs text-muted-foreground leading-relaxed">{s.text}</p>
        {s.warnung && (
          <p className="text-xs text-destructive leading-relaxed flex gap-1.5">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
            <span>{s.warnung}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function RiesterEntscheidung({ result }: Props) {
  const szenarien = calcRiesterSzenarien(result);
  if (szenarien.length === 0) return null;

  const empfohlen = szenarien.find((s) => s.empfohlen);

  return (
    <section aria-labelledby="riester-entscheidung-heading" className="space-y-4">
      <div>
        <h3
          id="riester-entscheidung-heading"
          className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1"
        >
          Was tun mit meinem Riester?
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Vergleich der realistischen Optionen. Riester bleibt in allen Fällen eine Aufstockung
          zur gesetzlichen Rente bzw. Pension — außer du kündigst und verlierst die private Säule.
        </p>
      </div>

      {empfohlen && (
        <Alert className="border-primary/30 bg-primary/5">
          <CheckCircle2 aria-hidden="true" />
          <AlertTitle className="text-sm">Für dich nahe liegend: {empfohlen.label}</AlertTitle>
          <AlertDescription>{empfohlen.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {szenarien.map((s) => (
          <SzenarioCard key={s.aktion} s={s} />
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed flex gap-1.5">
        <Info size={12} className="shrink-0 mt-0.5" aria-hidden="true" />
        <span>
          Vereinfachte Schätzung ohne Gewähr — keine Anlage- oder Steuerberatung. Bei Kündigung
          und Vertragswechsel gelten individuelle Vertrags- und Steuerregeln.
        </span>
      </p>
    </section>
  );
}
