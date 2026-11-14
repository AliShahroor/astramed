import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import type { StatusId } from '../../types';

const STATUS: Record<StatusId, { label: string; cls: string; dot: string }> = {
  nominal: { label: 'Nominal', cls: 'text-ok border-ok/40', dot: 'bg-ok' },
  review: { label: 'Review', cls: 'text-warn border-warn/40', dot: 'bg-warn' },
  alert: { label: 'Alert', cls: 'text-bad border-bad/50', dot: 'bg-bad' },
  insufficient: { label: 'Insufficient data', cls: 'text-info border-info/40', dot: 'bg-info' },
};

export function StatusBadge({ status }: { status: StatusId }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[13px] font-medium ${s.cls}`}>
      <span className={`h-2 w-2 rounded-full ${s.dot}`} aria-hidden="true" />
      {s.label}
    </span>
  );
}

export function Tag({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'info' | 'warn' }) {
  const c = tone === 'info' ? 'text-info border-info/40' : tone === 'warn' ? 'text-warn border-warn/40' : 'text-fg2 border-line';
  return <span className={`inline-block rounded border px-1.5 py-0.5 text-[12px] ${c}`}>{children}</span>;
}

export function Dialog({ title, onClose, children, wide, side }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean; side?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const all = document.querySelectorAll('[role="dialog"]');
      if (all[all.length - 1] === ref.current) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [onClose]);
  return (
    <div className={`fixed inset-0 z-40 flex bg-black/60 ${side ? 'justify-end' : 'items-center justify-center p-4'}`} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        ref={ref} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}
        className={`flex max-h-full flex-col overflow-hidden border border-line bg-surface shadow-xl ${side ? 'h-full w-full max-w-[640px] border-y-0 border-r-0' : `w-full rounded-lg ${wide ? 'max-w-[720px]' : 'max-w-[480px]'}`}`}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="h2">{title}</h2>
          <button className="btn px-2" onClick={onClose} aria-label="Close dialog"><X size={16} aria-hidden="true" /></button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="py-5">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="h2">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}
