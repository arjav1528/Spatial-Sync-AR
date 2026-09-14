'use client';

import { useEffect } from 'react';
import { useSpatialStore } from '@/lib/socket-store';

export function useSpatialSync(sessionId: string, token: string) {
  const {
    connect,
    disconnect,
    isConnected,
    connectionStatus,
    cameraOrbit,
    viewers,
    sendCameraUpdate,
    setCameraOrbit,
  } = useSpatialStore();

  useEffect(() => {
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
    viewers,
    viewerCount: viewers.length,
    sendUpdate: sendCameraUpdate,
  };
}
