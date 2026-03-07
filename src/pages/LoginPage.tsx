import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

/** Derive the internal login email if user registered with phone only */
function deriveLoginEmail(input: string): string {
  const trimmed = input.trim();
  if (trimmed.includes('@')) return trimmed.toLowerCase();
  // Treat as phone number — strip non-digits then build generated email
  const digits = trimmed.replace(/\D/g, '');
  return `p${digits}@lc.app`;
}

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier.trim()) {
      toast.error('Identifiant requis.', { description: 'Entrez votre email ou numéro de téléphone.' });
      return;
    }
    if (!password) {
      toast.error('Mot de passe requis.', { description: 'Veuillez entrer votre mot de passe.' });
      return;
    }

    setLoading(true);
    try {
      const email = deriveLoginEmail(identifier);
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;
      toast.success('Connexion réussie ! Bienvenue 👋');
      navigate('/cultures');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de connexion.';
      if (msg.includes('Invalid login credentials')) {
        toast.error('Identifiant ou mot de passe incorrect.', {
          description: 'Vérifiez vos informations et réessayez.',
        });
      } else if (msg.includes('Email not confirmed')) {
        toast.error('Email non confirmé.', {
          description: 'Vérifiez votre boîte mail pour confirmer votre compte.',
        });
      } else {
        toast.error('Erreur de connexion.', { description: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {/* Background */}
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(/1.jpeg)' }} />
      <div className="absolute inset-0 hero-overlay" />

      <div className="relative z-10 w-full max-w-md mx-auto px-4 py-8">
        {/* Logo */}
        <div className="text-center mb-6">
          <img
            src="/logo_app.jpg"
            alt="Le Continent"
            className="w-20 h-20 rounded-full object-cover border-4 border-[#FFD700] mx-auto shadow-xl"
          />
          <h1 className="text-white font-extrabold text-2xl mt-3">
            Le <span className="text-[#FFD700]">Continent</span>
          </h1>
        </div>

        {/* Card */}
        <div className="bg-[#FFF8DC]/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
          <h2 className="text-2xl font-extrabold text-[#8B0000] text-center mb-1">Se connecter</h2>
          <p className="text-center text-[#4B0082] text-sm mb-6">Accédez à votre espace culturel</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <Label className="text-[#8B0000] font-semibold text-sm">Email ou numéro de téléphone</Label>
              <Input
                type="text"
                placeholder="votre@email.com ou +237XXXXXXXXX"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="mt-1.5 border-[#8B0000]/40 bg-white focus-visible:ring-[#8B0000] h-12"
                disabled={loading}
                autoComplete="username"
              />
              <p className="text-xs text-gray-400 mt-1">
                Si inscrit sans email, entrez votre numéro complet (ex: +237612345678)
              </p>
            </div>

            <div>
              <Label className="text-[#8B0000] font-semibold text-sm">Mot de passe</Label>
              <div className="relative mt-1.5">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-[#8B0000]/40 bg-white focus-visible:ring-[#8B0000] h-12 pr-10"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B0000]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF8C00] hover:bg-[#E07B00] text-white font-bold h-12 rounded-xl flex items-center gap-2 justify-center text-base"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  <LogIn size={18} /> Connexion
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-200 text-center">
            <p className="text-[#4B0082] text-sm mb-3">Pas encore de compte ?</p>
            <Link to="/inscription">
              <Button className="w-full bg-[#8B0000] hover:bg-[#6B0000] text-white font-bold h-12 rounded-xl">
                Créer mon compte gratuitement
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
