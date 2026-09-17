'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import FileDropzone from '@/components/FileDropzone';
import Navbar from '@/components/Navbar';
import { PREUPLOADED_MODELS } from '@/lib/aws-config';

interface UploadedAsset {
  name: string;
  key: string;
  url: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [uploadedAssets, setUploadedAssets] = useState<UploadedAsset[]>([]);
  const [creatingSession, setCreatingSession] = useState<string | null>(null);

  const handleUploadComplete = (asset: UploadedAsset) => {
    setUploadedAssets((prev) => [...prev, asset]);
  };

  const startSession = async (assetKey: string) => {
    setCreatingSession(assetKey);
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
      setCreatingSession(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-10">
        {/* Available Models Section */}
        <section>
          <h1 className="text-2xl font-bold text-white mb-6">Available Models</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PREUPLOADED_MODELS.map((model) => (
              <div
                key={model.key}
                className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col justify-between"
              >
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl">{model.icon}</span>
                  <div>
                    <h3 className="text-base font-bold text-white">{model.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{model.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-gray-800">
                  <Link
                    href={`/admin/annotate?assetKey=${encodeURIComponent(model.key)}`}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 py-2 rounded-lg text-xs font-medium text-center border border-gray-700 transition-colors"
                  >
                    Edit Pins
                  </Link>

                  <button
                    onClick={() => startSession(model.key)}
                    disabled={creatingSession !== null}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {creatingSession === model.key ? 'Starting...' : 'Start Session'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Upload Model Section */}
        <section>
          <h2 className="text-xl font-bold text-white mb-4">Upload Model</h2>
          <FileDropzone onUploadComplete={handleUploadComplete} />
        </section>

        {/* Uploaded Assets */}
        {uploadedAssets.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-white mb-3">Custom Uploaded Models</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {uploadedAssets.map((asset, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <p className="font-medium text-sm truncate">{asset.name}</p>
                    <p className="text-xs text-gray-500 font-mono truncate mt-1">{asset.key}</p>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Link
                      href={`/admin/annotate?assetKey=${encodeURIComponent(asset.key)}&assetUrl=${encodeURIComponent(asset.url)}`}
                      className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 py-2 rounded-lg text-xs font-medium text-center border border-gray-700"
                    >
                      Edit Pins
                    </Link>
                    <button
                      onClick={() => startSession(asset.key)}
                      disabled={creatingSession !== null}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-xs font-medium cursor-pointer"
                    >
                      {creatingSession === asset.key ? 'Creating...' : 'Start Session'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
