import type { ReactNode, ButtonHTMLAttributes } from 'react';
import type { RiskLevel } from '../lib/types';
import { LEVEL_META } from '../lib/selectors';

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'touch';
  block?: boolean;
};

export function Button({ variant = 'secondary', size = 'md', block, className = '', children, ...rest }: BtnProps) {
  const cls = [
    'btn',
    `btn-${variant}`,
    size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : size === 'touch' ? 'btn-touch' : '',
    block ? 'btn-block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}

export function Badge({ level, children }: { level: RiskLevel; children?: ReactNode }) {
  const meta = LEVEL_META[level];
  return (
    <span className="badge" style={{ color: meta.fg, background: meta.bg }}>
      <i className="bdot" />
      {children ?? meta.label}
    </span>
  );
}

export function Tag({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <span className="badge" style={{ color: color ?? 'var(--color-foreground-muted)', background: 'var(--color-surface-high)' }}>
      {children}
    </span>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  return (
    <div className="progress-bar">
      <i style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color ?? 'var(--color-primary)' }} />
    </div>
  );
}

export function ProgressRing({
  value,
  size = 150,
  stroke = 12,
  color,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value));
  const off = c - (pct / 100) * c;
  const col = color ?? 'var(--color-primary)';
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-surface-high)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={col}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          flexDirection: 'column',
        }}
      >
        <div>
          <div style={{ fontSize: size * 0.2, fontWeight: 700, textAlign: 'center', lineHeight: 1 }} className="tabular">
            {pct}%
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-foreground-muted)', textAlign: 'center', marginTop: 4 }}>
            COMPLETION
          </div>
        </div>
      </div>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  actions,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3>{title}</h3>
        <div className="modal-body">{children}</div>
        {actions && <div className="modal-actions">{actions}</div>}
      </div>
    </div>
  );
}

export function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="flex-between" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{title}</div>
          <button className="icon-btn" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Kpi({
  label,
  value,
  delta,
  deltaDir,
  unit,
}: {
  label: string;
  value: ReactNode;
  delta?: string;
  deltaDir?: 'up' | 'down';
  unit?: string;
}) {
  return (
    <div className="kpi">
      <div className="label">{label}</div>
      <div className="value">
        {value}
        {unit && <span style={{ fontSize: 13, color: 'var(--color-foreground-muted)', marginLeft: 4 }}>{unit}</span>}
      </div>
      {delta && <div className={`delta ${deltaDir === 'down' ? 'down' : deltaDir === 'up' ? 'up' : ''}`}>{delta}</div>}
    </div>
  );
}

export function Empty({ icon, text }: { icon?: ReactNode; text: string }) {
  return (
    <div className="empty">
      <div className="icon">{icon ?? '○'}</div>
      <div>{text}</div>
    </div>
  );
}
