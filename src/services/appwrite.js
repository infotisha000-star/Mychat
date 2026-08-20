import { Client, Storage, ID } from 'appwrite';

const APPWRITE_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID || '6a87160800235ef8688f';
export const APPWRITE_BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_ID || '6a87163a0005ec2a2733';

const client = new Client();
client
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

export const storage = new Storage(client);
export { ID };

/**
 * Generates direct download/view URL for a file in Appwrite Storage.
 */
export const getFileViewUrl = (fileId) => {
  if (!fileId) return '';
  return `${APPWRITE_ENDPOINT}/storage/buckets/${APPWRITE_BUCKET_ID}/files/${fileId}/view?project=${APPWRITE_PROJECT_ID}`;
};

/**
 * Generates thumbnail URL for images in Appwrite Storage.
 */
export const getFilePreviewUrl = (fileId, width = 600, height = 600, quality = 85) => {
  if (!fileId) return '';
  return `${APPWRITE_ENDPOINT}/storage/buckets/${APPWRITE_BUCKET_ID}/files/${fileId}/preview?project=${APPWRITE_PROJECT_ID}&width=${width}&height=${height}&quality=${quality}`;
};
