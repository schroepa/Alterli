import { useState } from 'react';
import {
  RotateCcw, AlertTriangle, CheckCircle2, Info,
  LayoutDashboard, Scale, GitBranch, LineChart,
} from 'lucide-react';
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
import type { LucideIcon } from 'lucide-react';

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

type NavId = 'ueberblick' | 'entscheidung' | 'szenarien' | 'details';

interface NavItem {
  id: NavId;
  label: string;
  hint: string;
  icon: LucideIcon;
  needsRiester?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'ueberblick',   label: 'Überblick',        hint: 'Einkommen & Lücke',           icon: LayoutDashboard },
  { id: 'entscheidung', label: 'Riester-Optionen',  hint: 'Was tun mit dem Vertrag',     icon: Scale, needsRiester: true },
  { id: 'szenarien',    label: 'Was-wäre-wenn',     hint: 'Lebensereignisse durchspielen', icon: GitBranch },
  { id: 'details',      label: 'Charts & Tipps',    hint: 'Diagramme & Empfehlungen',    icon: LineChart },
];

export function StepErgebnis({ result, params, onReset }: Props) {
  const [mainTab, setMainTab] = useState<NavId>('ueberblick');
  const [chartTab, setChartTab] = useState('aufbau');

  const ampel = AMPEL_CONFIG[result.ampel];
  const AmpelIcon = ampel.icon;
  const basisLabel = result.g.istBeamter ? 'Pension' : 'Gesetzl. Rente';
  const basisWert = result.g.istBeamter ? result.pensionRente : result.gesetzRente;

  const nav = NAV_ITEMS.filter((n) => !n.needsRiester || result.hatRiester);

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
      {/* Sticky Summary */}
      <header className="shrink-0 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <a href="/" className="mr-1 text-sm font-semibold tracking-tight hover:text-primary lg:hidden" aria-label="Zur Startseite">
                alter<span className="text-primary">li</span>
              </a>
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

      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 overflow-hidden">
        {/* Desktop sidebar nav */}
        <aside
          className="hidden w-60 shrink-0 flex-col border-r border-border bg-muted/20 lg:flex xl:w-64"
          aria-label="Analyse-Bereiche"
        >
          <p className="px-4 pt-5 pb-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Bereiche
          </p>
          <nav className="flex flex-col gap-1 px-2 pb-4">
            {nav.map((item, i) => {
              const Icon = item.icon;
              const active = mainTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMainTab(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    active
                      ? 'bg-primary/10 text-foreground shadow-sm ring-1 ring-primary/25'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md text-xs font-semibold tabular-nums',
                      active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <Icon size={14} className="shrink-0 opacity-70" aria-hidden="true" />
                      {item.label}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                      {item.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {/* Mobile / tablet: horizontal chip nav */}
          <div className="shrink-0 border-b border-border px-3 py-2 lg:hidden">
            <nav
              className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              aria-label="Analyse-Bereiche"
            >
              {nav.map((item, i) => {
                const active = mainTab === item.id;
                return (
                  <Button
                    key={item.id}
                    type="button"
                    variant={active ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMainTab(item.id)}
                    aria-current={active ? 'page' : undefined}
                    className="shrink-0 gap-1.5"
                  >
                    <span className="tabular-nums opacity-70">{i + 1}.</span>
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 pb-10">
            {mainTab === 'ueberblick' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Überblick</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Dein geschätztes Alterseinkommen auf einen Blick.
                  </p>
                </div>
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
                    ? 'wähle „Riester-Optionen“, um zu sehen was du mit dem Vertrag tun kannst.'
                    : 'wähle „Was-wäre-wenn“, um Veränderungen durchzuspielen.'}
                </p>
              </div>
            )}

            {mainTab === 'entscheidung' && result.hatRiester && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Riester-Optionen</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Vergleich: weiterführen, stilllegen, umwandeln oder kündigen.
                  </p>
                </div>
                <RiesterEntscheidung result={result} />
              </div>
            )}

            {mainTab === 'szenarien' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Was-wäre-wenn</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Schalte Ereignisse um und sieh die Wirkung auf Lücke und Zulage.
                  </p>
                </div>
                <WasWaereWenn params={params} baseResult={result} />
              </div>
            )}

            {mainTab === 'details' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Charts & Tipps</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Diagramme und konkrete Handlungsempfehlungen.
                  </p>
                </div>

                <section className="min-w-0 space-y-3">
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
