import {workflowPath} from '../lib/workflow';
import Brand from './Brand';
import { useState, useEffect, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Bell,
  Search,
  Settings,
  Monitor,
  Tablet,
  Undo2,
  RotateCcw,
  HelpCircle,
  ListTodo,
  ScanLine,
  Eye,
  ClipboardList,
  BarChart3,
  Radio,
  GitBranch,
  Boxes,
  Sparkles,
  Shield,
  ShieldCheck,
  LayoutDashboard,
  Archive,
  X,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { usePendingCount, useCanUndo } from '../lib/selectors';
import { Button } from './ui';

const WORKSPACES = [
  { key: 'situation', label: '态势', to: '/overview', match: ['/overview', '/dispatch'] },
  { key: 'patrol', label: '巡检', to: '/workbench', match: ['/workbench', '/tasks', '/ar', '/evidence', '/batch'] },
  { key: 'rectify', label: '整改', to: '/orders', match: ['/orders', '/ipad/verify'] },
  { key: 'analysis', label: '分析', to: '/analytics', match: ['/analytics', '/whitebox'] },
];

const SIDE_BY_WORKSPACE: Record<string, { to: string; label: string; icon: any }[]> = {
  situation: [
    { to: '/overview', label: '全域大屏', icon: LayoutDashboard },
    { to: '/dispatch', label: '态势调度', icon: Radio },
  ],
  patrol: [
    { to: '/workbench', label: '监控工作台', icon: ClipboardList },
    { to: '/tasks', label: '任务大厅', icon: ListTodo },
    { to: '/ar', label: 'AR 扫描', icon: ScanLine },
    { to: '/evidence', label: '证据核查', icon: Eye },
    { to: '/batch', label: '批量审核', icon: Boxes },
  ],
  rectify: [
    { to: '/orders', label: '工单中心', icon: ClipboardList },
    { to: '/ipad/verify', label: '复核归档', icon: Archive },
  ],
  analysis: [
    { to: '/analytics', label: '统计分析', icon: BarChart3 },
    { to: '/whitebox', label: '白盒模型', icon: GitBranch },
  ],
};

const IPAD_NAV = [
  { to: '/overview', label: '态势', icon: LayoutDashboard },
  { to: '/workbench', label: '巡检', icon: ListTodo },
  { to: '/ipad', label: '复核', icon: Sparkles },
  { to: '/orders', label: '整改', icon: ClipboardList },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const deviceMode = useStore((s) => s.deviceMode);
  const toggleDevice = useStore((s) => s.toggleDevice);
  const undo = useStore((s) => s.undo);
  const reset = useStore((s) => s.reset);
  const site = useStore((s) => s.site);
  const toasts = useStore((s) => s.toasts);
  const dismissToast = useStore((s) => s.dismissToast);
  const triggerLowConfidence = useStore((s) => s.triggerLowConfidence);
  const triggerStale = useStore((s) => s.triggerStale);
  const triggerNoAssignee = useStore((s) => s.triggerNoAssignee);
  const pendingCount = usePendingCount();
  const canUndo = useCanUndo();
  const currentWorkspace = WORKSPACES.find((w) => w.match.includes(location.pathname)) ?? WORKSPACES[0];
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const switchDevice = (mode: 'pc' | 'ipad') => {
    toggleDevice(mode);
    navigate(mode === 'ipad' ? '/ipad' : '/overview');
  };

  const helpModal = helpOpen ? (
    <div className="overlay" onClick={() => setHelpOpen(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>演示说明 · 能力边界</h3>
        <div className="modal-body">
          <p>
            本 Demo 为<strong>纯前端交互原型</strong>：本地示例数据 + 确定性模拟 AI，不依赖后端。AR 扫描、3D
            厂区、紧急制动、自动派单均为<strong>交互概念演示</strong>，非真实能力。
          </p>
          <p className="mt-2">
            主线：态势感知 → 工作台 → AR 扫描 → 证据核查 → 确认违规 → 生成工单 → 工单流转 → 分析大盘 → 撤销。
          </p>
          <p className="mt-2 muted">所有事件、工单、人员、统计均为「示例数据」。</p>

          <div className="mt-4" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
            <div className="small muted" style={{ marginBottom: 8 }}>
              演示控制（复现异常状态）
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button size="sm" onClick={() => triggerLowConfidence()}>
                触发低置信度
              </Button>
              <Button size="sm" onClick={() => triggerStale()}>
                触发复核过期
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  triggerNoAssignee();
                  setHelpOpen(false);
                  navigate('/orders');
                }}
              >
                查看缺处理人工单
              </Button>
              <Button size="sm" variant="ghost" onClick={() => reset()}>
                重置演示
              </Button>
            </div>
          </div>
        </div>
        <div className="modal-actions">
          <Button onClick={() => setHelpOpen(false)}>关闭</Button>
        </div>
      </div>
    </div>
  ) : null;

  const searchModal = searchOpen ? <SearchPanel onClose={() => setSearchOpen(false)} /> : null;

  const toastLayer = (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />
      ))}
    </div>
  );

  if (location.pathname === '/') return <>{children}{toastLayer}</>;

  if (deviceMode === 'ipad') {
    return (
      <div className="ipad-shell">
        <div className="ipad-frame">
          <div className="ipad-screen">
            <div className="ipad-top">
              <Brand />
              <span className="spacer" />
              <button className="icon-btn" onClick={() => setHelpOpen(true)} aria-label="帮助">
                <HelpCircle size={17} />
              </button>
              <button
                className="icon-btn"
                onClick={undo}
                disabled={!canUndo}
                style={{ opacity: canUndo ? 1 : 0.4 }}
                aria-label="撤销"
              >
                <Undo2 size={17} />
              </button>
              <button className="icon-btn" onClick={reset} aria-label="重置">
                <RotateCcw size={16} />
              </button>
              <button className="icon-btn" onClick={() => switchDevice('pc')} aria-label="PC">
                <Monitor size={17} />
              </button>
            </div>
            <div className="ipad-main">{children}</div>
            <div className="ipad-bottom">
              {IPAD_NAV.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.to;
                return (
                  <button
                    key={item.to}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2,
                      color: active ? 'var(--color-primary)' : 'var(--color-foreground-muted)',
                      padding: '6px 0',
                      borderRadius: 8,
                      background: active ? 'var(--color-selected)' : 'transparent',
                    }}
                    onClick={() => navigate(item.to)}
                  >
                    <Icon size={20} />
                    <span style={{ fontSize: 11 }}>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        {helpModal}
        {searchModal}
        {toastLayer}
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="topbar">
        <Brand />
        <div className="topbar-nav">
          {WORKSPACES.map((w) => {
            const active = currentWorkspace.key === w.key;
            return (
              <button
                key={w.key}
                className={`nav-item ${active ? 'active' : ''}`}
                onClick={() => navigate(w.to)}
              >
                {w.label}
              </button>
            );
          })}
        </div>
        <div className="topbar-actions">
          <button className="icon-btn" onClick={() => setSearchOpen(true)} aria-label="搜索">
            <Search size={18} />
          </button>
          <button className="icon-btn" onClick={() => navigate('/batch')} aria-label="通知">
            <Bell size={18} />
            {pendingCount > 0 && <span className="dot">{pendingCount}</span>}
          </button>
          <button
            className="icon-btn"
            title={canUndo ? '撤销上一次操作' : '没有可撤销的操作'}
            onClick={undo}
            disabled={!canUndo}
            style={{ opacity: canUndo ? 1 : 0.4 }}
            aria-label="撤销"
          >
            <Undo2 size={18} />
          </button>
          <button className="icon-btn" title="重置演示" onClick={reset} aria-label="重置">
            <RotateCcw size={17} />
          </button>
          <button className="icon-btn" title="演示说明" onClick={() => setHelpOpen(true)} aria-label="帮助">
            <HelpCircle size={18} />
          </button>
          <button className="icon-btn" title="切换 iPad 形态" onClick={() => switchDevice('ipad')} aria-label="iPad">
            <Tablet size={18} />
          </button>
          <div className="avatar">王</div>
        </div>
      </div>

      <div className="contextbar">
        <Shield size={16} color="var(--color-primary)" />
        <span className="ctx-title">{site.name}</span>
        <div className="ctx-meta">
          <span>
            全厂安全评分{' '}
            <span className="tabular" style={{ color: 'var(--color-success)' }}>
              {site.safetyScore}/100
            </span>
          </span>
          <span>
            活跃异常 <span className="tabular" style={{ color: 'var(--color-danger)' }}>{site.activeAnomalies}</span>
          </span>
          <span className="ok">● 系统在线</span>
        </div>
        <span className="spacer" />
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tasks')}>
          示例项目
        </button>
      </div>

      <div className="app-body">
        <nav className="sidenav">
          <div className="user">
            <div className="avatar" style={{ flex: 'none' }}>
              王
            </div>
            <div className="user-text">
              <div className="name">一线操作员</div>
              <div className="role">班号 NA-北区</div>
            </div>
          </div>
          <div className="nav-group-label">{currentWorkspace.label}工作区</div>
          {SIDE_BY_WORKSPACE[currentWorkspace.key].map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <button
                key={item.to}
                className={`sidenav-item ${active ? 'active' : ''}`}
                onClick={() => navigate(item.to)}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </button>
            );
          })}
          <div className="sidenav-bottom">
            <Button variant="primary" block className="scan-btn" onClick={() => navigate('/ar')}>
              <ScanLine size={16} /> 启动扫描
            </Button>
            <button className="sidenav-item" onClick={() => navigate('/about')}>
              <ShieldCheck size={17} />
              <span>关于 / 能力边界</span>
            </button>
            <button className="sidenav-item">
              <span>登出</span>
            </button>
          </div>
        </nav>
        <main className="main">{children}</main>
      </div>

      <div className="statusbar">
        <span className="status-dot" />
        <span>实时流: 运行中</span>
        <span>
          活跃节点 <span className="tabular">{site.activeNodes}</span>
        </span>
        <span>延迟 12ms | 丢包 0.00%</span>
        <span className="spacer" />
        <span className="tertiary">示例数据 · 模拟 AI 流程</span>
      </div>

      {helpModal}
      {searchModal}
      {toastLayer}
    </div>
  );
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('');
  const events = useStore((s) => s.events);
  const orders = useStore((s) => s.orders);
  const tasks = useStore((s) => s.tasks);
  const navigate = useNavigate();
  const kw = q.trim().toLowerCase();

  const evHits = kw
    ? events.filter((e) => e.id.toLowerCase().includes(kw) || e.title.includes(q) || e.zone.includes(q)).slice(0, 5)
    : [];
  const orHits = kw ? orders.filter((o) => o.id.toLowerCase().includes(kw) || o.title.includes(q)).slice(0, 5) : [];
  const tkHits = kw ? tasks.filter((t) => t.id.toLowerCase().includes(kw) || t.title.includes(q)).slice(0, 5) : [];

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 'min(600px, 92vw)' }}>
        <div className="flex-between" style={{ marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>全局搜索</h3>
          <button className="icon-btn" onClick={onClose} aria-label="关闭">
            <X size={16} />
          </button>
        </div>
        <div className="search-wrap" style={{ width: '100%', marginBottom: 12 }}>
          <Search size={16} />
          <input
            className="input"
            style={{ width: '100%' }}
            placeholder="搜索事件 / 工单 / 任务…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
          />
        </div>
        {kw && (
          <div style={{ maxHeight: 320, overflow: 'auto' }}>
            {evHits.length === 0 && orHits.length === 0 && tkHits.length === 0 && (
              <div className="empty" style={{ padding: 24 }}>
                <div>没有匹配「{q}」的结果</div>
              </div>
            )}
            {evHits.map((e) => (
              <button
                key={e.id}
                className="sidenav-item"
                style={{ width: '100%', textAlign: 'left' }}
                onClick={() => {
                  navigate(workflowPath('/evidence', e.id));
                  onClose();
                }}
              >
                <Eye size={15} />
                <span>
                  {e.id} · {e.title}
                </span>
              </button>
            ))}
            {orHits.map((o) => (
              <button
                key={o.id}
                className="sidenav-item"
                style={{ width: '100%', textAlign: 'left' }}
                onClick={() => {
                  navigate(workflowPath('/orders', o.fromEventId, o.id));
                  onClose();
                }}
              >
                <ClipboardList size={15} />
                <span>
                  {o.id} · {o.title}
                </span>
              </button>
            ))}
            {tkHits.map((t) => (
              <button
                key={t.id}
                className="sidenav-item"
                style={{ width: '100%', textAlign: 'left' }}
                onClick={() => {
                  navigate('/tasks?task=' + encodeURIComponent(t.id));
                  onClose();
                }}
              >
                <ListTodo size={15} />
                <span>
                  {t.id} · {t.title}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: { id: string; text: string; kind: string };
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);
  return (
    <div className={`toast ${toast.kind}`}>
      <span className="spacer">{toast.text}</span>
      <button onClick={() => onDismiss(toast.id)} style={{ color: 'var(--color-foreground-muted)' }} aria-label="关闭">
        <X size={14} />
      </button>
    </div>
  );
}
