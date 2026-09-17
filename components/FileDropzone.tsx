'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { UploadCloud } from 'lucide-react';

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
      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer bg-zinc-900/60 ${
        isDragging ? 'border-white bg-white/5' : 'border-zinc-800 hover:border-zinc-700'
      }`}
    >
      {uploading ? (
        <div className="space-y-3 max-w-xs mx-auto">
          <p className="text-sm font-semibold text-white">Uploading 3D Model...</p>
          <Progress value={progress} />
          <p className="text-xs font-mono text-zinc-400">{progress}%</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto text-white border border-zinc-700">
            <UploadCloud className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Drag & drop your 3D asset here</p>
            <p className="text-xs text-zinc-500 mt-0.5">Supports .glb and .usdz (max 50MB)</p>
          </div>
          <label>
            <Button asChild variant="secondary" size="sm" className="cursor-pointer">
              <span>
                Browse Files
                <input type="file" accept=".glb,.usdz" onChange={handleInputChange} className="hidden" />
              </span>
            </Button>
          </label>
        </div>
      )}
      {error && <p className="text-red-400 text-xs mt-3 font-medium">{error}</p>}
    </div>
  );
}
