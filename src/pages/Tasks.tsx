import {useNavigate,useSearchParams} from 'react-router-dom';
import { useState } from 'react';
import { Map, Play, ChevronRight } from 'lucide-react';
import { useStore } from '../lib/store';
import { Button, Badge, Empty, ProgressBar } from '../components/ui';
import type { TaskStatus } from '../lib/types';

const STATUS_TABS: { key: TaskStatus | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'todo', label: '待接受' },
  { key: 'doing', label: '进行中' },
  { key: 'review', label: '待复核' },
  { key: 'done', label: '已完成' },
  { key: 'overdue', label: '已逾期' },
];

const ZONES = [
  { id: 'A', name: 'A区 组装线', x: 18, y: 22, danger: false },
  { id: 'B', name: 'B区 仓库', x: 42, y: 30, danger: false },
  { id: 'C', name: 'C区 危险品', x: 66, y: 22, danger: true },
  { id: 'D', name: 'D区 码头', x: 80, y: 46, danger: false },
  { id: '7A', name: '7A 冲压', x: 30, y: 64, danger: true },
  { id: '2B', name: '2B 仓储', x: 62, y: 70, danger: false },
];

export default function Tasks() {
  const navigate = useNavigate();
  const [params,setParams] = useSearchParams();
  const taskId = params.get('task');
  const markDone = useStore(s => s.markTaskResolved);
  const tasks = useStore((s) => s.tasks);
  const acceptTask = useStore((s) => s.acceptTask);
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const [zone, setZone] = useState<string>('all');

  const filtered = tasks.filter((t) => (!taskId || t.id === taskId) && (filter === 'all' ? true : t.status === filter) && (zone === 'all' || t.zone.split(/[\s·-]/)[0] === zone || t.zone.split(/[\s·-]/)[0] === zone + '区'));

  return (
    <div className="page">
      <div className="flex-between" style={{ marginBottom: 12 }}>
        <div>
          <div className="page-title">任务大厅</div>
          <div className="page-sub">2D 路线图高亮待巡检区域 · 紧急待办优先触达高危区域</div>
        </div>
      </div>

      <div className="flex gap-2" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            className={`nav-item ${filter === t.key ? 'active' : ''}`}
            style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, color: filter === t.key ? 'var(--color-primary)' : 'var(--color-foreground-muted)', background: filter === t.key ? 'var(--color-selected)' : 'transparent' }}
            onClick={() => {setFilter(t.key);setParams({});}}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flow-grid tasks-grid">
        {/* 路线图 */}
        <div className="card">
          <div className="card-head">
            <Map size={15} color="var(--color-primary)" />
            <span className="title">区域路线图</span>
          </div>
          <svg viewBox="0 0 100 86" style={{ width: '100%', borderRadius: 10, background: 'var(--color-surface)' }}>
            {/* 路径 */}
            <polyline
              points="18,22 42,30 66,22 80,46 62,70 30,64 18,22"
              fill="none"
              stroke="var(--color-border-strong)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            {ZONES.map((z) => (
              <g key={z.id} role="button" tabIndex={0} aria-label={z.name} aria-pressed={zone === z.id} onKeyDown={e => {if (e.key === 'Enter' || e.key === ' ') {e.preventDefault();setParams({});setZone(zone === z.id ? 'all' : z.id);}}} onClick={() => {setParams({});setZone(zone === z.id ? 'all' : z.id);}} style={{ cursor: 'pointer' }}>
                <circle cx={z.x} cy={z.y} r="7" fill={z.danger ? 'var(--color-danger-bg)' : 'var(--color-surface-soft)'} stroke={z.danger ? 'var(--color-danger)' : 'var(--color-border-strong)'} strokeWidth="1.5" className={z.danger ? 'node' : ''} style={z.danger ? { animation: 'pulse 2s ease-in-out infinite' } : undefined} />
                <text x={z.x} y={z.y + 3} textAnchor="middle" fontSize="6" fill="var(--color-foreground)">{z.id}</text>
                <text x={z.x} y={z.y + 14} textAnchor="middle" fontSize="5" fill="var(--color-foreground-muted)">{z.name}</text>
              </g>
            ))}
          </svg>
          <div className="small muted mt-2">
            点击区域节点筛选任务 · 红色脉冲为高危区域
          </div>
        </div>

        {/* 任务列表 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.length === 0 ? (
            <Empty text="没有符合条件的任务" />
          ) : (
            filtered.map((t) => (
              <div key={t.id} className="card" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex gap-2" style={{ marginBottom: 6, alignItems: 'center' }}>
                    <Badge level={t.status === 'overdue' ? 'critical' : t.status === 'done' ? 'resolved' : t.status === 'doing' ? 'moderate' : 'low'}>
                      {t.status === 'todo' ? '待接受' : t.status === 'doing' ? '进行中' : t.status === 'review' ? '待复核' : t.status === 'done' ? '已完成' : '已逾期'}
                    </Badge>
                    <span className="badge" style={{ color: 'var(--color-foreground-muted)', background: 'var(--color-surface-high)' }}>
                      {t.type === 'daily' ? '日常巡检' : t.type === 'special' ? '专项检查' : '夜间巡检'}
                    </span>
                  </div>
                  <div style={{ fontWeight: 600 }}>{t.title}</div>
                  <div className="small muted mt-2">
                    {t.zone} · 检查项 {t.itemCount} · 负责人 {t.owner}
                  </div>
                  <div style={{ marginTop: 8, maxWidth: 260 }}>
                    <ProgressBar value={t.progress} color={t.status === 'overdue' ? 'var(--color-danger)' : 'var(--color-primary)'} />
                  </div>
                </div>
                <div className="small muted" style={{ textAlign: 'right', flex: 'none' }}>
                  <div className="mono">{t.plannedAt.slice(5, 16).replace('T', ' ')}</div>
                </div>
                {t.status === 'todo' ? (
                  <Button variant="primary" onClick={() => {acceptTask(t.id);navigate('/ar?task='+encodeURIComponent(t.id));}}>
                    <Play size={15} /> 接单
                  </Button>
                ) : t.status === 'doing' ? (
                  <Button onClick={() => navigate('/ar?task='+encodeURIComponent(t.id))}>
                    <ChevronRight size={15} /> 继续巡检
                  </Button>
                ) : t.status === 'review' ? <Button onClick={() => markDone(t.id)}>确认任务复核完成</Button> : null}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
