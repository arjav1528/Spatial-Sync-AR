const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require('@aws-sdk/client-apigatewaymanagementapi');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME || 'SpatialSync_Prod';

exports.handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const domain = event.requestContext.domainName;
  const stage = event.requestContext.stage;
  const endpoint = `https://${domain}/${stage}`;

  const sessionId = event.queryStringParameters?.sessionId || 'default';
  const role = event.queryStringParameters?.role || 'viewer';

  try {
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `SESSION#${sessionId}`,
        SK: `CONN#${connectionId}`,
        connectionId,
        sessionId,
        role,
        connectedAt: new Date().toISOString(),
      },
    }));

    console.log(`Connected: ${connectionId} to session ${sessionId} as ${role}`);

    // Query active connections for viewer count update
    const connections = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `SESSION#${sessionId}`,
        ':sk': 'CONN#',
      },
    }));

    const viewerList = (connections.Items || []).filter(c => c.role === 'viewer').map(c => c.connectionId);

    const apigw = new ApiGatewayManagementApiClient({ endpoint });
    const payload = JSON.stringify({
      action: 'VIEWER_UPDATE',
      viewers: viewerList,
      count: viewerList.length,
    });

    // Broadcast updated viewer list to all connections in session
    const postCalls = (connections.Items || []).map(async (conn) => {
      try {
        await apigw.send(new PostToConnectionCommand({
          ConnectionId: conn.connectionId,
          Data: payload,
        }));
      } catch (err) {
        console.log(`Post error to ${conn.connectionId}:`, err.message);
      }
    });

    await Promise.all(postCalls);

    return { statusCode: 200, body: 'Connected' };
  } catch (error) {
    console.error('Connect error:', error);
    return { statusCode: 500, body: 'Failed to connect' };
  }
};
