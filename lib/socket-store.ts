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
const DEFAULT_WS_URL = 'wss://notts6p9cc.execute-api.eu-central-1.amazonaws.com/dev';

let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

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
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || DEFAULT_WS_URL;

    // Don't re-connect if already connected to same session
    const { socket, sessionId: currentSession } = get();
    if (socket && currentSession === sessionId && socket.readyState === WebSocket.OPEN) {
      return;
    }

    if (socket) {
      socket.close();
    }

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    set({ connectionStatus: 'connecting', sessionId });

    try {
      const ws = new WebSocket(`${wsUrl}?sessionId=${sessionId}&token=${token}`);

      ws.onopen = () => {
        set({ socket: ws, isConnected: true, connectionStatus: 'connected' });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.action === 'SYNC_CAMERA' && data.data?.cameraOrbit) {
            const rawPayload: string = data.data.cameraOrbit;

            // Extract camera orbit string (e.g. "0deg 75deg 2.5m")
            const orbitPart = rawPayload.split('|')[0];
            if (orbitPart) {
              set({ cameraOrbit: orbitPart });
            }

            // Extract laser cursor if encoded in payload
            const laserMatch = rawPayload.match(/\|LASER:([^|]+)\|([^|]+)/);
            if (laserMatch) {
              set({
                laserCursor: {
                  position: laserMatch[1],
                  normal: laserMatch[2],
                  active: true,
                },
              });
            } else if (rawPayload.includes('|NOLASER')) {
              set({ laserCursor: null });
            }

            // Extract hotspot selection if encoded in payload
            const hotspotMatch = rawPayload.match(/\|HOTSPOT:([^|]+)/);
            if (hotspotMatch) {
              set({ selectedHotspotId: hotspotMatch[1] });
            } else if (rawPayload.includes('|NOHOTSPOT')) {
              set({ selectedHotspotId: null });
            }
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
        // Auto-reconnect after 3 seconds if session is active
        if (reconnectTimer) clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(() => {
          const { sessionId: activeSession } = get();
          if (activeSession) {
            get().connect(activeSession, token);
          }
        }, 3000);
      };

      ws.onerror = (err) => {
        console.error('WebSocket connection error:', err);
        set({ connectionStatus: 'error' });
      };
    } catch (err) {
      console.error('Failed to instantiate WebSocket:', err);
      set({ connectionStatus: 'error' });
    }
  },

  disconnect: () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    const { socket } = get();
    if (socket) {
      socket.close();
    }
    set({ socket: null, sessionId: null, isConnected: false, connectionStatus: 'disconnected' });
  },

  sendCameraUpdate: (orbit: string) => {
    const { socket, isConnected, lastSendTime, sessionId, laserCursor, selectedHotspotId } = get();
    const now = Date.now();

    if (now - lastSendTime < THROTTLE_MS) return;
    if (!socket || !isConnected || !sessionId) return;

    const laserPart = laserCursor && laserCursor.active ? `|LASER:${laserCursor.position}|${laserCursor.normal}` : '|NOLASER';
    const hotspotPart = selectedHotspotId ? `|HOTSPOT:${selectedHotspotId}` : '|NOHOTSPOT';
    const fullPayload = `${orbit}${laserPart}${hotspotPart}`;

    socket.send(JSON.stringify({
      action: 'SYNC_CAMERA',
      sessionId: sessionId,
      data: { cameraOrbit: fullPayload },
    }));

    set({ cameraOrbit: orbit, lastSendTime: now });
  },

  sendCursorUpdate: (cursor: LaserCursor | null) => {
    const { socket, isConnected, sessionId, cameraOrbit, selectedHotspotId } = get();
    if (!socket || !isConnected || !sessionId) return;

    const laserPart = cursor && cursor.active ? `|LASER:${cursor.position}|${cursor.normal}` : '|NOLASER';
    const hotspotPart = selectedHotspotId ? `|HOTSPOT:${selectedHotspotId}` : '|NOHOTSPOT';
    const fullPayload = `${cameraOrbit.split('|')[0]}${laserPart}${hotspotPart}`;

    socket.send(JSON.stringify({
      action: 'SYNC_CAMERA',
      sessionId: sessionId,
      data: { cameraOrbit: fullPayload },
    }));

    set({ laserCursor: cursor });
  },

  sendHotspotUpdate: (hotspotId: string | null) => {
    const { socket, isConnected, sessionId, cameraOrbit, laserCursor } = get();
    if (!socket || !isConnected || !sessionId) return;

    const laserPart = laserCursor && laserCursor.active ? `|LASER:${laserCursor.position}|${laserCursor.normal}` : '|NOLASER';
    const hotspotPart = hotspotId ? `|HOTSPOT:${hotspotId}` : '|NOHOTSPOT';
    const fullPayload = `${cameraOrbit.split('|')[0]}${laserPart}${hotspotPart}`;

    socket.send(JSON.stringify({
      action: 'SYNC_CAMERA',
      sessionId: sessionId,
      data: { cameraOrbit: fullPayload },
    }));

    set({ selectedHotspotId: hotspotId });
  },

  setCameraOrbit: (orbit: string) => {
    set({ cameraOrbit: orbit });
  },
}));
