'use client';

export interface Hotspot {
  id: string;
  label: string;
  title: string;
  description: string;
  specs: Record<string, string>;
  position: string;
  normal: string;
  cameraOrbit: string;
  cameraTarget: string;
}

interface HotspotMarkerProps {
  hotspot: Hotspot;
  selected: boolean;
  onClick: () => void;
}

export default function HotspotMarker({ hotspot, selected, onClick }: HotspotMarkerProps) {
  return (
    <button
      slot={`hotspot-${hotspot.id}`}
      data-position={hotspot.position}
      data-normal={hotspot.normal}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        outline: 'none',
      }}
    >
      {/* Pulsing dot */}
      <div
        style={{
          width: selected ? '18px' : '12px',
          height: selected ? '18px' : '12px',
          borderRadius: '50%',
          background: selected ? '#10b981' : '#3b82f6',
          border: `2px solid ${selected ? '#6ee7b7' : '#93c5fd'}`,
          boxShadow: selected
            ? '0 0 0 5px rgba(16,185,129,0.2), 0 0 14px rgba(16,185,129,0.55)'
            : '0 0 0 4px rgba(59,130,246,0.2), 0 0 10px rgba(59,130,246,0.45)',
          transition: 'all 0.2s ease',
          animation: selected ? 'none' : 'hotspot-pulse 2s ease-in-out infinite',
        }}
      />
      {/* Label pill */}
      <div
        style={{
          background: 'rgba(3,7,18,0.88)',
          border: `1px solid ${selected ? 'rgba(16,185,129,0.45)' : 'rgba(59,130,246,0.35)'}`,
          borderRadius: '9999px',
          padding: '2px 8px',
          fontSize: '10px',
          fontWeight: 700,
          color: selected ? '#6ee7b7' : '#93c5fd',
          whiteSpace: 'nowrap',
          backdropFilter: 'blur(6px)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          transition: 'all 0.2s ease',
        }}
      >
        {hotspot.label}
      </div>
    </button>
  );
}
