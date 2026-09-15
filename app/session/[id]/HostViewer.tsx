'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ModelViewerWrapper from '@/components/ModelViewerWrapper';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import { useSpatialSync } from '@/lib/hooks/useSpatialSync';

interface HostViewerProps {
  sessionId: string;
}

export default function HostViewer({ sessionId }: HostViewerProps) {
  const router = useRouter();
  const [modelUrl, setModelUrl] = useState('/models/demo.glb');

  const {
    isConnected,
    viewerCount,
    sendUpdate,
  } = useSpatialSync(sessionId, 'host-token');

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

  const handleCameraChange = useCallback((orbit: string) => {
    sendUpdate(orbit);
  }, [sendUpdate]);

  return (
    <div className="flex h-screen">
      {/* Main 3D Viewer */}
      <div className="flex-1 relative">
        <ModelViewerWrapper
          src={modelUrl}
          ar={false}
          cameraOrbit="0deg 75deg 2.5m"
          onCameraChange={handleCameraChange}
          interactive={true}
        />

        {/* Connection Status */}
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-gray-900/80 backdrop-blur px-4 py-2 rounded-full border border-gray-800">
          <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-sm font-medium">
            {isConnected ? 'Live & Syncing' : 'Connecting to Cloud...'}
          </span>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 bg-gray-900 border-l border-gray-800 p-6 flex flex-col justify-between">
        <div>
          <h2 className="text-xl font-bold mb-6">Host Controller</h2>

          {/* Session Info */}
          <div className="bg-gray-800/80 border border-gray-700/50 rounded-lg p-4 mb-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Session ID</p>
            <p className="text-2xl font-mono font-bold text-blue-400">{sessionId}</p>
          </div>

          {/* Viewer Count */}
          <div className="bg-gray-800/80 border border-gray-700/50 rounded-lg p-4 mb-6">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Connected Viewers</p>
            <p className="text-3xl font-bold text-white">{viewerCount}</p>
          </div>

          {/* QR Code */}
          <div className="mb-6">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Scan to Join AR</p>
            <QRCodeDisplay sessionId={sessionId} />
          </div>
        </div>

        {/* End Session */}
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full bg-red-600/90 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition-colors text-sm"
        >
          End & View Analytics
        </button>
      </div>
    </div>
  );
}
