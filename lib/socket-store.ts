import { create } from 'zustand';

export interface LaserCursor {
  position: string;
  normal: string;
  active: boolean;
}

interface SpatialState {
  socket: WebSocket | null;
  sessionId: string | null;
  isConnected: boolean;
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';
  cameraOrbit: string;
  laserCursor: LaserCursor | null;
  selectedHotspotId: string | null;
  viewers: string[];
  lastSendTime: number;

  connect: (sessionId: string, token: string) => void;
  disconnect: () => void;
  sendCameraUpdate: (orbit: string) => void;
  sendCursorUpdate: (cursor: LaserCursor | null) => void;
  sendHotspotUpdate: (hotspotId: string | null) => void;
  setCameraOrbit: (orbit: string) => void;
}

const THROTTLE_MS = 66; // ~15fps max send rate

export const useSpatialStore = create<SpatialState>((set, get) => ({
  socket: null,
  sessionId: null,
  isConnected: false,
  connectionStatus: 'idle',
  cameraOrbit: '0deg 75deg 2.5m',
  laserCursor: null,
  selectedHotspotId: null,
  viewers: [],
  lastSendTime: 0,

  connect: (sessionId: string, token: string) => {
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
    if (!wsUrl) {
      console.error('WebSocket URL not configured');
      set({ connectionStatus: 'error' });
      return;
    }

    // Don't re-connect if already connected to same session
    const { socket, sessionId: currentSession } = get();
    if (socket && currentSession === sessionId && socket.readyState === WebSocket.OPEN) {
      return;
    }

    if (socket) {
      socket.close();
    }

    set({ connectionStatus: 'connecting', sessionId });
    const ws = new WebSocket(`${wsUrl}?sessionId=${sessionId}&token=${token}`);

    ws.onopen = () => {
      set({ socket: ws, isConnected: true, connectionStatus: 'connected' });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.action === 'SYNC_CAMERA' && data.data?.cameraOrbit) {
          set({ cameraOrbit: data.data.cameraOrbit });
        }
        if (data.action === 'SYNC_CURSOR') {
          set({ laserCursor: data.data });
        }
        if (data.action === 'SYNC_HOTSPOT') {
          set({ selectedHotspotId: data.data?.hotspotId ?? null });
        }
        if (data.action === 'VIEWER_UPDATE' && data.viewers) {
          set({ viewers: data.viewers });
        }
      } catch (err) {
        console.error('WebSocket message parse error:', err);
      }
    };

    ws.onclose = () => {
      set({ socket: null, isConnected: false, connectionStatus: 'disconnected' });
    };

    ws.onerror = () => {
      set({ connectionStatus: 'error' });
    };
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.close();
    }
    set({ socket: null, sessionId: null, isConnected: false, connectionStatus: 'disconnected' });
  },

  sendCameraUpdate: (orbit: string) => {
    const { socket, isConnected, lastSendTime, sessionId } = get();
    const now = Date.now();

    // Throttle to ~15fps
    if (now - lastSendTime < THROTTLE_MS) return;
    if (!socket || !isConnected || !sessionId) return;

    socket.send(JSON.stringify({
      action: 'SYNC_CAMERA',
      sessionId: sessionId,
      data: { cameraOrbit: orbit },
    }));

    set({ lastSendTime: now });
  },

  sendCursorUpdate: (cursor: LaserCursor | null) => {
    const { socket, isConnected, sessionId } = get();
    if (!socket || !isConnected || !sessionId) return;

    socket.send(JSON.stringify({
      action: 'SYNC_CURSOR',
      sessionId: sessionId,
      data: cursor,
    }));

    set({ laserCursor: cursor });
  },

  sendHotspotUpdate: (hotspotId: string | null) => {
    const { socket, isConnected, sessionId } = get();
    if (!socket || !isConnected || !sessionId) return;

    socket.send(JSON.stringify({
      action: 'SYNC_HOTSPOT',
      sessionId: sessionId,
      data: { hotspotId },
    }));

    set({ selectedHotspotId: hotspotId });
  },

  setCameraOrbit: (orbit: string) => {
    set({ cameraOrbit: orbit });
  },
}));
