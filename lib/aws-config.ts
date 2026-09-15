import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const REGION = process.env.AWS_REGION || 'eu-central-1';
export const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'spatial-sync-arjav';
export const S3_BUCKET = process.env.S3_BUCKET_NAME || 'spatial-sync-arjav';

const credentials = process.env.AWS_ACCESS_KEY_ID
  ? {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      sessionToken: process.env.AWS_SESSION_TOKEN || undefined,
    }
  : undefined;

const dynamoClient = new DynamoDBClient({ region: REGION, credentials });
export const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const s3Client = new S3Client({ region: REGION, credentials });

export function getS3PublicUrl(assetKey: string): string {
  if (!assetKey) return '/models/demo.glb';
  if (assetKey.startsWith('/') || assetKey.startsWith('http')) return assetKey;
  if (assetKey.includes('models/demo') || assetKey.startsWith('models/')) {
    return `/${assetKey.replace(/^\/+/, '')}`;
  }
  return `https://${S3_BUCKET}.s3.${REGION}.amazonaws.com/${assetKey}`;
}

export async function getS3AssetUrl(assetKey: string): Promise<string> {
  if (!assetKey) return '/models/demo.glb';
  if (assetKey.startsWith('/') || assetKey.startsWith('http')) return assetKey;
  if (assetKey.includes('models/demo') || assetKey.startsWith('models/')) {
    return `/${assetKey.replace(/^\/+/, '')}`;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: assetKey,
    });
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  } catch (err) {
    console.error('Failed to generate presigned GET URL:', err);
    return getS3PublicUrl(assetKey);
  }
}
