'use client';

import { useEffect, useRef, useState } from 'react';

// Declare the model-viewer custom element type for React 18 & 19
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        alt?: string;
        ar?: boolean;
        'ar-modes'?: string;
        'ar-scale'?: string;
        'ar-placement'?: string;
        'ios-src'?: string;
        'camera-orbit'?: string;
        'camera-target'?: string;
        'camera-controls'?: boolean;
        'auto-rotate'?: boolean;
        'shadow-intensity'?: string;
        style?: React.CSSProperties;
      };
    }
  }
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
          src?: string;
          alt?: string;
          ar?: boolean;
          'ar-modes'?: string;
          'ar-scale'?: string;
          'ar-placement'?: string;
          'ios-src'?: string;
          'camera-orbit'?: string;
          'camera-target'?: string;
          'camera-controls'?: boolean;
          'auto-rotate'?: boolean;
          'shadow-intensity'?: string;
          style?: React.CSSProperties;
        };
      }
    }
  }
}

type Vector3D = { x: number; y: number; z: number };

interface ModelViewerWrapperProps {
  src: string;
  iosSrc?: string;
  ar?: boolean;
  cameraOrbit?: string;
  cameraTarget?: string;
  onCameraChange?: (orbit: string) => void;
  onArStatus?: (status: string) => void;
  onSurfaceClick?: (hit: { position: Vector3D; normal: Vector3D }) => void;
  interactive?: boolean;
  autoRotate?: boolean;
  children?: React.ReactNode;
}

export default function ModelViewerWrapper({
  src,
  iosSrc,
  ar = false,
  cameraOrbit = '0deg 75deg 2.5m',
  cameraTarget,
  onCameraChange,
  onArStatus,
  onSurfaceClick,
  interactive = true,
  autoRotate = false,
  children,
}: ModelViewerWrapperProps) {
  const viewerRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    import('@google/model-viewer');
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    if (src) {
      setIsLoading(true);
      setLoadProgress(0);
      setLoadError(null);
    }

    const handleProgress = (e: Event) => {
      const detail = (e as CustomEvent<{ totalProgress: number }>).detail;
      if (detail && typeof detail.totalProgress === 'number') {
        const pct = Math.min(Math.round(detail.totalProgress * 100), 100);
        setLoadProgress(pct);
        if (pct >= 100) {
          setTimeout(() => setIsLoading(false), 300);
        }
      }
    };

    const handleLoad = () => {
      setLoadProgress(100);
      setTimeout(() => setIsLoading(false), 200);
    };

    const handleError = (err: Event) => {
      console.error('ModelViewer error:', err);
      setLoadError('Failed to load 3D asset file');
      setIsLoading(false);
    };

    viewer.addEventListener('progress', handleProgress);
    viewer.addEventListener('load', handleLoad);
    viewer.addEventListener('error', handleError);

    return () => {
      viewer.removeEventListener('progress', handleProgress);
      viewer.removeEventListener('load', handleLoad);
      viewer.removeEventListener('error', handleError);
    };
  }, [src]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !onCameraChange) return;

    const handleCameraChange = () => {
      const mv = viewer as unknown as { getCameraOrbit: () => { theta: number; phi: number; radius: number } };
      if (mv.getCameraOrbit) {
        const orbit = mv.getCameraOrbit();
        const thetaDeg = (orbit.theta * 180 / Math.PI).toFixed(1);
        const phiDeg = (orbit.phi * 180 / Math.PI).toFixed(1);
        const radiusM = orbit.radius.toFixed(2);
        onCameraChange(`${thetaDeg}deg ${phiDeg}deg ${radiusM}m`);
      }
    };

    viewer.addEventListener('camera-change', handleCameraChange);
    return () => viewer.removeEventListener('camera-change', handleCameraChange);
  }, [onCameraChange]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !onArStatus) return;

    const handleArStatus = (e: Event) => {
      const status = (e as CustomEvent<{ status: string }>).detail?.status;
      if (status) onArStatus(status);
    };

    viewer.addEventListener('ar-status', handleArStatus);
    return () => viewer.removeEventListener('ar-status', handleArStatus);
  }, [onArStatus]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !onSurfaceClick) return;

    let downX = 0;
    let downY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      downX = e.offsetX;
      downY = e.offsetY;
    };

    const handleClick = (e: MouseEvent) => {
      if (Math.hypot(e.offsetX - downX, e.offsetY - downY) > 6) return;
      const mv = viewer as unknown as {
        positionAndNormalFromPoint: (x: number, y: number) => { position: Vector3D; normal: Vector3D } | null;
      };
      if (typeof mv.positionAndNormalFromPoint !== 'function') return;
      const hit = mv.positionAndNormalFromPoint(e.offsetX, e.offsetY);
      if (hit) onSurfaceClick(hit);
    };

    viewer.addEventListener('mousedown', handleMouseDown as EventListener);
    viewer.addEventListener('click', handleClick as EventListener);
    return () => {
      viewer.removeEventListener('mousedown', handleMouseDown as EventListener);
      viewer.removeEventListener('click', handleClick as EventListener);
    };
  }, [onSurfaceClick]);

  // Ensure src is an absolute URL so native AR apps (SceneViewer/QuickLook) can download it
  const toAbsolute = (url: string) =>
    mounted && typeof window !== 'undefined' && url.startsWith('/')
      ? `${window.location.origin}${url}`
      : url;

  const absoluteSrc = toAbsolute(src);
  const absoluteIosSrc = iosSrc ? toAbsolute(iosSrc) : undefined;
  const fileNameDisplay = src ? src.split('/').pop()?.split('?')[0] || '3D Asset' : '3D Asset';

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <model-viewer
        ref={viewerRef}
        src={absoluteSrc}
        alt="3D Model"
        ar={ar || undefined}
        ar-modes={ar ? 'quick-look scene-viewer webxr' : undefined}
        ar-placement="floor"
        ar-scale={ar ? 'auto' : undefined}
        ios-src={absoluteIosSrc}
        camera-orbit={cameraOrbit}
        camera-target={cameraTarget}
        camera-controls={interactive || undefined}
        auto-rotate={autoRotate || undefined}
        shadow-intensity="1"
        style={{ width: '100%', height: '100%' }}
      >
        {children}
      </model-viewer>

      {/* Modern 3D Asset Loading Screen with Percentage */}
      {(isLoading || !src) && (
        <div className="absolute inset-0 bg-gray-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 z-30 transition-opacity duration-300">
          <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-8 max-w-sm w-full text-center space-y-5 shadow-2xl">
            {/* Pulsing 3D Cube Icon */}
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-blue-500/20 animate-ping border border-blue-500/30" />
              <div className="w-14 h-14 bg-blue-600/20 border border-blue-500/40 rounded-2xl flex items-center justify-center text-3xl text-blue-400 shadow-inner">
                📦
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-1">Loading 3D Model</h3>
              <p className="text-xs text-gray-400 font-mono truncate max-w-xs mx-auto">
                {fileNameDisplay}
              </p>
            </div>

            {/* Percentage & Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono font-semibold">
                <span className="text-gray-400">Downloading Asset</span>
                <span className="text-blue-400 text-sm font-bold">{loadProgress}%</span>
              </div>

              {/* Progress Bar Track */}
              <div className="w-full bg-gray-950 border border-gray-800 rounded-full h-3 overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-200 shadow-sm shadow-blue-500/50"
                  style={{ width: `${Math.max(loadProgress, 6)}%` }}
                />
              </div>
            </div>

            <div className="text-[11px] text-gray-500 font-mono flex items-center justify-center gap-1.5 pt-1">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
              <span>Parsing WebGL Textures & Geometry</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Overlay if download fails */}
      {loadError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-900/90 border border-red-700 text-white px-4 py-2 rounded-xl text-xs font-mono shadow-xl z-30">
          ⚠️ {loadError}
        </div>
      )}
    </div>
  );
}
