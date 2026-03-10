import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Lock } from 'lucide-react';

export default function CheckoutPage() {
  const [selectedMethod, setSelectedMethod] = useState<'mtn' | 'orange'>('mtn');
  const [phone, setPhone] = useState('+237 672 549 955');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      // In production, this would call the payment API
      window.location.href = 'https://lecontinent.cm/payment/success';
    }, 2000);
  };

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

          {/* Payment Methods */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Méthode de paiement
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedMethod('mtn')}
                className={`flex-1 py-4 border-2 rounded-xl text-center transition-all ${
                  selectedMethod === 'mtn' 
                    ? 'border-[#8B0000] bg-red-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-bold text-yellow-500">MTN</div>
                <div className="text-xs text-gray-500">Mobile Money</div>
              </button>
              <button
                onClick={() => setSelectedMethod('orange')}
                className={`flex-1 py-4 border-2 rounded-xl text-center transition-all ${
                  selectedMethod === 'orange' 
                    ? 'border-[#8B0000] bg-red-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-bold text-orange-500">Orange</div>
                <div className="text-xs text-gray-500">Money</div>
              </button>
            </div>
          </div>

          {/* Phone Input */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Numéro de téléphone Mobile Money
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-lg focus:outline-none focus:border-[#8B0000]"
            />
          </div>

          {/* Pay Button */}
          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full bg-[#8B0000] text-white py-4 rounded-xl font-semibold text-lg hover:bg-[#6B0000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Traitement en cours...' : 'Payer 1 500 XAF'}
          </button>

          {/* Security Note */}
          <div className="flex items-center justify-center gap-2 mt-4 text-gray-400 text-sm">
            <Lock size={14} />
            <span>Paiement sécurisé par MTN et Orange Mobile Money</span>
          </div>

          {/* Back Link */}
          <Link 
            to="/" 
            className="block text-center mt-6 text-gray-500 hover:text-[#8B0000]"
          >
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
