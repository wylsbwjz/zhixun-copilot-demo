import {useEffect, useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {Archive, CheckCircle2} from 'lucide-react';
import {useStore} from '../lib/store';
import {Button} from '../components/ui';
import FlowGuide from '../components/FlowGuide';
import IndustrialArt from '../components/IndustrialArt';
import {ORDER_STATUS_META} from '../lib/selectors';
import {linkedOrder, workflowPath} from '../lib/workflow';
import type {WorkOrder} from '../lib/types';

export default function IpadVerify() {
  const [params, setParams] = useSearchParams();
  const orders = useStore(s => s.orders);
  const events = useStore(s => s.events);
  const eventId = params.get('event');
  const orderId = params.get('order');
  const explicit = Boolean(eventId || orderId);
  const ready = orders.filter(order => order.status === 'to_verify' || order.status === 'closed');
  const order = explicit ? linkedOrder(orders, eventId, orderId) : ready[0];
  const event = events.find(event => event.id === (order?.fromEventId ?? eventId));
  const setSelectedEvent = useStore(s => s.setSelectedEvent);
  const setSelectedOrder = useStore(s => s.setSelectedOrder);
  useEffect(() => {
    if (!explicit || !order) return;
    setSelectedOrder(order.id);
    if (order.fromEventId) setSelectedEvent(order.fromEventId);
  }, [explicit, order?.id, order?.fromEventId, setSelectedEvent, setSelectedOrder]);
  const canVerify = order?.status === 'to_verify' || order?.status === 'closed';
  return <div className="page flow-page">
    <div className="flex-between flow-title"><div className="page-title">复核归档</div>
      <Link className="btn btn-secondary" to={workflowPath('/orders', event?.id, order?.id)}>返回工单中心</Link></div>
    <FlowGuide eventId={event?.id} orderId={order?.id}/>
    {!explicit && ready.length > 0 && <label className="flow-order-picker">选择验收或归档工单
      <select className="select" value={order?.id ?? ''} onChange={e => setParams({order: e.target.value})}>
        {ready.map(item => <option key={item.id} value={item.id}>{item.id} · {item.title}</option>)}
      </select></label>}
    {!order || !canVerify ? <div className="card flow-gate">
      <h2>{order ? '工单尚未提交验收' : event ? '此事件尚无关联工单' : '没有找到可复核的工单'}</h2>
      <p className="muted">{order ? order.id + ' · ' + ORDER_STATUS_META[order.status].label : event?.id ?? '请从工单中心选择目标记录。'}</p>
      <div className="flow-actions">
        {order ? <Link className="btn btn-primary" to={workflowPath('/orders', order.fromEventId, order.id)}>继续工单整改</Link>
          : event ? <Link className="btn btn-primary" to={workflowPath('/evidence', event.id)}>查看事件裁决</Link>
          : <Link className="btn btn-primary" to="/orders">选择工单</Link>}
        {explicit && <Link className="btn btn-secondary" to="/ipad/verify">查看可验收工单</Link>}
      </div>
    </div> : <Verification key={order.id + order.status} order={order} kind={event?.screenshot ?? 'obstacle'}/>}
  </div>;
}

function Verification({order, kind}: {order: WorkOrder; kind: string}) {
  const advance = useStore(s => s.transitionOrder);
  const [reason, setReason] = useState('');
  return <div className="flow-grid verify-grid">
    <section className="card">
      <div className="card-head"><CheckCircle2 size={16}/><span className="title">现场核验证据 · 示意</span></div>
      <div className="verify-media-pair">
        <Frame label="整改前" kind={kind}/><Frame label="整改后示例" kind={kind} safe/>
      </div>
      <p className="muted mt-3">处理结果　{order.result || '历史示例未录入文字结果'}</p>
      {order.archiveEvidence && <p className="muted">归档依据　{order.archiveEvidence}</p>}
    </section>
    <section className="card">
      <h2>{order.id} · {ORDER_STATUS_META[order.status].label}</h2>
      <p>{order.title}{order.fromEventId && ' · ' + order.fromEventId}</p>
      <p className="muted">整改人　{order.assignee || '历史示例未记录'} · 当前验收身份　安监主管</p>
      {order.status === 'to_verify' ? <>
        <label className="flow-order-picker">驳回原因
          <textarea className="input" value={reason} onChange={e => setReason(e.target.value)} placeholder="驳回时必填"/>
        </label>
        <div className="flow-actions">
          <Button variant="danger" disabled={!reason.trim()} onClick={() => advance(order.id, 'reject', {reason})}>驳回整改</Button>
          <Button variant="primary" onClick={() => advance(order.id, 'approve')}><Archive size={16}/>一键关闭工单并归档</Button>
        </div>
      </> : <div className="mt-3">
        <p>已归档{order.archivedBy && ' · ' + order.archivedBy}{order.archivedAt && ' · ' + order.archivedAt.replace('T', ' ')}</p>
        <Link className="btn btn-primary" to={workflowPath('/orders', order.fromEventId, order.id)}>查看归档工单</Link>
      </div>}
      <ol className="verification-timeline">{order.timeline.map((item, index) =>
        <li key={index}>{item.action}<small>{item.actor} · {item.at.replace('T', ' ')}</small></li>)}</ol>
    </section>
  </div>;
}

function Frame({label, kind, safe = false}: {label: string; kind: string; safe?: boolean}) {
  return <figure className="verify-frame"><IndustrialArt kind={kind} safe={safe}/><figcaption>{label}</figcaption></figure>;
}
