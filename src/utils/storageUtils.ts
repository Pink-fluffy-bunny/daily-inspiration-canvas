import type { Artwork, Album } from '../types';

const DB_NAME = 'DailyInspirationCanvasDB';
const DB_VERSION = 2; // 升级版本以支持 Albums
const ARTWORK_STORE = 'artworks';
const ALBUM_STORE = 'albums';
const LEGACY_STORAGE_KEY = 'daily-canvas-artworks';
const MAX_ARTWORKS = 1000;

let db: IDBDatabase | null = null;

/**
 * 初始化并打开数据库
 */
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Database error:', event);
      reject('IndexedDB error');
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // 创建作品存储
      if (!db.objectStoreNames.contains(ARTWORK_STORE)) {
        db.createObjectStore(ARTWORK_STORE, { keyPath: 'id' });
      } else {
        // 如果已存在，可能需要添加索引（在此版本做升级处理）
      }

      // 创建画册存储
      if (!db.objectStoreNames.contains(ALBUM_STORE)) {
        db.createObjectStore(ALBUM_STORE, { keyPath: 'id' });
      }
    };
  });
};

/**
 * 从 localStorage 迁移数据到 IndexedDB
 */
export const migrateFromLocalStorage = async (): Promise<void> => {
  const legacyData = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!legacyData) return;

  try {
    const artworks: Artwork[] = JSON.parse(legacyData);
    if (artworks.length === 0) return;

    const database = await initDB();
    const transaction = database.transaction([ARTWORK_STORE], 'readwrite');
    const store = transaction.objectStore(ARTWORK_STORE);

    for (const artwork of artworks) {
      // 检查是否已存在，防止重复迁移
      const checkRequest = store.get(artwork.id);
      checkRequest.onsuccess = () => {
        if (!checkRequest.result) {
          store.add(artwork);
        }
      };
    }

    transaction.oncomplete = () => {
      console.log('Successfully migrated artworks from localStorage');
      // 迁移完成后，我们可以选择保留或重命名旧键，安全起见先不删除
      localStorage.setItem(`${LEGACY_STORAGE_KEY}_migrated`, legacyData);
    };
  } catch (error) {
    console.error('Failed to migrate data:', error);
  }
};

/**
 * 获取所有作品
 */
export const loadArtworks = async (): Promise<Artwork[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([ARTWORK_STORE], 'readonly');
    const store = transaction.objectStore(ARTWORK_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * 保存/添加作品
 */
export const addArtwork = async (artwork: Artwork): Promise<boolean> => {
  const database = await initDB();
  const artworks = await loadArtworks();

  return new Promise((resolve) => {
    const transaction = database.transaction([ARTWORK_STORE], 'readwrite');
    const store = transaction.objectStore(ARTWORK_STORE);

    // 检查限制
    if (artworks.length >= MAX_ARTWORKS) {
      // 这种自动删除逻辑在 IndexedDB 中需要更谨慎，这里先保持一致
      const oldest = artworks.sort((a, b) => a.createdAt - b.createdAt)[0];
      if (oldest) store.delete(oldest.id);
    }

    const request = store.put(artwork);
    request.onsuccess = () => resolve(true);
    request.onerror = () => {
      console.error('Failed to add artwork:', request.error);
      resolve(false);
    };
  });
};

/**
 * 批量保存作品 (用于更新列表)
 */
export const saveArtworks = async (artworks: Artwork[]): Promise<boolean> => {
  const database = await initDB();
  return new Promise((resolve) => {
    const transaction = database.transaction([ARTWORK_STORE], 'readwrite');
    const store = transaction.objectStore(ARTWORK_STORE);

    // IndexedDB 的批量更新通常是一个个 put
    artworks.forEach(art => store.put(art));

    transaction.oncomplete = () => resolve(true);
    transaction.onerror = () => resolve(false);
  });
};

/**
 * 删除作品
 */
export const deleteArtwork = async (id: string): Promise<boolean> => {
  const database = await initDB();
  return new Promise((resolve) => {
    const transaction = database.transaction([ARTWORK_STORE], 'readwrite');
    const store = transaction.objectStore(ARTWORK_STORE);
    const request = store.delete(id);

    request.onsuccess = () => resolve(true);
    request.onerror = () => resolve(false);
  });
};

/**
 * 清空所有作品
 */
export const clearAllArtworks = async (): Promise<boolean> => {
  const database = await initDB();
  return new Promise((resolve) => {
    const transaction = database.transaction([ARTWORK_STORE], 'readwrite');
    const store = transaction.objectStore(ARTWORK_STORE);
    const request = store.clear();

    request.onsuccess = () => resolve(true);
    request.onerror = () => resolve(false);
  });
};

// --- 画册相关存取 ---

export const loadAlbums = async (): Promise<Album[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([ALBUM_STORE], 'readonly');
    const store = transaction.objectStore(ALBUM_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveAlbum = async (album: Album): Promise<boolean> => {
  const database = await initDB();
  return new Promise((resolve) => {
    const transaction = database.transaction([ALBUM_STORE], 'readwrite');
    const store = transaction.objectStore(ALBUM_STORE);
    const request = store.put(album);

    request.onsuccess = () => resolve(true);
    request.onerror = () => resolve(false);
  });
};

export const deleteAlbum = async (id: string): Promise<boolean> => {
  const database = await initDB();
  return new Promise((resolve) => {
    const transaction = database.transaction([ALBUM_STORE], 'readwrite');
    const store = transaction.objectStore(ALBUM_STORE);
    const request = store.delete(id);

    request.onsuccess = () => resolve(true);
    request.onerror = () => resolve(false);
  });
};

/**
 * 获取存储使用情况
 */
export const getStorageUsage = async () => {
  const artworks = await loadArtworks();
  let totalSize = 0;
  
  artworks.forEach(art => {
    totalSize += art.size || 0;
  });
  
  // 对于 IndexedDB，估算限制通常比 localStorage 大得多 (50MB+ 或 磁盘剩余空间比例)
  // 这里我们设定一个参考值 500MB
  const ESTIMATED_LIMIT = 500 * 1024 * 1024;
  const usedPercentage = (totalSize / ESTIMATED_LIMIT) * 100;
  
  return {
    count: artworks.length,
    maxCount: MAX_ARTWORKS,
    totalSize,
    usedPercentage: Math.min(usedPercentage, 100),
    remainingSize: Math.max(ESTIMATED_LIMIT - totalSize, 0)
  };
};

/**
 * 压缩图片 (保持原样)
 */
export const compressImage = (
  canvas: HTMLCanvasElement,
  quality = 0.7
): string => {
  return canvas.toDataURL('image/jpeg', quality);
};
/**
 * 生成缩略图
 */
export const generateThumbnail = (
  canvas: HTMLCanvasElement | HTMLImageElement,
  maxSize = 200
): string => {
  const thumbnailCanvas = document.createElement('canvas');
  const ctx = thumbnailCanvas.getContext('2d');
  
  if (!ctx) {
    return '';
  }
  
  const scale = Math.min(maxSize / canvas.width, maxSize / canvas.height);
  thumbnailCanvas.width = canvas.width * scale;
  thumbnailCanvas.height = canvas.height * scale;
  
  ctx.drawImage(canvas, 0, 0, thumbnailCanvas.width, thumbnailCanvas.height);
  
  return thumbnailCanvas.toDataURL('image/jpeg', 0.8);
};

/**
 * 计算图片数据大小（字节）
 */
export const calculateImageSize = (dataUrl: string): number => {
  const parts = dataUrl.split(',');
  const base64 = parts[1];
  if (!base64) {
    return 0;
  }
  return Math.round((base64.length * 3) / 4);
};
