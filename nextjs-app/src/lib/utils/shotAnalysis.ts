/**
 * Shot Analysis Utilities
 * Mathematical calculations for shot pattern analysis
 */

export interface Shot {
  shot_number: number;
  x: number;  // mm from center
  y: number;  // mm from center
  score: number; // Formatted score (10.5)
  ring: number; // Normal ring (10)
  ring01: number; // Ring with decimal (105 = 10.5)
  teiler01?: number | null; // Teiler in mm
}

export interface ShotAnalysis {
  teiler: {
    best: number;
    worst: number;
    average: number;
    fromMeyton: boolean; // Whether teiler values came from DB or were calculated
  };
  spread: {
    x_std: number;
    y_std: number;
    total: number;
    radius: number;
  };
  center: {
    x: number;
    y: number;
    offset: number;
    direction: {
      x: string;
      y: string;
      angle: number;
    };
  };
  tendency: {
    quadrant_distribution: {
      top_right: number;
      top_left: number;
      bottom_left: number;
      bottom_right: number;
    };
    dominant: string;
  };
}

/**
 * Calculate comprehensive shot analysis
 */
export const calculateShotAnalysis = (shots: Shot[]): ShotAnalysis | null => {
  if (shots.length === 0) return null;

  // 1. Calculate Teiler (distances between consecutive shots)
  const teilers: number[] = [];
  let fromMeyton = false;
  
  for (let i = 1; i < shots.length; i++) {
    // Check if Meyton already calculated the teiler
    if (shots[i].teiler01 !== null && shots[i].teiler01 !== undefined) {
      teilers.push(shots[i].teiler01!);
      fromMeyton = true;
    } else {
      // Calculate manually if not available
      const dx = shots[i].x - shots[i - 1].x;
      const dy = shots[i].y - shots[i - 1].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      teilers.push(distance);
    }
  }

  const teiler = {
    best: teilers.length > 0 ? Math.min(...teilers) : 0,
    worst: teilers.length > 0 ? Math.max(...teilers) : 0,
    average: teilers.length > 0 
      ? teilers.reduce((a, b) => a + b, 0) / teilers.length 
      : 0,
    fromMeyton
  };

  // 2. Calculate center point (mean of all shots)
  const center_x = shots.reduce((sum, s) => sum + s.x, 0) / shots.length;
  const center_y = shots.reduce((sum, s) => sum + s.y, 0) / shots.length;

  // 3. Calculate standard deviation (spread)
  const x_variance = shots.reduce(
    (sum, s) => sum + Math.pow(s.x - center_x, 2), 
    0
  ) / shots.length;
  const y_variance = shots.reduce(
    (sum, s) => sum + Math.pow(s.y - center_y, 2), 
    0
  ) / shots.length;
  
  const x_std = Math.sqrt(x_variance);
  const y_std = Math.sqrt(y_variance);
  const total_std = Math.sqrt(x_std * x_std + y_std * y_std);

  // 4. Calculate offset from center (0,0)
  const offset = Math.sqrt(center_x * center_x + center_y * center_y);

  // 5. Calculate direction
  const angle = (Math.atan2(center_y, center_x) * (180 / Math.PI) + 360) % 360;
  const direction = {
    x: center_x > 0 ? 'rechts' : center_x < 0 ? 'links' : 'zentral',
    y: center_y > 0 ? 'unten' : center_y < 0 ? 'oben' : 'zentral',
    angle
  };

  // 6. Calculate quadrant distribution
  const quadrants = {
    top_right: shots.filter(s => s.x >= 0 && s.y < 0).length,
    top_left: shots.filter(s => s.x < 0 && s.y < 0).length,
    bottom_left: shots.filter(s => s.x < 0 && s.y >= 0).length,
    bottom_right: shots.filter(s => s.x >= 0 && s.y >= 0).length
  };

  const dominant = (Object.entries(quadrants).reduce((a, b) =>
    b[1] > a[1] ? b : a
  )[0] as string);

  return {
    teiler,
    spread: {
      x_std,
      y_std,
      total: total_std,
      radius: total_std * 2 // 2-sigma circle (approx 95% of shots)
    },
    center: {
      x: center_x,
      y: center_y,
      offset,
      direction
    },
    tendency: {
      quadrant_distribution: quadrants,
      dominant
    }
  };
};

/**
 * Find the best teiler (smallest distance) and its shot indices
 */
export const findBestTeiler = (shots: Shot[]): { 
  distance: number; 
  fromShot: number; 
  toShot: number 
} | null => {
  if (shots.length < 2) return null;

  let bestDistance = Infinity;
  let bestFrom = 0;
  let bestTo = 1;

  for (let i = 1; i < shots.length; i++) {
    // Use Meyton's teiler if available, otherwise calculate
    let distance: number;
    if (shots[i].teiler01 !== null && shots[i].teiler01 !== undefined) {
      distance = shots[i].teiler01!;
    } else {
      const dx = shots[i].x - shots[i - 1].x;
      const dy = shots[i].y - shots[i - 1].y;
      distance = Math.sqrt(dx * dx + dy * dy);
    }

    if (distance < bestDistance) {
      bestDistance = distance;
      bestFrom = i - 1;
      bestTo = i;
    }
  }

  return {
    distance: bestDistance,
    fromShot: shots[bestFrom].shot_number,
    toShot: shots[bestTo].shot_number
  };
};

/**
 * Format direction for display
 */
export const formatDirection = (x: number, y: number): string => {
  const absX = Math.abs(x);
  const absY = Math.abs(y);
  
  const xDir = x > 0 ? 'rechts' : 'links';
  const yDir = y > 0 ? 'unten' : 'oben';
  
  if (absX < 0.1 && absY < 0.1) return 'zentral';
  if (absX < 0.1) return `${absY.toFixed(1)}mm ${yDir}`;
  if (absY < 0.1) return `${absX.toFixed(1)}mm ${xDir}`;
  
  return `${absX.toFixed(1)}mm ${xDir}, ${absY.toFixed(1)}mm ${yDir}`;
};

/**
 * Get ring color for visualization
 */
export const getRingColor = (score: number, useDecimal: boolean = true): string => {
  const ring = useDecimal ? Math.floor(score) : Math.floor(score);
  
  const colors: Record<number, string> = {
    10: '#00ff00',  // Green
    9: '#90ee90',   // Light green
    8: '#ffff00',   // Yellow
    7: '#ffa500',   // Orange
    6: '#ff6347',   // Tomato red
    5: '#ff0000',   // Red
  };
  
  return colors[ring] || '#999999';  // Gray for lower scores
};

/**
 * Format score for display based on mode
 */
export const formatScore = (ring: number, ring01: number, useDecimal: boolean): string => {
  if (useDecimal) {
    return (ring01 / 10).toFixed(1); // "10.5"
  } else {
    return ring.toString(); // "10"
  }
};

