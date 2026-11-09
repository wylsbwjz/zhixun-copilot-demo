import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/AppShell';
import Welcome from './pages/Welcome';
import Awareness from './pages/Awareness';
import Workbench from './pages/Workbench';
import Tasks from './pages/Tasks';
import ArScan from './pages/ArScan';
import Evidence from './pages/Evidence';
import Batch from './pages/Batch';
import Orders from './pages/Orders';
import Dispatch from './pages/Dispatch';
import Ipad from './pages/Ipad';
import IpadVerify from './pages/IpadVerify';
import About from './pages/About';

// 图表依赖较重，按需加载，避免首屏加载 echarts
const Analytics = lazy(() => import('./pages/Analytics'));
const Whitebox = lazy(() => import('./pages/Whitebox'));

export default function App() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="page">
            <div className="empty" style={{ padding: 80 }}>
              <div>加载图表模块…</div>
            </div>
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/overview" element={<Awareness />} />
          <Route path="/workbench" element={<Workbench />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/ar" element={<ArScan />} />
          <Route path="/evidence" element={<Evidence />} />
          <Route path="/batch" element={<Batch />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/whitebox" element={<Whitebox />} />
          <Route path="/dispatch" element={<Dispatch />} />
          <Route path="/ipad" element={<Ipad />} />
          <Route path="/ipad/verify" element={<IpadVerify />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}
