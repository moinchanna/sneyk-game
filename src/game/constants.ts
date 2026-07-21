export const GRID_CELLS = 20;

export const INITIAL_SPEED = 150; // ms per tick
export const MIN_SPEED = 60; // fastest update speed
export const SPEED_INCREMENT = 4; // decrease tick delay (increase speed) by this amount per food eaten

export const INITIAL_SNAKE_LENGTH = 4;

export const STORAGE_KEYS = {
  BEST_SCORE: 'sneyk.bestScore.v1',
  SOUND_PREF: 'sneyk.soundPref.v1',
  REDUCED_MOTION: 'sneyk.reducedMotionPref.v1'
} as const;

export const DIRECTIONS: Record<string, { x: number; y: number }> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 }
};

export const OPPOSITE_DIRECTIONS: Record<string, string> = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT'
};
