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
}

export default function HeatmapOverlay({ gazeData }: HeatmapOverlayProps) {
  const gridSize = 20;
  const grid: number[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));

  gazeData.forEach((point) => {
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
    if (intensity < 0.25) return 'rgba(59, 130, 246, 0.3)';
    if (intensity < 0.5) return 'rgba(34, 197, 94, 0.4)';
    if (intensity < 0.75) return 'rgba(234, 179, 8, 0.5)';
    return 'rgba(239, 68, 68, 0.6)';
  };

  return (
    <svg
      viewBox={`0 0 ${gridSize} ${gridSize}`}
      preserveAspectRatio="none"
      width="100%"
      height="100%"
      className="absolute inset-0 pointer-events-none"
    >
      {grid.map((row, ri) =>
        row.map((count, ci) => (
          <rect
            key={`${ri}-${ci}`}
            x={ci}
            y={ri}
            width={1}
            height={1}
            fill={getColor(count)}
            rx={0.05}
          />
        ))
      )}
    </svg>
  );
}
