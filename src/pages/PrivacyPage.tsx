import { Shield, Lock, Eye, User, Mail, Database, Share2, Trash2 } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative h-64 sm:h-80 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/onboarding2.jpg)' }} />
        <div className="absolute inset-0 hero-overlay" />
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#FFD700]/20 text-[#FFD700] text-sm font-bold px-4 py-2 rounded-full mb-4 border border-[#FFD700]/30">
            <Shield size={14} /> Sécurité
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white drop-shadow-lg mb-3">
            Politique de <span className="text-[#FFD700]">Confidentialité</span>
          </h1>
          <p className="text-white/80 text-sm sm:text-base">
            Comment nous protégeons et utilisons vos données personnelles.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-sm sm:prose max-w-none">
            
            <div className="bg-[#FFF8DC]/60 rounded-2xl p-6 mb-8 border border-[#8B0000]/10">
              <p className="text-gray-600 text-sm leading-relaxed">
                <strong>Dernière mise à jour :</strong> Mars 2025
              </p>
              <p className="text-gray-600 text-sm leading-relaxed mt-2">
                La présente Politique de confidentialité décrit comment Le Continent collecte, utilise et protège vos données personnelles. En utilisant notre application, vous acceptez les pratiques décrites dans cette politique.
              </p>
            </div>

            <div className="space-y-8">
              {/* Section 1 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-[#8B0000]/10 rounded-full flex items-center justify-center shrink-0">
                  <User size={20} className="text-[#8B0000]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#2C3E50] mb-2">1. Données que nous collectons</h2>
                  <div className="text-gray-600 text-sm leading-relaxed space-y-2">
                    <p>Nous collectons les données suivantes :</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Informations de compte :</strong> nom, adresse email, numéro de téléphone</li>
                      <li><strong>Données d'utilisation :</strong> historique de navigation, cultures consultées, temps passé sur l'application</li>
                      <li><strong>Données de paiement :</strong> historique des transactions (les données bancaires ne sont pas stockées)</li>
                      <li><strong>Code promo :</strong> votre code unique et les referral codes utilisés</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Section 2 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-[#8B0000]/10 rounded-full flex items-center justify-center shrink-0">
                  <Database size={20} className="text-[#8B0000]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#2C3E50] mb-2">2. Utilisation de vos données</h2>
                  <div className="text-gray-600 text-sm leading-relaxed space-y-2">
                    <p>Vos données sont utilisées pour :</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Fournir et améliorer nos services</li>
                      <li>Personnaliser votre expérience utilisateur</li>
                      <li>Traiter vos paiements et abonnements</li>
                      <li>Vous envoyer des notifications importantes</li>
                      <li>Analyser les tendances pour améliorer l'application</li>
                      <li>Prévenir la fraude et assurer la sécurité</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Section 3 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-[#8B0000]/10 rounded-full flex items-center justify-center shrink-0">
                  <Share2 size={20} className="text-[#8B0000]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#2C3E50] mb-2">3. Partage des données</h2>
                  <div className="text-gray-600 text-sm leading-relaxed space-y-2">
                    <p>Nous ne vendons pas vos données personnelles. Vos données peuvent être partagées avec :</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Nos fournisseurs de paiement</strong> (MTN, Orange) pour le traitement des transactions</li>
                      <li><strong>Les partenaires analytiques</strong> pour améliorer nos services</li>
                      <li><strong>Les autorités légales</strong> si requis par la loi</li>
                    </ul>
                    <p className="mt-2">Lorsque vous partagez votre code promo, seul le code est partagé - vos données personnelles restent confidentielles.</p>
                  </div>
                </div>
              </div>

              {/* Section 4 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-[#8B0000]/10 rounded-full flex items-center justify-center shrink-0">
                  <Lock size={20} className="text-[#8B0000]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#2C3E50] mb-2">4. Sécurité des données</h2>
                  <div className="text-gray-600 text-sm leading-relaxed space-y-2">
                    <p>Nous mettons en œuvre des mesures de sécurité robustes :</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Chiffrement SSL pour toutes les transmissions de données</li>
                      <li>Stockage sécurisé sur des serveurs protégés</li>
                      <li>Accès restreint aux données personnelles</li>
                      <li>Audits réguliers de sécurité</li>
                    </ul>
                    <p className="mt-2">Malgré nos efforts, aucune méthode de transmission sur Internet n'est sûre à 100%. Nous ne pouvons garantir une sécurité absolue.</p>
                  </div>
                </div>
              </div>

              {/* Section 5 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-[#8B0000]/10 rounded-full flex items-center justify-center shrink-0">
                  <Eye size={20} className="text-[#8B0000]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#2C3E50] mb-2">5. Vos droits</h2>
                  <div className="text-gray-600 text-sm leading-relaxed space-y-2">
                    <p>Conformément à la réglementation, vous disposez des droits suivants :</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Droit d'accès :</strong> obtenir une copie de vos données</li>
                      <li><strong>Droit de rectification :</strong> corriger vos données</li>
                      <li><strong>Droit à l'effacement :</strong> demander la suppression de vos données</li>
                      <li><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données</li>
                      <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré</li>
                    </ul>
                    <p className="mt-2">Pour exercer ces droits, contactez-nous à : <strong>privacy@lecontinent.cm</strong></p>
                  </div>
                </div>
              </div>

              {/* Section 6 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-[#8B0000]/10 rounded-full flex items-center justify-center shrink-0">
                  <Trash2 size={20} className="text-[#8B0000]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#2C3E50] mb-2">6. Conservation des données</h2>
                  <div className="text-gray-600 text-sm leading-relaxed space-y-2">
                    <p>Nous conservons vos données :</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Pendant la durée de votre abonnement actif</li>
                      <li>Pendant 3 ans après la fin de votre abonnement pour des raisons légales</li>
                      <li>Les données de paiement sont conservées conformément aux obligations fiscales (10 ans)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Section 7 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-[#8B0000]/10 rounded-full flex items-center justify-center shrink-0">
                  <Mail size={20} className="text-[#8B0000]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#2C3E50] mb-2">7. Contact</h2>
                  <div className="text-gray-600 text-sm leading-relaxed space-y-2">
                    <p>Pour toute question concernant cette politique ou pour exercer vos droits, contactez-nous :</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Email :</strong> privacy@lecontinent.cm</li>
                      <li><strong>Adresse :</strong> Rue de la Culture 12, Douala, Cameroun</li>
                      <li><strong>Téléphone :</strong> +237 6XX XXX XXX</li>
                    </ul>
                  </div>
                </div>
              </div>

            </div>

            <div className="mt-10 pt-6 border-t border-gray-200">
              <p className="text-gray-500 text-xs text-center">
                © {new Date().getFullYear()} Le Continent. Tous droits réservés.
              </p>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
