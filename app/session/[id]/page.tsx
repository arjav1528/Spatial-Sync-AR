import { headers } from 'next/headers';
import HostViewer from './HostViewer';
import MobileViewer from './MobileViewer';

interface SessionPageProps {
  params: Promise<{ id: string }>;
}

export default async function SessionPage({ params }: SessionPageProps) {
  const { id } = await params;
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';

  // Simple mobile detection
  const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {isMobile ? (
        <MobileViewer sessionId={id} />
      ) : (
        <HostViewer sessionId={id} />
      )}
    </div>
  );
}
