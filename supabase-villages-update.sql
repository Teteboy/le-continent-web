-- =====================================================
-- INSERT MISSING VILLAGES INTO THE DATABASE
-- Only adds rows that don't already exist (ON CONFLICT DO NOTHING)
-- =====================================================

INSERT INTO villages (name, region, image_url) VALUES
-- tunen (Banen)
('tunen (Banen)', 'Cameroun, Centre, Littoral', 'https://flagcdn.com/w320/cm.png'),

-- manguissa (Manguissa)
('manguissa (Manguissa)', 'Cameroun, Centre (Lekié)', 'https://flagcdn.com/w320/cm.png'),

-- mokpè (Mokpè)
('mokpè (Mokpè, Havko, Tiko, Buea, Limbe, Mutengene)', 'Cameroun, Sud-ouest', 'https://flagcdn.com/w320/cm.png'),

-- gbaya (Gbaya)
('gbaya (Gbaya, Lom et Djerem, Garoua-Boulaï, Faro et Déo)', 'Cameroun, Est', 'https://flagcdn.com/w320/cm.png'),

-- batanga
('batanga (Batanga bá Ndá, Banɔhɔ, Bapuku, Kribi 1, Kribi 2, Lokoundjé)', 'Cameroun, Sud', 'https://flagcdn.com/w320/cm.png'),

-- búlu (Bulu)
('búlu (Bulu, Biyem, Esaebeng, Djoum, Sangmelima)', 'Cameroun, Sud', 'https://flagcdn.com/w320/cm.png'),

-- lamnso (NSO')
('lamnso (NSO'', Bui, Kumbo, Jakiri, Nkum, Mbiameand)', 'Cameroun, Nord-ouest', 'https://flagcdn.com/w320/cm.png'),

-- ngiembɔɔn
('ngiembɔɔn (Balatchi, Bangang, Bamougong, Bamboutos, Mbouda, Batcham)', 'Cameroun, Ouest', 'https://flagcdn.com/w320/cm.png')
ON CONFLICT (name) DO NOTHING;
