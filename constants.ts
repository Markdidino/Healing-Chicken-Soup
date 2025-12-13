import { Language, TextResources } from './types';

export const TEXTS: TextResources = {
  [Language.ZH]: {
    title: "療育雞湯",
    description: "累了嗎？上次喝雞湯是什麼時候呢？\n喝雞湯的時候，點一點油滴間的界線，\n小油滴就會融為一個大油滴，\n試著把所有油滴都點在一起吧！\n請慢慢品嘗。",
    startButton: "開始喝雞湯",
    scatterHint: "攪拌一下",
  },
  [Language.EN]: {
    title: "Healing Chicken Soup",
    description: "Tired? When was the last time you had chicken soup?\nClick the boundaries between droplets to merge them.\nLet the warmth heal you.",
    startButton: "Start Sipping",
    scatterHint: "Stir",
  },
};

export const COLORS = {
  // Rich golden broth background
  broth: '#F4C430', 
  // Lighter oil color (semi-transparent)
  oilFill: 'rgba(255, 245, 150, 0.4)',
  // Subtle darker rim for the oil
  oilStroke: 'rgba(218, 165, 32, 0.6)',
  // Highlight
  highlight: 'rgba(255, 255, 255, 0.6)',
};

// Physics Constants
export const SPLIT_RADIUS_THRESHOLD = 15; 
export const MERGE_DISTANCE_FACTOR = 1.2; 
export const MOUSE_REPULSION_RADIUS = 75; 
export const MOUSE_REPULSION_FORCE = 0.005;