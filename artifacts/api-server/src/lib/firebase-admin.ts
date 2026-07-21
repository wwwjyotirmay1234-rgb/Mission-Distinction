import { initializeApp, cert, getApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

function ensureInitialized() {
  if (getApps().length > 0) return getApp();
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set");
  }
  const serviceAccount = JSON.parse(serviceAccountJson);
  return initializeApp({
    credential: cert(serviceAccount),
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  });
}

export function getFirebaseAuth() {
  return getAuth(ensureInitialized());
}

export function getFirebaseStorageBucket() {
  return getStorage(ensureInitialized()).bucket();
}

export function getFirebaseAdmin() {
  ensureInitialized();
  return { auth: () => getAuth(getApp()) };
}

export default getFirebaseAuth;
