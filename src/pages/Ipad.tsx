import {workflowPath} from '../lib/workflow';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, X, Sparkles, RotateCcw } from 'lucide-react';
import { useStore } from '../lib/store';
import { Badge, Button, Empty } from '../components/ui';
import { Thumb } from '../components/thumb';
import { formatConfidence, isLowConfidence } from '../lib/selectors';

export default function Ipad() {
  const navigate = useNavigate();
  const events = useStore((s) => s.events);
  const confirmEvent = useStore((s) => s.confirmEvent);
  const ignoreEvent = useStore((s) => s.ignoreEvent);
  const reset = useStore((s) => s.reset);

  const queue = events.filter((e) => e.status === 'pending');
  const current = queue[0];

  const [dx, setDx] = useState(0);
  const [leaving, setLeaving] = useState<'left' | 'right' | null>(null);
  const [round, setRound] = useState({ confirm: 0, ignore: 0 });
  const dragging = useRef(false);
  const startX = useRef(0);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!current || leaving) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = true;
    startX.current = e.clientX;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    setDx(e.clientX - startX.current);
  };
  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (dx > 100) doSwipe('right');
    else if (dx < -100) doSwipe('left');
    else setDx(0);
  };

  const doSwipe = (dir: 'left' | 'right') => {
    if (!current || leaving) return;
    if (current.stale || (dir === 'right' && current.level === 'critical')) {
      navigate(workflowPath('/evidence', current.id));
      return;
    }
    setLeaving(dir);
    setDx(dir === 'right' ? 600 : -600);
    setTimeout(() => {
      if (dir === 'right') {
        confirmEvent(current.id);
        setRound((r) => ({ ...r, confirm: r.confirm + 1 }));
      } else {
        ignoreEvent(current.id);
        setRound((r) => ({ ...r, ignore: r.ignore + 1 }));
      }
      setLeaving(null);
      setDx(0);
    }, 260);
  };

  if (!current) {
    return (
      <div className="page" style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="empty" style={{ padding: 0 }}>
            <div className="icon" style={{ width: 64, height: 64 }}>
              <Check size={28} color="var(--color-success)" />
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-foreground)' }}>本轮复核完成</div>
            <div className="muted mt-2">
              确认违规 <span className="tabular" style={{ color: 'var(--color-danger)', fontWeight: 700 }}>{round.confirm}</span> 项 · 判定误报{' '}
              <span className="tabular" style={{ color: 'var(--color-info)', fontWeight: 700 }}>{round.ignore}</span> 项
            </div>
          </div>
          <div className="flex gap-2 mt-4" style={{ justifyContent: 'center' }}>
            <Button onClick={() => navigate('/orders')}>查看工单</Button>
            <Button variant="ghost" onClick={reset}>
              <RotateCcw size={15} /> 重置演示
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const rotate = dx / 28;

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div className="flex-between" style={{ marginBottom: 8 }}>
        <div>
          <div className="page-title" style={{ fontSize: 17 }}>极速复核</div>
          <div className="page-sub">左滑忽略 · 右滑确认 · 人工保留最终裁决权</div>
        </div>
        <div className="small muted">
          剩余 <span className="tabular" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{queue.length}</span> 项
        </div>
      </div>

      <div className="swipe-stage">
        <div className="swipe-hint mono">← 左滑忽略 &nbsp;&nbsp;|&nbsp;&nbsp; 右滑确认 →</div>

        <div
          className="swipe-card"
          style={{
            transform: `translateX(${dx}px) rotate(${rotate}deg)`,
            opacity: leaving ? 0 : 1,
            transition: dragging.current ? 'none' : 'transform 0.26s ease, opacity 0.26s ease',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {dragging.current = false;setDx(0);}}
        >
          <div className="card-img">
            <Thumb kind={current.screenshot} size="lg" />
            <div className="ar-tag critical" style={{ top: 12, left: 12 }}>
              <span className="t-label" style={{ color: 'var(--color-danger)' }}>
                违规场景示意 04
              </span>
            </div>
          </div>
          <div className="card-body">
            <div className="card-q">确认违规？</div>
            <div className="flex-between card-meta">
              <span>
                编号: <span className="mono">{current.id}</span>
              </span>
              <span className="mono">{current.at.slice(11, 16)}</span>
            </div>
            <div className="flex gap-2 mt-3" style={{ alignItems: 'center' }}>
              <Badge level={current.level} />
              <span className="small muted">{current.title}</span>
            </div>
            <div className="small muted mt-2">
              置信度 <span className="tabular">{formatConfidence(current.confidence)}</span>
              {isLowConfidence(current.confidence) && (
                <span style={{ color: 'var(--color-warning)', marginLeft: 6 }}>低置信 · 建议人工复核</span>
              )}
            </div>
            <div className="flex gap-2 mt-3" style={{ alignItems: 'center' }}>
              <Sparkles size={13} color="var(--color-primary)" />
              <span className="small muted">AI 巡诊分析报告 · {current.zone} 存在异常隐患，一键确认检查</span>
            </div>
          </div>
        </div>

        {/* 底部操作 */}
        <div className="swipe-actions">
          <Button variant="danger" size="touch" style={{ width: 200 }} disabled={!!leaving} onClick={() => doSwipe('left')}>
            <ArrowLeft size={22} /> 忽略
          </Button>
          <Button variant="primary" size="touch" style={{ width: 200 }} disabled={!!leaving} onClick={() => doSwipe('right')}>
            {current.level === 'critical' || current.stale ? '核对依据' : '确认'} <ArrowRight size={22} />
          </Button>
        </div>
      </div>
    </div>
  );
}
