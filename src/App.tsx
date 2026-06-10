import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense, useEffect } from "react";

// Главная страница — грузим сразу (самая часто посещаемая)
const Index = lazy(() => import("./pages/Index"));

// Prefetch наиболее вероятных следующих страниц после главной
function usePrefetch() {
  useEffect(() => {
    const timer = setTimeout(() => {
      import("./pages/VacancyApply");
      import("./pages/Blog");
    }, 2000);
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
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      <Route path="/:city" element={<CityLanding />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
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
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // данные свежие 5 минут — нет лишних рефетчей
      gcTime: 1000 * 60 * 10,      // кеш живёт 10 минут
      retry: 1,                     // одна попытка вместо трёх
      refetchOnWindowFocus: false,  // не рефетчить при переключении вкладки
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
          <Suspense fallback={<PageLoader />}>
            <AppRoutes />
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;