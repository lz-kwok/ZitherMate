const DB_NAME = 'zithermate_original_scores_db';
const DB_VERSION = 1;
const STORE_NAME = 'pages';

interface StoredPageRecord {
  id: string;
  scoreId: string;
  blob: Blob;
  updatedAt: number;
}

const objectUrlCache = new Map<string, string>();
const memoryFallbackStore = new Map<string, { scoreId: string; dataUrl: string; updatedAt: number }>();

function hasIndexedDb(): boolean {
  return typeof indexedDB !== 'undefined';
}

function canUseObjectUrl(): boolean {
  return typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function';
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('scoreId', 'scoreId', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('无法打开本地原件曲谱数据库'));
  });
}

function revokeCachedUrl(id: string) {
  const existing = objectUrlCache.get(id);
  if (existing) {
    if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function' && existing.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(existing);
      } catch {
        // ignore
      }
    }
    objectUrlCache.delete(id);
  }
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx === -1) {
    throw new Error('无效的 DataURL 图片数据');
  }
  const header = dataUrl.slice(0, commaIdx);
  const body = dataUrl.slice(commaIdx + 1);
  const mimeMatch = header.match(/data:([^;]+)/i);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const isBase64 = /;base64/i.test(header);

  if (!isBase64) {
    const decoded = decodeURIComponent(body);
    const bytes = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) {
      bytes[i] = decoded.charCodeAt(i) & 0xff;
    }
    return new Blob([bytes], { type: mimeType });
  }

  const binaryStr = atob(body.replace(/\s+/g, ''));
  const len = binaryStr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof FileReader !== 'undefined') {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || '');
      reader.onerror = () => reject(reader.error || new Error('图片 Blob 解码失败'));
      reader.readAsDataURL(blob);
      return;
    }
    blob.arrayBuffer().then((buf) => {
      const bytes = new Uint8Array(buf);
      let bin = '';
      for (let i = 0; i < bytes.length; i++) {
        bin += String.fromCharCode(bytes[i]);
      }
      const mime = blob.type || 'image/jpeg';
      resolve(`data:${mime};base64,${btoa(bin)}`);
    }, reject);
  });
}

export async function savePageImages(
  scoreId: string,
  pages: { id: string; dataUrl: string }[]
): Promise<void> {
  if (pages.length === 0) return;

  if (!hasIndexedDb()) {
    const now = Date.now();
    for (const p of pages) {
      revokeCachedUrl(p.id);
      memoryFallbackStore.set(p.id, { scoreId, dataUrl: p.dataUrl, updatedAt: now });
      objectUrlCache.set(p.id, p.dataUrl);
    }
    return;
  }

  const records: StoredPageRecord[] = pages.map((p) => ({
    id: p.id,
    scoreId,
    blob: dataUrlToBlob(p.dataUrl),
    updatedAt: Date.now(),
  }));

  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const rec of records) {
        revokeCachedUrl(rec.id);
        store.put(rec);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('保存原件图片到 IndexedDB 失败'));
      tx.onabort = () => reject(tx.error || new Error('保存原件图片事务被中止'));
    });
  } finally {
    db.close();
  }
}

async function readRecordFromIdb(id: string): Promise<StoredPageRecord | null> {
  if (!hasIndexedDb()) return null;
  const db = await openDatabase();
  try {
    return await new Promise<StoredPageRecord | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(id);
      req.onsuccess = () => resolve((req.result as StoredPageRecord) || null);
      req.onerror = () => reject(req.error || new Error('读取原件图片失败'));
    });
  } finally {
    db.close();
  }
}

export async function loadPageImageUrl(id: string): Promise<string | null> {
  const cached = objectUrlCache.get(id);
  if (cached) return cached;

  if (!hasIndexedDb()) {
    const mem = memoryFallbackStore.get(id);
    if (!mem) return null;
    objectUrlCache.set(id, mem.dataUrl);
    return mem.dataUrl;
  }

  const record = await readRecordFromIdb(id);
  if (!record || !record.blob) return null;

  const url = canUseObjectUrl()
    ? URL.createObjectURL(record.blob)
    : await blobToDataUrl(record.blob);
  objectUrlCache.set(id, url);
  return url;
}

export async function loadScorePageUrls(pageIds: string[]): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  await Promise.all(
    pageIds.map(async (id) => {
      const url = await loadPageImageUrl(id);
      if (url) {
        result[id] = url;
      }
    })
  );
  return result;
}

export async function exportPageImagesAsDataUrls(
  pageIds: string[]
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};

  if (!hasIndexedDb()) {
    for (const id of pageIds) {
      const mem = memoryFallbackStore.get(id);
      if (mem) {
        result[id] = mem.dataUrl;
      }
    }
    return result;
  }

  await Promise.all(
    pageIds.map(async (id) => {
      const rec = await readRecordFromIdb(id);
      if (rec?.blob) {
        result[id] = await blobToDataUrl(rec.blob);
      }
    })
  );
  return result;
}

/**
 * 批量获取原件各页的可移植 DataURL（优先读取 IndexedDB，对内置 staticUrl 自动拉取转码）
 */
export async function exportOriginalPagesDataUrls(
  pages: { id: string; staticUrl?: string }[]
): Promise<Record<string, string>> {
  const result = await exportPageImagesAsDataUrls(pages.map((p) => p.id));

  await Promise.all(
    pages.map(async (page) => {
      if (result[page.id] || !page.staticUrl || typeof fetch === 'undefined') return;
      try {
        const resp = await fetch(page.staticUrl);
        if (!resp.ok) return;
        const blob = await resp.blob();
        result[page.id] = await blobToDataUrl(blob);
      } catch {
        // 忽略静态资源读取失败
      }
    })
  );

  return result;
}

export async function deleteScoreImages(scoreId: string, pageIds?: string[]): Promise<void> {
  if (!hasIndexedDb()) {
    if (pageIds) {
      for (const id of pageIds) {
        revokeCachedUrl(id);
        memoryFallbackStore.delete(id);
      }
    }
    for (const [key, val] of memoryFallbackStore.entries()) {
      if (val.scoreId === scoreId) {
        revokeCachedUrl(key);
        memoryFallbackStore.delete(key);
      }
    }
    return;
  }

  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      if (pageIds && pageIds.length > 0) {
        for (const id of pageIds) {
          revokeCachedUrl(id);
          store.delete(id);
        }
      }

      const cursorReq = store.openCursor();
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (!cursor) return;
        const val = cursor.value as StoredPageRecord;
        if (val && val.scoreId === scoreId) {
          revokeCachedUrl(val.id);
          cursor.delete();
        }
        cursor.continue();
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('清理原件图片缓存失败'));
    });
  } finally {
    db.close();
  }
}
