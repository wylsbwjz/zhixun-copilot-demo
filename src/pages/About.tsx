import { useNavigate } from 'react-router-dom';
import { RotateCcw, CheckCircle2, AlertTriangle, ListChecks } from 'lucide-react';
import { BrandMark } from '../components/Brand';
import { useStore } from '../lib/store';
import { Button } from '../components/ui';

export default function About() {
  const navigate = useNavigate();
  const reset = useStore((s) => s.reset);

  return (
    <div className="page" style={{ maxWidth: 980, margin: '0 auto' }}>
      <div className="flex gap-3" style={{ alignItems: 'center', marginBottom: 6 }}>
        <BrandMark size={30}/>
        <div>
          <div className="page-title" style={{ margin: 0 }}>
            智巡 Copilot · 能力边界
          </div>
          <div className="page-sub" style={{ margin: 0 }}>
            SITEGUARD COPILOT · 工业安监场景 B 端智能辅助系统
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-head">
          <CheckCircle2 size={16} color="var(--color-success)" />
          <span className="title">这是什么</span>
        </div>
        <p className="small muted" style={{ lineHeight: 1.8 }}>
          面向石油化工、炼化等流程工业的 B 端工业安监智能辅助系统。一线巡检员在 iPad /
          工业防爆平板上完成现场巡检与异常复核，管理者在 PC 宏观调度后台完成态势感知、批量审核与工单闭环。核心理念：
          <strong style={{ color: 'var(--color-foreground)' }}>「AI 发现，人类裁决」</strong>。
        </p>
      </div>

      <div className="card mt-4">
        <div className="card-head">
          <AlertTriangle size={16} color="var(--color-warning)" />
          <span className="title">能力边界（重要）</span>
        </div>
        <ul className="small muted" style={{ lineHeight: 1.9, paddingLeft: 18 }}>
          <li>本 Demo 为<strong>纯前端交互原型</strong>：本地示例数据 + 确定性模拟 AI，不依赖后端。</li>
          <li>AR 扫描、3D 厂区、紧急制动、自动派单均为<strong>交互概念演示</strong>，非真实能力。</li>
          <li>不宣称真实 AR 定位、3D 重建、实时 CV 推理或施工审核。</li>
          <li>所有事件、工单、人员、价格和统计均为<strong>「示例数据」</strong>。</li>
          <li>演示状态保存在浏览器 localStorage，清除数据会丢失本地修改。</li>
        </ul>
      </div>

      <div className="card mt-4">
        <div className="card-head">
          <ListChecks size={16} color="var(--color-primary)" />
          <span className="title">演示主线</span>
        </div>
        <ol className="small muted" style={{ lineHeight: 1.9, paddingLeft: 18 }}>
          <li>态势感知（大屏）：安全评分、告警流、AI 诊断报告。</li>
          <li>工作台：85% 圆环、待办异常点位。</li>
          <li>AR 扫描：AR 标签、判定依据、记录事件。</li>
          <li>证据核查：白盒 SENSE/EXTRACT/JUDGE → 确认违规 / 驳回误报。</li>
          <li>工单中心：待派单 → 待接单 → 处理中 → 待验收 → 已关闭（可驳回）。</li>
          <li>分析大盘：统计数字随操作同步；顶栏「撤销」可回滚。</li>
        </ol>
      </div>

      <div className="flex gap-2 mt-4">
        <Button variant="primary" onClick={() => navigate('/overview')}>
          进入态势感知
        </Button>
        <Button variant="ghost" onClick={() => reset()}>
          <RotateCcw size={15} /> 重置演示
        </Button>
      </div>
    </div>
  );
}
