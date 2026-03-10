import { Link } from 'react-router-dom';
import { MapPin, Mail, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#2C3E50] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/logo_app.jpg"
                alt="Le Continent"
                className="w-12 h-12 rounded-full object-cover border-2 border-[#FFD700] shrink-0"
              />
              <div>
                <h3 className="text-xl font-extrabold text-[#FFD700]">Le Continent</h3>
                <p className="text-xs text-white/60">Le Panthéon Culturel du Cameroun</p>
              </div>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              Préservons et célébrons ensemble la richesse culturelle du Cameroun à travers ses 250+ ethnies, langues et traditions.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <img src="/drapeau.png" alt="Drapeau Cameroun" className="w-8 h-5 object-cover rounded" />
              <span className="text-xs text-white/60">Fièrement Camerounais 🇨🇲</span>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-[#FFD700] font-bold text-sm uppercase tracking-wider mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: 'Accueil', href: '/cultures' },
                { label: 'Contenu Gratuit', href: '/cultures-premium' },
                { label: 'Mon Profil', href: '/profile' },
              ].map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-white/70 hover:text-[#FFD700] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-[#FFD700] font-bold text-sm uppercase tracking-wider mb-4">Informations</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: 'À Propos de Nous', href: '/about' },
                { label: 'Contactez-nous', href: '/contact' },
                { label: 'Politique de confidentialité', href: '/privacy' },
                { label: 'Conditions d\'utilisation', href: '/terms' },
              ].map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-white/70 hover:text-[#FFD700] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[#FFD700] font-bold text-sm uppercase tracking-wider mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-start gap-2">
                <MapPin size={14} className="text-[#FFD700] shrink-0 mt-0.5" />
                <span>Rue de la Culture 12<br />Douala, Cameroun</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-[#FFD700] shrink-0" />
                contact@lecontinent.cm
              </li>
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-[#FFD700] shrink-0" />
                +237 672 549 955
              </li>
            </ul>
            <div className="mt-4 p-3 bg-white/10 rounded-xl">
              <p className="text-xs text-white/60 mb-2">Paiement sécurisé par</p>
              <div className="flex items-center gap-3">
                <img src="/mtn.webp" alt="MTN Mobile Money" className="h-6 object-contain" />
                <img src="/orange.webp" alt="Orange Money" className="h-6 object-contain" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <p>© {new Date().getFullYear()} Le Continent. Tous droits réservés.</p>
          <div className="flex items-center gap-4">
            <Link to="/about" className="hover:text-white/70 transition-colors">À Propos</Link>
            <Link to="/contact" className="hover:text-white/70 transition-colors">Contact</Link>
          </div>
          <p>Fait avec ❤️ pour la culture camerounaise</p>
        </div>
      </div>
    </footer>
  );
}
