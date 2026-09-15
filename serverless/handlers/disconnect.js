const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require('@aws-sdk/client-apigatewaymanagementapi');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME || 'SpatialSync_Prod';

exports.handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const domain = event.requestContext.domainName;
  const stage = event.requestContext.stage;
  const endpoint = `https://${domain}/${stage}`;

  try {
    // Use GSI1 to find the session for this connection
    const queryResult = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'connectionId = :connId',
      ExpressionAttributeValues: {
        ':connId': connectionId,
      },
    }));

    if (queryResult.Items && queryResult.Items.length > 0) {
      const item = queryResult.Items[0];
      const sessionId = item.sessionId;

      await docClient.send(new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: item.PK,
          SK: item.SK,
        },
      }));
      console.log(`Disconnected: ${connectionId} from ${item.PK}`);

      // Query remaining connections for viewer count update
      const remaining = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `SESSION#${sessionId}`,
          ':sk': 'CONN#',
        },
      }));

      const viewerList = (remaining.Items || []).filter(c => c.role === 'viewer').map(c => c.connectionId);
      const apigw = new ApiGatewayManagementApiClient({ endpoint });
      const payload = JSON.stringify({
        action: 'VIEWER_UPDATE',
        viewers: viewerList,
        count: viewerList.length,
      });

      const postCalls = (remaining.Items || []).map(async (conn) => {
        try {
          await apigw.send(new PostToConnectionCommand({
            ConnectionId: conn.connectionId,
            Data: payload,
          }));
        } catch (err) {
          // ignore
        }
      });

      await Promise.all(postCalls);
    }

    return { statusCode: 200, body: 'Disconnected' };
  } catch (error) {
    console.error('Disconnect error:', error);
    return { statusCode: 500, body: 'Failed to disconnect' };
  }
};
