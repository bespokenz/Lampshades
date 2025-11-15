import React from 'react';
import type { LampshadeDimensions, Unit, Shape, ValidationErrors, SavedPattern } from '../types';

interface InputFormProps {
  dimensions: LampshadeDimensions;
  setDimensions: React.Dispatch<React.SetStateAction<LampshadeDimensions>>;
  onGenerate: () => void;
  errors: ValidationErrors;
  isGenerating: boolean;
  savedPatterns: SavedPattern[];
  onLoadPattern: (id: number) => void;
  onDeletePattern: (id: number) => void;
}

interface InputFieldProps {
  id: keyof Omit<LampshadeDimensions, 'unit' | 'shape'>;
  label: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  unit: string;
  description: string;
  error?: string;
}

const SavedPatternsList: React.FC<{
  patterns: SavedPattern[];
  onLoad: (id: number) => void;
  onDelete: (id: number) => void;
}> = ({ patterns, onLoad, onDelete }) => {
  if (patterns.length === 0) {
    return null; // Don't show anything if there are no saved patterns
  }

  const getPatternDescription = (p: SavedPattern) => {
    const shape = p.shape.charAt(0).toUpperCase() + p.shape.slice(1);
    if (p.shape === 'drum') {
      return `${shape}: Ø${p.bottomDiameter} x ${p.height} ${p.unit}`;
    }
    return `${shape}: ${p.topDiameter}/${p.bottomDiameter} x ${p.height} ${p.unit}`;
  };

  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">Saved Patterns</h3>
      <div className="space-y-2 max-h-48 overflow-y-auto pr-2 rounded-md border border-gray-200 dark:border-gray-700 p-2">
        {patterns.map(pattern => (
          <div key={pattern.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
            <span className="text-sm text-gray-700 dark:text-gray-300 truncate pr-2">{getPatternDescription(pattern)}</span>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <button 
                onClick={() => onLoad(pattern.id)} 
                className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium"
                aria-label={`Load pattern ${getPatternDescription(pattern)}`}
              >
                Load
              </button>
              <button 
                onClick={() => onDelete(pattern.id)}
                className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                aria-label={`Delete pattern ${getPatternDescription(pattern)}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const InputField: React.FC<InputFieldProps> = ({ id, label, value, onChange, unit, description, error }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
    </label>
    <div className="mt-1 relative rounded-md shadow-sm">
      <input
        type="number"
        name={id}
        id={id}
        className={`block w-full pr-12 pl-4 py-3 border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 sm:text-sm ${error ? 'border-red-500' : 'border-gray-300'}`}
        placeholder="0.0"
        value={value}
        onChange={onChange}
        min="0"
        step="0.1"
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <span className="text-gray-500 dark:text-gray-400 sm:text-sm">{unit}</span>
      </div>
    </div>
    {error && <p id={`${id}-error`} className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{description}</p>
  </div>
);

const ShapeSelector: React.FC<{ selectedShape: Shape; onChange: (shape: Shape) => void; }> = ({ selectedShape, onChange }) => {
  const shapes: { id: Shape, label: string }[] = [
    { id: 'cone', label: 'Cone' },
    { id: 'empire', label: 'Empire' },
    { id: 'drum', label: 'Drum' },
  ];

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Lampshade Shape
      </label>
      <fieldset className="mt-2">
        <legend className="sr-only">Lampshade shape</legend>
        <div className="flex items-center space-x-4">
          {shapes.map((shape) => (
            <div key={shape.id} className="flex items-center">
              <input
                id={shape.id}
                name="shape"
                type="radio"
                checked={selectedShape === shape.id}
                onChange={() => onChange(shape.id)}
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 dark:bg-gray-700 dark:border-gray-600"
              />
              <label htmlFor={shape.id} className="ml-2 block text-sm text-gray-900 dark:text-gray-200">
                {shape.label}
              </label>
            </div>
          ))}
        </div>
      </fieldset>
    </div>
  );
};


const InputForm: React.FC<InputFormProps> = ({ dimensions, setDimensions, onGenerate, errors, isGenerating, savedPatterns, onLoadPattern, onDeletePattern }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDimensions(prev => ({
      ...prev,
      [name]: value === '' ? 0 : parseFloat(value),
    }));
  };

  const handleDrumDiameterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const numValue = value === '' ? 0 : parseFloat(value);
    setDimensions(prev => ({
      ...prev,
      topDiameter: numValue,
      bottomDiameter: numValue,
    }));
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDimensions(prev => ({
      ...prev,
      unit: e.target.value as Unit,
    }));
  };

  const handleShapeChange = (shape: Shape) => {
    setDimensions(prev => {
      const newDims = { ...prev, shape };
      if (shape === 'drum') {
        const diameter = Math.max(prev.topDiameter, prev.bottomDiameter) || prev.bottomDiameter || 0;
        newDims.topDiameter = diameter;
        newDims.bottomDiameter = diameter;
      }
      return newDims;
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-700 dark:text-gray-300">Dimensions</h2>
      <SavedPatternsList patterns={savedPatterns} onLoad={onLoadPattern} onDelete={onDeletePattern} />
      <div className="space-y-6">
        <ShapeSelector selectedShape={dimensions.shape} onChange={handleShapeChange} />
        <div>
          <label htmlFor="unit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Unit of Measurement
          </label>
          <select
            id="unit"
            name="unit"
            value={dimensions.unit}
            onChange={handleUnitChange}
            className="mt-1 block w-full pl-3 pr-10 py-3 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 sm:text-sm rounded-md"
          >
            <option value="cm">Centimeters (cm)</option>
            <option value="in">Inches (in)</option>
            <option value="px">Pixels (px)</option>
          </select>
        </div>

        {dimensions.shape === 'drum' ? (
          <InputField
            id="bottomDiameter"
            label="Diameter"
            value={dimensions.bottomDiameter}
            onChange={handleDrumDiameterChange}
            unit={dimensions.unit}
            description="Diameter of the top and bottom of the drum shade."
            error={errors.bottomDiameter || errors.topDiameter}
          />
        ) : (
          <>
            <InputField
              id="topDiameter"
              label="Top Diameter"
              value={dimensions.topDiameter}
              onChange={handleChange}
              unit={dimensions.unit}
              description="Diameter of the top opening of the lampshade."
              error={errors.topDiameter}
            />
            <InputField
              id="bottomDiameter"
              label="Bottom Diameter"
              value={dimensions.bottomDiameter}
              onChange={handleChange}
              unit={dimensions.unit}
              description="Diameter of the bottom opening of the lampshade."
              error={errors.bottomDiameter}
            />
          </>
        )}

        <InputField
          id="height"
          label="Vertical Height"
          value={dimensions.height}
          onChange={handleChange}
          unit={dimensions.unit}
          description="The straight, vertical height of the lampshade."
          error={errors.height}
        />
        <div>
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600 active:bg-indigo-800 dark:active:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : 'Generate Pattern'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputForm;