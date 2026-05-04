import type { Hauptgruppe } from './types';

export interface HauptgruppeConfig {
  id: Hauptgruppe;
  label: string;
  sub: string;
  iconName: 'Briefcase' | 'Building2' | 'Wrench' | 'Scale';
}

export interface UntergruppeConfig {
  id: string;
  label: string;
  hint: string;
  /** If true, selecting this untergruppe triggers the Soft Exit screen */
  softExit?: boolean;
}

export const HAUPTGRUPPEN: HauptgruppeConfig[] = [
  { id: 'angestellt',  label: 'Angestellt',      sub: 'Privatwirtschaft',           iconName: 'Briefcase' },
  { id: 'oeffentlich', label: 'Öffentl. Dienst', sub: 'Beamte · TVöD · TV-L',       iconName: 'Building2' },
  { id: 'selbst',      label: 'Selbstständig',   sub: 'Gewerbe · Freischaffend',    iconName: 'Wrench'    },
  { id: 'freiberuf',   label: 'Freier Beruf',    sub: 'Versorgungswerk · Sonstige', iconName: 'Scale'     },
];

export const UNTERGRUPPEN: Record<Hauptgruppe, UntergruppeConfig[]> = {
  angestellt: [
    { id: 'vollzeit', label: 'Vollzeit',               hint: 'Standard-Riester-Förderung' },
    { id: 'teilzeit', label: 'Teilzeit',               hint: 'Anteilige Riester-Förderung' },
    { id: 'minijob',  label: 'Minijob (bis 556 €/Mo.)', hint: 'Riester möglich, Eigenbeitrag beachten' },
  ],
  oeffentlich: [
    { id: 'beamter', label: 'Beamte:r',              hint: 'Pension statt Rente · Riester optional' },
    { id: 'tvoed',   label: 'Angestellt (TVöD/TV-L)', hint: 'GRV + VBL-Zusatzversorgung' },
  ],
  selbst: [
    { id: 'gewerbe',   label: 'Gewerbetreibend',          hint: 'Rürup als Hauptinstrument' },
    { id: 'freischaf', label: 'Freischaffend / Creative', hint: 'Rürup + ggf. KSK-Absicherung' },
  ],
  freiberuf: [
    { id: 'vw_arzt',           label: 'Arzt / Zahnarzt',        hint: 'Versorgungswerk · Hinweis',   softExit: true },
    { id: 'vw_anwalt',         label: 'Rechtsanwalt / Notar',   hint: 'Versorgungswerk · Hinweis',   softExit: true },
    { id: 'vw_arch',           label: 'Architekt / Ingenieur',  hint: 'Versorgungswerk · Hinweis',   softExit: true },
    { id: 'vw_steuer',         label: 'Steuerberater / WP',     hint: 'Versorgungswerk · Hinweis',   softExit: true },
    { id: 'freiberuf_sonstig', label: 'Sonstiger Freiberufler', hint: 'Ohne Versorgungswerk · Rürup' },
  ],
};

/** Human-readable label for the selected VW type (used in SoftExit) */
export const VW_LABELS: Record<string, string> = {
  vw_arzt:   'Ärzten / Zahnärzten',
  vw_anwalt: 'Rechtsanwälten / Notaren',
  vw_arch:   'Architekten / Ingenieuren',
  vw_steuer: 'Steuerberatern / WP',
};

/** Context sentence shown beneath the untergruppe question */
export const UNTERGRUPPE_CONTEXT: Record<Hauptgruppe, string> = {
  angestellt:  '',
  oeffentlich: '',
  selbst:      '',
  freiberuf:   'Versorgungswerke folgen eigenen Regeln. Wir sagen dir ehrlich wann wir nicht weiterhelfen können.',
};
