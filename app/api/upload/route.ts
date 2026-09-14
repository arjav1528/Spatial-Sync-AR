import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_BUCKET } from '@/lib/aws-config';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_TYPES = ['model/gltf-binary', 'model/vnd.usdz+zip', 'application/octet-stream'];
const MAX_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: NextRequest) {
  try {
    const { fileName, fileType, fileSize } = await request.json();

    if (!fileName || !fileType) {
      return NextResponse.json({ error: 'fileName and fileType are required' }, { status: 400 });
    }

    // Validate file extension
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (!ext || !['glb', 'usdz'].includes(ext)) {
      return NextResponse.json({ error: 'Only .glb and .usdz files are allowed' }, { status: 400 });
    }

    // Validate file size
    if (fileSize && fileSize > MAX_SIZE) {
      return NextResponse.json({ error: 'File size must be under 50MB' }, { status: 400 });
    }

    const assetKey = `assets/${uuidv4()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: assetKey,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 }); // 15 min

    return NextResponse.json({
      uploadUrl,
      assetKey,
      publicUrl: `https://${S3_BUCKET}.s3.amazonaws.com/${assetKey}`,
    });
  } catch (error) {
    console.error('Upload URL generation error:', error);
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
  }
}
