/**
 * Netlify Function for Server-Side Secret Operations
 * Uses secret APPWRITE_API_KEY environment variable.
 */
const { Client, Storage } = require('appwrite');

exports.handler = async function (event, context) {
  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  const apiKey = process.env.APPWRITE_API_KEY;
  const endpoint = process.env.VITE_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
  const projectId = process.env.VITE_APPWRITE_PROJECT_ID || '6a87160800235ef8688f';
  const bucketId = process.env.VITE_APPWRITE_BUCKET_ID || '6a87163a0005ec2a2733';

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'APPWRITE_API_KEY server variable is not configured.' }),
    };
  }

  try {
    const client = new Client();
    client
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(apiKey);

    const storage = new Storage(client);
    const payload = JSON.parse(event.body || '{}');

    // Example action: Secret File Delete
    if (payload.action === 'deleteFile' && payload.fileId) {
      await storage.deleteFile(bucketId, payload.fileId);
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'File deleted securely from server.' }),
      };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid operation specified.' }),
    };
  } catch (error) {
    console.error('Netlify function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
