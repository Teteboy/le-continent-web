import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#8B0000] to-[#2C3E50] py-12 px-4">
      <div className="max-w-lg mx-auto bg-white rounded-2xl overflow-hidden shadow-2xl text-center">
        {/* Success Icon */}
        <div className="py-8">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale">
            <Check size={40} className="text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Paiement Réussi !
          </h1>
          <p className="text-gray-500 mb-6">
            Merci pour votre paiement. Votre accès premium est maintenant activé.
          </p>
          
          {/* Payment Details */}
          <div className="bg-gray-50 rounded-xl p-4 mx-6 mb-6 text-left">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-500">Statut</span>
              <span className="text-green-600 font-semibold">✓ Confirmé</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-500">Montant</span>
              <span className="font-semibold">1 500 XAF</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Date</span>
              <span className="font-semibold">
                {new Date().toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
          
          {/* Home Button */}
          <Link 
            to="/"
            className="inline-block bg-[#8B0000] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#6B0000] transition-colors"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
      
        <style>{`
          @keyframes scale {
            0% { transform: scale(0); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
          }
          .animate-scale {
            animation: scale 0.5s ease-out;
          }
        `}</style>
    </div>
  );
}
