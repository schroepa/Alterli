import { useState, useMemo, useCallback } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, Cell,
} from "recharts";

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const C = {
  bg:"#07080a",bg1:"#0c0d11",bg2:"#111318",bg3:"#161820",bg4:"#1c1e28",
  border:"#1e2030",border2:"#262838",
  gold:"#c8a245",goldDim:"#6e5520",
  green:"#47a875",red:"#b83c3c",blue:"#4a7fc0",
  purple:"#8060c0",orange:"#c86c38",teal:"#3a9090",
  text:"#e0dbd4",textSub:"#857f90",textFaint:"#3a3848",
  font:"'Palatino Linotype','Book Antiqua',Palatino,serif",
  sans:"'system-ui',sans-serif",mono:"'Courier New',monospace",
};

// ─── BERUFSGRUPPEN ────────────────────────────────────────────────────────────
const HAUPTGRUPPEN = [
  { id:"angestellt", label:"Angestellt (Privatwirtschaft)", icon:"💼" },
  { id:"oeffentlich", label:"Öffentlicher Dienst", icon:"🏛" },
  { id:"selbst", label:"Selbstständig / Gewerbetreibend", icon:"⚙️" },
  { id:"freiberuf", label:"Freier Beruf / Versorgungswerk", icon:"⚖️" },
];

const UNTERGRUPPEN = {
  angestellt:  [
    { id:"vollzeit",  label:"Vollzeit",              hint:"Standard-Riester-Förderung" },
    { id:"teilzeit",  label:"Teilzeit",               hint:"Anteilige Riester-Förderung" },
    { id:"minijob",   label:"Minijob (bis 556 €/Mo)", hint:"Riester möglich, Eigenbeitrag beachten" },
  ],
  oeffentlich: [
    { id:"beamter",   label:"Beamte:r",               hint:"Pension statt Rente · Riester optional" },
    { id:"tvoed",     label:"Angestellt (TVöD/TV-L)",  hint:"GRV + VBL-Zusatzversorgung" },
  ],
  selbst: [
    { id:"gewerbe",   label:"Gewerbetreibend",         hint:"Rürup als Hauptinstrument" },
    { id:"freischaf", label:"Freischaffend / Creative", hint:"Rürup + ggf. KSK-Absicherung" },
  ],
  freiberuf: [
    { id:"vw_arzt",   label:"Arzt / Zahnarzt",         hint:"Versorgungswerk · Soft Exit", softExit: true },
    { id:"vw_anwalt", label:"Rechtsanwalt / Notar",    hint:"Versorgungswerk · Soft Exit", softExit: true },
    { id:"vw_arch",   label:"Architekt / Ingenieur",   hint:"Versorgungswerk · Soft Exit", softExit: true },
    { id:"vw_steuer", label:"Steuerberater / WP",      hint:"Versorgungswerk · Soft Exit", softExit: true },
    { id:"freiberuf_sonstig", label:"Sonstiger Freiberufler", hint:"Ohne Versorgungswerk · Rürup" },
  ],
};

// ─── CALC ENGINE ─────────────────────────────────────────────────────────────
function getGruppe(p) {
  const h = p.hauptgruppe, u = p.untergruppe;
  return {
    istBeamter:   h==="oeffentlich" && u==="beamter",
    istTvoed:     h==="oeffentlich" && u==="tvoed",
    istSelbst:    h==="selbst",
    istMinijob:   h==="angestellt"  && u==="minijob",
    istVW:        h==="freiberuf"   && u?.startsWith("vw_"),
    istFreiOhneVW:h==="freiberuf"   && u==="freiberuf_sonstig",
    hatGRV:       !(h==="freiberuf" && u?.startsWith("vw_")) && !(h==="oeffentlich" && u==="beamter"),
    riesterMoegl: (h==="angestellt" || (h==="oeffentlich") || false),
    rurupSinnvoll:h==="selbst" || h==="freiberuf",
  };
}

function calc(p) {
  const g = getGruppe(p);
  const rentenAlter   = p.fruehRente || 67;
  const frühAbzug     = rentenAlter < 67 ? Math.max(0, 67 - rentenAlter) * 0.036 : 0;
  const restjahre     = Math.max(1, rentenAlter - p.alter);
  const lebenserw     = p.geschlecht === "w" ? 86 : 81;
  const rentendauer   = Math.max(1, lebenserw - rentenAlter);
  const bruttoJahr    = p.bruttoMonat * 12;
  const gewerbeJahr   = p.gewerbeMonat * 12;
  const zvE           = Math.round(g.istSelbst || g.istFreiOhneVW
    ? gewerbeJahr * 0.72
    : bruttoJahr + gewerbeJahr * 0.72);

  // Grenzsteuersatz
  let gst = 0;
  if (zvE>66760)      gst=0.42;
  else if (zvE>17005) gst=0.20+((zvE-17005)/(66760-17005))*0.22;
  else if (zvE>11604) gst=0.14+((zvE-11604)/(17005-11604))*0.06;

  // Riester
  const hatRiester = p.hatRiester && g.riesterMoegl;
  let zulage = 0;
  if (hatRiester) {
    if (!g.istMinijob) zulage += 175;
    else zulage += 175; // Minijob bekommt volle Zulage bei Mindestbeitrag
    zulage += p.kinder * 300;
    if (p.verheiratet && p.partnerRiester) zulage += 175;
  }

  const minEigen    = hatRiester ? Math.max(g.istMinijob?60:60, Math.round(zvE*0.04)-zulage) : 0;
  const steuerv     = hatRiester ? Math.round(Math.min(2100,minEigen+zulage)*gst) : 0;
  const effEigen    = Math.max(0, minEigen-steuerv);
  const gesamtBtg   = minEigen + zulage;
  const jahreEing   = hatRiester ? Math.max(0,p.jahreRiester) : 0;
  const kapHeute    = hatRiester ? Math.round(gesamtBtg*((Math.pow(1.012,jahreEing)-1)/0.012)) : 0;

  // Rürup
  const rurupMax    = 27566;
  const rurupBtg    = g.rurupSinnvoll ? Math.min(rurupMax,Math.round(zvE*0.2)) : 0;
  const rurupSteuv  = Math.round(rurupBtg*gst);

  // VBL (TVöD Schätzung)
  const vblRente    = g.istTvoed ? Math.round(bruttoJahr*0.004*Math.max(0,p.alter-18)) : 0;

  // Pension (Beamte)
  const pensionRente = g.istBeamter
    ? Math.round((bruttoJahr/12) * Math.min(0.72, Math.max(0,p.alter-18)*0.02) * (1-frühAbzug))
    : 0;

  // Projektion
  const proj=[];
  let kR=kapHeute, kD=kapHeute, kE=kapHeute*0.5;
  for(let j=0;j<=restjahre;j++){
    const infl=p.inflation?Math.pow(0.98,j):1;
    proj.push({alter:p.alter+j,riester:Math.round(kR*infl),depot:Math.round(kD*infl),etf:Math.round(kE*infl)});
    kR=(kR+gesamtBtg)*1.012; kD=(kD+gesamtBtg)*1.055; kE=(kE+effEigen*1.1)*1.072;
  }
  const endR=proj[proj.length-1]?.riester||0;
  const endD=proj[proj.length-1]?.depot||0;
  const endE=proj[proj.length-1]?.etf||0;

  // Gesetzliche Rente
  const entgP      = g.hatGRV ? (bruttoJahr/45358)*Math.max(0,p.alter-18) : 0;
  const gesetzRente = Math.round(entgP*39.32*(1-frühAbzug));
  const riesterR    = Math.round(endR/(rentendauer*12));
  const depotR      = Math.round(endD/(rentendauer*12));
  const etfR        = Math.round(endE/(rentendauer*12));
  const mietErs     = p.hatImmobilie&&p.immobilieSelbst ? p.kaltmiete : 0;

  let gesamtRente = gesetzRente + mietErs;
  if (hatRiester) gesamtRente += riesterR;
  if (g.istBeamter) gesamtRente = pensionRente + mietErs;
  if (g.istTvoed) gesamtRente += vblRente;

  const luecke = Math.max(0, p.wunschrente - gesamtRente);

  // Wohn-Riester
  const wohnMoegl   = hatRiester&&p.hatImmobilie&&p.immobilieSelbst&&p.restschuld>0;
  const wohnHebel   = wohnMoegl ? Math.min(kapHeute,p.restschuld) : 0;

  // Scores
  const foerderScore = hatRiester ? Math.min(100,Math.round((zulage/775)*100))
    : g.rurupSinnvoll ? 45 : g.istBeamter ? 60 : 0;
  const stabScore = Math.min(100,
    (p.verheiratet?18:0)+(p.hatImmobilie?22:0)+(p.immobilieSelbst?12:0)+
    (p.hatBU?22:0)+(g.istBeamter?20:0)+(zvE>45000?16:8));
  const risikoScore = Math.min(100,
    (luecke>500?30:luecke>200?18:5)+(!p.hatBU?25:0)+
    (!hatRiester&&!p.hatImmobilie&&!g.istBeamter?20:0)+
    (p.restschuld>100000&&!p.hatBU?15:0)+(!p.verheiratet?8:0));
  const nutzenScore = hatRiester ? Math.min(100,
    foerderScore*0.3+(steuerv>200?20:10)+(p.immobilieSelbst?20:0)+(p.kinder>0?18:0)+12)
    : g.rurupSinnvoll ? Math.min(100,Math.round(rurupSteuv/40))
    : g.istBeamter ? 70 : 20;

  const ampel = luecke===0?"gruen":luecke<300?"gelb":"rot";

  // Ehrlicher Moment
  let ehrlichText="";
  if(g.istVW){
    ehrlichText=`Als Mitglied eines berufsständischen Versorgungswerks gelten für dich eigene Regeln. Eine individuelle Beratung durch einen spezialisierten Rentenberater ist hier unverzichtbar.`;
  } else if(g.istBeamter&&!p.hatBU){
    ehrlichText=`Als Beamte:r hast du eine Pensionsanwartschaft von bis zu ${fmtEur(pensionRente)}/Monat. Aber: Dienstunfähigkeit trifft Beamte häufiger als gedacht — eine BU-ähnliche Absicherung (Dienstunfähigkeitsversicherung) fehlt dir noch.`;
  } else if(g.istSelbst&&!p.hatBU){
    ehrlichText=`Als Selbstständige:r hast du keinen gesetzlichen Schutz bei Erwerbsminderung. Ohne Absicherung gefährdest du nicht nur deine Rente — sondern alles was du aufgebaut hast.`;
  } else if(hatRiester&&p.kinder>0){
    ehrlichText=`Mit ${p.kinder} ${p.kinder===1?"Kind":"Kindern"} gehörst du zu den stärksten Förderfällen im deutschen System. ${fmtEur(zulage)} Staatszulage pro Jahr — das alte Riester-System ist für dich noch klar im Vorteil.`;
  } else if(hatRiester&&p.kinder===0&&!p.immobilieSelbst&&zvE<35000){
    ehrlichText=`Du zahlst ${fmtEur(minEigen)} im Jahr in deinen Riester und bekommst dafür ${fmtEur(zulage)} Zulage. Das Altersvorsorgedepot 2027 könnte dein Kapital bis zu 4× schneller wachsen lassen.`;
  } else if(wohnMoegl){
    ehrlichText=`Du kannst ${fmtEur(wohnHebel)} aus deinem Riester-Kapital direkt zur Tilgung deiner Hypothek einsetzen — das spart Zinsen und verkürzt die Restlaufzeit.`;
  } else if(!hatRiester&&!p.hatImmobilie&&!g.istBeamter&&!g.istVW){
    ehrlichText=`Du hast keine private Altersvorsorge und kein Wohneigentum. Deine geschätzte gesetzliche Rente: ${fmtEur(gesetzRente)}/Monat. Dein Wunsch: ${fmtEur(p.wunschrente)}/Monat.`;
  } else if(luecke>400){
    ehrlichText=`Deine geschätzte Rente liegt ${fmtEur(luecke)}/Monat unter deinem Ziel. Das entspricht einem fehlenden Kapitalstock von ca. ${fmtEur(luecke*12*rentendauer)}.`;
  } else {
    ehrlichText=`Dein Vorsorge-Profil ist solide. Die wichtigste offene Frage: ${!p.hatBU?"eine BU-Versicherung fehlt noch.":"Überprüfe deinen Plan alle 2–3 Jahre."}`;
  }

  // Empfehlungen
  const empf=[];
  if(g.istVW) empf.push({typ:"info",titel:"Versorgungswerk — Fachberatung empfohlen",text:`Berufsständische Versorgungswerke haben eigene Leistungsregeln die sich stark von der gesetzlichen Rente unterscheiden. Für eine verlässliche Prognose wende dich an einen auf Freiberufler spezialisierten Rentenberater oder Steuerberater.`});
  if(!p.hatBU) empf.push({typ:"warnung",titel:"BU-Absicherung fehlt",text:g.istBeamter?"Für Beamte empfiehlt sich eine Dienstunfähigkeitsversicherung. Ohne sie besteht bei vorzeitiger Dienstunfähigkeit erhebliches Einkommensrisiko.":"Ohne Berufsunfähigkeitsversicherung ist dein gesamtes Vorsorgekonzept gefährdet. Statistisch wird jede:r 4. Arbeitnehmer:in vor Rente berufsunfähig."});
  if(hatRiester&&p.kinder===0&&!p.immobilieSelbst) empf.push({typ:"neutral",titel:"Wechsel ins Altersvorsorgedepot 2027 prüfen",text:`Ab Januar 2027 kannst du kostenlos wechseln. Bei ${fmtEur(zulage)} Grundzulage ist der Renditevorteil des neuen ETF-basierten Systems für dich relevant.`});
  if(hatRiester&&p.kinder>0) empf.push({typ:"positiv",titel:"Riester maximal ausschöpfen",text:`Mit ${fmtEur(zulage)} Jahreszulage gehörst du zu den stärksten Förderfällen. Das alte Riester-System bis Ende 2026 vollständig nutzen bevor das neue System schlechtere Kinderzulagen bietet.`});
  if(wohnMoegl) empf.push({typ:"positiv",titel:`Wohn-Riester: ${fmtEur(wohnHebel)} einsetzbar`,text:"Du kannst Riester-Kapital direkt zur Hypothekentilgung nutzen. Das reduziert deine Zinskosten und erhöht dein Nettovermögen im Alter."});
  if(g.rurupSinnvoll) empf.push({typ:"info",titel:"Rürup-Rente als Hauptinstrument",text:`Bis zu ${fmtEur(rurupBtg)}/Jahr steuerlich absetzbar. Steuervorteil: ca. ${fmtEur(rurupSteuv)}/Jahr. Bei deinem Einkommen ist das das effizienteste Vorsorge-Instrument.`});
  if(g.istBeamter) empf.push({typ:"info",titel:"Pensionsanspruch kalkulieren",text:`Als Beamte:r hast du nach ${Math.max(0,p.alter-18)} Dienstjahren Anspruch auf ca. ${fmtEur(pensionRente)}/Monat Pension. Riester ist optional, aber bei Kindern lohnenswert.`});
  if(g.istTvoed) empf.push({typ:"info",titel:"VBL-Zusatzversorgung berücksichtigen",text:`Als TVöD-Beschäftigte:r hast du Anspruch auf VBL-Leistungen zusätzlich zur gesetzlichen Rente. Schätzbetrag: ca. ${fmtEur(vblRente)}/Monat.`});
  if(g.istMinijob) empf.push({typ:"neutral",titel:"Minijob und Riester",text:"Als Minijobber:in bist du riesterberechtigt wenn du auf die Rentenversicherungsfreiheit verzichtest. Der Eigenbeitrag ist gering — aber die Förderquote durch Kinderzulagen kann sehr attraktiv sein."});
  if(luecke>300) empf.push({typ:"warnung",titel:`Versorgungslücke: ${fmtEur(luecke)}/Monat`,text:`Um dein Rentenziel von ${fmtEur(p.wunschrente)}/Monat zu erreichen fehlen ${fmtEur(luecke)}/Monat. Notwendiges Zusatzkapital: ca. ${fmtEur(Math.round(luecke*12*rentendauer))}.`});
  if(p.verheiratet&&!p.partnerRiester&&hatRiester) empf.push({typ:"info",titel:"Mittelbarer Riester für Partner",text:"Dein:e Partner:in kann über einen mittelbaren Vertrag ebenfalls 175 €/Jahr Förderung erhalten — auch ohne eigene Rentenversicherungspflicht."});

  return {
    zvE,gst:Math.round(gst*100),zulage,minEigen,steuerv,effEigen,
    gesamtBtg,kapHeute,jahreEing,proj,endR,endD,endE,
    gesetzRente,riesterR,depotR,etfR,mietErs,pensionRente,vblRente,
    gesamtRente,luecke,rentendauer,restjahre,frühAbzug:Math.round(frühAbzug*100),
    foerderScore,stabScore,risikoScore,nutzenScore,
    ampel,ehrlichText,empf,wohnMoegl,wohnHebel,
    rurupBtg,rurupSteuv,hatRiester,g,
  };
}

const fmtEur  = n => Math.round(n).toLocaleString("de-DE")+" €";
const fmtK    = n => n>=1000?`${(n/1000).toFixed(0)}k`:String(n);

// ─── UI ATOMS ────────────────────────────────────────────────────────────────
const TIPS = {
  zvE:"Zu versteuerndes Einkommen — Basis für Steuersatz und Riester-Eigenbeitrag.",
  zulage:"Staatliche Förderung die jährlich auf deinen Riester-Vertrag eingezahlt wird.",
  steuerv:"Betrag den du durch den Sonderausgabenabzug (max. 2.100 €) bei der Steuererklärung zurückbekommst.",
  gst:"Der Steuersatz den du auf jeden zusätzlichen Euro Einkommen zahlst.",
  kapHeute:"Geschätztes angespartes Kapital. Tatsächlicher Wert hängt vom Vertrag und Anbieter ab.",
  luecke:"Monatliche Differenz zwischen geschätzter Gesamtrente und gewünschtem Renteneinkommen.",
  rurup:"Basisrente für Selbstständige — steuerlich absetzbar bis 27.566 € jährlich.",
  avd:"Altersvorsorgedepot — Riester-Nachfolger ab Januar 2027. Anlage in Aktien, Fonds, ETFs.",
  bu:"Berufsunfähigkeitsversicherung. Sichert dein Einkommen bei dauerhafter Arbeitsunfähigkeit.",
  vbl:"VBL-Zusatzversorgung für Beschäftigte im öffentlichen Dienst — zusätzlich zur gesetzlichen Rente.",
  pension:"Beamtenpension — ersetzt die gesetzliche Rente. Höhe abhängig von Besoldungsgruppe und Dienstjahren.",
};

function Tip({k}) {
  const [show,setShow]=useState(false);
  return (
    <span style={{position:"relative",display:"inline-block",marginLeft:"4px"}}>
      <span onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)}
        style={{cursor:"help",color:C.textFaint,fontSize:"9px",border:`1px solid ${C.textFaint}`,borderRadius:"50%",width:"13px",height:"13px",display:"inline-flex",alignItems:"center",justifyContent:"center"}}>?</span>
      {show&&TIPS[k]&&<div style={{position:"absolute",bottom:"18px",left:"50%",transform:"translateX(-50%)",background:C.bg3,border:`1px solid ${C.border2}`,padding:"9px 11px",fontSize:"11px",color:C.textSub,fontFamily:C.sans,lineHeight:"1.5",width:"210px",zIndex:100,borderRadius:"2px",boxShadow:"0 4px 16px #00000099"}}>{TIPS[k]}</div>}
    </span>
  );
}

function Toggle({label,value,onChange,color=C.gold,sub}) {
  return (
    <div onClick={()=>onChange(!value)} style={{cursor:"pointer",userSelect:"none"}}>
      <div style={{display:"flex",alignItems:"center",gap:"9px"}}>
        <div style={{width:"30px",height:"16px",borderRadius:"8px",background:value?color+"28":C.bg4,border:`1px solid ${value?color:C.border2}`,position:"relative",transition:"all 0.18s",flexShrink:0}}>
          <div style={{position:"absolute",top:"2px",left:value?"14px":"2px",width:"10px",height:"10px",borderRadius:"50%",background:value?color:"#444",transition:"left 0.18s"}}/>
        </div>
        <span style={{fontSize:"12px",color:value?C.text:C.textSub,fontFamily:C.sans,transition:"color 0.18s"}}>{label}</span>
      </div>
      {sub&&<div style={{fontSize:"10px",color:C.textFaint,fontFamily:C.sans,marginTop:"2px",paddingLeft:"39px"}}>{sub}</div>}
    </div>
  );
}

function Stepper({label,value,onChange,min=0,max=8}) {
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <span style={{fontSize:"12px",color:C.textSub,fontFamily:C.sans}}>{label}</span>
      <div style={{display:"flex",alignItems:"center",gap:"9px"}}>
        <button onClick={()=>onChange(Math.max(min,value-1))} style={{width:"19px",height:"19px",border:`1px solid ${C.border2}`,background:"none",color:C.textSub,cursor:"pointer",borderRadius:"2px",fontSize:"12px",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
        <span style={{fontSize:"14px",color:C.gold,fontFamily:C.mono,minWidth:"14px",textAlign:"center"}}>{value}</span>
        <button onClick={()=>onChange(Math.min(max,value+1))} style={{width:"19px",height:"19px",border:`1px solid ${C.border2}`,background:"none",color:C.textSub,cursor:"pointer",borderRadius:"2px",fontSize:"12px",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
      </div>
    </div>
  );
}

function NumInput({value,onChange,step=100,color=C.gold,suffix="€"}) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:"5px"}}>
      <input type="number" value={value} step={step} min={0} onChange={e=>onChange(Math.max(0,+e.target.value))}
        style={{flex:1,background:C.bg2,border:`1px solid ${C.border}`,color,padding:"7px 9px",fontSize:"13px",fontFamily:C.mono,borderRadius:"2px",outline:"none",width:"100%"}}/>
      <span style={{fontSize:"10px",color:C.textFaint,fontFamily:C.sans}}>{suffix}</span>
    </div>
  );
}

function Ring({value,label,color,size=58}) {
  const r=size*0.37,circ=2*Math.PI*r,dash=(Math.min(100,value)/100)*circ;
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"4px"}}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.bg4} strokeWidth="4"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`} style={{transition:"stroke-dasharray 0.5s ease"}}/>
        <text x={size/2} y={size/2+4} textAnchor="middle" fill={color} fontSize={size*0.21} fontFamily={C.sans}>{value}</text>
      </svg>
      <span style={{fontSize:"8px",color:C.textFaint,fontFamily:C.sans,letterSpacing:"0.8px",textTransform:"uppercase",textAlign:"center",maxWidth:size+10}}>{label}</span>
    </div>
  );
}

function Ampel({status}) {
  const m={gruen:{color:C.green,text:"Gut aufgestellt"},gelb:{color:C.gold,text:"Ausbaufähig"},rot:{color:C.red,text:"Handlungsbedarf"}};
  const s=m[status];
  return (
    <div style={{display:"flex",alignItems:"center",gap:"7px"}}>
      <div style={{width:"9px",height:"9px",borderRadius:"50%",background:s.color,boxShadow:`0 0 7px ${s.color}88`}}/>
      <span style={{fontSize:"11px",color:s.color,fontFamily:C.sans}}>{s.text}</span>
    </div>
  );
}

function SL({children,tip,style:s={}}) {
  return (
    <div style={{fontSize:"8px",letterSpacing:"2.5px",color:C.textFaint,fontFamily:C.sans,textTransform:"uppercase",marginBottom:"13px",...s}}>
      {children}{tip&&<Tip k={tip}/>}
    </div>
  );
}

function Card({children,accent,style:s={}}) {
  return <div style={{background:C.bg1,border:`1px solid ${C.border}`,borderTop:accent?`2px solid ${accent}`:`1px solid ${C.border}`,padding:"18px",...s}}>{children}</div>;
}

function KPI({label,value,sub,color=C.text,tip}) {
  return (
    <div style={{background:C.bg1,padding:"14px",border:`1px solid ${C.border}`}}>
      <div style={{fontSize:"8px",color:C.textFaint,fontFamily:C.sans,letterSpacing:"2px",textTransform:"uppercase",marginBottom:"6px"}}>{label}{tip&&<Tip k={tip}/>}</div>
      <div style={{fontSize:"20px",color,fontWeight:"300",letterSpacing:"-0.2px",fontFamily:C.font}}>{value}</div>
      {sub&&<div style={{fontSize:"9px",color:C.textFaint,fontFamily:C.sans,marginTop:"3px"}}>{sub}</div>}
    </div>
  );
}

function HR(){return <div style={{height:"1px",background:C.border,margin:"12px 0"}}/>;}

const ES={positiv:{color:C.green,icon:"↑"},neutral:{color:C.gold,icon:"→"},warnung:{color:C.red,icon:"!"},info:{color:C.blue,icon:"i"}};

function CTip({active,payload,label}) {
  if(!active||!payload?.length) return null;
  return (
    <div style={{background:C.bg2,border:`1px solid ${C.border2}`,padding:"9px 12px",fontFamily:C.sans}}>
      <div style={{fontSize:"9px",color:C.textSub,marginBottom:"6px"}}>Alter {label}</div>
      {payload.map((p,i)=><div key={i} style={{fontSize:"10px",color:p.color,marginBottom:"2px"}}>{p.name}: {fmtEur(p.value)}</div>)}
    </div>
  );
}

// ─── ONBOARDING ──────────────────────────────────────────────────────────────
const INIT={
  geschlecht:"w",hauptgruppe:"",untergruppe:"",alter:35,
  bruttoMonat:2500,gewerbeMonat:0,
  verheiratet:false,kinder:0,partnerRiester:false,
  hatRiester:true,jahreRiester:10,hatBU:false,
  hatImmobilie:false,immobilieSelbst:false,kaltmiete:800,restschuld:0,
  wunschrente:2000,fruehRente:0,inflation:true,ereignisse:[],
};

const STEPS=["Start","Beruf","Einkommen","Leben","Vorsorge","Ziel"];

function BerufCard({item,selected,onSelect}) {
  return (
    <button onClick={()=>onSelect(item.id)} style={{
      padding:"12px 14px",border:`1px solid ${selected?C.gold:C.border2}`,
      background:selected?C.gold+"12":C.bg2,color:selected?C.gold:C.textSub,
      cursor:"pointer",fontFamily:C.sans,fontSize:"12px",textAlign:"left",
      borderRadius:"2px",transition:"all 0.15s",display:"flex",flexDirection:"column",gap:"3px",
    }}>
      <span>{item.icon} {item.label}</span>
      {item.hint&&<span style={{fontSize:"10px",color:selected?C.goldDim:C.textFaint}}>{item.hint}</span>}
    </button>
  );
}

function SoftExit({untergruppe}) {
  const labels={vw_arzt:"Ärzten / Zahnärzten",vw_anwalt:"Rechtsanwälten / Notaren",vw_arch:"Architekten / Ingenieuren",vw_steuer:"Steuerberatern / WP"};
  return (
    <div style={{textAlign:"center",padding:"20px 0"}}>
      <div style={{fontSize:"28px",marginBottom:"16px"}}>⚖️</div>
      <div style={{fontSize:"14px",color:C.text,fontFamily:C.font,marginBottom:"12px",lineHeight:"1.6"}}>
        Versorgungswerk erkannt
      </div>
      <div style={{fontSize:"12px",color:C.textSub,fontFamily:C.sans,lineHeight:"1.7",marginBottom:"20px"}}>
        Die Altersversorgung von {labels[untergruppe]||"Freiberuflern mit Versorgungswerk"} folgt eigenen Regeln die wir nicht zuverlässig berechnen können. Eine vereinfachte Darstellung würde dir hier schaden, nicht helfen.
      </div>
      <div style={{background:C.bg3,border:`1px solid ${C.border2}`,borderLeft:`3px solid ${C.blue}`,padding:"14px",textAlign:"left",marginBottom:"16px"}}>
        <div style={{fontSize:"10px",color:C.blue,fontFamily:C.sans,letterSpacing:"2px",marginBottom:"6px"}}>WAS WIR EMPFEHLEN</div>
        <div style={{fontSize:"11px",color:C.textSub,fontFamily:C.sans,lineHeight:"1.6"}}>
          · Mitgliedschaft im Versorgungswerk prüfen und Jahresnachweis anfordern<br/>
          · Rürup-Rente als steuerlich attraktive Ergänzung prüfen<br/>
          · Spezialisierte:n Rentenberater oder Steuerberater aufsuchen<br/>
          · Deutsche Rentenversicherung: kostenlose Beratungsstellen bundesweit
        </div>
      </div>
      <div style={{fontSize:"10px",color:C.textFaint,fontFamily:C.sans}}>
        Du kannst alterli trotzdem nutzen — wähle "Sonstiger Freiberufler" für eine vereinfachte Analyse ohne Versorgungswerk-Logik.
      </div>
    </div>
  );
}

function Onboarding({onDone}) {
  const [s,setS]=useState(0);
  const [d,setD]=useState(INIT);
  const set=k=>v=>setD(p=>({...p,[k]:v}));
  const isSoftExit=s===2&&d.untergruppe?.startsWith("vw_");
  const unterOptionen=d.hauptgruppe?UNTERGRUPPEN[d.hauptgruppe]||[]:[];
  const canNext=()=>{
    if(s===1&&!d.hauptgruppe) return false;
    if(s===2&&!d.untergruppe) return false;
    if(s===3&&d.hauptgruppe!=="selbst"&&d.bruttoMonat<100) return false;
    return true;
  };

  const stepLabels=["Start","Hauptgruppe","Untergruppe","Einkommen","Leben","Vorsorge","Ziel"];

  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"28px 16px"}}>

      {/* Logo */}
      <div style={{textAlign:"center",marginBottom:"36px"}}>
        <div style={{fontSize:"30px",color:C.gold,fontFamily:C.font,letterSpacing:"4px"}}>alterli</div>
        <div style={{fontSize:"9px",color:C.textFaint,fontFamily:C.sans,letterSpacing:"5px",marginTop:"4px"}}>KNOW YOUR FUTURE SELF</div>
      </div>

      {/* Progress */}
      <div style={{display:"flex",alignItems:"center",marginBottom:"32px",gap:"0"}}>
        {stepLabels.map((label,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center"}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"4px"}}>
              <div style={{width:"26px",height:"26px",borderRadius:"50%",background:i<s?C.gold+"20":i===s?C.bg3:"none",border:`1px solid ${i<=s?C.gold:C.border2}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",color:i<=s?C.gold:C.textFaint,fontFamily:C.sans,transition:"all 0.2s"}}>{i<s?"✓":i+1}</div>
              <span style={{fontSize:"8px",color:i===s?C.textSub:C.textFaint,fontFamily:C.sans,letterSpacing:"0.5px",whiteSpace:"nowrap"}}>{label}</span>
            </div>
            {i<stepLabels.length-1&&<div style={{width:"22px",height:"1px",background:i<s?C.goldDim:C.border,margin:"0 1px",marginBottom:"14px"}}/>}
          </div>
        ))}
      </div>

      {/* Card */}
      <div style={{width:"100%",maxWidth:"440px",background:C.bg1,border:`1px solid ${C.border}`,borderTop:`2px solid ${C.gold}`,padding:"28px"}}>
        <div style={{fontSize:"16px",color:C.text,fontFamily:C.font,marginBottom:"22px"}}>
          {["Wer bist du?","Welche Berufsgruppe?","Welche Tätigkeit?","Dein Einkommen","Deine Lebenssituation","Deine Vorsorge","Dein Ziel"][s]}
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>

          {s===0&&<>
            <div>
              <div style={{fontSize:"10px",color:C.textSub,fontFamily:C.sans,marginBottom:"7px"}}>Geschlecht</div>
              <div style={{display:"flex",gap:"7px"}}>
                {["w","m"].map(g=>(
                  <button key={g} onClick={()=>set("geschlecht")(g)} style={{flex:1,padding:"8px",border:`1px solid ${d.geschlecht===g?C.gold:C.border2}`,background:d.geschlecht===g?C.gold+"15":"none",color:d.geschlecht===g?C.gold:C.textSub,cursor:"pointer",fontFamily:C.sans,fontSize:"11px",letterSpacing:"1px",borderRadius:"2px"}}>
                    {g==="w"?"WEIBLICH":"MÄNNLICH"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"5px"}}>
                <span style={{fontSize:"10px",color:C.textSub,fontFamily:C.sans}}>Alter</span>
                <span style={{fontSize:"13px",color:C.gold,fontFamily:C.mono}}>{d.alter} Jahre</span>
              </div>
              <input type="range" min="18" max="66" value={d.alter} onChange={e=>set("alter")(+e.target.value)} style={{width:"100%",accentColor:C.gold,cursor:"pointer"}}/>
            </div>
          </>}

          {s===1&&<>
            <div style={{display:"flex",flexDirection:"column",gap:"7px"}}>
              {HAUPTGRUPPEN.map(h=>(
                <BerufCard key={h.id} item={h} selected={d.hauptgruppe===h.id} onSelect={v=>{set("hauptgruppe")(v);set("untergruppe")("");}}/>
              ))}
            </div>
          </>}

          {s===2&&<>
            {isSoftExit?<SoftExit untergruppe={d.untergruppe}/>:<>
              <div style={{fontSize:"10px",color:C.textFaint,fontFamily:C.sans,marginBottom:"4px"}}>
                {HAUPTGRUPPEN.find(h=>h.id===d.hauptgruppe)?.label}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:"7px"}}>
                {unterOptionen.map(u=>(
                  <BerufCard key={u.id} item={u} selected={d.untergruppe===u.id} onSelect={set("untergruppe")}/>
                ))}
              </div>
            </>}
          </>}

          {s===3&&<>
            {(d.hauptgruppe==="angestellt"||d.hauptgruppe==="oeffentlich")&&<div>
              <div style={{fontSize:"10px",color:C.textSub,fontFamily:C.sans,marginBottom:"5px"}}>
                {d.untergruppe==="minijob"?"Monatsverdienst (brutto)":"Bruttogehalt / Monat"}
              </div>
              <NumInput value={d.bruttoMonat} onChange={set("bruttoMonat")}/>
            </div>}
            {(d.hauptgruppe==="selbst"||d.hauptgruppe==="freiberuf")&&<div>
              <div style={{fontSize:"10px",color:C.textSub,fontFamily:C.sans,marginBottom:"5px"}}>Monatliche Einnahmen (nach Betriebsausgaben)</div>
              <NumInput value={d.gewerbeMonat} onChange={set("gewerbeMonat")} color={C.blue}/>
            </div>}
            <div>
              <div style={{fontSize:"10px",color:C.textSub,fontFamily:C.sans,marginBottom:"5px"}}>
                {d.hauptgruppe==="selbst"?"Nebeneinkommen angestellt":"Nebeneinnahmen / Gewerbe"}
              </div>
              <NumInput value={d.gewerbeMonat} onChange={set("gewerbeMonat")} step={50} color={C.teal}/>
            </div>
          </>}

          {s===4&&<>
            <Toggle label="Verheiratet / feste Partnerschaft" value={d.verheiratet} onChange={set("verheiratet")}/>
            {d.verheiratet&&<Toggle label="Partner:in hat eigenen Riester" value={d.partnerRiester} onChange={set("partnerRiester")} color={C.blue}/>}
            <Stepper label="Kinder (nach 2008 geboren)" value={d.kinder} onChange={set("kinder")}/>
            <HR/>
            <Toggle label="Eigentum vorhanden" value={d.hatImmobilie} onChange={set("hatImmobilie")} color={C.green}/>
            {d.hatImmobilie&&<>
              <Toggle label="Selbst bewohnt" value={d.immobilieSelbst} onChange={set("immobilieSelbst")} color={C.green} sub="Wohn-Riester nur bei Selbstnutzung"/>
              {d.immobilieSelbst&&<div>
                <div style={{fontSize:"10px",color:C.textSub,fontFamily:C.sans,marginBottom:"5px"}}>Ersparte Kaltmiete / Monat</div>
                <NumInput value={d.kaltmiete} onChange={set("kaltmiete")} step={50} color={C.green}/>
              </div>}
              <div>
                <div style={{fontSize:"10px",color:C.textSub,fontFamily:C.sans,marginBottom:"5px"}}>Restschuld Hypothek</div>
                <NumInput value={d.restschuld} onChange={set("restschuld")} step={5000}/>
              </div>
            </>}
          </>}

          {s===5&&<>
            {(d.hauptgruppe==="angestellt"||(d.hauptgruppe==="oeffentlich"))&&<>
              <Toggle label="Riester-Vertrag vorhanden" value={d.hatRiester} onChange={set("hatRiester")}/>
              {d.hatRiester&&<div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
                  <span style={{fontSize:"10px",color:C.textSub,fontFamily:C.sans}}>Vertragsjahre bisher</span>
                  <span style={{fontSize:"12px",color:C.gold,fontFamily:C.mono}}>{d.jahreRiester} J.</span>
                </div>
                <input type="range" min="1" max={Math.max(1,d.alter-18)} value={d.jahreRiester} onChange={e=>set("jahreRiester")(+e.target.value)} style={{width:"100%",accentColor:C.gold,cursor:"pointer"}}/>
              </div>}
            </>}
            {(d.hauptgruppe==="selbst"||d.hauptgruppe==="freiberuf")&&(
              <div style={{background:C.bg3,border:`1px solid ${C.border2}`,borderLeft:`3px solid ${C.blue}`,padding:"12px"}}>
                <div style={{fontSize:"10px",color:C.blue,fontFamily:C.sans,marginBottom:"5px"}}>Rürup statt Riester</div>
                <div style={{fontSize:"11px",color:C.textSub,fontFamily:C.sans,lineHeight:"1.6"}}>Als Selbstständige:r ist die Rürup-Rente dein primäres staatlich gefördertes Vorsorge-Instrument. Wir analysieren das automatisch.</div>
              </div>
            )}
            {d.untergruppe==="beamter"&&(
              <div style={{background:C.bg3,border:`1px solid ${C.border2}`,borderLeft:`3px solid ${C.teal}`,padding:"12px"}}>
                <div style={{fontSize:"10px",color:C.teal,fontFamily:C.sans,marginBottom:"5px"}}>Beamtenpension</div>
                <div style={{fontSize:"11px",color:C.textSub,fontFamily:C.sans,lineHeight:"1.6"}}>Als Beamte:r hast du einen Pensionsanspruch. Riester ist optional aber bei Kindern förderungswürdig.</div>
              </div>
            )}
            <Toggle label="BU- / Dienstunfähigkeitsversicherung" value={d.hatBU} onChange={set("hatBU")} color={C.purple} sub="Schützt das gesamte Vorsorgekonzept"/>
            <Toggle label="Inflation einrechnen (2%/Jahr)" value={d.inflation} onChange={set("inflation")} color={C.textFaint}/>
          </>}

          {s===6&&<>
            <div>
              <div style={{fontSize:"10px",color:C.textSub,fontFamily:C.sans,marginBottom:"5px"}}>Gewünschte Monatsrente (netto)</div>
              <NumInput value={d.wunschrente} onChange={set("wunschrente")} step={100} color={C.green}/>
            </div>
            <div>
              <div style={{fontSize:"10px",color:C.textSub,fontFamily:C.sans,marginBottom:"7px"}}>Frühverrentung geplant?</div>
              <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
                {[0,60,62,63,65].map(age=>(
                  <button key={age} onClick={()=>set("fruehRente")(age)} style={{padding:"5px 10px",border:`1px solid ${d.fruehRente===age?C.gold:C.border2}`,background:d.fruehRente===age?C.gold+"15":"none",color:d.fruehRente===age?C.gold:C.textSub,cursor:"pointer",fontFamily:C.sans,fontSize:"10px",borderRadius:"2px"}}>
                    {age===0?"67 (Standard)":`Mit ${age}`}
                  </button>
                ))}
              </div>
              {d.fruehRente>=62&&d.fruehRente<67&&<div style={{fontSize:"10px",color:C.orange,fontFamily:C.sans,marginTop:"5px"}}>Dauerhafter Abzug: {(67-d.fruehRente)*3.6}%</div>}
            </div>
            <HR/>
            <div>
              <div style={{fontSize:"10px",color:C.textSub,fontFamily:C.sans,marginBottom:"8px"}}>Geplante Lebensereignisse</div>
              {[{typ:"kind",label:"Kind geplant"},{typ:"heirat",label:"Heirat geplant"},{typ:"immokauf",label:"Immobilienkauf geplant"}].map(ev=>{
                const ex=d.ereignisse.find(e=>e.typ===ev.typ);
                return (
                  <div key={ev.typ} style={{display:"flex",alignItems:"center",gap:"9px",marginBottom:"7px"}}>
                    <input type="checkbox" checked={!!ex} onChange={e=>{
                      if(e.target.checked) setD(p=>({...p,ereignisse:[...p.ereignisse,{typ:ev.typ,inJahren:3}]}));
                      else setD(p=>({...p,ereignisse:p.ereignisse.filter(x=>x.typ!==ev.typ)}));
                    }} style={{accentColor:C.gold,cursor:"pointer"}}/>
                    <span style={{fontSize:"11px",color:C.textSub,fontFamily:C.sans,flex:1}}>{ev.label}</span>
                    {ex&&<div style={{display:"flex",alignItems:"center",gap:"5px"}}>
                      <span style={{fontSize:"9px",color:C.textFaint,fontFamily:C.sans}}>in</span>
                      <input type="number" value={ex.inJahren} min={1} max={30} onChange={e=>setD(p=>({...p,ereignisse:p.ereignisse.map(x=>x.typ===ev.typ?{...x,inJahren:+e.target.value}:x)}))}
                        style={{width:"40px",background:C.bg2,border:`1px solid ${C.border}`,color:C.gold,padding:"2px 5px",fontSize:"11px",fontFamily:C.mono,borderRadius:"2px",outline:"none"}}/>
                      <span style={{fontSize:"9px",color:C.textFaint,fontFamily:C.sans}}>J.</span>
                    </div>}
                  </div>
                );
              })}
            </div>
          </>}
        </div>

        {/* Nav */}
        <div style={{display:"flex",gap:"7px",marginTop:"24px"}}>
          {s>0&&!isSoftExit&&<button onClick={()=>setS(x=>x-1)} style={{padding:"10px 14px",border:`1px solid ${C.border2}`,background:"none",color:C.textSub,cursor:"pointer",fontFamily:C.sans,fontSize:"10px",letterSpacing:"1px",borderRadius:"2px"}}>← Zurück</button>}
          {!isSoftExit&&<button onClick={()=>canNext()&&(s<stepLabels.length-1?setS(x=>x+1):onDone(d))}
            style={{flex:1,padding:"10px",border:`1px solid ${canNext()?C.gold:C.border2}`,background:canNext()?C.gold+"18":"none",color:canNext()?C.gold:C.textFaint,cursor:canNext()?"pointer":"default",fontFamily:C.sans,fontSize:"10px",letterSpacing:"2px",textTransform:"uppercase",borderRadius:"2px",transition:"all 0.15s"}}>
            {s<stepLabels.length-1?"Weiter →":"Analyse starten"}
          </button>}
          {isSoftExit&&<button onClick={()=>setS(x=>x-1)} style={{flex:1,padding:"10px",border:`1px solid ${C.border2}`,background:"none",color:C.textSub,cursor:"pointer",fontFamily:C.sans,fontSize:"10px",letterSpacing:"1px",borderRadius:"2px"}}>← Andere Gruppe wählen</button>}
        </div>
      </div>

      <div style={{marginTop:"16px",fontSize:"9px",color:C.textFaint,fontFamily:C.sans,textAlign:"center"}}>
        Keine Datenspeicherung · Alle Berechnungen lokal · Keine Anlageberatung im Sinne des WpHG
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
const TABS=[
  {id:"dashboard",label:"Dashboard"},
  {id:"projektion",label:"Projektion"},
  {id:"vergleich",label:"Vergleich"},
  {id:"szenarien",label:"Szenarien"},
  {id:"empfehlungen",label:"Empfehlungen"},
];

export default function Alterli() {
  const [profil,setProfil]=useState(null);
  const [ehrlich,setEhrlich]=useState(true);
  const [tab,setTab]=useState("dashboard");
  const [sidebar,setSidebar]=useState(true);
  const [szenario,setSzenario]=useState(null);
  const set=k=>v=>setProfil(p=>({...p,[k]:v}));
  const setS=k=>v=>setSzenario(p=>({...p,[k]:v}));
  const r=useMemo(()=>profil?calc(profil):null,[profil]);
  const rs=useMemo(()=>szenario?calc(szenario):null,[szenario]);
  const startSz=useCallback(()=>setSzenario({...profil}),[profil]);

  const berufsLabel=profil?[
    HAUPTGRUPPEN.find(h=>h.id===profil.hauptgruppe)?.label,
    UNTERGRUPPEN[profil.hauptgruppe]?.find(u=>u.id===profil.untergruppe)?.label,
  ].filter(Boolean).join(" · "):"";

  if(!profil) return <Onboarding onDone={d=>{setProfil(d);setSzenario(d);}}/>;

  // Ehrlicher Moment
  if(ehrlich) return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 16px"}}>
      <div style={{fontSize:"9px",color:C.textFaint,fontFamily:C.sans,letterSpacing:"5px",marginBottom:"28px"}}>alterli · ANALYSE</div>
      <div style={{maxWidth:"500px",textAlign:"center"}}>
        <div style={{fontSize:"9px",color:C.gold,fontFamily:C.sans,letterSpacing:"3px",marginBottom:"18px"}}>EIN EHRLICHER BLICK</div>
        <div style={{fontSize:"clamp(15px,2.8vw,20px)",color:C.text,fontFamily:C.font,lineHeight:"1.7",marginBottom:"10px",fontStyle:"italic"}}>
          "{r.ehrlichText}"
        </div>
        <div style={{fontSize:"10px",color:C.textFaint,fontFamily:C.sans,marginBottom:"28px"}}>{berufsLabel}</div>
        <Ampel status={r.ampel}/>
        <button onClick={()=>setEhrlich(false)} style={{marginTop:"36px",padding:"12px 36px",border:`1px solid ${C.gold}`,background:C.gold+"18",color:C.gold,cursor:"pointer",fontFamily:C.sans,fontSize:"10px",letterSpacing:"3px",textTransform:"uppercase",borderRadius:"2px"}}>
          Vollständige Analyse →
        </button>
      </div>
    </div>
  );

  const radarData=[
    {subject:"Förderung",A:r.foerderScore,B:rs?.foerderScore||0},
    {subject:"Stabilität",A:r.stabScore,B:rs?.stabScore||0},
    {subject:"Nutzen",A:r.nutzenScore,B:rs?.nutzenScore||0},
    {subject:"Sicherheit",A:100-r.risikoScore,B:rs?100-rs.risikoScore:0},
    {subject:"Flex.",A:r.hatRiester?55:80,B:rs?.hatRiester?55:80},
  ];

  const vDaten=[
    {name:"Riester",kapital:r.endR,rente:r.riesterR,color:C.gold},
    {name:"AVD 2027",kapital:r.endD,rente:r.depotR,color:C.green},
    {name:"ETF-Depot",kapital:r.endE,rente:r.etfR,color:C.blue},
  ];

  return (
    <div style={{fontFamily:C.font,background:C.bg,minHeight:"100vh",color:C.text,display:"flex",flexDirection:"column"}}>

      {/* TOP */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 18px",height:"48px",borderBottom:`1px solid ${C.border}`,background:C.bg1,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
          <button onClick={()=>setSidebar(s=>!s)} style={{background:"none",border:"none",color:C.textFaint,cursor:"pointer",fontSize:"14px"}}>☰</button>
          <span style={{fontSize:"17px",color:C.gold,letterSpacing:"2px"}}>alterli</span>
          <span style={{fontSize:"8px",color:C.textFaint,fontFamily:C.sans,letterSpacing:"2px",borderLeft:`1px solid ${C.border2}`,paddingLeft:"10px"}}>{berufsLabel}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <Ampel status={r.ampel}/>
          <button onClick={()=>setEhrlich(true)} style={{background:"none",border:`1px solid ${C.border2}`,color:C.textFaint,padding:"3px 10px",cursor:"pointer",fontFamily:C.sans,fontSize:"9px",letterSpacing:"1px",borderRadius:"2px"}}>Ehrlicher Moment</button>
          <button onClick={()=>{setProfil(null);setEhrlich(true);}} style={{background:"none",border:`1px solid ${C.border2}`,color:C.textFaint,padding:"3px 10px",cursor:"pointer",fontFamily:C.sans,fontSize:"9px",letterSpacing:"1px",borderRadius:"2px"}}>Neu</button>
        </div>
      </div>

      <div style={{display:"flex",flex:1,overflow:"hidden",minHeight:0}}>

        {/* SIDEBAR */}
        {sidebar&&(
          <div style={{width:"240px",flexShrink:0,background:C.bg1,borderRight:`1px solid ${C.border}`,overflowY:"auto",padding:"16px 13px",display:"flex",flexDirection:"column",gap:"18px"}}>

            <section>
              <SL>Persönlich</SL>
              <div style={{marginBottom:"9px"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
                  <span style={{fontSize:"10px",color:C.textSub,fontFamily:C.sans}}>Alter</span>
                  <span style={{fontSize:"11px",color:C.gold,fontFamily:C.mono}}>{profil.alter}</span>
                </div>
                <input type="range" min="18" max="66" value={profil.alter} onChange={e=>set("alter")(+e.target.value)} style={{width:"100%",accentColor:C.gold,cursor:"pointer"}}/>
              </div>
              <div style={{display:"flex",gap:"5px"}}>
                {["w","m"].map(g=>(
                  <button key={g} onClick={()=>set("geschlecht")(g)} style={{flex:1,padding:"4px",border:`1px solid ${profil.geschlecht===g?C.gold:C.border2}`,background:profil.geschlecht===g?C.gold+"15":"none",color:profil.geschlecht===g?C.gold:C.textFaint,cursor:"pointer",fontFamily:C.sans,fontSize:"10px",borderRadius:"2px"}}>
                    {g==="w"?"♀ W":"♂ M"}
                  </button>
                ))}
              </div>
            </section>

            <HR/>

            <section>
              <SL>Einkommen / Monat</SL>
              <div style={{marginBottom:"8px"}}>
                <div style={{fontSize:"9px",color:C.textFaint,fontFamily:C.sans,marginBottom:"3px"}}>Haupteinkommen</div>
                <NumInput value={profil.bruttoMonat} onChange={set("bruttoMonat")}/>
              </div>
              <div>
                <div style={{fontSize:"9px",color:C.textFaint,fontFamily:C.sans,marginBottom:"3px"}}>Nebeneinnahmen</div>
                <NumInput value={profil.gewerbeMonat} onChange={set("gewerbeMonat")} step={50} color={C.teal}/>
              </div>
            </section>

            <HR/>

            <section>
              <SL>Lebenssituation</SL>
              <div style={{display:"flex",flexDirection:"column",gap:"9px"}}>
                <Toggle label="Verheiratet / Partner" value={profil.verheiratet} onChange={set("verheiratet")}/>
                {profil.verheiratet&&<Toggle label="Partner Riester" value={profil.partnerRiester} onChange={set("partnerRiester")} color={C.blue}/>}
                <Stepper label="Kinder" value={profil.kinder} onChange={set("kinder")}/>
                <Toggle label="Eigentum" value={profil.hatImmobilie} onChange={set("hatImmobilie")} color={C.green}/>
                {profil.hatImmobilie&&<>
                  <Toggle label="Selbst bewohnt" value={profil.immobilieSelbst} onChange={set("immobilieSelbst")} color={C.green}/>
                  <div>
                    <div style={{fontSize:"9px",color:C.textFaint,fontFamily:C.sans,marginBottom:"3px"}}>Restschuld</div>
                    <NumInput value={profil.restschuld} onChange={set("restschuld")} step={5000}/>
                  </div>
                </>}
              </div>
            </section>

            <HR/>

            <section>
              <SL>Vorsorge</SL>
              <div style={{display:"flex",flexDirection:"column",gap:"9px"}}>
                {r.g.riesterMoegl&&<>
                  <Toggle label="Riester-Vertrag" value={profil.hatRiester} onChange={set("hatRiester")}/>
                  {profil.hatRiester&&<div>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:"3px"}}>
                      <span style={{fontSize:"9px",color:C.textFaint,fontFamily:C.sans}}>Vertragsjahre</span>
                      <span style={{fontSize:"10px",color:C.gold,fontFamily:C.mono}}>{profil.jahreRiester}</span>
                    </div>
                    <input type="range" min="1" max={Math.max(1,profil.alter-18)} value={profil.jahreRiester} onChange={e=>set("jahreRiester")(+e.target.value)} style={{width:"100%",accentColor:C.gold,cursor:"pointer"}}/>
                  </div>}
                </>}
                <Toggle label="BU / DU-Versicherung" value={profil.hatBU} onChange={set("hatBU")} color={C.purple}/>
                <Toggle label="Inflation (2%)" value={profil.inflation} onChange={set("inflation")} color={C.textFaint}/>
              </div>
            </section>

            <HR/>

            <section>
              <SL>Ziel</SL>
              <div style={{fontSize:"9px",color:C.textFaint,fontFamily:C.sans,marginBottom:"4px"}}>Wunschrente / Monat</div>
              <NumInput value={profil.wunschrente} onChange={set("wunschrente")} step={100} color={C.green}/>
            </section>

            {/* Steuer */}
            <div style={{background:C.bg3,border:`1px solid ${C.border}`,borderTop:`2px solid ${C.goldDim}`,padding:"10px"}}>
              <SL tip="zvE">Steuer</SL>
              {[["zvE",fmtEur(r.zvE),"zvE"],["Grenzsteuersatz",r.gst+"%","gst"],["Steuervorteil/J.",r.hatRiester?fmtEur(r.steuerv):"—","steuerv"]].map(([k,v,tip],i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:i<2?`1px solid ${C.border}`:"none"}}>
                  <span style={{fontSize:"9px",color:C.textFaint,fontFamily:C.sans}}>{k}<Tip k={tip}/></span>
                  <span style={{fontSize:"9px",color:C.text,fontFamily:C.mono}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CONTENT */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>

          {/* TABS */}
          <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,background:C.bg,flexShrink:0,overflowX:"auto"}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{background:"none",border:"none",borderBottom:tab===t.id?`2px solid ${C.gold}`:"2px solid transparent",color:tab===t.id?C.text:C.textFaint,padding:"12px 16px 10px",cursor:"pointer",fontSize:"10px",fontFamily:C.sans,letterSpacing:"1.5px",textTransform:"uppercase",whiteSpace:"nowrap",transition:"color 0.15s"}}>
                {t.label}
              </button>
            ))}
          </div>

          <div style={{flex:1,overflowY:"auto",padding:"22px"}}>

            {/* ── DASHBOARD ── */}
            {tab==="dashboard"&&(
              <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>

                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"1px",background:C.border}}>
                  <KPI label="Gesamteinkommen" value={fmtEur(profil.bruttoMonat+profil.gewerbeMonat)+"/Mo."}/>
                  <KPI label="Staatl. Zulage/Jahr" value={r.hatRiester?fmtEur(r.zulage):r.g.istBeamter?"Pension":"Kein Riester"} color={C.gold} tip="zulage"/>
                  <KPI label="Steuervorteil/Jahr" value={r.hatRiester?fmtEur(r.steuerv):r.g.rurupSinnvoll?fmtEur(r.rurupSteuv):"—"} color={C.green} tip="steuerv"/>
                  <KPI label="Jahre bis Rente" value={r.restjahre} sub={r.frühAbzug>0?`Abzug: ${r.frühAbzug}%`:""} color={C.blue}/>
                </div>

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px"}}>
                  <Card accent={C.gold}>
                    <SL>Vorsorge-Profil</SL>
                    <ResponsiveContainer width="100%" height={185}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke={C.border2}/>
                        <PolarAngleAxis dataKey="subject" tick={{fill:C.textFaint,fontSize:9,fontFamily:C.sans}}/>
                        <Radar dataKey="A" stroke={C.gold} fill={C.gold} fillOpacity={0.1} strokeWidth={1.5}/>
                      </RadarChart>
                    </ResponsiveContainer>
                  </Card>

                  <Card>
                    <SL>Scores</SL>
                    <div style={{display:"flex",justifyContent:"space-around",marginBottom:"16px"}}>
                      <Ring value={r.foerderScore} label="Förderung" color={C.gold}/>
                      <Ring value={r.stabScore} label="Stabilität" color={C.green}/>
                      <Ring value={r.nutzenScore} label="Nutzen" color={C.blue}/>
                      <Ring value={100-r.risikoScore} label="Sicherheit" color={C.purple}/>
                    </div>
                    {r.hatRiester&&<>
                      <HR/>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
                        <div>
                          <div style={{fontSize:"8px",color:C.textFaint,fontFamily:C.sans,letterSpacing:"2px",marginBottom:"3px"}}>KAPITAL HEUTE</div>
                          <div style={{fontSize:"24px",color:C.gold,fontWeight:"300"}}>{fmtEur(r.kapHeute)}</div>
                          <div style={{fontSize:"9px",color:C.textFaint,fontFamily:C.sans}}>nach {r.jahreEing} Jahren</div>
                        </div>
                        {r.wohnMoegl&&<div style={{textAlign:"right"}}>
                          <div style={{fontSize:"8px",color:C.green,fontFamily:C.sans,letterSpacing:"1px",marginBottom:"2px"}}>WOHN-RIESTER</div>
                          <div style={{fontSize:"15px",color:C.green}}>{fmtEur(r.wohnHebel)}</div>
                        </div>}
                      </div>
                    </>}
                    {r.g.rurupSinnvoll&&<>
                      <HR/>
                      <div>
                        <div style={{fontSize:"8px",color:C.blue,fontFamily:C.sans,letterSpacing:"2px",marginBottom:"2px"}}>RÜRUP-STEUERVORTEIL/JAHR</div>
                        <div style={{fontSize:"20px",color:C.blue,fontWeight:"300"}}>{fmtEur(r.rurupSteuv)}</div>
                        <div style={{fontSize:"9px",color:C.textFaint,fontFamily:C.sans}}>bei {fmtEur(r.rurupBtg)} Beitrag</div>
                      </div>
                    </>}
                    {r.g.istBeamter&&<>
                      <HR/>
                      <div>
                        <div style={{fontSize:"8px",color:C.teal,fontFamily:C.sans,letterSpacing:"2px",marginBottom:"2px"}}>PENSIONSANSPRUCH</div>
                        <div style={{fontSize:"20px",color:C.teal,fontWeight:"300"}}>{fmtEur(r.pensionRente)}/Mo.</div>
                        <div style={{fontSize:"9px",color:C.textFaint,fontFamily:C.sans}}>Schätzung bei Rente mit {profil.fruehRente||67}</div>
                      </div>
                    </>}
                  </Card>
                </div>

                {/* Renten-Vorschau */}
                <Card>
                  <SL>Renten-Vorschau mit {profil.fruehRente||67} · Monatlich</SL>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"1px",background:C.border,marginBottom:"12px"}}>
                    {[
                      {label:r.g.istBeamter?"Pension":"Gesetzlich", val:r.g.istBeamter?fmtEur(r.pensionRente):fmtEur(r.gesetzRente), sub:r.g.istBeamter?"Schätzung":"Entgeltpunkte", color:C.blue},
                      {label:r.hatRiester?"Riester":r.g.rurupSinnvoll?"Rürup":"Kein Riester", val:r.hatRiester?fmtEur(r.riesterR):r.g.rurupSinnvoll?fmtEur(r.rurupSteuv/12):"—", sub:r.hatRiester?"ø 1,2% p.a.":r.g.rurupSinnvoll?"Steuervorteil/Mo.":"", color:C.gold},
                      {label:"AVD 2027", val:r.hatRiester?fmtEur(r.depotR):"—", sub:"5,5% p.a.", color:C.green},
                      {label:r.g.istTvoed?"VBL-Zusatz":"Mietersparnis", val:r.g.istTvoed?fmtEur(r.vblRente):r.mietErs?fmtEur(r.mietErs):"—", sub:r.g.istTvoed?"TVöD-Schätzung":"Bei Eigennutzung", color:C.teal},
                    ].map((item,i)=>(
                      <div key={i} style={{background:C.bg2,padding:"12px 11px"}}>
                        <div style={{fontSize:"8px",color:C.textFaint,fontFamily:C.sans,letterSpacing:"1.5px",marginBottom:"5px"}}>{item.label.toUpperCase()}</div>
                        <div style={{fontSize:"20px",color:item.color,fontWeight:"300"}}>{item.val}</div>
                        <div style={{fontSize:"8px",color:C.textFaint,fontFamily:C.sans,marginTop:"3px"}}>{item.sub}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{background:r.luecke>0?C.red+"0e":C.green+"0e",border:`1px solid ${r.luecke>0?C.red+"30":C.green+"30"}`,padding:"12px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div>
                      <div style={{fontSize:"8px",color:C.textFaint,fontFamily:C.sans,letterSpacing:"2px",marginBottom:"3px"}}>{r.luecke>0?"VERSORGUNGSLÜCKE":"ZIEL ERREICHBAR"}</div>
                      <div style={{fontSize:"19px",color:r.luecke>0?C.red:C.green,fontWeight:"300"}}>{r.luecke>0?`− ${fmtEur(r.luecke)}/Mo.`:`✓ ${fmtEur(profil.wunschrente)}/Mo.`}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:"8px",color:C.textFaint,fontFamily:C.sans,marginBottom:"2px"}}>WUNSCHRENTE</div>
                      <div style={{fontSize:"15px",color:C.text}}>{fmtEur(profil.wunschrente)}</div>
                    </div>
                  </div>
                  <div style={{fontSize:"8px",color:C.textFaint,fontFamily:C.sans,marginTop:"7px"}}>* Vereinfachte Schätzungen · Keine steuerlichen Abzüge in der Rentenphase berücksichtigt · Keine Anlageberatung</div>
                </Card>
              </div>
            )}

            {/* ── PROJEKTION ── */}
            {tab==="projektion"&&(
              <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
                <Card accent={C.gold}>
                  <SL>Kapitalentwicklung bis Rente mit {profil.fruehRente||67}</SL>
                  <div style={{fontSize:"9px",color:C.textFaint,fontFamily:C.sans,marginBottom:"14px"}}>Riester 1,2% · AVD 2027 5,5% · ETF 7,2%{profil.inflation?" · Inflationsbereinigt":""}</div>
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={r.proj}>
                      <defs>
                        {[[C.gold,"g1"],[C.green,"g2"],[C.blue,"g3"]].map(([col,id])=>(
                          <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={col} stopOpacity={0.16}/>
                            <stop offset="95%" stopColor={col} stopOpacity={0}/>
                          </linearGradient>
                        ))}
                      </defs>
                      <XAxis dataKey="alter" tick={{fill:C.textFaint,fontSize:9,fontFamily:C.sans}} axisLine={{stroke:C.border}} tickLine={false}/>
                      <YAxis tick={{fill:C.textFaint,fontSize:9,fontFamily:C.sans}} axisLine={false} tickLine={false} tickFormatter={fmtK}/>
                      <Tooltip content={<CTip/>}/>
                      {r.hatRiester&&<>
                        <Area type="monotone" dataKey="riester" stroke={C.gold} fill="url(#g1)" strokeWidth={1.5} name="Riester"/>
                        <Area type="monotone" dataKey="depot" stroke={C.green} fill="url(#g2)" strokeWidth={1.5} name="AVD 2027" strokeDasharray="5 3"/>
                      </>}
                      <Area type="monotone" dataKey="etf" stroke={C.blue} fill="url(#g3)" strokeWidth={1.5} name="ETF-Depot" strokeDasharray="2 2"/>
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px"}}>
                  <Card>
                    <SL tip="zulage">Zulagen / Jahr</SL>
                    <div style={{fontSize:"26px",color:C.gold,fontWeight:"300",marginBottom:"3px"}}>{fmtEur(r.zulage*r.restjahre)}</div>
                    <div style={{fontSize:"9px",color:C.textFaint,fontFamily:C.sans,marginBottom:"16px"}}>kumuliert · {fmtEur(r.zulage)}/J. × {r.restjahre} J.</div>
                    {[{label:"Grundzulage",val:r.hatRiester?175:0},{label:"Kinderzulagen",val:profil.kinder*300},{label:"Partner mittelbar",val:(profil.verheiratet&&profil.partnerRiester&&r.hatRiester)?175:0}].map((item,i)=>(
                      <div key={i} style={{marginBottom:"8px"}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:"3px"}}>
                          <span style={{fontSize:"10px",color:C.textSub,fontFamily:C.sans}}>{item.label}</span>
                          <span style={{fontSize:"10px",color:item.val>0?C.gold:C.textFaint,fontFamily:C.mono}}>{item.val} €</span>
                        </div>
                        <div style={{height:"2px",background:C.bg3,borderRadius:"2px"}}>
                          <div style={{height:"100%",width:`${(item.val/775)*100}%`,background:C.gold,borderRadius:"2px",transition:"width 0.4s"}}/>
                        </div>
                      </div>
                    ))}
                  </Card>

                  <Card>
                    <SL>Beitragsrechnung / Jahr</SL>
                    {[
                      {label:"Brutto-Eigenbeitrag",val:fmtEur(r.minEigen),color:C.text,tip:"zvE"},
                      {label:"− Steuervorteil",val:`− ${fmtEur(r.steuerv)}`,color:C.green,tip:"steuerv"},
                      {label:"Netto-Eigenbeitrag",val:fmtEur(r.effEigen),color:C.gold,tip:null},
                      {label:"Staatl. Zulage",val:fmtEur(r.zulage),color:C.blue,tip:"zulage"},
                      {label:"Gesamteinzahlung",val:fmtEur(r.gesamtBtg),color:C.text,tip:null},
                    ].map((item,i)=>(
                      <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:i<4?`1px solid ${C.border}`:"none",borderTop:i===4?`1px solid ${C.border2}`:"none"}}>
                        <span style={{fontSize:"10px",color:C.textSub,fontFamily:C.sans}}>{item.label}{item.tip&&<Tip k={item.tip}/>}</span>
                        <span style={{fontSize:"10px",color:item.color,fontFamily:C.mono}}>{item.val}</span>
                      </div>
                    ))}
                  </Card>
                </div>
              </div>
            )}

            {/* ── VERGLEICH ── */}
            {tab==="vergleich"&&(
              <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
                <Card>
                  <SL>Riester · AVD 2027 · ETF — Kapital mit {profil.fruehRente||67}</SL>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={vDaten} barCategoryGap="35%">
                      <XAxis dataKey="name" tick={{fill:C.textSub,fontSize:11,fontFamily:C.sans}} axisLine={{stroke:C.border}} tickLine={false}/>
                      <YAxis tick={{fill:C.textFaint,fontSize:9,fontFamily:C.sans}} axisLine={false} tickLine={false} tickFormatter={fmtK}/>
                      <Tooltip contentStyle={{background:C.bg2,border:`1px solid ${C.border2}`,fontFamily:C.sans,fontSize:11}} formatter={v=>[fmtEur(v),"Kapital"]}/>
                      <Bar dataKey="kapital" radius={[2,2,0,0]}>
                        {vDaten.map((e,i)=><Cell key={i} fill={e.color} opacity={0.82}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"1px",background:C.border}}>
                  {vDaten.map((item,i)=>(
                    <div key={i} style={{background:C.bg1,padding:"18px 14px",borderTop:`2px solid ${item.color}`}}>
                      <div style={{fontSize:"9px",color:C.textFaint,fontFamily:C.sans,letterSpacing:"2px",marginBottom:"9px"}}>{item.name}</div>
                      <div style={{fontSize:"24px",color:item.color,fontWeight:"300",marginBottom:"3px"}}>{fmtEur(item.kapital)}</div>
                      <div style={{fontSize:"10px",color:C.textSub,fontFamily:C.sans,marginBottom:"12px"}}>Kapital bei Rente</div>
                      <div style={{fontSize:"17px",color:C.text,fontWeight:"300",marginBottom:"2px"}}>{fmtEur(item.rente)}/Mo.</div>
                      <div style={{fontSize:"8px",color:C.textFaint,fontFamily:C.sans}}>Monatsrente (geschätzt)</div>
                      <HR/>
                      <div style={{fontSize:"9px",color:C.textFaint,fontFamily:C.sans,lineHeight:"1.6"}}>
                        {i===0&&"100% Garantie · Staatl. Zulage · Niedrige Rendite · Volle Nachversteuerung"}
                        {i===1&&"80–100% Garantie wählbar · Zulagen · ETF-Anlage · Start Jan 2027"}
                        {i===2&&"Keine Garantie · Keine Zulagen · Höchste Rendite · Kapitalertragsteuer"}
                      </div>
                    </div>
                  ))}
                </div>

                <Card accent={C.blue}>
                  <SL tip="avd">Altersvorsorgedepot 2027</SL>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1px",background:C.border}}>
                    {[["Start","01. Januar 2027"],["Förderung","50% bis 60 €/Mo. Eigenbeitrag"],["Max. Zulage/Jahr","540 €"],["Eigenbeitrag-Max","6.840 €/Jahr"],["Anlage","Aktien, Fonds, ETFs"],["Garantievarianten","100% · 80% · Keine"],["Bestandsverträge","Bestandsschutz garantiert"],["Wechsel","Ohne Zulagen-Rückzahlung"]].map(([k,v],i)=>(
                      <div key={i} style={{background:C.bg2,padding:"9px 12px",display:"flex",justifyContent:"space-between"}}>
                        <span style={{fontSize:"10px",color:C.textFaint,fontFamily:C.sans}}>{k}</span>
                        <span style={{fontSize:"10px",color:C.text,fontFamily:C.mono}}>{v}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* ── SZENARIEN ── */}
            {tab==="szenarien"&&(
              <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:"13px",color:C.text,marginBottom:"3px"}}>Was-wäre-wenn Simulator</div>
                    <div style={{fontSize:"10px",color:C.textFaint,fontFamily:C.sans}}>Verändere das Alternativszenario und vergleiche mit deiner aktuellen Lage</div>
                  </div>
                  <button onClick={startSz} style={{padding:"6px 12px",border:`1px solid ${C.gold}`,background:C.gold+"18",color:C.gold,cursor:"pointer",fontFamily:C.sans,fontSize:"9px",letterSpacing:"1px",borderRadius:"2px"}}>Zurücksetzen</button>
                </div>

                <Card>
                  <SL>Schnell-Szenarien</SL>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"5px"}}>
                    {[
                      {label:"👶 Kind in 2 J.",ch:{kinder:profil.kinder+1}},
                      {label:"💍 Heirat",ch:{verheiratet:true}},
                      {label:"👨‍👩‍👦 Heirat + Kind",ch:{verheiratet:true,kinder:Math.max(1,profil.kinder)}},
                      {label:"🏠 Selbst einziehen",ch:{hatImmobilie:true,immobilieSelbst:true}},
                      {label:"🛡 BU abschließen",ch:{hatBU:true}},
                      {label:"📈 Einkommen +50%",ch:{bruttoMonat:Math.round(profil.bruttoMonat*1.5)}},
                      {label:"✕ Riester kündigen",ch:{hatRiester:false}},
                      {label:"⏳ Frühpension 63",ch:{fruehRente:63}},
                      {label:"💰 Gewerbe ×3",ch:{gewerbeMonat:(profil.gewerbeMonat||400)*3}},
                    ].map((s,i)=>(
                      <button key={i} onClick={()=>setSzenario({...profil,...s.ch})} style={{padding:"9px 7px",border:`1px solid ${C.border2}`,background:C.bg2,color:C.textSub,cursor:"pointer",fontFamily:C.sans,fontSize:"10px",textAlign:"left",borderRadius:"2px",display:"flex",alignItems:"center",gap:"5px"}}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </Card>

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px"}}>
                  <Card accent={C.blue}>
                    <SL>Szenario anpassen</SL>
                    {szenario&&<div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                      <div>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:"3px"}}>
                          <span style={{fontSize:"10px",color:C.textSub,fontFamily:C.sans}}>Alter</span>
                          <span style={{fontSize:"11px",color:C.blue,fontFamily:C.mono}}>{szenario.alter}</span>
                        </div>
                        <input type="range" min="18" max="66" value={szenario.alter} onChange={e=>setS("alter")(+e.target.value)} style={{width:"100%",accentColor:C.blue,cursor:"pointer"}}/>
                      </div>
                      <div>
                        <div style={{fontSize:"9px",color:C.textFaint,fontFamily:C.sans,marginBottom:"3px"}}>Bruttoeinkommen</div>
                        <NumInput value={szenario.bruttoMonat} onChange={setS("bruttoMonat")} color={C.blue}/>
                      </div>
                      <Stepper label="Kinder" value={szenario.kinder} onChange={setS("kinder")}/>
                      <Toggle label="Verheiratet" value={szenario.verheiratet} onChange={setS("verheiratet")} color={C.blue}/>
                      {szenario.verheiratet&&<Toggle label="Partner Riester" value={szenario.partnerRiester} onChange={setS("partnerRiester")} color={C.blue}/>}
                      <Toggle label="Riester vorhanden" value={szenario.hatRiester} onChange={setS("hatRiester")} color={C.blue}/>
                      <Toggle label="Eigentum (Eigennutz)" value={szenario.immobilieSelbst} onChange={setS("immobilieSelbst")} color={C.blue}/>
                      <Toggle label="BU vorhanden" value={szenario.hatBU} onChange={setS("hatBU")} color={C.blue}/>
                    </div>}
                  </Card>

                  <Card>
                    <SL>Aktuell vs. Szenario</SL>
                    {rs&&<div style={{display:"flex",flexDirection:"column"}}>
                      {[
                        {label:"Zulage/Jahr",a:r.zulage,b:rs.zulage,fmt:fmtEur},
                        {label:"Steuervorteil/J",a:r.steuerv,b:rs.steuerv,fmt:fmtEur},
                        {label:"Kapital heute",a:r.kapHeute,b:rs.kapHeute,fmt:fmtEur},
                        {label:"Riester/Monat",a:r.riesterR,b:rs.riesterR,fmt:fmtEur},
                        {label:"Versorg.lücke",a:r.luecke,b:rs.luecke,fmt:fmtEur,inv:true},
                        {label:"Förderung-Score",a:r.foerderScore,b:rs.foerderScore,fmt:v=>v},
                        {label:"Sicherheit-Score",a:100-r.risikoScore,b:100-rs.risikoScore,fmt:v=>v},
                      ].map((item,i)=>{
                        const diff=item.b-item.a;
                        const better=item.inv?diff<0:diff>0;
                        return (
                          <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 66px 66px 50px",gap:"4px",alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${C.border}`}}>
                            <span style={{fontSize:"9px",color:C.textFaint,fontFamily:C.sans}}>{item.label}</span>
                            <span style={{fontSize:"9px",color:C.textSub,fontFamily:C.mono,textAlign:"right"}}>{item.fmt(item.a)}</span>
                            <span style={{fontSize:"9px",color:C.blue,fontFamily:C.mono,textAlign:"right"}}>{item.fmt(item.b)}</span>
                            <span style={{fontSize:"9px",color:diff===0?C.textFaint:better?C.green:C.red,fontFamily:C.mono,textAlign:"right"}}>{diff>0?"+":""}{item.fmt(diff)}</span>
                          </div>
                        );
                      })}
                      <div style={{display:"flex",justifyContent:"space-between",marginTop:"6px"}}>
                        <span style={{fontSize:"7px",color:C.textFaint,fontFamily:C.sans,letterSpacing:"1px"}}>AKTUELL</span>
                        <span style={{fontSize:"7px",color:C.blue,fontFamily:C.sans,letterSpacing:"1px"}}>SZENARIO</span>
                        <span style={{fontSize:"7px",color:C.textFaint,fontFamily:C.sans,letterSpacing:"1px"}}>DIFFERENZ</span>
                      </div>
                    </div>}
                  </Card>
                </div>

                <Card>
                  <SL>Profil-Vergleich — Gold: Aktuell · Blau: Szenario</SL>
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke={C.border2}/>
                      <PolarAngleAxis dataKey="subject" tick={{fill:C.textFaint,fontSize:9,fontFamily:C.sans}}/>
                      <Radar dataKey="A" stroke={C.gold} fill={C.gold} fillOpacity={0.1} strokeWidth={1.5}/>
                      {rs&&<Radar dataKey="B" stroke={C.blue} fill={C.blue} fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="4 2"/>}
                    </RadarChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            )}

            {/* ── EMPFEHLUNGEN ── */}
            {tab==="empfehlungen"&&(
              <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                <div style={{fontSize:"10px",color:C.textFaint,fontFamily:C.sans}}>
                  {r.empf.length} personalisierte Empfehlungen · {berufsLabel}
                </div>
                {r.empf.length===0&&<Card><div style={{color:C.textSub,fontFamily:C.sans,fontSize:"12px"}}>Profil gut aufgestellt — keine kritischen Handlungsempfehlungen.</div></Card>}
                {r.empf.map((e,i)=>{
                  const s=ES[e.typ];
                  return (
                    <div key={i} style={{background:C.bg1,border:`1px solid ${C.border}`,borderLeft:`3px solid ${s.color}`,padding:"14px 16px",display:"flex",gap:"12px",alignItems:"flex-start"}}>
                      <div style={{width:"22px",height:"22px",borderRadius:"50%",border:`1px solid ${s.color}`,color:s.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontFamily:C.sans,flexShrink:0}}>{s.icon}</div>
                      <div>
                        <div style={{fontSize:"12px",color:C.text,marginBottom:"4px"}}>{e.titel}</div>
                        <div style={{fontSize:"11px",color:C.textSub,fontFamily:C.sans,lineHeight:"1.65"}}>{e.text}</div>
                      </div>
                    </div>
                  );
                })}
                <div style={{background:C.bg2,border:`1px solid ${C.border}`,padding:"12px 14px",marginTop:"4px"}}>
                  <div style={{fontSize:"9px",color:C.textFaint,fontFamily:C.sans,lineHeight:"1.7"}}>
                    <strong style={{color:C.textSub}}>Rechtlicher Hinweis:</strong> Vereinfachte Schätzungen ohne Gewähr. Kein Ersatz für individuelle Beratung durch zugelassene Finanz- oder Steuerberater. Riester-Reform 2027: Stand April 2026, Bundesrat-Abstimmung ausstehend.
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
