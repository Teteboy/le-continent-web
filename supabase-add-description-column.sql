-- =====================================================
-- ADD DESCRIPTION COLUMN TO VILLAGES TABLE
-- =====================================================

-- Step 1: Add the description column
ALTER TABLE villages 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Step 2: Add description for rìkpà' (Bafia)
UPDATE villages SET 
  description = 'La langue rɨ̀kpà'' appartient à la famille des langues bantu au Cameroun. Elle est principalement parlée dans le département du Mbam-Inoubou par environ 60000 locuteurs et elle est utilisée dans la vie quotidienne. Certaines personnes la parlent en milieu rural, tandis que d''autres utilisent le français ou l''anglais dans les contextes urbains et formels. Le rɨ̀kpà'' est une langue tonale (02), ce qui signifie que la hauteur des sons peut changer le sens des mots. La structure grammaticale comprend la conjugaison et les affixes ; l''ordre des mots est sujet-verbe-objet. Le rɨ̀kpà'' est intégré aux traditions culturelles des peuples bafia, avec des contes folkloriques, des danses et des rituels où elle joue un rôle central. Les études de Guarisma montre que la langue a un alphabet contenant des voyelles, des consonnes et des tons.'
WHERE name LIKE 'rìkpà%';

-- You can add more descriptions for other villages:
-- UPDATE villages SET description = 'Your description here' WHERE name LIKE 'fe''efe%';
-- UPDATE villages SET description = 'Your description here' WHERE name LIKE 'ewondo%';
-- etc.

-- Verify the data
-- SELECT id, name, description FROM villages;