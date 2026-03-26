-- =====================================================
-- SAFE UPDATE: Add ethnic group data without losing existing data
-- This script only INSERTs new records - does not delete anything
-- =====================================================

-- If you want to KEEP existing data and just add new ethnic groups,
-- comment out the TRUNCATE line and use INSERT (or use UPSERT)

-- Option 1: If table is empty, use this to populate
-- (Uncomment the next line if you want to clear existing data first)
-- TRUNCATE TABLE villages RESTART IDENTITY CASCADE;

-- Option 2: Add new ethnic groups WITHOUT deleting existing data
-- (Use this to keep your current data AND add new ethnic groups)

INSERT INTO villages (name, region, image_url) VALUES
-- Ewondo (Beti group)
('Ewondo (Beti, Boulou, Fang)', 'Cameroun, Centre', 'https://flagcdn.com/w320/cm.png'),

-- fe''efe'' (Bamiléké group)
('fe''efe'' (Bafang, Bana, Bandoum, Bangou, Batcham, Djombi, Foto, Ketchoua, Lemanko, Makone, Megane, Ndeup, Ngambe, Ngnitchok, Njappe, Pelep, Tedong, Yergon)', 'Cameroun, Ouest (Haut-Nkam)', 'https://flagcdn.com/w320/cm.png'),

-- bàsàa (Bassa)
('bàsàa (Bassa)', 'Cameroun, Centre, Littoral', 'https://flagcdn.com/w320/cm.png'),

-- eton (Eton)
('eton (Mvognamnye, Batchenga, Nkol Metet, Odou, Akok, Mbankomo)', 'Cameroun, Centre (Lekié, Natchigal)', 'https://flagcdn.com/w320/cm.png'),

-- duálá (Sawa/Douala)
('duálá (Sawa, Douala, Bakweri)', 'Cameroun, Littoral', 'https://flagcdn.com/w320/cm.png'),

-- bakókō (Bakoko)
('bakókō (Adie, Bakoko du Moungo, Bakoko du Wouri, Bodiman, Bonadikombo, Bonamoussadi, Bonenfant, Diboue, Djebale, Ekouk, Ele, Ibong, Isangela, Koupe, Libanda, Lingambi, Logbadjeck, Longji, Lot)', 'Cameroun, Littoral, Sud, Nkam, Wouri, Moungo', 'https://flagcdn.com/w320/cm.png'),

-- rìkpà'' (Bafia)
('rìkpà'' (Bafia, Bangoa, Bikossi, Billi, Bini, Bissaya, Boketa, Bokolo, Bongo, Boufoun, Boyeng, Ibout, Ie, Kottou, Koulou, Koupu, Kpet, Kpwe, Lembe, Lemgo, Lissa, Lom, Mbamba, Mbebe, Mbeo, Mbida, Mbilet, Mbouo, Meboka, Mebonkou, Medjap, Mefou, Meka, Mekas, Mendong, Messe, Mettou, Meye, Mimbang, Mpane, Mpanba, Ndelle, Ndika, Ndjap, Njob, Nlob, Nnuk, Nyabey, Nyamandap, Nyamvout, Nying, Nzima, Obob, Obou, Okak, Ongot, Ossele, Oyisse, Yapopa, Yekaba)', 'Cameroun, Centre (Bafia)', 'https://flagcdn.com/w320/cm.png'),

-- Additional ethnic groups
('Bamiléké (fe''efe'', Bafang, Bandoum, Foto, Megane, Ndeup)', 'Cameroun, Ouest', 'https://flagcdn.com/w320/cm.png'),
('Sawa (Douala, Bakoko, Yabassi, Bonaberi)', 'Cameroun, Littoral', 'https://flagcdn.com/w320/cm.png'),
('Peuls (Fulbé, Fulfuldé, Bororo, Wandala)', 'Cameroun, Extrême-Nord, Nord, Adamaoua', 'https://flagcdn.com/w320/cm.png'),
('Béti (Ewondo, Bulu, Fang, Mvog)', 'Cameroun, Centre, Sud, Littoral', 'https://flagcdn.com/w320/cm.png'),
('Bamoun (Shümom, Noun)', 'Cameroun, Ouest (Foumban)', 'https://flagcdn.com/w320/cm.png'),
('Bassa (Bàsàa, Mpo, Li)', 'Cameroun, Littoral, Centre', 'https://flagcdn.com/w320/cm.png'),
('Duala (Duálá, Bonadikombo, Bonamoussadi)', 'Cameroun, Littoral', 'https://flagcdn.com/w320/cm.png'),
('Kanembu (Kanembou, Boudouma)', 'Cameroun, Extrême-Nord', 'https://flagcdn.com/w320/cm.png'),
('Moundang (Moundang, Tk)', 'Cameroun, Extrême-Nord', 'https://flagcdn.com/w320/cm.png'),
('Toupouri (Toupouri, Kera)', 'Cameroun, Extrême-Nord', 'https://flagcdn.com/w320/cm.png'),
('Mbororo (Bororo, Wodaabe)', 'Cameroun, Adamaoua, Nord', 'https://flagcdn.com/w320/cm.png'),
('Bakoko (Bakoko, Yabassi)', 'Cameroun, Littoral', 'https://flagcdn.com/w320/cm.png');

-- =====================================================
-- BACKUP BEFORE RUNNING:
-- If you want to backup your data first, run this query:
-- SELECT * FROM villages;
-- Then copy the results to save them somewhere
-- =====================================================