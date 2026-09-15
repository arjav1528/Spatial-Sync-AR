'use client';

import { useEffect, useRef } from 'react';

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
  onArClick?: () => void;
}

export default function ModelViewerWrapper({
  src,
  ar = false,
  cameraOrbit = '0deg 75deg 2.5m',
  onCameraChange,
  interactive = true,
  autoRotate = false,
  onArClick,
}: ModelViewerWrapperProps) {
  const viewerRef = useRef<HTMLElement>(null);

  useEffect(() => {
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

  const handleArButtonClick = () => {
    if (onArClick) {
      onArClick();
    }
    const viewer = viewerRef.current as unknown as { activateAR?: () => void; canActivateAR?: boolean };
    if (viewer && viewer.activateAR) {
      try {
        viewer.activateAR();
      } catch (err) {
        console.log('AR activation:', err);
      }
    }
  };

  return (
    <model-viewer
      ref={viewerRef}
      src={src}
      alt="3D Model"
      ar={ar || undefined}
      ar-modes={ar ? 'webxr scene-viewer quick-look' : undefined}
      ar-scale={ar ? 'auto' : undefined}
      camera-orbit={cameraOrbit}
      camera-controls={interactive || undefined}
      auto-rotate={autoRotate || undefined}
      shadow-intensity="1"
      style={{ width: '100%', height: '100%' }}
    >
      {ar && (
        <button
          slot="ar-button"
          onClick={handleArButtonClick}
          className="hidden"
          id="native-ar-trigger"
        />
      )}
    </model-viewer>
  );
}
