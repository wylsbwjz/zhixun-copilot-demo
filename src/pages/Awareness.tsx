import {useNavigate} from 'react-router-dom';
import {DEFAULT_SCAN_EVENT,workflowPath} from '../lib/workflow';
import { useState } from 'react';
import { AlertTriangle, Thermometer, Droplets, Wind, Activity, Radio, Zap } from 'lucide-react';
import { useStore } from '../lib/store';
import SceneView from '../components/SceneView';
import { Button, Badge, Modal } from '../components/ui';
import { LEVEL_META } from '../lib/selectors';

export default function Awareness() {
  const navigate = useNavigate();
  const event = useStore(s => s.events.find(event => event.id === DEFAULT_SCAN_EVENT));
  const recordAction = useStore(s => s.recordAction);
  const site = useStore((s) => s.site);
  const alerts = useStore((s) => s.alerts);
  const [reportOpen, setReportOpen] = useState(false);
  const [brakeOpen, setBrakeOpen] = useState(false);
  const [braked, setBraked] = useState(false);

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="flex-between" style={{ marginBottom: 16 }}>
        <div>
          <div className="page-title">全域安全态势感知</div>
          <div className="page-sub mono">SYSTEM NORMAL · OPS_RUNNING_24/7 · 大屏模式</div>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ textAlign: 'right' }}>
            <div className="small muted">FACTORY SAFETY SCORE</div>
            <div style={{ fontSize: 30, fontWeight: 700, color: 'var(--color-success)' }} className="tabular">
              {site.safetyScore}
              <span style={{ fontSize: 14, color: 'var(--color-foreground-muted)' }}>/100</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="small muted">ACTIVE ANOMALIES</div>
            <div style={{ fontSize: 30, fontWeight: 700, color: 'var(--color-danger)' }} className="tabular">
              {site.activeAnomalies}
            </div>
          </div>
        </div>
      </div>

      <div className="flow-grid overview-grid">
        {/* 左：实时指标 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card">
            <div className="card-head">
              <span className="title">REAL-TIME METRICS</span>
            </div>
            <MetricRow icon={<Thermometer size={16} />} label="温度" value="24.5°C" />
            <MetricRow icon={<Droplets size={16} />} label="湿度" value="52%" />
            <MetricRow icon={<Wind size={16} />} label="空气质量" value="EXCELLENT" ok />
          </div>
          <div className="card">
            <div className="card-head">
              <span className="title">NODE DISTRIBUTION</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700 }} className="tabular">
              {site.activeNodes.toLocaleString()}
            </div>
            <div className="small muted mt-2">活跃传感器节点</div>
          </div>
          <Button variant="danger" onClick={() => setBrakeOpen(true)}>
            <Zap size={16} /> 紧急制动
          </Button>
        </div>

        {/* 中：场景 */}
        <SceneView label="AUGMENTED REALITY · SITEGUARD COPILOT V2.0">
          <div className="ar-box" style={{ left: '56%', top: '20%', width: '22%', height: '34%' }}>
            <div className="ar-tag critical" style={{ right: -8, top: -8, transform: 'translateY(-100%)' }}>
              <div className="t-label" style={{ color: 'var(--color-danger)' }}>
                <AlertTriangle size={13} /> ZONE 4C ANOMALY DETECTED
              </div>
              <div className="t-conf">置信度 98.4% · 严重</div>
            </div>
          </div>
          <div className="ar-tag ok" style={{ left: '24%', top: '34%' }}>
            <div className="t-label" style={{ color: 'var(--color-success)' }}>
              压力阀 · 运行正常
            </div>
            <div className="t-conf">72°C · 正常</div>
          </div>
          <button className="ar-tag" style={{ right: 16, bottom: 20 }} onClick={() => setReportOpen(true)}>
            <div className="t-label">
              <Activity size={13} color="var(--color-primary)" /> 查看 AI 诊断报告
            </div>
          </button>
        </SceneView>

        {/* 右：告警流 */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="card-head">
            <span className="title">LIVE ALERT STREAM</span>
            <span className="right">
              <Button size="sm" variant="ghost" onClick={() => navigate('/dispatch')}>
                查看全部
              </Button>
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto' }}>
            {alerts.map((a) => {
              const meta = LEVEL_META[a.level];
              return (
                <div key={a.id} style={{ padding: 10, borderRadius: 8, background: 'var(--color-surface-high)', borderLeft: `3px solid ${meta.fg}` }}>
                  <div className="flex-between">
                    <Badge level={a.level} />
                    <span className="small tertiary mono">{a.at.slice(11, 16)}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginTop: 6 }}>{a.title}</div>
                  <div className="small muted mt-2">{a.detail}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI 诊断报告 */}
      <Modal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title="AI 诊断报告"
        actions={
          <>
            <Button onClick={() => setReportOpen(false)}>关闭</Button>
            <Button variant="primary" disabled={!event} onClick={() => {
              setReportOpen(false);
              navigate(workflowPath('/evidence',event?.id));
            }}>
              查看事件证据
            </Button>
          </>
        }
      >
        {event && <><p>{event.id} · {event.title}</p>
          <p>{event.zone} · {event.scene} · 捕获时间 {event.at.replace('T',' ')}</p>
          <p>示例识别置信度 {(event.confidence * 100).toFixed(1)}%，请核对现场依据后裁决。</p></>}
      </Modal>

      {/* 紧急制动 */}
      <Modal
        open={brakeOpen}
        onClose={() => setBrakeOpen(false)}
        title="确认紧急制动？"
        actions={
          <>
            <Button onClick={() => setBrakeOpen(false)}>取消</Button>
            <Button
              variant="danger"
              onClick={() => {
                recordAction('紧急制动演示 · 已记录模拟操作');
                setBraked(true);
                setBrakeOpen(false);
                setTimeout(() => setBraked(false), 2200);
              }}
            >
              确认制动
            </Button>
          </>
        }
      >
        <p className="muted">紧急制动将模拟触发全厂安全联锁，此操作为交互演示，不会影响真实设备。</p>
      </Modal>

      {braked && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            background: 'rgba(250,97,97,0.12)',
            zIndex: 90,
            animation: 'fadeIn 0.1s ease',
          }}
        />
      )}
    </div>
  );
}

function MetricRow({ icon, label, value, ok }: { icon: React.ReactNode; label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex-between" style={{ padding: '8px 0' }}>
      <span className="muted" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
        {icon} {label}
      </span>
      <span className="tabular" style={{ fontWeight: 600, color: ok ? 'var(--color-success)' : 'var(--color-foreground)' }}>
        {value}
      </span>
    </div>
  );
}
