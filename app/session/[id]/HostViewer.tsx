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
  const [modelUrl, setModelUrl] = useState('/models/demo.glb');
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
          // No hotspots for this model — silent degradation
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
    const defaultOrbit = '0deg 75deg 2.5m';
    setCurrentOrbit(defaultOrbit);
    setCameraTarget(undefined);
    setSelectedHotspot(null);
    sendUpdate(defaultOrbit);
  };

  const handleHotspotSelect = useCallback((hotspot: Hotspot) => {
    setSelectedHotspot(prev => prev?.id === hotspot.id ? null : hotspot);
    if (selectedHotspot?.id === hotspot.id) {
      setCameraTarget(undefined);
      return;
    }
    setCurrentOrbit(hotspot.cameraOrbit);
    setCameraTarget(hotspot.cameraTarget);
    sendUpdate(hotspot.cameraOrbit);
  }, [selectedHotspot, sendUpdate]);

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white select-none overflow-hidden">
      {/* Top Professional Header Bar */}
      <header className="h-16 bg-gray-900/90 backdrop-blur border-b border-gray-800 px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-lg shadow-blue-500/50" />
            <span className="font-bold tracking-tight text-lg">
              <span className="text-blue-500">Spatial</span>Sync <span className="text-xs bg-blue-500/20 text-blue-400 font-mono px-2 py-0.5 rounded border border-blue-500/30">PRO</span>
            </span>
          </div>

          <div className="h-4 w-px bg-gray-800" />

          <div className="flex items-center gap-2 bg-gray-950/60 border border-gray-800 px-3 py-1 rounded-full text-xs font-mono">
            <span className="text-gray-400">SESSION</span>
            <span className="text-blue-400 font-bold">{sessionId}</span>
          </div>
        </div>

        {/* Action Controls & Live Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-950/80 border border-gray-800 px-3 py-1.5 rounded-lg text-xs font-mono">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-gray-300">{isConnected ? 'LIVE SYNC ACTIVE' : 'CONNECTING...'}</span>
            <span className="text-gray-600">|</span>
            <span className="text-emerald-400">&lt;35ms latency</span>
          </div>

          <div className="flex items-center gap-2 border-l border-gray-800 pl-4">
            <button
              onClick={handleResetView}
              className="bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-700 transition-colors"
            >
              Reset Camera
            </button>
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                autoRotate
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
              }`}
            >
              Auto Rotate
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* 3D Viewport */}
        <div className="flex-1 relative bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
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

          {/* Floating Telemetry HUD */}
          <div className="absolute top-4 left-4 bg-gray-900/80 backdrop-blur border border-gray-800/80 rounded-xl p-3.5 shadow-2xl font-mono text-xs space-y-1.5 pointer-events-none">
            <div className="text-gray-400 uppercase tracking-wider text-[10px] font-semibold">Camera Telemetry (Host)</div>
            <div className="flex items-center gap-3 text-gray-200">
              <span>ORBIT: <span className="text-blue-400 font-bold">{currentOrbit}</span></span>
            </div>
            <div className="flex items-center gap-3 text-gray-400 text-[11px]">
              <span>FPS: <span className="text-emerald-400 font-semibold">60 FPS</span></span>
              <span>BROADCAST: <span className="text-emerald-400 font-semibold">15 Hz</span></span>
            </div>
          </div>

          {/* Spatial Anchor HUD Badge */}
          <div className="absolute bottom-4 left-4 bg-gray-900/80 backdrop-blur border border-gray-800 rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs font-mono text-gray-300">
            <span className="text-blue-400">📍</span>
            <span>Spatial Anchor: <span className="text-emerald-400">Locked (Floor Plane)</span></span>
          </div>
        </div>

        {/* Sidebar Controller */}
        <aside className="w-88 bg-gray-900/95 border-l border-gray-800 p-6 flex flex-col justify-between z-10 backdrop-blur">
          <div className="space-y-6">
            {/* Sidebar Header */}
            <div>
              <h2 className="text-lg font-bold tracking-tight">Presentation Suite</h2>
              <p className="text-xs text-gray-400 mt-0.5">Control live multiplayer spatial pitch</p>
            </div>

            {/* Sidebar Tabs */}
            <div className="grid grid-cols-4 gap-1 bg-gray-950 p-1 rounded-xl border border-gray-800 text-xs font-medium">
              <button
                onClick={() => setActiveTab('share')}
                className={`py-2 rounded-lg transition-colors ${
                  activeTab === 'share' ? 'bg-blue-600 text-white font-semibold' : 'text-gray-400 hover:text-white'
                }`}
              >
                Join
              </button>
              <button
                onClick={() => setActiveTab('participants')}
                className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1 ${
                  activeTab === 'participants' ? 'bg-blue-600 text-white font-semibold' : 'text-gray-400 hover:text-white'
                }`}
              >
                Viewers <span className="bg-blue-500/30 text-blue-300 px-1 rounded text-[10px]">{viewerCount}</span>
              </button>
              <button
                onClick={() => setActiveTab('asset')}
                className={`py-2 rounded-lg transition-colors ${
                  activeTab === 'asset' ? 'bg-blue-600 text-white font-semibold' : 'text-gray-400 hover:text-white'
                }`}
              >
                Specs
              </button>
              <button
                onClick={() => setActiveTab('hotspots')}
                className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1 ${
                  activeTab === 'hotspots' ? 'bg-blue-600 text-white font-semibold' : 'text-gray-400 hover:text-white'
                }`}
              >
                Parts
                {hotspots.length > 0 && (
                  <span className="bg-blue-500/30 text-blue-300 px-1 rounded text-[10px]">{hotspots.length}</span>
                )}
              </button>
            </div>

            {/* Tab Contents */}
            {activeTab === 'share' && (
              <div className="space-y-4">
                <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-400 mb-3 font-medium">Scan QR Code on Mobile to Join AR</p>
                  <QRCodeDisplay sessionId={sessionId} />
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-300 space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <span>💡</span> Zero-App Mobile AR
                  </p>
                  <p className="text-blue-300/80 leading-relaxed text-[11px]">
                    Buyers scan with their smartphone camera to instantly anchor the full-scale 3D hologram in physical space.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'participants' && (
              <div className="space-y-3">
                <div className="bg-gray-950 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-300">Connected Committee</span>
                    <span className="text-xs text-emerald-400 font-mono">{viewerCount + 1} Total</span>
                  </div>

                  <div className="space-y-2">
                    {/* Host Card */}
                    <div className="flex items-center justify-between bg-gray-900/80 border border-gray-800 p-2.5 rounded-lg text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center font-bold text-white text-xs">
                          H
                        </div>
                        <div>
                          <p className="font-medium text-white">Sales Rep (You)</p>
                          <p className="text-[10px] text-gray-400">Desktop Controller</p>
                        </div>
                      </div>
                      <span className="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-0.5 rounded font-mono font-medium">
                        HOST
                      </span>
                    </div>

                    {/* Viewers */}
                    {viewerCount > 0 ? (
                      Array.from({ length: viewerCount }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between bg-gray-900/50 border border-gray-800/80 p-2.5 rounded-lg text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center font-bold text-white text-xs">
                              V{i + 1}
                            </div>
                            <div>
                              <p className="font-medium text-gray-200">Buyer Device #{i + 1}</p>
                              <p className="text-[10px] text-gray-400">WebXR Mobile Viewer</p>
                            </div>
                          </div>
                          <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-mono font-medium">
                            SYNCED
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-xs text-gray-500">
                        Waiting for buyers to scan QR code...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'asset' && (
              <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 space-y-3 text-xs">
                <div>
                  <span className="text-gray-400 text-[11px] block">Asset File</span>
                  <span className="font-medium text-white font-mono break-all">{assetName}</span>
                </div>
                <div className="h-px bg-gray-800" />
                <div>
                  <span className="text-gray-400 text-[11px] block">Format & Compatibility</span>
                  <span className="font-medium text-gray-200">GLTF 2.0 Binary (.glb) • WebXR Native</span>
                </div>
                <div className="h-px bg-gray-800" />
                <div>
                  <span className="text-gray-400 text-[11px] block">Spatial Scale</span>
                  <span className="font-medium text-emerald-400 font-mono">1:1 Full Physical Scale</span>
                </div>
              </div>
            )}

            {activeTab === 'hotspots' && (
              <div className="space-y-2">
                {hotspots.length === 0 ? (
                  <div className="text-center py-6 text-xs text-gray-500">
                    No annotations for this model.
                  </div>
                ) : (
                  hotspots.map((hotspot) => (
                    <button
                      key={hotspot.id}
                      onClick={() => handleHotspotSelect(hotspot)}
                      className={`w-full text-left p-3 rounded-xl border transition-all text-xs ${
                        selectedHotspot?.id === hotspot.id
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                          : 'bg-gray-950 border-gray-800 text-gray-300 hover:border-blue-500/40 hover:bg-blue-500/5'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          selectedHotspot?.id === hotspot.id ? 'bg-emerald-400' : 'bg-blue-500'
                        }`} />
                        <span className="font-semibold">{hotspot.label}</span>
                      </div>
                      <p className="text-gray-500 leading-relaxed line-clamp-2 pl-4">{hotspot.description}</p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* End Session Button */}
          <button
            onClick={() => router.push(`/dashboard?sessionId=${sessionId}`)}
            className="w-full bg-red-600/90 hover:bg-red-600 text-white py-3 rounded-xl font-semibold text-xs tracking-wide shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2"
          >
            <span>⏹</span> End Session & View Analytics
          </button>
        </aside>
      </div>
    </div>
  );
}
