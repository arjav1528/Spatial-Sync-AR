import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';

const REGION = process.env.AWS_REGION || 'eu-central-1';

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

export const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'spatial-sync-arjav';
export const S3_BUCKET = process.env.S3_BUCKET_NAME || 'spatial-sync-arjav';
