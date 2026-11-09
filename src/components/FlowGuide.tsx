import { Check } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../lib/store';
import { linkedOrder, workflowPath } from '../lib/workflow';

const STEPS = [
  { label: '扫描发现', to: '/ar' },
  { label: '证据裁决', to: '/evidence' },
  { label: '派单整改', to: '/orders' },
  { label: '复核归档', to: '/ipad/verify' },
];

export default function FlowGuide({ eventId, orderId }: { eventId?: string; orderId?: string }) {
  const location = useLocation();
  const event = useStore(s => s.events.find(item => item.id === eventId));
  const order = useStore(s => linkedOrder(s.orders, eventId, orderId));
  if (!event && !order) return null;
  const done = [event?.recorded, event && event.status !== 'pending',
    order?.status === 'to_verify' || order?.status === 'closed', order?.status === 'closed'];
  return <nav className="flow-guide" aria-label="处理流程">
    <span className="flow-guide-id mono">{event?.id ?? order?.id}</span>
    {STEPS.map((step, index) => {
      const active = location.pathname === step.to;
      if (index < 2 && !event) {
        return <span key={step.to} className="step-disabled" title="这张存量工单未关联扫描事件">
          <span className="step-number">{index + 1}</span>{step.label}
        </span>;
      }
      const target = workflowPath(step.to, event?.id, index >= 2 ? order?.id : undefined);
      return <Link key={step.to} to={target} aria-current={active ? 'step' : undefined}
        className={'step' + (done[index] ? ' step-done' : '') + (active ? ' active' : '')}>
        <span className="step-number">{done[index] ? <Check size={13} aria-label="已完成"/> : index + 1}</span>
        <span>{step.label}</span>
      </Link>;
    })}
  </nav>;
}
