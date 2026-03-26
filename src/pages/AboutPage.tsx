import { Link } from 'react-router-dom';
import { ArrowRight, Globe, BookOpen, Star, Users, Heart, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const values = [
  {
    icon: <Heart size={28} className="text-[#8B0000]" />,
    title: 'Passion Culturelle',
    desc: "Nous croyons que chaque culture mérite d'être préservée, célébrée et transmise aux générations futures.",
  },
  {
    icon: <Shield size={28} className="text-[#27AE60]" />,
    title: 'Authenticité',
    desc: 'Nos contenus sont vérifiés et validés par des experts culturels et des membres des communautés locales.',
  },
  {
    icon: <Globe size={28} className="text-[#2980B9]" />,
    title: 'Accessibilité',
    desc: 'Rendre la culture camerounaise accessible à tous, partout dans le monde, en français et en langues locales.',
  },
  {
    icon: <Users size={28} className="text-[#9B59B6]" />,
    title: 'Communauté',
    desc: 'Construire un réseau de passionnés, chercheurs et gardiens du patrimoine culturel africain.',
  },
];

const stats = [
  { num: '250+', label: 'Ethnies documentées' },
  { num: '280+', label: 'Langues répertoriées' },
  { num: '5+', label: 'Années de recherche' },
  { num: '∞', label: 'Traditions vivantes' },
];

const team = [
  {
    name: 'Dr. Ngo Biyong',
    role: 'Fondateur & Directeur Culturel',
    desc: 'Anthropologue spécialisé dans les cultures camerounaises avec 15 ans d\'expérience.',
    avatar: '/a.jpg',
    initials: 'NB',
  },
  {
    name: 'Marie-Claire Fotso',
    role: 'Responsable Contenu',
    desc: 'Linguiste et ethnologue, coordinatrice de la documentation des 280+ langues camerounaises.',
    avatar: '',
    initials: 'MF',
  },
  {
    name: 'Jean-Paul Ekotto',
    role: 'Développement & Technologie',
    desc: 'Ingénieur passionné par la préservation numérique du patrimoine culturel africain.',
    avatar: '',
    initials: 'JE',
  },
];

export default function AboutPage() {
  const { user } = useAuth();
  const isLoggedIn = !!user;

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[55vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/onboarding4.jpg)' }} />
        <div className="absolute inset-0 hero-overlay" />
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto py-20">
          <div className="inline-flex items-center gap-2 bg-[#FFD700]/20 text-[#FFD700] text-sm font-bold px-4 py-2 rounded-full mb-6 border border-[#FFD700]/30">
            <Heart size={14} /> Notre Histoire
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 drop-shadow-lg">
            À Propos de <span className="text-[#FFD700]">Le Continent</span>
          </h1>
          <p className="text-white/85 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Une plateforme née de l'amour pour la richesse culturelle du Cameroun — 250+ ethnies, des traditions millénaires et un patrimoine unique au monde.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#8B0000]/10 text-[#8B0000] text-sm font-bold px-3 py-1.5 rounded-full mb-4">
                <BookOpen size={14} /> Notre Mission
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2C3E50] mb-5 leading-tight">
                Préserver et Célébrer la <span className="text-[#8B0000]">Culture Camerounaise</span>
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4 text-sm sm:text-base">
                <strong className="text-[#2C3E50]">Le Continent</strong> est né d'une conviction profonde : le patrimoine culturel camerounais est une richesse inestimable qui mérite d'être documentée, préservée et partagée avec le monde entier.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4 text-sm sm:text-base">
                Face à la mondialisation et à l'urbanisation rapide, de nombreuses traditions, langues et savoir-faire ancestraux risquent de disparaître. Notre plateforme est un espace de sauvegarde numérique et de célébration de cette diversité.
              </p>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                De la civilisation Sao aux traditions Bamiléké, des peuples Sawa du littoral aux Peuls du nord — chaque ethnie a une histoire unique à raconter. <strong className="text-[#8B0000]">Le Continent</strong> vous invite à ce voyage extraordinaire.
              </p>
              <div className="mt-6 flex items-center gap-2">
                <img src="/drapeau.png" alt="Drapeau Cameroun" className="w-8 h-5 object-cover rounded" />
                <span className="text-sm font-semibold text-[#2C3E50]">Fièrement Made in Cameroun 🇨🇲</span>
              </div>
            </div>
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3] shadow-2xl">
                <img src="/bibio.png" alt="Culture Camerounaise" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#8B0000]/50 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 bg-white/10 backdrop-blur-sm rounded-xl p-3">
                  <p className="text-white text-sm font-semibold">« La culture est l'âme d'un peuple — préservons-la ensemble »</p>
                </div>
              </div>
              {/* Floating stat */}
              <div className="absolute -top-4 -right-4 sm:-right-8 bg-[#8B0000] text-white rounded-2xl p-4 shadow-xl">
                <div className="text-3xl font-black text-[#FFD700]">250+</div>
                <div className="text-xs text-white/80">Ethnies documentées</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 bg-[#2C3E50]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl sm:text-5xl font-black text-[#FFD700] mb-2">{stat.num}</div>
                <div className="text-white/70 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 sm:py-20 bg-[#FFF8DC]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2C3E50] mb-3">
              Nos <span className="text-[#8B0000]">Valeurs</span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm sm:text-base">
              Des valeurs fondatrices qui guident chaque décision et chaque contenu que nous créons.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow text-center group">
                <div className="flex justify-center mb-4 group-hover:scale-110 transition-transform">
                  {v.icon}
                </div>
                <h3 className="font-bold text-[#2C3E50] text-base mb-2">{v.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2C3E50] mb-3">
              Notre <span className="text-[#8B0000]">Équipe</span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm sm:text-base">
              Des experts passionnés dédiés à la préservation et à la promotion de la culture camerounaise.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {team.map((member, i) => (
              <div key={i} className="text-center group">
                <div className="relative w-28 h-28 mx-auto mb-4">
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-full h-full rounded-full object-cover border-4 border-[#8B0000] shadow-lg group-hover:border-[#FFD700] transition-colors"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full border-4 border-[#8B0000] shadow-lg bg-[#8B0000]/10 flex items-center justify-center group-hover:border-[#FFD700] transition-colors">
                      <span className="text-[#8B0000] font-black text-2xl">{member.initials}</span>
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#FFD700] rounded-full flex items-center justify-center">
                    <Star size={12} className="text-[#8B0000]" fill="currentColor" />
                  </div>
                </div>
                <h3 className="font-bold text-[#2C3E50] text-base">{member.name}</h3>
                <p className="text-[#8B0000] font-semibold text-xs mb-2">{member.role}</p>
                <p className="text-gray-500 text-sm leading-relaxed">{member.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-[#8B0000] to-[#6B0000]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="text-5xl mb-4">🇨🇲</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Rejoignez <span className="text-[#FFD700]">Le Continent</span>
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto text-sm sm:text-base">
            Faites partie d'une communauté de milliers de passionnés qui célèbrent et préservent la richesse culturelle du Cameroun.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!isLoggedIn && (
              <Link to="/inscription">
                <Button size="lg" className="bg-[#FFD700] text-[#8B0000] hover:bg-yellow-400 font-extrabold px-8 rounded-full flex items-center gap-2 w-full sm:w-auto">
                  Créer un compte gratuit <ArrowRight size={18} />
                </Button>
              </Link>
            )}
            <Link to="/contact">
              <Button size="lg" className="bg-white text-[#8B0000] hover:bg-gray-100 font-extrabold px-8 rounded-full w-full sm:w-auto">
                Nous contacter
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
