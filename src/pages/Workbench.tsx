import {useState} from 'react';
import { useNavigate } from 'react-router-dom';
import { Footprints, ScanLine, HeartPulse, Thermometer, Filter, ArrowUpDown, Plus } from 'lucide-react';
import { useStore } from '../lib/store';
import { Badge, Button, ProgressRing, Empty } from '../components/ui';
import { Thumb } from '../components/thumb';
import { pendingEvents, formatConfidence, isLowConfidence } from '../lib/selectors';

export default function Workbench() {
  const navigate = useNavigate();
  const events = useStore((s) => s.events);
  const [highOnly, setHighOnly] = useState(false);
  const [sortByRisk, setSortByRisk] = useState(false);
  const pending = pendingEvents(events).filter(event => !highOnly || event.level === 'critical')
    .sort((a, b) => sortByRisk ? b.confidence - a.confidence : b.at.localeCompare(a.at));

  return (
    <div className="page">
      <div className="flow-grid workbench-grid">
        {/* 左：圆环 + 概览 */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 24 }}>
          <ProgressRing value={85} size={160} color="var(--color-success)" />
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <div className="page-title" style={{ fontSize: 17, marginBottom: 4 }}>
              我的巡检工作台
            </div>
            <div className="small muted">今日路径：已完成 85%</div>
            <div className="small muted">巡检时长 06:24:12</div>
          </div>
        </div>

        {/* 右：待办任务 */}
        <div>
          <div className="flex-between" style={{ marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>我的待办任务</div>
              <div className="small muted">
                当前位于 B区-北侧走廊。检测到 <span className="tabular" style={{ color: 'var(--color-danger)' }}>{pending.length}</span>{' '}
                个待办异常点位，请及时前往核实并标记解决。系统已同步最新防误触算法。
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button size="sm" variant="ghost" aria-pressed={highOnly} onClick={() => setHighOnly(!highOnly)}>
                <Filter size={14} /> {highOnly ? "全部风险" : "仅极高危"}
              </Button>
              <Button size="sm" variant="ghost" aria-pressed={sortByRisk} onClick={() => setSortByRisk(!sortByRisk)}>
                <ArrowUpDown size={14} /> {sortByRisk ? "按置信度" : "按时间"}
              </Button>
            </div>
          </div>

          {pending.length === 0 ? (
            <Empty text="今日无待办，去 AR 扫描发现新异常" />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 12 }}>
              {pending.map((e) => (
                <div key={e.id} className="card" style={{ display: 'flex', gap: 12 }}>
                  <Thumb kind={e.screenshot} size="md" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex-between" style={{ marginBottom: 6 }}>
                      <Badge level={e.level} />
                      <span className="small tertiary mono">{e.at.slice(11, 16)}</span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{e.title}</div>
                    <div className="small muted mt-2">
                      {e.id} · {e.zone}（{e.scene}）
                    </div>
                    <div className="small muted mt-2">
                      置信度 <span className="tabular">{formatConfidence(e.confidence)}</span>
                      {isLowConfidence(e.confidence) && (
                        <span style={{ color: 'var(--color-warning)', marginLeft: 6 }}>低置信 · 建议人工复核</span>
                      )}
                    </div>
                    <div className="flex gap-2" style={{ marginTop: 10 }}>
                      <Button size="sm" variant="primary" block onClick={() => navigate(`/evidence?event=${encodeURIComponent(e.id)}`)}>
                        核查
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              <button
                className="card"
                onClick={() => navigate('/ar')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--color-foreground-muted)', minHeight: 110, borderStyle: 'dashed', background: 'transparent' }}
              >
                <Plus size={18} /> 扫描新点位以添加任务
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 底部统计 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 20 }}>
        <Stat icon={<Footprints size={17} />} label="步数统计" value="12,403" />
        <Stat icon={<ScanLine size={17} />} label="已扫描点" value="42/50" />
        <Stat icon={<HeartPulse size={17} />} label="设备健康度" value="98%" />
        <Stat icon={<Thermometer size={17} />} label="当前气温" value="24.5°C" />
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ color: 'var(--color-primary)' }}>{icon}</div>
      <div>
        <div className="small muted">{label}</div>
        <div className="tabular" style={{ fontSize: 18, fontWeight: 700 }}>
          {value}
        </div>
      </div>
    </div>
  );
}
