import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Skeleton } from '@/components/ui/Primitives';

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const TelecomTwinPage = lazy(() => import('@/pages/TelecomTwinPage'));
const RecommendationsPage = lazy(() => import('@/pages/RecommendationsPage'));
const ComparePlansPage = lazy(() => import('@/pages/ComparePlansPage'));
const SimulatorPage = lazy(() => import('@/pages/SimulatorPage'));
const AdvisorPage = lazy(() => import('@/pages/AdvisorPage'));
const HistoryPage = lazy(() => import('@/pages/HistoryPage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

function PageFallback() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-10 space-y-4">
      <Skeleton className="h-10 w-1/3" />
      <Skeleton className="h-40" />
      <Skeleton className="h-64" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="twin" element={<TelecomTwinPage />} />
          <Route path="recommendations" element={<RecommendationsPage />} />
          <Route path="compare" element={<ComparePlansPage />} />
          <Route path="simulator" element={<SimulatorPage />} />
          <Route path="advisor" element={<AdvisorPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
