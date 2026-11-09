import { useStore } from './store';
import type { EventItem, WorkOrder, RiskLevel } from './types';

export const LEVEL_META: Record<RiskLevel, { label: string; fg: string; bg: string }> = {
  critical: { label: '极高危', fg: 'var(--color-danger)', bg: 'var(--color-danger-bg)' },
  moderate: { label: '中危', fg: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
  low: { label: '低危', fg: 'var(--color-info)', bg: 'var(--color-info-bg)' },
  resolved: { label: '已解决', fg: 'var(--color-success)', bg: 'var(--color-success-bg)' },
};

export const ORDER_STATUS_META: Record<WorkOrder['status'], { label: string; fg: string; bg: string }> = {
  to_dispatch: { label: '待派单', fg: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
  to_accept: { label: '待接单', fg: 'var(--color-info)', bg: 'var(--color-info-bg)' },
  processing: { label: '处理中', fg: 'var(--color-info)', bg: 'var(--color-info-bg)' },
  to_verify: { label: '待验收', fg: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
  closed: { label: '已关闭', fg: 'var(--color-success)', bg: 'var(--color-success-bg)' },
};

export function pendingEvents(events: EventItem[]) {
  return events.filter((e) => e.status === 'pending');
}

export function usePendingCount() {
  return useStore((s) => s.events.filter((e) => e.status === 'pending').length);
}

export function useConfirmedCount() {
  return useStore((s) => s.events.filter((e) => e.status === 'confirmed').length);
}

export function useIgnoredCount() {
  return useStore((s) => s.events.filter((e) => e.status === 'ignored').length);
}

export function useOrderCounts() {
  return useStore((s) => {
    const counts: Record<WorkOrder['status'], number> = {
      to_dispatch: 0,
      to_accept: 0,
      processing: 0,
      to_verify: 0,
      closed: 0,
    };
    for (const o of s.orders) counts[o.status]++;
    return counts;
  });
}

export function useCanUndo() {
  return useStore((s) => s.undoStack.length > 0);
}

export function formatConfidence(c: number) {
  return `${(c * 100).toFixed(1)}%`;
}

export function confidenceBand(c: number) {
  if (c >= 0.9) return { text: '高置信', color: 'var(--color-danger)' };
  if (c >= 0.7) return { text: '中置信', color: 'var(--color-warning)' };
  return { text: '低置信', color: 'var(--color-neutral)' };
}

export function isLowConfidence(c: number) {
  return c < 0.6;
}
