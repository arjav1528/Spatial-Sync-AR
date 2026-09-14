const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME || 'SpatialSync_Prod';

exports.handler = async (event) => {
  const connectionId = event.requestContext.connectionId;

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
      await docClient.send(new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: item.PK,
          SK: item.SK,
        },
      }));
      console.log(`Disconnected: ${connectionId} from ${item.PK}`);
    }

    return { statusCode: 200, body: 'Disconnected' };
  } catch (error) {
    console.error('Disconnect error:', error);
    return { statusCode: 500, body: 'Failed to disconnect' };
  }
};
