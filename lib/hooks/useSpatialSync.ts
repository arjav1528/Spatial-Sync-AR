'use client';

import { useEffect } from 'react';
import { useSpatialStore } from '@/lib/socket-store';

export function useSpatialSync(sessionId: string, token: string) {
  const connect = useSpatialStore((state) => state.connect);
  const disconnect = useSpatialStore((state) => state.disconnect);
  const isConnected = useSpatialStore((state) => state.isConnected);
  const connectionStatus = useSpatialStore((state) => state.connectionStatus);
  const cameraOrbit = useSpatialStore((state) => state.cameraOrbit);
  const laserCursor = useSpatialStore((state) => state.laserCursor);
  const selectedHotspotId = useSpatialStore((state) => state.selectedHotspotId);
  const viewers = useSpatialStore((state) => state.viewers);
  const sendCameraUpdate = useSpatialStore((state) => state.sendCameraUpdate);
  const sendCursorUpdate = useSpatialStore((state) => state.sendCursorUpdate);
  const sendHotspotUpdate = useSpatialStore((state) => state.sendHotspotUpdate);
  const setCameraOrbit = useSpatialStore((state) => state.setCameraOrbit);

  useEffect(() => {
    if (!sessionId) return;
    connect(sessionId, token);

    // Fetch initial / current state on connect (handles reconnect state snap)
    async function syncCurrentState() {
      try {
        const res = await fetch(`/api/session?id=${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.currentState?.cameraOrbit) {
            setCameraOrbit(data.currentState.cameraOrbit);
          }
        }
      } catch (err) {
        console.error('Failed to fetch initial session state:', err);
      }
    }

    syncCurrentState();

    return () => {
      disconnect();
    };
  }, [sessionId, token, connect, disconnect, setCameraOrbit]);

  return {
    isConnected,
    connectionStatus,
    cameraOrbit,
    laserCursor,
    selectedHotspotId,
    viewers,
    viewerCount: viewers.length,
    sendUpdate: sendCameraUpdate,
    sendCursorUpdate,
    sendHotspotUpdate,
  };
}
