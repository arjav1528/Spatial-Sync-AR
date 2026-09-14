import { create } from 'zustand';

interface SpatialState {
  socket: WebSocket | null;
  isConnected: boolean;
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';
  cameraOrbit: string;
  viewers: string[];
  lastSendTime: number;

  connect: (sessionId: string, token: string) => void;
  disconnect: () => void;
  sendCameraUpdate: (orbit: string) => void;
  setCameraOrbit: (orbit: string) => void;
}

const THROTTLE_MS = 66; // ~15fps max send rate

export const useSpatialStore = create<SpatialState>((set, get) => ({
  socket: null,
  isConnected: false,
  connectionStatus: 'idle',
  cameraOrbit: '0deg 75deg 2.5m',
  viewers: [],
  lastSendTime: 0,

  connect: (sessionId: string, token: string) => {
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
    if (!wsUrl) {
      console.error('WebSocket URL not configured');
      set({ connectionStatus: 'error' });
      return;
    }

    set({ connectionStatus: 'connecting' });
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
    set({ socket: null, isConnected: false, connectionStatus: 'disconnected' });
  },

  sendCameraUpdate: (orbit: string) => {
    const { socket, isConnected, lastSendTime } = get();
    const now = Date.now();

    // Throttle to ~15fps
    if (now - lastSendTime < THROTTLE_MS) return;
    if (!socket || !isConnected) return;

    socket.send(JSON.stringify({
      action: 'SYNC_CAMERA',
      data: { cameraOrbit: orbit },
    }));

    set({ lastSendTime: now });
  },

  setCameraOrbit: (orbit: string) => {
    set({ cameraOrbit: orbit });
  },
}));
