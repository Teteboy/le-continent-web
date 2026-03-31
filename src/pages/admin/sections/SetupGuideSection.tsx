import { useState } from 'react';
import { Check, Copy, Database, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

const SQL_STEP_1 = `-- ÉTAPE 1 : Ajouter la colonne is_admin à la table profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Définissez vous-même comme admin (remplacez YOUR_USER_ID par votre UUID Supabase)
-- Trouvez votre UUID dans : Supabase Dashboard > Authentication > Users
UPDATE profiles SET is_admin = TRUE WHERE id = 'YOUR_USER_ID';

-- OU par email :
-- UPDATE profiles SET is_admin = TRUE WHERE email = 'votre@email.com';`;

const SQL_STEP_2 = `-- ÉTAPE 2 : Créer la table promo_codes
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'fixed' 
    CHECK (discount_type IN ('fixed', 'percentage')),
  discount_value INTEGER NOT NULL DEFAULT 0,
  max_uses INTEGER DEFAULT NULL,
  used_count INTEGER DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_is_active ON promo_codes(is_active);`;

const SQL_STEP_3 = `-- ÉTAPE 3 : Activer RLS et créer les politiques de sécurité
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- Les admins ont un accès complet
CREATE POLICY "Admin full access on promo_codes" ON promo_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = TRUE
    )
  );

-- Les utilisateurs peuvent lire les codes actifs (pour validation au paiement)
CREATE POLICY "Public can read active promo codes" ON promo_codes
  FOR SELECT USING (
    is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW())
  );`;

const SQL_STEP_4 = `-- ÉTAPE 4 : Créer la table payments (suivi des paiements)
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  original_amount INTEGER NOT NULL DEFAULT 1000,
  promo_code_id UUID REFERENCES promo_codes(id) ON DELETE SET NULL,
  promo_code TEXT,
  payment_method TEXT CHECK (payment_method IN ('mtn', 'orange')),
  phone_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin full access on payments" ON payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = TRUE
    )
  );`;

const SQL_STEP_5 = `-- ÉTAPE 5 : Activer RLS sur la table profiles (si pas encore fait)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs voient leur propre profil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Les utilisateurs peuvent modifier leur propre profil
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Les admins voient tous les profils
CREATE POLICY "Admin can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = TRUE
    )
  );

-- Les admins peuvent modifier tous les profils
CREATE POLICY "Admin can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = TRUE
    )
  );`;

interface StepProps {
  number: number;
  title: string;
  description: string;
  sql: string;
  warning?: string;
}

function SqlStep({ number, title, description, sql, warning }: StepProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(number === 1);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(sql);
    setCopied(true);
    toast.success('SQL copié !');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-[#8B0000] text-white flex items-center justify-center font-black text-sm shrink-0">
          {number}
        </div>
        <div className="flex-1">
          <p className="font-extrabold text-[#2C3E50]">{title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
        {expanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
      </button>

      {expanded && (
        <div className="px-6 pb-6">
          {warning && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
              <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-amber-700 text-xs">{warning}</p>
            </div>
          )}
          <div className="relative">
            <pre className="bg-gray-950 text-green-400 rounded-xl p-4 text-xs overflow-x-auto leading-relaxed font-mono whitespace-pre-wrap">
              {sql}
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-3 right-3 bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {copied ? <><Check size={12} /> Copié</> : <><Copy size={12} /> Copier</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SetupGuideSection() {
  const steps: StepProps[] = [
    {
      number: 1,
      title: 'Ajouter is_admin aux profils',
      description: 'Ajoute la colonne admin et définit votre compte comme administrateur',
      sql: SQL_STEP_1,
      warning: 'Remplacez YOUR_USER_ID par votre vrai UUID trouvé dans Supabase Dashboard > Authentication > Users.',
    },
    {
      number: 2,
      title: 'Créer la table promo_codes',
      description: 'Table pour gérer les codes de réduction administrateur',
      sql: SQL_STEP_2,
    },
    {
      number: 3,
      title: 'Configurer les politiques RLS (promo_codes)',
      description: 'Sécurise la table promo_codes avec Row Level Security',
      sql: SQL_STEP_3,
    },
    {
      number: 4,
      title: 'Créer la table payments',
      description: 'Table pour suivre les paiements et l\'utilisation des codes promo',
      sql: SQL_STEP_4,
    },
    {
      number: 5,
      title: 'Configurer les politiques RLS (profiles)',
      description: 'Sécurise la table profiles (à exécuter seulement si RLS non encore configuré)',
      sql: SQL_STEP_5,
      warning: 'Attention : si RLS est déjà configuré sur profiles, vérifiez que ces politiques ne créent pas de doublons. Vérifiez d\'abord dans Supabase Dashboard > Table Editor > profiles > RLS.',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-[#2C3E50]">Configuration Supabase</h2>
        <p className="text-gray-500 text-sm">Scripts SQL à exécuter dans votre Supabase SQL Editor pour activer toutes les fonctionnalités</p>
      </div>

      {/* How to guide */}
      <div className="bg-[#2C3E50] rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Database size={24} className="text-[#FFD700]" />
          <h3 className="font-extrabold text-lg">Comment exécuter ces scripts ?</h3>
        </div>
        <ol className="space-y-2">
          {[
            'Connectez-vous à votre tableau de bord Supabase (app.supabase.com)',
            'Ouvrez votre projet "le-continent" (dltkfjkodqpzmpuctnju)',
            'Dans le menu gauche, cliquez sur "SQL Editor"',
            'Cliquez sur "New query" pour créer une nouvelle requête',
            'Copiez-collez le SQL de chaque étape ci-dessous et cliquez "Run"',
            'Exécutez les étapes dans l\'ordre (1 → 5)',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-white/80">
              <span className="w-5 h-5 bg-[#FFD700] text-[#8B0000] rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* Checklist */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-extrabold text-[#2C3E50] mb-3">✅ Checklist de configuration</h3>
        <div className="space-y-2">
          {[
            { label: 'Table profiles avec colonne is_admin', done: false },
            { label: 'Votre compte défini comme admin', done: false },
            { label: 'Table promo_codes créée', done: false },
            { label: 'RLS configuré sur promo_codes', done: false },
            { label: 'Table payments créée', done: false },
            { label: 'Table villages existante', done: true },
            { label: 'Table referrals existante', done: true },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm">
              {item.done
                ? <CheckCircle size={15} className="text-[#27AE60] shrink-0" />
                : <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />}
              <span className={item.done ? 'text-gray-600' : 'text-gray-400'}>{item.label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          ⚠️ Rafraîchissez la page admin après avoir exécuté tous les scripts SQL.
        </p>
      </div>

      {/* SQL Steps */}
      <div className="space-y-3">
        {steps.map((step) => (
          <SqlStep key={step.number} {...step} />
        ))}
      </div>

      {/* Promo code flow explanation */}
      <div className="bg-[#FFF8DC] border-2 border-[#FFD700]/40 rounded-2xl p-6">
        <h3 className="font-extrabold text-[#8B0000] mb-3">💡 Comment fonctionnent les codes promo ?</h3>
        <div className="space-y-2 text-sm text-gray-700">
          {[
            '1. L\'admin crée un code promo dans cet espace (ex: LAUNCH50 pour -50% = 500 FCFA)',
            '2. L\'utilisateur saisit le code dans le formulaire de paiement',
            '3. Le système valide le code contre la table promo_codes',
            '4. Le prix est calculé et affiché avec la réduction',
            '5. Lors du paiement, le code est marqué comme utilisé (used_count + 1)',
            '6. Si max_uses est atteint, le code est automatiquement désactivé',
          ].map((step) => (
            <p key={step} className="flex items-start gap-2">
              <span className="text-[#8B0000] font-bold shrink-0">{step.split('.')[0]}.</span>
              <span>{step.split('.').slice(1).join('.')}</span>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
