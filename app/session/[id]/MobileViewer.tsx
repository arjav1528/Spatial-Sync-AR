'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import ModelViewerWrapper from '@/components/ModelViewerWrapper';
import HotspotMarker, { Hotspot } from '@/components/HotspotMarker';
import { useSpatialSync } from '@/lib/hooks/useSpatialSync';
import { getS3PublicUrl } from '@/lib/aws-config';
import { Button } from '@/components/ui/button';

interface MobileViewerProps {
  sessionId: string;
}

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

function parseOrbit(orbit: string): { theta: number; phi: number; radius: number } {
  const parts = orbit.match(/([\d.\-]+)deg\s+([\d.\-]+)deg\s+([\d.\-]+)m/);
  if (!parts) return { theta: 0, phi: 75, radius: 2.5 };
  return { theta: parseFloat(parts[1]), phi: parseFloat(parts[2]), radius: parseFloat(parts[3]) };
}

type ArStatus = 'inactive' | 'scanning' | 'placed' | 'failed';

export default function MobileViewer({ sessionId }: MobileViewerProps) {
  const [modelUrl, setModelUrl] = useState('');
  const [iosSrc, setIosSrc] = useState<string | undefined>(undefined);
  const [displayOrbit, setDisplayOrbit] = useState('0deg 75deg 2.5m');
  const [showArModal, setShowArModal] = useState(false);
  const [arStatus, setArStatus] = useState<ArStatus>('inactive');
  const [showGestureHints, setShowGestureHints] = useState(false);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [isIosDevice, setIsIosDevice] = useState(false);

  const { cameraOrbit, isConnected } = useSpatialSync(sessionId, 'viewer-token');

  const targetOrbitRef = useRef({ theta: 0, phi: 75, radius: 2.5 });
  const currentOrbitRef = useRef({ theta: 0, phi: 75, radius: 2.5 });
  const gazeBufferRef = useRef<{ x: number; y: number; z: number; theta: number; phi: number; timestamp: number }[]>([]);
  const animFrameRef = useRef<number>(0);

  // Update target orbit whenever host broadcasts new camera position
  useEffect(() => {
    if (cameraOrbit) {
      targetOrbitRef.current = parseOrbit(cameraOrbit);
    }
  }, [cameraOrbit]);

  // Detect iOS to handle QuickLook limitation (no custom HTML overlays)
  useEffect(() => {
    setIsIosDevice(/iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

  // Fetch session metadata + hotspots for this model
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch(`/api/session?id=${sessionId}`);
        if (!res.ok) return;
        const data = await res.json();
        const url: string = data.assetUrl || data.session?.assetUrl
          || (data.session?.assetKey ? getS3PublicUrl(data.session.assetKey) : '');
        if (!url) return;

        if (url.toLowerCase().endsWith('.usdz')) {
          setIosSrc(url);
        } else {
          setModelUrl(url);
        }

        const assetKey: string = data.session?.assetKey || '';
        const filename = assetKey.split('/').pop() || '';
        const modelId = filename.replace(/\.[^.]+$/, '');
        if (modelId) {
          try {
            const hotspotsRes = await fetch(`/api/hotspots?modelId=${encodeURIComponent(modelId)}`);
            if (hotspotsRes.ok) {
              const hotspotsData = await hotspotsRes.json();
              setHotspots(hotspotsData.hotspots || []);
            }
          } catch {
            // No hotspots — silent degradation
          }
        }
      } catch (err) {
        console.error('Failed to fetch session metadata:', err);
      }
    }
    fetchSession();
  }, [sessionId]);

  // Lerp animation loop for smooth 60fps rendering locally
  useEffect(() => {
    const animate = () => {
      const current = currentOrbitRef.current;
      const target = targetOrbitRef.current;

      current.theta = lerp(current.theta, target.theta, 0.15);
      current.phi = lerp(current.phi, target.phi, 0.15);
      current.radius = lerp(current.radius, target.radius, 0.15);

      setDisplayOrbit(`${current.theta.toFixed(1)}deg ${current.phi.toFixed(1)}deg ${current.radius.toFixed(2)}m`);

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  // Gaze analytics batching — POST every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const buffer = gazeBufferRef.current;
      if (buffer.length === 0) return;

      const vectorsCopy = [...buffer];
      gazeBufferRef.current = [];

      try {
        await fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            userId: 'viewer-device',
            vectors: vectorsCopy,
          }),
        });
      } catch (err) {
        console.error('Analytics batch send failed:', err);
        gazeBufferRef.current = [...vectorsCopy, ...gazeBufferRef.current];
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [sessionId]);

  // Log gaze vector from current camera position
  const logGaze = useCallback(() => {
    const current = currentOrbitRef.current;
    gazeBufferRef.current.push({
      x: current.radius * Math.sin((current.phi * Math.PI) / 180) * Math.cos((current.theta * Math.PI) / 180),
      y: current.radius * Math.cos((current.phi * Math.PI) / 180),
      z: current.radius * Math.sin((current.phi * Math.PI) / 180) * Math.sin((current.theta * Math.PI) / 180),
      theta: current.theta,
      phi: current.phi,
      timestamp: Date.now(),
    });
  }, []);

  // Sample gaze at 5Hz
  useEffect(() => {
    const gazeInterval = setInterval(logGaze, 200);
    return () => clearInterval(gazeInterval);
  }, [logGaze]);

  const handleArStatus = useCallback((status: string) => {
    if (status === 'session-started') {
      setArStatus('scanning');
      setShowGestureHints(false);
      setSelectedHotspot(null);
    } else if (status === 'object-placed') {
      setArStatus('placed');
      setShowGestureHints(true);
      setTimeout(() => setShowGestureHints(false), 4000);
    } else if (status === 'failed' || status === 'not-presenting') {
      setArStatus('inactive');
      setShowGestureHints(false);
      setSelectedHotspot(null);
    }
  }, []);

  const handleHotspotTap = useCallback((hotspot: Hotspot) => {
    setSelectedHotspot((prev: Hotspot | null) => prev?.id === hotspot.id ? null : hotspot);
  }, []);

  const handleArClick = (e: React.MouseEvent) => {
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const modelViewerEl = document.querySelector('model-viewer') as any;

    if (modelViewerEl) {
      if (modelViewerEl.canActivateAR) {
        try {
          modelViewerEl.activateAR();
          return;
        } catch (err) {
          console.warn('AR activation error:', err);
        }
      }

      if (isIOS) {
        try {
          if (typeof modelViewerEl.activateAR === 'function') {
            modelViewerEl.activateAR();
          }
        } catch (err) {
          console.warn('iOS AR launch error:', err);
        }
        return;
      }

      const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (!isMobileDevice) {
        e.preventDefault();
        e.stopPropagation();
        setShowArModal(true);
      }
    } else {
      const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (!isMobileDevice) {
        e.preventDefault();
        e.stopPropagation();
        setShowArModal(true);
      }
    }
  };

  return (
    <div className="h-screen relative bg-zinc-950 text-white select-none overflow-hidden">
      <ModelViewerWrapper
        src={modelUrl}
        iosSrc={iosSrc}
        ar={true}
        cameraOrbit={displayOrbit}
        interactive={false}
        onArStatus={handleArStatus}
      >
        {/* Slotted Native AR Launcher Button — MUST be direct child of model-viewer */}
        <button
          slot="ar-button"
          onClick={handleArClick}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-xs bg-white text-zinc-950 hover:bg-zinc-200 active:scale-95 py-3.5 px-6 rounded-full font-bold text-base shadow-2xl transition-all flex items-center justify-center gap-2 cursor-pointer z-20 border-none outline-none"
          style={{ display: 'flex' }}
        >
          <span>🛋️</span> View in My Room
        </button>

        {/* Hotspot pins */}
        {hotspots.map((hotspot) => (
          <HotspotMarker
            key={hotspot.id}
            hotspot={hotspot}
            selected={selectedHotspot?.id === hotspot.id}
            onClick={() => handleHotspotTap(hotspot)}
          />
        ))}
      </ModelViewerWrapper>

      {/* Top Mobile Status Header */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
        <div className="flex items-center gap-2 bg-zinc-900/90 backdrop-blur px-3.5 py-1.5 rounded-full border border-zinc-800 shadow-xl">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-white animate-pulse' : 'bg-zinc-600'}`} />
          <span className="text-xs font-medium text-white">{isConnected ? 'Host Synced' : 'Connecting...'}</span>
          <span className="text-[10px] font-mono text-zinc-400 border-l border-zinc-700 pl-2">#{sessionId}</span>
        </div>

        <div className="bg-zinc-800 text-white border border-zinc-700 text-[10px] font-mono px-2.5 py-1 rounded-full font-semibold">
          WebXR Active
        </div>
      </div>

      {/* Camera Sync Telemetry Pill */}
      {arStatus === 'inactive' && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-zinc-900/80 backdrop-blur px-4 py-1.5 rounded-full border border-zinc-800 text-[11px] font-mono text-zinc-300 flex items-center gap-2 pointer-events-none z-10">
          <span className="text-white">🔄</span>
          <span>Orbit: <span className="text-white font-bold">{displayOrbit}</span></span>
        </div>
      )}

      {/* AR Scanning Overlay */}
      {arStatus === 'scanning' && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 pointer-events-none z-10">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-white animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <div className="bg-zinc-900/90 backdrop-blur px-5 py-2 rounded-full border border-zinc-700 text-sm font-medium text-white">
            Scanning for floor surface...
          </div>
        </div>
      )}

      {/* Gesture Hints Overlay */}
      {showGestureHints && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 animate-fade-in">
          <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-700 rounded-2xl px-6 py-4 text-center space-y-2 shadow-2xl">
            <p className="text-xs font-semibold text-white uppercase tracking-widest">Object Placed</p>
            <div className="flex gap-4 text-xs text-zinc-300">
              <span>Pinch to resize</span>
              <span className="text-zinc-600">·</span>
              <span>Drag to move</span>
              <span className="text-zinc-600">·</span>
              <span>Twist to rotate</span>
            </div>
          </div>
        </div>
      )}

      {/* AR Hotspot Annotation Card */}
      {selectedHotspot && (
        <div className="absolute top-20 left-4 right-4 z-30 pointer-events-auto animate-fade-in">
          <div className="bg-zinc-950/95 backdrop-blur-md border border-zinc-800 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1">
                  {selectedHotspot.label}
                </p>
                <h3 className="text-base font-bold text-white leading-snug">
                  {selectedHotspot.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedHotspot(null)}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors text-lg leading-none"
                aria-label="Close annotation"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed mb-4">
              {selectedHotspot.description}
            </p>
            {Object.keys(selectedHotspot.specs).length > 0 && (
              <div className="border-t border-zinc-800 pt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                {(Object.entries(selectedHotspot.specs) as [string, string][]).map(([k, v]) => (
                  <div key={k}>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wide">{k}</p>
                    <p className="text-xs font-semibold text-white">{v}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* iOS Pre-AR Hotspot Info */}
      {isIosDevice && hotspots.length > 0 && arStatus === 'inactive' && !selectedHotspot && (
        <div className="absolute bottom-24 left-4 right-4 z-10 pointer-events-none">
          <div className="bg-zinc-900/85 backdrop-blur border border-zinc-700/60 rounded-xl px-4 py-3">
            <p className="text-[10px] font-semibold text-zinc-300 uppercase tracking-widest mb-2">
              📌 Component Annotations
            </p>
            <div className="flex flex-wrap gap-2">
              {hotspots.map((h) => (
                <span
                  key={h.id}
                  className="text-[10px] font-medium text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-full px-2.5 py-0.5"
                >
                  {h.label}
                </span>
              ))}
            </div>
            <p className="text-[10px] text-zinc-500 mt-2">Tap pins in 3D view to explore. iOS AR QuickLook shows the model only.</p>
          </div>
        </div>
      )}

      {/* AR Device Help Modal for Desktop */}
      {showArModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 bg-zinc-800 text-white rounded-full flex items-center justify-center text-2xl mx-auto border border-zinc-700">
              📱
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Open on Your Phone</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                AR requires a smartphone camera (iOS ARKit or Android ARCore). Open this session on your phone to place the product in your room.
              </p>
            </div>
            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-left text-xs text-zinc-300 space-y-1 font-mono">
              <p className="text-white font-semibold font-sans">How to view in AR:</p>
              <p>1. Open this link on your smartphone</p>
              <p>2. Tap "View in My Room"</p>
              <p>3. Point camera at floor — object appears</p>
            </div>
            <Button
              onClick={() => setShowArModal(false)}
              variant="default"
              className="w-full text-xs"
            >
              Got it, continue in 3D Mode
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
