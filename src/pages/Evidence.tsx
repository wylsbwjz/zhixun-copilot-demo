import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronDown, Sparkles, Scale, Check, X, RefreshCw, ClipboardList } from 'lucide-react';
import { useStore } from '../lib/store';
import { Button, Badge } from '../components/ui';
import { pendingEvents, formatConfidence, LEVEL_META } from '../lib/selectors';
import type { EventItem } from '../lib/types';
import IndustrialArt from '../components/IndustrialArt';
import FlowGuide from '../components/FlowGuide';
import { linkedOrder, workflowPath } from '../lib/workflow';

export default function Evidence() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const events = useStore((s) => s.events);
  const orders = useStore((s) => s.orders);
  const confirmEvent = useStore((s) => s.confirmEvent);
  const ignoreEvent = useStore((s) => s.ignoreEvent);
  const recheckEvent = useStore((s) => s.recheckEvent);
  const pending = pendingEvents(events);
  const paramEvent = params.get('event');
  const selected = paramEvent ? events.find(event => event.id === paramEvent) : pending[0];
  const order = linkedOrder(orders, selected?.id);
  const [checkedEvent, setCheckedEvent] = useState<string>();
  const basisChecked = selected?.id === checkedEvent;
  const setSelectedEvent = useStore(state => state.setSelectedEvent);
  useEffect(() => {
    setCheckedEvent(undefined);
    if (paramEvent && selected) setSelectedEvent(selected.id);
  }, [selected?.id, selected?.stale, paramEvent, setSelectedEvent]);

  const meta = selected ? LEVEL_META[selected.level] : LEVEL_META.low;
  const isCritical = selected?.level === 'critical';
  const isPending = selected?.status === 'pending';
  const canConfirm = !!selected && isPending && !selected.stale && (!isCritical || basisChecked);

  if (!selected) {
    return (
      <div className="page">
        <div className="empty" style={{ padding: 80 }}>
          <div className="icon">
            <Check size={24} />
          </div>
          <div>{paramEvent ? '找不到事件 ' + paramEvent : '没有待复核的事件'}</div>
          <Button variant="primary" onClick={() => navigate('/ar')} className="mt-3">
            去 AR 扫描
          </Button>
          {paramEvent && <Link className="btn btn-secondary" to="/evidence">打开待复核列表</Link>}
        </div>
      </div>
    );
  }

  return (
    <div className="page flow-page">
      <div className="flex-between" style={{ marginBottom: 14 }}>
        <div>
          <div className="page-title">AI 诊断与证据核查</div>
          <div className="page-sub">确认违规或驳回误报，人工保留最终裁决权</div>
        </div>
        <EventSelector
          events={selected && selected.status !== 'pending' ? [selected, ...pending] : pending}
          value={selected.id}
          onChange={(id) => {
            setParams({ event: id });
            setCheckedEvent(undefined);
          }}
        />
      </div>

      <FlowGuide eventId={selected.id} orderId={order?.id} />

      <div className="flow-grid evidence-grid">
        {/* 左：白盒逻辑 */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          <div className="card-head">
            <Sparkles size={15} color="var(--color-primary)" />
            <span className="title">AI 逻辑推演路径</span>
            <span className="sub mono">{selected.id}</span>
          </div>
          <Node
            step="01"
            name="初始检测"
            color="var(--color-info)"
            text={`区域 ${selected.zone} 监控点检测到异常信号（${selected.title}）。`}
            meta={[`置信度 ${formatConfidence(selected.confidence)}`, '分析耗时 12 毫秒']}
          />
          <Connector />
          <Node
            step="02"
            name="特征提取"
            color="var(--color-warning)"
            text="多层卷积网络扫描现场特征，与标准作业规范比对，检测到关键特征缺失或越界。"
            meta={['比对范围 · 安全与合规', '比对结果 · 未通过']}
          />
          <Connector />
          <Node
            step="03"
            name="风险判定"
            color="var(--color-danger)"
            text={`触发规章 {ISO-45001-S3}，判定为${meta.label}风险，建议人工复核并生成整改工单。`}
            meta={['建议处置 · 隔离区域或临时锁定门禁', '执行状态 · 等待安监主管授权', `风险等级 · ${meta.label}`]}
          />
          {selected.confidence < 0.6 && (
            <div className="badge" style={{ color: 'var(--color-warning)', background: 'var(--color-warning-bg)', marginTop: 8, alignSelf: 'flex-start' }}>
              低置信度 · 建议人工复核
            </div>
          )}
          {selected.stale && (
            <div className="badge" style={{ color: 'var(--color-danger)', background: 'var(--color-danger-bg)', marginTop: 8, alignSelf: 'flex-start' }}>
              依据已变化 · 请重新复核
            </div>
          )}
        </div>

        {/* 右：证据对比 */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14, overflow: 'auto' }}>
          <div className="card-head" style={{ marginBottom: 0 }}>
            <Scale size={15} color="var(--color-primary)" />
            <span className="title">证据对比与核对</span>
          </div>
          <div className="evidence-frames">
            <EvidenceFrame
              label="现场异常示意"
              tag="异常示意 #A01"
              tagColor="var(--color-danger)"
              kind={selected.screenshot}
              hasBox
              meta={[selected.title, `位置: ${selected.zone}`, `时间: ${selected.at.replace('T', ' ').slice(0, 19)}`]}
            />
            <EvidenceFrame
              label="整改参考示意"
              tag="整改参考 #REF-09"
              tagColor="var(--color-success)"
              kind={selected.screenshot}
              meta={['同视角展示目标状态', '以现场制度和实际证据为准']}
            />
          </div>
          <div className="small muted flow-actions">
            <span>
              置信度 <strong className="tabular">{formatConfidence(selected.confidence)}</strong>
            </span>
            <span>
              等级 <Badge level={selected.level} />
            </span>
            <span className="mono">{selected.at.slice(0, 16).replace('T', ' ')}</span>
          </div>
        </div>
      </div>

      {/* 裁决前置条件 */}
      {selected.stale && (
        <div
          className="flex-between"
          style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger)' }}
        >
          <span className="small" style={{ color: 'var(--color-danger)' }}>
            依据已变化，请重新复核后再裁决
          </span>
          <Button size="sm" variant="secondary" onClick={() => {setCheckedEvent(undefined);recheckEvent(selected.id);}}>
            <RefreshCw size={14} /> 重新复核
          </Button>
        </div>
      )}
      {isCritical && isPending && !selected.stale && (
        <label
          className="flex gap-2"
          style={{ marginTop: 12, alignItems: 'center', fontSize: 13, color: 'var(--color-foreground-muted)', cursor: 'pointer' }}
        >
          <input type="checkbox" checked={basisChecked} onChange={e => setCheckedEvent(e.target.checked ? selected.id : undefined)} />
          极高危事件：我已核对现场依据（画面标注 / 匹配条件 / 未知项）
        </label>
      )}

      {/* 底部裁决 */}
      <div className="flow-actions verdict-actions">
        <Button variant="secondary" size="lg" style={{ flex: 1 }} disabled={!isPending || !!selected.stale} onClick={() => ignoreEvent(selected.id)}>
          <X size={18} /> 驳回误报
        </Button>
        <Button variant="primary" size="lg" style={{ flex: 1 }} disabled={!canConfirm} onClick={() => confirmEvent(selected.id, basisChecked)}>
          <Check size={18} /> 确认违规
        </Button>
      </div>

      {/* 裁决后的下一步 */}
      {!isPending && (
        <div
          className="flex-between"
          style={{ marginTop: 12, padding: '12px 14px', borderRadius: 10, background: 'var(--color-surface-soft)', border: '1px solid var(--color-border)' }}
        >
          <span className="small muted">
            {selected.status === 'confirmed' ? '已确认违规' : '已判定误报'}
            {order ? ` · 已生成工单 ${order.id}` : ''}
          </span>
          {order && (
            <Button size="sm" variant="primary" onClick={() => navigate(workflowPath('/orders', selected.id, order.id))}>
              <ClipboardList size={14} /> 查看生成的工单
            </Button>
          )}
          {!order && selected.status === 'ignored' && <Link className="btn btn-secondary" to="/batch">继续复核其他事件</Link>}
        </div>
      )}
    </div>
  );
}

function EventSelector({
  events,
  value,
  onChange,
}: {
  events: EventItem[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <select aria-label="当前事件" className="select" value={value} onChange={(e) => onChange(e.target.value)} style={{ paddingRight: 30 }}>
        {events.map((e) => (
          <option key={e.id} value={e.id}>
            {e.id} · {e.title}
            {e.status !== 'pending' ? '（已裁决）' : ''}
          </option>
        ))}
      </select>
      <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: 11, pointerEvents: 'none', color: 'var(--color-foreground-muted)' }} />
    </div>
  );
}

function Node({ step, name, color, text, meta }: { step: string; name: string; color: string; text: string; meta: string[] }) {
  return (
    <div style={{ background: 'var(--color-surface-high)', borderRadius: 10, padding: 12, border: '1px solid var(--color-border)' }}>
      <div className="flex gap-2" style={{ marginBottom: 6, alignItems: 'center' }}>
        <span className="mono" style={{ fontSize: 11, color, fontWeight: 700 }}>
          {step}
        </span>
        <span style={{ fontWeight: 600, fontSize: 13 }}>{name}</span>
      </div>
      <p className="small muted" style={{ lineHeight: 1.6 }}>
        {text}
      </p>
      <div className="small muted" style={{ marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {meta.map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>
    </div>
  );
}

function Connector() {
  return (
    <div style={{ width: 2, height: 16, background: 'var(--color-border)', margin: '2px 0 2px 13px' }} />
  );
}

function EvidenceFrame({
  label,
  tag,
  tagColor,
  kind,
  hasBox,
  meta,
}: {
  label: string;
  tag: string;
  tagColor: string;
  kind: string;
  hasBox?: boolean;
  meta: string[];
}) {
  return (
    <div>
      <div
        style={{
          height: 160,
          borderRadius: 10,
          background: 'linear-gradient(135deg, #1d2d3e, #0b0f16)',
          border: '1px solid var(--color-border)',
          position: 'relative',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--color-foreground-muted)',
          overflow: 'hidden',
        }}
      >
        <IndustrialArt kind={kind} safe={!hasBox} />
        {hasBox && (
          <div style={{ position: 'absolute', left: '30%', top: '24%', width: '40%', height: '52%', border: `2px solid ${tagColor}`, borderRadius: 6, pointerEvents: 'none' }} />
        )}
        <div className="ar-tag" style={{ top: 8, left: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: tagColor }}>{tag}</span>
        </div>
      </div>
      <div className="small tertiary" style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ color: 'var(--color-foreground-muted)', fontWeight: 500 }}>{label}</span>
        {meta.map((m) => (
          <span key={m} className="mono">
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}
