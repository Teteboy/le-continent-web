import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, CheckCircle, ChevronDown, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { generatePromoCode } from '@/lib/promoCode';
import PromoCodeModal from '@/components/auth/PromoCodeModal';
import { COUNTRY_CODES, DEFAULT_COUNTRY, type CountryCode } from '@/data/countryCodes';

export default function SignupPage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(DEFAULT_COUNTRY);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [showPromo, setShowPromo] = useState(false);
  const [generatedLoginEmail, setGeneratedLoginEmail] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const navigate = useNavigate();

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const getFullPhone = () => {
    const digits = form.phone.replace(/\D/g, '');
    return `${selectedCountry.dialCode}${digits}`;
  };

  const validate = (): string | null => {
    if (!form.firstName.trim()) {
      return 'Le prénom est requis.';
    }
    if (!form.lastName.trim()) {
      return 'Le nom est requis.';
    }
    if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 6) {
      return 'Le numéro de téléphone est requis (minimum 6 chiffres).';
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return "L'adresse e-mail n'est pas valide.";
    }
    if (!form.password || form.password.length < 6) {
      return 'Le mot de passe doit contenir au moins 6 caractères.';
    }
    if (form.password !== form.confirmPassword) {
      return 'Les mots de passe ne correspondent pas.';
    }
    return null;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setLoading(true);
    try {
      const fullPhone = getFullPhone();
      const phoneDigits = fullPhone.replace(/\D/g, '');
      const authEmail = form.email.trim()
        ? form.email.trim().toLowerCase()
        : `p${phoneDigits}@lc.app`;

      const code = generatePromoCode();

      // Process referral if code provided
      let referredById: string | null = null;
      if (referralCode.trim()) {
        const { data: referrerData, error: referrerError } = await supabase
          .from('profiles')
          .select('id, promo_code')
          .eq('promo_code', referralCode.trim())
          .single();
        
        if (!referrerError && referrerData) {
          referredById = referrerData.id;
        }
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: authEmail,
        password: form.password,
        options: {
          data: {
            first_name: form.firstName.trim(),
            last_name: form.lastName.trim(),
            phone: fullPhone,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Échec de la création du compte.');

      await supabase.from('profiles').upsert(
        {
          id: authData.user.id,
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          phone: fullPhone,
          email: form.email.trim() ? form.email.trim().toLowerCase() : null,
          is_premium: false,
          promo_code: code,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          avatar_url: null,
          referred_by: referredById,
          referral_earnings: 0,
          referral_count: 0,
        },
        { onConflict: 'id' }
      );

      // Create referral record if valid referral
      if (referredById) {
        await supabase.from('referrals').insert({
          referrer_id: referredById,
          referred_id: authData.user.id,
          referred_name: `${form.firstName.trim()} ${form.lastName.trim()}`,
          referred_phone: fullPhone,
          amount_paid: 0,
          referral_earnings: 0,
          created_at: new Date().toISOString(),
        });
      }

      setPromoCode(code);
      if (!form.email.trim()) {
        setGeneratedLoginEmail(authEmail);
      }
      toast.success('Compte créé avec succès ! 🎉');
      setShowPromo(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la création du compte.';
      if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('User already registered')) {
        toast.error('Un compte existe déjà avec ce contact.', {
          description: 'Essayez de vous connecter ou utilisez un autre numéro/email.',
        });
      } else if (msg.includes('Password')) {
        toast.error('Mot de passe non sécurisé.', {
          description: 'Utilisez au moins 6 caractères.',
        });
      } else {
        toast.error('Erreur lors de la création du compte.', { description: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePromoClose = () => {
    setShowPromo(false);
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(/2.jpeg)' }} />
      <div className="absolute inset-0 hero-overlay" />

      <div className="relative z-10 w-full max-w-lg mx-auto px-4 py-10">
        {/* Logo */}
        <div className="text-center mb-5">
          <img
            src="/logo_app.jpg"
            alt="Le Continent"
            className="w-16 h-16 rounded-full object-cover border-4 border-[#FFD700] mx-auto shadow-xl"
          />
          <h1 className="text-white font-extrabold text-xl mt-2">
            Le <span className="text-[#FFD700]">Continent</span>
          </h1>
        </div>

        <div className="bg-[#FFF8DC]/95 backdrop-blur-sm rounded-2xl p-6 sm:p-7 shadow-2xl">
          <h2 className="text-2xl font-extrabold text-[#8B0000] text-center mb-1">Inscription</h2>
          <p className="text-center text-[#4B0082] text-sm mb-4">Rejoignez la communauté Le Continent</p>

          {/* Promo notice */}
          <div className="flex items-center gap-2 bg-[#FFD700]/20 border border-[#FFD700] rounded-xl px-4 py-2.5 mb-5 text-sm">
            <CheckCircle size={16} className="text-[#8B0000] shrink-0" />
            <span className="text-[#8B0000] font-semibold">Un code de parrainage vous sera offert à l'inscription !</span>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'firstName', label: 'Prénom', placeholder: 'Prénom' },
                { key: 'lastName', label: 'Nom', placeholder: 'Nom' },
              ].map((f) => (
                <div key={f.key}>
                  <Label className="text-[#8B0000] font-semibold text-sm">
                    {f.label} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder={f.placeholder}
                    value={form[f.key as keyof typeof form]}
                    onChange={set(f.key)}
                    className="mt-1 border-[#8B0000]/40 bg-white focus-visible:ring-[#8B0000] h-11"
                    disabled={loading}
                  />
                </div>
              ))}
            </div>

            {/* Phone number with country code */}
            <div>
              <Label className="text-[#8B0000] font-semibold text-sm">
                Numéro de téléphone <span className="text-red-500">*</span>
              </Label>
              <div className="mt-1 flex gap-0 h-11">
                {/* Country Code Select */}
                <div className="relative shrink-0">
                  <select
                    value={selectedCountry.iso}
                    onChange={(e) => {
                      const country = COUNTRY_CODES.find((c) => c.iso === e.target.value);
                      if (country) setSelectedCountry(country);
                    }}
                    disabled={loading}
                    className="h-full pl-2 pr-7 border border-r-0 border-[#8B0000]/40 bg-white rounded-l-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8B0000] appearance-none cursor-pointer disabled:opacity-50"
                    style={{ minWidth: '90px', maxWidth: '90px' }}
                    aria-label="Indicatif téléphonique"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.iso} value={c.iso}>
                        {c.flag} {c.dialCode}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={13}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                  />
                </div>
                {/* Phone input */}
                <Input
                  type="tel"
                  placeholder="6XXXXXXXX"
                  value={form.phone}
                  onChange={set('phone')}
                  className="h-11 rounded-l-none border-l-0 border-[#8B0000]/40 bg-white focus-visible:ring-[#8B0000] flex-1"
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {selectedCountry.name} ({selectedCountry.dialCode}) — entrez votre numéro sans l'indicatif
              </p>
            </div>

            {/* Email (optional) */}
            <div>
              <Label className="text-[#8B0000] font-semibold text-sm flex items-center gap-2">
                Adresse e-mail
                <span className="text-gray-400 font-normal text-xs">(Optionnel)</span>
              </Label>
              <Input
                type="email"
                placeholder="votre@email.com"
                value={form.email}
                onChange={set('email')}
                className="mt-1 border-[#8B0000]/40 bg-white focus-visible:ring-[#8B0000] h-11"
                disabled={loading}
              />
              <p className="text-xs text-gray-400 mt-1">
                Si vous n'avez pas d'email, vous pourrez vous connecter avec votre numéro de téléphone.
              </p>
            </div>

            {/* Password */}
            {[
              {
                key: 'password',
                label: 'Mot de passe',
                show: showPass,
                toggle: () => setShowPass((v) => !v),
                placeholder: 'Minimum 6 caractères',
              },
              {
                key: 'confirmPassword',
                label: 'Confirmer le mot de passe',
                show: showConfirm,
                toggle: () => setShowConfirm((v) => !v),
                placeholder: 'Confirmez votre mot de passe',
              },
            ].map((f) => (
              <div key={f.key}>
                <Label className="text-[#8B0000] font-semibold text-sm">
                  {f.label} <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1">
                  <Input
                    type={f.show ? 'text' : 'password'}
                    placeholder={f.placeholder}
                    value={form[f.key as keyof typeof form]}
                    onChange={set(f.key)}
                    className="border-[#8B0000]/40 bg-white focus-visible:ring-[#8B0000] h-11 pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={f.toggle}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B0000]"
                  >
                    {f.show ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
            ))}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#8B0000] hover:bg-[#6B0000] text-white font-bold h-12 rounded-xl flex items-center gap-2 justify-center text-base mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <UserPlus size={18} /> Créer mon compte
                </>
              )}
            </Button>

            {/* Referral Code (optional) */}
            <div className="bg-[#27AE60]/10 border border-[#27AE60]/30 rounded-xl p-4">
              <Label className="text-[#27AE60] font-semibold text-sm flex items-center gap-2">
                <Gift size={14} /> Code de parrainage (optionnel)
              </Label>
              <p className="text-xs text-gray-500 mb-2 mt-1">
                Entrez le code de parrainage d'un ami pour bénéficier d'une réduction et l'aider à gagner des commissions.
              </p>
              <Input
                type="text"
                placeholder="CONTINENT-XXXXXX"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase().trim())}
                className="border-[#27AE60]/40 bg-white focus-visible:ring-[#27AE60] h-10"
                disabled={loading}
              />
            </div>
          </form>

          <div className="mt-5 pt-5 border-t border-gray-200 text-center">
            <p className="text-[#4B0082] text-sm mb-3">Déjà un compte ?</p>
            <Link to="/login">
              <Button
                variant="outline"
                className="w-full border-[#27AE60] text-[#27AE60] hover:bg-[#27AE60] hover:text-white h-11 rounded-xl font-bold"
              >
                Se connecter
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <PromoCodeModal
        open={showPromo}
        onClose={handlePromoClose}
        promoCode={promoCode}
        firstName={form.firstName}
        loginEmail={generatedLoginEmail}
      />
    </div>
  );
}
