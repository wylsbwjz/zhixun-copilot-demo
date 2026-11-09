import { useState } from 'react';
import type { ReactNode } from 'react';
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
    <div className="page workbench-page">
      <header className="workbench-toolbar">
        <div>
          <h1 className="page-title">我的巡检工作台</h1>
          <div className="page-sub">
            B 区北侧走廊 · <span className="tabular">{pending.length}</span> 个异常点位待核查
          </div>
        </div>
        <div className="workbench-controls" aria-label="待办筛选与排序" role="group">
          <Button variant="ghost" aria-pressed={highOnly} onClick={() => setHighOnly(!highOnly)}>
            <Filter size={14} /> {highOnly ? '全部风险' : '仅极高危'}
          </Button>
          <Button variant="ghost" aria-pressed={sortByRisk} onClick={() => setSortByRisk(!sortByRisk)}>
            <ArrowUpDown size={14} /> {sortByRisk ? '按置信度' : '按时间'}
          </Button>
        </div>
      </header>

      <div className="workbench-grid">
        <section className="workbench-board" aria-label="我的待办任务">
          {pending.length === 0 && <Empty text="今日无待办，去 AR 扫描发现新异常" />}
          <div className="workbench-events">
            {pending.map(event => (
              <article key={event.id} className="card workbench-event">
                <div className="workbench-event-preview" aria-hidden="true">
                  <Thumb kind={event.screenshot} size="lg" />
                </div>
                <div className="workbench-event-body">
                  <div className="workbench-event-status">
                    <Badge level={event.level} />
                    <time className="small muted mono" dateTime={event.at}>{event.at.slice(11, 16)}</time>
                  </div>
                  <h2 className="workbench-event-title">{event.title}</h2>
                  <div className="workbench-event-meta small muted">
                    <span className="mono">{event.id}</span>
                    <span>{event.zone} · {event.scene}</span>
                  </div>
                  <div className="workbench-event-confidence small muted">
                    <span>置信度 <strong className="tabular">{formatConfidence(event.confidence)}</strong></span>
                    {isLowConfidence(event.confidence) && <span className="workbench-low-confidence">低置信 · 建议人工复核</span>}
                  </div>
                </div>
                <div className="workbench-event-action">
                  <Button variant="primary" block onClick={() => navigate(`/evidence?event=${encodeURIComponent(event.id)}`)}>
                    核查
                  </Button>
                </div>
              </article>
            ))}
            <button className="card workbench-add" onClick={() => navigate('/ar')}>
              <Plus size={20} aria-hidden="true" /> 扫描新点位以添加任务
            </button>
          </div>
        </section>

        <aside className="workbench-summary" aria-label="今日巡检概览">
          <section className="card workbench-progress">
            <h2>今日巡检进度</h2>
            <ProgressRing value={85} size={132} color="var(--color-success)" />
            <div className="small muted">巡检时长 <span className="tabular">06:24:12</span></div>
          </section>
          <section className="card workbench-metrics">
            <h2>巡检指标</h2>
            <dl className="workbench-stats">
              <Stat icon={<Footprints size={16} />} label="步数统计" value="12,403" />
              <Stat icon={<ScanLine size={16} />} label="已扫描点" value="42/50" />
              <Stat icon={<HeartPulse size={16} />} label="设备健康度" value="98%" />
              <Stat icon={<Thermometer size={16} />} label="当前气温" value="24.5°C" />
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="workbench-stat">
      <dt className="small muted"><span aria-hidden="true">{icon}</span>{label}</dt>
      <dd className="tabular">{value}</dd>
    </div>
  );
}
