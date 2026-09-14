import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';

const REGION = process.env.AWS_REGION || 'ap-south-1';

const dynamoClient = new DynamoDBClient({ region: REGION });
export const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const s3Client = new S3Client({ region: REGION });

export const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'SpatialSync_Prod';
export const S3_BUCKET = process.env.S3_BUCKET_NAME || '';
