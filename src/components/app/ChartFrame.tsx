import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface Props {
  height?: number;
  className?: string;
  children: ReactNode;
  /** Remount chart when this changes (e.g. active tab) */
  remountKey?: string | number;
}

/**
 * Stable width/height host for Recharts ResponsiveContainer.
 * Avoids the classic 0-width / squeezed-chart bug in flex/tabs layouts.
 */
export function ChartFrame({ height = 240, className, children, remountKey }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) {
        setWidth(Math.floor(w));
        setReady(true);
      }
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    // Tabs often lay out after first paint
    const t = window.setTimeout(measure, 50);
    return () => {
      ro.disconnect();
      window.clearTimeout(t);
    };
  }, [remountKey]);

  return (
    <div
      ref={ref}
      className={cn('w-full min-w-0', className)}
      style={{ height, maxWidth: '100%' }}
    >
      {ready && width > 0 ? (
        <ResponsiveContainer key={`${remountKey ?? 'chart'}-${width}`} width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      ) : (
        <div className="h-full w-full animate-pulse rounded-md bg-muted/40" aria-hidden="true" />
      )}
    </div>
  );
}
