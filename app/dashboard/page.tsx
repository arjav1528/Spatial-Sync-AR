'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ModelViewerWrapper from '@/components/ModelViewerWrapper';
import HeatmapOverlay from '@/components/HeatmapOverlay';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BarChart2, Eye, Gauge, Clock, Search } from 'lucide-react';

interface AnalyticsVector {
  x: number;
  y: number;
  z: number;
  theta: number;
  phi: number;
  timestamp: number;
  userId: string;
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const querySessionId = searchParams.get('sessionId') || searchParams.get('session') || '';

  const [sessionId, setSessionId] = useState(querySessionId);
  const [vectors, setVectors] = useState<AnalyticsVector[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [modelUrl, setModelUrl] = useState('');

  const loadAnalyticsForSession = useCallback(async (targetSessionId: string) => {
    if (!targetSessionId.trim()) return;
    setLoading(true);
    try {
      const [analyticsRes, sessionRes] = await Promise.all([
        fetch(`/api/analytics?sessionId=${targetSessionId}`),
        fetch(`/api/session?id=${targetSessionId}`).catch(() => null),
      ]);

      const analyticsData = await analyticsRes.json();
      setVectors(analyticsData.vectors || []);

      if (sessionRes && sessionRes.ok) {
        const sessionData = await sessionRes.json();
        if (sessionData.assetUrl || sessionData.session?.assetUrl) {
          setModelUrl(sessionData.assetUrl || sessionData.session?.assetUrl);
        } else if (sessionData.session?.assetKey) {
          setModelUrl(
            `https://${process.env.NEXT_PUBLIC_S3_BUCKET || ''}.s3.${
              process.env.NEXT_PUBLIC_AWS_REGION || 'eu-central-1'
            }.amazonaws.com/${sessionData.session.assetKey}`
          );
        }
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (querySessionId) {
      setSessionId(querySessionId);
      loadAnalyticsForSession(querySessionId);
    }
  }, [querySessionId, loadAnalyticsForSession]);

  const handleManualFetch = () => {
    loadAnalyticsForSession(sessionId);
  };

  const avgProximity =
    vectors.length > 0
      ? (vectors.reduce((sum, v) => sum + Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2), 0) / vectors.length).toFixed(2)
      : '0';

  const sessionDuration =
    vectors.length > 1
      ? ((vectors[vectors.length - 1].timestamp - vectors[0].timestamp) / 1000).toFixed(0)
      : '0';

  return (
    <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-blue-500" />
          Analytics
        </h1>
      </div>

      {/* Session Selector Input */}
      <div className="flex gap-3">
        <Input
          type="text"
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          placeholder="Enter Session ID (e.g. A1B2C3)"
          className="font-mono text-sm"
        />
        <Button
          onClick={handleManualFetch}
          disabled={loading}
          className="gap-2"
        >
          <Search className="w-3.5 h-3.5" />
          {loading ? 'Loading...' : 'Load Analytics'}
        </Button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-gray-800 bg-gray-900/90 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center text-blue-400 border border-blue-500/30">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-medium">Total Gaze Points</p>
              <p className="text-2xl font-bold text-white mt-0.5">{vectors.length}</p>
            </div>
          </div>
        </Card>

        <Card className="border-gray-800 bg-gray-900/90 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600/20 rounded-lg flex items-center justify-center text-emerald-400 border border-emerald-500/30">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-medium">Avg. Buyer Proximity</p>
              <p className="text-2xl font-bold text-white mt-0.5">{avgProximity}m</p>
            </div>
          </div>
        </Card>

        <Card className="border-gray-800 bg-gray-900/90 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center text-purple-400 border border-purple-500/30">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-medium">Session Duration</p>
              <p className="text-2xl font-bold text-white mt-0.5">{sessionDuration}s</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Empty State */}
      {hasLoaded && vectors.length === 0 && (
        <Card className="border-gray-800 bg-gray-900/60 p-6 text-center text-xs text-gray-400">
          No gaze data found for session <span className="font-mono text-white">"{sessionId}"</span>.
        </Card>
      )}

      {/* 3D Heatmap Section */}
      {vectors.length > 0 && (
        <Card className="border-gray-800 bg-gray-900/90 p-5 space-y-4">
          <CardHeader className="p-0">
            <CardTitle className="text-base font-bold text-white">3D Engagement Heatmap</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="aspect-video bg-gray-950 rounded-lg overflow-hidden relative border border-gray-800">
              <ModelViewerWrapper src={modelUrl} ar={false} interactive={true} />
              <HeatmapOverlay gazeData={vectors} />
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <Suspense fallback={<div className="p-8 text-center text-xs text-gray-400">Loading Analytics...</div>}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
