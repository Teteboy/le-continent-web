import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import HomePage from '@/pages/HomePage';
import CulturesPremiumPage from '@/pages/CulturesPremiumPage';
import VillageOptionsPage from '@/pages/VillageOptionsPage';
import BibliothequePage from '@/pages/BibliothequePage';
import ProverbesPage from '@/pages/village/ProverbesPage';
import LexiquePage from '@/pages/village/LexiquePage';
import HistoirePage from '@/pages/village/HistoirePage';
import MetsPage from '@/pages/village/MetsPage';
import AlphabetPage from '@/pages/village/AlphabetPage';
import PhrasesPage from '@/pages/village/PhrasesPage';
import ProfilePage from '@/pages/ProfilePage';
import AboutPage from '@/pages/AboutPage';
import ContactPage from '@/pages/ContactPage';
import PrivacyPage from '@/pages/PrivacyPage';
import TermsPage from '@/pages/TermsPage';
import CheckoutPage from '@/pages/CheckoutPage';
import PaymentSuccessPage from '@/pages/PaymentSuccessPage';
import PaymentCancelPage from '@/pages/PaymentCancelPage';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import { useAuth } from '@/hooks/useAuth';
import { AuthProvider } from '@/providers/AuthProvider';
import { type ReactNode, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 60_000 } },
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
      <Routes>
      {/* Public routes */}
      <Route path="/" element={<Layout hideFooter><LandingPage /></Layout>} />
      <Route path="/cultures" element={<Layout><HomePage /></Layout>} />
      <Route path="/cultures-premium" element={<Layout><CulturesPremiumPage /></Layout>} />
      <Route path="/village-options" element={<Layout><VillageOptionsPage /></Layout>} />
      <Route path="/bibliotheque" element={<Layout><BibliothequePage /></Layout>} />
      <Route path="/village/proverbes" element={<Layout><ProverbesPage /></Layout>} />
      <Route path="/village/lexique" element={<Layout><LexiquePage /></Layout>} />
      <Route path="/village/histoire" element={<Layout><HistoirePage /></Layout>} />
      <Route path="/village/mets" element={<Layout><MetsPage /></Layout>} />
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
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
