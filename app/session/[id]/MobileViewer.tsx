'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import ModelViewerWrapper from '@/components/ModelViewerWrapper';

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
  const [displayOrbit, setDisplayOrbit] = useState('0deg 75deg 2.5m');
  const [isConnected, setIsConnected] = useState(false);
  const targetOrbitRef = useRef({ theta: 0, phi: 75, radius: 2.5 });
  const currentOrbitRef = useRef({ theta: 0, phi: 75, radius: 2.5 });
  const gazeBufferRef = useRef<{ x: number; y: number; z: number; theta: number; phi: number; timestamp: number }[]>([]);
  const animFrameRef = useRef<number>(0);

  // Lerp animation loop for smooth 60fps rendering
  useEffect(() => {
    const animate = () => {
      const current = currentOrbitRef.current;
      const target = targetOrbitRef.current;

      current.theta = lerp(current.theta, target.theta, 0.1);
      current.phi = lerp(current.phi, target.phi, 0.1);
      current.radius = lerp(current.radius, target.radius, 0.1);

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
            userId: 'viewer',
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
      x: current.radius * Math.sin(current.phi * Math.PI / 180) * Math.cos(current.theta * Math.PI / 180),
      y: current.radius * Math.cos(current.phi * Math.PI / 180),
      z: current.radius * Math.sin(current.phi * Math.PI / 180) * Math.sin(current.theta * Math.PI / 180),
      theta: current.theta,
      phi: current.phi,
      timestamp: Date.now(),
    });
  }, []);

  // Log gaze periodically within the animation loop
  useEffect(() => {
    const gazeInterval = setInterval(logGaze, 200); // Sample at 5Hz
    return () => clearInterval(gazeInterval);
  }, [logGaze]);

  return (
    <div className="h-screen relative">
      <ModelViewerWrapper
        src="/models/demo.glb"
        ar={true}
        cameraOrbit={displayOrbit}
        interactive={false}
      />

      {/* Status Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-gray-900/80 backdrop-blur px-4 py-2 rounded-full">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
        <span className="text-sm text-white">{isConnected ? 'Synced' : 'Connecting...'}</span>
        <span className="text-xs text-gray-400 ml-2">Session: {sessionId}</span>
      </div>

      {/* AR Button */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-medium text-lg shadow-lg shadow-blue-600/25 transition-all">
          View in AR
        </button>
      </div>
    </div>
  );
}
