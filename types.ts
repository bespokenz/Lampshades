export type Unit = 'in' | 'cm' | 'px';
export type Shape = 'cone' | 'empire' | 'drum';

export interface LampshadeDimensions {
  topDiameter: number;
  bottomDiameter: number;
  height: number;
  unit: Unit;
  shape: Shape;
}

export interface SavedPattern extends LampshadeDimensions {
  id: number; // Unique ID, typically a timestamp
}

export type ValidationErrors = Partial<Record<'topDiameter' | 'bottomDiameter' | 'height', string>>;

export type PatternData = ConePatternData | DrumPatternData;

export interface BasePatternData {
    viewBox: string;
    width: number;
    height: number;
    dimensions: LampshadeDimensions;
}

export interface ConePatternData extends BasePatternData {
  type: 'cone';
  pathD: string;
  slantHeight: number;
  topArcLength: number;
  bottomArcLength: number;
}

export interface DrumPatternData extends BasePatternData {
  type: 'drum';
  circumference: number;
}