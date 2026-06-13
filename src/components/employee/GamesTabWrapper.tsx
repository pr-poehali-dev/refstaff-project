import { lazy, Suspense } from 'react';

const GamesTab = lazy(() => import('@/components/GamesTab'));

const LazyFallback = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

export function GamesTabWrapper() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg sm:text-2xl font-semibold flex items-center gap-2">🎮 Мини-игры</h2>
      <p className="text-sm text-muted-foreground">Отдохни — здесь можно поиграть в перерыве</p>
      <Suspense fallback={<LazyFallback />}>
        <GamesTab />
      </Suspense>
    </div>
  );
}

export default GamesTabWrapper;
