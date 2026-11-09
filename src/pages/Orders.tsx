import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ClipboardList, UserPlus, Play, Send, CheckCheck, X, History, Archive } from 'lucide-react';
import { useStore } from '../lib/store';
import { Button, Badge, Modal, Empty } from '../components/ui';
import FlowGuide from '../components/FlowGuide';
import { ORDER_STATUS_META } from '../lib/selectors';
import type { OrderStatus, WorkOrder } from '../lib/types';
import {downloadCsv,linkedOrder,workflowPath} from '../lib/workflow';

const STATUS_TABS: { key: OrderStatus | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'to_dispatch', label: '待派单' },
  { key: 'to_accept', label: '待接单' },
  { key: 'processing', label: '处理中' },
  { key: 'to_verify', label: '待验收' },
  { key: 'closed', label: '已关闭' },
];

const ASSIGNEES = ['王建国', '李卫东', '赵海峰', '刘志强'];

export default function Orders() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const orders = useStore((s) => s.orders);
  const transitionOrder = useStore((s) => s.transitionOrder);
  const toast = useStore((s) => s.toast);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const eventId = params.get('event');
  const orderId = params.get('order');
  const event = useStore(state => state.events.find(event => event.id === eventId));
  const contextual = Boolean(eventId || orderId);
  const activeFilter = contextual ? (params.get('status') as OrderStatus | null) ?? 'all' : filter;
  const filtered = activeFilter === 'all' ? orders : orders.filter(order => order.status === activeFilter);
  const selected = contextual ? linkedOrder(orders, eventId, orderId) : filtered[0];
  const selectedId = selected?.id;
  const setSelectedEvent = useStore(state => state.setSelectedEvent);
  const setSelectedOrder = useStore(state => state.setSelectedOrder);
  useEffect(() => {
    if (!contextual || !selected) return;
    setSelectedOrder(selected.id);
    if (selected.fromEventId) setSelectedEvent(selected.fromEventId);
  }, [contextual, selected?.id, selected?.fromEventId, setSelectedEvent, setSelectedOrder]);
  const selectOrder = (order: WorkOrder) => setParams({order: order.id, ...(activeFilter === 'all' ? {} : {status: activeFilter})});
  const exportAudit = () => {
    const records = contextual && selected ? [selected] : filtered;
    downloadCsv('工单审计-示例.csv', [
      ['工单编号','关联事件','标题','区域','状态','处理人','整改结果','归档人','归档时间'],
      ...records.map(order => [order.id, order.fromEventId ?? '', order.title, order.zone,
        ORDER_STATUS_META[order.status].label, order.assignee ?? '', order.result ?? '',
        order.archivedBy ?? '', order.archivedAt ?? '']),
    ]);
    toast('已下载当前工单范围的审计报告（示例）','success');
  };

  // action modal state
  const [modal, setModal] = useState<null | { kind: 'dispatch' | 'submit' | 'reject'; order: WorkOrder }>(null);
  const [assignee, setAssignee] = useState('');
  const [result, setResult] = useState('');
  const [reason, setReason] = useState('');

  const openAction = (kind: 'dispatch' | 'submit' | 'reject', order: WorkOrder) => {
    setResult('');
    setReason('');
    setAssignee(order.assignee ?? '');
    setModal({ kind, order });
  };

  const doAction = () => {
    if (!modal) return;
    if (modal.kind === 'dispatch') transitionOrder(modal.order.id, 'dispatch', { assignee });
    if (modal.kind === 'submit') transitionOrder(modal.order.id, 'submit', { result });
    if (modal.kind === 'reject') transitionOrder(modal.order.id, 'reject', { reason });
    setModal(null);
  };

  return (
    <div className="page flow-page">
      <div className="flex-between" style={{ marginBottom: 12 }}>
        <div>
          <div className="page-title">异常管理与工单中心</div>
          <div className="page-sub">整改追踪 · 工单状态流转与影像留档</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="sm" variant="ghost" onClick={exportAudit} disabled={!filtered.length || (contextual && !selected)}>
            导出审计报告
          </Button>
        </div>
      </div>

      <FlowGuide eventId={selected?.fromEventId ?? event?.id} orderId={selected?.id}/>
      {contextual && !selected && <div className="card flow-gate">
        <h2>{event ? '此事件尚无关联工单' : '未找到指定工单'}</h2>
        <p className="muted">{event ? event.id + ' · ' + event.title : orderId ?? eventId}</p>
        <div className="flow-actions">
          {event && <Link className="btn btn-primary" to={workflowPath('/evidence', event.id)}>查看事件裁决</Link>}
          <Link className="btn btn-secondary" to="/orders">查看全部工单</Link>
        </div>
      </div>}

      <div className="flex gap-2" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            className={`nav-item ${activeFilter === t.key ? 'active' : ''}`}
            style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, color: activeFilter === t.key ? 'var(--color-primary)' : 'var(--color-foreground-muted)', background: activeFilter === t.key ? 'var(--color-selected)' : 'transparent' }}
            onClick={() => {setFilter(t.key);setParams({});}}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flow-grid orders-grid">
        {/* 列表 */}
        <div className="card" style={{ overflow: 'auto', padding: 0 }}>
          {filtered.length === 0 ? (
            <Empty text="当前状态下没有工单" />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>工单</th>
                  <th>区域</th>
                  <th>优先级</th>
                  <th>状态</th>
                  <th>处理人</th>
                  <th className="right">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const meta = ORDER_STATUS_META[o.status];
                  const active = selectedId === o.id;
                  return (
                    <tr key={o.id} onClick={() => selectOrder(o)} style={{ cursor: 'pointer', background: active ? 'var(--color-selected)' : undefined }}>
                      <td>
                        <div className="mono small tertiary">{o.id}</div>
                        <div style={{ fontWeight: 500 }}>{o.title}</div>
                      </td>
                      <td className="muted">{o.zone}</td>
                      <td>
                        <span className="badge" style={{ color: o.priority === 'high' ? 'var(--color-danger)' : o.priority === 'mid' ? 'var(--color-warning)' : 'var(--color-info)', background: 'var(--color-surface-high)' }}>
                          {o.priority === 'high' ? '高' : o.priority === 'mid' ? '中' : '低'}
                        </span>
                      </td>
                      <td>
                        <span className="badge" style={{ color: meta.fg, background: meta.bg }}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="muted">{o.assignee ?? '—'}</td>
                      <td className="right">
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); selectOrder(o); }}>
                          详情
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* 详情 + 操作 */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          {!selected ? (
            <Empty text="选择一个工单查看详情" />
          ) : (
            <>
              <div className="flex-between" style={{ marginBottom: 8 }}>
                <span className="mono tertiary small">{selected.id}</span>
                <Badge level="moderate">
                  <span style={{ color: ORDER_STATUS_META[selected.status].fg }}>{ORDER_STATUS_META[selected.status].label}</span>
                </Badge>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{selected.title}</div>
              <div className="small muted">{selected.zone}</div>
              <div className="small muted mt-2">
                当前操作身份：{selected.status === 'processing' || selected.status === 'to_accept' && selected.assignee
                  ? selected.assignee || '巡检员' : '安监主管'} · 演示
              </div>

              {selected.fromEventId && (
                <div className="small muted mt-2">
                  关联事件：<span className="mono">{selected.fromEventId}</span>
                </div>
              )}

              {selected.rejectReason && (
                <div className="badge" style={{ color: 'var(--color-danger)', background: 'var(--color-danger-bg)', marginTop: 8, alignSelf: 'flex-start' }}>
                  驳回原因：{selected.rejectReason}
                </div>
              )}

              {/* 状态操作 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
                {(selected.status === 'to_dispatch' || selected.status === 'to_accept' && !selected.assignee) && (
                  <Button variant="primary" block onClick={() => openAction('dispatch', selected)}>
                    <UserPlus size={16} /> {selected.status === 'to_dispatch' ? '派单' : '补派处理人'}
                  </Button>
                )}
                {selected.status === 'to_accept' && selected.assignee && (
                  <Button variant="primary" block onClick={() => transitionOrder(selected.id, 'accept')}>
                    <Play size={16} /> 接单
                  </Button>
                )}
                {selected.status === 'processing' && (
                  <Button variant="primary" block onClick={() => openAction('submit', selected)}>
                    <Send size={16} /> 提交验收
                  </Button>
                )}
                {selected.status === 'to_verify' && (
                  <>
                    <Button variant="primary" block onClick={() => transitionOrder(selected.id, 'approve')}>
                      <CheckCheck size={16} /> 验收通过
                    </Button>
                    <Button variant="secondary" block onClick={() => navigate(workflowPath('/ipad/verify', selected.fromEventId, selected.id))}>
                      <Archive size={16} /> 进入复核归档
                    </Button>
                    <Button variant="danger" block onClick={() => openAction('reject', selected)}>
                      <X size={16} /> 驳回
                    </Button>
                  </>
                )}
                {selected.status === 'closed' && <Link className="btn btn-secondary"
                  to={workflowPath('/ipad/verify', selected.fromEventId, selected.id)}>查看归档记录</Link>}
              </div>

              {/* 时间线 */}
              <div className="flex gap-2" style={{ marginTop: 18, marginBottom: 8 }}>
                <History size={14} color="var(--color-foreground-muted)" />
                <span style={{ fontSize: 13, fontWeight: 600 }}>流转时间线</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {selected.timeline.map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, position: 'relative', paddingBottom: 16 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)', flex: 'none', marginTop: 4 }} />
                    <div>
                      <div className="small" style={{ fontWeight: 500 }}>
                        {t.action}
                      </div>
                      <div className="small tertiary mono">
                        {t.at.slice(0, 16).replace('T', ' ')} · {t.actor}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 操作弹窗 */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.kind === 'dispatch' ? '派单' : modal?.kind === 'submit' ? '提交验收' : '驳回工单'}
        actions={
          <>
            <Button onClick={() => setModal(null)}>取消</Button>
            <Button variant="primary" onClick={doAction} disabled={modal?.kind === 'submit' ? !result.trim() : modal?.kind === 'reject' ? !reason.trim() : !assignee}>
              确认
            </Button>
          </>
        }
      >
        {modal?.kind === 'dispatch' && (
          <div>
            <label className="small muted" style={{ display: 'block', marginBottom: 6 }}>
              选择处理人
            </label>
            <select className="select" style={{ width: '100%' }} value={assignee} onChange={(e) => setAssignee(e.target.value)} aria-label="选择处理人">
              <option value="">请选择处理人</option>
              {ASSIGNEES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        )}
        {modal?.kind === 'submit' && (
          <div>
            <label className="small muted" style={{ display: 'block', marginBottom: 6 }}>
              处理结果
            </label>
            <textarea
              className="input"
              style={{ width: '100%', height: 80, padding: 10, resize: 'vertical' }}
              placeholder="描述整改措施与结果…"
              value={result}
              onChange={(e) => setResult(e.target.value)}
            />
          </div>
        )}
        {modal?.kind === 'reject' && (
          <div>
            <label className="small muted" style={{ display: 'block', marginBottom: 6 }}>
              驳回原因（必填）
            </label>
            <textarea
              className="input"
              style={{ width: '100%', height: 80, padding: 10, resize: 'vertical' }}
              placeholder="说明驳回原因…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
