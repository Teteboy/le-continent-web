import { Link } from 'react-router-dom';
import { ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function HeroSection() {
  const { user, profile } = useAuth();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/a.jpg)', backgroundSize: 'cover', backgroundPosition: 'center center', backgroundRepeat: 'no-repeat' }}
      />
      {/* Overlay */}
      <div className="absolute inset-0 hero-overlay" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 py-20 max-w-4xl mx-auto">
        <div className="flex justify-center mb-6">
          <img
            src="/logo_app.jpg"
            alt="Le Continent"
            className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-[#FFD700] shadow-2xl"
          />
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white mb-4 drop-shadow-lg">
          Le <span className="text-[#FFD700]">Continent</span>
        </h1>

        <p className="text-lg sm:text-xl text-[#FFD700] font-semibold mb-4 drop-shadow">
          Le Panthéon Culturel du Cameroun
        </p>

        <p className="text-base sm:text-lg text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed drop-shadow">
          Découvrez la richesse des 250+ ethnies du Cameroun, leur histoire, leurs traditions et leurs innovations à travers une plateforme culturelle unique.
        </p>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-4 mb-10">
          {[
            { num: '250+', label: 'Ethnies' },
            { num: '280+', label: 'Langues' },
            { num: '∞', label: 'Traditions' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/15 backdrop-blur-sm rounded-2xl px-6 py-3 text-center min-w-[90px]">
              <div className="text-3xl font-black text-[#FFD700]">{stat.num}</div>
              <div className="text-sm text-white font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {user ? (
            <>
              {profile?.is_premium && (
                <div className="flex items-center gap-2 bg-[#8B0000]/80 text-[#FFD700] px-5 py-2 rounded-full text-sm font-bold">
                  <Star size={16} fill="currentColor" /> Compte Premium Actif
                </div>
              )}
              <Link to="/cultures-premium">
                <Button size="lg" className="bg-[#8B0000] text-white hover:bg-[#6B0000] font-bold px-8 rounded-full flex items-center gap-2">
                  Explorer les Cultures <ArrowRight size={18} />
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/inscription">
                <Button size="lg" className="bg-[#FFD700] text-[#8B0000] hover:bg-yellow-400 font-extrabold px-8 rounded-full shadow-xl">
                  Rejoindre la Communauté
                </Button>
              </Link>
              <Link to="/cultures-premium">
                <Button size="lg" className="bg-white text-[#8B0000] hover:bg-gray-100 px-8 rounded-full font-bold">
                  Explorer les Cultures Premium
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-white/60">
        <div className="w-6 h-10 border-2 border-white/40 rounded-full flex items-start justify-center pt-2">
          <div className="w-1.5 h-3 bg-white/60 rounded-full" />
        </div>
      </div>
    </section>
  );
}
