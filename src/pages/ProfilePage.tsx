import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, Users, Trophy, Calendar, LogOut, Star,
  Copy, Check, Gift, Share2, UsersRound, DollarSign, Wallet, X,
  Loader2, TrendingUp, Award, ArrowUpRight, Pencil, Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useReferrals } from '@/hooks/useReferrals';
import { supabase } from '@/lib/supabase';
import { generatePromoCode } from '@/lib/promoCode';
import { referralApi } from '@/lib/api-client';
import PaymentModal from '@/components/payment/PaymentModal';

export default function ProfilePage() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [copiedPromo, setCopiedPromo] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'referrals'>('info');
  const [showPayment, setShowPayment] = useState(false);

  // Withdrawal modal state
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawPhone, setWithdrawPhone] = useState(profile?.phone ?? '');
  const [withdrawMethod, setWithdrawMethod] = useState<'mtn' | 'orange' | ''>('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    tribe: '',
  });
  const [editLoading, setEditLoading] = useState(false);

  // Real referrals from Supabase
  const { data: referrals = [], isLoading: referralsLoading } = useReferrals(user?.id);

  const totalEarnings = profile?.referral_earnings ?? 0;
  const totalReferrals = referrals.length;

  // Generate promo code if user doesn't have one
  const handleGeneratePromoCode = async () => {
    if (!user || profile?.promo_code) return;
    try {
      const code = generatePromoCode();
      const { error } = await supabase
        .from('profiles')
        .update({ promo_code: code })
        .eq('id', user.id);
      if (error) throw error;
      toast.success('Code promo créé !');
    } catch (err) {
      console.error('Error generating promo code:', err);
      toast.error('Erreur lors de la création du code promo');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleCopyPromo = async () => {
    if (!profile?.promo_code) return;
    try {
      await navigator.clipboard.writeText(profile.promo_code);
      setCopiedPromo(true);
      toast.success('Code copié !', { description: 'Partagez-le pour gagner des commissions.' });
      setTimeout(() => setCopiedPromo(false), 2500);
    } catch {
      toast.error('Impossible de copier.', { description: 'Copiez manuellement : ' + profile.promo_code });
    }
  };

  const handleSharePromo = async () => {
    if (!profile?.promo_code) return;
    // Include referral code as URL parameter for auto-fill on signup page
    const referralUrl = `https://lecontinent.cm/inscription?code=${profile.promo_code}`;
    const shareText = `🎉 Rejoins *Le Continent* – La plateforme culturelle du Cameroun !

Utilise mon code promo *${profile.promo_code}* pour bénéficier d'une réduction sur l'abonnement Premium à seulement 1 000FCFA.

👉 ${referralUrl}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Le Continent – Mon code promo', text: shareText });
        toast.success('Partagé avec succès !');
      } catch (err) {
        if ((err as Error).name !== 'AbortError') handleFallbackShare(shareText);
      }
    } else {
      handleFallbackShare(shareText);
    }
  };

  const handleEditProfile = async () => {
    if (!user) return;
    setEditLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: editForm.first_name.trim(),
          last_name: editForm.last_name.trim(),
          phone: editForm.phone.trim() || null,
          tribe: editForm.tribe.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      if (error) throw error;
      toast.success('Profil mis à jour !');
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setEditLoading(false);
    }
  };

  const handleFallbackShare = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Message copié !', { description: 'Collez-le dans WhatsApp ou SMS.' });
    } catch {
      toast.error('Partagez manuellement votre code : ' + profile?.promo_code);
    }
  };

   const infoRows = [
     { icon: <User size={18} className="text-[#8B0000]" />, label: 'Nom complet', value: profile ? `${profile.first_name} ${profile.last_name}` : '—' },
     { icon: <Mail size={18} className="text-[#8B0000]" />, label: 'Email', value: profile?.email || user?.email || 'Non renseigné' },
     { icon: <Phone size={18} className="text-[#8B0000]" />, label: 'Téléphone', value: profile?.phone || 'Non renseigné' },
     { icon: <Users size={18} className="text-[#8B0000]" />, label: 'Ethnie / Tribu', value: profile?.tribe || 'Non renseigné' },
     { icon: <Gift size={18} className="text-[#8B0000]" />, label: 'Code promo personnel', value: '(voir section Parrainages)' },
     { icon: <Trophy size={18} className="text-[#8B0000]" />, label: 'Statut', value: profile?.is_premium ? 'Premium' : 'Gratuit', premium: true },
     ...(profile?.last_payment_date ? [{ icon: <Calendar size={18} className="text-[#8B0000]" />, label: 'Premium depuis', value: new Date(profile.last_payment_date).toLocaleDateString('fr-FR') }] : []),
     ...(profile?.created_at ? [{ icon: <Calendar size={18} className="text-[#8B0000]" />, label: 'Membre depuis', value: new Date(profile.created_at).toLocaleDateString('fr-FR') }] : []),
   ];

  return (
    <div className="min-h-screen bg-[#FFF8DC] pt-20 pb-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#8B0000]">Mon Profil</h1>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditForm({
                    first_name: profile?.first_name || '',
                    last_name: profile?.last_name || '',
                    phone: profile?.phone || '',
                    tribe: profile?.tribe || '',
                  });
                  setIsEditing(true);
                }}
                className="flex items-center gap-1.5"
              >
                <Pencil size={14} /> Modifier
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-1"
                >
                  <X size={14} /> Annuler
                </Button>
                <Button
                  size="sm"
                  onClick={handleEditProfile}
                  disabled={editLoading}
                  className="flex items-center gap-1 bg-[#27AE60] hover:bg-[#219150]"
                >
                  {editLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Sauvegarder
                </Button>
              </div>
            )}
            {profile?.is_premium && (
              <Badge className="bg-[#FFD700] text-[#8B0000] font-bold flex items-center gap-1.5 px-3 py-1">
                <Star size={13} fill="currentColor" /> Premium
              </Badge>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'info', label: 'Mes Informations', icon: <User size={16} /> },
            { key: 'referrals', label: 'Parrainages', icon: <UsersRound size={16} />, badge: totalReferrals > 0 ? totalReferrals : undefined },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'info' | 'referrals')}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === tab.key ? 'bg-[#8B0000] text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.badge !== undefined && (
                <span className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${activeTab === tab.key ? 'bg-white text-[#8B0000]' : 'bg-[#8B0000] text-white'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'info' ? (
          <>
            {/* Avatar */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative">
                <Avatar className="w-28 h-28 sm:w-32 sm:h-32 border-4 border-[#8B0000] shadow-xl">
                  <AvatarImage src={profile?.avatar_url ?? ''} alt="Avatar" />
                  <AvatarFallback className="bg-[#FFE4B5] text-[#8B0000] text-3xl sm:text-4xl font-bold">
                    {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                {profile?.is_premium && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#8B0000] text-[#FFD700] px-3 py-0.5 rounded-full flex items-center gap-1 text-xs font-bold border-2 border-[#FFD700] whitespace-nowrap">
                    <Star size={10} fill="currentColor" /> Premium
                  </div>
                )}
              </div>
              <h2 className="mt-5 text-lg sm:text-xl font-bold text-[#2C3E50]">
                {profile?.first_name} {profile?.last_name}
              </h2>
              <p className="text-gray-500 text-sm">{profile?.email || profile?.phone}</p>
            </div>

            {/* Info card - View or Edit mode */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-[#8B0000] font-semibold text-sm">Prénom</Label>
                      <Input
                        value={editForm.first_name}
                        onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                        placeholder="Votre prénom"
                        className="mt-1 border-[#8B0000]/40 focus-visible:ring-[#8B0000]"
                      />
                    </div>
                    <div>
                      <Label className="text-[#8B0000] font-semibold text-sm">Nom</Label>
                      <Input
                        value={editForm.last_name}
                        onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                        placeholder="Votre nom"
                        className="mt-1 border-[#8B0000]/40 focus-visible:ring-[#8B0000]"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[#8B0000] font-semibold text-sm">Téléphone</Label>
                    <Input
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="+237 6XX XXX XXX"
                      className="mt-1 border-[#8B0000]/40 focus-visible:ring-[#8B0000]"
                    />
                  </div>
                  <div>
                    <Label className="text-[#8B0000] font-semibold text-sm">Ethnie / Tribu</Label>
                    <Input
                      value={editForm.tribe}
                      onChange={(e) => setEditForm({ ...editForm, tribe: e.target.value })}
                      placeholder="Votre ethnie ou tribu"
                      className="mt-1 border-[#8B0000]/40 focus-visible:ring-[#8B0000]"
                    />
                  </div>
                </div>
              ) : (
                infoRows.map((row, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-3 py-3">
                      <div className="shrink-0">{row.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#8B0000]">{row.label}</p>
                        {'premium' in row && row.premium ? (
                          <Badge className={`mt-0.5 ${profile?.is_premium ? 'bg-[#27AE60] text-white' : 'bg-gray-200 text-gray-600'} font-semibold text-sm`}>
                            {row.value}
                          </Badge>
                        ) : (
                          <p className="text-sm text-gray-800 font-medium truncate">{row.value}</p>
                        )}
                      </div>
                    </div>
                    {i < infoRows.length - 1 && <Separator />}
                  </div>
                ))
              )}
            </div>

            {/* Promo code card */}
            {profile?.promo_code ? (
              <div className="bg-white rounded-2xl shadow-sm border-2 border-[#FFD700] p-5 mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <Gift size={18} className="text-[#8B0000]" />
                  <h3 className="font-bold text-[#8B0000]">Mon Code de Parrainage</h3>
                </div>
                <div className="bg-[#FFF8DC] border border-[#8B0000]/20 rounded-xl p-4 mb-3">
                  <p className="text-xs text-gray-400 mb-1">Votre code exclusif</p>
                  <p className="text-2xl font-black text-[#8B0000] tracking-widest">{profile.promo_code}</p>
                </div>
                <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                  Partagez votre code avec vos proches. Dès qu'ils passent Premium (1 000FCFA), vous recevez <strong className="text-[#27AE60]">500FCFA</strong> de commission automatiquement ! 🇨🇲
                </p>
                <div className="flex gap-3">
                  <Button onClick={handleCopyPromo} variant="outline" className="flex-1 border-[#8B0000]/30 text-[#8B0000] hover:bg-[#8B0000] hover:text-white h-11 rounded-xl font-semibold flex items-center gap-2 justify-center text-sm transition-colors">
                    {copiedPromo ? <><Check size={16} className="text-[#27AE60]" /> Copié !</> : <><Copy size={16} /> Copier</>}
                  </Button>
                  <Button onClick={handleSharePromo} className="flex-1 bg-[#27AE60] hover:bg-[#219A52] text-white h-11 rounded-xl font-semibold flex items-center gap-2 justify-center text-sm">
                    <Share2 size={16} /> Partager
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['📱 WhatsApp', '💬 SMS', '📘 Facebook'].map((s) => (
                    <button key={s} onClick={handleSharePromo} className="text-xs text-gray-500 hover:text-[#8B0000] bg-gray-100 hover:bg-[#8B0000]/10 px-2.5 py-1 rounded-full transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-5 mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <Gift size={18} className="text-gray-400" />
                  <h3 className="font-bold text-gray-500">Code de Parrainage</h3>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-3">
                  <p className="text-xs text-gray-400 mb-2">Générez votre code promo pour commencer à parrainer vos amis et gagner des commissions.</p>
                  <p className="text-xs text-gray-500">
                    <strong className="text-[#27AE60]">500FCFA</strong> par filleul qui passe Premium !
                  </p>
                </div>
                <Button 
                  onClick={handleGeneratePromoCode} 
                  className="w-full bg-[#8B0000] hover:bg-[#6B0000] text-white font-bold h-11 rounded-xl flex items-center gap-2 justify-center"
                >
                  <Gift size={16} /> Générer mon code
                </Button>
              </div>
            )}

            {/* Upgrade CTA for free users */}
            {!profile?.is_premium && (
              <div className="bg-gradient-to-r from-[#8B0000] to-[#6B0000] rounded-2xl p-5 mb-5 text-center">
                <Star size={28} className="text-[#FFD700] mx-auto mb-2" fill="currentColor" />
                <h3 className="text-white font-bold text-base mb-1">Passez Premium — 1 000FCFA</h3>
                <p className="text-white/70 text-xs mb-4">Accès illimité à tout le contenu culturel</p>
                <Button
                  onClick={() => setShowPayment(true)}
                  className="bg-[#FFD700] text-[#8B0000] hover:bg-yellow-400 font-extrabold text-sm px-6 h-10 rounded-xl"
                >
                  Débloquer Premium →
                </Button>
              </div>
            )}

            {/* Logout */}
            <Button onClick={handleSignOut} className="w-full bg-[#FF4500] hover:bg-[#D93A00] text-white font-bold h-12 rounded-xl flex items-center gap-2 justify-center shadow-md">
              <LogOut size={18} /> Se déconnecter
            </Button>
          </>
        ) : (
          <>
            {/* Referral Stats */}
            <div className="bg-gradient-to-br from-[#27AE60] to-[#1E8449] rounded-2xl p-6 mb-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-white/70 text-xs uppercase tracking-wider mb-1">Total des gains</p>
                  <p className="text-4xl font-black">{totalEarnings.toLocaleString('fr-FR')} <span className="text-xl">FCFA</span></p>
                </div>
                <div className="w-14 h-14 bg-white/15 rounded-full flex items-center justify-center">
                  <TrendingUp size={28} className="text-white" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black">{totalReferrals}</p>
                  <p className="text-white/70 text-xs">Filleuls</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black">500</p>
                  <p className="text-white/70 text-xs">FCFA/filleul</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black">50%</p>
                  <p className="text-white/70 text-xs">Commission</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="bg-white/10 rounded-xl px-4 py-2 mb-3 flex items-center gap-2">
                  <Wallet size={14} className="text-white/80 shrink-0" />
                  <p className="text-white/90 text-xs font-medium">
                    Retrait possible à partir de <span className="font-black text-white">2 000 FCFA</span>
                  </p>
                </div>
                {totalEarnings >= 2000 ? (
                  <Button
                    onClick={() => setShowWithdraw(true)}
                    className="w-full bg-white text-[#27AE60] hover:bg-gray-100 font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                  >
                    <DollarSign size={18} /> Retirer mes gains ({totalEarnings.toLocaleString('fr-FR')} FCFA)
                  </Button>
                ) : (
                  <Button
                    disabled
                    className="w-full bg-white/30 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    <DollarSign size={18} /> Encore {(2000 - totalEarnings).toLocaleString('fr-FR')} FCFA avant le retrait
                  </Button>
                )}
              </div>
            </div>

            {/* How it works */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Award size={18} className="text-[#8B0000]" />
                <h3 className="font-bold text-[#2C3E50]">Comment ça marche ?</h3>
              </div>
              <div className="space-y-3">
                {[
                  { step: '1', text: 'Partagez votre code promo avec vos amis', color: 'bg-[#8B0000]' },
                  { step: '2', text: "Votre ami s'inscrit avec votre code", color: 'bg-[#2980B9]' },
                  { step: '3', text: 'Il passe Premium à 1 000FCFA', color: 'bg-[#E67E22]' },
                  { step: '4', text: 'Vous receve 500FCFA automatiquement !', color: 'bg-[#27AE60]' },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3">
                    <span className={`${item.color} text-white w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5`}>{item.step}</span>
                    <p className="text-sm text-gray-600">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Share CTA */}
            {profile?.promo_code && (
              <div className="bg-[#FFF8DC] border-2 border-[#FFD700] rounded-2xl p-5 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Gift size={18} className="text-[#8B0000]" />
                  <h3 className="font-bold text-[#8B0000]">Votre code de parrainage</h3>
                </div>
                <div className="bg-white border border-[#8B0000]/20 rounded-xl px-4 py-3 mb-3 font-black text-xl text-[#8B0000] tracking-widest text-center">
                  {profile.promo_code}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCopyPromo} variant="outline" className="flex-1 border-[#8B0000]/30 text-[#8B0000] hover:bg-[#8B0000] hover:text-white h-10 rounded-xl font-semibold text-sm flex items-center gap-1.5 justify-center">
                    {copiedPromo ? <Check size={14} /> : <Copy size={14} />} Copier
                  </Button>
                  <Button onClick={handleSharePromo} className="flex-1 bg-[#8B0000] hover:bg-[#6B0000] text-white h-10 rounded-xl font-semibold text-sm flex items-center gap-1.5 justify-center">
                    <Share2 size={14} /> Partager
                  </Button>
                </div>
              </div>
            )}

            {/* Referral list */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-[#2C3E50]">Historique des parrainages</h3>
                  <p className="text-xs text-gray-500">Personnes référencées via votre code</p>
                </div>
                {referrals.length > 0 && (
                  <Badge variant="secondary" className="font-semibold">{referrals.length} filleul{referrals.length > 1 ? 's' : ''}</Badge>
                )}
              </div>

              {referralsLoading ? (
                <div className="p-8 flex items-center justify-center">
                  <Loader2 size={28} className="text-[#8B0000] animate-spin" />
                </div>
              ) : referrals.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {referrals.map((ref) => (
                    <div key={ref.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#8B0000]/10 rounded-full flex items-center justify-center">
                          <span className="text-[#8B0000] font-bold text-sm">{ref.referred_name?.[0] ?? '?'}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-[#2C3E50] text-sm">{ref.referred_name}</p>
                          <p className="text-xs text-gray-500">{ref.referred_phone}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {ref.referral_earnings > 0 ? (
                          <p className="font-bold text-[#27AE60] text-sm flex items-center gap-1">
                            <ArrowUpRight size={13} /> {ref.referral_earnings}FCFA
                          </p>
                        ) : (
                          <Badge variant="secondary" className="text-xs text-gray-500">En attente</Badge>
                        )}
                        <p className="text-xs text-gray-400">{new Date(ref.created_at).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <UsersRound size={40} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm font-semibold">Aucun parrainage pour le moment</p>
                  <p className="text-gray-400 text-xs mt-1">Partagez votre code pour commencer à gagner</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Payment Modal */}
      <PaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        onSuccess={() => setShowPayment(false)}
        userPhone={profile?.phone}
        userName={`${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`}
      />

      {/* Withdrawal Modal */}
      {showWithdraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowWithdraw(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <button onClick={() => setShowWithdraw(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={22} />
            </button>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#27AE60]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet size={32} className="text-[#27AE60]" />
              </div>
              <h3 className="text-xl font-bold text-[#2C3E50]">Retrait de gains</h3>
              <p className="text-gray-500 text-sm mt-1">
                Solde disponible : <span className="font-bold text-[#27AE60]">{totalEarnings.toLocaleString('fr-FR')} FCFA</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">Minimum de retrait : 2 000 FCFA</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-[#8B0000] font-semibold text-sm">Numéro Mobile Money</Label>
                <Input
                  type="tel"
                  placeholder="6XX XXX XXX"
                  value={withdrawPhone}
                  onChange={(e) => setWithdrawPhone(e.target.value)}
                  className="mt-1 border-[#8B0000]/40 focus-visible:ring-[#8B0000] h-11"
                />
                <p className="text-xs text-gray-400 mt-1">Numéro où vous souhaitez recevoir vos gains</p>
              </div>
              <div>
                <Label className="text-[#8B0000] font-semibold text-sm">Opérateur</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {[
                    { id: 'mtn', logo: '/mtn.webp', label: 'MTN' },
                    { id: 'orange', logo: '/orange.webp', label: 'Orange' },
                  ].map((op) => (
                    <button
                      key={op.id}
                      onClick={() => setWithdrawMethod(op.id as 'mtn' | 'orange')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${withdrawMethod === op.id ? 'border-[#27AE60] bg-[#27AE60]/5' : 'border-gray-200 hover:border-[#27AE60]/40'}`}
                    >
                      <img src={op.logo} alt={op.label} className="h-8 object-contain" />
                      <span className="text-xs font-semibold text-gray-700">{op.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <Button
                onClick={async () => {
                  if (!withdrawPhone.trim()) { toast.error('Entrez votre numéro Mobile Money'); return; }
                  if (!withdrawMethod) { toast.error('Sélectionnez un opérateur'); return; }
                  if (totalEarnings < 2000) { toast.error('Minimum de retrait : 2 000 FCFA'); return; }
                  setWithdrawLoading(true);
                  try {
                    const res = await referralApi.withdraw({
                      userId: user!.id,
                      phone: withdrawPhone.trim(),
                      method: withdrawMethod as 'mtn' | 'orange',
                    }) as { data?: { success?: boolean; message?: string; error?: string }; success?: boolean; error?: string };
                    if (res.data?.success || res.success) {
                      setShowWithdraw(false);
                      toast.success('Demande de retrait soumise !', {
                        description: res.data?.message || `${totalEarnings} FCFA seront transférés sur ${withdrawPhone} sous 24-48h.`,
                      });
                      // Refresh profile to reflect updated earnings
                      window.location.reload();
                    } else {
                      toast.error(res.data?.error || res.error || 'Échec de la demande de retrait');
                    }
                  } catch (err: any) {
                    toast.error(err?.message || 'Erreur réseau. Réessayez.');
                  } finally {
                    setWithdrawLoading(false);
                  }
                }}
                disabled={withdrawLoading || totalEarnings < 2000}
                className="w-full bg-[#27AE60] hover:bg-[#219A52] text-white font-bold h-12 rounded-xl flex items-center justify-center gap-2"
              >
                {withdrawLoading ? (
                  <><Loader2 size={16} className="animate-spin" /> Traitement...</>
                ) : (
                  <><Wallet size={18} /> Confirmer le retrait — {totalEarnings}FCFA</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
