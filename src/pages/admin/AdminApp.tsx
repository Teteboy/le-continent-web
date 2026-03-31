import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import AdminDashboard from './AdminDashboard';
import AdminLoginPage from './AdminLoginPage';
import { AuthProvider } from '@/providers/AuthProvider';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 60_000 } },
});

/**
 * Standalone admin application.
 * Deployed independently on the admin subdomain (e.g. admin.le-continent.com).
 * Uses the same Supabase project — auth sessions are shared via localStorage.
 */
export default function AdminApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/login" element={<AdminLoginPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
