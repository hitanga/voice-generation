export interface OfflineStory {
  id: string;
  title: string;
  text: string;
  audioBlob: Blob;
  mimeType: string;
  durationSeconds: number;
  voiceName: string;
  voiceGender: "male" | "female";
  modeId: string;
  pitchSemi: number;
  speed: number;
  tags: string[];
  createdAt: string;
  sizeBytes: number;
  isSyncedToCloud?: boolean;
}

const DB_NAME = "FableVoice_Offline_DB";
const STORE_NAME = "saved_stories";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("IndexedDB is not supported on this browser"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
        store.createIndex("title", "title", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save story to IndexedDB for offline listening
 */
export async function saveStoryOffline(story: OfflineStory): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(story);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Fetch all saved offline stories
 */
export async function getOfflineStories(): Promise<OfflineStory[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => {
      const stories: OfflineStory[] = req.result || [];
      // Sort newest first
      stories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      resolve(stories);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get single offline story by ID
 */
export async function getOfflineStoryById(id: string): Promise<OfflineStory | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);

    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Delete story from offline storage
 */
export async function deleteOfflineStory(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Calculate total offline storage used
 */
export async function getOfflineStorageUsage(): Promise<{ totalBytes: number; count: number }> {
  try {
    const stories = await getOfflineStories();
    const totalBytes = stories.reduce((sum, s) => sum + (s.sizeBytes || s.audioBlob?.size || 0), 0);
    return { totalBytes, count: stories.length };
  } catch {
    return { totalBytes: 0, count: 0 };
  }
}
