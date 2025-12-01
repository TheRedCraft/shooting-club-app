'use client';

import { useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import type { Shot, ShotAnalysis } from '@/lib/utils/shotAnalysis';
import { getRingColor, findBestTeiler } from '@/lib/utils/shotAnalysis';

interface TargetVisualizationProps {
  shots: Shot[];
  analysis: ShotAnalysis | null;
  ringMode?: 'decimal' | 'normal';
  showTeiler?: boolean;
  showSpread?: boolean;
  showCenter?: boolean;
  scale?: number; // Zoom scale (pixels per mm)
  discipline?: string; // Disziplin (z.B. "LG 10m", "KK 50m")
}

export default function TargetVisualization({
  shots,
  analysis,
  ringMode = 'decimal',
  showTeiler = true,
  showSpread = true,
  showCenter = true,
  scale: customScale,
  discipline
}: TargetVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Redraw function
  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas || shots.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Canvas settings
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = customScale || 5; // Use custom scale or default to 5 pixels per mm

    // Determine target type from discipline
    const targetType: 'LG' | 'KK' = discipline?.toUpperCase().includes('KK') ? 'KK' : 'LG';

    // Draw target
    drawTarget(ctx, centerX, centerY, scale, discipline);

    // Draw spread circle
    if (showSpread && analysis) {
      drawSpreadCircle(ctx, centerX, centerY, scale, analysis);
    }

    // Draw center point and offset vector
    if (showCenter && analysis) {
      drawCenterAndOffset(ctx, centerX, centerY, scale, analysis);
    }

    // Draw shots
    shots.forEach((shot, index) => {
      const x = centerX + shot.x * scale;
      const y = centerY - shot.y * scale; // Invert Y (canvas Y+ is down)
      drawShot(ctx, x, y, shot, index, ringMode, scale, targetType);
    });

    // Draw best teiler line
    if (showTeiler && shots.length > 1) {
      const bestTeiler = findBestTeiler(shots);
      if (bestTeiler) {
        drawTeilerLine(ctx, centerX, centerY, scale, shots, bestTeiler);
      }
    }
  };

  // Trigger redraw when any parameter changes
  useEffect(() => {
    redraw();
  }, [ringMode, showTeiler, showSpread, showCenter, customScale]);
  
  // Initial draw and redraw when shots/analysis change
  useEffect(() => {
    redraw();
  }, [shots, analysis]);

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        bgcolor: '#f5f5f5',
        p: 2,
        borderRadius: 1
      }}
    >
      <canvas 
        ref={canvasRef} 
        width={700} 
        height={700}
        style={{ 
          border: '2px solid #ccc',
          borderRadius: '4px',
          backgroundColor: 'white',
          maxWidth: '100%',
          height: 'auto'
        }}
      />
    </Box>
  );
}

// Helper functions

function drawTarget(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number, discipline?: string) {
  // Check if this is Kleinkaliber (KK) or Luftgewehr (LG)
  const isKK = discipline?.toUpperCase().includes('KK');
  
  // Ring-Grenzen als Radius (vom Zentrum aus gemessen)
  const rings = isKK ? [
    // Kleinkaliber 50m Scheibe (ISSF/DSB)
    // Ring 10: 10.4mm Durchmesser, Innenzehn: 5.0mm, Ringabstand: 8.0mm, Spiegel: 112.4mm
    { radius: (10.4 + 8.0 * 9) / 2, color: '#d0d0d0', label: '1' },  // Ring 1: 82.4mm Ø - Hellgrau
    { radius: (10.4 + 8.0 * 8) / 2, color: '#c0c0c0', label: '2' },  // Ring 2: 74.4mm Ø - Grau
    { radius: (10.4 + 8.0 * 7) / 2, color: '#b0b0b0', label: '3' },  // Ring 3: 66.4mm Ø - Grau
    { radius: (10.4 + 8.0 * 6) / 2, color: '#a0a0a0', label: '4' },  // Ring 4: 58.4mm Ø - Dunkelgrau (Spiegel: 112.4mm beginnt zwischen Ring 4 und 5)
    { radius: (10.4 + 8.0 * 5) / 2, color: '#4db8a8', label: '5' },  // Ring 5: 50.4mm Ø - Türkis
    { radius: (10.4 + 8.0 * 4) / 2, color: '#40a89d', label: '6' },  // Ring 6: 42.4mm Ø - Türkis
    { radius: (10.4 + 8.0 * 3) / 2, color: '#359892', label: '7' },  // Ring 7: 34.4mm Ø - Türkis
    { radius: (10.4 + 8.0 * 2) / 2, color: '#2a8887', label: '8' },  // Ring 8: 26.4mm Ø - Dunkeltürkis
    { radius: (10.4 + 8.0 * 1) / 2, color: '#20787c', label: '9' },  // Ring 9: 18.4mm Ø - Dunkeltürkis
    { radius: 10.4 / 2, color: '#166871', label: '10' },              // Ring 10: 10.4mm Ø - Dunkeltürkis
    { radius: 5.0 / 2, color: '#ffffff', label: '' },                 // Innenzehn: 5.0mm Ø - Weiß
  ] : [
    // Luftgewehr 10m Scheibe (ISSF)
    { radius: 53.5 / 2, color: '#d0d0d0', label: '1' },  // Ring 1 - Hellgrau
    { radius: 47.5 / 2, color: '#c0c0c0', label: '2' },  // Ring 2 - Grau
    { radius: 41.5 / 2, color: '#b0b0b0', label: '3' },  // Ring 3 - Grau
    { radius: 35.5 / 2, color: '#a0a0a0', label: '4' },  // Ring 4 - Dunkelgrau
    { radius: 29.5 / 2, color: '#4db8a8', label: '5' },  // Ring 5 - Türkis (Trefferfläche)
    { radius: 23.5 / 2, color: '#40a89d', label: '6' },  // Ring 6 - Türkis
    { radius: 17.5 / 2, color: '#359892', label: '7' },  // Ring 7 - Türkis
    { radius: 11.5 / 2, color: '#2a8887', label: '8' },  // Ring 8 - Dunkeltürkis
    { radius: 5.5 / 2, color: '#20787c', label: '9' },   // Ring 9 - Dunkeltürkis
    { radius: 0.5 / 2, color: '#166871', label: '10' },  // Ring 10 (Innenzehn) - Dunkeltürkis
  ];

  // Draw rings from outside to inside
  for (let i = rings.length - 1; i >= 0; i--) {
    ctx.beginPath();
    ctx.arc(cx, cy, rings[i].radius * scale, 0, 2 * Math.PI);
    ctx.fillStyle = rings[i].color;
    ctx.fill();
  }
  
  // Draw ring borders (white lines) separately on top
  for (let i = 0; i < rings.length; i++) {
    ctx.beginPath();
    ctx.arc(cx, cy, rings[i].radius * scale, 0, 2 * Math.PI);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Draw ring numbers (außen)
  ctx.fillStyle = '#333';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Numbers at 12, 3, 6, 9 o'clock for outer rings
  const positions = [
    { angle: -Math.PI / 2, x: 0, y: -1 },  // 12 o'clock (top)
    { angle: 0, x: 1, y: 0 },              // 3 o'clock (right)
    { angle: Math.PI / 2, x: 0, y: 1 },    // 6 o'clock (bottom)
    { angle: Math.PI, x: -1, y: 0 }        // 9 o'clock (left)
  ];
  
  // Show numbers for rings 1-8
  for (let i = 0; i < 8; i++) {
    const ring = rings[rings.length - i - 4]; // Start from ring 1
    if (!ring || !ring.label) continue;
    
    positions.forEach(pos => {
      const radius = ring.radius * scale;
      const x = cx + Math.cos(pos.angle) * radius;
      const y = cy + Math.sin(pos.angle) * radius;
      
      // Only show on outer rings
      if (parseInt(ring.label) <= 8) {
        ctx.fillText(ring.label, x, y);
      }
    });
  }
}

function drawShot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  shot: Shot,
  index: number,
  mode: 'decimal' | 'normal',
  scale: number,
  targetType: 'LG' | 'KK'
) {
  const score = mode === 'decimal' ? shot.score : shot.ring;
  const color = getRingColor(score, mode === 'decimal');

  // LG: 4.5mm Durchmesser = 2.25mm Radius
  // KK: 5.6mm Durchmesser = 2.8mm Radius
  // Für Visualisierung verwenden wir kleinere Werte (damit Nummern lesbar bleiben)
  const pelletRadius = targetType === 'LG' ? 1.0 : 1.2; // mm (vereinfacht für bessere Sichtbarkeit)
  const pixelRadius = pelletRadius * scale;

  // Draw shot point (realistischer Durchmesser)
  ctx.beginPath();
  ctx.arc(x, y, pixelRadius, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Draw shot number IN THE CENTER
  ctx.fillStyle = '#000';
  ctx.font = `bold ${Math.max(10, pixelRadius * 0.8)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText((index + 1).toString(), x, y);
}

function drawSpreadCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
  analysis: ShotAnalysis
) {
  const centerX = cx + analysis.center.x * scale;
  const centerY = cy - analysis.center.y * scale;
  const radius = analysis.spread.radius * scale;

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = 'rgba(0, 100, 255, 0.6)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 4]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawCenterAndOffset(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
  analysis: ShotAnalysis
) {
  const centerX = cx + analysis.center.x * scale;
  const centerY = cy - analysis.center.y * scale;

  // Draw center point
  ctx.beginPath();
  ctx.arc(centerX, centerY, 6, 0, 2 * Math.PI);
  ctx.fillStyle = 'rgba(0, 100, 255, 0.7)';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw offset vector
  if (analysis.center.offset > 0.5) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(centerX, centerY);
    ctx.strokeStyle = 'rgba(0, 100, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Arrow head
    const angle = Math.atan2(centerY - cy, centerX - cx);
    const arrowLength = 10;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX - arrowLength * Math.cos(angle - Math.PI / 6),
      centerY - arrowLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX - arrowLength * Math.cos(angle + Math.PI / 6),
      centerY - arrowLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  }
}

function drawTeilerLine(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
  shots: Shot[],
  bestTeiler: { distance: number; fromShot: number; toShot: number }
) {
  const shot1 = shots.find(s => s.shot_number === bestTeiler.fromShot);
  const shot2 = shots.find(s => s.shot_number === bestTeiler.toShot);

  if (!shot1 || !shot2) return;

  const x1 = cx + shot1.x * scale;
  const y1 = cy - shot1.y * scale;
  const x2 = cx + shot2.x * scale;
  const y2 = cy - shot2.y * scale;

  // Draw line
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Draw distance label
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.font = 'bold 13px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const text = `${bestTeiler.distance.toFixed(1)}`;
  ctx.strokeText(text, midX, midY - 12);
  ctx.fillStyle = '#ff0000';
  ctx.fillText(text, midX, midY - 12);
}

