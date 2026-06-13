import admin from "firebase-admin";

let initialized = false;

export function getFirebaseAdmin() {
  if (!initialized) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set");
    }
    const serviceAccount = JSON.parse(serviceAccountJson);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    });
    initialized = true;
  }
  return admin;
}

export function getStorage() {
  return getFirebaseAdmin().storage();
}

export default getFirebaseAdmin;
