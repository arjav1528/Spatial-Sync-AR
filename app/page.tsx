import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <span className="text-sm text-blue-400">
              Multiplayer AR for Enterprise
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            <span className="text-blue-500">Spatial</span>Sync
            <span className="text-gray-500 ml-3 text-3xl md:text-5xl">AR</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
            Transform B2B 3D product demos into{" "}
            <span className="text-white font-medium">
              live, multi-device spatial experiences
            </span>
            . Let your buying committee walk around a full-scale hologram
            together — no app download required.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/admin"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-medium text-lg transition-colors shadow-lg shadow-blue-600/25"
            >
              Upload 3D Asset
            </Link>
            <Link
              href="/auth/signin"
              className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-xl font-medium text-lg transition-colors border border-gray-700"
            >
              Sign In as Host
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
            <div className="text-3xl mb-4">🔄</div>
            <h3 className="text-lg font-semibold mb-2">
              Multi-Device Spatial Sync
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Host controls a 3D model on desktop while up to 25 viewers see
              synchronized AR on their phones. Real-time WebSocket sync at
              &lt;100ms latency.
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-lg font-semibold mb-2">
              Spatial Analytics
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Track which parts of your 3D model buyers physically inspect.
              Gaze vectors and proximity data generate engagement heatmaps
              post-session.
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
            <div className="text-3xl mb-4">☁️</div>
            <h3 className="text-lg font-semibold mb-2">
              Fully Serverless
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Built on AWS Lambda, API Gateway WebSocket, DynamoDB, and S3.
              Zero cost when idle, infinite scale when live. No servers to
              manage.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl font-bold mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Upload Asset",
                desc: "Admin uploads .glb or .usdz 3D file directly to S3",
              },
              {
                step: "2",
                title: "Start Session",
                desc: "Host creates a live session and shares QR code",
              },
              {
                step: "3",
                title: "Scan & Join",
                desc: "Buyers scan QR code — instant AR in mobile browser",
              },
              {
                step: "4",
                title: "Analyze",
                desc: "Review spatial engagement heatmaps post-session",
              },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-xl font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-24 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-gray-500">
          SpatialSync AR — Hackathon Project • AWS Serverless + Next.js +
          WebXR
        </div>
      </footer>
    </div>
  );
}
