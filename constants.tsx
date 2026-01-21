
import React from 'react';

export const THEME_CONFIGS = {
  'Astronauta Espacial': {
    primary: '#1e3a8a',
    secondary: '#3b82f6',
    accent: '#fbbf24',
    prompt: 'wearing a cute high-tech space suit, floating among tiny stars and planets, soft blue and silver colors'
  },
  'Safari Baby': {
    primary: '#166534',
    secondary: '#4ade80',
    accent: '#facc15',
    prompt: 'wearing a cute explorer outfit with a khaki hat, surrounded by tiny tropical leaves, soft green and earth tones'
  },
  'Fada Encantada': {
    primary: '#701a75',
    secondary: '#d946ef',
    accent: '#fdf4ff',
    prompt: 'wearing a magical dress with sparkly translucent wings, holding a tiny star wand, surrounded by magic dust and flowers, pastel pink and purple colors'
  },
  'Dino Baby': {
    primary: '#14532d',
    secondary: '#84cc16',
    accent: '#f97316',
    prompt: 'wearing a cute dinosaur hoodie with soft spikes, surrounded by primitive plants and tiny eggs, vibrant green and orange'
  },
  'Princesa Real': {
    primary: '#9d174d',
    secondary: '#ec4899',
    accent: '#fde68a',
    prompt: 'wearing a royal elegant dress with a small gold crown, surrounded by magic sparkles and roses, soft pink and gold tones'
  },
  'Super-Herói Moderno': {
    primary: '#991b1b',
    secondary: '#ef4444',
    accent: '#2563eb',
    prompt: 'wearing a stylized superhero costume with a dynamic cape, heroic but cute pose, comic style elements, bold red and blue'
  },
  'Circo Mágico': {
    primary: '#b91c1c',
    secondary: '#facc15',
    accent: '#1e40af',
    prompt: 'wearing a colorful circus ringmaster outfit, small hat, surrounded by festive flags and balloons, vibrant red and yellow'
  },
  'Confeitaria Doce': {
    primary: '#be185d',
    secondary: '#f472b6',
    accent: '#7dd3fc',
    prompt: 'wearing a cute chef hat and apron, surrounded by floating cupcakes and candies, soft pastel colors'
  }
};

export const Icons = {
  MagicWand: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.456-2.455l.259-1.036.259 1.036a3.375 3.375 0 002.455 2.456l1.035.259-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  ),
  Upload: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  ),
  Check: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
};
