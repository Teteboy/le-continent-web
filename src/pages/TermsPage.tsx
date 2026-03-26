import { FileText, CheckCircle, XCircle, AlertTriangle, CreditCard, Globe, UserCheck, Ban } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative h-64 sm:h-80 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/onboarding3.jpg)' }} />
        <div className="absolute inset-0 hero-overlay" />
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#FFD700]/20 text-[#FFD700] text-sm font-bold px-4 py-2 rounded-full mb-4 border border-[#FFD700]/30">
            <FileText size={14} /> Legal
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white drop-shadow-lg mb-3">
            Conditions <span className="text-[#FFD700]">d'Utilisation</span>
          </h1>
          <p className="text-white/80 text-sm sm:text-base">
            Les règles et conditions d'utilisation de l'application Le Continent.
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
                Les présentes Conditions dUtilisation (« CGU ») constituent un contrat entre vous (« Utilisateur ») et Le Continent (« nous », « notre ») pour l'utilisation de notre application mobile et web. En créant un compte ou en utilisant l'application, vous acceptez d'être lié par ces conditions.
              </p>
            </div>

            <div className="space-y-8">
              {/* Section 1 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-[#8B0000]/10 rounded-full flex items-center justify-center shrink-0">
                  <UserCheck size={20} className="text-[#8B0000]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#2C3E50] mb-2">1. Acceptation des conditions</h2>
                  <div className="text-gray-600 text-sm leading-relaxed space-y-2">
                    <p>En accédant à l'application Le Continent et en l'utilisant, vous reconnaissez avoir lu, compris et accepté d'être lié par :</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Les présentes Conditions d'Utilisation</li>
                      <li>Notre Politique de Confidentialité</li>
                      <li>Toutes les règles et politiques supplémentaires</li>
                    </ul>
                    <p className="mt-2">Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser l'application.</p>
                  </div>
                </div>
              </div>

              {/* Section 2 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-[#8B0000]/10 rounded-full flex items-center justify-center shrink-0">
                  <Globe size={20} className="text-[#8B0000]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#2C3E50] mb-2">2. Éligibilité et compte</h2>
                  <div className="text-gray-600 text-sm leading-relaxed space-y-2">
                    <p>Pour utiliser l'application, vous devez :</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Avoir au moins 13 ans (ou l'âge de consentement dans votre juridiction)</li>
                      <li>Avoir la capacité juridique de passer un contrat</li>
                      <li>Fournir des informations véridiques et à jour</li>
                      <li>Maintenir la sécurité de votre compte</li>
                    </ul>
                    <p className="mt-2">Vous êtes responsable de toutes les activités realizadas sous votre compte.</p>
                  </div>
                </div>
              </div>

              {/* Section 3 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-[#8B0000]/10 rounded-full flex items-center justify-center shrink-0">
                  <CreditCard size={20} className="text-[#8B0000]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#2C3E50] mb-2">3. Abonnements et paiements</h2>
                  <div className="text-gray-600 text-sm leading-relaxed space-y-2">
                    <p><strong>Abonnement Premium :</strong></p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Le tarif Premium est de 1 000 XAF (valable pour un an)</li>
                      <li>Le paiement s'effectue via MTN Mobile Money ou Orange Money</li>
                      <li>L'abonnement se renouvelle automatiquement sauf résiliation</li>
                      <li>Le prix peut être modifié moyennant un préavis de 30 jours</li>
                    </ul>
                    <p className="mt-2"><strong>Politique de remboursement :</strong></p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Remboursement complet sous 7 jours si non satisfait</li>
                      <li>Aucun remboursement après 7 jours</li>
                      <li>Les demandes de remboursement doivent être envoyées par email</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Section 4 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-[#8B0000]/10 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle size={20} className="text-[#8B0000]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#2C3E50] mb-2">4. Utilisation autorisée</h2>
                  <div className="text-gray-600 text-sm leading-relaxed space-y-2">
                    <p>Vous êtes autorisé à :</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Utiliser l'application pour votre usage personnel non-commercial</li>
                      <li>Consulter le contenu culturel disponible</li>
                      <li>Partager votre code promo avec vos amis</li>
                      <li>Télécharger les livres (si Premium)</li>
                      <li>Proposer des suggestions d'amélioration</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Section 5 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-[#8B0000]/10 rounded-full flex items-center justify-center shrink-0">
                  <Ban size={20} className="text-[#8B0000]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#2C3E50] mb-2">5. Utilisation interdite</h2>
                  <div className="text-gray-600 text-sm leading-relaxed space-y-2">
                    <p>Vous NE DEVEZ PAS :</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Utiliser l'application à des fins commerciales sans autorisation</li>
                      <li>Copier, reproduire ou distribuer le contenu</li>
                      <li>Modifier ou créer des œuvres dérivées</li>
                      <li>Tenter de contourner les mesures de sécurité</li>
                      <li>Utiliser des robots ou scripts automatisés</li>
                      <li>Publier du contenu illégal, offensant ou nuisible</li>
                      <li>Usurper l'identité d'autrui</li>
                      <li>Transférer votre compte à un tiers</li>
                    </ul>
                    <p className="mt-2">Toute violation peut entraîner la suspension ou la suppression de votre compte.</p>
                  </div>
                </div>
              </div>

              {/* Section 6 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-[#8B0000]/10 rounded-full flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} className="text-[#8B0000]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#2C3E50] mb-2">6. Propriété intellectuelle</h2>
                  <div className="text-gray-600 text-sm leading-relaxed space-y-2">
                    <p><strong>Contenu de Le Continent :</strong></p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Tous les droits de propriété intellectuelle appartiennent à Le Continent</li>
                      <li>Le contenu est protégé par les lois sur le droit d'auteur</li>
                      <li>Les marques commerciales sont la propriété de leurs détenteurs</li>
                    </ul>
                    <p className="mt-2"><strong>Contributions utilisateur :</strong></p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Vous conservez vos droits sur vos contributions</li>
                      <li>Vous accordez à Le Continent une licence pour utiliser vos contributions</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Section 7 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-[#8B0000]/10 rounded-full flex items-center justify-center shrink-0">
                  <XCircle size={20} className="text-[#8B0000]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#2C3E50] mb-2">7. Limitation de responsabilité</h2>
                  <div className="text-gray-600 text-sm leading-relaxed space-y-2">
                    <p>L'APPLICATION EST FOURNIE « EN L'ÉTAT » SANS GARANTIES. NOUS NE GARANTISSONS PAS QUE :</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>L'application sera toujours disponible et sans erreur</li>
                      <li>Le contenu sera complet, précis ou à jour</li>
                      <li>Les services répondront à vos attentes</li>
                    </ul>
                    <p className="mt-2">NOUS NE SERONS PAS RESPONSABLES DES DOMMAGES INDIRECTS, ACCESSOIRES OU CONSÉCUTIFS.</p>
                  </div>
                </div>
              </div>

              {/* Section 8 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-[#8B0000]/10 rounded-full flex items-center justify-center shrink-0">
                  <FileText size={20} className="text-[#8B0000]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#2C3E50] mb-2">8. Résiliation</h2>
                  <div className="text-gray-600 text-sm leading-relaxed space-y-2">
                    <p><strong>Par vous :</strong></p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Vous pouvez supprimer votre compte à tout moment</li>
                      <li>La résiliation n'affecte pas les paiements déjà effectués</li>
                    </ul>
                    <p className="mt-2"><strong>Par nous :</strong></p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Nous pouvons suspendre ou supprimer votre compte en cas de violation</li>
                      <li>Nous pouvons interrompre l'application avec un préavis de 30 jours</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Section 9 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-[#8B0000]/10 rounded-full flex items-center justify-center shrink-0">
                  <Globe size={20} className="text-[#8B0000]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#2C3E50] mb-2">9. Droit applicable</h2>
                  <div className="text-gray-600 text-sm leading-relaxed space-y-2">
                    <p>Les présentes conditions sont régies par :</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Le droit camerounais</li>
                      <li>Tout litige sera soumis aux tribunaux de Douala</li>
                    </ul>
                    <p className="mt-2">Si une disposition est jugée invalide, les autres dispositions restent en vigueur.</p>
                  </div>
                </div>
              </div>

              {/* Section 10 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-[#8B0000]/10 rounded-full flex items-center justify-center shrink-0">
                  <UserCheck size={20} className="text-[#8B0000]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#2C3E50] mb-2">10. Modifications</h2>
                  <div className="text-gray-600 text-sm leading-relaxed space-y-2">
                    <p>Nous pouvons modifier ces conditions à tout moment. Les modifications entreront en vigueur :</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Immédiatement pour les modifications mineures</li>
                      <li>30 jours après notification pour les modifications importantes</li>
                    </ul>
                    <p className="mt-2">Votre utilisation continue de l'application après les modifications vaut acceptation.</p>
                  </div>
                </div>
              </div>

              {/* Section 11 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-[#8B0000]/10 rounded-full flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} className="text-[#8B0000]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#2C3E50] mb-2">11. Contact</h2>
                  <div className="text-gray-600 text-sm leading-relaxed space-y-2">
                    <p>Pour toute question concernant ces conditions :</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Email :</strong> legal@lecontinent.cm</li>
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
