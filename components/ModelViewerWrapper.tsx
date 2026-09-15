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
        'camera-orbit'?: string;
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
          'camera-orbit'?: string;
          'camera-controls'?: boolean;
          'auto-rotate'?: boolean;
          'shadow-intensity'?: string;
          style?: React.CSSProperties;
        };
      }
    }
  }
}

interface ModelViewerWrapperProps {
  src: string;
  ar?: boolean;
  cameraOrbit?: string;
  onCameraChange?: (orbit: string) => void;
  interactive?: boolean;
  autoRotate?: boolean;
  children?: React.ReactNode;
}

export default function ModelViewerWrapper({
  src,
  ar = false,
  cameraOrbit = '0deg 75deg 2.5m',
  onCameraChange,
  interactive = true,
  autoRotate = false,
  children,
}: ModelViewerWrapperProps) {
  const viewerRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Dynamically import model-viewer (client-side only)
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

  // Ensure src is an absolute URL so native AR apps (SceneViewer/QuickLook) can download it
  const absoluteSrc = mounted && typeof window !== 'undefined' && src.startsWith('/')
    ? `${window.location.origin}${src}`
    : src;

  return (
    <model-viewer
      ref={viewerRef}
      src={absoluteSrc}
      alt="3D Model"
      ar={ar || undefined}
      ar-modes={ar ? 'scene-viewer quick-look webxr' : undefined}
      ar-placement="floor"
      ar-scale={ar ? 'auto' : undefined}
      camera-orbit={cameraOrbit}
      camera-controls={interactive || undefined}
      auto-rotate={autoRotate || undefined}
      shadow-intensity="1"
      style={{ width: '100%', height: '100%' }}
    >
      {children}
    </model-viewer>
  );
}
