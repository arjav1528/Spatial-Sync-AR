import { NextRequest, NextResponse } from 'next/server';
import { PutCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME, getS3AssetUrl, DEFAULT_ASSET_KEY } from '@/lib/aws-config';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const { assetKey, hostName } = await request.json();
    const sessionId = uuidv4().slice(0, 6).toUpperCase();
    const targetAssetKey = assetKey || DEFAULT_ASSET_KEY;

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `SESSION#${sessionId}`,
        SK: 'META',
        sessionId,
        assetKey: targetAssetKey,
        hostName: hostName || 'Sales Rep',
        createdAt: new Date().toISOString(),
        status: 'active',
      },
    }));

    return NextResponse.json({ sessionId, assetKey: targetAssetKey });
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Get session metadata
    const meta = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `SESSION#${sessionId}`, SK: 'META' },
    }));

    // Get current state (for reconnect)
    const state = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `SESSION#${sessionId}`, SK: 'STATE#current' },
    }));

    // Get connected viewers count
    const connections = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `SESSION#${sessionId}`,
        ':sk': 'CONN#',
      },
      Select: 'COUNT',
    }));

    const assetKey = meta.Item?.assetKey || DEFAULT_ASSET_KEY;
    const assetUrl = await getS3AssetUrl(assetKey);

    return NextResponse.json({
      session: meta.Item ? { ...meta.Item, assetUrl } : null,
      currentState: state.Item || null,
      viewerCount: connections.Count || 0,
      assetUrl,
    });
  } catch (error) {
    console.error('Session retrieval error:', error);
    return NextResponse.json({ error: 'Failed to get session' }, { status: 500 });
  }
}
