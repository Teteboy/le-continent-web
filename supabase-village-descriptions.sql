-- =====================================================
-- UPDATE VILLAGES WITH LANGUAGE DESCRIPTIONS
-- Using dollar quoting to handle special characters
-- =====================================================

-- First, ensure the description column exists
ALTER TABLE villages ADD COLUMN IF NOT EXISTS description TEXT;

-- Update descriptions based on the provided mapping

-- 1. fe'efe' (from Bafang)
UPDATE villages 
SET description = $$L'alphabet fe'efe' (bamiléké) comprend de nombreuses lettres. Cette langue est parlée dans la région de l'Ouest Cameroun, particulièrement dans le département du Haut-Nkam. Elle compte plusieurs variantes régionales.$$
WHERE name ILIKE '%fe''efe''%' OR (name ILIKE '%Bafang%' AND region ILIKE '%Ouest%');

-- 2. rìkpà' (from Bafia)
UPDATE villages 
SET description = $$L'alphabet mə́dʉ̂mbà comprend 33 lettres, dont 23 consonnes et 10 voyelles. La langue contient 5 tons, dont 3 ponctuels et 2 mélodiques.$$
WHERE name ILIKE '%rìkpà''%' OR (name ILIKE '%Bafia%' AND region ILIKE '%Centre%');

-- 3. ghɔmálá' nord (from Bafoussam)
UPDATE villages 
SET description = $$Le ghɔmalá est une langue parlée dans la région de l'Ouest Cameroun. Le ghɔmálá' nord est parlé dans les régions de Baleng, Bamougoum, Bafoussam et leurs environs. Cette langue compte plusieurs variantes régionales.$$
WHERE name ILIKE '%ghɔmálá''%nord%' OR (name ILIKE '%Bafoussam%' AND region ILIKE '%Ouest%');

-- 4. ghɔmálá' centre (from Bandjoun)
UPDATE villages 
SET description = $$Le ghɔmálá' centre est une variante du ghɔmalá parlée dans les régions de Baham, Bandjoun et le département des Hauts-Plateaux et Koung-Khi. Cette langue fait partie du groupe bamiléké.$$
WHERE name ILIKE '%ghɔmálá''%centre%' OR (name ILIKE '%Bandjoun%' AND region ILIKE '%Ouest%');

-- 5. shü pámə̀m (from Bamoun)
UPDATE villages 
SET description = $$Le shü pámə̀m signifie littéralement langue des mə̀m. C'est une langue fut empruntée par les fondateurs du royaume bamoun et imposée à tous les bamum comme langue principale dans tout le pays bamoun. Le shü pámə̀m est parlée à l'Ouest Cameroun, précisément dans le département du NOUN. Elle s'étend sur 9 arrondissements dont : Foumban, Foumbot, koutaba, Bangourain, Kouoptamo, Magba, Malatouen, Njimom et Massangam. Dieu et Renaud en 1983 la classent dans la branche EST-Grassfield du bantou grassfield. Son code ALCAM est le (991).$$
WHERE name ILIKE '%shü pámə̀m%' OR (name ILIKE '%Bamoun%' AND region ILIKE '%Ouest%');

-- 6. mə́dʉ̂mbà (from Bangangté)
UPDATE villages 
SET description = $$L'alphabet mə́dʉ̂mbà (miag ŋwa'ni mə́dʉ̂mbà) comprend 33 lettres, dont 23 consonnes et 10 voyelles. La langue contient 5 tons, dont 3 ponctuels et 2 mélodiques. Cette langue est parlée dans la région de l'Ouest Cameroun, particulièrement dans le département du Ndé (Bangangté, Bakong, Bangoulap).$$
WHERE name ILIKE '%mə́dʉ̂mbà%' OR (name ILIKE '%Bangangte%' AND region ILIKE '%Ouest%');

-- 7. bàsàa (from Bassa)
UPDATE villages 
SET description = $$La langue Bàsàa est une langue bantoue parlée par les peuples que l'on retrouve majoritairement dans les régions du Centre et du Littoral au Cameroun. Comme toutes les langues, la langue Bàsàa repose sur l'alphabet. Les écrits en langue Bàsàa sont, pour certains, avec l'ancienne écriture (Bibanga) et pour d'autres avec la nouvelle écriture (Makedel). Pour ce qui est de la nouvelle écriture, son alphabet est constitué de trois principaux éléments : les voyelles, les consonnes et les tons.$$
WHERE name ILIKE '%bàsàa%' OR (name ILIKE '%Bassa%' AND region ILIKE '%Littoral%');

-- 8. batanga (from Batanga)
UPDATE villages 
SET description = $$L'Alphabet BATANGA nommé Kómbóvi yá Mehálo mé Batanga compte 31 graphèmes répartis en 7 voyelles, 17 consonnes simples et 7 consonnes complexes, avec 4 tons attestés dont 2 tons simples et 2 tons complexes.$$
WHERE name ILIKE '%batanga%' OR (name ILIKE '%Batanga%' AND region ILIKE '%Littoral%');

-- 9. búlu (from Bulu)
UPDATE villages 
SET description = $$Le bulu est parlé dans le Sud du Cameroun où il se situe sur un axe transversal Est-Ouest qui va de Djoum et Bengbis à quelques kilomètres de kribi, en passant par Saïgmelima et Ebolowa. On comprend dès lors, que ce sont les départements du Dja et Lobo, de la Mvila et de l'Océan qui abritent les populations bulu. Bien que restreint en latitude, le territoire bulu couvre une distance de plus de 400 km.$$
WHERE name ILIKE '%búlu%' OR (name ILIKE '%Bulu%' AND region ILIKE '%Sud%');

-- 10. ewondo (from Ewondo)
UPDATE villages 
SET description = $$L'alphabet ewondo ou "nsamba bikanga ya nkɔbɔ éwondo" compte 42 sons distribuées en 18 consonnes simples, 11 consonnes complexes, 08 voyelles et 05 tons.$$
WHERE name ILIKE '%ewondo%' OR (name ILIKE '%Ewondo%' AND region ILIKE '%Centre%');

-- 11. fulfulde (from Fulfulde)
UPDATE villages 
SET description = $$Le fulfulde (ou fulfuldé, peul, foulfouldé) est une langue parlée par les Peuls dans la région du Nord et de l'Extrême-Nord du Cameroun. C'est une langue tonale avec un alphabet basé sur le latin.$$
WHERE name ILIKE '%fulfulde%' OR (name ILIKE '%Fulfulde%' AND region ILIKE '%Nord%');

-- 12. eton (from Eton)
UPDATE villages 
SET description = $$L'Eton est un parler du beti faŋ. C'est un dialecte parlé dans la région du centre au Cameroun plus précisément dans le département de la Lékié et dans les arrondissements que sont : Elig-Mfomo, Lobo, Bachenga, Evodoula, Okola, Obala et une partie de Sa'a. D'après les études de Van De Velde, plusieurs voyelles, consonnes et tons ont été inventoriés en Eton à savoir les voyelles simples, complexes ou longues, les consonnes simples et complexes.$$
WHERE name ILIKE '%eton%' OR (name ILIKE '%Eton%' AND region ILIKE '%Centre%');

-- Verify the updates
SELECT id, name, region, description FROM villages WHERE description IS NOT NULL AND description != '';
