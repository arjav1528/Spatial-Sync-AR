import { NextResponse } from 'next/server';
import { PREUPLOADED_MODELS, getS3AssetUrl } from '@/lib/aws-config';

export async function GET() {
  try {
    const modelsWithUrls = await Promise.all(
      PREUPLOADED_MODELS.map(async (m) => ({
        ...m,
        presignedUrl: await getS3AssetUrl(m.key),
      }))
    );
    return NextResponse.json({ models: modelsWithUrls });
  } catch (error) {
    console.error('Failed to fetch models list:', error);
    return NextResponse.json({ error: 'Failed to load models' }, { status: 500 });
  }
}
