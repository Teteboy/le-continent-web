import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Shield, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Verify admin rights
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', data.user.id)
        .single();

      if (!profile?.is_admin) {
        await supabase.auth.signOut();
        throw new Error('Accès refusé : vous n\'avez pas les droits administrateur.');
      }

      toast.success('Connexion réussie !');
      navigate('/');
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8DC] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden border-4 border-[#8B0000] shadow-lg">
            <img src="/logo_app.jpg" alt="Le Continent" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#8B0000]">Le Continent</h1>
          <p className="text-gray-500 text-sm mt-1 flex items-center justify-center gap-1.5">
            <Shield size={14} /> Espace Administrateur
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleLogin}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-4"
        >
          <div>
            <Label className="text-[#8B0000] font-semibold text-sm">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="mt-1 border-[#8B0000]/40 focus-visible:ring-[#8B0000]"
            />
          </div>

          <div>
            <Label className="text-[#8B0000] font-semibold text-sm">
              Mot de passe <span className="text-red-500">*</span>
            </Label>
            <div className="relative mt-1">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="border-[#8B0000]/40 focus-visible:ring-[#8B0000] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || !email.trim() || !password.trim()}
            className="w-full bg-[#8B0000] hover:bg-[#6B0000] text-white font-bold flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
            {loading ? 'Connexion…' : 'Se connecter'}
          </Button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          Accès réservé aux administrateurs de Le Continent
        </p>
      </div>
    </div>
  );
}
