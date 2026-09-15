'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import ModelViewerWrapper from '@/components/ModelViewerWrapper';
import { useSpatialSync } from '@/lib/hooks/useSpatialSync';

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
          const key = data.session.assetKey;
          if (key.startsWith('/') || key.startsWith('http')) {
            setModelUrl(key);
          } else {
            const bucket = process.env.NEXT_PUBLIC_S3_BUCKET || 'spatial-sync-arjav';
            setModelUrl(`https://${bucket}.s3.eu-central-1.amazonaws.com/${key}`);
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
        // Re-add failed vectors back to buffer
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
    <div className="h-screen relative">
      <ModelViewerWrapper
        src={modelUrl}
        ar={true}
        cameraOrbit={displayOrbit}
        interactive={false}
      />

      {/* Status Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-gray-900/90 backdrop-blur px-4 py-2 rounded-full border border-gray-800 shadow-xl">
        <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-amber-400'}`} />
        <span className="text-sm font-medium text-white">{isConnected ? 'Synced with Host' : 'Connecting...'}</span>
        <span className="text-xs font-mono text-gray-400 border-l border-gray-700 pl-2">#{sessionId}</span>
      </div>

      {/* AR Launch Button */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg shadow-blue-600/30 transition-all flex items-center gap-3">
          <span>👓</span> View in AR
        </button>
      </div>
    </div>
  );
}
