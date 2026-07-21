import { Menu, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';

const LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#app', label: 'App' },
] as const;

export function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="md:hidden size-9"
          aria-label="Menü öffnen"
        >
          <Menu size={16} aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px] sm:w-[320px]">
        <SheetHeader>
          <SheetTitle className="font-sans text-left">
            alter<span className="text-primary">li</span>
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 mt-6" aria-label="Mobile Navigation">
          {LINKS.map(({ href, label }) => (
            <SheetClose asChild key={href}>
              <a
                href={href}
                className="rounded-md px-3 py-3 text-sm text-foreground hover:bg-accent transition-colors"
              >
                {label}
              </a>
            </SheetClose>
          ))}
          <SheetClose asChild>
            <a
              href="#app"
              className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              App starten
              <ArrowRight size={14} aria-hidden="true" />
            </a>
          </SheetClose>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export default MobileNav;
