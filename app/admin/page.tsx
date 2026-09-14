'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FileDropzone from '@/components/FileDropzone';
import Navbar from '@/components/Navbar';

interface UploadedAsset {
  name: string;
  key: string;
  url: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [uploadedAssets, setUploadedAssets] = useState<UploadedAsset[]>([]);
  const [creatingSession, setCreatingSession] = useState(false);

  const handleUploadComplete = (asset: UploadedAsset) => {
    setUploadedAssets((prev) => [...prev, asset]);
  };

  const startSession = async (assetKey: string) => {
    setCreatingSession(true);
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetKey, hostName: 'Sales Rep' }),
      });
      const data = await res.json();
      if (data.sessionId) {
        router.push(`/session/${data.sessionId}`);
      } else {
        alert('Failed to create session');
      }
    } catch (err) {
      console.error('Failed to create session:', err);
      alert('Error creating session');
    } finally {
      setCreatingSession(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Asset Upload Portal</h1>
            <p className="text-gray-400">Upload .glb and .usdz 3D assets for live AR pitches.</p>
          </div>

          <button
            onClick={() => startSession('models/demo.glb')}
            disabled={creatingSession}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
          >
            <span>🚀</span> Start Demo Session
          </button>
        </div>

        <FileDropzone onUploadComplete={handleUploadComplete} />

        {uploadedAssets.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-4">Uploaded Assets</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {uploadedAssets.map((asset, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-5 flex flex-col justify-between">
                  <div>
                    <p className="font-medium text-lg truncate">{asset.name}</p>
                    <p className="text-xs text-gray-500 font-mono truncate mt-1">{asset.key}</p>
                  </div>

                  <button
                    onClick={() => startSession(asset.key)}
                    disabled={creatingSession}
                    className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {creatingSession ? 'Creating Session...' : 'Start Live Session'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
