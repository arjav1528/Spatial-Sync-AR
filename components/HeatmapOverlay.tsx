'use client';

interface GazePoint {
  x: number;
  y: number;
  z: number;
  theta: number;
  phi: number;
}

interface HeatmapOverlayProps {
  gazeData: GazePoint[];
  width: number;
  height: number;
}

export default function HeatmapOverlay({ gazeData, width, height }: HeatmapOverlayProps) {
  // Map 3D gaze vectors to 2D heatmap grid
  const gridSize = 20;
  const grid: number[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));

  gazeData.forEach((point) => {
    // Normalize theta (-180 to 180) and phi (0 to 180) to grid coordinates
    const col = Math.floor(((point.theta + 180) / 360) * gridSize);
    const row = Math.floor((point.phi / 180) * gridSize);
    if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
      grid[row][col]++;
    }
  });

  const maxCount = Math.max(...grid.flat(), 1);

  const getColor = (count: number) => {
    const intensity = count / maxCount;
    if (intensity === 0) return 'transparent';
    if (intensity < 0.25) return 'rgba(59, 130, 246, 0.3)'; // blue
    if (intensity < 0.5) return 'rgba(34, 197, 94, 0.4)';   // green
    if (intensity < 0.75) return 'rgba(234, 179, 8, 0.5)';   // yellow
    return 'rgba(239, 68, 68, 0.6)'; // red
  };

  const cellW = width / gridSize;
  const cellH = height / gridSize;

  return (
    <svg width={width} height={height} className="absolute inset-0 pointer-events-none">
      {grid.map((row, ri) =>
        row.map((count, ci) => (
          <rect
            key={`${ri}-${ci}`}
            x={ci * cellW}
            y={ri * cellH}
            width={cellW}
            height={cellH}
            fill={getColor(count)}
            rx={2}
          />
        ))
      )}
    </svg>
  );
}
