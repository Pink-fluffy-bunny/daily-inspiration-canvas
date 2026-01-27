import { defineStore } from 'pinia';
import type { ToolType, Artwork } from '../types';
import { getDailyPrompt, getRandomPrompt } from '../utils/promptLoader';
import { 
  addArtwork, 
  deleteArtwork, 
  clearAllArtworks, 
  loadArtworks,
  getStorageUsage,
  saveArtworks
} from '../utils/storageUtils';

export const useCanvasStore = defineStore('canvas', {
  state: () => ({
    currentTool: 'brush' as ToolType,
    brushSize: 5,
    brushColor: '#000000',
    isDrawing: false,
    currentPrompt: getDailyPrompt(),
    history: [] as ImageData[],
    historyIndex: -1,
    savedArtworks: [] as Artwork[],
    maxArtworks: 100,
    canvasRef: null as HTMLCanvasElement | null
  }),

  getters: {
    canUndo: (state) => state.historyIndex > 0,
    canRedo: (state) => state.historyIndex < state.history.length - 1,
    storageUsage: () => getStorageUsage()
  },

  actions: {
    /**
     * 初始化Canvas
     */
    initCanvas(canvas: HTMLCanvasElement) {
      this.canvasRef = canvas;
      this.loadArtworks();
    },

    /**
     * 加载保存的作品
     */
    loadArtworks() {
      this.savedArtworks = loadArtworks();
    },

    /**
     * 保存当前状态到历史记录
     */
    saveToHistory() {
      if (!this.canvasRef) return;

      const imageData = this.canvasRef.getContext('2d')?.getImageData(0, 0, this.canvasRef.width, this.canvasRef.height);
      if (!imageData) return;

      // 如果当前不在历史记录末尾，删除后面的记录
      if (this.historyIndex < this.history.length - 1) {
        this.history = this.history.slice(0, this.historyIndex + 1);
      }

      this.history.push(imageData);
      this.historyIndex++;

      // 限制历史记录数量（最多50步）
      if (this.history.length > 50) {
        this.history.shift();
        this.historyIndex--;
      }
    },

    /**
     * 撤销
     */
    undo() {
      if (!this.canUndo || !this.canvasRef) return;

      this.historyIndex--;
      const imageData = this.history[this.historyIndex];
      if (imageData) {
        this.canvasRef.getContext('2d')?.putImageData(imageData, 0, 0);
      }
    },

    /**
     * 重做
     */
    redo() {
      if (!this.canRedo || !this.canvasRef) return;

      this.historyIndex++;
      const imageData = this.history[this.historyIndex];
      if (imageData) {
        this.canvasRef.getContext('2d')?.putImageData(imageData, 0, 0);
      }
    },

    /**
     * 清空画布
     */
    clearCanvas() {
      if (!this.canvasRef) return;

      const ctx = this.canvasRef.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, this.canvasRef.width, this.canvasRef.height);
        this.saveToHistory();
      }
    },

    /**
     * 刷新提示词
     */
    refreshPrompt() {
      this.currentPrompt = getRandomPrompt();
    },

    /**
     * 保存当前作品
     */
    saveArtwork() {
      if (!this.canvasRef) return false;

      try {
        const fullImage = this.canvasRef.toDataURL('image/jpeg', 0.7);
        const thumbnail = this.generateThumbnail();
        const size = this.calculateSize(fullImage);

        const artwork: Artwork = {
          id: Date.now().toString(),
          prompt: this.currentPrompt,
          thumbnail,
          fullImage,
          createdAt: Date.now(),
          size
        };

        const success = addArtwork(artwork);
        if (success) {
          this.loadArtworks();
        }
        return success;
      } catch (error) {
        console.error('Failed to save artwork:', error);
        return false;
      }
    },

    /**
     * 删除作品
     */
    removeArtwork(id: string) {
      deleteArtwork(id);
      this.loadArtworks();
    },

    /**
     * 清空所有作品
     */
    removeAllArtworks() {
      clearAllArtworks();
      this.loadArtworks();
    },

    /**
     * 生成缩略图
     */
    generateThumbnail(): string {
      if (!this.canvasRef) return '';

      const thumbnailCanvas = document.createElement('canvas');
      const maxSize = 200;
      const scale = Math.min(maxSize / this.canvasRef.width, maxSize / this.canvasRef.height);
      
      thumbnailCanvas.width = this.canvasRef.width * scale;
      thumbnailCanvas.height = this.canvasRef.height * scale;
      
      const ctx = thumbnailCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(this.canvasRef, 0, 0, thumbnailCanvas.width, thumbnailCanvas.height);
        return thumbnailCanvas.toDataURL('image/jpeg', 0.8);
      }
      
      return '';
    },

    /**
     * 计算图片大小
     */
    calculateSize(dataUrl: string): number {
      const parts = dataUrl.split(',');
      const base64 = parts[1];
      if (!base64) return 0;
      return Math.round((base64.length * 3) / 4);
    },

    /**
     * 下载图片
     */
    downloadImage() {
      if (!this.canvasRef) return;

      const link = document.createElement('a');
      link.download = `artwork-${Date.now()}.png`;
      link.href = this.canvasRef.toDataURL('image/png');
      link.click();
    },

    /**
     * 更新作品信息
     */
    updateArtworkInfo(id: string, updates: Partial<Artwork>) {
      const artwork = this.savedArtworks.find(art => art.id === id);
      if (artwork) {
        Object.assign(artwork, updates);
        // 保存更新后的作品列表
        saveArtworks(this.savedArtworks);
        // 重新加载以更新状态
        this.loadArtworks();
      }
    }
  }
});
