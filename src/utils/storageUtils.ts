import type { Artwork } from '../types';

const STORAGE_KEY = 'daily-canvas-artworks';
const MAX_ARTWORKS = 100;

/**
 * 压缩图片为JPEG格式
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
  canvas: HTMLCanvasElement,
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

/**
 * 从localStorage加载作品
 */
export const loadArtworks = (): Artwork[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return [];
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load artworks:', error);
    return [];
  }
};

/**
 * 保存作品到localStorage
 */
export const saveArtworks = (artworks: Artwork[]): boolean => {
  try {
    const data = JSON.stringify(artworks);
    localStorage.setItem(STORAGE_KEY, data);
    return true;
  } catch (error) {
    console.error('Failed to save artworks:', error);
    return false;
  }
};

/**
 * 添加新作品
 */
export const addArtwork = (artwork: Artwork): boolean => {
  const artworks = loadArtworks();
  
  // 检查是否超过限制
  if (artworks.length >= MAX_ARTWORKS) {
    // 删除最早的作品
    artworks.shift();
  }
  
  artworks.push(artwork);
  return saveArtworks(artworks);
};

/**
 * 删除作品
 */
export const deleteArtwork = (id: string): boolean => {
  const artworks = loadArtworks();
  const filtered = artworks.filter(art => art.id !== id);
  return saveArtworks(filtered);
};

/**
 * 清空所有作品
 */
export const clearAllArtworks = (): boolean => {
  return saveArtworks([]);
};

/**
 * 获取存储使用情况
 */
export const getStorageUsage = () => {
  const artworks = loadArtworks();
  let totalSize = 0;
  
  artworks.forEach(art => {
    totalSize += art.size;
  });
  
  // 估算localStorage可用空间（不同浏览器不同）
  const usedPercentage = (totalSize / (5 * 1024 * 1024)) * 100; // 假设5MB限制
  
  return {
    count: artworks.length,
    maxCount: MAX_ARTWORKS,
    totalSize,
    usedPercentage: Math.min(usedPercentage, 100),
    remainingSize: Math.max(5 * 1024 * 1024 - totalSize, 0)
  };
};

/**
 * 检查存储空间是否充足
 */
export const checkStorageSpace = (requiredSize: number): boolean => {
  const usage = getStorageUsage();
  return usage.remainingSize >= requiredSize;
};
