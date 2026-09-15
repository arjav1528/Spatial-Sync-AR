import { NextRequest, NextResponse } from 'next/server';
import { QueryCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '@/lib/aws-config';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('modelId');
    if (!modelId) return NextResponse.json({ error: 'modelId required' }, { status: 400 });

    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `MODEL#${modelId}`,
        ':sk': 'HOTSPOT#',
      },
    }));

    const hotspots = (result.Items || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return NextResponse.json({ hotspots });
  } catch (error) {
    console.error('Hotspots GET error:', error);
    return NextResponse.json({ error: 'Failed to load hotspots' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { modelId, label, title, description, category, order, position, normal, cameraOrbit, cameraTarget } = body;
    if (!modelId || !position) return NextResponse.json({ error: 'modelId and position required' }, { status: 400 });

    const id = uuidv4();
    const item = {
      PK: `MODEL#${modelId}`,
      SK: `HOTSPOT#${id}`,
      id,
      modelId,
      label: label || 'Hotspot',
      title: title || label || 'Hotspot',
      description: description || '',
      category: category || '',
      order: order ?? 0,
      position,
      normal: normal || '0 1 0',
      cameraOrbit: cameraOrbit || '0deg 75deg 0.8m',
      cameraTarget: cameraTarget || '0m 0m 0m',
      specs: {},
      createdAt: new Date().toISOString(),
    };

    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    return NextResponse.json({ hotspot: item }, { status: 201 });
  } catch (error) {
    console.error('Hotspots POST error:', error);
    return NextResponse.json({ error: 'Failed to create hotspot' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { modelId, id, ...fields } = body;
    if (!modelId || !id) return NextResponse.json({ error: 'modelId and id required' }, { status: 400 });

    const item = {
      PK: `MODEL#${modelId}`,
      SK: `HOTSPOT#${id}`,
      id,
      modelId,
      ...fields,
      updatedAt: new Date().toISOString(),
    };

    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    return NextResponse.json({ hotspot: item });
  } catch (error) {
    console.error('Hotspots PUT error:', error);
    return NextResponse.json({ error: 'Failed to update hotspot' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('modelId');
    const id = searchParams.get('id');
    if (!modelId || !id) return NextResponse.json({ error: 'modelId and id required' }, { status: 400 });

    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: `MODEL#${modelId}`, SK: `HOTSPOT#${id}` },
    }));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Hotspots DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete hotspot' }, { status: 500 });
  }
}
