/// <reference types="vite/client" />
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  getDocFromServer,
} from 'firebase/firestore';
import type { ScriptureDatabase } from '../types';

const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey:
    env.VITE_FIREBASE_API_KEY ||
    'AIzaSyAkVC6VsMX4-A90ST9q0ylv7mTobLp8pn8',
  authDomain:
    env.VITE_FIREBASE_AUTH_DOMAIN ||
    'yttriferous-cascade-wkgrx.firebaseapp.com',
  projectId:
    env.VITE_FIREBASE_PROJECT_ID ||
    'yttriferous-cascade-wkgrx',
  storageBucket:
    env.VITE_FIREBASE_STORAGE_BUCKET ||
    'yttriferous-cascade-wkgrx.firebasestorage.app',
  messagingSenderId:
    env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    '798332399254',
  appId:
    env.VITE_FIREBASE_APP_ID ||
    '1:798332399254:web:ab09495de0f50de10c9cb7',
};

const databaseId =
  env.VITE_FIREBASE_DATABASE_ID ||
  'ai-studio-scripturegraphda-7322598e-08c0-43a8-bc65-daff885084e4';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with specific databaseId
export const db = getFirestore(app, databaseId);

const CONSTELLATION_DOC_PATH = 'constellation';
const UNIVERSAL_DOC_ID = 'universal';

/**
 * Validates connection to Firestore server on boot
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, CONSTELLATION_DOC_PATH, UNIVERSAL_DOC_ID));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is running in offline mode or connecting...');
    }
    return false;
  }
}

/**
 * Fetch the universal database from Cloud Firestore
 */
export async function getCloudDatabase(): Promise<ScriptureDatabase | null> {
  try {
    const docRef = doc(db, CONSTELLATION_DOC_PATH, UNIVERSAL_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        schema_version: data.schema_version || '1.0.0',
        relation_vocabulary: data.relation_vocabulary || [
          'extends',
          'supports',
          'contrasts',
          'restates',
          'requires',
          'exemplifies',
        ],
        scriptures: data.scriptures || {},
        verses: data.verses || [],
        edges: data.edges || [],
        chains: data.chains || [],
        review_notes: data.review_notes || [],
        node_positions: data.node_positions || {},
      };
    }
    return null;
  } catch (err) {
    console.warn('Failed to load from Cloud Firestore:', err);
    return null;
  }
}

/**
 * Save node positions to Cloud Firestore
 */
export async function saveCloudPositions(
  positions: Record<string, { x: number; y: number; fx?: number; fy?: number }>
): Promise<boolean> {
  try {
    const docRef = doc(db, CONSTELLATION_DOC_PATH, UNIVERSAL_DOC_ID);
    const updatePayload: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };
    for (const [nodeId, coords] of Object.entries(positions)) {
      updatePayload[`node_positions.${nodeId}`] = coords;
    }

    try {
      await updateDoc(docRef, updatePayload);
      return true;
    } catch {
      // If doc doesn't exist yet, set with merge
      await setDoc(
        docRef,
        {
          node_positions: positions,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      return true;
    }
  } catch (err) {
    console.error('Failed to save positions to Cloud Firestore:', err);
    return false;
  }
}

/**
 * Save the entire database to Cloud Firestore
 */
export async function saveCloudDatabase(data: ScriptureDatabase): Promise<boolean> {
  try {
    const docRef = doc(db, CONSTELLATION_DOC_PATH, UNIVERSAL_DOC_ID);
    await setDoc(
      docRef,
      {
        schema_version: data.schema_version || '1.0.0',
        relation_vocabulary: data.relation_vocabulary || [],
        scriptures: data.scriptures || {},
        verses: data.verses || [],
        edges: data.edges || [],
        chains: data.chains || [],
        review_notes: data.review_notes || [],
        node_positions: data.node_positions || {},
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.error('Failed to save database to Cloud Firestore:', err);
    return false;
  }
}

/**
 * Subscribe to real-time updates from Cloud Firestore across all devices and Vercel deployments
 */
export function subscribeToCloudDatabase(
  onData: (data: ScriptureDatabase) => void
): () => void {
  const docRef = doc(db, CONSTELLATION_DOC_PATH, UNIVERSAL_DOC_ID);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        onData({
          schema_version: data.schema_version || '1.0.0',
          relation_vocabulary: data.relation_vocabulary || [
            'extends',
            'supports',
            'contrasts',
            'restates',
            'requires',
            'exemplifies',
          ],
          scriptures: data.scriptures || {},
          verses: data.verses || [],
          edges: data.edges || [],
          chains: data.chains || [],
          review_notes: data.review_notes || [],
          node_positions: data.node_positions || {},
        });
      }
    },
    (err) => {
      console.warn('Firestore realtime subscription notice:', err.message);
    }
  );
}
