export const BOARD_COLUMNS = 32;
export const BOARD_ROWS = 18;

export const INITIAL_SPEED = 72; // ms per tick (FAST)
export const MIN_SPEED = 38; // fastest update speed (TURBO)
export const SPEED_INCREMENT = 1.5; // speed increase step per food eaten

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
