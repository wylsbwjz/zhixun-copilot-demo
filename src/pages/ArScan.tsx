import {useEffect, useState} from 'react';
import {Link, useNavigate, useSearchParams} from 'react-router-dom';
import {AlertTriangle, Download, ScanLine} from 'lucide-react';
import SceneView from '../components/SceneView';
import IndustrialArt from '../components/IndustrialArt';
import {Button, Modal, Badge} from '../components/ui';
import FlowGuide from '../components/FlowGuide';
import {useStore} from '../lib/store';
import {formatConfidence, LEVEL_META} from '../lib/selectors';
import {DEFAULT_SCAN_EVENT, downloadCsv, taskEvent, workflowPath} from '../lib/workflow';
import type {EventItem, TaskItem} from '../lib/types';

export default function ArScan() {
  const [params] = useSearchParams();
  const events = useStore(s => s.events);
  const taskId = params.get('task');
  const eventId = params.get('event');
  const task = useStore(s => s.tasks.find(task => task.id === taskId));
  const event = eventId ? events.find(event => event.id === eventId)
    : task ? taskEvent(events, task) : events.find(event => event.id === DEFAULT_SCAN_EVENT);
  if ((eventId && !event) || (taskId && !task)) {
    return <div className="page"><div className="card flow-gate">
      <h2>无法找到指定巡检记录</h2><Link className="btn btn-primary" to="/workbench">返回巡检工作台</Link>
    </div></div>;
  }
  return <Scan key={(task?.id ?? '') + (event?.id ?? '')} event={event} task={task}/>;
}

function Scan({event, task}: {event?: EventItem; task?: TaskItem}) {
  const navigate = useNavigate();
  const store = useStore();
  const [phase, setPhase] = useState(event?.recorded ? 3 : 0);
  const [detail, setDetail] = useState(false);
  const scanning = phase === 1 || phase === 2;
  const ready = phase === 3;
  useEffect(() => {
    if (!scanning) return;
    const timer = window.setTimeout(() => setPhase(previous => previous + 1), 420);
    return () => window.clearTimeout(timer);
  }, [phase, scanning]);

  function continueReview() {
    if (!event) return;
    store.recordEvent(event.id);
    store.setSelectedEvent(event.id);
    navigate(workflowPath('/evidence', event.id));
  }
  function exportReport() {
    if (!event) return;
    downloadCsv('巡检报告-' + event.id + '.csv', [
      ['事件编号', '标题', '区域', '点位', '捕获时间', 'AI置信度', '风险等级', '状态'],
      [event.id, event.title, event.zone, event.scene, event.at, formatConfidence(event.confidence), LEVEL_META[event.level].label, event.status],
    ]);
    store.toast('当前事件报告已下载（示例数据）', 'success');
  }

  return <div className="page flow-page">
    <div className="flex-between flow-title"><div className="page-title">AR 实景扫描</div>
      <span className="small muted">模拟扫描 · 非真实 AR</span></div>
    <FlowGuide eventId={event?.id}/>
    <div className="flow-grid scan-grid">
      <SceneView label={task?.title ?? '巡检场景'}>
        {ready && event && <>
          <div className="scan-detail-art"><IndustrialArt kind={event.screenshot}/></div>
          <button className="ar-tag critical scan-marker" onClick={() => setDetail(true)}>
            <span className="t-label"><AlertTriangle size={15}/>{event.title}</span>
            <span className="t-conf">{event.id} · {formatConfidence(event.confidence)} · 查看判定依据</span>
          </button>
        </>}
      </SceneView>
      <div className="card scan-controls">
        <h2>{task?.title ?? '巡检扫描'}</h2>
        {event && <p className="muted">{event.id} · {event.zone} · {event.scene}</p>}
        <p aria-live="polite">{['等待开始', '正在对齐示例场景', '正在匹配异常点位', event ? '扫描完成' : '本次示例巡检未发现待处置异常'][phase]}</p>
        {ready && event && <>
          <Badge level={event.level}/><h3>{event.title}</h3>
          <p>捕获时间 {event.at.replace('T', ' ')} · 原始置信度 {formatConfidence(event.confidence)}</p>
          <div className="flow-actions">
            <Button variant="primary" onClick={continueReview}>{event.recorded ? '进入证据核查' : '记录事件并复核'}</Button>
            <Button onClick={() => setDetail(true)}>为什么这样判断？</Button>
            <Button onClick={exportReport}><Download size={15}/>导出巡检报告</Button>
          </div>
        </>}
        {ready && !event && task && <Button variant="primary" onClick={() => {
          store.markTaskResolved(task.id);
          navigate('/tasks?task=' + encodeURIComponent(task.id));
        }}>完成本次巡检</Button>}
        <div className="flow-actions">
          {scanning ? <>
            <Button onClick={() => setPhase(0)}>取消扫描</Button>
            <Button variant="primary" onClick={() => setPhase(3)}>跳过演示节奏</Button>
          </> : <Button variant={ready ? 'secondary' : 'primary'} onClick={() => setPhase(1)}>
            <ScanLine size={15}/>{ready ? '重新扫描' : '开始扫描'}
          </Button>}
        </div>
      </div>
    </div>
    <Modal open={detail && !!event} title="为什么这样判断？" onClose={() => setDetail(false)}
      actions={<Button onClick={() => setDetail(false)}>知道了</Button>}>
      {event && <><p>{event.id} · {event.title}</p><p>示例来源　{event.zone} · {event.scene}</p>
        <p>模拟识别置信度 {formatConfidence(event.confidence)}，最终判断由人工核对现场证据。</p></>}
    </Modal>
  </div>;
}
