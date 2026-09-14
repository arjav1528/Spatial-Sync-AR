const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require('@aws-sdk/client-apigatewaymanagementapi');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME || 'SpatialSync_Prod';

exports.handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const domain = event.requestContext.domainName;
  const stage = event.requestContext.stage;
  const endpoint = `https://${domain}/${stage}`;

  const apigw = new ApiGatewayManagementApiClient({ endpoint });

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { action, sessionId, data } = body;

  if (action === 'SYNC_CAMERA') {
    try {
      // Store the current state for reconnection
      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `SESSION#${sessionId}`,
          SK: 'STATE#current',
          cameraOrbit: data.cameraOrbit,
          updatedAt: new Date().toISOString(),
        },
      }));

      // Get all connections in this session
      const connections = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `SESSION#${sessionId}`,
          ':sk': 'CONN#',
        },
      }));

      const payload = JSON.stringify({
        action: 'SYNC_CAMERA',
        data: { cameraOrbit: data.cameraOrbit },
      });

      // Broadcast to all connections except sender
      const postCalls = (connections.Items || []).map(async (conn) => {
        if (conn.connectionId === connectionId) return; // Skip sender

        try {
          await apigw.send(new PostToConnectionCommand({
            ConnectionId: conn.connectionId,
            Data: payload,
          }));
        } catch (err) {
          if (err.statusCode === 410) {
            // Stale connection, clean up
            console.log(`Stale connection: ${conn.connectionId}`);
          }
        }
      });

      await Promise.all(postCalls);
      return { statusCode: 200, body: 'Broadcast sent' };
    } catch (error) {
      console.error('Broadcast error:', error);
      return { statusCode: 500, body: 'Broadcast failed' };
    }
  }

  return { statusCode: 200, body: 'No action matched' };
};
