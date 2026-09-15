const { S3Client, HeadBucketCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const REGION = process.env.AWS_REGION || 'eu-central-1';
const S3_BUCKET = process.env.S3_BUCKET_NAME || 'spatial-sync-arjav';
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'spatial-sync-arjav';
const WS_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'wss://notts6p9cc.execute-api.eu-central-1.amazonaws.com/dev';

console.log('--------------------------------------------------');
console.log('🚀 SPATIALSYNC AR — AWS HEALTHCHECK & HANDSHAKE TEST');
console.log('--------------------------------------------------');
console.log(`Region:           ${REGION}`);
console.log(`S3 Bucket:        ${S3_BUCKET}`);
console.log(`DynamoDB Table:   ${TABLE_NAME}`);
console.log(`WebSocket URL:    ${WS_URL}`);
console.log('--------------------------------------------------\n');

async function runHealthCheck() {
  let passed = 0;
  let failed = 0;

  // TEST 1: S3 Connection
  console.log('1️⃣  Testing S3 Bucket Access...');
  try {
    const s3 = new S3Client({ region: REGION });
    await s3.send(new HeadBucketCommand({ Bucket: S3_BUCKET }));
    console.log('   ✅ S3 Connection SUCCESSFUL! Bucket exists and is accessible.\n');
    passed++;
  } catch (err) {
    console.error(`   ❌ S3 Error: ${err.message}\n`);
    failed++;
  }

  // TEST 2: DynamoDB Connection & Table Schema
  console.log('2️⃣  Testing DynamoDB Table Access & GSI1 Index...');
  try {
    const dbRaw = new DynamoDBClient({ region: REGION });
    const db = DynamoDBDocumentClient.from(dbRaw);

    const tableMeta = await dbRaw.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
    const status = tableMeta.Table.TableStatus;
    const gsiCount = tableMeta.Table.GlobalSecondaryIndexes?.length || 0;

    console.log(`   Table Status: ${status}`);
    console.log(`   GSI Count:    ${gsiCount}`);

    // Test a write & read
    const testId = `HEALTHCHECK#${Date.now()}`;
    await db.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: { PK: testId, SK: 'TEST', message: 'handshake' },
    }));

    const readBack = await db.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: testId, SK: 'TEST' },
    }));

    // Cleanup
    await db.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: testId, SK: 'TEST' },
    }));

    if (readBack.Item && readBack.Item.message === 'handshake') {
      console.log('   ✅ DynamoDB Read/Write & Table Schema SUCCESSFUL!\n');
      passed++;
    } else {
      throw new Error('DynamoDB read-back mismatch');
    }
  } catch (err) {
    console.error(`   ❌ DynamoDB Error: ${err.message}\n`);
    failed++;
  }

  // TEST 3: WebSocket API Gateway & Lambda Connection
  console.log('3️⃣  Testing WebSocket Connection ($connect & SYNC_CAMERA route)...');
  try {
    const wsUrlWithParams = `${WS_URL}?sessionId=HEALTHCHECK_SESSION&role=host`;
    const ws = new WebSocket(wsUrlWithParams);

    const wsPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('WebSocket connection timed out (10s)'));
      }, 10000);

      ws.onopen = () => {
        console.log('   Connected to WebSocket API Gateway!');
        // Send a SYNC_CAMERA payload
        ws.send(JSON.stringify({
          action: 'SYNC_CAMERA',
          sessionId: 'HEALTHCHECK_SESSION',
          data: { cameraOrbit: '45deg 60deg 3.0m' },
        }));

        setTimeout(() => {
          clearTimeout(timeout);
          ws.close();
          resolve(true);
        }, 1000);
      };

      ws.onerror = (err) => {
        clearTimeout(timeout);
        reject(err);
      };
    });

    await wsPromise;
    console.log('   ✅ WebSocket Handshake & Broadcast SUCCESSFUL!\n');
    passed++;
  } catch (err) {
    console.error(`   ❌ WebSocket Error: ${err.message}\n`);
    failed++;
  }

  // SUMMARY
  console.log('--------------------------------------------------');
  console.log(`SUMMARY: ${passed}/3 Tests Passed | ${failed} Failed`);
  console.log('--------------------------------------------------');
  process.exit(failed > 0 ? 1 : 0);
}

runHealthCheck();
