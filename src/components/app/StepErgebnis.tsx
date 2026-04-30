import { RotateCcw, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as RechartTooltip, ResponsiveContainer,
  BarChart, Bar, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { fmtEur } from '@/lib/utils';
import type { CalcResult, CalcParams, EmpfTyp } from '@/lib/types';

interface Props {
  result: CalcResult;
  params: CalcParams;
  onReset: () => void;
}

const AMPEL_CONFIG = {
  gruen: { icon: CheckCircle2,    label: 'Gut aufgestellt', className: 'text-emerald-600 dark:text-emerald-400' },
  gelb:  { icon: Info,            label: 'Ausbaufähig',     className: 'text-amber-600 dark:text-amber-400' },
  rot:   { icon: AlertTriangle,   label: 'Handlungsbedarf', className: 'text-destructive' },
};

const EMPF_BADGE: Record<EmpfTyp, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
  positiv: { variant: 'default',     label: 'Empfehlung' },
  neutral: { variant: 'secondary',   label: 'Hinweis' },
  warnung: { variant: 'destructive', label: 'Warnung' },
  info:    { variant: 'outline',     label: 'Info' },
};

const CHART_COLORS = {
  riester: 'hsl(173, 82%, 24%)',
  depot:   '#6366f1',
  etf:     '#f59e0b',
};

export function StepErgebnis({ result, params, onReset }: Props) {
  const ampel = AMPEL_CONFIG[result.ampel];
  const AmpelIcon = ampel.icon;

  const radarData = [
    { subject: 'Förderung', value: result.foerderScore },
    { subject: 'Stabilität', value: result.stabScore },
    { subject: 'Risiko',    value: 100 - result.risikoScore },
    { subject: 'Nutzen',    value: result.nutzenScore },
  ];

  const vergleichData = [
    { name: 'Riester',  value: result.riesterR,  color: CHART_COLORS.riester },
    { name: 'Depot',    value: result.depotR,    color: CHART_COLORS.depot },
    { name: 'ETF',      value: result.etfR,      color: CHART_COLORS.etf },
    ...(result.g.istBeamter ? [{ name: 'Pension', value: result.pensionRente, color: '#10b981' }] : []),
    ...(result.g.hatGRV     ? [{ name: 'GRV',     value: result.gesetzRente,  color: '#64748b' }] : []),
  ];

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight mb-1">Deine Analyse</h2>
          <div className={`flex items-center gap-2 ${ampel.className}`}>
            <AmpelIcon size={16} aria-hidden="true" />
            <span className="text-sm font-medium">{ampel.label}</span>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onReset} aria-label="Neue Analyse starten und alle Eingaben zurücksetzen">
          <RotateCcw size={14} aria-hidden="true" />
          Neue Analyse
        </Button>
      </div>

      {/* Ehrlicher Moment */}
      <div
        role="region"
        aria-labelledby="ehrlicher-moment-label"
        className="rounded-lg border border-primary/30 bg-primary/5 p-5"
      >
        <p id="ehrlicher-moment-label" className="text-[10px] font-medium text-primary uppercase tracking-widest mb-3">
          Ehrlicher Moment
        </p>
        <p className="text-sm leading-relaxed text-foreground">{result.ehrlichText}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-border rounded-lg overflow-hidden" role="list" aria-label="Wichtigste Kennzahlen">
        <div role="listitem" className="bg-card p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Gesamtrente / Mo.</p>
          <p className="text-xl font-semibold tabular-nums">{fmtEur(result.gesamtRente)}</p>
        </div>
        <div role="listitem" className="bg-card p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Versorgungslücke</p>
          <p className={`text-xl font-semibold tabular-nums ${result.luecke > 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {result.luecke > 0 ? `−${fmtEur(result.luecke)}` : 'Keine Lücke'}
          </p>
        </div>
        <div role="listitem" className="bg-card p-4 col-span-2 sm:col-span-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Gesetzl. Rente / Mo.</p>
          <p className="text-xl font-semibold tabular-nums">{fmtEur(result.gesetzRente)}</p>
        </div>
      </div>

      <Separator />

      {/* Charts */}
      <Tabs defaultValue="kapital">
        <TabsList aria-label="Diagramm-Ansicht wählen">
          <TabsTrigger value="kapital">Kapitalentwicklung</TabsTrigger>
          <TabsTrigger value="vergleich">Monatsrente Vergleich</TabsTrigger>
          <TabsTrigger value="radar">Score-Übersicht</TabsTrigger>
        </TabsList>

        <TabsContent value="kapital" className="mt-4">
          <figure role="img" aria-labelledby="chart-kapital-title">
            <figcaption id="chart-kapital-title" className="sr-only">
              Kapitalentwicklung: Riester {fmtEur(result.endR)}, Altersvorsorgedepot {fmtEur(result.endD)}, ETF {fmtEur(result.endE)} bis Alter {params.fruehRente || 67}
            </figcaption>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={result.proj} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <XAxis dataKey="alter" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={36} />
                <RechartTooltip
                  formatter={(v: number, name: string) => [fmtEur(v), name]}
                  labelFormatter={(l) => `Alter ${l}`}
                  contentStyle={{ fontSize: 11, border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--card)' }}
                />
                <Area type="monotone" dataKey="riester" name="Riester"  stroke={CHART_COLORS.riester} fill={CHART_COLORS.riester} fillOpacity={0.08} strokeWidth={2} />
                <Area type="monotone" dataKey="depot"   name="Depot"    stroke={CHART_COLORS.depot}   fill={CHART_COLORS.depot}   fillOpacity={0.08} strokeWidth={2} />
                <Area type="monotone" dataKey="etf"     name="ETF"      stroke={CHART_COLORS.etf}     fill={CHART_COLORS.etf}     fillOpacity={0.08} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </figure>
        </TabsContent>

        <TabsContent value="vergleich" className="mt-4">
          <figure role="img" aria-labelledby="chart-vergleich-title">
            <figcaption id="chart-vergleich-title" className="sr-only">
              Monatliche Rente nach Vorsorgetyp: {vergleichData.map(d => `${d.name} ${fmtEur(d.value)}`).join(', ')}
            </figcaption>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={vergleichData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v) => `${v}€`} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={40} />
                <RechartTooltip
                  formatter={(v: number) => [fmtEur(v), 'Monatsrente']}
                  contentStyle={{ fontSize: 11, border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--card)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {vergleichData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </figure>
        </TabsContent>

        <TabsContent value="radar" className="mt-4">
          <figure role="img" aria-labelledby="chart-radar-title">
            <figcaption id="chart-radar-title" className="sr-only">
              Vorsorge-Score: Förderung {result.foerderScore}/100, Stabilität {result.stabScore}/100, Risiko {100 - result.risikoScore}/100, Nutzen {result.nutzenScore}/100
            </figcaption>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                <Radar name="Score" dataKey="value" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.15} />
              </RadarChart>
            </ResponsiveContainer>
          </figure>
        </TabsContent>
      </Tabs>

      <Separator />

      {/* Empfehlungen */}
      {result.empf.length > 0 && (
        <section aria-labelledby="empf-heading">
          <h3 id="empf-heading" className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
            Handlungsempfehlungen
          </h3>
          <ul role="list" className="space-y-3">
            {result.empf.map((e, i) => {
              const cfg = EMPF_BADGE[e.typ];
              return (
                <li key={i} role="listitem" className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <Badge variant={cfg.variant} className="mt-0.5 flex-shrink-0 text-[9px]">
                      {cfg.label}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium mb-1">{e.titel}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{e.text}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
