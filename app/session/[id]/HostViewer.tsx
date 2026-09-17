'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ModelViewerWrapper from '@/components/ModelViewerWrapper';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import HotspotMarker, { Hotspot } from '@/components/HotspotMarker';
import AnnotationPanel from '@/components/AnnotationPanel';
import { useSpatialSync } from '@/lib/hooks/useSpatialSync';
import { Button } from '@/components/ui/button';
import { LaserCursor } from '@/lib/socket-store';
import { Target, RotateCcw, RotateCw } from 'lucide-react';

interface HostViewerProps {
  sessionId: string;
}

export default function HostViewer({ sessionId }: HostViewerProps) {
  const router = useRouter();
  const [modelUrl, setModelUrl] = useState('');
  const [currentOrbit, setCurrentOrbit] = useState('0deg 75deg 2.5m');
  const [activeTab, setActiveTab] = useState<'share' | 'participants' | 'asset' | 'hotspots'>('share');
  const [autoRotate, setAutoRotate] = useState(false);
  const [isLaserActive, setIsLaserActive] = useState(true);
  const [localLaserCursor, setLocalLaserCursor] = useState<LaserCursor | null>(null);
  const [assetName, setAssetName] = useState('3D Asset');
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [cameraTarget, setCameraTarget] = useState<string | undefined>(undefined);

  const {
    isConnected,
    viewerCount,
    sendUpdate,
    sendCursorUpdate,
    sendHotspotUpdate,
  } = useSpatialSync(sessionId, 'host-token');

  // Fetch session metadata, then load matching annotations
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch(`/api/session?id=${sessionId}`);
        if (!res.ok) return;
        const data = await res.json();
        const url = data.assetUrl || data.session?.assetUrl;
        if (url) setModelUrl(url);

        const assetKey: string = data.session?.assetKey || '';
        const filename = assetKey.split('/').pop() || '3D Asset';
        setAssetName(filename);

        const modelId = filename.replace(/\.[^.]+$/, '');
        try {
          const hotspotsRes = await fetch(`/api/hotspots?modelId=${encodeURIComponent(modelId)}`);
          if (hotspotsRes.ok) {
            const hotspotsData = await hotspotsRes.json();
            setHotspots(hotspotsData.hotspots || []);
          }
        } catch {
          // Silent fallback
        }
      } catch (err) {
        console.error('Failed to fetch session metadata:', err);
      }
    }
    fetchSession();
  }, [sessionId]);

  const handleCameraChange = useCallback((orbit: string) => {
    setCurrentOrbit(orbit);
    sendUpdate(orbit);
  }, [sendUpdate]);

  const handleResetView = () => {
    setCurrentOrbit('0deg 75deg 2.5m');
    setCameraTarget(undefined);
    setSelectedHotspot(null);
    setLocalLaserCursor(null);
    sendUpdate('0deg 75deg 2.5m');
    sendHotspotUpdate(null);
    sendCursorUpdate(null);
  };

  const handleHotspotSelect = (hotspot: Hotspot) => {
    const isNew = selectedHotspot?.id !== hotspot.id;
    const newSelected = isNew ? hotspot : null;
    setSelectedHotspot(newSelected);
    sendHotspotUpdate(newSelected ? hotspot.id : null);

    if (newSelected) {
      setCurrentOrbit(hotspot.cameraOrbit);
      setCameraTarget(hotspot.cameraTarget);
      sendUpdate(hotspot.cameraOrbit);
    } else {
      setCameraTarget(undefined);
    }
  };

  const handleSurfaceClick = useCallback((hit: { position: { x: number; y: number; z: number }; normal: { x: number; y: number; z: number } }) => {
    if (!isLaserActive) return;

    const p = hit.position;
    const n = hit.normal;
    const posStr = `${p.x.toFixed(4)} ${p.y.toFixed(4)} ${p.z.toFixed(4)}`;
    const normStr = `${n.x.toFixed(4)} ${n.y.toFixed(4)} ${n.z.toFixed(4)}`;

    const newCursor: LaserCursor = {
      position: posStr,
      normal: normStr,
      active: true,
    };

    setLocalLaserCursor(newCursor);
    sendCursorUpdate(newCursor);
  }, [isLaserActive, sendCursorUpdate]);

  const toggleLaserPointer = () => {
    const nextState = !isLaserActive;
    setIsLaserActive(nextState);
    if (!nextState) {
      setLocalLaserCursor(null);
      sendCursorUpdate(null);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white select-none overflow-hidden">
      {/* Clean Top Header */}
      <header className="h-14 bg-zinc-900 border-b border-zinc-800 px-6 flex items-center justify-between z-20 flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="font-bold tracking-tight text-lg">
            <span className="text-white">Spatial</span>
            <span className="text-zinc-500 font-medium">Sync</span>
          </span>
          <span className="text-xs font-mono text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800">
            Session: #{sessionId}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-medium">
          <div className="flex items-center gap-2 mr-2">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-white' : 'bg-zinc-600'}`} />
            <span className="text-zinc-300">{isConnected ? 'Live' : 'Connecting'}</span>
          </div>

          <Button
            onClick={toggleLaserPointer}
            variant={isLaserActive ? 'default' : 'outline'}
            size="sm"
            className="gap-1.5"
          >
            <Target className="w-3.5 h-3.5" />
            Laser Pointer {isLaserActive ? 'ON' : 'OFF'}
          </Button>

          <Button
            onClick={handleResetView}
            variant="outline"
            size="sm"
            className="gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset View
          </Button>

          <Button
            onClick={() => setAutoRotate(!autoRotate)}
            variant={autoRotate ? 'default' : 'outline'}
            size="sm"
            className="gap-1.5"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Auto Rotate
          </Button>
        </div>
      </header>

      {/* Main Content Body */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* 3D Viewport */}
        <div className="flex-1 relative bg-zinc-950">
          <ModelViewerWrapper
            src={modelUrl}
            ar={false}
            cameraOrbit={currentOrbit}
            cameraTarget={cameraTarget}
            onCameraChange={handleCameraChange}
            onSurfaceClick={handleSurfaceClick}
            interactive={!autoRotate}
            autoRotate={autoRotate}
          >
            {/* Hotspot Markers */}
            {hotspots.map((hotspot) => (
              <HotspotMarker
                key={hotspot.id}
                hotspot={hotspot}
                selected={selectedHotspot?.id === hotspot.id}
                onClick={() => handleHotspotSelect(hotspot)}
              />
            ))}

            {/* Glowing 3D Laser Pointer Marker */}
            {localLaserCursor && localLaserCursor.active && (
              <button
                slot="hotspot-laser-pointer"
                data-position={localLaserCursor.position}
                data-normal={localLaserCursor.normal}
                onClick={(e) => {
                  e.stopPropagation();
                  setLocalLaserCursor(null);
                  sendCursorUpdate(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    border: '2px solid #ffffff',
                    boxShadow: '0 0 0 6px rgba(239,68,68,0.35), 0 0 16px rgba(239,68,68,0.9)',
                    animation: 'ping 1.2s cubic-bezier(0,0,0.2,1) infinite',
                  }}
                />
                <div
                  style={{
                    background: 'rgba(239,68,68,0.95)',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.8)',
                    borderRadius: '9999px',
                    padding: '2px 8px',
                    fontSize: '10px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  🎯 Host Pointer
                </div>
              </button>
            )}
          </ModelViewerWrapper>

          {/* Laser Pointer Hint Banner */}
          {isLaserActive && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur border border-zinc-700 rounded-full px-4 py-1.5 text-xs text-zinc-300 pointer-events-none flex items-center gap-2 z-10 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Click anywhere on the model to project a 3D Laser Pointer to the buyer
            </div>
          )}

          {selectedHotspot && (
            <AnnotationPanel
              hotspot={selectedHotspot}
              onClose={() => {
                setSelectedHotspot(null);
                setCameraTarget(undefined);
                sendHotspotUpdate(null);
              }}
            />
          )}
        </div>

        {/* Sidebar Controller */}
        <aside className="w-80 bg-zinc-900 border-l border-zinc-800 p-5 flex flex-col justify-between z-10">
          <div className="space-y-4">
            {/* Sidebar Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-medium">
              <button
                onClick={() => setActiveTab('share')}
                className={`py-2 rounded-lg transition-colors ${
                  activeTab === 'share' ? 'bg-white text-zinc-950 font-semibold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Join QR
              </button>
              <button
                onClick={() => setActiveTab('participants')}
                className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1 ${
                  activeTab === 'participants' ? 'bg-white text-zinc-950 font-semibold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Viewers ({viewerCount})
              </button>
              <button
                onClick={() => setActiveTab('hotspots')}
                className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1 ${
                  activeTab === 'hotspots' ? 'bg-white text-zinc-950 font-semibold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Parts ({hotspots.length})
              </button>
            </div>

            {/* Tab Contents */}
            {activeTab === 'share' && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-center">
                <p className="text-xs text-zinc-400 mb-3 font-medium">Scan QR Code on Mobile to Join AR</p>
                <QRCodeDisplay sessionId={sessionId} />
              </div>
            )}

            {activeTab === 'participants' && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs space-y-2">
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Connected Viewers</span>
                  <span className="font-bold text-white text-sm">{viewerCount}</span>
                </div>
              </div>
            )}

            {activeTab === 'hotspots' && (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {hotspots.length === 0 ? (
                  <div className="text-center py-6 text-xs text-zinc-500">
                    No annotations for this model.
                  </div>
                ) : (
                  hotspots.map((hotspot) => (
                    <button
                      key={hotspot.id}
                      onClick={() => handleHotspotSelect(hotspot)}
                      className={`w-full text-left p-3 rounded-xl border transition-all text-xs cursor-pointer ${
                        selectedHotspot?.id === hotspot.id
                          ? 'bg-white/10 border-white/40 text-white'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <span className="font-semibold block mb-0.5 text-white">{hotspot.label}</span>
                      <p className="text-zinc-500 text-[11px] leading-snug line-clamp-2">{hotspot.description}</p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* End Session Button */}
          <Button
            onClick={() => router.push(`/dashboard?sessionId=${sessionId}`)}
            variant="destructive"
            size="lg"
            className="w-full mt-4"
          >
            End Session
          </Button>
        </aside>
      </div>
    </div>
  );
}
