'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ModelViewerWrapper from '@/components/ModelViewerWrapper';
import HotspotMarker, { Hotspot } from '@/components/HotspotMarker';
import AnnotationPanel from '@/components/AnnotationPanel';

interface StoredHotspot extends Hotspot {
  modelId: string;
  category: string;
  order: number;
}

interface PendingHit {
  position: { x: number; y: number; z: number };
  normal: { x: number; y: number; z: number };
}

interface FormState {
  label: string;
  title: string;
  description: string;
  category: string;
  order: number;
  cameraOrbit: string;
  cameraTarget: string;
}

function fmt3(n: number) { return n.toFixed(4); }

function hitToStrings(hit: PendingHit) {
  const p = hit.position;
  const n = hit.normal;
  return {
    position: `${fmt3(p.x)} ${fmt3(p.y)} ${fmt3(p.z)}`,
    normal: `${fmt3(n.x)} ${fmt3(n.y)} ${fmt3(n.z)}`,
    cameraTarget: `${p.x.toFixed(3)}m ${p.y.toFixed(3)}m ${p.z.toFixed(3)}m`,
  };
}

function AnnotatePageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const assetKey = searchParams.get('assetKey') || 'assets/HospitalBed.glb';
  const paramAssetUrl = searchParams.get('assetUrl');
  const modelId = assetKey.split('/').pop()?.replace(/\.[^.]+$/, '') || 'HospitalBed';
  const [resolvedModelUrl, setResolvedModelUrl] = useState<string>(paramAssetUrl || '');

  useEffect(() => {
    if (!paramAssetUrl && assetKey) {
      fetch('/api/models')
        .then(r => r.json())
        .then(data => {
          const matched = (data.models || []).find((m: { key: string; presignedUrl: string }) => m.key === assetKey);
          if (matched?.presignedUrl) setResolvedModelUrl(matched.presignedUrl);
        })
        .catch(() => {});
    }
  }, [assetKey, paramAssetUrl]);

  const [hotspots, setHotspots] = useState<StoredHotspot[]>([]);
  const [selectedHotspot, setSelectedHotspot] = useState<StoredHotspot | null>(null);
  const [pendingHit, setPendingHit] = useState<PendingHit | null>(null);
  const [editingHotspot, setEditingHotspot] = useState<StoredHotspot | null>(null);
  const [isEditMode, setIsEditMode] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cameraOrbit, setCameraOrbit] = useState('0deg 75deg 2.5m');
  const [cameraTarget, setCameraTarget] = useState<string | undefined>(undefined);
  const [formData, setFormData] = useState<FormState>({
    label: '',
    title: '',
    description: '',
    category: '',
    order: 0,
    cameraOrbit: '0deg 75deg 0.8m',
    cameraTarget: '0m 0m 0m',
  });

  const isFormOpen = pendingHit !== null || editingHotspot !== null;

  // Load existing hotspots
  useEffect(() => {
    fetch(`/api/hotspots?modelId=${encodeURIComponent(modelId)}`)
      .then(r => r.json())
      .then(data => setHotspots(data.hotspots || []))
      .catch(() => {});
  }, [modelId]);

  const openNewForm = useCallback((hit: PendingHit) => {
    const strings = hitToStrings(hit);
    setPendingHit(hit);
    setEditingHotspot(null);
    setFormData({
      label: '',
      title: '',
      description: '',
      category: '',
      order: hotspots.length,
      cameraOrbit: '0deg 75deg 0.8m',
      cameraTarget: strings.cameraTarget,
    });
  }, [hotspots.length]);

  const openEditForm = useCallback((hotspot: StoredHotspot) => {
    setEditingHotspot(hotspot);
    setPendingHit(null);
    setSelectedHotspot(null);
    setFormData({
      label: hotspot.label,
      title: hotspot.title,
      description: hotspot.description,
      category: hotspot.category || '',
      order: hotspot.order ?? 0,
      cameraOrbit: hotspot.cameraOrbit,
      cameraTarget: hotspot.cameraTarget,
    });
  }, []);

  const handleClose = () => {
    setPendingHit(null);
    setEditingHotspot(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingHotspot) {
        const res = await fetch('/api/hotspots', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            modelId,
            id: editingHotspot.id,
            label: formData.label || 'Hotspot',
            title: formData.title || formData.label || 'Hotspot',
            description: formData.description,
            category: formData.category,
            order: formData.order,
            position: editingHotspot.position,
            normal: editingHotspot.normal,
            cameraOrbit: formData.cameraOrbit,
            cameraTarget: formData.cameraTarget,
            specs: editingHotspot.specs,
          }),
        });
        if (res.ok) {
          const { hotspot } = await res.json();
          setHotspots(prev => prev.map(h => h.id === hotspot.id ? hotspot : h));
        }
      } else if (pendingHit) {
        const strings = hitToStrings(pendingHit);
        const res = await fetch('/api/hotspots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            modelId,
            label: formData.label || 'Hotspot',
            title: formData.title || formData.label || 'Hotspot',
            description: formData.description,
            category: formData.category,
            order: formData.order,
            position: strings.position,
            normal: strings.normal,
            cameraOrbit: formData.cameraOrbit,
            cameraTarget: formData.cameraTarget,
          }),
        });
        if (res.ok) {
          const { hotspot } = await res.json();
          setHotspots(prev => [...prev, hotspot].sort((a, b) => a.order - b.order));
        }
      }
    } finally {
      setSaving(false);
      handleClose();
    }
  };

  const handleDelete = async () => {
    if (!editingHotspot) return;
    setSaving(true);
    try {
      await fetch(`/api/hotspots?modelId=${encodeURIComponent(modelId)}&id=${editingHotspot.id}`, {
        method: 'DELETE',
      });
      setHotspots(prev => prev.filter(h => h.id !== editingHotspot.id));
      handleClose();
    } finally {
      setSaving(false);
    }
  };

  const handleHotspotClick = useCallback((hotspot: StoredHotspot) => {
    if (isEditMode) {
      openEditForm(hotspot);
    } else {
      setSelectedHotspot(prev => prev?.id === hotspot.id ? null : hotspot);
      setCameraOrbit(hotspot.cameraOrbit);
      setCameraTarget(hotspot.cameraTarget);
    }
  }, [isEditMode, openEditForm]);

  const pendingPosition = pendingHit ? hitToStrings(pendingHit).position : null;
  const pendingNormal = pendingHit ? hitToStrings(pendingHit).normal : null;

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white select-none overflow-hidden">
      {/* Header */}
      <header className="h-14 bg-gray-900/90 backdrop-blur border-b border-gray-800 px-5 flex items-center justify-between z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin')}
            className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-1.5"
          >
            ← Admin
          </button>
          <div className="h-4 w-px bg-gray-800" />
          <span className="text-sm font-semibold text-white">Annotation Editor</span>
          <span className="text-xs font-mono text-gray-500 bg-gray-900 border border-gray-800 px-2 py-0.5 rounded">{assetKey.split('/').pop()}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{hotspots.length} hotspot{hotspots.length !== 1 ? 's' : ''}</span>
          {/* Edit / Preview toggle */}
          <div className="flex items-center bg-gray-950 border border-gray-800 rounded-lg p-0.5 text-xs font-medium">
            <button
              onClick={() => { setIsEditMode(true); setSelectedHotspot(null); }}
              className={`px-3 py-1.5 rounded-md transition-colors ${isEditMode ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Edit Mode
            </button>
            <button
              onClick={() => { setIsEditMode(false); handleClose(); }}
              className={`px-3 py-1.5 rounded-md transition-colors ${!isEditMode ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Preview
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 3D Viewport */}
        <div className="flex-1 relative bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
          <ModelViewerWrapper
            src={resolvedModelUrl}
            ar={false}
            cameraOrbit={cameraOrbit}
            cameraTarget={cameraTarget}
            onCameraChange={(orbit) => setCameraOrbit(orbit)}
            onSurfaceClick={isEditMode && !isFormOpen ? openNewForm : undefined}
            interactive={true}
          >
            {/* Existing hotspot markers */}
            {hotspots.map(hotspot => (
              <HotspotMarker
                key={hotspot.id}
                hotspot={hotspot}
                selected={
                  isEditMode
                    ? editingHotspot?.id === hotspot.id
                    : selectedHotspot?.id === hotspot.id
                }
                onClick={() => handleHotspotClick(hotspot)}
              />
            ))}

            {/* Pending pin (awaiting form submission) */}
            {pendingHit && pendingPosition && pendingNormal && (
              <button
                slot="hotspot-pending"
                data-position={pendingPosition}
                data-normal={pendingNormal}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'default',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: '#f59e0b',
                  border: '2px solid #fcd34d',
                  boxShadow: '0 0 0 4px rgba(245,158,11,0.25), 0 0 12px rgba(245,158,11,0.5)',
                  animation: 'ping 1s cubic-bezier(0,0,0.2,1) infinite',
                }} />
                <div style={{
                  background: 'rgba(3,7,18,0.9)',
                  border: '1px solid rgba(245,158,11,0.45)',
                  borderRadius: '9999px',
                  padding: '2px 8px',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#fcd34d',
                  whiteSpace: 'nowrap',
                }}>
                  New Pin
                </div>
              </button>
            )}
          </ModelViewerWrapper>

          {/* Edit mode hint */}
          {isEditMode && !isFormOpen && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur border border-gray-700 rounded-full px-4 py-2 text-xs text-gray-300 pointer-events-none flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              Click anywhere on the model to place a hotspot pin
            </div>
          )}

          {/* Preview annotation panel */}
          {!isEditMode && selectedHotspot && (
            <AnnotationPanel
              hotspot={selectedHotspot}
              onClose={() => { setSelectedHotspot(null); setCameraTarget(undefined); }}
            />
          )}
        </div>

        {/* Sidebar */}
        <aside className="w-72 bg-gray-900/95 border-l border-gray-800 flex flex-col z-10">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-sm font-bold">Hotspots</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {isEditMode ? 'Click the model to add. Click a pin to edit.' : 'Click a pin to view its details.'}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {hotspots.length === 0 ? (
              <div className="text-center py-10 text-xs text-gray-600">
                No hotspots yet.<br />Click on the 3D model to place your first pin.
              </div>
            ) : (
              hotspots.map(hotspot => (
                <button
                  key={hotspot.id}
                  onClick={() => handleHotspotClick(hotspot)}
                  className={`w-full text-left p-3 rounded-xl border transition-all text-xs ${
                    (isEditMode ? editingHotspot?.id : selectedHotspot?.id) === hotspot.id
                      ? 'bg-blue-500/10 border-blue-500/40 text-white'
                      : 'bg-gray-950 border-gray-800 text-gray-300 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                    <span className="font-semibold truncate">{hotspot.label}</span>
                    {hotspot.category && (
                      <span className="ml-auto text-[10px] text-gray-500 bg-gray-800 px-1.5 rounded flex-shrink-0">{hotspot.category}</span>
                    )}
                  </div>
                  <p className="text-gray-500 text-[11px] truncate pl-3.5">{hotspot.title}</p>
                </button>
              ))
            )}
          </div>
        </aside>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <div>
                <h3 className="text-sm font-bold text-white">
                  {editingHotspot ? 'Edit Hotspot' : 'New Hotspot'}
                </h3>
                {pendingHit && (
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                    ({hitToStrings(pendingHit).position})
                  </p>
                )}
              </div>
              <button onClick={handleClose} className="text-gray-500 hover:text-white text-lg leading-none">✕</button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                    Label <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Helmet"
                    value={formData.label}
                    onChange={e => setFormData(p => ({ ...p, label: e.target.value }))}
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Safety"
                    value={formData.category}
                    onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Full component name"
                  value={formData.title}
                  onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe this component..."
                  value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Display Order</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={e => setFormData(p => ({ ...p, order: Number(e.target.value) }))}
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Camera Orbit</label>
                  <input
                    type="text"
                    value={formData.cameraOrbit}
                    onChange={e => setFormData(p => ({ ...p, cameraOrbit: e.target.value }))}
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 px-5 py-4 border-t border-gray-800">
              {editingHotspot && (
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/10 transition-colors disabled:opacity-50"
                >
                  Delete
                </button>
              )}
              <div className="flex-1" />
              <button
                onClick={handleClose}
                className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.label.trim()}
                className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingHotspot ? 'Update' : 'Save Hotspot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnnotatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400 text-sm">Loading editor...</div>}>
      <AnnotatePageInner />
    </Suspense>
  );
}
