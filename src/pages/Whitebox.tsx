import {Link,useSearchParams} from 'react-router-dom';
import {DEFAULT_SCAN_EVENT,workflowPath} from '../lib/workflow';
import { useMemo } from 'react';
import { GitBranch, Activity } from 'lucide-react';
import { useStore } from '../lib/store';
import { EChart, barOption } from '../components/charts';
import { Button, Badge } from '../components/ui';

export default function Whitebox() {
  const [params] = useSearchParams();
  const eventId = params.get('event') ?? DEFAULT_SCAN_EVENT;
  const event = useStore(s => s.events.find(event => event.id === eventId));
  const timeline = useMemo(
    () => barOption(['T-5', 'T-4', 'T-3', 'T-2', 'T-1', 'T0'], [0.42, 0.55, 0.61, 0.78, 0.88, 0.927], '#4db1ff'),
    [],
  );

  return (
    <div className="page">
      <div className="flex-between" style={{ marginBottom: 16 }}>
        <div>
          <div className="page-title">AI 算法逻辑分析与白盒模型</div>
          <div className="page-sub">把黑盒告警拆解为可复核的推理节点</div>
        </div>
        <span className="mono small tertiary">状态: CONVEXITY 47%</span>
      </div>

      <div className="flow-grid model-grid">
        {/* 元数据日志 */}
        <div className="card">
          <div className="card-head">
            <Activity size={15} color="var(--color-primary)" />
            <span className="title">元数据日志</span>
          </div>
          <div className="small" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <MetaRow k="时间戳" v="2024-05-21 14:02 CST" />
            <MetaRow k="节点位置" v="WH-A / LEVEL-9 / Z-04" />
            <MetaRow k="关联操作员" v="Shift_B_Lead" />
            <MetaRow k="历史统计" v="3 Events (Last 24h)" />
          </div>
        </div>

        {/* 决策树 */}
        <div className="card">
          <div className="card-head">
            <GitBranch size={15} color="var(--color-primary)" />
            <span className="title">DECISION TREE LOGIC</span>
          </div>
          <Tree />
        </div>

        {/* 置信度时间线 */}
        <div className="card">
          <div className="card-head">
            <span className="title">CONFIDENCE SCORE TIMELINE</span>
          </div>
          <EChart option={timeline} height={180} />
          <div className="small muted mt-2">模型置信度随证据累积持续上升</div>
        </div>
      </div>

      <div className="flow-grid model-evidence-grid mt-4">
        <div className="card">
          <div className="card-head">
            <span className="title">VISUAL EVIDENCE: NEURAL HEATMAP</span>
          </div>
          <Heatmap label="MODEL 0.84" highlight />
        </div>
        <div className="card">
          <div className="card-head">
            <span className="title">BASELINE STANDARD</span>
          </div>
          <Heatmap label="NORMAL - 0.12" />
        </div>
        <div className="card">
          <div className="card-head">
            <span className="title">PREDICTED IMPACT</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700 }} className="tabular">
            Preventive ROI
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--color-success)' }} className="tabular">
            14.2x
          </div>
          <div className="small muted mt-2">剩余寿命 &lt; 54 小时</div>
        </div>
      </div>

      {/* 结论与操作 */}
      <div className="card mt-4">
        <div className="card-head">
          <span className="title">AI LOGIC REASONING</span>
        </div>
        <p className="small muted" style={{ lineHeight: 1.7 }}>
          多传感器融合显示 04 号锅炉散热器出现高频共振，热方差超过基线阈值，与「部件疲劳」模式高度匹配。建议立即停炉并执行同频共振物理检测。
        </p>
        <div className="flex gap-2 mt-3" style={{ flexWrap: 'wrap' }}>
          <Badge level="critical">严重</Badge>
          <span className="badge" style={{ color: 'var(--color-info)', background: 'var(--color-info-bg)' }}>
            01 · 立即停止 04 号锅炉当前高频共振
          </span>
          <span className="badge" style={{ color: 'var(--color-info)', background: 'var(--color-info-bg)' }}>
            02 · 执行深度同频共振物理检测
          </span>
        </div>
        <div className="flow-actions">
          <Link className="btn btn-secondary" to="/analytics">返回统计分析</Link>
          {event && <Link className="btn btn-primary" to={workflowPath('/evidence',event.id)}>查看事件证据 · {event.id}</Link>}
        </div>
      </div>
    </div>
  );
}

function MetaRow({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="tertiary small">{k}</div>
      <div className="mono" style={{ fontSize: 12.5 }}>{v}</div>
    </div>
  );
}

function Tree() {
  const nodes = [
    { name: 'RADIATOR', val: '0.927', left: '16%', top: '12%' },
    { name: 'THERMAL VARIANCE', val: '0.812', left: '42%', top: '12%' },
    { name: 'PATTERN MATCH', val: '0.441', left: '68%', top: '12%' },
    { name: 'COMPONENT_FATIGUE', val: 'HIT', left: '42%', top: '58%', result: true },
  ];
  return (
    <div style={{ position: 'relative', height: 220 }}>
      {/* connectors */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M28,22 L50,22" stroke="var(--color-border-strong)" strokeWidth="0.6" />
        <path d="M58,22 L80,22" stroke="var(--color-border-strong)" strokeWidth="0.6" />
        <path d="M50,30 L50,66" stroke="var(--color-primary)" strokeWidth="0.8" strokeDasharray="2 2" />
      </svg>
      {nodes.map((n) => (
        <div
          key={n.name}
          style={{
            position: 'absolute',
            left: n.left,
            top: n.top,
            transform: 'translateX(-50%)',
            background: n.result ? 'var(--color-danger-bg)' : 'var(--color-surface-high)',
            border: `1px solid ${n.result ? 'var(--color-danger)' : 'var(--color-border)'}`,
            borderRadius: 8,
            padding: '8px 10px',
            textAlign: 'center',
            minWidth: 110,
          }}
        >
          <div className="mono small" style={{ color: n.result ? 'var(--color-danger)' : 'var(--color-foreground-muted)' }}>
            {n.name}
          </div>
          <div className="tabular" style={{ fontSize: 15, fontWeight: 700, color: n.result ? 'var(--color-danger)' : 'var(--color-foreground)' }}>
            {n.val}
          </div>
        </div>
      ))}
    </div>
  );
}

function Heatmap({ label, highlight }: { label: string; highlight?: boolean }) {
  const cells = Array.from({ length: 12 * 8 });
  return (
    <div>
      <div className="small tertiary mono" style={{ marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3, height: 140 }}>
        {cells.map((_, i) => {
          const r = (i * 37) % 100;
          const hot = highlight ? r : 20;
          return (
            <div
              key={i}
              style={{
                borderRadius: 3,
                background: highlight
                  ? `rgba(250, 97, 97, ${0.08 + (r / 100) * 0.5})`
                  : `rgba(77, 177, 255, ${0.05 + (r / 100) * 0.15})`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
