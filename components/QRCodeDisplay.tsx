'use client';

import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
  sessionId: string;
}

export default function QRCodeDisplay({ sessionId }: QRCodeDisplayProps) {
  const sessionUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/session/${sessionId}?role=viewer`
    : `/session/${sessionId}?role=viewer`;

  return (
    <div className="bg-white rounded-lg p-4 flex flex-col items-center">
      <QRCodeSVG
        value={sessionUrl}
        size={200}
        bgColor="#ffffff"
        fgColor="#000000"
        level="M"
      />
      <p className="text-gray-800 text-xs mt-3 font-mono">{sessionUrl}</p>
    </div>
  );
}
