import {Link} from 'react-router-dom';
import {ArrowRight} from 'lucide-react';
import {BrandMark} from '../components/Brand';
import {useStore} from '../lib/store';
import {DEFAULT_SCAN_EVENT, linkedOrder, workflowPath} from '../lib/workflow';

export default function Welcome() {
  const {events, orders, selectedEventId} = useStore();
  const selected = events.find(event => event.id === selectedEventId);
  const order = linkedOrder(orders, selected?.id);
  const resume = selected && ((selected.recorded && selected.status === 'pending') ||
    (order && order.status !== 'closed'));
  const next = resume && selected ? (order
    ? workflowPath(order.status === 'to_verify' ? '/ipad/verify' : '/orders', selected.id, order.id)
    : workflowPath('/evidence', selected.id)) : undefined;
  const sample = events.find(event => event.id === DEFAULT_SCAN_EVENT && event.status === 'pending')
    ?? events.find(event => event.status === 'pending');
  return <div className="welcome">
    <div className="welcome-light" aria-hidden="true"/>
    <main className="welcome-main">
      <div className="welcome-mark"><BrandMark size={176}/></div>
      <h1>智巡</h1>
      <p className="welcome-description">面向工业现场的安全巡检与整改协作演示。</p>
      <div className="welcome-actions">
        <Link className="btn btn-primary" to={next ?? (sample ? workflowPath('/ar', sample.id) : '/orders')}>
          {resume ? '继续上次巡检' : sample ? '开始巡检演示' : '查看已处理工单'}<ArrowRight size={16} aria-hidden="true"/>
        </Link>
        <Link className="btn btn-ghost" to="/overview">查看态势大屏</Link>
      </div>
      {resume && selected && <p className="welcome-resume">上次处理 {selected.id} · {selected.title}</p>}
    </main>
    <footer className="welcome-footer">示例数据 · 模拟 AI 与 AR · 本地保存</footer>
  </div>;
}
