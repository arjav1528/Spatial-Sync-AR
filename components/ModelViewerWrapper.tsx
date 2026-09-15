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

  useEffect(() => {
    setMounted(true);
    import('@google/model-viewer');
  }, []);

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

    const handleMouseDown = (e: MouseEvent) => { downX = e.offsetX; downY = e.offsetY; };

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

  return (
    <model-viewer
      ref={viewerRef}
      src={absoluteSrc}
      alt="3D Model"
      ar={ar || undefined}
      ar-modes={ar ? 'webxr scene-viewer quick-look' : undefined}
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
  );
}
