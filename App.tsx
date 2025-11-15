import React, { useState, useCallback, useEffect } from 'react';
import type { LampshadeDimensions, PatternData, ValidationErrors, SavedPattern } from './types';
import { calculatePatternData } from './services/patternCalculator';
import InputForm from './components/InputForm';
import PatternPreview from './components/PatternPreview';
import Header from './components/Header';
import { initialDimensions, SAVED_PATTERNS_KEY } from './constants';
import { projectFiles } from './services/projectFiles';

// TypeScript declarations for globals from CDN
declare const JSZip: any;
declare const saveAs: any;


const App: React.FC = () => {
  const [dimensions, setDimensions] = useState<LampshadeDimensions>(initialDimensions);
  const [patternData, setPatternData] = useState<PatternData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [savedPatterns, setSavedPatterns] = useState<SavedPattern[]>([]);

  useEffect(() => {
    try {
      const storedPatterns = localStorage.getItem(SAVED_PATTERNS_KEY);
      if (storedPatterns) {
        setSavedPatterns(JSON.parse(storedPatterns));
      }
    } catch (e) {
      console.error("Failed to load saved patterns from localStorage", e);
    }
  }, []);

  const updateSavedPatterns = (newPatterns: SavedPattern[]) => {
    setSavedPatterns(newPatterns);
    try {
      localStorage.setItem(SAVED_PATTERNS_KEY, JSON.stringify(newPatterns));
    } catch (e) {
      console.error("Failed to save patterns to localStorage", e);
    }
  };

  const handleSavePattern = (dimensionsToSave: LampshadeDimensions) => {
    const newPattern: SavedPattern = {
      ...dimensionsToSave,
      id: Date.now(),
    };
    const newPatterns = [...savedPatterns, newPattern];
    updateSavedPatterns(newPatterns);
  };

  const handleLoadPattern = (id: number) => {
    const patternToLoad = savedPatterns.find(p => p.id === id);
    if (patternToLoad) {
      setDimensions(patternToLoad);
      setPatternData(null);
      setError(null);
      setValidationErrors({});
    }
  };

  const handleDeletePattern = (id: number) => {
    const newPatterns = savedPatterns.filter(p => p.id !== id);
    updateSavedPatterns(newPatterns);
  };
  
  const handleDownloadProject = async () => {
    try {
      if (typeof JSZip === 'undefined' || typeof saveAs === 'undefined') {
        console.error("JSZip or FileSaver not loaded");
        alert("Could not download project. Required libraries are missing.");
        return;
      }
      
      const zip = new JSZip();

      for (const file of projectFiles) {
        // JSZip creates folders automatically from the path
        zip.file(file.path, file.content.trim());
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'lampshade-pattern-generator.zip');

    } catch (e) {
      console.error("Failed to create zip file", e);
      alert("Sorry, there was an error creating the zip file.");
    }
  };

  const handleGenerate = useCallback(() => {
    setError(null);
    setPatternData(null);
    setValidationErrors({});
    
    const newErrors: ValidationErrors = {};
    if (dimensions.topDiameter <= 0) {
      newErrors.topDiameter = "Diameter must be greater than zero.";
    }
     if (dimensions.bottomDiameter <= 0) {
      newErrors.bottomDiameter = "Diameter must be greater than zero.";
    }
    if (dimensions.height <= 0) {
      newErrors.height = "Height must be greater than zero.";
    }
    if ((dimensions.shape === 'cone' || dimensions.shape === 'empire') && dimensions.topDiameter >= dimensions.bottomDiameter) {
        newErrors.topDiameter = "Top diameter must be smaller than bottom diameter for cone/empire shapes.";
    }

    if (Object.keys(newErrors).length > 0) {
      setValidationErrors(newErrors);
      return;
    }

    setIsGenerating(true);
    // Use a timeout to allow the UI to update to the "generating" state
    setTimeout(() => {
      try {
        const data = calculatePatternData(dimensions);
        setPatternData(data);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("An unknown error occurred during calculation.");
        }
      } finally {
        setIsGenerating(false);
      }
    }, 50);

  }, [dimensions]);

  return (
    <div id="printable-area" className="min-h-screen font-sans text-gray-800 dark:text-gray-200 transition-colors duration-300">
      <Header onDownloadProject={handleDownloadProject} />
      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="print:hidden">
            <InputForm 
              dimensions={dimensions} 
              setDimensions={setDimensions} 
              onGenerate={handleGenerate} 
              errors={validationErrors}
              isGenerating={isGenerating}
              savedPatterns={savedPatterns}
              onLoadPattern={handleLoadPattern}
              onDeletePattern={handleDeletePattern}
            />
          </div>
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold mb-4 text-gray-700 dark:text-gray-300">Pattern Preview</h2>
            <PatternPreview 
              patternData={patternData} 
              error={error}
              onSavePattern={handleSavePattern}
            />
          </div>
        </div>
      </main>
      <footer className="text-center p-4 text-gray-500 dark:text-gray-400 text-sm print:hidden">
        <p>Lampshade Pattern Generator &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default App;