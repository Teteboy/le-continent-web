import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { toast } from 'sonner';

export default function PaymentCancelPage() {
  // Clean up any pending payment data on mount and show notification
  useEffect(() => {
    localStorage.removeItem('pending_payment');
    
    // Show cancel notification to user
    toast.info('Paiement annulé', {
      description: 'Aucune somme n\'a été prélevée sur votre compte. Vous pouvez réessayer à tout moment.',
      duration: 5000,
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-600 to-gray-900 py-12 px-4">
      <div className="max-w-lg mx-auto bg-white rounded-2xl overflow-hidden shadow-2xl text-center">
        {/* Cancel Icon */}
        <div className="py-8 px-6">
          <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <X size={40} className="text-white" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Paiement Annulé
          </h1>
          <p className="text-gray-500 mb-6">
            Le paiement a été annulé. Aucune somme n'a été prélevée sur votre compte.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="bg-[#8B0000] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#6B0000] transition-colors"
            >
              Retour à l'accueil
            </Link>
            <Link
              to="/cultures-premium"
              className="border-2 border-[#8B0000] text-[#8B0000] px-6 py-3 rounded-xl font-semibold hover:bg-[#8B0000] hover:text-white transition-colors"
            >
              Réessayer
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
