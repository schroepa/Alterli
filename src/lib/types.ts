export type Hauptgruppe = 'angestellt' | 'oeffentlich' | 'selbst' | 'freiberuf';

export interface CalcParams {
  hauptgruppe: Hauptgruppe | '';
  untergruppe: string;
  geschlecht: 'w' | 'm';
  alter: number;
  bruttoMonat: number;
  gewerbeMonat: number;
  verheiratet: boolean;
  kinder: number;
  partnerRiester: boolean;
  hatRiester: boolean;
  jahreRiester: number;
  hatBU: boolean;
  hatImmobilie: boolean;
  immobilieSelbst: boolean;
  kaltmiete: number;
  restschuld: number;
  wunschrente: number;
  fruehRente: number;
  inflation: boolean;
  ereignisse: unknown[];
}

export interface Gruppe {
  istBeamter: boolean;
  istTvoed: boolean;
  istSelbst: boolean;
  istMinijob: boolean;
  istVW: boolean;
  istFreiOhneVW: boolean;
  hatGRV: boolean;
  riesterMoegl: boolean;
  rurupSinnvoll: boolean;
}

export interface ProjectionPoint {
  alter: number;
  riester: number;
  depot: number;
  etf: number;
}

export type Ampel = 'gruen' | 'gelb' | 'rot';
export type EmpfTyp = 'positiv' | 'neutral' | 'warnung' | 'info';

export interface Empfehlung {
  typ: EmpfTyp;
  titel: string;
  text: string;
}

export interface CalcResult {
  zvE: number;
  gst: number;
  zulage: number;
  minEigen: number;
  steuerv: number;
  effEigen: number;
  gesamtBtg: number;
  kapHeute: number;
  jahreEing: number;
  proj: ProjectionPoint[];
  endR: number;
  endD: number;
  endE: number;
  gesetzRente: number;
  riesterR: number;
  depotR: number;
  etfR: number;
  meitErs: number;
  pensionRente: number;
  vblRente: number;
  gesamtRente: number;
  luecke: number;
  rentendauer: number;
  restjahre: number;
  frühAbzug: number;
  foerderScore: number;
  stabScore: number;
  risikoScore: number;
  nutzenScore: number;
  ampel: Ampel;
  ehrlichText: string;
  empf: Empfehlung[];
  wohnMoegl: boolean;
  wohnHebel: number;
  rurupBtg: number;
  rurupSteuv: number;
  hatRiester: boolean;
  g: Gruppe;
}

export const INIT_PARAMS: CalcParams = {
  geschlecht: 'w',
  hauptgruppe: '',
  untergruppe: '',
  alter: 35,
  bruttoMonat: 2500,
  gewerbeMonat: 0,
  verheiratet: false,
  kinder: 0,
  partnerRiester: false,
  hatRiester: true,
  jahreRiester: 10,
  hatBU: false,
  hatImmobilie: false,
  immobilieSelbst: false,
  kaltmiete: 800,
  restschuld: 0,
  wunschrente: 2000,
  fruehRente: 0,
  inflation: true,
  ereignisse: [],
};
