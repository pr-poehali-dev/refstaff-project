import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense } from "react";

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

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
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
              <Route path="/:city" element={<CityLanding />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;