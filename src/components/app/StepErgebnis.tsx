import { useState } from 'react';
import { RotateCcw, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as RechartTooltip,
  BarChart, Bar, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  Legend,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ThemeToggle } from '@/components/ThemeToggle';
import { fmtEur, cn } from '@/lib/utils';
import type { CalcResult, CalcParams, EmpfTyp } from '@/lib/types';
import { EinkommensSchichten } from './EinkommensSchichten';
import { RiesterEntscheidung } from './RiesterEntscheidung';
import { WasBedeutetDas } from './WasBedeutetDas';
import { Timeline2027 } from './Timeline2027';
import { WasWaereWenn } from './WasWaereWenn';
import { ChartFrame } from './ChartFrame';

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
  basis:   '#64748b',
  vbl:     '#0284c7',
  miete:   '#059669',
};

export function StepErgebnis({ result, params, onReset }: Props) {
  const [mainTab, setMainTab] = useState('ueberblick');
  const [chartTab, setChartTab] = useState('aufbau');

  const ampel = AMPEL_CONFIG[result.ampel];
  const AmpelIcon = ampel.icon;
  const basisLabel = result.g.istBeamter ? 'Pension' : 'Gesetzl. Rente';
  const basisWert = result.g.istBeamter ? result.pensionRente : result.gesetzRente;

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
    ...(result.g.istBeamter ? [{ name: 'Pension', value: result.pensionRente, color: CHART_COLORS.miete }] : []),
    ...(result.g.hatGRV     ? [{ name: 'GRV',     value: result.gesetzRente,  color: CHART_COLORS.basis }] : []),
  ];

  const aufbauData = [
    {
      name: 'Dein Aufbau',
      basis: basisWert,
      riester: result.hatRiester ? result.riesterR : 0,
      vbl: result.g.istTvoed ? result.vblRente : 0,
      miete: result.meitErs,
    },
    {
      name: 'Wunschrente',
      basis: params.wunschrente,
      riester: 0,
      vbl: 0,
      miete: 0,
    },
  ];

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-background">
      {/* Sticky Summary — immer sichtbar */}
      <header className="shrink-0 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 className="text-base font-semibold tracking-tight sm:text-lg">Dein Alterseinkommen</h2>
              <div className={cn('flex items-center gap-1.5 text-sm', ampel.className)}>
                <AmpelIcon size={14} aria-hidden="true" />
                <span className="font-medium">{ampel.label}</span>
              </div>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Basis ({basisLabel}) + Aufstockung — nicht nur Riester
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Gesamt / Mo.</p>
              <p className="text-lg font-semibold tabular-nums sm:text-xl">{fmtEur(result.gesamtRente)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Lücke</p>
              <p className={cn(
                'text-lg font-semibold tabular-nums sm:text-xl',
                result.luecke > 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400',
              )}>
                {result.luecke > 0 ? `−${fmtEur(result.luecke)}` : '0 €'}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={onReset} aria-label="Neue Analyse starten">
              <RotateCcw size={14} aria-hidden="true" />
              <span className="hidden sm:inline">Neu</span>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main tabs */}
      <Tabs
        value={mainTab}
        onValueChange={setMainTab}
        className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-0 px-4 sm:px-6"
      >
        <TabsList
          className="mt-3 h-auto w-full shrink-0 flex-wrap justify-start gap-1 bg-muted p-1"
          aria-label="Ergebnis-Bereiche"
        >
          <TabsTrigger value="ueberblick" className="flex-none px-3">Überblick</TabsTrigger>
          {result.hatRiester && (
            <TabsTrigger value="entscheidung" className="flex-none px-3">Riester-Optionen</TabsTrigger>
          )}
          <TabsTrigger value="szenarien" className="flex-none px-3">Was-wäre-wenn</TabsTrigger>
          <TabsTrigger value="details" className="flex-none px-3">Charts & Tipps</TabsTrigger>
        </TabsList>

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto py-4 pb-8">
          <TabsContent value="ueberblick" className="mt-0 space-y-5 outline-none">
            <div className="rounded-lg border border-primary/25 bg-primary/5 p-4">
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-widest text-primary">
                Ehrlicher Moment
              </p>
              <p className="text-sm leading-relaxed text-foreground">{result.ehrlichText}</p>
            </div>

            <EinkommensSchichten result={result} params={params} />

            <div className="grid gap-4 lg:grid-cols-2">
              <WasBedeutetDas result={result} />
              {result.hatRiester && <Timeline2027 hatRiester />}
            </div>

            <p className="text-xs text-muted-foreground">
              Als Nächstes:{' '}
              {result.hatRiester
                ? 'schau unter „Riester-Optionen“, was du mit dem Vertrag tun kannst.'
                : 'nutze „Was-wäre-wenn“, um Veränderungen durchzuspielen.'}
            </p>
          </TabsContent>

          {result.hatRiester && (
            <TabsContent value="entscheidung" className="mt-0 outline-none">
              <RiesterEntscheidung result={result} />
            </TabsContent>
          )}

          <TabsContent value="szenarien" className="mt-0 outline-none">
            <WasWaereWenn params={params} baseResult={result} />
          </TabsContent>

          <TabsContent value="details" className="mt-0 space-y-6 outline-none">
            <section className="min-w-0 space-y-3">
              <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Diagramme
              </h3>
              <Tabs value={chartTab} onValueChange={setChartTab} className="min-w-0 gap-3">
                <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1" aria-label="Diagramm wählen">
                  <TabsTrigger value="aufbau" className="flex-none">Aufbau</TabsTrigger>
                  <TabsTrigger value="kapital" className="flex-none">Kapital</TabsTrigger>
                  <TabsTrigger value="vergleich" className="flex-none">Vergleich</TabsTrigger>
                  <TabsTrigger value="radar" className="flex-none">Score</TabsTrigger>
                </TabsList>

                <TabsContent value="aufbau" className="mt-0 min-w-0">
                  <p className="mb-3 text-xs text-muted-foreground">
                    Gestapelt: Basisrente plus private Aufstockung — im Vergleich zu deiner Wunschrente.
                  </p>
                  <ChartFrame remountKey={`aufbau-${chartTab}`} height={260}>
                    <BarChart data={aufbauData} margin={{ top: 8, right: 12, bottom: 8, left: 4 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tickFormatter={(v) => `${v}€`} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={48} />
                      <RechartTooltip
                        formatter={(v: number, name: string) => [fmtEur(v), name]}
                        contentStyle={{ fontSize: 11, border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--card)' }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="basis" name={basisLabel} stackId="a" fill={CHART_COLORS.basis} />
                      {result.g.istTvoed && result.vblRente > 0 && (
                        <Bar dataKey="vbl" name="VBL" stackId="a" fill={CHART_COLORS.vbl} />
                      )}
                      {result.hatRiester && (
                        <Bar dataKey="riester" name="Riester" stackId="a" fill={CHART_COLORS.riester} />
                      )}
                      {result.meitErs > 0 && (
                        <Bar dataKey="miete" name="Mietersparnis" stackId="a" fill={CHART_COLORS.miete} radius={[4, 4, 0, 0]} />
                      )}
                    </BarChart>
                  </ChartFrame>
                </TabsContent>

                <TabsContent value="kapital" className="mt-0 min-w-0">
                  <p className="mb-3 text-xs text-muted-foreground">
                    Private Vorsorgewege — zusätzlich zur {result.g.istBeamter ? 'Pension' : 'gesetzlichen Rente'}.
                  </p>
                  <ChartFrame remountKey={`kapital-${chartTab}`} height={260}>
                    <AreaChart data={result.proj} margin={{ top: 8, right: 12, bottom: 8, left: 4 }}>
                      <XAxis dataKey="alter" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
                      <RechartTooltip
                        formatter={(v: number, name: string) => [fmtEur(v), name]}
                        labelFormatter={(l) => `Alter ${l}`}
                        contentStyle={{ fontSize: 11, border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--card)' }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Area type="monotone" dataKey="riester" name="Riester" stroke={CHART_COLORS.riester} fill={CHART_COLORS.riester} fillOpacity={0.08} strokeWidth={2} />
                      <Area type="monotone" dataKey="depot" name="Depot" stroke={CHART_COLORS.depot} fill={CHART_COLORS.depot} fillOpacity={0.08} strokeWidth={2} />
                      <Area type="monotone" dataKey="etf" name="ETF" stroke={CHART_COLORS.etf} fill={CHART_COLORS.etf} fillOpacity={0.08} strokeWidth={2} />
                    </AreaChart>
                  </ChartFrame>
                </TabsContent>

                <TabsContent value="vergleich" className="mt-0 min-w-0">
                  <p className="mb-3 text-xs text-muted-foreground">
                    Einzelvergleich — {basisLabel} ist die Basis, Riester/Depot/ETF die private Aufstockung.
                  </p>
                  <ChartFrame remountKey={`vergleich-${chartTab}`} height={240}>
                    <BarChart data={vergleichData} margin={{ top: 8, right: 12, bottom: 8, left: 4 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tickFormatter={(v) => `${v}€`} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={44} />
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
                  </ChartFrame>
                </TabsContent>

                <TabsContent value="radar" className="mt-0 min-w-0">
                  <ChartFrame remountKey={`radar-${chartTab}`} height={260}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="var(--border)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                      <Radar name="Score" dataKey="value" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.15} />
                    </RadarChart>
                  </ChartFrame>
                </TabsContent>
              </Tabs>
            </section>

            {result.empf.length > 0 && (
              <section aria-labelledby="empf-heading">
                <h3 id="empf-heading" className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Handlungsempfehlungen
                </h3>
                <ul role="list" className="space-y-2">
                  {result.empf.map((e, i) => {
                    const cfg = EMPF_BADGE[e.typ];
                    return (
                      <li key={i} className="rounded-lg border border-border bg-card p-3">
                        <div className="flex items-start gap-3">
                          <Badge variant={cfg.variant} className="mt-0.5 shrink-0 text-[9px]">
                            {cfg.label}
                          </Badge>
                          <div>
                            <p className="mb-0.5 text-sm font-medium">{e.titel}</p>
                            <p className="text-xs leading-relaxed text-muted-foreground">{e.text}</p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
