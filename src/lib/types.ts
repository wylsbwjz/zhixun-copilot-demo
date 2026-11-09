export type ID = string;

export type RiskLevel = 'critical' | 'moderate' | 'low' | 'resolved';
export type EventStatus = 'pending' | 'confirmed' | 'ignored';
export type OrderStatus =
  | 'to_dispatch'
  | 'to_accept'
  | 'processing'
  | 'to_verify'
  | 'closed';
export type DeviceMode = 'pc' | 'ipad';
export type Priority = 'high' | 'mid' | 'low';

export interface Site {
  id: ID;
  name: string;
  safetyScore: number;
  activeAnomalies: number;
  activeNodes: number;
  revision: number;
}

export interface ReviewLog {
  action: 'confirm' | 'ignore';
  actor: string;
  at: string;
}

export interface EventItem {
  id: ID;
  title: string;
  zone: string;
  scene: string;
  level: RiskLevel;
  confidence: number;
  at: string;
  status: EventStatus;
  screenshot: string; // CSS 渐变 key
  recorded?: boolean;
  stale?: boolean;
  reviewLog?: ReviewLog;
}

export interface TimelineEntry {
  at: string;
  actor: string;
  action: string;
}

export interface WorkOrder {
  id: ID;
  title: string;
  fromEventId?: ID;
  zone: string;
  priority: Priority;
  status: OrderStatus;
  assignee?: string;
  result?: string;
  rejectReason?: string;
  archivedAt?: string;
  archivedBy?: string;
  archiveEvidence?: string;
  timeline: TimelineEntry[];
}

export interface AlertItem {
  id: ID;
  level: RiskLevel;
  title: string;
  detail: string;
  at: string;
  status: 'pending' | 'processing' | 'resolved';
}

export type TaskStatus = 'todo' | 'doing' | 'review' | 'done' | 'overdue';

export interface TaskItem {
  id: ID;
  title: string;
  zone: string;
  type: 'daily' | 'special' | 'night';
  priority: Priority;
  plannedAt: string;
  itemCount: number;
  progress: number;
  status: TaskStatus;
  owner: string;
}

export interface WhiteBoxEvent {
  code: string;
  sense: { text: string; confidence: number; latencyMs: number };
  extract: {
    text: string;
    featureSet: string[];
    match: 'POSITIVE' | 'NEGATIVE';
  };
  judge: { text: string; rule: string; action: string; severity: string };
  evidence: {
    liveLabel: string;
    liveMeta: string[];
    standardLabel: string;
    standardMeta: string[];
  };
}

export interface Activity {
  id: ID;
  at: string;
  text: string;
}

export interface Toast {
  id: ID;
  text: string;
  kind: 'success' | 'info' | 'error';
}

export interface Snapshot {
  events: EventItem[];
  orders: WorkOrder[];
  alerts: AlertItem[];
  tasks: TaskItem[];
  site: Site;
  activity: Activity[];
}

export interface AppState {
  site: Site;
  events: EventItem[];
  orders: WorkOrder[];
  alerts: AlertItem[];
  tasks: TaskItem[];
  activity: Activity[];
  whiteBox: WhiteBoxEvent;
  deviceMode: DeviceMode;
  selectedEventId?: ID;
  selectedOrderId?: ID;
  undoStack: Snapshot[];
  toasts: Toast[];
}
