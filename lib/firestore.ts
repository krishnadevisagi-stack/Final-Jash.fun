import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 6000, opName: string = 'Firestore operation'): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`${opName} timed out after ${timeoutMs}ms`)), timeoutMs)
  );
  return Promise.race([promise, timeout]);
}

class DocRefWrapper {
  private db: any;
  private colName: string;
  private docId: string;
  private firestoreDocRef: any;

  constructor(db: any, colName: string, docId: string) {
    this.db = db;
    this.colName = colName;
    this.docId = docId;
    this.firestoreDocRef = doc(db, colName, docId);
  }

  get id() {
    return this.docId;
  }

  get ref() {
    return this;
  }

  async get() {
    const snap = await withTimeout(getDoc(this.firestoreDocRef), 6000, `getDoc(${this.colName}/${this.docId})`);
    return {
      exists: snap.exists(),
      id: snap.id,
      data: () => snap.data(),
    };
  }

  async set(data: any, options?: { merge?: boolean }) {
    await withTimeout(setDoc(this.firestoreDocRef, data, { merge: options?.merge ?? false }), 6000, `setDoc(${this.colName}/${this.docId})`);
  }

  async update(data: any) {
    await withTimeout(updateDoc(this.firestoreDocRef, data), 6000, `updateDoc(${this.colName}/${this.docId})`);
  }

  async delete() {
    await withTimeout(deleteDoc(this.firestoreDocRef), 6000, `deleteDoc(${this.colName}/${this.docId})`);
  }
}

class QueryWrapper {
  private db: any;
  private colName: string;
  private constraints: any[] = [];

  constructor(db: any, colName: string, constraints: any[] = []) {
    this.db = db;
    this.colName = colName;
    this.constraints = constraints;
  }

  where(fieldPath: string, opStr: string, value: any) {
    let finalValue = value;
    // Map Javascript Date objects correctly for query filters
    if (value instanceof Date) {
      finalValue = value.toISOString();
    }
    return new QueryWrapper(this.db, this.colName, [
      ...this.constraints,
      where(fieldPath, opStr as any, finalValue)
    ]);
  }

  async get() {
    const colRef = collection(this.db, this.colName);
    const q = this.constraints.length > 0 
      ? query(colRef, ...this.constraints)
      : colRef;
      
    const snap = await withTimeout(getDocs(q), 6000, `getDocs(${this.colName})`);
    const docs = snap.docs.map(d => ({
      id: d.id,
      ref: new DocRefWrapper(this.db, this.colName, d.id),
      data: () => d.data(),
    }));

    return {
      docs,
      forEach: (callback: (doc: any) => void) => {
        docs.forEach(callback);
      },
      get size() {
        return docs.length;
      },
      get empty() {
        return docs.length === 0;
      }
    };
  }
}

class CollectionWrapper {
  private db: any;
  private colName: string;

  constructor(db: any, colName: string) {
    this.db = db;
    this.colName = colName;
  }

  doc(docId: string) {
    return new DocRefWrapper(this.db, this.colName, docId);
  }

  where(fieldPath: string, opStr: string, value: any) {
    return new QueryWrapper(this.db, this.colName).where(fieldPath, opStr, value);
  }

  async get() {
    return new QueryWrapper(this.db, this.colName).get();
  }
}

class FirestoreWrapper {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  collection(colName: string) {
    return new CollectionWrapper(this.db, colName);
  }
}

let firestoreWrapperInstance: any = null;

export function getFirestoreDB(): any {
  if (firestoreWrapperInstance) {
    return firestoreWrapperInstance;
  }

  let config: any = {};
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch (err) {
    console.warn('Could not read firebase-applet-config.json:', err);
  }

  if (!config.apiKey) {
    throw new Error('Firebase Client SDK Configuration is missing API Key.');
  }

  const clientApp = getApps().length === 0 
    ? initializeApp({
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId,
      })
    : getApps()[0];

  const clientDb = config.firestoreDatabaseId 
    ? getFirestore(clientApp, config.firestoreDatabaseId)
    : getFirestore(clientApp);

  firestoreWrapperInstance = new FirestoreWrapper(clientDb);
  return firestoreWrapperInstance;
}

// sync
