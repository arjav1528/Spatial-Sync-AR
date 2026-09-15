'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import ModelViewerWrapper from '@/components/ModelViewerWrapper';
import { useSpatialSync } from '@/lib/hooks/useSpatialSync';
import { getS3PublicUrl } from '@/lib/aws-config';

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

export default function MobileViewer({ sessionId }: MobileViewerProps) {
  const [modelUrl, setModelUrl] = useState('/models/demo.glb');
  const [displayOrbit, setDisplayOrbit] = useState('0deg 75deg 2.5m');

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

  // Fetch session metadata to get asset URL
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch(`/api/session?id=${sessionId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.session?.assetKey) {
          setModelUrl(getS3PublicUrl(data.session.assetKey));
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

  return (
    <div className="h-screen relative bg-gray-950 text-white select-none overflow-hidden">
      <ModelViewerWrapper
        src={modelUrl}
        ar={true}
        cameraOrbit={displayOrbit}
        interactive={false}
      />

      {/* Top Mobile Status Header */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
        <div className="flex items-center gap-2 bg-gray-900/90 backdrop-blur px-3.5 py-1.5 rounded-full border border-gray-800 shadow-xl">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-xs font-medium text-white">{isConnected ? 'Host Synced' : 'Connecting...'}</span>
          <span className="text-[10px] font-mono text-gray-400 border-l border-gray-700 pl-2">#{sessionId}</span>
        </div>

        <div className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-mono px-2.5 py-1 rounded-full font-semibold">
          WebXR Ready
        </div>
      </div>

      {/* Camera Sync Telemetry Pill */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-gray-900/80 backdrop-blur px-4 py-1.5 rounded-full border border-gray-800 text-[11px] font-mono text-gray-300 flex items-center gap-2 pointer-events-none">
        <span className="text-blue-400">🔄</span>
        <span>Orbit: <span className="text-white font-bold">{displayOrbit}</span></span>
      </div>

      {/* AR Launch Button */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xs px-4">
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-full font-semibold text-base shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2">
          <span>🕶️</span> View Full Scale in AR
        </button>
      </div>
    </div>
  );
}
