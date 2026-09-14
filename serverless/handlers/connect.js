const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME || 'SpatialSync_Prod';

exports.handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
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

    console.log(`Connected: ${connectionId} to session ${sessionId}`);
    return { statusCode: 200, body: 'Connected' };
  } catch (error) {
    console.error('Connect error:', error);
    return { statusCode: 500, body: 'Failed to connect' };
  }
};
