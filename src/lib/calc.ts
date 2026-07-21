import type { CalcParams, CalcResult, Gruppe } from './types';

export function getGruppe(p: CalcParams): Gruppe {
  const h = p.hauptgruppe;
  const u = p.untergruppe;
  return {
    istBeamter:    h === 'oeffentlich' && u === 'beamter',
    istTvoed:      h === 'oeffentlich' && u === 'tvoed',
    istSelbst:     h === 'selbst',
    istMinijob:    h === 'angestellt' && u === 'minijob',
    istVW:         h === 'freiberuf' && u?.startsWith('vw_'),
    istFreiOhneVW: h === 'freiberuf' && u === 'freiberuf_sonstig',
    hatGRV:        !(h === 'freiberuf' && u?.startsWith('vw_')) && !(h === 'oeffentlich' && u === 'beamter'),
    riesterMoegl:  h === 'angestellt' || h === 'oeffentlich',
    rurupSinnvoll: h === 'selbst' || h === 'freiberuf',
  };
}

export function calc(p: CalcParams): CalcResult {
  const g = getGruppe(p);
  const rentenAlter  = p.fruehRente || 67;
  const frühAbzugRaw = rentenAlter < 67 ? Math.max(0, 67 - rentenAlter) * 0.036 : 0;
  const restjahre    = Math.max(1, rentenAlter - p.alter);
  const lebenserw    = p.geschlecht === 'w' ? 86 : 81;
  const rentendauer  = Math.max(1, lebenserw - rentenAlter);
  const bruttoJahr   = p.bruttoMonat * 12;
  const gewerbeJahr  = p.gewerbeMonat * 12;
  const zvE = Math.round(
    g.istSelbst || g.istFreiOhneVW
      ? gewerbeJahr * 0.72
      : bruttoJahr + gewerbeJahr * 0.72
  );

  let gst = 0;
  if (zvE > 66760)      gst = 0.42;
  else if (zvE > 17005) gst = 0.20 + ((zvE - 17005) / (66760 - 17005)) * 0.22;
  else if (zvE > 11604) gst = 0.14 + ((zvE - 11604) / (17005 - 11604)) * 0.06;

  const hatRiester = p.hatRiester && g.riesterMoegl;
  let zulage = 0;
  if (hatRiester) {
    zulage += 175;
    zulage += p.kinder * 300;
    if (p.verheiratet && p.partnerRiester) zulage += 175;
  }

  const minEigen  = hatRiester ? Math.max(60, Math.round(zvE * 0.04) - zulage) : 0;
  const steuerv   = hatRiester ? Math.round(Math.min(2100, minEigen + zulage) * gst) : 0;
  const effEigen  = Math.max(0, minEigen - steuerv);
  const gesamtBtg = minEigen + zulage;
  const jahreEing = hatRiester ? Math.max(0, p.jahreRiester) : 0;
  const kapHeute  = hatRiester ? Math.round(gesamtBtg * ((Math.pow(1.012, jahreEing) - 1) / 0.012)) : 0;

  const rurupMax  = 27566;
  const rurupBtg  = g.rurupSinnvoll ? Math.min(rurupMax, Math.round(zvE * 0.2)) : 0;
  const rurupSteuv = Math.round(rurupBtg * gst);

  const vblRente    = g.istTvoed ? Math.round(bruttoJahr * 0.004 * Math.max(0, p.alter - 18)) : 0;
  const pensionRente = g.istBeamter
    ? Math.round((bruttoJahr / 12) * Math.min(0.72, Math.max(0, p.alter - 18) * 0.02) * (1 - frühAbzugRaw))
    : 0;

  const proj: CalcResult['proj'] = [];
  let kR = kapHeute, kD = kapHeute, kE = kapHeute * 0.5;
  for (let j = 0; j <= restjahre; j++) {
    const infl = p.inflation ? Math.pow(0.98, j) : 1;
    proj.push({
      alter: p.alter + j,
      riester: Math.round(kR * infl),
      depot:   Math.round(kD * infl),
      etf:     Math.round(kE * infl),
    });
    kR = (kR + gesamtBtg) * 1.012;
    kD = (kD + gesamtBtg) * 1.055;
    kE = (kE + effEigen * 1.1) * 1.072;
  }

  const endR = proj[proj.length - 1]?.riester || 0;
  const endD = proj[proj.length - 1]?.depot   || 0;
  const endE = proj[proj.length - 1]?.etf     || 0;

  const entgP       = g.hatGRV ? (bruttoJahr / 45358) * Math.max(0, p.alter - 18) : 0;
  const gesetzRente = Math.round(entgP * 39.32 * (1 - frühAbzugRaw));
  const riesterR    = Math.round(endR / (rentendauer * 12));
  const depotR      = Math.round(endD / (rentendauer * 12));
  const etfR        = Math.round(endE / (rentendauer * 12));
  const meitErs     = p.hatImmobilie && p.immobilieSelbst ? p.kaltmiete : 0;

  // Alterseinkommen = Basis (GRV oder Pension) + Aufstockungen (Riester, VBL, Mietersparnis)
  let gesamtRente = meitErs;
  if (g.istBeamter)  gesamtRente += pensionRente;
  else if (g.hatGRV) gesamtRente += gesetzRente;
  if (hatRiester)    gesamtRente += riesterR;
  if (g.istTvoed)    gesamtRente += vblRente;

  const luecke = Math.max(0, p.wunschrente - gesamtRente);

  const wohnMoegl = hatRiester && p.hatImmobilie && p.immobilieSelbst && p.restschuld > 0;
  const wohnHebel = wohnMoegl ? Math.min(kapHeute, p.restschuld) : 0;

  const foerderScore = hatRiester ? Math.min(100, Math.round((zulage / 775) * 100))
    : g.rurupSinnvoll ? 45 : g.istBeamter ? 60 : 0;
  const stabScore = Math.min(100,
    (p.verheiratet ? 18 : 0) + (p.hatImmobilie ? 22 : 0) + (p.immobilieSelbst ? 12 : 0) +
    (p.hatBU ? 22 : 0) + (g.istBeamter ? 20 : 0) + (zvE > 45000 ? 16 : 8));
  const risikoScore = Math.min(100,
    (luecke > 500 ? 30 : luecke > 200 ? 18 : 5) + (!p.hatBU ? 25 : 0) +
    (!hatRiester && !p.hatImmobilie && !g.istBeamter ? 20 : 0) +
    (p.restschuld > 100000 && !p.hatBU ? 15 : 0) + (!p.verheiratet ? 8 : 0));
  const nutzenScore = hatRiester
    ? Math.min(100, foerderScore * 0.3 + (steuerv > 200 ? 20 : 10) + (p.immobilieSelbst ? 20 : 0) + (p.kinder > 0 ? 18 : 0) + 12)
    : g.rurupSinnvoll ? Math.min(100, Math.round(rurupSteuv / 40))
    : g.istBeamter ? 70 : 20;

  const ampel: CalcResult['ampel'] = luecke === 0 ? 'gruen' : luecke < 300 ? 'gelb' : 'rot';

  const fmtEur = (n: number) => Math.round(n).toLocaleString('de-DE') + ' €';

  const basisRente = g.istBeamter ? pensionRente : gesetzRente;
  const basisName = g.istBeamter ? 'Pension' : 'gesetzliche Rente';

  let ehrlichText = '';
  if (g.istVW) {
    ehrlichText = `Als Mitglied eines berufsständischen Versorgungswerks gelten für dich eigene Regeln. Eine individuelle Beratung durch einen spezialisierten Rentenberater ist hier unverzichtbar.`;
  } else if (g.istBeamter && !p.hatBU) {
    ehrlichText = `Als Beamte:r hast du eine Pensionsanwartschaft von bis zu ${fmtEur(pensionRente)}/Monat. Aber: Dienstunfähigkeit trifft Beamte häufiger als gedacht — eine Dienstunfähigkeitsversicherung fehlt dir noch.`;
  } else if (g.istSelbst && !p.hatBU) {
    ehrlichText = `Als Selbstständige:r hast du keinen gesetzlichen Schutz bei Erwerbsminderung. Ohne Absicherung gefährdest du nicht nur deine Rente — sondern alles was du aufgebaut hast.`;
  } else if (hatRiester && p.kinder > 0) {
    ehrlichText = `Deine ${basisName} liegt bei ca. ${fmtEur(basisRente)}/Monat. Riester stockt das um ca. ${fmtEur(riesterR)} auf — zusammen ${fmtEur(gesamtRente)}. Mit ${p.kinder} ${p.kinder === 1 ? 'Kind' : 'Kindern'} und ${fmtEur(zulage)} Zulage/Jahr ist Riester für dich noch klar im Vorteil.`;
  } else if (hatRiester && p.kinder === 0 && !p.immobilieSelbst && zvE < 35000) {
    ehrlichText = `Deine ${basisName}: ca. ${fmtEur(basisRente)}/Monat. Riester kommt zusätzlich mit ca. ${fmtEur(riesterR)} dazu — Summe ${fmtEur(gesamtRente)}. Du zahlst ${fmtEur(minEigen)}/Jahr und bekommst ${fmtEur(zulage)} Zulage; das Altersvorsorgedepot 2027 könnte schneller wachsen.`;
  } else if (wohnMoegl) {
    ehrlichText = `Neben ca. ${fmtEur(basisRente)} ${basisName} kannst du ${fmtEur(wohnHebel)} aus dem Riester direkt zur Hypothekentilgung einsetzen — das spart Zinsen und verkürzt die Restlaufzeit.`;
  } else if (!hatRiester && !p.hatImmobilie && !g.istBeamter && !g.istVW) {
    ehrlichText = `Du hast keine private Altersvorsorge und kein Wohneigentum. Deine geschätzte gesetzliche Rente: ${fmtEur(gesetzRente)}/Monat. Dein Wunsch: ${fmtEur(p.wunschrente)}/Monat.`;
  } else if (hatRiester && luecke > 400) {
    ehrlichText = `Deine ${basisName} (ca. ${fmtEur(basisRente)}) plus Riester (ca. ${fmtEur(riesterR)}) ergeben ${fmtEur(gesamtRente)}/Monat — ${fmtEur(luecke)} unter deinem Ziel. Fehlender Kapitalstock: ca. ${fmtEur(luecke * 12 * rentendauer)}.`;
  } else if (luecke > 400) {
    ehrlichText = `Dein geschätztes Alterseinkommen liegt ${fmtEur(luecke)}/Monat unter deinem Ziel. Das entspricht einem fehlenden Kapitalstock von ca. ${fmtEur(luecke * 12 * rentendauer)}.`;
  } else if (hatRiester) {
    ehrlichText = `Deine ${basisName} von ca. ${fmtEur(basisRente)} wird durch Riester um ca. ${fmtEur(riesterR)} aufgestockt — zusammen ${fmtEur(gesamtRente)}/Monat. ${!p.hatBU ? 'Eine BU-Versicherung fehlt noch.' : 'Überprüfe deinen Plan alle 2–3 Jahre.'}`;
  } else {
    ehrlichText = `Dein Vorsorge-Profil ist solide. Die wichtigste offene Frage: ${!p.hatBU ? 'eine BU-Versicherung fehlt noch.' : 'Überprüfe deinen Plan alle 2–3 Jahre.'}`;
  }

  const empf: CalcResult['empf'] = [];
  if (g.istVW) empf.push({ typ: 'info', titel: 'Versorgungswerk — Fachberatung empfohlen', text: `Berufsständische Versorgungswerke haben eigene Leistungsregeln. Für eine verlässliche Prognose wende dich an einen spezialisierten Rentenberater.` });
  if (!p.hatBU) empf.push({ typ: 'warnung', titel: 'BU-Absicherung fehlt', text: g.istBeamter ? 'Für Beamte empfiehlt sich eine Dienstunfähigkeitsversicherung.' : 'Ohne Berufsunfähigkeitsversicherung ist dein gesamtes Vorsorgekonzept gefährdet. Statistisch wird jede:r 4. Arbeitnehmer:in vor Rente berufsunfähig.' });
  if (hatRiester && p.kinder === 0 && !p.immobilieSelbst) empf.push({ typ: 'neutral', titel: 'Wechsel ins Altersvorsorgedepot 2027 prüfen', text: `Ab Januar 2027 kannst du kostenlos wechseln. Bei ${fmtEur(zulage)} Grundzulage ist der Renditevorteil des neuen ETF-basierten Systems für dich relevant.` });
  if (hatRiester && p.kinder > 0) empf.push({ typ: 'positiv', titel: 'Riester maximal ausschöpfen', text: `Mit ${fmtEur(zulage)} Jahreszulage gehörst du zu den stärksten Förderfällen. Riester bis Ende 2026 vollständig nutzen.` });
  if (wohnMoegl) empf.push({ typ: 'positiv', titel: `Wohn-Riester: ${fmtEur(wohnHebel)} einsetzbar`, text: 'Du kannst Riester-Kapital direkt zur Hypothekentilgung nutzen.' });
  if (g.rurupSinnvoll) empf.push({ typ: 'info', titel: 'Rürup-Rente als Hauptinstrument', text: `Bis zu ${fmtEur(rurupBtg)}/Jahr steuerlich absetzbar. Steuervorteil: ca. ${fmtEur(rurupSteuv)}/Jahr.` });
  if (g.istBeamter) empf.push({ typ: 'info', titel: 'Pensionsanspruch kalkulieren', text: `Als Beamte:r hast du Anspruch auf ca. ${fmtEur(pensionRente)}/Monat Pension.` });
  if (g.istTvoed) empf.push({ typ: 'info', titel: 'VBL-Zusatzversorgung berücksichtigen', text: `Als TVöD-Beschäftigte:r hast du Anspruch auf VBL-Leistungen, Schätzbetrag: ca. ${fmtEur(vblRente)}/Monat.` });
  if (g.istMinijob) empf.push({ typ: 'neutral', titel: 'Minijob und Riester', text: 'Als Minijobber:in bist du riesterberechtigt wenn du auf die Rentenversicherungsfreiheit verzichtest.' });
  if (luecke > 300) empf.push({ typ: 'warnung', titel: `Versorgungslücke: ${fmtEur(luecke)}/Monat`, text: `Basis (${basisName} ca. ${fmtEur(basisRente)})${hatRiester ? ` plus Riester (ca. ${fmtEur(riesterR)})` : ''} ergeben ${fmtEur(gesamtRente)}. Bis zu deinem Ziel von ${fmtEur(p.wunschrente)} fehlen ${fmtEur(luecke)}/Monat.` });
  if (hatRiester) empf.push({ typ: 'info', titel: 'Riester ist Aufstockung', text: `Riester ersetzt nicht die ${basisName} — er kommt oben drauf. Dein Fundament: ca. ${fmtEur(basisRente)}/Monat.` });
  if (p.verheiratet && !p.partnerRiester && hatRiester) empf.push({ typ: 'info', titel: 'Mittelbarer Riester für Partner', text: 'Dein:e Partner:in kann über einen mittelbaren Vertrag ebenfalls 175 €/Jahr Förderung erhalten.' });

  return {
    zvE, gst: Math.round(gst * 100), zulage, minEigen, steuerv, effEigen,
    gesamtBtg, kapHeute, jahreEing, proj, endR, endD, endE,
    gesetzRente, riesterR, depotR, etfR, meitErs, pensionRente, vblRente,
    gesamtRente, luecke, rentendauer, restjahre, frühAbzug: Math.round(frühAbzugRaw * 100),
    foerderScore, stabScore, risikoScore, nutzenScore,
    ampel, ehrlichText, empf, wohnMoegl, wohnHebel,
    rurupBtg, rurupSteuv, hatRiester, g,
  };
}
