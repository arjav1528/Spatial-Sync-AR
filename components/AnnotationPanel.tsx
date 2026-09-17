'use client';

import { Hotspot } from './HotspotMarker';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface AnnotationPanelProps {
  hotspot: Hotspot;
  onClose: () => void;
}

export default function AnnotationPanel({ hotspot, onClose }: AnnotationPanelProps) {
  return (
    <Card className="absolute bottom-6 right-6 w-72 bg-gray-900/95 backdrop-blur-md border-gray-700 shadow-2xl z-20 overflow-hidden">
      {/* Header */}
      <CardHeader className="flex flex-row items-start justify-between p-4 border-b border-gray-800 space-y-0">
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-mono font-bold text-blue-400 uppercase tracking-widest mb-1">
            Component Detail
          </p>
          <CardTitle className="text-sm font-bold text-white leading-snug">{hotspot.title}</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-6 w-6 text-gray-400 hover:text-white"
          aria-label="Close annotation panel"
        >
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      {/* Description */}
      <CardContent className="p-4 space-y-3">
        <p className="text-xs text-gray-300 leading-relaxed">{hotspot.description}</p>

        {/* Specs */}
        {Object.keys(hotspot.specs).length > 0 && (
          <div className="pt-2 border-t border-gray-800/60">
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2">
              Specifications
            </p>
            <div className="space-y-1.5">
              {Object.entries(hotspot.specs).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-gray-400 shrink-0">{key}</span>
                  <span className="text-white font-semibold font-mono text-right">{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <div className="h-0.5 bg-gradient-to-r from-blue-600/0 via-blue-500/60 to-blue-600/0" />
    </Card>
  );
}
