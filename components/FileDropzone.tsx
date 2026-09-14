'use client';

import { useState, useCallback } from 'react';

interface FileDropzoneProps {
  onUploadComplete: (asset: { name: string; key: string; url: string }) => void;
}

export default function FileDropzone({ onUploadComplete }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleFile = useCallback(async (file: File) => {
    setError('');
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['glb', 'usdz'].includes(ext)) {
      setError('Only .glb and .usdz files are allowed');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be under 50MB');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Step 1: Get presigned URL
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type || 'application/octet-stream',
          fileSize: file.size,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to get upload URL');
      }

      const { uploadUrl, assetKey, publicUrl } = await res.json();

      // Step 2: Upload directly to S3
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      await new Promise<void>((resolve, reject) => {
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.onload = () => (xhr.status < 400 ? resolve() : reject(new Error('Upload failed')));
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.send(file);
      });

      onUploadComplete({ name: file.name, key: assetKey, url: publicUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [onUploadComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
        isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-600'
      }`}
    >
      {uploading ? (
        <div>
          <p className="text-lg mb-4">Uploading...</p>
          <div className="w-full bg-gray-800 rounded-full h-3">
            <div className="bg-blue-600 h-3 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm text-gray-400 mt-2">{progress}%</p>
        </div>
      ) : (
        <div>
          <p className="text-lg mb-2">Drag & drop your 3D asset here</p>
          <p className="text-sm text-gray-500 mb-4">Supports .glb and .usdz (max 50MB)</p>
          <label className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg cursor-pointer transition-colors">
            Browse Files
            <input type="file" accept=".glb,.usdz" onChange={handleInputChange} className="hidden" />
          </label>
        </div>
      )}
      {error && <p className="text-red-400 mt-4">{error}</p>}
    </div>
  );
}
