
export type ItemType = 
  | 'character' 
  | 'expressions' 
  | 'topper' 
  | 'tags' 
  | 'stickers' 
  | 'invitation' 
  | 'age_number' 
  | 'panel';

export interface GeneratedImage {
  id: string;
  type: ItemType;
  url: string;
  label: string;
}

export interface GenerationState {
  isGenerating: boolean;
  step: string;
  progress: number;
}

export type IllustrationStyle = 'cartoon' | 'pixar';
export type VisualTone = 'cute' | 'adventurous' | 'magical' | 'fun';
