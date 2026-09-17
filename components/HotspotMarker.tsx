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
          background: selected ? '#ffffff' : '#a1a1aa',
          border: `2px solid ${selected ? '#ffffff' : '#71717a'}`,
          boxShadow: selected
            ? '0 0 0 5px rgba(255,255,255,0.3), 0 0 14px rgba(255,255,255,0.6)'
            : '0 0 0 4px rgba(255,255,255,0.1), 0 0 10px rgba(255,255,255,0.2)',
          transition: 'all 0.2s ease',
        }}
      />
      {/* Label pill */}
      <div
        style={{
          background: 'rgba(9,9,11,0.9)',
          border: `1px solid ${selected ? 'rgba(255,255,255,0.8)' : 'rgba(113,113,122,0.4)'}`,
          borderRadius: '9999px',
          padding: '2px 8px',
          fontSize: '10px',
          fontWeight: 700,
          color: selected ? '#ffffff' : '#a1a1aa',
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
