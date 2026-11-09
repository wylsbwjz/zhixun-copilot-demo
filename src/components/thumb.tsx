import type { ReactNode } from 'react';
import IndustrialArt from './IndustrialArt';
import {
  Flame,
  WifiOff,
  ShieldAlert,
  Gauge,
  Volume2,
  Droplets,
  AlertTriangle,
  PackageOpen,
} from 'lucide-react';

const THUMB_STYLES: Record<string, string> = {
  pipe: 'linear-gradient(135deg, #1d2d3e, #143e20)',
  sensor: 'linear-gradient(135deg, #1d2d3e, #00144a)',
  fire: 'linear-gradient(135deg, #382700, #490000)',
  intrusion: 'linear-gradient(135deg, #490000, #0b0f16)',
  pressure: 'linear-gradient(135deg, #382700, #1d232a)',
  noise: 'linear-gradient(135deg, #242e38, #1d232a)',
  leak: 'linear-gradient(135deg, #490000, #382700)',
  obstacle: 'linear-gradient(135deg, #382700, #242e38)',
};

const THUMB_ICONS: Record<string, ReactNode> = {
  pipe: <Gauge size={22} />,
  sensor: <WifiOff size={22} />,
  fire: <ShieldAlert size={22} />,
  intrusion: <ShieldAlert size={22} />,
  pressure: <Gauge size={22} />,
  noise: <Volume2 size={22} />,
  leak: <Droplets size={22} />,
  obstacle: <PackageOpen size={22} />,
};

export function Thumb({
  kind,
  size = 'md',
  children,
}: {
  kind: string;
  size?: 'sm' | 'md' | 'lg';
  children?: ReactNode;
}) {
  const dim = size === 'sm' ? 44 : size === 'lg' ? 200 : 68;
  const large = size === 'lg';
  const style = THUMB_STYLES[kind] ?? THUMB_STYLES.obstacle;
  return (
    <div
      className={large ? "scene-thumb scene-thumb-large" : "scene-thumb"}
      style={{
        width: large ? '100%' : dim,
        height: large ? '100%' : dim,
        flex: 'none',
        borderRadius: 8,
        background: style,
        display: 'grid',
        placeItems: 'center',
        color: 'var(--color-foreground-muted)',
        border: '1px solid var(--color-border)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <IndustrialArt kind={kind} />
      {!large && <span className="scene-thumb-icon">{THUMB_ICONS[kind] ?? <AlertTriangle size={22} />}</span>}
      {children}
    </div>
  );
}
