import type { LampshadeDimensions, PatternData } from '../types';

export const calculatePatternData = (dims: LampshadeDimensions): PatternData => {
  if (dims.topDiameter === dims.bottomDiameter) {
    // Drum shade calculation
    const circumference = Math.PI * dims.bottomDiameter;
    const width = circumference;
    const height = dims.height;

    return {
      type: 'drum',
      circumference,
      viewBox: `0 0 ${width} ${height}`,
      width,
      height,
      dimensions: dims,
    };
  } else {
    // Cone/Empire shade calculation
    const rTop = dims.topDiameter / 2;
    const rBottom = dims.bottomDiameter / 2;
    // FIX: Renamed 'height' to 'verticalHeight' to avoid redeclaration conflict later in the function.
    const verticalHeight = dims.height;

    const slantHeight = Math.sqrt(Math.pow(verticalHeight, 2) + Math.pow(rBottom - rTop, 2));

    if (rBottom <= rTop) {
      throw new Error("Bottom diameter must be larger than top diameter.");
    }

    const LTop = (slantHeight * rTop) / (rBottom - rTop);
    const LBottom = (slantHeight * rBottom) / (rBottom - rTop);

    const angle = (2 * Math.PI * rBottom) / LBottom;

    if (angle > 2 * Math.PI) {
        throw new Error("The resulting pattern angle is too large. This geometry is not possible.");
    }

    // Calculate coordinates for the SVG path, centered in the viewbox
    const startAngle = -angle / 2;
    const endAngle = angle / 2;

    const p1x = LTop * Math.cos(startAngle);
    const p1y = LTop * Math.sin(startAngle);
    
    const p2x = LBottom * Math.cos(startAngle);
    const p2y = LBottom * Math.sin(startAngle);
    
    const p3x = LBottom * Math.cos(endAngle);
    const p3y = LBottom * Math.sin(endAngle);
    
    const p4x = LTop * Math.cos(endAngle);
    const p4y = LTop * Math.sin(endAngle);

    const largeArcFlag = angle > Math.PI ? 1 : 0;
    
    const pathD = [
      `M ${p1x} ${p1y}`,
      `L ${p2x} ${p2y}`,
      `A ${LBottom} ${LBottom} 0 ${largeArcFlag} 1 ${p3x} ${p3y}`,
      `L ${p4x} ${p4y}`,
      `A ${LTop} ${LTop} 0 ${largeArcFlag} 0 ${p1x} ${p1y}`,
      'Z'
    ].join(' ');

    // Calculate bounding box to create a snug viewBox
    const allX = [p1x, p2x, p3x, p4x];
    const allY = [p1y, p2y, p3y, p4y];
    
    // Also consider the top of the arc if the angle is less than 180
    if (angle < Math.PI) {
        allX.push(LBottom);
        allY.push(0);
    }

    const minX = Math.min(...allX);
    const minY = Math.min(...allY);
    const maxX = Math.max(...allX);
    const maxY = Math.max(...allY);
    
    const width = maxX - minX;
    const height = maxY - minY;

    return {
      type: 'cone',
      pathD,
      viewBox: `${minX} ${minY} ${width} ${height}`,
      width,
      height,
      dimensions: dims,
      slantHeight: slantHeight,
      topArcLength: Math.PI * dims.topDiameter,
      bottomArcLength: Math.PI * dims.bottomDiameter,
    };
  }
};