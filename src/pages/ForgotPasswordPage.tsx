import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Lock, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL
  : (import.meta.env.DEV ? 'http://localhost:3000' : 'https://api.lecontinent.cm');

type Step = 'phone' | 'verify' | 'newPassword';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone.trim()) {
      toast.error('Numéro de téléphone requis.', { description: 'Veuillez entrer votre numéro de téléphone.' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi du code');
      }

      toast.success('Code envoyé par SMS !', {
        description: 'Entrez le code reçu sur votre téléphone.',
      });
      setStep('verify');
    } catch (err) {
      console.error('Send code error:', err);
      toast.error('Erreur.', {
        description: 'Veuillez vérifier votre numéro et réessayer.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      toast.error('Code requis.', { description: 'Veuillez entrer le code reçu par SMS.' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/verify-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), code: code.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Code invalide');
      }

      setUserId(data.userId);
      toast.success('Code vérifié !', {
        description: 'Entrez votre nouveau mot de passe.',
      });
      setStep('newPassword');
    } catch (err) {
      console.error('Verify code error:', err);
      toast.error('Code invalide.', {
        description: 'Veuillez vérifier le code et réessayer.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword) {
      toast.error('Mot de passe requis.', { description: 'Veuillez entrer un nouveau mot de passe.' });
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Mot de passe trop court.', { description: 'Le mot de passe doit contenir au moins 6 caractères.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas.', { description: 'Veuillez vérifier que les deux mots de passe sont identiques.' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          code: code.trim(), 
          newPassword 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la réinitialisation');
      }

      toast.success('Mot de passe mis à jour !', {
        description: 'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.',
      });
      navigate('/login');
    } catch (err) {
      console.error('Reset password error:', err);
      toast.error('Erreur.', {
        description: 'Veuillez réessayer.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF8DC] p-4">
      <div className="w-full max-w-md">
        <Link
          to="/login"
          className="flex items-center gap-2 text-[#8B0000] hover:text-[#A52A2A] font-semibold mb-6 transition-colors"
        >
          <ArrowLeft size={18} />
          Retour à la connexion
        </Link>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[#8B0000]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              {step === 'phone' && <Phone className="w-8 h-8 text-[#8B0000]" />}
              {step === 'verify' && <Lock className="w-8 h-8 text-[#8B0000]" />}
              {step === 'newPassword' && <Lock className="w-8 h-8 text-[#8B0000]" />}
            </div>
            
            {step === 'phone' && (
              <>
                <h1 className="text-2xl font-black text-[#2C3E50]">
                  Mot de passe oublié ?
                </h1>
                <p className="text-gray-600 mt-2">
                  Entrez votre numéro de téléphone et nous vous enverrons un code par SMS.
                </p>
              </>
            )}

            {step === 'verify' && (
              <>
                <h1 className="text-2xl font-black text-[#2C3E50]">
                  Vérification
                </h1>
                <p className="text-gray-600 mt-2">
                  Entrez le code à 6 chiffres envoyé à votre téléphone.
                </p>
              </>
            )}

            {step === 'newPassword' && (
              <>
                <h1 className="text-2xl font-black text-[#2C3E50]">
                  Nouveau mot de passe
                </h1>
                <p className="text-gray-600 mt-2">
                  Créez un nouveau mot de passe pour votre compte.
                </p>
              </>
            )}
          </div>

          {step === 'phone' && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <Label htmlFor="phone" className="text-[#2C3E50] font-semibold">
                  Numéro de téléphone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="6XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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
                    Envoi...
                  </>
                ) : (
                  <>
                    Envoyer le code
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          )}

          {step === 'verify' && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <Label htmlFor="code" className="text-[#2C3E50] font-semibold">
                  Code de vérification
                </Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="XXXXXX"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="mt-1 h-12 text-center text-2xl tracking-widest border-gray-300 rounded-xl focus:ring-[#8B0000] focus:border-[#8B0000]"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || code.length < 6}
                className="w-full h-12 bg-[#8B0000] hover:bg-[#A52A2A] text-white font-bold rounded-xl"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Vérification...
                  </>
                ) : (
                  <>
                    Vérifier le code
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full text-sm text-gray-500 hover:text-[#8B0000]"
              >
                Changer de numéro de téléphone
              </button>
            </form>
          )}

          {step === 'newPassword' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <Label htmlFor="newPassword" className="text-[#2C3E50] font-semibold">
                  Nouveau mot de passe
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 h-12 border-gray-300 rounded-xl focus:ring-[#8B0000] focus:border-[#8B0000]"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-[#2C3E50] font-semibold">
                  Confirmer le mot de passe
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 h-12 border-gray-300 rounded-xl focus:ring-[#8B0000] focus:border-[#8B0000]"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || newPassword.length < 6}
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
          )}
        </div>
      </div>
    </div>
  );
}
