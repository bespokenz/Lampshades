import React, { useRef, useState } from 'react';
import type { PatternData, Unit, LampshadeDimensions } from '../types';

interface PatternPreviewProps {
  patternData: PatternData | null;
  error: string | null;
  onSavePattern: (dimensions: LampshadeDimensions) => void;
}

const PPI = 96; // Pixels per inch, a standard for web/CSS

const convertToPx = (value: number, unit: Unit): number => {
    if (unit === 'in') return value * PPI;
    if (unit === 'cm') return (value / 2.54) * PPI;
    return value; // Assume px if not in or cm
};

const convertFromPx = (value: number, targetUnit: Unit): number => {
    if (targetUnit === 'in') return value / PPI;
    if (targetUnit === 'cm') return (value / PPI) * 2.54;
    return value; // Assume px
};


const PatternPreview: React.FC<PatternPreviewProps> = ({ patternData, error, onSavePattern }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [paperSize, setPaperSize] = useState<'A4' | 'Letter'>('A4');
  const [printUnit, setPrintUnit] = useState<Unit>('cm');

  const handleDownload = () => {
    if (!svgRef.current) return;

    const svgString = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lampshade-pattern.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleSave = () => {
    if (patternData) {
      onSavePattern(patternData.dimensions);
    }
  };

  const handlePrint = () => {
    if (!patternData || !svgRef.current) return;

    // 1. Constants
    const PAPER_SIZES = {
        'A4': { width: 8.27, height: 11.69 }, // inches
        'Letter': { width: 8.5, height: 11 }, // inches
    };
    const PRINT_MARGIN_IN = 0.5; // 0.5 inch margin

    // 2. Dimensions
    const patternWidthPx = convertToPx(patternData.width, patternData.dimensions.unit);
    const patternHeightPx = convertToPx(patternData.height, patternData.dimensions.unit);
    const patternWidthInPrintUnit = convertFromPx(patternWidthPx, printUnit);
    const patternHeightInPrintUnit = convertFromPx(patternHeightPx, printUnit);


    const pagePaperSize = PAPER_SIZES[paperSize];
    const printableWidthPx = (pagePaperSize.width - 2 * PRINT_MARGIN_IN) * PPI;
    const printableHeightPx = (pagePaperSize.height - 2 * PRINT_MARGIN_IN) * PPI;
    
    // 3. Grid Calculation
    const cols = Math.ceil(patternWidthPx / printableWidthPx);
    const rows = Math.ceil(patternHeightPx / printableHeightPx);
    if (cols * rows > 50) { // Safety break for very large patterns
        alert('This pattern is too large to print automatically (more than 50 pages). Please download the SVG and use a vector editor for tiling.');
        return;
    }
    const totalPages = cols * rows;

    // 4. DOM container for printing
    const printContainer = document.createElement('div');
    printContainer.id = 'print-container';
    
    const style = document.createElement('style');
    style.textContent = `
        @media print {
          body > *:not(#print-container) { display: none !important; }
          @page { size: ${paperSize}; margin: ${PRINT_MARGIN_IN}in; }
          .print-page {
            width: 100%;
            height: 100%;
            overflow: hidden;
            position: relative;
            box-sizing: border-box;
            page-break-after: always;
            border: 1px dashed #cccccc;
          }
          .print-svg-wrapper {
            position: absolute;
            width: ${patternWidthPx}px;
            height: ${patternHeightPx}px;
          }
          .page-info {
            position: absolute;
            top: 1mm;
            left: 1mm;
            font: 9pt sans-serif;
            color: #666;
            line-height: 1.2;
          }
           .page-info-assembly {
            position: absolute;
            bottom: 1mm;
            right: 1mm;
            font: 7pt sans-serif;
            color: #666;
            text-align: right;
          }
          .alignment-mark {
            position: absolute;
            font: 8pt sans-serif;
            color: #333;
            display: flex;
            align-items: center;
            white-space: nowrap;
          }
          .alignment-mark-top { top: 5px; left: 50%; transform: translateX(-50%); }
          .alignment-mark-bottom { bottom: 5px; left: 50%; transform: translateX(-50%); }
          .alignment-mark-left { left: 5px; top: 50%; transform: translateY(-50%); }
          .alignment-mark-right { right: 5px; top: 50%; transform: translateY(-50%); }
        }
    `;
    printContainer.appendChild(style);

    // 5. Create each page
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const page = document.createElement('div');
            page.className = 'print-page';
            
            const svgWrapper = document.createElement('div');
            svgWrapper.className = 'print-svg-wrapper';
            svgWrapper.style.left = `-${col * printableWidthPx}px`;
            svgWrapper.style.top = `-${row * printableHeightPx}px`;
            
            const svgClone = svgRef.current.cloneNode(true) as SVGSVGElement;
            svgClone.setAttribute('width', `${patternWidthPx}px`);
            svgClone.setAttribute('height', `${patternHeightPx}px`);
            svgWrapper.appendChild(svgClone);

            const pageInfo = document.createElement('div');
            pageInfo.className = 'page-info';
            pageInfo.innerHTML = `Lampshade Pattern - Page ${row * cols + col + 1} of ${totalPages}<br/>
                                  Total Size: ${patternWidthInPrintUnit.toFixed(2)} x ${patternHeightInPrintUnit.toFixed(2)} ${printUnit}`;


            const assemblyInfo = document.createElement('div');
            assemblyInfo.className = 'page-info-assembly';
            assemblyInfo.innerHTML = `(Row ${row + 1}, Col ${col + 1})`;

            page.appendChild(pageInfo);
            page.appendChild(assemblyInfo);
            
            // Add alignment marks
            if (row > 0) {
              const mark = document.createElement('div');
              mark.className = 'alignment-mark alignment-mark-top';
              mark.innerHTML = `▲ Join to R${row}, C${col + 1}`;
              page.appendChild(mark);
            }
            if (row < rows - 1) {
              const mark = document.createElement('div');
              mark.className = 'alignment-mark alignment-mark-bottom';
              mark.innerHTML = `▼ Join to R${row + 2}, C${col + 1}`;
              page.appendChild(mark);
            }
            if (col > 0) {
              const mark = document.createElement('div');
              mark.className = 'alignment-mark alignment-mark-left';
              mark.innerHTML = `◄ Join to R${row + 1}, C${col}`;
              page.appendChild(mark);
            }
            if (col < cols - 1) {
              const mark = document.createElement('div');
              mark.className = 'alignment-mark alignment-mark-right';
              mark.innerHTML = `► Join to R${row + 1}, C${col + 2}`;
              page.appendChild(mark);
            }

            page.appendChild(svgWrapper);
            printContainer.appendChild(page);
        }
    }
    
    // 6. Print and cleanup
    document.body.appendChild(printContainer);
    window.print();
    document.body.removeChild(printContainer);
  };


  const renderContent = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-red-600 dark:text-red-400">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
          <p className="font-semibold">Calculation Error</p>
          <p className="text-sm">{error}</p>
        </div>
      );
    }

    if (!patternData) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
           </svg>
          <p>Your pattern will appear here.</p>
          <p className="text-sm">Enter dimensions and click "Generate Pattern".</p>
        </div>
      );
    }
    
    const format = (num: number) => parseFloat(num.toFixed(3));
    const originalUnit = patternData.dimensions.unit;

    const displayWidth = convertFromPx(convertToPx(patternData.width, originalUnit), printUnit);
    const displayHeight = convertFromPx(convertToPx(patternData.height, originalUnit), printUnit);

    return (
      <div className="flex-grow flex flex-col">
        <div className="flex-grow p-4 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center overflow-auto">
            <svg
              ref={svgRef}
              xmlns="http://www.w3.org/2000/svg"
              viewBox={patternData.viewBox}
              className="max-w-full max-h-full bg-white"
              preserveAspectRatio="xMidYMid meet"
              style={{maxHeight: '50vh'}}
            >
                <title>Lampshade Pattern</title>
                <desc>
                    Generated pattern for a lampshade with top diameter {patternData.dimensions.topDiameter}, 
                    bottom diameter {patternData.dimensions.bottomDiameter}, and height {patternData.dimensions.height}.
                </desc>
              {patternData.type === 'cone' && (
                <path d={patternData.pathD} fill="none" stroke="black" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              )}
              {patternData.type === 'drum' && (
                <rect x="0" y="0" width={patternData.width} height={patternData.height} fill="none" stroke="black" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              )}
            </svg>
        </div>
        <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <h3 className="font-bold text-lg mb-2">Pattern Details</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600 dark:text-gray-400">Pattern Width:</span>
                <span className="font-mono text-right">{format(displayWidth)} {printUnit}</span>

                <span className="text-gray-600 dark:text-gray-400">Pattern Height:</span>
                <span className="font-mono text-right">{format(displayHeight)} {printUnit}</span>
                
                {patternData.type === 'cone' && <>
                    <span className="text-gray-600 dark:text-gray-400">Slant Height:</span>
                    <span className="font-mono text-right">{format(convertFromPx(convertToPx(patternData.slantHeight, originalUnit), printUnit))} {printUnit}</span>
                </>}

                 {patternData.type === 'drum' && <>
                    <span className="text-gray-600 dark:text-gray-400">Circumference:</span>
                    <span className="font-mono text-right">{format(convertFromPx(convertToPx(patternData.circumference, originalUnit), printUnit))} {printUnit}</span>
                </>}
            </div>
        </div>
        <div className="mt-4 space-y-4 print:hidden">
            <div className="flex flex-col sm:flex-row gap-4">
                 <button onClick={handleSave} className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 active:bg-blue-800">
                    Save Pattern
                </button>
                <button onClick={handleDownload} className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 active:bg-green-800">
                    Download SVG
                </button>
            </div>
            <div className="flex gap-2 items-center">
                <select
                id="paperSize"
                aria-label="Paper size for printing"
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value as 'A4' | 'Letter')}
                className="py-3 pl-3 pr-10 rounded-md shadow-sm border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500"
                >
                <option value="A4">A4 Paper</option>
                <option value="Letter">US Letter</option>
                </select>
                <select
                id="printUnit"
                aria-label="Unit for print measurements"
                value={printUnit}
                onChange={(e) => setPrintUnit(e.target.value as Unit)}
                className="py-3 pl-3 pr-10 rounded-md shadow-sm border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="cm">cm</option>
                  <option value="in">in</option>
                </select>
                <button onClick={handlePrint} className="flex-grow inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 active:bg-gray-100 dark:active:bg-gray-700">
                    Print Pattern
                </button>
                 <div className="relative group">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 dark:text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        For accurate sizing, set your printer's scale to 100% or "Actual Size".
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg h-full flex flex-col">
       {renderContent()}
    </div>
  );
};

export default PatternPreview;