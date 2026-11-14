// Contrato entre a interface do hero e a cena 3D.
export interface ProgressSource {
  get(): number;
  subscribe(cb: (p: number) => void): () => void;
}

export type HeroQuality = 'high' | 'low';
export type HeroLayout = 'wide' | 'tall';

export interface HeroSceneProps {
  progress: ProgressSource;
  quality: HeroQuality;
  active: boolean;
  layout: HeroLayout;
  onReady: () => void;
  onProgress?: (value: number) => void;
  onError: (e: unknown) => void;
}
