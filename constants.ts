import type { LampshadeDimensions } from './types';

export const initialDimensions: LampshadeDimensions = {
  topDiameter: 20,
  bottomDiameter: 30,
  height: 20,
  unit: 'cm',
  shape: 'cone',
};

export const SAVED_PATTERNS_KEY = 'lampshade_saved_patterns';