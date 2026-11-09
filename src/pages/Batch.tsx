import {useNavigate} from 'react-router-dom';
import {workflowPath} from '../lib/workflow';
import { useState } from 'react';
import { Search, CheckSquare, Square, Eye, X, Check } from 'lucide-react';
import { useStore } from '../lib/store';
import { Button, Badge, Empty } from '../components/ui';
import { Thumb } from '../components/thumb';
import { formatConfidence, isLowConfidence } from '../lib/selectors';

export default function Batch() {
  const navigate = useNavigate();
  const events = useStore((s) => s.events);
  const batchApprove = useStore((s) => s.batchApprove);
  const batchIgnore = useStore((s) => s.batchIgnore);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [q, setQ] = useState('');

  const pending = events.filter((e) => e.status === 'pending');
  const list = q ? pending.filter((e) => e.id.toLowerCase().includes(q.toLowerCase()) || e.title.includes(q)) : pending;

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };
  const allSelected = list.length > 0 && list.every((e) => selected.has(e.id));
  const hasStale = pending.some(event => selected.has(event.id) && event.stale);
  const hasCritical = [...selected].some((id) => events.find((e) => e.id === id)?.level === 'critical');

  return (
    <div className="page flow-page">
      {hasStale && <p className="flow-notice">选中含过期事件，请打开详情重新复核，或取消该项选择。</p>}
      <div className="flex-between" style={{ marginBottom: 12 }}>
        <div>
          <div className="page-title">批量审核工作台</div>
          <div className="page-sub">异常事件集中复核 · 批量批准 / 批量忽略</div>
        </div>
        <div className="small muted">
          待复核 <span className="tabular" style={{ color: 'var(--color-danger)', fontWeight: 700 }}>{pending.length}</span> 项
        </div>
      </div>

      <div className="flex gap-2" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
        <div className="search-wrap">
          <Search size={15} />
          <input className="input" placeholder="按 ID / 标题过滤" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="select">
          <option>全部等级</option>
          <option>极高危</option>
          <option>中危</option>
          <option>低危</option>
        </select>
        <select className="select">
          <option>全部区域</option>
          <option>A区</option>
          <option>B区</option>
          <option>C区</option>
          <option>D区</option>
        </select>
      </div>

      <div className="card table-scroll" tabIndex={0} role="region" aria-label="待复核事件表" style={{ flex: 1, padding: 0, marginBottom: 12 }}>
        {list.length === 0 ? (
          <Empty text="没有待复核事件" />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <button onClick={() => setSelected(allSelected ? new Set() : new Set(list.map((e) => e.id)))} style={{ color: 'var(--color-primary)' }}>
                    {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>
                </th>
                <th>事件</th>
                <th>风险等级</th>
                <th>置信度</th>
                <th>时间戳</th>
                <th className="right">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((e) => (
                <tr key={e.id} style={{ cursor: 'pointer' }} onClick={() => toggle(e.id)}>
                  <td>
                    <button onClick={(ev) => { ev.stopPropagation(); toggle(e.id); }} style={{ color: selected.has(e.id) ? 'var(--color-primary)' : 'var(--color-foreground-tertiary)' }}>
                      {selected.has(e.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <Thumb kind={e.screenshot} size="sm" />
                      <div>
                        <div className="mono small tertiary">{e.id}</div>
                        <div style={{ fontWeight: 500 }}>{e.title}</div>
                        <div className="small muted">{e.zone}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge level={e.level} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 60 }} className="progress-bar">
                        <i style={{ width: `${e.confidence * 100}%`, background: e.confidence >= 0.9 ? 'var(--color-danger)' : e.confidence >= 0.7 ? 'var(--color-warning)' : 'var(--color-info)' }} />
                      </div>
                      <span className="tabular small">{formatConfidence(e.confidence)}</span>
                      {isLowConfidence(e.confidence) && <span className="small" style={{ color: 'var(--color-warning)' }}>低置信</span>}
                    </div>
                  </td>
                  <td className="mono small tertiary">{e.at.replace('T', ' ').slice(0, 19)}</td>
                  <td className="right">
                    <Button size="sm" variant="ghost" aria-label={'查看证据 ' + e.id} title="查看证据"
                      onClick={event => {event.stopPropagation();navigate(workflowPath('/evidence',e.id));}}>
                      <Eye size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 底部批量操作 */}
      <div
        className="batch-toolbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: 12,
          background: 'var(--color-surface-high)',
          border: '1px solid var(--color-border)',
          borderRadius: 12,
        }}
      >
        <span className="small muted">
          已选择 <span className="tabular" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{selected.size}</span> 项
        </span>
        <Button size="sm" variant="ghost" disabled={!selected.size} onClick={() => setSelected(new Set())}>
          取消全选
        </Button>
        <span className="spacer" />
        <Button size="sm" variant="secondary" disabled={selected.size === 0 || hasStale} onClick={() => { batchIgnore([...selected]); setSelected(new Set()); }}>
          <X size={15} /> 批量标记误报
        </Button>
        <Button
          size="sm"
          variant="primary"
          disabled={selected.size === 0 || hasCritical || hasStale}
          title={hasCritical ? '含极高危事件，须逐条查看证据' : ''}
          onClick={() => { batchApprove([...selected]); setSelected(new Set()); }}
        >
          <Check size={15} /> 批量确认违规
        </Button>
      </div>
      {hasCritical && (
        <div className="small" style={{ color: 'var(--color-warning)', marginTop: 8 }}>
          所选含极高危事件，禁止批量确认；请到「证据核查」逐条裁决。
        </div>
      )}
    </div>
  );
}
