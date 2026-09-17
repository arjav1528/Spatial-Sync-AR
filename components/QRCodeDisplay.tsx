'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
  sessionId: string;
}

export default function QRCodeDisplay({ sessionId }: QRCodeDisplayProps) {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const relativeUrl = `/session/${sessionId}?role=viewer`;
  const fullUrl = mounted && typeof window !== 'undefined'
    ? `${window.location.origin}${relativeUrl}`
    : relativeUrl;

  const handleCopy = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col items-center">
      <div className="bg-white p-3 rounded-lg shadow-inner flex items-center justify-center">
        <QRCodeSVG
          value={fullUrl}
          size={180}
          bgColor="#ffffff"
          fgColor="#090d16"
          level="M"
        />
      </div>

      <div className="w-full mt-3 flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono">
        <span className="text-zinc-400 truncate flex-1">{mounted ? fullUrl : 'Loading...'}</span>
        <button
          onClick={handleCopy}
          className="bg-white text-zinc-950 hover:bg-zinc-200 font-sans font-semibold px-2 py-0.5 rounded transition-colors shrink-0"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
