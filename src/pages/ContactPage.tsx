import { useState } from 'react';
import { MapPin, Mail, Phone, Send, Clock, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const contactInfo = [
  {
    icon: <MapPin size={22} className="text-[#8B0000]" />,
    title: 'Adresse',
    lines: ['Rue de la Culture 12', 'Douala, Cameroun'],
  },
  {
    icon: <Mail size={22} className="text-[#8B0000]" />,
    title: 'Email',
    lines: ['contact@lecontinent.cm', 'support@lecontinent.cm'],
  },
  {
    icon: <Phone size={22} className="text-[#8B0000]" />,
    title: 'Téléphone',
    lines: ['+237 6 XX XXX XXX', 'MTN & Orange Money'],
  },
  {
    icon: <Clock size={22} className="text-[#8B0000]" />,
    title: 'Disponibilité',
    lines: ['Lun – Ven : 8h – 18h', 'Sam : 9h – 14h'],
  },
];

const faqs = [
  {
    q: "Comment fonctionne l'abonnement Premium ?",
    a: "L'abonnement Premium à 1 000 XAF vous donne accès illimité à tout le contenu de l'application : toutes les cultures, la bibliothèque complète, le dictionnaire numérique, et tous les villages culturels. C'est un accès annuel qui vous permet d'explorer l'intégralité du patrimoine culturel camerounais.",
  },
  {
    q: 'Quels moyens de paiement acceptez-vous ?',
    a: "Nous acceptons MTN Mobile Money et Orange Money pour les abonnements Premium. Les paiements sont sécurisés et vous recevez une confirmation immédiate par SMS et email.",
  },
  {
    q: 'Puis-je accéder au contenu sans abonnement ?',
    a: "Oui ! Trois cultures et plusieurs contenus sont accessibles gratuitement. L'abonnement Premium débloque l'intégralité du contenu incluant toutes les ethnies, langues, proverbes, mets traditionnels, et plus encore.",
  },
  {
    q: 'Comment obtenir mon code promo ?',
    a: "Votre code promo est généré automatiquement lors de votre inscription. Vous le trouverez dans votre espace Profil. Partagez ce code avec vos amis pour qu'ils bénéficient de 50% de réduction sur leur abonnement.",
  },
  {
    q: 'Comment partager mon code promo ?',
    a: "Dans votre profil, cliquez sur le bouton Partager à côté de votre code promo pour l'envoyer via WhatsApp, SMS ou d'autres applications. Chaque ami qui s'inscrit via votre code bénéficie de 50% de réduction.",
  },
  {
    q: "Comment télécharger un livre de la bibliothèque ?",
    a: "Accédez à la Bibliothèque depuis le menu, parcourir les catégories, puis cliquez sur un livre. Vous avez trois options : lire en ligne avec notre visionneuse intégrée, télécharger le PDF, ou ouvrir dans un nouvel onglet.",
  },
  {
    q: "Qu'est-ce que le système de villages culturels ?",
    a: "Chaque culture dispose de son propre village virtuel comprenant : l'histoire (Histoire), l'alphabet et la langue (Alphabet), les proverbes et expressions (Proverbes), les phrases utiles (Phrases), le lexique de mots clés (Lexique), et les mets traditionnels (Mets).",
  },
  {
    q: "Comment puis-je contribuer au projet ?",
    a: "Vous pouvez contribuer de plusieurs manières : en partageant l'application avec vos proches via votre code promo, en nous contactant pour suggérer des contenus culturels supplémentaires, ou en évaluant l'application sur les stores. Nous accueillons également les partenariats avec des institutions culturelles.",
  },
  {
    q: "Mes données personnelles sont-elles sécurisées ?",
    a: "Absolument. Nous accordons une grande importance à la protection de vos données. Consultez notre Politique de confidentialité pour plus de détails sur comment nous protégeons et utilisons vos informations personnelles.",
  },
  {
    q: "Comment puis-je résilier mon abonnement ?",
    a: "Vous pouvez résilier votre abonnement à tout moment depuis votre espace Profil. Votre accès Premium restera actif jusqu'à la fin de la période payée. Pour toute demande de remboursement, veuillez nous contacter directement.",
  },
  {
    q: "Proposez-vous des contenus pour les entreprises ou écoles ?",
    a: "Oui, nous proposons des formules spéciales pour les entreprises et les établissements scolaires.Contactez-nous via le formulaire pour discuter de vos besoins spécifiques en matière de formation culturelle ou d'éducation.",
  },
  {
    q: "L'application fonctionne-t-elle hors ligne ?",
    a: "Certains contenus gratuits sont accessibles hors ligne après une première consultation. Pour profiter de l'intégralité du catalogue Premium, une connexion internet est requise. Les livres téléchargés restent accessibles hors ligne.",
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error('Veuillez entrer votre nom.', { description: 'Le nom est requis.' });
      return;
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error('Adresse e-mail invalide.', { description: 'Veuillez entrer une adresse e-mail valide.' });
      return;
    }
    if (!form.subject.trim()) {
      toast.error('Veuillez indiquer un sujet.', { description: 'Le sujet est requis.' });
      return;
    }
    if (!form.message.trim() || form.message.trim().length < 10) {
      toast.error('Message trop court.', { description: 'Votre message doit contenir au moins 10 caractères.' });
      return;
    }

    setLoading(true);
    // Simulate sending
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    toast.success('Message envoyé !', {
      description: 'Nous vous répondrons dans les 24 heures. Merci !',
    });
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative h-64 sm:h-80 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/onboarding1.jpg)' }} />
        <div className="absolute inset-0 hero-overlay" />
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#FFD700]/20 text-[#FFD700] text-sm font-bold px-4 py-2 rounded-full mb-4 border border-[#FFD700]/30">
            <MessageSquare size={14} /> Contactez-nous
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white drop-shadow-lg mb-3">
            Parlons <span className="text-[#FFD700]">Culture</span>
          </h1>
          <p className="text-white/80 text-sm sm:text-base">
            Une question ? Une suggestion ? Notre équipe est là pour vous aider.
          </p>
        </div>
      </section>

      {/* Contact info cards */}
      <section className="py-12 bg-[#FFF8DC]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {contactInfo.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#8B0000]/10 rounded-full flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-[#2C3E50] text-sm">{item.title}</h3>
                </div>
                {item.lines.map((line, j) => (
                  <p key={j} className="text-gray-500 text-sm leading-relaxed">{line}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form + FAQ */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

            {/* Contact form */}
            <div>
              <div className="mb-7">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2C3E50] mb-2">
                  Envoyez-nous un <span className="text-[#8B0000]">Message</span>
                </h2>
                <p className="text-gray-500 text-sm">Nous répondons généralement dans les 24 heures ouvrées.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[#8B0000] font-semibold text-sm">Nom complet</Label>
                    <Input
                      placeholder="Votre nom"
                      value={form.name}
                      onChange={set('name')}
                      className="mt-1.5 border-[#8B0000]/40 bg-white focus-visible:ring-[#8B0000] h-11"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <Label className="text-[#8B0000] font-semibold text-sm">Adresse e-mail</Label>
                    <Input
                      type="email"
                      placeholder="votre@email.com"
                      value={form.email}
                      onChange={set('email')}
                      className="mt-1.5 border-[#8B0000]/40 bg-white focus-visible:ring-[#8B0000] h-11"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-[#8B0000] font-semibold text-sm">Sujet</Label>
                  <Input
                    placeholder="Sujet de votre message"
                    value={form.subject}
                    onChange={set('subject')}
                    className="mt-1.5 border-[#8B0000]/40 bg-white focus-visible:ring-[#8B0000] h-11"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label className="text-[#8B0000] font-semibold text-sm">Message</Label>
                  <textarea
                    placeholder="Décrivez votre demande en détail..."
                    value={form.message}
                    onChange={set('message')}
                    rows={6}
                    disabled={loading}
                    className="mt-1.5 w-full rounded-lg border border-[#8B0000]/40 bg-white px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B0000] focus:ring-offset-0 resize-none disabled:opacity-50 transition"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#8B0000] hover:bg-[#6B0000] text-white font-bold h-12 rounded-xl flex items-center gap-2 justify-center text-sm"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send size={17} /> Envoyer le message
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* FAQ */}
            <div>
              <div className="mb-7">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2C3E50] mb-2">
                  Questions <span className="text-[#8B0000]">Fréquentes</span>
                </h2>
                <p className="text-gray-500 text-sm">Trouvez rapidement une réponse à vos questions.</p>
              </div>

              <div className="space-y-3">
                {faqs.map((faq, i) => (
                  <div 
                    key={i} 
                    className={`bg-white border rounded-xl overflow-hidden transition-all duration-300 ${
                      openFaq === i 
                        ? 'border-[#8B0000] shadow-md' 
                        : 'border-gray-200 hover:border-[#8B0000]/30'
                    }`}
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex items-center justify-between p-4 text-left"
                    >
                      <span className={`font-semibold text-sm pr-4 ${openFaq === i ? 'text-[#8B0000]' : 'text-[#2C3E50]'}`}>
                        {faq.q}
                      </span>
                      {openFaq === i ? (
                        <ChevronUp size={18} className="text-[#8B0000] shrink-0" />
                      ) : (
                        <ChevronDown size={18} className="text-gray-400 shrink-0" />
                      )}
                    </button>
                    <div 
                      className={`overflow-hidden transition-all duration-300 ${
                        openFaq === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <p className="px-4 pb-4 text-gray-600 text-sm leading-relaxed">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Social channels */}
              <div className="mt-8 bg-[#2C3E50] rounded-2xl p-5 text-white">
                <h4 className="font-bold text-[#FFD700] mb-3 text-sm">Rejoignez notre communauté</h4>
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: 'WhatsApp', color: 'bg-[#25D366]', emoji: '💬' },
                    { label: 'Facebook', color: 'bg-[#1877F2]', emoji: '📘' },
                    { label: 'Instagram', color: 'bg-[#E4405F]', emoji: '📷' },
                    { label: 'YouTube', color: 'bg-[#FF0000]', emoji: '▶️' },
                  ].map((s) => (
                    <button
                      key={s.label}
                      className={`${s.color} text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 hover:opacity-90 transition-opacity`}
                    >
                      <span>{s.emoji}</span> {s.label}
                    </button>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="flex items-center gap-2">
                    <img src="/mtn.webp" alt="MTN" className="h-5 object-contain" />
                    <img src="/orange.webp" alt="Orange" className="h-5 object-contain" />
                    <span className="text-white/60 text-xs ml-1">Paiements sécurisés</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
