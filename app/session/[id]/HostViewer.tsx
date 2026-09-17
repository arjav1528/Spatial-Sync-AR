'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ModelViewerWrapper from '@/components/ModelViewerWrapper';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import HotspotMarker, { Hotspot } from '@/components/HotspotMarker';
import AnnotationPanel from '@/components/AnnotationPanel';
import { useSpatialSync } from '@/lib/hooks/useSpatialSync';

interface HostViewerProps {
  sessionId: string;
}

export default function HostViewer({ sessionId }: HostViewerProps) {
  const router = useRouter();
  const [modelUrl, setModelUrl] = useState('');
  const [currentOrbit, setCurrentOrbit] = useState('0deg 75deg 2.5m');
  const [activeTab, setActiveTab] = useState<'share' | 'participants' | 'asset' | 'hotspots'>('share');
  const [autoRotate, setAutoRotate] = useState(false);
  const [assetName, setAssetName] = useState('3D Asset');
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [cameraTarget, setCameraTarget] = useState<string | undefined>(undefined);

  const {
    isConnected,
    viewerCount,
    sendUpdate,
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
    sendUpdate('0deg 75deg 2.5m');
  };

  const handleHotspotSelect = (hotspot: Hotspot) => {
    setSelectedHotspot(prev => prev?.id === hotspot.id ? null : hotspot);
    if (selectedHotspot?.id !== hotspot.id) {
      setCurrentOrbit(hotspot.cameraOrbit);
      setCameraTarget(hotspot.cameraTarget);
      sendUpdate(hotspot.cameraOrbit);
    } else {
      setCameraTarget(undefined);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white select-none overflow-hidden">
      {/* Clean Top Header */}
      <header className="h-14 bg-gray-900 border-b border-gray-800 px-6 flex items-center justify-between z-20 flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="font-bold tracking-tight text-lg">
            <span className="text-blue-500">Spatial</span>Sync
          </span>
          <span className="text-xs font-mono text-gray-400 bg-gray-950 px-2.5 py-1 rounded border border-gray-800">
            Session: #{sessionId}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="text-gray-300">{isConnected ? 'Live' : 'Connecting'}</span>
          </div>

          <button
            onClick={handleResetView}
            className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-1.5 rounded-lg border border-gray-700 cursor-pointer"
          >
            Reset View
          </button>
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              autoRotate ? 'bg-blue-600 text-white border-blue-500' : 'bg-gray-800 text-gray-300 border-gray-700'
            }`}
          >
            Auto Rotate
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* 3D Viewport */}
        <div className="flex-1 relative bg-gray-950">
          <ModelViewerWrapper
            src={modelUrl}
            ar={false}
            cameraOrbit={currentOrbit}
            cameraTarget={cameraTarget}
            onCameraChange={handleCameraChange}
            interactive={!autoRotate}
            autoRotate={autoRotate}
          >
            {hotspots.map((hotspot) => (
              <HotspotMarker
                key={hotspot.id}
                hotspot={hotspot}
                selected={selectedHotspot?.id === hotspot.id}
                onClick={() => handleHotspotSelect(hotspot)}
              />
            ))}
          </ModelViewerWrapper>

          {selectedHotspot && (
            <AnnotationPanel
              hotspot={selectedHotspot}
              onClose={() => { setSelectedHotspot(null); setCameraTarget(undefined); }}
            />
          )}
        </div>

        {/* Sidebar Controller */}
        <aside className="w-80 bg-gray-900 border-l border-gray-800 p-5 flex flex-col justify-between z-10">
          <div className="space-y-4">
            {/* Sidebar Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-gray-950 p-1 rounded-xl border border-gray-800 text-xs font-medium">
              <button
                onClick={() => setActiveTab('share')}
                className={`py-2 rounded-lg transition-colors ${
                  activeTab === 'share' ? 'bg-blue-600 text-white font-semibold' : 'text-gray-400 hover:text-white'
                }`}
              >
                Join QR
              </button>
              <button
                onClick={() => setActiveTab('participants')}
                className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1 ${
                  activeTab === 'participants' ? 'bg-blue-600 text-white font-semibold' : 'text-gray-400 hover:text-white'
                }`}
              >
                Viewers ({viewerCount})
              </button>
              <button
                onClick={() => setActiveTab('hotspots')}
                className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1 ${
                  activeTab === 'hotspots' ? 'bg-blue-600 text-white font-semibold' : 'text-gray-400 hover:text-white'
                }`}
              >
                Parts ({hotspots.length})
              </button>
            </div>

            {/* Tab Contents */}
            {activeTab === 'share' && (
              <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-400 mb-3 font-medium">Scan QR Code on Mobile to Join AR</p>
                <QRCodeDisplay sessionId={sessionId} />
              </div>
            )}

            {activeTab === 'participants' && (
              <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 text-xs space-y-2">
                <div className="flex items-center justify-between text-gray-400">
                  <span>Connected Viewers</span>
                  <span className="font-bold text-white text-sm">{viewerCount}</span>
                </div>
              </div>
            )}

            {activeTab === 'hotspots' && (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {hotspots.length === 0 ? (
                  <div className="text-center py-6 text-xs text-gray-500">
                    No annotations for this model.
                  </div>
                ) : (
                  hotspots.map((hotspot) => (
                    <button
                      key={hotspot.id}
                      onClick={() => handleHotspotSelect(hotspot)}
                      className={`w-full text-left p-3 rounded-xl border transition-all text-xs cursor-pointer ${
                        selectedHotspot?.id === hotspot.id
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                          : 'bg-gray-950 border-gray-800 text-gray-300 hover:border-gray-700'
                      }`}
                    >
                      <span className="font-semibold block mb-0.5">{hotspot.label}</span>
                      <p className="text-gray-500 text-[11px] leading-snug line-clamp-2">{hotspot.description}</p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* End Session Button */}
          <button
            onClick={() => router.push(`/dashboard?sessionId=${sessionId}`)}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
          >
            End Session
          </button>
        </aside>
      </div>
    </div>
  );
}
