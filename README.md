# 🏗️ SpatialSync AR

**Multi-Device Spatial Sync & Spatial Analytics Platform for B2B Physical Products**

## Tech Stack
- **Frontend:** Next.js 14 (App Router), React 18, TailwindCSS
- **3D/AR:** `@google/model-viewer` + WebXR API
- **Real-time:** AWS API Gateway WebSocket + Lambda
- **Database:** Amazon DynamoDB (On-Demand)
- **Storage:** AWS S3 + CloudFront
- **Auth:** NextAuth.js (JWT)

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your AWS credentials and endpoints

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure
```
/app          - Next.js App Router pages and API routes
/components   - Reusable React components
/lib          - Utilities, AWS config, stores, hooks
/serverless   - Lambda handler code for API Gateway WebSocket
```

## Features
- 🔄 **Multi-Device Spatial Sync** — Real-time AR model synchronization across devices
- 📊 **Spatial Analytics** — Gaze tracking heatmaps and engagement metrics
- 📦 **Asset Pipeline** — Direct-to-S3 upload for .glb/.usdz 3D assets
- 🔐 **Role-Based Auth** — Host, Admin, and Viewer roles

## License
Private — Hackathon Project
