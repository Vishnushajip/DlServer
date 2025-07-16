import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccount = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '../dland-1ad12-firebase-adminsdk-fbsvc-ea2e6dfb8f.json'),
    'utf-8'
  )
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.BUCKET_NAME,
    databaseURL: 'https://dland-1ad12-default-rtdb.firebaseio.com/',
  });
  console.log('✅ Firebase initialized with bucket:', process.env.BUCKET_NAME);
}

const bucket = admin.storage().bucket();

export { bucket };
export default admin;
