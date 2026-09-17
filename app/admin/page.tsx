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
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-3.5 py-1 mb-3">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs font-mono text-blue-400 uppercase tracking-wider font-semibold">
              Sales Rep Portal • S3 Assets Live
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-2">3D Asset & Session Portal</h1>
          <p className="text-gray-400 text-sm">
            Select a pre-uploaded 3D product model from S3 to launch a live multi-device AR pitch, or upload new .glb models.
          </p>
        </div>

        {/* Pre-Uploaded Models Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>📦</span> Available S3 3D Models
            </h2>
            <span className="text-xs text-gray-400 font-mono">
              {PREUPLOADED_MODELS.length} Pre-Uploaded Assets Ready
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PREUPLOADED_MODELS.map((model) => (
              <div
                key={model.key}
                className="bg-gray-900/90 border border-gray-800 hover:border-gray-700 rounded-2xl p-6 flex flex-col justify-between transition-all shadow-xl relative group overflow-hidden"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-gray-800 border border-gray-700 rounded-xl flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                    {model.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20 uppercase">
                        {model.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white">{model.name}</h3>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{model.description}</p>
                    <p className="text-[11px] font-mono text-gray-500 truncate mt-2 font-semibold">
                      S3 Key: <span className="text-gray-400">{model.key}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-gray-800/80">
                  <Link
                    href={`/admin/annotate?assetKey=${encodeURIComponent(model.key)}`}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 py-2.5 px-3 rounded-xl text-xs font-semibold transition-colors text-center border border-gray-700 flex items-center justify-center gap-1.5"
                  >
                    <span>📌</span> Edit Pins
                  </Link>

                  <button
                    onClick={() => startSession(model.key)}
                    disabled={creatingSession !== null}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white py-2.5 px-3 rounded-xl text-xs font-semibold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <span>🚀</span> {creatingSession === model.key ? 'Starting...' : 'Start Session'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Upload Custom Model Section */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span>☁️</span> Upload New Custom 3D Model (.glb / .usdz)
          </h2>
          <FileDropzone onUploadComplete={handleUploadComplete} />
        </section>

        {/* Custom Uploaded Assets List */}
        {uploadedAssets.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-semibold mb-4 text-emerald-400">Recently Uploaded Custom Assets</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {uploadedAssets.map((asset, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <p className="font-medium text-lg truncate">{asset.name}</p>
                    <p className="text-xs text-gray-500 font-mono truncate mt-1">{asset.key}</p>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/admin/annotate?assetKey=${encodeURIComponent(asset.key)}&assetUrl=${encodeURIComponent(asset.url)}`}
                      className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 py-2.5 rounded-lg text-xs font-medium transition-colors text-center border border-gray-700"
                    >
                      Edit Annotations
                    </Link>
                    <button
                      onClick={() => startSession(asset.key)}
                      disabled={creatingSession !== null}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
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
