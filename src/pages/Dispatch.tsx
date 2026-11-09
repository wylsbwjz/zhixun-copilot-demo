import {useNavigate} from 'react-router-dom';
import {workflowPath} from '../lib/workflow';
import { useState } from 'react';
import { Activity, BrainCircuit, Thermometer, Droplets, Search, Zap } from 'lucide-react';
import SceneView from '../components/SceneView';
import { Button, Badge } from '../components/ui';
import { useStore } from '../lib/store';
export default function Dispatch() {
  const navigate = useNavigate();
  const events = useStore(state => state.events);
  const recordAction = useStore(state => state.recordAction);
  const [query,setQuery] = useState('');
  const filtered = events.filter(event => [event.id,event.title,event.zone].some(value =>
    value.toLowerCase().includes(query.trim().toLowerCase())));
  const site = useStore((s) => s.site);
  const toast = useStore((s) => s.toast);
  const [handling, setHandling] = useState(false);

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="flex-between" style={{ marginBottom: 12 }}>
        <div>
          <div className="page-title">全域态势调度中心</div>
          <div className="page-sub">实时预警流 + 深度逻辑诊断 + AI 智能决策</div>
        </div>
        <div className="small muted mono">最后更新 14:02:44 UTC</div>
      </div>

      <div className="flow-grid dispatch-grid">
        {/* 左 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto' }}>
          <div className="card">
            <div className="card-head">
              <span className="title">环境诊断参数</span>
            </div>
            <div className="flex gap-3">
              <Param icon={<Thermometer size={16} />} label="当前温度" value="24.5°C" />
              <Param icon={<Droplets size={16} />} label="当前湿度" value="42%" />
            </div>
          </div>
          <div className="card" style={{ flex: 1, overflow: 'auto' }}>
            <div className="card-head">
              <span className="title">实时高危预警流</span>
              <span className="badge" style={{ color: 'var(--color-danger)', background: 'var(--color-danger-bg)' }}>
                {filtered.filter(event => event.status === 'pending').length}
              </span>
            </div>
            <div className="search-wrap" style={{ width: '100%', marginBottom: 10 }}>
              <Search size={14} />
              <input className="input" style={{ width: '100%' }} aria-label="筛选预警" placeholder="按编号、标题或区域过滤" value={query} onChange={e => setQuery(e.target.value)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {!filtered.length && <p className="muted">没有匹配的预警</p>}
              {filtered.map((a) => (
                <button key={a.id} className="dispatch-event" onClick={() => navigate(workflowPath('/evidence',a.id))} style={{ padding: 10, borderRadius: 8, background: 'var(--color-surface-high)', borderLeft: `3px solid ${a.level === 'critical' ? 'var(--color-danger)' : a.level === 'moderate' ? 'var(--color-warning)' : a.level === 'low' ? 'var(--color-info)' : 'var(--color-success)'}` }}>
                  <div className="flex-between">
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{a.title}</span>
                    <span className="mono small tertiary">{a.at.slice(11,16)}</span>
                  </div>
                  <div className="small muted">{a.id} · {a.zone}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 中 */}
        <SceneView label="厂区调度示意">
          <div className="ar-box warn" style={{ left: '52%', top: '34%', width: '22%', height: '30%' }} />
          <div className="ar-tag critical dispatch-scene-alert">
            <div className="t-label" style={{ color: 'var(--color-danger)' }}>
              检测到异常 B-12区 · 温度突增
            </div>
            <div className="t-conf">传感器 ID: 0092-AX</div>
          </div>
          <div className="node warn" style={{ left: '58%', top: '40%' }} />
        </SceneView>

        {/* 右 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto' }}>
          <div className="card">
            <div className="card-head">
              <BrainCircuit size={15} color="var(--color-primary)" />
              <span className="title">深度逻辑诊断</span>
              <span className="sub">分析样例 09</span>
            </div>
            <div className="flex-between small" style={{ marginBottom: 6 }}>
              <span className="muted">置信度评分</span>
              <span className="tabular" style={{ color: 'var(--color-success)', fontWeight: 700 }}>0.992</span>
            </div>
            <div className="progress-bar">
              <i style={{ width: '99.2%', background: 'var(--color-success)' }} />
            </div>
          </div>
          <div className="card">
            <div className="card-head">
              <Activity size={15} color="var(--color-primary)" />
              <span className="title">置信度的核心作用</span>
            </div>
            <p className="small muted" style={{ lineHeight: 1.7 }}>
              置信度披露让识别结果可复核：高置信度自动上浮，低置信度交由人工确认，避免「黑盒告警」引发警报疲劳。
            </p>
          </div>
          <div className="card" style={{ borderColor: 'var(--color-primary)' }}>
            <div className="card-head">
              <Zap size={15} color="var(--color-primary)" />
              <span className="title">AI 智能决策节点</span>
            </div>
            <p className="small muted" style={{ lineHeight: 1.7 }}>
              当前数据趋势显示，受持续热输出影响，<strong style={{ color: 'var(--color-foreground)' }}>B-12 区</strong>{' '}
              在未来 4 小时内的风险将增加 <strong style={{ color: 'var(--color-danger)' }}>12%</strong>。建议预先启动冷却循环。
            </p>
            <Button
              variant="primary"
              block
              className="mt-3"
              disabled={handling}
              onClick={() => {
                setHandling(true);
                recordAction('调度中心 · 已启动本地模拟处置');
                toast('已启动 AI 智能处置（模拟）', 'success');
                setTimeout(() => setHandling(false), 1800);
              }}
            >
              {handling ? '处置中…' : '启动 AI 智能处置'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Param({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ flex: 1, background: 'var(--color-surface-high)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
      <div style={{ color: 'var(--color-primary)', marginBottom: 4 }}>{icon}</div>
      <div className="small muted">{label}</div>
      <div className="tabular" style={{ fontWeight: 700, fontSize: 16 }}>{value}</div>
    </div>
  );
}
