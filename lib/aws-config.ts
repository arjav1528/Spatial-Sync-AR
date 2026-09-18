import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const REGION = (process.env.AWS_REGION || 'eu-central-1').trim();
export const TABLE_NAME = (process.env.DYNAMODB_TABLE_NAME || 'spatial-sync-arjav').trim();
export const S3_BUCKET = (process.env.S3_BUCKET_NAME || 'spatial-sync-arjav').trim();

const credentials = process.env.AWS_ACCESS_KEY_ID
  ? {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID.trim(),
      secretAccessKey: (process.env.AWS_SECRET_ACCESS_KEY || '').trim(),
      sessionToken: process.env.AWS_SESSION_TOKEN?.trim() || undefined,
    }
  : undefined;

const dynamoClient = new DynamoDBClient({ region: REGION, credentials });
export const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const s3Client = new S3Client({ region: REGION, credentials });

export const DEFAULT_ASSET_KEY = 'assets/HospitalBed.glb';

export const PREUPLOADED_MODELS = [
  {
    name: 'Hospital Bed',
    key: 'assets/HospitalBed.glb',
    category: 'Healthcare & Medical Devices',
    description: 'Electric ICU hospital bed with multi-position adjustments and side rails.',
    icon: '🛌',
  },
  {
    name: 'MRI Scanner',
    key: 'assets/MRI.glb',
    category: 'Medical Imaging Equipment',
    description: 'Full-scale magnetic resonance imaging diagnostic scanner system.',
    icon: '🏥',
  },
  {
    name: 'Hospital Facility',
    key: 'assets/Hostipal.glb',
    category: 'Architectural & Facilities',
    description: 'Complete 3D architectural floor layout of a modern hospital wing.',
    icon: '🏢',
  },
  {
    name: 'Industrial Drilling Machine',
    key: 'assets/drilling.glb',
    category: 'Industrial & Heavy Equipment',
    description: 'Precision industrial vertical drill press machining equipment.',
    icon: '⚙️',
  },
  {
    name: 'Executive Lounge Sofa',
    key: 'assets/demo.glb',
    category: 'Commercial Furniture',
    description: 'Ergonomic multi-seater commercial reception sofa.',
    icon: '🛋️',
  },
  {
    name: 'Millennium Falcon',
    key: 'assets/Millennium_Falcon.glb',
    category: 'Aerospace & Vehicles',
    description: 'Iconic Star Wars YT-1300 Corellian freighter with detailed hull panels and quad laser cannons.',
    icon: '🚀',
  },
  {
    name: 'Manufacturing Robot',
    key: 'assets/Manufacturing_Robot.glb',
    category: 'Industrial & Heavy Equipment',
    description: 'Multi-axis industrial robotic arm assembly unit for automated manufacturing lines.',
    icon: '🤖',
  },
  {
    name: 'Showspace Drone',
    key: 'assets/Showspace_Drone.glb',
    category: 'Aerospace & Vehicles',
    description: 'DJI Phantom-class quadcopter drone with detailed rotor assembly and camera gimbal.',
    icon: '🛸',
  },
  {
    name: 'Tesla Model 3 (Red)',
    key: 'assets/Tesla3_Red.glb',
    category: 'Automotive',
    description: 'Full-scale Tesla Model 3 in red with detailed interior, wheels, and body panels.',
    icon: '🚗',
  },
];

export function getS3PublicUrl(assetKey: string): string {
  if (!assetKey) return `https://${S3_BUCKET}.s3.${REGION}.amazonaws.com/${DEFAULT_ASSET_KEY}`;
  if (assetKey.startsWith('http')) return assetKey;
  return `https://${S3_BUCKET}.s3.${REGION}.amazonaws.com/${assetKey}`;
}

export async function getS3AssetUrl(assetKey?: string | null): Promise<string> {
  const targetKey = assetKey && !assetKey.startsWith('http') ? assetKey : DEFAULT_ASSET_KEY;

  if (assetKey && assetKey.startsWith('http')) return assetKey;

  try {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: targetKey,
    });
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  } catch (err) {
    console.error('Failed to generate presigned GET URL:', err);
    return getS3PublicUrl(targetKey);
  }
}
