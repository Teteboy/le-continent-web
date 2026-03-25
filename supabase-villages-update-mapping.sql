-- =====================================================
-- UPDATE villages with detailed information
-- Maps old names to new detailed format
-- =====================================================

-- Bafang → fe'efe
UPDATE villages SET 
  name = 'fe''efe'' (Bafang, Bana, Bandoum, Bangou, Batcham, Djombi, Foto, Ketchoua, Lemanko, Makone, Megane, Ndeup, Ngambe, Ngnitchok, Njappe, Pelep, Tedong, Yergon)',
  region = 'Cameroun, Ouest (Haut-Nkam)'
WHERE name = 'Bafang' AND region = 'Ouest';

-- Bafia → rìkpà'
UPDATE villages SET 
  name = 'rìkpà'' (Bafia, Bangoa, Bikossi, Billi, Bini, Bissaya, Boketa, Bokolo, Bongo, Boufoun, Boyeng, Ibout, Ie, Kottou, Koulou, Koupu, Kpet, Kpwe, Lembe, Lemgo, Lissa, Lom, Mbamba, Mbebe, Mbeo, Mbida, Mbilet, Mbouo, Meboka, Mebonkou, Medjap, Mefou, Meka, Mekas, Mendong, Messe, Mettou, Meye, Mimbang, Mpane, Mpanba, Ndelle, Ndika, Ndjap, Njob, Nlob, Nnuk, Nyabey, Nyamandap, Nyamvout, Nying, Nzima, Obob, Obou, Okak, Ongot, Ossele, Oyisse, Yapopa, Yekaba)',
  region = 'Cameroun, Centre (Bafia)'
WHERE name = 'Bafia' AND region = 'Centre';

-- Bafoussam → ghɔmálá' nord
UPDATE villages SET 
  name = 'ghɔmálá'' nord (Baleng, Bamougoum, Bafoussam...)',
  region = 'Cameroun, Ouest (Mifi)'
WHERE name = 'Bafoussam' AND region = 'Ouest';

-- Bandjoun → ghɔmálá' centre
UPDATE villages SET 
  name = 'ghɔmálá'' centre (Baham, Bandjoun...)',
  region = 'Cameroun, Ouest (Haut-plateaux, Koung-Khi)'
WHERE name = 'Bandjoun' AND region = 'Ouest';

-- Bamoun → shü pámə̀m
UPDATE villages SET 
  name = 'shü pámə̀m (Bamoun, Noun)',
  region = 'Cameroun, Ouest (Noun)'
WHERE name = 'Bamoun' AND region = 'Littoral';

-- Bangangte → mə́dʉ̂mbà
UPDATE villages SET 
  name = 'mə́dʉ̂mbà (Bangangté, Bakong, Bangoulap,...)',
  region = 'Cameroun, Ouest (Ndé)'
WHERE name = 'Bangangte' AND region = 'Ouest';

-- Bassa → bàsàa
UPDATE villages SET 
  name = 'bàsàa (Bassa)',
  region = 'Cameroun, Centre, Littoral'
WHERE name = 'Bassa' AND region = 'Bassa';

-- Batanga → batanga
UPDATE villages SET 
  name = 'batanga (Batanga bá Ndá, les Banɔhɔ, les Bapuku...)',
  region = 'Cameroun, Sud (Kribi, Lokoundjé)'
WHERE name = 'Batanga' AND region = 'Littoral';

-- Bulu → búlu
UPDATE villages SET 
  name = 'búlu (Bulu, Biyem, Esaebeng...)',
  region = 'Cameroun, Sud (Djoum, Sangmelima)'
WHERE name = 'Bulu' AND region = 'Sud';

-- Ewondo → ewondo
UPDATE villages SET 
  name = 'ewondo (Ewondo)',
  region = 'Cameroun, Centre'
WHERE name = 'Ewondo' AND region = 'Centre';

-- Fulfulde → fulfulde
UPDATE villages SET 
  name = 'fulfulde (Peulhs, Foulbés, Fufuldé)',
  region = 'Cameroun, Nord, Extrême-Nord'
WHERE name = 'Fulfulde' AND region = 'Nord';

-- Eton → eton
UPDATE villages SET 
  name = 'eton (Eton, Mvognamnye, Batchenga...)',
  region = 'Cameroun, Centre (Lekié, Natchigal)'
WHERE name = 'Eton' AND region = 'Centre';

-- Verify the updates
-- SELECT id, name, region FROM villages ORDER BY id;