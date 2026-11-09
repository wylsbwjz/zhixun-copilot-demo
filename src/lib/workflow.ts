import type { EventItem, TaskItem, WorkOrder } from './types';

export const DEFAULT_SCAN_EVENT = 'TR-1209-ST';

export function workflowPath(path: string, eventId?: string, orderId?: string) {
  const params = new URLSearchParams();
  if (eventId) params.set('event', eventId);
  if (orderId) params.set('order', orderId);
  const query = params.toString();
  return query ? path + '?' + query : path;
}

export function linkedOrder(orders: WorkOrder[], eventId?: string | null, orderId?: string | null) {
  if (orderId) return orders.find(order => order.id === orderId && (!eventId || order.fromEventId === eventId));
  if (eventId) return orders.find(order => order.fromEventId === eventId);
}

export function taskEvent(events: EventItem[], task: TaskItem) {
  const zone = task.zone.split(/[\s·-]/)[0];
  return events.find(event => event.zone.split(/[\s·-]/)[0] === zone && event.status === 'pending')
    ?? events.find(event => event.zone.split(/[\s·-]/)[0] === zone);
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map(row => row.map(value => {
    const cell = String(value);
    const safe = /^[=+@\-]/.test(cell) ? "'" + cell : cell;
    return '"' + safe.replace(/"/g, '""') + '"';
  }).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob(['\ufeff', csv], {type: 'text/csv;charset=utf-8'}));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
