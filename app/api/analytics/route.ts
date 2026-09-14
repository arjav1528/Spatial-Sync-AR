import { NextRequest, NextResponse } from 'next/server';
import { BatchWriteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '@/lib/aws-config';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId, vectors } = await request.json();

    if (!sessionId || !vectors || !Array.isArray(vectors)) {
      return NextResponse.json({ error: 'sessionId and vectors array required' }, { status: 400 });
    }

    // Batch write vectors to DynamoDB
    const items = vectors.map((v: { x: number; y: number; z: number; theta: number; phi: number; timestamp: number }) => ({
      PutRequest: {
        Item: {
          PK: `SESSION#${sessionId}`,
          SK: `ANALYTICS#${v.timestamp}`,
          userId: userId || 'anonymous',
          x: v.x,
          y: v.y,
          z: v.z,
          theta: v.theta,
          phi: v.phi,
          timestamp: v.timestamp,
        },
      },
    }));

    // DynamoDB batch write supports max 25 items
    const chunks = [];
    for (let i = 0; i < items.length; i += 25) {
      chunks.push(items.slice(i, i + 25));
    }

    for (const chunk of chunks) {
      await docClient.send(new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: chunk,
        },
      }));
    }

    return NextResponse.json({ success: true, count: vectors.length });
  } catch (error) {
    console.error('Analytics ingestion error:', error);
    return NextResponse.json({ error: 'Failed to save analytics' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
    }

    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `SESSION#${sessionId}`,
        ':sk': 'ANALYTICS#',
      },
    }));

    return NextResponse.json({ vectors: result.Items || [] });
  } catch (error) {
    console.error('Analytics retrieval error:', error);
    return NextResponse.json({ error: 'Failed to retrieve analytics' }, { status: 500 });
  }
}
