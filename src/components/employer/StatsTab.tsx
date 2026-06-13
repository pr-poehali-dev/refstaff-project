import React, { lazy, Suspense } from 'react';
import type { Recommendation, Employee, Vacancy } from '@/types';

const CompanyStats = lazy(() => import('@/components/CompanyStats'));

const LazyFallback = () => <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

export interface StatsTabProps {
  recommendations: Recommendation[];
  employees: Employee[];
  vacancies: Vacancy[];
  companyName?: string;
}

export function StatsTab({ recommendations, employees, vacancies, companyName }: StatsTabProps) {
  return (
    <Suspense fallback={<LazyFallback />}>
      <CompanyStats
        recommendations={recommendations}
        employees={employees}
        vacancies={vacancies}
        companyName={companyName}
      />
    </Suspense>
  );
}

export default StatsTab;
