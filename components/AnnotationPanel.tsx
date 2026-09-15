'use client';

import { Hotspot } from './HotspotMarker';

interface AnnotationPanelProps {
  hotspot: Hotspot;
  onClose: () => void;
}

export default function AnnotationPanel({ hotspot, onClose }: AnnotationPanelProps) {
  return (
    <div className="absolute bottom-6 right-6 w-72 bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-2xl shadow-2xl z-20 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-gray-800">
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-mono font-bold text-blue-400 uppercase tracking-widest mb-1">
            Component Detail
          </p>
          <h3 className="text-sm font-bold text-white leading-snug">{hotspot.title}</h3>
        </div>
        <button
          onClick={onClose}
          className="ml-3 mt-0.5 text-gray-500 hover:text-white transition-colors text-base leading-none flex-shrink-0"
          aria-label="Close annotation panel"
        >
          ✕
        </button>
      </div>

      {/* Description */}
      <div className="px-4 py-3 border-b border-gray-800/60">
        <p className="text-xs text-gray-300 leading-relaxed">{hotspot.description}</p>
      </div>

      {/* Specs */}
      {Object.keys(hotspot.specs).length > 0 && (
        <div className="px-4 py-3">
          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">
            Specifications
          </p>
          <div className="space-y-2">
            {Object.entries(hotspot.specs).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between gap-3 text-xs">
                <span className="text-gray-400 shrink-0">{key}</span>
                <span className="text-white font-semibold font-mono text-right">{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer accent */}
      <div className="h-0.5 bg-gradient-to-r from-blue-600/0 via-blue-500/60 to-blue-600/0" />
    </div>
  );
}
