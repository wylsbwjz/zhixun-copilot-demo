import {useNavigate} from 'react-router-dom';
import {downloadCsv,DEFAULT_SCAN_EVENT,workflowPath} from '../lib/workflow';
import { useMemo, useState } from 'react';
import { Sparkles, Download, ChevronRight } from 'lucide-react';
import { useStore } from '../lib/store';
import { EChart, trendOption, donutOption, sparklineOption } from '../components/charts';
import { Kpi, Button, Badge } from '../components/ui';
import { usePendingCount, useConfirmedCount } from '../lib/selectors';

const RANGE = ['30D', '90D', '1Y'];

const TREND: Record<string, { labels: string[]; values: number[] }> = {
  '30D': {
    labels: ['D1', 'D5', 'D10', 'D15', 'D20', 'D25', 'D30'],
    values: [420, 448, 431, 465, 452, 478, 441],
  },
  '90D': {
    labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W8', 'W10', 'W12'],
    values: [1250, 1380, 1420, 1310, 1460, 1490, 1520, 1480, 1540],
  },
  '1Y': {
    labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    values: [3820, 4100, 4280, 4060, 4440, 4620, 4550, 4780, 4860, 4720, 4910, 4990],
  },
};

export default function Analytics() {
  const navigate = useNavigate();
  const [assistantOpen,setAssistantOpen] = useState(true);
  const recordAction = useStore(state => state.recordAction);
  const [range, setRange] = useState('30D');
  const pendingCount = usePendingCount();
  const confirmedCount = useConfirmedCount();
  const orders = useStore((s) => s.orders);
  const closedCount = orders.filter((o) => o.status === 'closed').length;
  const closeRate = orders.length ? ((closedCount / orders.length) * 100).toFixed(1) : '0.0';

  const trend = useMemo(() => trendOption(TREND[range].labels, TREND[range].values), [range]);
  const donut = useMemo(
    () =>
      donutOption(
        [
          { name: '防护缺失', value: 189 },
          { name: '操作规范违规', value: 105 },
          { name: '次级隐患', value: 63 },
          { name: '其他', value: 64 },
        ],
        '421',
      ),
    [],
  );

  return (
    <div className="page" style={{ position: 'relative' }}>
      <div className="flex-between" style={{ marginBottom: 16 }}>
        <div>
          <div className="page-title">工单统计分析大盘</div>
          <div className="page-sub">历史示例趋势 · 当前工单统计</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', background: 'var(--color-surface-soft)', borderRadius: 8, padding: 3 }}>
            {RANGE.map((r) => (
              <button
                key={r}
                style={{ padding: '5px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500, color: range === r ? 'var(--color-primary-foreground)' : 'var(--color-foreground-muted)', background: range === r ? 'var(--color-primary)' : 'transparent' }}
                onClick={() => setRange(r)}
              >
                {r}
              </button>
            ))}
          </div>
          <Button size="sm" variant="ghost" onClick={() => downloadCsv('智巡统计-' + range + '.csv', [
            ['历史示例范围',range],
            ['区间','历史趋势示例'],
            ...TREND[range].labels.map((label,index) => [label,TREND[range].values[index]]),
            ['当前本地工单数',orders.length,'已关闭',closedCount,'关闭率',closeRate + '%'],
            ['当前待复核',pendingCount,'当前已确认',confirmedCount],
          ])}>
            <Download size={14} /> 导出报表
          </Button>
        </div>
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 12, marginBottom: 16 }}>
        <Kpi label="平均响应时长" value="12.5" unit="min" />
        <Kpi label="工单关闭率" value={closeRate} unit="%" delta={`${closedCount}/${orders.length} 张工单已关闭`} />
        <Kpi label="当前待人工复核" value={pendingCount} unit="units" />
        <Kpi label="AI 预判准确率（示例）" value="94.7" unit="%" />
      </div>

      {/* 图表 */}
      <div className="flow-grid analytics-grid">
        <div className="card">
          <div className="card-head">
            <span className="title">近{range === '30D' ? '30天' : range === '90D' ? '90天' : '12月'}安全违规趋势</span>
            <span className="right small muted">
              历史样例 <span className="tabular" style={{ color: 'var(--color-foreground)', fontWeight: 700 }}>12,840</span>{' '}
              <span style={{ color: 'var(--color-success)' }}>-2.4%</span> vs 周期
            </span>
          </div>
          <EChart option={trend} height={260} />
        </div>
        <div className="card">
          <div className="card-head">
            <span className="title">违规类型拆解</span>
          </div>
          <EChart option={donut} height={260} />
        </div>
      </div>

      {/* 区域排名 */}
      <div className="card">
        <div className="card-head">
          <span className="title">高风险工厂区域排名</span>
          <span className="right small muted">今日已确认违规 <span className="tabular" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{confirmedCount}</span> 项</span>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>区域名称</th>
              <th className="num">工单总量</th>
              <th className="num">平均处理耗时(HR)</th>
              <th>风险指数(TD)</th>
              <th>风险系数</th>
            </tr>
          </thead>
          <tbody>
            {[
              { zone: '7A-北区 冲压车间', total: 1204, hr: 2.4, spark: [30, 45, 40, 60, 55, 72], score: 0.88, level: 'critical' as const },
              { zone: '4C-西区 电子组装', total: 842, hr: 1.8, spark: [20, 28, 35, 30, 42, 38], score: 0.65, level: 'moderate' as const },
              { zone: '2B-南区 仓储中心', total: 412, hr: 4.2, spark: [10, 12, 14, 11, 15, 13], score: 0.24, level: 'low' as const },
            ].map((r) => (
              <tr key={r.zone}>
                <td style={{ fontWeight: 500 }}>{r.zone}</td>
                <td className="num">{r.total.toLocaleString()}</td>
                <td className="num">{r.hr.toFixed(1)} hr</td>
                <td style={{ width: 120 }}>
                  <EChart option={sparklineOption(r.spark, r.level === 'critical' ? '#fa6161' : r.level === 'moderate' ? '#ffdf72' : '#4db1ff')} height={32} />
                </td>
                <td>
                  <span style={{ fontWeight: 700, color: r.level === 'critical' ? 'var(--color-danger)' : r.level === 'moderate' ? 'var(--color-warning)' : 'var(--color-info)' }} className="tabular">
                    {r.score.toFixed(2)}
                  </span>{' '}
                  <Badge level={r.level} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* AI 安全助手浮层 */}
      {assistantOpen && <div
        style={{
          marginTop: 16,
          width: 'min(100%, 420px)',
          background: 'var(--color-surface-high)',
          border: '1px solid var(--color-border)',
          borderRadius: 14,
          padding: 16,
          boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
          zIndex: 40,
        }}
      >
        <div className="flex gap-2" style={{ marginBottom: 8 }}>
          <Sparkles size={16} color="var(--color-primary)" />
          <span style={{ fontWeight: 600, fontSize: 13 }}>AI 安全助手</span>
        </div>
        <p className="small muted" style={{ lineHeight: 1.6 }}>
          检测到 <strong style={{ color: 'var(--color-foreground)' }}>7A-北区</strong> 近 1 小时内违规频率上升。建议立即启动远程视频复核并调整巡检频率。
        </p>
        <div className="flex gap-2" style={{ marginTop: 12 }}>
          <Button size="sm" variant="primary" onClick={() => {
            recordAction('分析建议：进入 ' + DEFAULT_SCAN_EVENT + ' 证据核查');
            navigate(workflowPath('/evidence',DEFAULT_SCAN_EVENT));
          }}>
            查看建议事件
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setAssistantOpen(false)}>
            稍后
          </Button>
        </div>
      </div>}
    </div>
  );
}
