import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser, setSession, setProfile } = useAuthStore();

  useEffect(() => {
    // Check if user has a valid recovery token
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // No session - redirect to login
        toast.error('Session expirée.', {
          description: 'Veuillez demander un nouveau lien de réinitialisation.',
        });
        navigate('/forgot-password');
      }
    };
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      toast.error('Mot de passe requis.', { description: 'Veuillez entrer un nouveau mot de passe.' });
      return;
    }

    if (password.length < 6) {
      toast.error('Mot de passe trop court.', { description: 'Le mot de passe doit contenir au moins 6 caractères.' });
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas.', { description: 'Veuillez vérifier que les deux mots de passe sont identiques.' });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      // Try to get the session after password update
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setSession(session);
        setUser(session.user);
        
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setProfile(profile);
        }
      }

      toast.success('Mot de passe mis à jour !', {
        description: 'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.',
      });
      
      navigate('/cultures-premium');
    } catch (err) {
      console.error('Update password error:', err);
      toast.error('Erreur lors de la mise à jour.', {
        description: 'Veuillez réessayer.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF8DC] p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[#8B0000]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-[#8B0000]" />
            </div>
            <h1 className="text-2xl font-black text-[#2C3E50]">
              Nouveau mot de passe
            </h1>
            <p className="text-gray-600 mt-2">
              Entrez votre nouveau mot de passe ci-dessous.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password" className="text-[#2C3E50] font-semibold">
                Nouveau mot de passe
              </Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pr-10 border-gray-300 rounded-xl focus:ring-[#8B0000] focus:border-[#8B0000]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-[#2C3E50] font-semibold">
                Confirmer le mot de passe
              </Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 h-12 border-gray-300 rounded-xl focus:ring-[#8B0000] focus:border-[#8B0000]"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-[#8B0000] hover:bg-[#A52A2A] text-white font-bold rounded-xl"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                'Mettre à jour le mot de passe'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
