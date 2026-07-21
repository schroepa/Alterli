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
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let cancelled = false;
    let tries = 0;

    const measure = () => {
      if (cancelled) return;
      const w = Math.floor(el.getBoundingClientRect().width);
      if (w > 0) {
        setWidth(w);
        return true;
      }
      return false;
    };

    const retry = () => {
      if (measure()) return;
      tries += 1;
      if (tries < 20) {
        requestAnimationFrame(retry);
      } else {
        // Last resort: never stay on empty skeleton forever
        const fallback = Math.floor(el.clientWidth) || el.parentElement?.clientWidth || 320;
        if (fallback > 0) setWidth(fallback);
      }
    };

    measure();
    const ro = new ResizeObserver(() => {
      measure();
    });
    ro.observe(el);

    const t0 = window.setTimeout(retry, 0);
    const t1 = window.setTimeout(retry, 50);
    const t2 = window.setTimeout(retry, 200);

    return () => {
      cancelled = true;
      ro.disconnect();
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [remountKey]);

  return (
    <div
      ref={ref}
      className={cn('w-full min-w-0', className)}
      style={{ height, maxWidth: '100%' }}
    >
      {width > 0 ? (
        <ResponsiveContainer key={`${remountKey ?? 'chart'}-${width}`} width={width} height={height}>
          {children as React.ReactElement}
        </ResponsiveContainer>
      ) : (
        <div className="h-full w-full animate-pulse rounded-md bg-muted/40" aria-hidden="true" />
      )}
    </div>
  );
}
