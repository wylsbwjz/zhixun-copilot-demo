import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AppState,
  Snapshot,
  DeviceMode,
  EventItem,
  WorkOrder,
  TaskItem,
  ID,
  Toast,
} from './types';
import {
  site as initialSite,
  events as initialEvents,
  orders as initialOrders,
  alerts as initialAlerts,
  tasks as initialTasks,
  whiteBox,
  initialActivity,
} from './mock';

let toastSeq = 0;
const genId = (p: string) => `${p}-${Date.now().toString(36)}-${(toastSeq++).toString(36)}`;

/** 统一演示时间轴（UTC+8 场景时间），避免 2023 / 2024 / 2026 混用。 */
const DEMO_TIME = '2024-05-21T15:42:00';
const demoNow = () => DEMO_TIME;

function nextOrderId(orders: WorkOrder[]): string {
  let max = 0;
  for (const o of orders) {
    const m = /GD-2024-(\d+)/.exec(o.id);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `GD-2024-${String(max + 1).padStart(4, '0')}`;
}

function snap(s: AppState): Snapshot {
  return {
    events: s.events.map((e) => ({ ...e })),
    orders: s.orders.map((o) => ({ ...o, timeline: o.timeline.map((t) => ({ ...t })) })),
    alerts: s.alerts.map((a) => ({ ...a })),
    tasks: s.tasks.map((t) => ({ ...t })),
    site: { ...s.site },
    activity: s.activity.map((a) => ({ ...a })),
  };
}

function pushUndo(s: AppState): AppState {
  return { ...s, undoStack: [...s.undoStack.slice(-19), snap(s)] };
}

interface StoreActions {
  confirmEvent: (eventId: ID, basisChecked?: boolean) => void;
  recordAction: (text: string) => void;
  ignoreEvent: (eventId: ID) => void;
  batchApprove: (ids: ID[]) => void;
  batchIgnore: (ids: ID[]) => void;
  transitionOrder: (
    orderId: ID,
    action: 'dispatch' | 'accept' | 'submit' | 'approve' | 'reject',
    payload?: { assignee?: string; result?: string; reason?: string },
  ) => void;
  markTaskResolved: (taskId: ID) => void;
  acceptTask: (taskId: ID) => void;
  resolveAlert: (alertId: ID) => void;
  toggleDevice: (mode: DeviceMode) => void;
  setSelectedEvent: (id?: ID) => void;
  setSelectedOrder: (id?: ID) => void;
  undo: () => void;
  reset: () => void;
  recordEvent: (eventId: ID) => void;
  recheckEvent: (eventId: ID) => void;
  triggerLowConfidence: () => void;
  triggerStale: () => void;
  triggerNoAssignee: () => void;
  toast: (text: string, kind?: Toast['kind']) => void;
  dismissToast: (id: ID) => void;
}

export type Store = AppState & StoreActions;

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      site: initialSite,
      events: initialEvents,
      orders: initialOrders,
      alerts: initialAlerts,
      tasks: initialTasks,
      activity: initialActivity,
      whiteBox,
      deviceMode: 'pc',
      selectedEventId: undefined,
      selectedOrderId: undefined,
      undoStack: [],
      toasts: [],

      toast: (text, kind = 'info') => {
        const id = genId('toast');
        set((s) => ({ toasts: [...s.toasts, { id, text, kind }] }));
      },
      dismissToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      confirmEvent: (eventId, basisChecked = false) =>
        set((s) => {
          const ev = s.events.find((e) => e.id === eventId);
          if (!ev || ev.status !== 'pending' || ev.stale || (ev.level === 'critical' && !basisChecked)) return s;
          const priorOrder = s.orders.find(order => order.fromEventId === eventId);
          const orderId = priorOrder?.id ?? nextOrderId(s.orders);
          const now = demoNow();
          const order: WorkOrder = {
            id: orderId,
            title: `${ev.title}整改`,
            fromEventId: ev.id,
            zone: ev.zone,
            priority: ev.level === 'critical' ? 'high' : ev.level === 'moderate' ? 'mid' : 'low',
            status: 'to_dispatch',
            timeline: [
              { at: now, actor: '巡检员', action: `确认违规，由事件 ${ev.id} 生成工单` },
            ],
          };
          const next = pushUndo(s);
          return {
            ...next,
            events: s.events.map((e) =>
              e.id === eventId
                ? { ...e, status: 'confirmed' as const, reviewLog: { action: 'confirm' as const, actor: '巡检员', at: now } }
                : e,
            ),
            orders: priorOrder ? s.orders : [order, ...s.orders],
            // 确认违规只减少“待复核”，不减少“活跃异常”（异常要等整改验收通过才消除）
            site: { ...s.site, revision: s.site.revision + 1 },
            activity: [{ id: genId('act'), at: now, text: `人工确认违规 ${ev.id}，生成工单 ${orderId}` }, ...s.activity],
            selectedEventId: eventId,
            toasts: [...s.toasts, { id: genId('toast'), text: `已确认违规 · 关联工单 ${orderId}`, kind: 'success' }],
          };
        }),

      ignoreEvent: (eventId) =>
        set((s) => {
          const ev = s.events.find((e) => e.id === eventId);
          if (!ev || ev.status !== 'pending' || ev.stale) return s;
          const now = demoNow();
          const next = pushUndo(s);
          return {
            ...next,
            events: s.events.map((e) =>
              e.id === eventId
                ? { ...e, status: 'ignored' as const, reviewLog: { action: 'ignore' as const, actor: '巡检员', at: now } }
                : e,
            ),
            site: { ...s.site, activeAnomalies: Math.max(0, s.site.activeAnomalies - 1) },
            activity: [{ id: genId('act'), at: now, text: `人工判定误报 ${ev.id}，已记录模型反馈` }, ...s.activity],
            toasts: [...s.toasts, { id: genId('toast'), text: `已判定误报，已保存本地复核记录`, kind: 'info' }],
          };
        }),

      batchApprove: (ids) =>
        set((s) => {
          const targets = s.events.filter((e) => ids.includes(e.id) && e.status === 'pending' && !e.stale && e.level !== 'critical');
          if (targets.length === 0) return s;
          const now = demoNow();
          // 批量工单编号连续
          let base = 0;
          for (const o of s.orders) {
            const m = /GD-2024-(\d+)/.exec(o.id);
            if (m) base = Math.max(base, parseInt(m[1], 10));
          }
          const finalOrders: WorkOrder[] = targets.filter(event => !s.orders.some(order => order.fromEventId === event.id)).map((ev, i) => ({
            id: `GD-2024-${String(base + 1 + i).padStart(4, '0')}`,
            title: `${ev.title}整改`,
            fromEventId: ev.id,
            zone: ev.zone,
            priority: ev.level === 'critical' ? 'high' : ev.level === 'moderate' ? 'mid' : 'low',
            status: 'to_dispatch' as const,
            timeline: [{ at: now, actor: '巡检员', action: `批量确认，由事件 ${ev.id} 生成工单` }],
          }));
          const next = pushUndo(s);
          return {
            ...next,
            events: s.events.map((e) =>
              targets.some(event => event.id === e.id)
                ? { ...e, status: 'confirmed' as const, reviewLog: { action: 'confirm' as const, actor: '巡检员', at: now } }
                : e,
            ),
            orders: [...finalOrders, ...s.orders],
            // 批量确认违规同样不减少活跃异常，等验收通过再消除
            site: { ...s.site, revision: s.site.revision + 1 },
            activity: [{ id: genId('act'), at: now, text: `批量确认 ${targets.length} 项，生成 ${finalOrders.length} 个工单` }, ...s.activity],
            toasts: [...s.toasts, { id: genId('toast'), text: `已批量批准 ${targets.length} 项`, kind: 'success' }],
          };
        }),

      batchIgnore: (ids) =>
        set((s) => {
          const targets = s.events.filter((e) => ids.includes(e.id) && e.status === 'pending' && !e.stale);
          if (targets.length === 0) return s;
          const now = demoNow();
          const next = pushUndo(s);
          return {
            ...next,
            events: s.events.map((e) =>
              ids.includes(e.id) && e.status === 'pending' && !e.stale
                ? { ...e, status: 'ignored' as const, reviewLog: { action: 'ignore' as const, actor: '巡检员', at: now } }
                : e,
            ),
            site: { ...s.site, activeAnomalies: Math.max(0, s.site.activeAnomalies - targets.length) },
            activity: [{ id: genId('act'), at: now, text: `批量忽略 ${targets.length} 项，记录误报反馈` }, ...s.activity],
            toasts: [...s.toasts, { id: genId('toast'), text: `已批量忽略 ${targets.length} 项`, kind: 'info' }],
          };
        }),

      transitionOrder: (orderId, action, payload = {}) =>
        set((s) => {
          const order = s.orders.find((o) => o.id === orderId);
          if (!order) return s;
          const now = demoNow();
          const actor = action === 'dispatch' || action === 'approve' || action === 'reject' ? '安监主管' : order.assignee || '巡检员';
          let patch: Partial<WorkOrder> = {};
          let log = '';
          switch (action) {
            case 'dispatch':
              if (!(order.status === 'to_dispatch' || order.status === 'to_accept' && !order.assignee) || !payload.assignee?.trim()) return s;
              patch = { status: 'to_accept', assignee: payload.assignee };
              log = `派单给 ${payload.assignee}`;
              break;
            case 'accept':
              if (order.status !== 'to_accept' || !order.assignee) return s;
              patch = { status: 'processing' };
              log = '接单，处理中';
              break;
            case 'submit':
              if (order.status !== 'processing' || !payload.result?.trim()) return s;
              patch = { status: 'to_verify', result: payload.result.trim() };
              log = `提交验收：${payload.result || ''}`;
              break;
            case 'approve':
              if (order.status !== 'to_verify') return s;
              patch = {
                status: 'closed',
                archivedAt: now,
                archivedBy: actor,
                archiveEvidence: `归档证据 · 现场快照 ${order.fromEventId ?? order.id}`,
              };
              log = '验收通过，工单关闭并归档';
              break;
            case 'reject':
              if (order.status !== 'to_verify' || !payload.reason?.trim()) return s;
              patch = { status: 'processing', rejectReason: payload.reason.trim() };
              log = `验收驳回：${payload.reason || ''}`;
              break;
            default:
              return s;
          }
          const next = pushUndo(s);
          return {
            ...next,
            orders: s.orders.map((o) =>
              o.id === orderId
                ? { ...o, ...patch, timeline: [...o.timeline, { at: now, actor, action: log }] }
                : o,
            ),
            site:
              action === 'approve'
                ? {
                    ...s.site,
                    activeAnomalies: Math.max(0, s.site.activeAnomalies - 1),
                    safetyScore: Math.min(100, s.site.safetyScore + 1),
                  }
                : s.site,
            activity: [{ id: genId('act'), at: now, text: `工单 ${orderId} ${log}` }, ...s.activity],
            toasts: [...s.toasts, { id: genId('toast'), text: `工单 ${orderId}：${log}`, kind: 'success' }],
          };
        }),

      markTaskResolved: (taskId) =>
        set((s) => {
          const t = s.tasks.find((x) => x.id === taskId);
          if (!t) return s;
          const next = pushUndo(s);
          return {
            ...next,
            tasks: s.tasks.map((x) => (x.id === taskId ? { ...x, status: 'done' as const, progress: 100 } : x)),
            toasts: [...s.toasts, { id: genId('toast'), text: '已标记为已解决', kind: 'success' }],
          };
        }),

      acceptTask: (taskId) =>
        set((s) => {
          const t = s.tasks.find((x) => x.id === taskId);
          if (!t || t.status !== 'todo') return s;
          return {
            ...pushUndo(s),
            tasks: s.tasks.map((x) => (x.id === taskId ? { ...x, status: 'doing' as const, owner: '一线操作员' } : x)),
            toasts: [...s.toasts, { id: genId('toast'), text: '已接单，进入执行', kind: 'success' }],
          };
        }),

      resolveAlert: (alertId) =>
        set((s) => ({
          ...s,
          alerts: s.alerts.map((a) => (a.id === alertId ? { ...a, status: 'resolved' as const } : a)),
        })),

      recordAction: (text) => set(state => ({
        ...pushUndo(state),
        activity: [{id: genId('act'), at: demoNow(), text}, ...state.activity],
      })),

      toggleDevice: (mode) => set((s) => ({ ...s, deviceMode: mode })),
      setSelectedEvent: (id) => set((s) => ({ ...s, selectedEventId: id })),
      setSelectedOrder: (id) => set((s) => ({ ...s, selectedOrderId: id })),

      undo: () =>
        set((s) => {
          const stack = [...s.undoStack];
          const last = stack.pop();
          if (!last) {
            return { ...s, toasts: [...s.toasts, { id: genId('toast'), text: '没有可撤销的操作', kind: 'info' }] };
          }
          return {
            ...s,
            ...last,
            undoStack: stack,
            selectedEventId: s.selectedEventId,
            selectedOrderId: last.orders.some(order => order.id === s.selectedOrderId) ? s.selectedOrderId : undefined,
            toasts: [...s.toasts, { id: genId('toast'), text: '已撤销上一次操作', kind: 'success' }],
          };
        }),

      reset: () =>
        set(() => ({
          site: { ...initialSite },
          events: initialEvents.map((e) => ({ ...e })),
          orders: initialOrders.map((o) => ({ ...o, timeline: o.timeline.map((t) => ({ ...t })) })),
          alerts: initialAlerts.map((a) => ({ ...a })),
          tasks: initialTasks.map((t) => ({ ...t })),
          activity: initialActivity.map((a) => ({ ...a })),
          whiteBox,
          deviceMode: 'pc',
          selectedEventId: undefined,
          selectedOrderId: undefined,
          undoStack: [],
          toasts: [{ id: genId('toast'), text: '演示数据已重置', kind: 'info' }],
        })),

      recordEvent: (eventId) =>
        set((s) => {
          const ev = s.events.find((e) => e.id === eventId);
          if (!ev || ev.recorded) return s;
          return {
            ...pushUndo(s),
            events: s.events.map((e) => (e.id === eventId ? { ...e, recorded: true } : e)),
            selectedEventId: eventId,
            activity: [{ id: genId('act'), at: demoNow(), text: `AR 记录事件 ${eventId}` }, ...s.activity],
            toasts: [...s.toasts, { id: genId('toast'), text: `已记录事件 ${eventId}`, kind: 'success' }],
          };
        }),

      recheckEvent: (eventId) =>
        set((s) => ({
          ...s,
          events: s.events.map((e) => (e.id === eventId ? { ...e, stale: false } : e)),
          activity: [{ id: genId('act'), at: demoNow(), text: `重新复核 ${eventId}，依据已刷新` }, ...s.activity],
          toasts: [...s.toasts, { id: genId('toast'), text: `已重新复核 ${eventId}`, kind: 'success' }],
        })),

      triggerLowConfidence: () =>
        set((s) => {
          const pending = s.events.filter((e) => e.status === 'pending');
          if (pending.length === 0) {
            return { ...s, toasts: [...s.toasts, { id: genId('toast'), text: '没有待复核事件，先重置演示', kind: 'info' }] };
          }
          const target = [...pending].sort((a, b) => b.confidence - a.confidence)[0];
          return {
            ...s,
            events: s.events.map((e) => (e.id === target.id ? { ...e, confidence: 0.45 } : e)),
            activity: [
              { id: genId('act'), at: demoNow(), text: `演示：将 ${target.id} 置信度下调为 45%` },
              ...s.activity,
            ],
            toasts: [...s.toasts, { id: genId('toast'), text: `已触发低置信度：${target.id}`, kind: 'info' }],
          };
        }),

      triggerStale: () =>
        set((s) => {
          const pending = s.events.filter((e) => e.status === 'pending' && !e.stale);
          if (pending.length === 0) {
            return { ...s, toasts: [...s.toasts, { id: genId('toast'), text: '没有可标记的待复核事件', kind: 'info' }] };
          }
          const target = pending[0];
          return {
            ...s,
            events: s.events.map((e) => (e.id === target.id ? { ...e, stale: true } : e)),
            activity: [
              { id: genId('act'), at: demoNow(), text: `演示：${target.id} 复核依据已变化（过期）` },
              ...s.activity,
            ],
            toasts: [...s.toasts, { id: genId('toast'), text: `已触发复核过期：${target.id}`, kind: 'info' }],
          };
        }),

      triggerNoAssignee: () =>
        set((s) => {
          const orderId = nextOrderId(s.orders);
          const now = demoNow();
          const order: WorkOrder = {
            id: orderId,
            title: '待派单示例工单',
            zone: 'B区-仓库',
            priority: 'mid',
            status: 'to_dispatch',
            timeline: [{ at: now, actor: '系统', action: '演示：创建缺处理人工单' }],
          };
          return {
            ...s,
            orders: [order, ...s.orders],
            activity: [{ id: genId('act'), at: now, text: `演示：创建缺处理人工单 ${orderId}` }, ...s.activity],
            toasts: [...s.toasts, { id: genId('toast'), text: `已生成缺处理人工单 ${orderId}`, kind: 'info' }],
          };
        }),
    }),
    {
      name: 'zhixun-copilot-demo',
      partialize: (s) => ({
        site: s.site,
        events: s.events,
        orders: s.orders,
        alerts: s.alerts,
        tasks: s.tasks,
        activity: s.activity,
        deviceMode: s.deviceMode,
        selectedEventId: s.selectedEventId,
        selectedOrderId: s.selectedOrderId,
      }),
    },
  ),
);

export type { TaskItem, EventItem, WorkOrder };
