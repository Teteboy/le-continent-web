import type { Invention, TraditionalJob, PremiumContent } from '../types';

export const INVENTIONS: Invention[] = [
  {
    id: '1',
    title: 'Piano numérique Njock',
    description: 'Piano électronique inventé par le Camerounais Jean-Claude Njock',
    year: '1980',
    category: 'Musique',
    icon: '🎹',
  },
  {
    id: '2',
    title: 'Foyer amélioré',
    description: 'Foyer économe en bois inventé par le Dr. Thomas Ngijol',
    year: '1995',
    category: 'Énergie',
    icon: '🔥',
  },
  {
    id: '3',
    title: 'Plante médicinale Prunus africana',
    description: 'Découverte des propriétés thérapeutiques contre les troubles prostatiques',
    year: '1970',
    category: 'Médecine',
    icon: '🌿',
  },
  {
    id: '4',
    title: "Système d'irrigation goutte-à-goutte",
    description: 'Adaptation innovante pour les zones arides du Nord',
    year: '2005',
    category: 'Agriculture',
    icon: '💧',
  },
];

export const TRADITIONAL_JOBS: TraditionalJob[] = [
  { id: '1', name: 'Forgeron Bamiléké', description: "Maîtrise du fer et création d'outils agricoles", region: 'Ouest' },
  { id: '2', name: 'Pêcheur Sawa', description: 'Techniques de pêche traditionnelles en pirogue', region: 'Littoral' },
  { id: '3', name: 'Potière Bamoun', description: 'Art de la poterie avec des motifs traditionnels', region: 'Ouest' },
  { id: '4', name: 'Tisseur de raphia', description: 'Tissage du raphia pour vêtements et décorations', region: 'Centre' },
];

export const PREMIUM_CONTENT: PremiumContent[] = [
  {
    id: '1',
    title: 'Mets Traditionnels',
    description: 'Recettes authentiques avec vidéos de préparation',
    icon: 'utensils',
    color: '#E67E22',
    items: ['Ndolè', 'Eru', 'Koki', 'Achu', 'Nkui'],
    freeItems: ['Ndolè', 'Eru', 'Koki'],
  },
  {
    id: '2',
    title: 'Alphabets Locaux',
    description: 'Apprenez à lire et écrire les langues camerounaises',
    icon: 'book-open',
    color: '#2980B9',
    items: ['Bassa', 'Bamoun', 'Ewondo', 'Fulfuldé', 'Duala'],
    freeItems: ['Bassa', 'Bamoun', 'Ewondo'],
  },
  {
    id: '3',
    title: 'Proverbes & Sagesse',
    description: '500+ proverbes avec explications et audio',
    icon: 'message-circle',
    color: '#27AE60',
    items: ['Proverbes Bamiléké', 'Sagesse Peule', 'Paroles Sawa', 'Maximes Béti'],
    freeItems: ['Proverbes Bamiléké', 'Sagesse Peule', 'Paroles Sawa'],
  },
  {
    id: '4',
    title: 'Histoire Complète',
    description: "De la préhistoire à l'époque contemporaine",
    icon: 'scroll',
    color: '#9B59B6',
    items: ['Royaumes anciens', 'Colonisation', 'Indépendance', 'Époque moderne'],
    freeItems: ['Royaumes anciens', 'Colonisation', 'Indépendance'],
  },
  {
    id: '5',
    title: 'Audio & Prononciation',
    description: 'Enregistrements audio par des locuteurs natifs',
    icon: 'volume-2',
    color: '#8B0000',
    items: ['Dialogues', 'Chants', 'Contes', 'Prononciation'],
    freeItems: ['Dialogues', 'Chants', 'Contes'],
  },
  {
    id: '6',
    title: 'Documentaires Exclusifs',
    description: 'Vidéos HD sur les traditions vivantes',
    icon: 'video',
    color: '#34495E',
    items: ['Cérémonies', 'Festivals', 'Rites', 'Artisanat'],
    freeItems: ['Cérémonies', 'Festivals', 'Rites'],
  },
  {
    id: '7',
    title: 'Dictionnaire Numérique',
    description: 'Traduire toutes les langues maternelles',
    icon: 'languages',
    color: '#16A085',
    items: ['Français-Anglais', 'Français-Bassa', 'Français-Bamoun', 'Français-Ewondo', 'Français-Fulfuldé'],
    freeItems: ['Français-Anglais', 'Français-Bassa', 'Français-Bamoun'],
  },
];
