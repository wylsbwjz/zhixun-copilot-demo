// 运行时验证：直接调用真实 store，验证「AI 发现，人类裁决」闭环
const mem = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
  setItem: (k: string, v: string) => {
    mem.set(k, v);
  },
  removeItem: (k: string) => {
    mem.delete(k);
  },
  clear: () => {
    mem.clear();
  },
};

async function main() {
  const { useStore } = await import('./src/lib/store');
  let pass = 0;
  let fail = 0;
  const assert = (cond: boolean, msg: string) => {
    if (cond) {
      pass++;
      console.log('  ✓', msg);
    } else {
      fail++;
      console.log('  ✗', msg);
    }
  };

  const s = () => useStore.getState();
  s().reset();

  const pendingCount = () => s().events.filter((e) => e.status === 'pending').length;

  console.log('\n[1] 初始状态');
  assert(pendingCount() === 8, `初始待复核事件 8 条（实际 ${pendingCount()}）`);
  assert(s().orders.length === 4, `初始工单 4 条（实际 ${s().orders.length}）`);
  assert(s().site.activeAnomalies === 7, `初始活跃异常 7（实际 ${s().site.activeAnomalies}）`);

  console.log('\n[2] 确认违规 → 原子生成工单');
  s().confirmEvent('TR-8821-XP');
  assert(s().orders.length === 4, '高危未核对依据不得建单');
  s().confirmEvent('TR-8821-XP', true);
  const ev = s().events.find((e) => e.id === 'TR-8821-XP');
  assert(ev?.status === 'confirmed', '事件 TR-8821-XP 置为 confirmed');
  const newOrder = s().orders.find((o) => o.fromEventId === 'TR-8821-XP');
  assert(!!newOrder, '生成关联工单');
  assert(newOrder?.status === 'to_dispatch', `新工单状态 = 待派单（实际 ${newOrder?.status}）`);
  assert(s().site.activeAnomalies === 7, '确认违规不减少活跃异常（仍 7）');
  assert(pendingCount() === 7, `待复核 8 → 7（实际 ${pendingCount()}）`);

  console.log('\n[3] 驳回误报 → 不生成工单');
  const ordersBeforeIgnore = s().orders.length;
  s().ignoreEvent('TR-7712-LA');
  const ev2 = s().events.find((e) => e.id === 'TR-7712-LA');
  assert(ev2?.status === 'ignored', '事件 TR-7712-LA 置为 ignored');
  assert(s().orders.length === ordersBeforeIgnore, '忽略不新增工单');
  assert(!!ev2?.reviewLog && ev2.reviewLog.action === 'ignore', '记录 reviewLog（误报反馈）');
  assert(s().site.activeAnomalies === 6, '驳回误报 → 活跃异常减少为 6');

  console.log('\n[4] 撤销（快照恢复）');
  s().undo();
  assert(s().events.find((e) => e.id === 'TR-7712-LA')?.status === 'pending', '撤销忽略 → 恢复 pending');
  s().undo();
  assert(s().events.find((e) => e.id === 'TR-8821-XP')?.status === 'pending', '撤销确认 → 恢复 pending');
  assert(s().orders.length === 4, `撤销确认 → 工单移除（实际 ${s().orders.length}）`);
  assert(s().site.activeAnomalies === 7, '撤销后活跃异常仍为 7');

  console.log('\n[5] 工单状态机全流程');
  s().confirmEvent('TR-1209-ST', true);
  const o = s().orders.find((x) => x.fromEventId === 'TR-1209-ST');
  const statusOf = () => s().orders.find((x) => x.id === o!.id)!.status;
  s().transitionOrder(o!.id, 'dispatch', { assignee: '王建国' });
  assert(statusOf() === 'to_accept', '派单 → 待接单');
  s().transitionOrder(o!.id, 'accept');
  assert(statusOf() === 'processing', '接单 → 处理中');
  s().transitionOrder(o!.id, 'submit', { result: '已修复' });
  assert(statusOf() === 'to_verify', '提交验收 → 待验收');
  s().transitionOrder(o!.id, 'reject', { reason: '证据不足' });
  assert(statusOf() === 'processing', '驳回 → 退回处理中');
  assert(!!s().orders.find((x) => x.id === o!.id)?.rejectReason, '驳回原因已记录');
  s().transitionOrder(o!.id, 'submit', { result: '已重新修复' });
  s().transitionOrder(o!.id, 'approve');
  assert(statusOf() === 'closed', '验收通过 → 已关闭');
  assert(s().site.activeAnomalies === 6, '验收通过 → 活跃异常减少为 6');
  const tl = s().orders.find((x) => x.id === o!.id)!.timeline;
  assert(tl.length >= 6, `时间线记录完整（${tl.length} 条）`);

  console.log('\n[6] 批量批准 / 批量忽略');
  s().batchApprove(['TR-4120-NW', 'TR-9901-DX']);
  const b1 = s().events.find((e) => e.id === 'TR-4120-NW');
  const b2 = s().events.find((e) => e.id === 'TR-9901-DX');
  assert(b1?.status === 'confirmed' && b2?.status === 'confirmed', '批量批准 → 两事件 confirmed');
  const batchOrders = s().orders.filter((o) => o.fromEventId === 'TR-4120-NW' || o.fromEventId === 'TR-9901-DX');
  assert(batchOrders.length === 2, '批量批准 → 生成 2 个工单');
  const ids = batchOrders.map((o) => o.id);
  assert(new Set(ids).size === 2, '批量工单编号不重复');
  s().batchIgnore(['ERR-2301']);
  assert(s().events.find((e) => e.id === 'ERR-2301')?.status === 'ignored', '批量忽略 → 事件 ignored');

  console.log('\n[7] P0 同事件闭环（记录 → 裁决 → 工单 → 归档）');
  s().reset();
  s().recordEvent('TR-1209-ST');
  assert(s().events.find((e) => e.id === 'TR-1209-ST')?.recorded === true, 'AR 记录事件 → recorded');
  s().confirmEvent('TR-1209-ST', true);
  const p0order = s().orders.find((o) => o.fromEventId === 'TR-1209-ST');
  assert(!!p0order, '确认 → 生成同一事件工单');
  s().transitionOrder(p0order!.id, 'dispatch', { assignee: '李卫东' });
  s().transitionOrder(p0order!.id, 'accept');
  s().transitionOrder(p0order!.id, 'submit', { result: '已修复' });
  s().transitionOrder(p0order!.id, 'approve');
  const closed = s().orders.find((o) => o.id === p0order!.id);
  assert(closed?.status === 'closed', '验收通过 → 已关闭');
  assert(!!closed?.archivedAt && !!closed?.archivedBy, '归档保存操作者与时间');
  assert(closed?.archiveEvidence?.includes(p0order!.fromEventId ?? ''), '归档证据关联事件');
  assert(s().site.activeAnomalies === 6, '同事件闭环 → 验收后活跃异常减少');

  console.log(`\n========== 结果：${pass} 通过 / ${fail} 失败 ==========\n`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
