import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense, useEffect, Component, type ReactNode } from "react";

// Все lazy-компоненты объявляем ДО использования
const Index = lazy(() => import("./pages/Index"));
const VacancyReferral = lazy(() => import("./pages/VacancyReferral"));
const VacancyApply = lazy(() => import("./pages/VacancyApply"));
const EmployeeInvite = lazy(() => import("./pages/EmployeeInvite"));
const EmployeeRegister = lazy(() => import("./pages/EmployeeRegister"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Admin = lazy(() => import("./pages/Admin"));
const VacancyQR = lazy(() => import("./pages/VacancyQR"));
const VacancyTest = lazy(() => import("./pages/VacancyTest"));
const PublicTest = lazy(() => import("./pages/PublicTest"));
const CreateTest = lazy(() => import("./pages/CreateTest"));
const CityLanding = lazy(() => import("./pages/CityLanding"));
const Partner = lazy(() => import("./pages/Partner"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Jobs = lazy(() => import("./pages/Jobs"));

// ErrorBoundary — ловит JS-краши и показывает кнопку перезагрузки вместо белого экрана
interface ErrorBoundaryState { hasError: boolean; }
class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <p style={{ fontSize: 18, fontWeight: 600 }}>Что-то пошло не так</p>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Попробуйте перезагрузить страницу</p>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: 8, padding: '10px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer' }}
          >
            Перезагрузить
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Prefetch наиболее вероятных следующих страниц после главной
function usePrefetch() {
  useEffect(() => {
    const timer = setTimeout(() => {
      import("./pages/VacancyApply");
      import("./pages/Blog");
    }, 3000);
    return () => clearTimeout(timer);
  }, []);
}

function AppRoutes() {
  usePrefetch();
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/r/:token" element={<VacancyReferral />} />
      <Route path="/vacancy/:vacancyId" element={<VacancyApply />} />
      <Route path="/invite/:token" element={<EmployeeInvite />} />
      <Route path="/employee-register" element={<EmployeeRegister />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/vacancy/:vacancyId/qr" element={<VacancyQR />} />
      <Route path="/vacancy/:vacancyId/qr/:token" element={<VacancyQR />} />
      <Route path="/test/:token" element={<VacancyTest />} />
      <Route path="/test-public/:token" element={<PublicTest />} />
      <Route path="/create-test" element={<CreateTest />} />
      <Route path="/jobs" element={<Jobs />} />
      <Route path="/partner" element={<Partner />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      <Route path="/:city" element={<CityLanding />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <AppRoutes />
            </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;