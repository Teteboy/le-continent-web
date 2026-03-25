import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryConfig } from '@/lib/query-config';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Toaster } from '@/components/ui/sonner';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { AuthProvider } from '@/providers/AuthProvider';
import { type ReactNode, useEffect, lazy, Suspense } from 'react';

// Lazy-load all pages for better initial load performance
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const SignupPage = lazy(() => import('@/pages/SignupPage'));
const HomePage = lazy(() => import('@/pages/HomePage'));
const CulturesPremiumPage = lazy(() => import('@/pages/CulturesPremiumPage'));
const VillageOptionsPage = lazy(() => import('@/pages/VillageOptionsPage'));
const BibliothequePage = lazy(() => import('@/pages/BibliothequePage'));
const MedecineTraditionnellePage = lazy(() => import('@/pages/MedecineTraditionnellePage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const UpdatePasswordPage = lazy(() => import('@/pages/UpdatePasswordPage'));
const ProverbesPage = lazy(() => import('@/pages/village/ProverbesPage'));
const LexiquePage = lazy(() => import('@/pages/village/LexiquePage'));
const HistoirePage = lazy(() => import('@/pages/village/HistoirePage'));
const HistoireDetailPage = lazy(() => import('@/pages/village/HistoireDetailPage'));
const MetsPage = lazy(() => import('@/pages/village/MetsPage'));
const MetsDetailPage = lazy(() => import('@/pages/village/MetsDetailPage'));
const AlphabetPage = lazy(() => import('@/pages/village/AlphabetPage'));
const PhrasesPage = lazy(() => import('@/pages/village/PhrasesPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage'));
const TermsPage = lazy(() => import('@/pages/TermsPage'));
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'));
const PaymentSuccessPage = lazy(() => import('@/pages/PaymentSuccessPage'));
const PaymentCancelPage = lazy(() => import('@/pages/PaymentCancelPage'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
import { Loader2 } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF8DC]">
      <div className="text-center">
        <img src="/logo_app.jpg" alt="Le Continent" className="w-20 h-20 rounded-full object-cover border-4 border-[#8B0000] mx-auto mb-4 animate-pulse" />
        <Loader2 className="text-[#8B0000] w-6 h-6 animate-spin mx-auto" />
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function GuestRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/cultures" replace />;
  return <>{children}</>;
}

function Layout({ children, hideFooter = false }: { children: ReactNode; hideFooter?: boolean }) {
  return (
    <>
      <Navbar />
      <main className="pt-16">{children}</main>
      {!hideFooter && <Footer />}
    </>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
}

function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<LoadingScreen />}>
      <Routes>
      {/* Public routes */}
      <Route path="/" element={<Layout hideFooter><LandingPage /></Layout>} />
      <Route path="/cultures" element={<Layout><HomePage /></Layout>} />
      <Route path="/cultures-premium" element={<Layout><CulturesPremiumPage /></Layout>} />
      <Route path="/village-options" element={<Layout><VillageOptionsPage /></Layout>} />
      <Route path="/bibliotheque" element={<Layout><BibliothequePage /></Layout>} />
      <Route path="/medecine-traditionnelle" element={<Layout><MedecineTraditionnellePage /></Layout>} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/update-password" element={<UpdatePasswordPage />} />
      <Route path="/village/proverbes" element={<Layout><ProverbesPage /></Layout>} />
      <Route path="/village/lexique" element={<Layout><LexiquePage /></Layout>} />
      <Route path="/village/histoire" element={<Layout><HistoirePage /></Layout>} />
      <Route path="/village/histoire/:id" element={<Layout><HistoireDetailPage /></Layout>} />
      <Route path="/village/mets" element={<Layout><MetsPage /></Layout>} />
        <Route path="/village/mets/:id" element={<MetsDetailPage />} />
      <Route path="/village/alphabet" element={<Layout><AlphabetPage /></Layout>} />
      <Route path="/village/phrases" element={<Layout><PhrasesPage /></Layout>} />
      <Route path="/about" element={<Layout><AboutPage /></Layout>} />
      <Route path="/contact" element={<Layout><ContactPage /></Layout>} />
      <Route path="/privacy" element={<Layout><PrivacyPage /></Layout>} />
      <Route path="/terms" element={<Layout><TermsPage /></Layout>} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/payment/success" element={<PaymentSuccessPage />} />
      <Route path="/payment/cancel" element={<PaymentCancelPage />} />

      {/* Guest-only routes (redirect to /cultures if logged in) */}
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/inscription" element={<GuestRoute><SignupPage /></GuestRoute>} />

      {/* Protected routes */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout><ProfilePage /></Layout>
          </ProtectedRoute>
        }
      />

      {/* Admin Dashboard (no Layout wrapper — fully standalone) */}
      <Route path="/admin" element={<AdminDashboard />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
