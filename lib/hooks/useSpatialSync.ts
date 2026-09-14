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
  } = useSpatialStore();

  useEffect(() => {
    connect(sessionId, token);
    return () => {
      disconnect();
    };
  }, [sessionId, token, connect, disconnect]);

  return {
    isConnected,
    connectionStatus,
    cameraOrbit,
    viewers,
    viewerCount: viewers.length,
    sendUpdate: sendCameraUpdate,
  };
}
