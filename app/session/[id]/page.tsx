import { headers } from 'next/headers';
import HostViewer from './HostViewer';
import MobileViewer from './MobileViewer';

interface SessionPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ role?: string }>;
}

export default async function SessionPage({ params, searchParams }: SessionPageProps) {
  const { id } = await params;
  const { role } = await searchParams;
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';

  // Detect mobile device OR explicit role=viewer query param
  const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isViewerRole = role === 'viewer' || (isMobile && role !== 'host');

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {isViewerRole ? (
        <MobileViewer sessionId={id} />
      ) : (
        <HostViewer sessionId={id} />
      )}
    </div>
  );
}
