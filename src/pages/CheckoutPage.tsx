import { Link } from 'react-router-dom';
import { Check, AlertCircle, MapPin } from 'lucide-react';

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#8B0000] to-[#2C3E50] py-12 px-4">
      <div className="max-w-lg mx-auto bg-white rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-[#8B0000] text-white py-8 px-6 text-center">
          <h1 className="text-2xl font-bold mb-2">✨ Devenez Premium</h1>
          <p className="opacity-90">Accédez à tout le contenu exclusif</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Price */}
          <div className="text-center mb-8">
            <span className="text-5xl font-extrabold text-gray-900">1 500</span>
            <span className="text-xl text-gray-500"> XAF</span>
            <span className="text-green-600 font-semibold ml-2">/ mois</span>
          </div>

          {/* Features */}
          <ul className="space-y-3 mb-8">
            {[
              'Accès à tous les contenus culturels',
              'Villages, histoire, lexique complet',
              'Support prioritaire',
              'Sans publicité'
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check size={14} className="text-white" />
                </span>
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>

          {/* Payment Unavailable Notice */}
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-semibold text-amber-800">Paiement non disponible</p>
                <p className="text-sm text-amber-700 mt-1">
                  Le système de paiement est en maintenance. Veuillez nous contacter pour procéder manuellement.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-start gap-3">
              <MapPin className="text-[#8B0000] shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-semibold text-gray-800">Nos locaux</p>
                <p className="text-sm text-gray-600 mt-1">
                  Awae Laverie<br />
                  Yaoundé, Cameroun
                </p>
              </div>
            </div>
          </div>

          {/* Contact Button */}
          <Link
            to="/contact"
            className="block w-full py-4 bg-[#8B0000] hover:bg-[#6B0000] text-white font-bold text-center rounded-xl transition-colors"
          >
            Nous contacter pour paiement
          </Link>

          {/* Back Link */}
          <Link
            to="/cultures"
            className="block text-center mt-4 text-gray-500 hover:text-[#8B0000] font-medium"
          >
            Retour aux cultures
          </Link>
        </div>
      </div>
    </div>
  );
}
