'use client';

import { useState } from 'react';
import FileDropzone from '@/components/FileDropzone';
import Navbar from '@/components/Navbar';

export default function AdminPage() {
  const [uploadedAssets, setUploadedAssets] = useState<{ name: string; key: string; url: string }[]>([]);

  const handleUploadComplete = (asset: { name: string; key: string; url: string }) => {
    setUploadedAssets((prev) => [...prev, asset]);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Asset Upload Portal</h1>
        <p className="text-gray-400 mb-8">Upload .glb and .usdz 3D assets for use in AR sessions.</p>

        <FileDropzone onUploadComplete={handleUploadComplete} />

        {uploadedAssets.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-4">Uploaded Assets</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {uploadedAssets.map((asset, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                  <p className="font-medium truncate">{asset.name}</p>
                  <p className="text-sm text-gray-500 truncate mt-1">{asset.key}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
