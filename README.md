# 智巡 Copilot（SITEGUARD COPILOT）· 交互 Demo

工业安监场景 B 端智能辅助系统前端原型，复刻作品集《智巡》界面，补齐「AI 发现，人类裁决」的完整操作闭环。

[打开在线演示](https://wylsbwjz.github.io/zhixun-copilot-demo/)

从起始页选择「开始巡检演示」，可依次体验扫描发现、证据裁决、派单整改和复核归档。「查看态势大屏」可直接进入厂区总览。

## 技术栈

Vite + React 18 + TypeScript + Zustand + ECharts + React Router + lucide-react（深色主题，纯前端 mock，localStorage 持久化）。

## 运行

```bash
npm install        # 或 pnpm install
npm run dev        # 开发服务器（默认 127.0.0.1:5173）
npm run build      # 生产构建 → dist/
npm run preview    # 预览构建产物
```

## 页面 / 路由

| 路由 | 页面 |
|---|---|
| `/` | 演示起始页 |
| `/overview` | 全域安全态势感知（大屏） |
| `/workbench` | 监控工作台 |
| `/tasks` | 任务大厅（2D 路线图） |
| `/ar` | AR 实景扫描 |
| `/evidence` | AI 诊断与证据核查 |
| `/batch` | 批量审核 |
| `/orders` | 异常管理与工单中心 |
| `/analytics` | 工单统计分析大盘 |
| `/whitebox` | AI 白盒模型 |
| `/dispatch` | 全域态势调度中心 |
| `/ipad` | iPad 卡片滑动复核 |
| `/ipad/verify` | iPad 分屏核验 |

顶部「平板」图标可切换 PC 后台 / iPad 工作台双形态。

## 核心闭环（状态机）

- **AR 复核**：AI 识别异常 → 待复核 → 左滑忽略 / 右滑确认 → 确认生成工单 / 忽略记录误报反馈。
- **工单流**：待派单 → 待接单 → 处理中 → 待验收 → 已关闭（可驳回退回）。
- **撤销**：每次操作前保存快照，可撤销恢复。
- 所有统计数字由 selector 实时计算，跨页面一致。

## 回归测试

`verify.ts` 直接调用真实 store 验证状态机闭环。运行：

```bash
node node_modules/esbuild/bin/esbuild verify.ts --bundle --platform=node --format=cjs --outfile=verify.cjs
node verify.cjs
```

预期通过全部 35 项断言。

## 能力边界

这是纯前端原型，使用示例数据和模拟 AI。AR 扫描、厂区画面、紧急制动和自动派单均为交互演示。操作进度保存在当前浏览器。
