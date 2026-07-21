import { CircleHelp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export const GLOSSAR: Record<string, string> = {
  zulage:
    'Staatliche Zulage zum Riester-Vertrag: 175 € Grundzulage plus 300 € je Kind (ab Geburtsjahr 2008). Voraussetzung: Mindesteigenbeitrag.',
  eigenbeitrag:
    'Dein eigener Jahresbeitrag in den Riester-Vertrag. Mindestens 4 % des Vorjahres-Einkommens abzüglich Zulagen, mindestens 60 €.',
  beitragsfrei:
    'Vertrag bleibt bestehen, aber ohne neue Einzahlungen und ohne neue Zulagen. Das Kapital bleibt und verzinst sich weiter — meist langsam.',
  depot2027:
    'Geplantes Altersvorsorgedepot ab der Reform 2027: ETF-basiert, mit neuer Förderlogik. Wechsel vom alten Riester soll möglich sein.',
  wohnriester:
    'Riester-Kapital darf unter Bedingungen zur Finanzierung oder Entschuldung selbst genutzten Wohneigentums eingesetzt werden.',
  versorgungsluecke:
    'Differenz zwischen deiner Wunschrente und dem geschätzten Alterseinkommen (gesetzliche Rente/Pension plus Aufstockungen).',
  basisrente:
    'Dein Fundament im Alter: gesetzliche Rentenversicherung (GRV) oder Beamtenpension — bevor Riester oder andere Vorsorge dazukommt.',
  foerderverlust:
    'Bei Kündigung oft Rückzahlung von Zulagen und Steuervorteilen. Deshalb ist Auflösen in den meisten Fällen teuer.',
};

interface Props {
  term: keyof typeof GLOSSAR;
  children?: React.ReactNode;
  className?: string;
}

/** Inline-Begriff mit Tooltip-Erklärung */
export function GlossarTerm({ term, children, className }: Props) {
  const text = GLOSSAR[term];
  if (!text) return <>{children ?? term}</>;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="link"
            className={cn(
              'h-auto inline-flex items-center gap-0.5 p-0 text-inherit font-inherit underline-offset-2',
              'border-b border-dotted border-muted-foreground/50 rounded-none hover:no-underline',
              className,
            )}
            aria-label={`Erklärung: ${typeof children === 'string' ? children : term}`}
          >
            {children ?? term}
            <CircleHelp size={12} className="opacity-60" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={6} className="max-w-[260px] text-left leading-relaxed">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
