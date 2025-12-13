export enum Language {
  ZH = 'ZH',
  EN = 'EN'
}

export interface Vector2 {
  x: number;
  y: number;
}

export interface Droplet {
  id: string;
  x: number;
  y: number;
  radius: number;
  targetRadius: number; // For animation smoothing when merging
  vx: number;
  vy: number;
  colorOffset: number; // Slight variation in hue
  shapeOffsets: number[]; // Array of multipliers. Empty if perfectly round.
  rotation: number; // Current rotation angle for the shape
  rotationSpeed: number;
}

export interface Texts {
  title: string;
  description: string;
  startButton: string;
  scatterHint: string;
}

export type TextResources = Record<Language, Texts>;