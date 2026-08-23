import { Storage } from "@google-cloud/storage";

// Railway-compatible Google Cloud Storage authentication.
// Prefer a service-account JSON string in GCS_SERVICE_ACCOUNT_JSON. The
// standard GOOGLE_APPLICATION_CREDENTIALS file path also works locally.
const serviceAccountJson = process.env.GCS_SERVICE_ACCOUNT_JSON;
const credentials = serviceAccountJson ? JSON.parse(serviceAccountJson) : undefined;

export const gcsClient = new Storage({
  projectId: process.env.GCS_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT,
  ...(credentials ? { credentials } : {}),
});

export function getGcsBucket() {
  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  if (!bucketId) throw new Error("DEFAULT_OBJECT_STORAGE_BUCKET_ID not set");
  return gcsClient.bucket(bucketId);
}
