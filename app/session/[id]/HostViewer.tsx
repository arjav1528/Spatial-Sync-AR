'use client';

import { useState, useCallback } from 'react';
import ModelViewerWrapper from '@/components/ModelViewerWrapper';
import QRCodeDisplay from '@/components/QRCodeDisplay';

interface HostViewerProps {
  sessionId: string;
}

export default function HostViewer({ sessionId }: HostViewerProps) {
  const [cameraOrbit, setCameraOrbit] = useState('0deg 75deg 2.5m');
  const [isConnected, setIsConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);

  // TODO: Wire up useSpatialSync hook in Phase 5
  const handleCameraChange = useCallback((orbit: string) => {
    setCameraOrbit(orbit);
    // sendUpdate(orbit) — will be added in Phase 5
  }, []);

  return (
    <div className="flex h-screen">
      {/* Main 3D Viewer */}
      <div className="flex-1 relative">
        <ModelViewerWrapper
          src="/models/demo.glb"
          ar={false}
          cameraOrbit={cameraOrbit}
          onCameraChange={handleCameraChange}
          interactive={true}
        />

        {/* Connection Status */}
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-gray-900/80 backdrop-blur px-4 py-2 rounded-full">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 bg-gray-900 border-l border-gray-800 p-6 flex flex-col">
        <h2 className="text-xl font-bold mb-6">Host Controls</h2>

        {/* Session Info */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-400">Session ID</p>
          <p className="text-2xl font-mono font-bold">{sessionId}</p>
        </div>

        {/* Viewer Count */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-400">Connected Viewers</p>
          <p className="text-2xl font-bold">{viewerCount}</p>
        </div>

        {/* QR Code */}
        <div className="flex-1">
          <p className="text-sm text-gray-400 mb-3">Share Session</p>
          <QRCodeDisplay sessionId={sessionId} />
        </div>

        {/* End Session */}
        <button className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition-colors">
          End Session
        </button>
      </div>
    </div>
  );
}
