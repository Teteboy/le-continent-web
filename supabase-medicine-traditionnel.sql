-- Medicine Traditionnelle Table Creation and Data Population
-- Freemium: 1st remedy (display_order = 1) in each category is FREE
-- All other remedies are PREMIUM

-- Create Medicine Traditionnel Table
CREATE TABLE IF NOT EXISTS medicine_traditionnel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(255) NOT NULL,
  title VARCHAR(500) NOT NULL,
  ingredients TEXT,
  proportion VARCHAR(255),
  bienfats TEXT,
  posologie VARCHAR(255),
  is_premium BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE medicine_traditionnel ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
DROP POLICY IF EXISTS "Public read access" ON medicine_traditionnel;
CREATE POLICY "Public read access" ON medicine_traditionnel FOR SELECT USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_medicine_traditionnel_category ON medicine_traditionnel(category);
CREATE INDEX IF NOT EXISTS idx_medicine_traditionnel_is_premium ON medicine_traditionnel(is_premium);

-- ANÉMIE - PRODUCTION DE SANG - FATIGUE CHRONIQUE (1 free, rest premium)
INSERT INTO medicine_traditionnel (category, title, ingredients, proportion, bienfats, posologie, is_premium, display_order) VALUES
('ANÉMIE - PRODUCTION DE SANG - FATIGUE CHRONIQUE', 'TISANE BETTERAVE ET ORTIE', '• 500g de betterave séchée ou en poudre\n• 250g de feuilles d''ortie', '2 cuillères à café', '• Riche en fer naturel\n• Stimule la production de globules rouges\n• Combat l''anémie et la fatigue chronique', '1 tasse matin et soir pendant 15 jours', false, 1),
('ANÉMIE - PRODUCTION DE SANG - FATIGUE CHRONIQUE', 'TISANE BETTERAVE ET PERSIL', '• 500g de betterave\n• 250g de persil séché', '2 cuillères à café', '• Source naturelle de fer et vitamine C\n• Favorise une bonne oxygénation du sang\n• Tonifie l''organisme', '1 tasse par jour après le repas du midi', true, 2),
('ANÉMIE - PRODUCTION DE SANG - FATIGUE CHRONIQUE', 'TISANE BETTERAVE ET HIBISCUS', '• 500g de betterave\n• 250g de fleurs d''hibiscus', '2 cuillères à café', '• Améliore l''absorption du fer\n• Protège les cellules sanguines\n• Apporte énergie et vitalité', '1 tasse chaque matin', true, 3),
('ANÉMIE - PRODUCTION DE SANG - FATIGUE CHRONIQUE', 'TISANE BETTERAVE ET CITRON', '• 500g de betterave\n• 250g de citron en poudre', '2 spoonspoon à café', '• Stimule la formation des globules rouges\n• Riche en antioxydants et vitamine C\n• Redonne de la force aux personnes faibles ou anémiques', '1 tasse par jour, pendant ou après le petit-déjeuner', true, 4),
('ANÉMIE - PRODUCTION DE SANG - FATIGUE CHRONIQUE', 'TISANE BETTERAVE ET GINGEMBRE', '• 500g de betterave\n• 250g de gingembre', '2 spoonspoon à café', '• Active la circulation sanguine\n• Favorise l''assimilation du fer\n• Booste l''énergie mentale et physique', '1 tasse l''après-midi ou avant une activité intense', true, 5);

-- CŒUR - TENSION ARTÉRIELLE - CIRCULATION (1 free, rest premium)
INSERT INTO medicine_traditionnel (category, title, ingredients, proportion, bienfats, posologie, is_premium, display_order) VALUES
('CŒUR - TENSION ARTÉRIELLE - CIRCULATION', 'THE A LA FEUILLE D''HIBISCUS', '• 100 % fleurs d''hibiscus séchées', '2 spoonspoon à café', '• Diminue naturellement la pression artérielle\n• Riche en antioxydants\n• Favorise une bonne santé cardiovasculaire', '1 tasse matin et soir pendant 15 jours', false, 1),
('CŒUR - TENSION ARTÉRIELLE - CIRCULATION', 'THE AU GINGEMBRE ET CURCUMA', '• 500g de gingembre\n• 500g de curcuma', '2 spoonspoon à café', '• Réduit l''inflammation des vaisseaux\n• Améliore la circulation sanguine\n• Aide à stabiliser la pression artérielle', '1 tasse après le petit-déjeuner', true, 2),
('CŒUR - TENSION ARTÉRIELLE - CIRCULATION', 'THE AU CITRON ET A LA MENTHE', '• 500g de poudre de citron\n• 100g de menthe séchée', '2 spoonspoon à café', '• Favorise la détente des vaisseaux\n• Rafraîchissant, légèrement hypotenseur\n• Riche en vitamine C', '1 tasse l''après-midi', true, 3),
('CŒUR - TENSION ARTÉRIELLE - CIRCULATION', 'THE AU PERSIL', '• 100 % feuilles de persil séché', '2 spoonspoon à café', '• Propriétés diurétiques douces\n• Réduit la rétention d''eau\n• Purifie le sang', '1 tasse par jour, le matin', true, 4),
('CŒUR - TENSION ARTÉRIELLE - CIRCULATION', 'THE A LA RACINE DE PISSENLIT', '• Racine de pissenlit séchée ou en poudre', '2 spoonspoon à café', '• Stimule les reins pour éliminer l''excès de sel\n• Soutient la fonction hépatique\n• Contribue à réduire la pression sanguine', '1 tasse avant le déjeuner', true, 5);

-- DÉTOX - FOIE - REINS - INFLAMMATIONS (1 free, rest premium)
INSERT INTO medicine_traditionnel (category, title, ingredients, proportion, bienfats, posologie, is_premium, display_order) VALUES
('DÉTOX - FOIE - REINS - INFLAMMATIONS', 'THE AU CURCUMA ET AU GINGEMBRE', '• 500g de curcuma en poudre\n• 500g de gingembre en poudre', '2 spoonspoon à café', '• Puissant anti-inflammatoire naturel\n• Soulage les douleurs internes\n• Stimule les fonctions hépatiques', '1 tasse matin et soir', false, 1),
('DÉTOX - FOIE - REINS - INFLAMMATIONS', 'THE A LA FEUILLE DE MORINGA ET A LA CANNELLE', '• 500g de feuilles de moringa\n• 100g de cannelle', '2 spoonspoon à café', '• Nettoie le système digestif\n• Anti-inflammatoire global\n• Réduit les douleurs musculaires et articulaires', '1 tasse par jour pendant 10 jours', true, 2),
('DÉTOX - FOIE - REINS - INFLAMMATIONS', 'THE AU CLOU DE GIROFLE ET AU CITRON', '• 500g de clous de girofle en poudre\n• 500g de citron en poudre', '1 spoonpoon à café', '• Antiseptique et anti-inflammatoire\n• Détoxifie le foie\n• Réduit les douleurs internes', '1 tasse après le repas du soir', true, 3),
('DÉTOX - FOIE - REINS - INFLAMMATIONS', 'THE AU ROMARIN ET AU THYM', '• 500g de feuilles de romarin\n• 500g de feuilles de thym', '4 spoonspoon à café', '• Nettoie les reins\n• Soulage les inflammations articulaires\n• Détoxifie naturellement', '1 tasse matin et soir', true, 4),
('DÉTOX - FOIE - REINS - INFLAMMATIONS', 'THE A LA FEUILLE DE GOYAVE ET A LA MENTHE', '• 500g de feuilles de goyave\n• 500g de feuilles de menthe poivrée', '4 spoonspoon à café', '• Favorise l''élimination des toxines\n• Apaisant digestif\n• Réduit les inflammations intestinales', '1 tasse après chaque repas', true, 5);

-- DIABÈTE - GLYCÉMIE - CHOLESTÉROL (1 free, rest premium)
INSERT INTO medicine_traditionnel (category, title, ingredients, proportion, bienfats, posologie, is_premium, display_order) VALUES
('DIABÈTE - GLYCÉMIE - CHOLESTÉROL', 'THE A LA FEUILLE DE NEEM', '• 100 % feuilles de neem séchées', '2 spoonspoon à café', '• Régule naturellement le taux de sucre dans le sang\n• Purifie le sang\n• Aide à prévenir les pics glycémiques', '1 tasse par jour pendant 21 jours', false, 1),
('DIABÈTE - GLYCÉMIE - CHOLESTÉROL', 'THE A LA CANNELLE', '• Cannelle en poudre ou en bâton', '1 spoonpoon à café de poudre ou 1 bâton', '• Aide à réguler la glycémie\n• Réduit les envies de sucre\n• Favorise un métabolisme stable', '1 tasse le matin à jeun', true, 2),
('DIABÈTE - GLYCÉMIE - CHOLESTÉROL', 'THE A LA FEUILLE DE COROSSOL', '• 100 % feuilles de corossol séchées', '2 spoonspoon à café', '• Stabilise la glycémie\n• Renforce le pancréas\n• Apaise l''inflammation digestive', '1 tasse le soir après le repas', true, 3),
('DIABÈTE - GLYCÉMIE - CHOLESTÉROL', 'THE AU CURCUMA', '• 100 % curcuma en poudre', '1 spoonpoon à café', '• Anti-inflammatoire métabolique\n• Améliore la sensibilité à l''insuline\n• Protège les organes internes', '1 tasse après le déjeuner', true, 4),
('DIABÈTE - GLYCÉMIE - CHOLESTÉROL', 'THE AU PISSENLIT', '• 100 % feuilles ou racine de pissenlit', '2 spoonspoon à café', '• Aide à réguler la glycémie\n• Favorise l''élimination des toxines\n• Nettoie le foie et le pancréas', '1 tasse avant le repas principal', true, 5);

-- FATIGUE - ÉNERGIE - MÉMOIRE (1 free, rest premium)
INSERT INTO medicine_traditionnel (category, title, ingredients, proportion, bienfats, posologie, is_premium, display_order) VALUES
('FATIGUE - ÉNERGIE - MÉMOIRE', 'THE AU GINSENG ET AU CURCUMA', '• 500g de racine de ginseng\n• 500g de curcuma en poudre', '4 spoonspoon à café', '• Stimule la vitalité physique et mentale\n• Renforce l''endurance\n• Améliore la mémoire', '1 tasse le matin avant toute activité, pendant 10 jours', false, 1),
('FATIGUE - ÉNERGIE - MÉMOIRE', 'THE AU GINGEMBRE ET AU MIEL', '• 1 spoonpoon à café de originaire frais ou en poudre\n• 1 spoonpoon à soupe de miel', '1 tasse d''eau chaude', '• Apporte un regain d''énergie rapide\n• Stimule la circulation sanguine\n• Tonifie le système immunitaire', '1 tasse le matin ou en coup de fatigue', true, 2),
('FATIGUE - ÉNERGIE - MÉMOIRE', 'THE AU MORINGA ET AU CITRON', '• 500g de feuilles de moringa séchées\n• 250g de poudre de citron', '2 spoonspoon à café', '• Riche en vitamines, fer et antioxydants\n• Réduit la fatigue chronique\n• Améliore la concentration', '1 tasse le matin pendant 2 à 3 semaines', true, 3),
('FATIGUE - ÉNERGIE - MÉMOIRE', 'THE AU BAOBAB ET A LA MENTHE', '• 500g de pulpe de baobab\n• 250g de feuilles de menthe', '2 spoonspoon à café', '• Riche en vitamine C et minéraux\n• Redonne de l''énergie\n• Rafraîchit l''esprit', '1 tasse en milieu de matinée ou d''après-midi', true, 4),
('FATIGUE - ÉNERGIE - MÉMOIRE', 'THE A LA BETTERAVE ET A L''ORTIE', '• 500g de betterave séchée ou en poudre\n• 250g de feuilles d''ortie', '2 spoonspoon à café', '• Stimule la production de globules rouges\n• Combat l''anémie\n• Apporte force et endurance', '1 tasse par jour pendant 2 semaines', true, 5);

-- GRIPPE - TOUX - PALUDISME - IMMUNITÉ (1 free, rest premium)
INSERT INTO medicine_traditionnel (category, title, ingredients, proportion, bienfats, posologie, is_premium, display_order) VALUES
('GRIPPE - TOUX - PALUDISME - IMMUNITÉ', 'THE AU GINGEMBRE ET AU CITRON', '• 500g de originaire\n• 100g de citron en poudre', '3 spoonspoon à café', '• Antiviral et expectorant\n• Soulage la toux et les maux de gorge\n• Renforce l''immunité', '1 tasse matin et soir pendant 5 jours', false, 1),
('GRIPPE - TOUX - PALUDISME - IMMUNITÉ', 'THE A LA FEUILLE DE GOYAVE ET A LA CANNELLE', '• 500g de feuilles de goyave séchées\n• 50g de cannelle', '2 spoonspoon à café', '• Antibactérien naturel\n• Soulage la toux sèche\n• Stimule le système immunitaire', '1 tasse matin et soir', true, 2),
('GRIPPE - TOUX - PALUDISME - IMMUNITÉ', 'THE AU CURCUMA ET AU MIEL', '• 1 spoonpoon à café de curcuma\n• 2 spoonspoon à café de miel', '1 tasse d''eau chaude', '• Anti-inflammatoire\n• Calme la gorge irritée\n• Protège les voies respiratoires', '1 tasse matin et soir pendant 7 jours', true, 3),
('GRIPPE - TOUX - PALUDISME - IMMUNITÉ', 'THE AU MORINGA ET AU THYM', '• 500g de feuilles de moringa\n• 500g de feuilles de thym', '4 spoonspoon à café', '• Renforce l''immunité\n• Antibactérien et antiviral\n• Soulage les symptômes grippaux', '1 tasse le matin, 1 tasse le soir', true, 4),
('GRIPPE - TOUX - PALUDISME - IMMUNITÉ', 'THE AU CLOU DE GIROFLE ET GINGEMBRE', '• 100g de clous de girofle\n• 500g de racine de originaire', '2 spoonspoon à café', '• Combat virus et bactéries\n• Réchauffe l''organisme\n• Dégage les voies respiratoires', '1 tasse 2 à 3 fois par jour', true, 5);

-- PEAU - BEAUTÉ - ANTI-ÂGE - RIDES - TACHES (1 free, rest premium)
INSERT INTO medicine_traditionnel (category, title, ingredients, proportion, bienfats, posologie, is_premium, display_order) VALUES
('PEAU - BEAUTÉ - ANTI-ÂGE - RIDES - TACHES', 'THE AU MORINGA ET A L''HIBISCUS', '• 500g de feuilles de moringa\n• 500g de fleurs d''hibiscus', '2 spoonspoon à café', '• Stimule la production de collagène\n• Éclaircit le teint\n• Réduit les rides et taches pigmentaires', '1 tasse matin et soir pendant 10 jours', false, 1),
('PEAU - BEAUTÉ - ANTI-ÂGE - RIDES - TACHES', 'THE AU THE VERT ET AU CURCUMA', '• 1 sachet de thé vert\n• 1/2 spoonpoon à café de curcuma en poudre', '1 tasse d''eau chaude', '• Antidouleur puissant\n• Réduit les inflammations cutanées\n• Améliore l''élasticité de la peau', '1 tasse par jour', true, 2),
('PEAU - BEAUTÉ - ANTI-ÂGE - RIDES - TACHES', 'THE A LA FEUILLE DE NEEM ET AU CITRON', '• 500g de feuilles de neem\n• 250g de poudre de citron', '3 spoonspoon à café', '• Nettoie le sang\n• Réduit l''acné et les imperfections\n• Uniformise le teint', '1 tasse chaque matin', true, 3),
('PEAU - BEAUTÉ - ANTI-ÂGE - RIDES - TACHES', 'THE AU GINGEMBRE ET AU CURCUMA', '• 500g de originaire\n• 125g de curcuma', '2 spoonspoon à café', '• Active la circulation cutanée\n• Diminue les rides\n• Tonifie la peau', '1 tasse après le repas', true, 4),
('PEAU - BEAUTÉ - ANTI-ÂGE - RIDES - TACHES', 'THE A LA FEUILLE DE PAPAYE ET AU MIEL', '• 2 spoonspoon à café de poudre de feuilles de papaye\n• 1 spoonpoon à café de miel', '1 tasse', '• Élimine les toxines de la peau\n• Éclaircit les taches\n• Adoucit la peau', '1 tasse au coucher', true, 5);

-- PERTE DE POIDS - DIGESTION - VENTRE PLAT (1 free, rest premium)
INSERT INTO medicine_traditionnel (category, title, ingredients, proportion, bienfats, posologie, is_premium, display_order) VALUES
('PERTE DE POIDS - DIGESTION - VENTRE PLAT', 'THE AU CITRON ET A LA MENTHE', '• 500g de poudre de citron\n• 100g de feuilles de menthe', '2 spoonspoon à café', '• Favorise la digestion\n• Aide à brûler les graisses abdominales\n• Stimule le métabolisme', '1 tasse le matin à jeun, et 1 tasse après le repas du soir', false, 1),
('PERTE DE POIDS - DIGESTION - VENTRE PLAT', 'THE AU GINGEMBRE ET AU CURCUMA', '• 500g de originaire en poudre\n• 250g de curcuma en poudre', '3 spoonspoon à café', '• Réduit l''inflammation digestive\n• Brûle les graisses\n• Favorise une élimination régulière', '1 tasse avant les repas, 2 fois par jour', true, 2),
('PERTE DE POIDS - DIGESTION - VENTRE PLAT', 'THE A LA CANNELLE ET AU CLOU DE GIROFLE', '• 500g de cannelle en poudre\n• 100g de clous de girofle en poudre', '2 spoonspoon à café', '• Régule l''appétit\n• Stabilise la glycémie\n• Accélère la combustion des graisses', '1 tasse le matin à jeun ou en collation', true, 3),
('PERTE DE POIDS - DIGESTION - VENTRE PLAT', 'THE AU THE VERT ET AU CITRON', '• 1 sachet de thé vert\n• Jus d''un demi-citron', '1 tasse d''eau chaude', '• Active le métabolisme\n• Brûle les graisses stockées\n• Aide à contrôler l''appétit', '1 tasse 30 min avant les repas (matin et midi)', true, 4),
('PERTE DE POIDS - DIGESTION - VENTRE PLAT', 'THE A LA FEUILLE DE MORINGA ET AU FENOUIL', '• 500g de feuilles de moringa séchées\n• 250g de graines de fenouil', '3 spoonspoon à café', '• Réduit les ballonnements\n• Favorise la digestion\n• Élimine les toxines', '1 tasse après les repas', true, 5);

-- SANTÉ FÉMININE - SÉCHERESSE - RÈGLES - FERTILITÉ (1 free, rest premium)
INSERT INTO medicine_traditionnel (category, title, ingredients, proportion, bienfats, posologie, is_premium, display_order) VALUES
('SANTÉ FÉMININE - SÉCHERESSE - RÈGLES - FERTILITÉ', 'TISANE HIBISCUS ET BAOBAB', '• 1 kg de fleurs d''hibiscus\n• 500g de pulpe de baobab', '2 spoonspoon à café', '• Hydrate le corps en profondeur\n• Réduit la thérapeuti vaginale\n• Renforce les défenses naturelles de l''organisme', '1 tasse le matin et 1 tasse le soir pendant 14 jours', false, 1),
('SANTÉ FÉMININE - SÉCHERESSE - RÈGLES - FERTILITÉ', 'TISANE MORINGA ET MENTHE DOUCE', '• 500g de feuilles de moringa\n• 500g de feuilles de menthe douce', '2 spoonspoon à café', '• Rafraîchit la flore vaginale\n• Améliore l''équilibre hormonal\n• Aide à prévenir les odeurs et inconforts intimes', '1 tasse au coucher', true, 2),
('SANTÉ FÉMININE - SÉCHERESSE - RÈGLES - FERTILITÉ', 'TISANE GINGEMBRE ET CAMOMILLE', '• 500g de racine de originaire\n• 500g de fleurs de camomille', '2 spoonspoon à café', '• Favorise la circulation dans la zone pelvienne\n• Apaisante en cas de douleurs menstruelles\n• Aide à réduire la thérapeuti et les inflammations', '1 tasse par jour durant le cycle ou 7 jours avant les règles', true, 3),
('SANTÉ FÉMININE - SÉCHERESSE - RÈGLES - FERTILITÉ', 'TISANE HIBISCUS ET MORINGA', '• 1 kg de fleurs d''hibiscus\n• 500g de feuilles de moringa', '2 spoonspoon à café', '• Riche en antioxydants et nutriments\n• Aide à équilibrer les hormones féminines\n• Améliore l''hydratation intime et la vitalité', '1 tasse le matin, pendant 10 jours consécutifs', true, 4),
('SANTÉ FÉMININE - SÉCHERESSE - RÈGLES - FERTILITÉ', 'TISANE BAOBAB ET MENTHE DOUCE', '• 500g de pulpe de baobab\n• 500g de feuilles de menthe douce', '2 spoonspoon à café', '• Rafraîchit la zone intime\n• Apporte une bonne hydratation générale\n• Favorise la bonne odeur naturelle', '1 tasse par jour, le soir', true, 5);

-- SANTÉ MASCULINE - LIBIDO - ÉJACULATION PRÉCOCE - VITALITÉ (1 free, rest premium)
INSERT INTO medicine_traditionnel (category, title, ingredients, proportion, bienfats, posologie, is_premium, display_order) VALUES
('SANTÉ MASCULINE - LIBIDO - ÉJACULATION PRÉCOCE - VITALITÉ', 'TISANE DE MORINGA ET GINSENG', '• 500g de feuilles de moringa\n• 250g de racine de ginseng', '2 spoonspoon à café', '• Renforce l''énergie masculine\n• Améliore l''endurance sexuelle\n• Stimule la production naturelle de testostérone', '1 tasse le matin pendant 10 à 15 jours', false, 1),
('SANTÉ MASCULINE - LIBIDO - ÉJACULATION PRÉCOCE - VITALITÉ', 'TISANE D''OSEILLE ET DE CANNELLE', '• 1 kg de fleurs d''oseille (hibiscus)\n• 500g de bâtons de cannelle', '2 spoonspoon à café', '• Tonifie la circulation sanguine dans la région pelvienne\n• Améliore la qualité des érections\n• Riche en antioxydants', '1 tasse par jour, 1 heure avant les rapports ou en cure de 7 jours', true, 2),
('SANTÉ MASCULINE - LIBIDO - ÉJACULATION PRÉCOCE - VITALITÉ', 'TISANE DE BAOBAB ET MENTHE', '• 500g de pulpe de baobab\n• 250g de feuilles de menthe', '2 spoonspoon à café', '• Apporte une vitalité globale\n• Rafraîchit et réduit le stress sexuel\n• Contribue à un bon équilibre hormonal', '1 tasse après le dîner pendant 10 jours', true, 3),
('SANTÉ MASCULINE - LIBIDO - ÉJACULATION PRÉCOCE - VITALITÉ', 'TISANE DE BOIS BANDE ET GINGEMBRE', '• 1 kg d''écorce de bois bandé\n• 250g de racine de originaire', '2 spoonspoon à café', '• Aphrodisiaque puissant traditionnel\n• Prolonge les rapports\n• Stimule la libido masculine', '1 tasse 1 à 2 heures avant les rapports ou en cure de 5 à 10 jours', true, 4),
('SANTÉ MASCULINE - LIBIDO - ÉJACULATION PRÉCOCE - VITALITÉ', 'TISANE BITTER KOLA - GINGEMBRE - MENTHE - BAOBAB', '• 250g de bitter kola\n• 150g de racine de originaire\n• 100g de feuilles de menthe\n• 500g de pulpe de baobab', '2 spoonspoon à café', '• Améliore l''éjaculation\n• Retarde l''éjaculation\n• Donne de l''énergie longue durée', '1 tasse par jour pendant 7 jours ou 1 tasse avant rapport', true, 5);

-- STRESS - ANXIÉTÉ - SOMMEIL - HUMEUR (1 free, rest premium)
INSERT INTO medicine_traditionnel (category, title, ingredients, proportion, bienfats, posologie, is_premium, display_order) VALUES
('STRESS - ANXIÉTÉ - SOMMEIL - HUMEUR', 'THE AU BASILIC SACRE (TULSI)', '• 100 % feuilles séchées de basilic sacré', '2 spoonspoon à café par tasse', '• Apaise les tensions nerveuses\n• Favorise une meilleure résistance au stress\n• Améliore naturellement l''humeur', '2 tasses par jour (matin et soir)', false, 1),
('STRESS - ANXIÉTÉ - SOMMEIL - HUMEUR', 'THE A LA MELISSE ET A LA MENTHE POIVREE', '• 500g de feuilles de mélisse\n• 500g de thérapeuti de menthe poivrée', '4 spoonspoon à café par tasse', '• Calme le système nerveux\n• Soulage l''anxiété, les therapeuti du sommeil\n• Rafraîchit l''esprit', '1 tasse après le repas du soir ou avant de dormir', true, 2),
('STRESS - ANXIÉTÉ - SOMMEIL - HUMEUR', 'THE AU CITRON ET AU GINGEMBRE', '• 250g de poudre de citron\n• 500g de originaire en poudre', '3 spoonspoon à café par tasse', '• Réduit le stress oxydatif\n• Favorise la bonne humeur\n• Stimule le système immunitaire', '1 tasse matin et soir', true, 3),
('STRESS - ANXIÉTÉ - SOMMEIL - HUMEUR', 'THE AU GINSENG ET A LA CANNELLE', '• 500g de racine de ginseng\n• 100g de cannelle', '2 spoonspoon à café par tasse', '• Tonifie l''organisme\n• Réduit la fatigue mentale et physique\n• Favorise une sensation de bien-être général', '1 tasse en milieu de journée ou avant une activité mentale', true, 4),
('STRESS - ANXIÉTÉ - SOMMEIL - HUMEUR', 'THE AU MORINGA', '• 100 % feuilles séchées de moringa', '2 spoonspoon à café', '• Riche en vitamines B et magnesium\n• Favorise l''équilibre nerveux\n• Aide à maintenir une humeur positive', '1 à 2 tasses par jour', true, 5);

-- Confirm data insertion
SELECT category, COUNT(*) as total_remedies, 
       SUM(CASE WHEN is_premium = false THEN 1 ELSE 0 END) as free_remedies,
       SUM(CASE WHEN is_premium = true THEN 1 ELSE 0 END) as premium_remedies
FROM medicine_traditionnel
GROUP BY category
ORDER BY category;
