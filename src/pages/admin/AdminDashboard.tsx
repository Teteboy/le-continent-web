import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Globe, Tag, UsersRound, Database,
  LogOut, Menu, X, Shield, ChevronRight, Table2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import OverviewSection from './sections/OverviewSection';
import UsersSection from './sections/UsersSection';
import VillagesSection from './sections/VillagesSection';
import PromoCodesSection from './sections/PromoCodesSection';
import ReferralsSection from './sections/ReferralsSection';
import SetupGuideSection from './sections/SetupGuideSection';
import DataSection from './sections/DataSection';

/** Main site URL — set VITE_MAIN_SITE_URL in your hosting env for the admin subdomain */
const MAIN_SITE_URL = import.meta.env.VITE_MAIN_SITE_URL || '/';

type AdminSection = 'overview' | 'users' | 'villages' | 'promo-codes' | 'referrals' | 'data' | 'setup';

interface NavItem {
  id: AdminSection;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview',    label: 'Vue d\'ensemble',    icon: <LayoutDashboard size={18} /> },
  { id: 'users',       label: 'Utilisateurs',        icon: <Users size={18} /> },
  { id: 'villages',    label: 'Villages / Cultures', icon: <Globe size={18} /> },
  { id: 'promo-codes', label: 'Codes Promo',         icon: <Tag size={18} />, badge: 'NEW' },
  { id: 'referrals',   label: 'Parrainages',         icon: <UsersRound size={18} /> },
  { id: 'data',        label: 'Éditeur de données',  icon: <Table2 size={18} />, badge: 'SQL' },
  { id: 'setup',       label: 'Configuration SQL',   icon: <Database size={18} /> },
];

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF8DC]">
      <div className="text-center">
        <img src="/logo_app.jpg" alt="Le Continent" className="w-16 h-16 rounded-full object-cover border-4 border-[#8B0000] mx-auto mb-4 animate-pulse" />
        <div className="w-5 h-5 border-2 border-[#8B0000]/30 border-t-[#8B0000] rounded-full animate-spin mx-auto" />
      </div>
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF8DC]">
      <div className="text-center max-w-sm mx-auto px-4">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield size={36} className="text-red-500" />
        </div>
        <h1 className="text-2xl font-extrabold text-[#8B0000] mb-2">Accès Refusé</h1>
        <p className="text-gray-600 text-sm mb-6">
          Vous n'avez pas les droits d'administration nécessaires pour accéder à cette page.
          Contactez un administrateur pour obtenir les droits.
        </p>
        <a href="/" className="inline-block bg-[#8B0000] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#6B0000] transition-colors">
          Retour à l'accueil
        </a>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, profile, loading, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!profile?.is_admin) return <AccessDenied />;

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  const handleNav = (section: AdminSection) => {
    setActiveSection(section);
    setMobileSidebarOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img src="/logo_app.jpg" alt="Le Continent" className="w-10 h-10 rounded-full object-cover border-2 border-[#FFD700]" />
          <div>
            <p className="text-white font-extrabold text-base leading-tight">
              Le <span className="text-[#FFD700]">Continent</span>
            </p>
            <p className="text-white/50 text-[10px]">Panneau Admin</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-3 bg-white/10 rounded-xl px-3 py-2.5">
          <div className="w-8 h-8 bg-[#FFD700]/20 rounded-full flex items-center justify-center shrink-0">
            <span className="text-[#FFD700] font-bold text-sm">
              {profile?.first_name?.[0]}{profile?.last_name?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">
              {profile?.first_name} {profile?.last_name}
            </p>
            <Badge className="bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30 text-[10px] px-1.5 py-0 mt-0.5">
              Admin
            </Badge>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-white text-[#8B0000] shadow-sm'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className={isActive ? 'text-[#8B0000]' : 'text-white/60'}>{item.icon}</span>
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <Badge className="bg-[#FFD700] text-[#8B0000] text-[9px] font-black px-1.5 py-0">
                  {item.badge}
                </Badge>
              )}
              {isActive && <ChevronRight size={14} className="text-[#8B0000]" />}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <Button
          onClick={handleSignOut}
          variant="ghost"
          className="w-full text-white/70 hover:text-white hover:bg-white/10 flex items-center gap-2 justify-start font-semibold"
        >
          <LogOut size={16} /> Se déconnecter
        </Button>
        <a href={MAIN_SITE_URL} className="block w-full text-center text-white/40 hover:text-white/70 text-xs mt-2 transition-colors">
          ← Retour au site
        </a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#8B0000] flex-col fixed inset-y-0 left-0 z-30 shadow-2xl">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="relative w-72 bg-[#8B0000] flex flex-col shadow-2xl">
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white"
            >
              <X size={22} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4 flex items-center gap-4 sticky top-0 z-20 shadow-sm">
          <button
            className="lg:hidden text-[#8B0000] p-1 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-extrabold text-[#2C3E50]">
              {NAV_ITEMS.find((n) => n.id === activeSection)?.label ?? 'Admin'}
            </h1>
            <p className="text-xs text-gray-400 hidden sm:block">
              Le Continent · Tableau de bord administrateur
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-[#8B0000]/10 text-[#8B0000] border border-[#8B0000]/20 font-semibold hidden sm:flex items-center gap-1">
              <Shield size={11} /> Admin
            </Badge>
            <a
              href={MAIN_SITE_URL}
              className="text-xs text-gray-500 hover:text-[#8B0000] font-semibold hidden md:block transition-colors"
            >
              ← Voir le site
            </a>
          </div>
        </header>

        {/* Section Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {activeSection === 'overview'    && <OverviewSection />}
          {activeSection === 'users'       && <UsersSection />}
          {activeSection === 'villages'    && <VillagesSection />}
          {activeSection === 'promo-codes' && <PromoCodesSection />}
          {activeSection === 'referrals'   && <ReferralsSection />}
          {activeSection === 'data'        && <DataSection />}
          {activeSection === 'setup'       && <SetupGuideSection />}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-white px-8 py-3 text-center">
          <p className="text-xs text-gray-400">
            Le Continent · Admin Dashboard · {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </div>
  );
}
