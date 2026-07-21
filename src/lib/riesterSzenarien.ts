import type { CalcResult } from './types';
import { fmtEur } from './utils';

export type RiesterAktion =
  | 'weiter'
  | 'beitragsfrei'
  | 'depot2027'
  | 'wohnriester'
  | 'kuendigen';

export interface RiesterSzenario {
  aktion: RiesterAktion;
  label: string;
  kurz: string;
  endkapital: number;
  monatsrente: number;
  gesamtMitBasis: number;
  foerderVerlust: number;
  steuernachteil: number;
  score: number;
  empfohlen: boolean;
  warnung?: string;
  text: string;
}

function basisRente(result: CalcResult): number {
  if (result.g.istBeamter) return result.pensionRente;
  if (result.g.hatGRV) return result.gesetzRente;
  return 0;
}

function extraOhneRiester(result: CalcResult): number {
  return result.meitErs + (result.g.istTvoed ? result.vblRente : 0);
}

/**
 * Vereinfachte Szenarien für bestehende Riester-Verträge.
 * Keine Anlageberatung — Heuristik auf Basis der bestehenden Projektion.
 */
export function calcRiesterSzenarien(result: CalcResult): RiesterSzenario[] {
  if (!result.hatRiester) return [];

  const basis = basisRente(result);
  const extra = extraOhneRiester(result);
  const {
    kapHeute, restjahre, rentendauer, endR, endD, riesterR, depotR,
    zulage, jahreEing, wohnMoegl, wohnHebel, steuerv,
  } = result;

  // Beitragsfrei: Kapital wächst weiter ohne neue Einzahlungen (~1,2 %)
  let kFrei = kapHeute;
  for (let j = 0; j < restjahre; j++) {
    kFrei *= 1.012;
  }
  const endFrei = Math.round(kFrei);
  const renteFrei = Math.round(endFrei / (rentendauer * 12));

  // Kündigung: Zulagen + geschätzter Steuervorteil oft rückzahlungspflichtig
  const zulagenGesamt = Math.round(zulage * jahreEing);
  const steuervGeschaetzt = Math.round(steuerv * jahreEing * 0.5);
  const foerderVerlust = zulagenGesamt + steuervGeschaetzt;
  const abzugKosten = Math.round(kapHeute * 0.08);
  const nettoKuendigung = Math.max(0, kapHeute - foerderVerlust - abzugKosten);

  const kinderStark = zulage >= 475;
  const niedrigeZulage = zulage <= 175;

  const szenarien: RiesterSzenario[] = [
    {
      aktion: 'weiter',
      label: 'Weiter besparen',
      kurz: 'Beiträge + Zulagen laufen weiter',
      endkapital: endR,
      monatsrente: riesterR,
      gesamtMitBasis: basis + riesterR + extra,
      foerderVerlust: 0,
      steuernachteil: 0,
      score: kinderStark ? 92 : niedrigeZulage ? 55 : 70,
      empfohlen: false,
      text: `Du zahlst weiter ein und erhältst ca. ${fmtEur(zulage)} Zulage/Jahr. Geschätzte Riester-Rente: ${fmtEur(riesterR)}/Monat — zusätzlich zur Basisrente.`,
    },
    {
      aktion: 'beitragsfrei',
      label: 'Beitragsfrei stellen (stilllegen)',
      kurz: 'Keine neuen Beiträge, Kapital bleibt',
      endkapital: endFrei,
      monatsrente: renteFrei,
      gesamtMitBasis: basis + renteFrei + extra,
      foerderVerlust: 0,
      steuernachteil: 0,
      score: niedrigeZulage ? 67 : 48,
      empfohlen: false,
      text: `Keine neuen Einzahlungen und keine neuen Zulagen. Das bestehende Kapital wächst langsam weiter. Geschätzte Auszahlung später: ca. ${fmtEur(renteFrei)}/Monat aus dem Vertrag.`,
    },
    {
      aktion: 'depot2027',
      label: 'Ins Altersvorsorgedepot 2027 wechseln',
      kurz: 'Umwandeln in ETF-basiertes Depot',
      endkapital: endD,
      monatsrente: depotR,
      gesamtMitBasis: basis + depotR + extra,
      foerderVerlust: 0,
      steuernachteil: 0,
      score: kinderStark ? 58 : niedrigeZulage ? 88 : 75,
      empfohlen: false,
      text: `Ab der Reform kannst du (vereinfacht modelliert) in ein renditestärkeres Depot wechseln. Geschätzte private Monatsrente: ${fmtEur(depotR)} — weiterhin zusätzlich zur Basisrente.`,
    },
  ];

  if (wohnMoegl) {
    const renteRest = Math.round(Math.max(0, endR - wohnHebel) / (rentendauer * 12));
    szenarien.push({
      aktion: 'wohnriester',
      label: 'Wohn-Riester nutzen',
      kurz: 'Kapital zur Hypothekentilgung',
      endkapital: Math.max(0, endR - wohnHebel),
      monatsrente: renteRest,
      gesamtMitBasis: basis + renteRest + extra,
      foerderVerlust: 0,
      steuernachteil: 0,
      score: 90,
      empfohlen: false,
      text: `Bis zu ${fmtEur(wohnHebel)} kannst du zur Tilgung einsetzen. Das senkt Zinsen; die verbleibende Riester-Rente sinkt entsprechend.`,
    });
    // Wohn-Riester senkt Score von „weiter“ / Depot leicht
    const weiter = szenarien.find((s) => s.aktion === 'weiter');
    const depot = szenarien.find((s) => s.aktion === 'depot2027');
    if (weiter) weiter.score -= 8;
    if (depot) depot.score -= 10;
  }

  szenarien.push({
    aktion: 'kuendigen',
    label: 'Kündigen / auszahlen',
    kurz: 'Vertrag auflösen — meist Verlust',
    endkapital: nettoKuendigung,
    monatsrente: 0,
    gesamtMitBasis: basis + extra,
    foerderVerlust,
    steuernachteil: steuervGeschaetzt,
    score: kapHeute < 3000 ? 25 : 8,
    empfohlen: false,
    warnung: `Geschätzter Förderverlust ca. ${fmtEur(foerderVerlust)} (Zulagen + Steuervorteile) zuzüglich Abzüge. Netto oft deutlich unter dem Vertragsguthaben.`,
    text: `Auszahlung heute ca. ${fmtEur(nettoKuendigung)} nach grober Abzugsschätzung. Du verlierst die lebenslange Riester-Rente; die Basisrente bleibt. Kündigung ist selten sinnvoll.`,
  });

  // Leichter Bonus für höheres Alterseinkommen
  const maxGesamt = Math.max(...szenarien.map((x) => x.gesamtMitBasis), 1);
  for (const s of szenarien) {
    s.score = Math.max(0, Math.min(100, s.score + Math.round((s.gesamtMitBasis / maxGesamt) * 8)));
  }

  // Nie Kündigung als Top-Empfehlung
  const best = szenarien
    .filter((s) => s.aktion !== 'kuendigen')
    .reduce((a, b) => (a.score >= b.score ? a : b));
  best.empfohlen = true;

  return szenarien.sort((a, b) => b.score - a.score);
}
