import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Star, LogOut, User, Home, Info, Mail, BookOpen, Crown, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setMobileOpen(false);
  };

  const navLinks = [
    { label: 'Explorer', href: '/cultures', icon: <Home size={15} /> },
    { label: 'Contenu', href: '/cultures-premium', icon: <BookOpen size={15} /> },
    { label: 'À Propos', href: '/about', icon: <Info size={15} /> },
    { label: 'Contact', href: '/contact', icon: <Mail size={15} /> },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#8B0000] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <img src="/logo_app.jpg" alt="Le Continent" className="w-9 h-9 rounded-full object-cover border-2 border-[#FFD700]" />
            <div className="hidden sm:block">
              <span className="text-white font-extrabold text-lg tracking-wide">
                Le <span className="text-[#FFD700]">Continent</span>
              </span>
              <p className="text-white/50 text-[10px] leading-none -mt-0.5">Panthéon Culturel</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`flex items-center gap-1.5 text-sm font-semibold transition-colors px-3 py-1.5 rounded-lg ${
                  isActive(link.href) ? 'text-[#FFD700] bg-white/10' : 'text-white/90 hover:text-[#FFD700] hover:bg-white/10'
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-2.5">
            {user ? (
              <>
                {profile?.is_premium && (
                  <Badge className="bg-[#FFD700] text-[#8B0000] font-bold flex items-center gap-1 px-2.5 py-0.5">
                    <Crown size={11} fill="currentColor" /> Premium
                  </Badge>
                )}
                <span className="text-white/80 text-sm hidden lg:block truncate max-w-[130px]">
                  {profile?.first_name ?? 'Utilisateur'}
                </span>
                {profile?.is_admin && (
                  <Link to="/admin">
                    <Button size="sm" className="bg-[#FFD700] text-[#8B0000] font-bold hover:bg-yellow-400 flex items-center gap-1.5 shadow-sm">
                      <Shield size={13} /> Admin
                    </Button>
                  </Link>
                )}
                <Link to="/profile">
                  <Button size="sm" className="bg-white text-[#8B0000] hover:bg-gray-100 flex items-center gap-1.5 font-semibold">
                    <User size={14} /> Profil
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-white/80 hover:text-white hover:bg-white/15 flex items-center gap-1">
                  <LogOut size={14} />
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button size="sm" className="bg-white text-[#8B0000] hover:bg-gray-100 font-semibold">
                    Connexion
                  </Button>
                </Link>
                <Link to="/inscription">
                  <Button size="sm" className="bg-[#FFD700] text-[#8B0000] font-bold hover:bg-yellow-400 shadow-sm">
                    S'inscrire
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#6B0000] border-t border-[#FFD700]/20 px-4 pb-5 pt-3">
          {user && (
            <div className="flex items-center gap-3 px-2 py-3 mb-2 bg-white/5 rounded-xl">
              <div className="w-9 h-9 bg-[#FFD700]/20 rounded-full flex items-center justify-center">
                <User size={18} className="text-[#FFD700]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{profile?.first_name} {profile?.last_name}</p>
                <p className="text-white/50 text-xs truncate">{profile?.email || profile?.phone}</p>
              </div>
              {profile?.is_premium && (
                <Badge className="bg-[#FFD700] text-[#8B0000] text-xs font-bold flex items-center gap-1 shrink-0">
                  <Star size={9} fill="currentColor" /> Premium
                </Badge>
              )}
            </div>
          )}
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive(link.href) ? 'text-[#FFD700] bg-white/10' : 'text-white hover:text-[#FFD700] hover:bg-white/10'
                }`}
              >
                {link.icon} {link.label}
              </Link>
            ))}
            <div className="border-t border-white/20 my-2" />
            {user ? (
              <>
                {profile?.is_admin && (
                  <Link to="/admin" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full bg-[#FFD700] text-[#8B0000] font-bold hover:bg-yellow-400 flex items-center gap-2 justify-center mb-2">
                      <Shield size={15} /> Tableau de bord Admin
                    </Button>
                  </Link>
                )}
                <Link to="/profile" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full bg-white text-[#8B0000] hover:bg-gray-100 flex items-center gap-2 justify-center font-semibold">
                    <User size={16} /> Mon Profil
                  </Button>
                </Link>
                <Button variant="ghost" onClick={handleSignOut} className="w-full text-white/80 hover:bg-white/10 flex items-center gap-2 justify-center mt-1">
                  <LogOut size={16} /> Se déconnecter
                </Button>
              </>
            ) : (
              <div className="flex flex-col gap-2 mt-1">
                <Link to="/login" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full bg-white text-[#8B0000] hover:bg-gray-100 font-semibold">
                    Connexion
                  </Button>
                </Link>
                <Link to="/inscription" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full bg-[#FFD700] text-[#8B0000] font-bold hover:bg-yellow-400">
                    S'inscrire gratuitement
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
