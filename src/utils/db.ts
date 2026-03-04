const DB_NAME = 'deep_reader_db';
const DB_VERSION = 2; // Incremented for keyPath change
const STORE_NAME = 'novels_content';

let dbInstance: IDBDatabase | null = null;

export const ContentDB = {
  async open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (dbInstance) return resolve(dbInstance);

      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        const oldVersion = e.oldVersion;
        
        // If it's a new DB or version 1, configure the store
        if (oldVersion < 2) {
          // If the old version 1 store exists, we must delete it to change keyPath
          if (db.objectStoreNames.contains(STORE_NAME)) {
            db.deleteObjectStore(STORE_NAME);
          }
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = (e) => {
        dbInstance = (e.target as IDBOpenDBRequest).result;
        resolve(dbInstance);
      };
      request.onerror = (e) => reject((e.target as IDBOpenDBRequest).error);
    });
  },

  async save(id: string, content: string, type?: string, name?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!dbInstance) return reject(new Error('DB not open'));
      const tx = dbInstance.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ id, content, type, name });
      req.onsuccess = () => resolve();
      tx.onerror = (e) => reject((e.target as IDBRequest).error);
    });
  },

  async load(id: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      if (!dbInstance) return reject(new Error('DB not open'));
      const tx = dbInstance.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = (e) => {
        const result = (e.target as IDBRequest).result;
        resolve(result ? result.content : null);
      };
      req.onerror = (e) => reject((e.target as IDBRequest).error);
    });
  },

  async delete(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!dbInstance) return reject(new Error('DB not open'));
      const tx = dbInstance.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      tx.onerror = (e) => reject((e.target as IDBRequest).error);
    });
  },

  async has(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!dbInstance) return reject(new Error('DB not open'));
      const tx = dbInstance.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.count(id);
      req.onsuccess = (e) => resolve((e.target as IDBRequest).result > 0);
      req.onerror = (e) => reject((e.target as IDBRequest).error);
    });
  },

  async clear(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!dbInstance) return reject(new Error('DB not open'));
      const tx = dbInstance.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      tx.onerror = (e) => reject((e.target as IDBRequest).error);
    });
  }
};

// ===== Identity DB for Dual Anchoring =====
const IDENTITY_DB_NAME = 'deep_reader_identity';
const IDENTITY_STORE_NAME = 'identity_store';

let identityDbInstance: IDBDatabase | null = null;

export const IdentityDB = {
  async open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (identityDbInstance) return resolve(identityDbInstance);

      const request = indexedDB.open(IDENTITY_DB_NAME, 1);
      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(IDENTITY_STORE_NAME)) {
          db.createObjectStore(IDENTITY_STORE_NAME);
        }
      };
      request.onsuccess = (e) => {
        identityDbInstance = (e.target as IDBOpenDBRequest).result;
        resolve(identityDbInstance);
      };
      request.onerror = (e) => reject((e.target as IDBOpenDBRequest).error);
    });
  },

  async set(key: string, value: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!identityDbInstance) return reject(new Error('DB not open'));
      const tx = identityDbInstance.transaction(IDENTITY_STORE_NAME, 'readwrite');
      const store = tx.objectStore(IDENTITY_STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      tx.onerror = (e) => reject((e.target as IDBRequest).error);
    });
  },

  async get(key: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      if (!identityDbInstance) return reject(new Error('DB not open'));
      const tx = identityDbInstance.transaction(IDENTITY_STORE_NAME, 'readonly');
      const store = tx.objectStore(IDENTITY_STORE_NAME);
      const req = store.get(key);
      req.onsuccess = (e) => {
        const result = (e.target as IDBRequest).result;
        resolve(result || null);
      };
      req.onerror = (e) => reject((e.target as IDBRequest).error);
    });
  },

  async clear(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!identityDbInstance) return reject(new Error('DB not open'));
      const tx = identityDbInstance.transaction(IDENTITY_STORE_NAME, 'readwrite');
      const store = tx.objectStore(IDENTITY_STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      tx.onerror = (e) => reject((e.target as IDBRequest).error);
    });
  },

  async delete(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!identityDbInstance) return reject(new Error('DB not open'));
      const tx = identityDbInstance.transaction(IDENTITY_STORE_NAME, 'readwrite');
      const store = tx.objectStore(IDENTITY_STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = (e) => reject((e.target as IDBRequest).error);
    });
  }
};
