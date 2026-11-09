import {Link,useSearchParams} from 'react-router-dom';
import {DEFAULT_SCAN_EVENT,workflowPath} from '../lib/workflow';
import { useMemo } from 'react';
import { Activity, BarChart3, ChartNoAxesCombined, GitBranch, Layers, Scan, Sparkles } from 'lucide-react';
import { useStore } from '../lib/store';
import { EChart, confidenceOption } from '../components/charts';
import { Badge } from '../components/ui';

export default function Whitebox() {
  const [params] = useSearchParams();
  const eventId = params.get('event') ?? DEFAULT_SCAN_EVENT;
  const event = useStore(s => s.events.find(event => event.id === eventId));
  const timeline = useMemo(
    () => confidenceOption([42, 55, 61, 78, 88, 92.7]),
    [],
  );

  return (
    <div className="page whitebox-page">
      <div className="flex-between" style={{ marginBottom: 16 }}>
        <div>
          <div className="page-title">AI 算法逻辑分析与白盒模型</div>
          <div className="page-sub">以锅炉散热器为例，拆解可复核的模型推理节点</div>
        </div>
        <span className="badge muted">模型演示 · 示例数据</span>
      </div>

      <div className="flow-grid model-grid">
        {/* 元数据日志 */}
        <div className="card">
          <div className="card-head">
            <Activity size={15} color="var(--color-primary)" />
            <span className="title">分析记录</span>
          </div>
          <dl className="model-metadata">
            <MetaRow k="记录时间（北京时间）" v="2024-05-21 14:02" />
            <MetaRow k="节点位置" v="A 区仓库 · 9 层 · 04 点位" />
            <MetaRow k="关联操作员" v="B 班组长" />
            <MetaRow k="近 24 小时记录" v="3 起事件" />
          </dl>
        </div>

        {/* 决策树 */}
        <div className="card">
          <div className="card-head">
            <GitBranch size={15} color="var(--color-primary)" />
            <span className="title">决策树推理</span>
          </div>
          <Tree />
        </div>

        {/* 置信度时间线 */}
        <div className="card">
          <div className="card-head">
            <BarChart3 size={15} color="var(--color-primary)" />
            <span className="title">置信度变化</span>
          </div>
          <EChart option={timeline} height={168} />
          <p className="small muted">第 1–6 步的置信度从 42% 升至 92.7%。</p>
        </div>
      </div>

      <div className="flow-grid model-evidence-grid mt-4">
        <div className="card">
          <div className="card-head">
            <Scan size={15} color="var(--color-primary)" />
            <span className="title">异常证据热力图</span>
          </div>
          <Heatmap label="异常样本得分 0.84" highlight />
        </div>
        <div className="card">
          <div className="card-head">
            <Layers size={15} color="var(--color-primary)" />
            <span className="title">标准基线热力图</span>
          </div>
          <Heatmap label="正常样本得分 0.12" />
        </div>
        <div className="card">
          <div className="card-head">
            <ChartNoAxesCombined size={15} color="var(--color-primary)" />
            <span className="title">影响预测</span>
          </div>
          <div className="model-impact">
            <div className="small muted">预计预防投入回报</div>
            <div className="model-impact-value tabular">14.2 倍</div>
            <div className="small muted">预计剩余使用寿命不足 54 小时</div>
          </div>
        </div>
      </div>

      {/* 结论与操作 */}
      <div className="card mt-4">
        <div className="card-head">
          <Sparkles size={15} color="var(--color-primary)" />
          <span className="title">AI 判定依据</span>
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
      <dt className="small muted">{k}</dt>
      <dd className="tabular">{v}</dd>
    </div>
  );
}

function Tree() {
  const nodes = [
    { name: '散热器信号', value: '0.927' },
    { name: '温度方差', value: '0.812' },
    { name: '模式匹配', value: '0.441' },
  ];
  return (
    <div className="model-tree">
      {nodes.map(({ name, value }) => (
        <div className="model-node" key={name}>
          <div className="small muted">{name}</div>
          <strong className="tabular">{value}</strong>
        </div>
      ))}
      <div className="model-node model-node-result">
        <div className="small">判定结果</div>
        <strong>命中部件疲劳</strong>
      </div>
    </div>
  );
}

function Heatmap({ label, highlight }: { label: string; highlight?: boolean }) {
  const cells = Array.from({ length: 12 * 8 });
  return (
    <div>
      <div className="small muted" style={{ marginBottom: 8 }}>
        {label}
      </div>
      <div className="model-heatmap" aria-hidden="true">
        {cells.map((_, i) => {
          const r = (i * 37) % 100;
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
