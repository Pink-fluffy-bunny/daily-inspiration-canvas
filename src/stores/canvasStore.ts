import { defineStore } from 'pinia';
import type { ToolType, Artwork, Album } from '../types';
import { getDailyPrompt, getRandomPrompt } from '../utils/promptLoader';
import { 
  addArtwork, 
  deleteArtwork, 
  clearAllArtworks, 
  loadArtworks,
  getStorageUsage,
  saveArtworks,
  loadAlbums,
  saveAlbum,
  deleteAlbum,
  migrateFromLocalStorage,
  generateThumbnail,
  calculateImageSize
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
    albums: [] as Album[],
    maxArtworks: 1000,
    canvasRef: null as HTMLCanvasElement | null,
    isInitialized: false
  }),

  getters: {
    canUndo: (state) => state.historyIndex > 0,
    canRedo: (state) => state.historyIndex < state.history.length - 1
  },

  actions: {
    /**
     * 初始化Canvas和存储
     */
    async initCanvas(canvas: HTMLCanvasElement) {
      this.canvasRef = canvas;
      if (!this.isInitialized) {
        await migrateFromLocalStorage();
        await this.loadAllData();
        this.isInitialized = true;
      }
    },

    /**
     * 加载所有数据
     */
    async loadAllData() {
      const [artworks, albums] = await Promise.all([
        loadArtworks(),
        loadAlbums()
      ]);
      this.savedArtworks = artworks;
      this.albums = albums;
    },

    /**
     * 保存当前状态到历史记录
     */
    saveToHistory() {
      if (!this.canvasRef) return;
      const ctx = this.canvasRef.getContext('2d');
      if (!ctx) return;

      const imageData = ctx.getImageData(0, 0, this.canvasRef.width, this.canvasRef.height);
      
      if (this.historyIndex < this.history.length - 1) {
        this.history = this.history.slice(0, this.historyIndex + 1);
      }

      this.history.push(imageData);
      this.historyIndex++;

      if (this.history.length > 50) {
        this.history.shift();
        this.historyIndex--;
      }
    },

    undo() {
      if (!this.canUndo || !this.canvasRef) return;
      this.historyIndex--;
      const imageData = this.history[this.historyIndex];
      if (imageData) {
        this.canvasRef.getContext('2d')?.putImageData(imageData, 0, 0);
      }
    },

    redo() {
      if (!this.canRedo || !this.canvasRef) return;
      this.historyIndex++;
      const imageData = this.history[this.historyIndex];
      if (imageData) {
        this.canvasRef.getContext('2d')?.putImageData(imageData, 0, 0);
      }
    },

    clearCanvas() {
      if (!this.canvasRef) return;
      const ctx = this.canvasRef.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, this.canvasRef.width, this.canvasRef.height);
        this.saveToHistory();
      }
    },

    refreshPrompt() {
      this.currentPrompt = getRandomPrompt();
    },

    async saveArtwork(albumId?: string) {
      if (!this.canvasRef) return false;
      try {
        const fullImage = this.canvasRef.toDataURL('image/jpeg', 0.7);
        const thumbnail = generateThumbnail(this.canvasRef);
        const size = calculateImageSize(fullImage);

        const artwork: Artwork = {
          id: Date.now().toString(),
          prompt: this.currentPrompt,
          thumbnail,
          fullImage,
          createdAt: Date.now(),
          size,
          albumId
        };

        const success = await addArtwork(artwork);
        if (success) {
          this.savedArtworks = await loadArtworks();
        }
        return success;
      } catch (error) {
        console.error('Failed to save artwork:', error);
        return false;
      }
    },

    async removeArtwork(id: string) {
      await deleteArtwork(id);
      this.savedArtworks = await loadArtworks();
    },

    async removeAllArtworks() {
      await clearAllArtworks();
      this.savedArtworks = await loadArtworks();
    },

    async addAlbum(name: string, description?: string) {
      const album: Album = {
        id: Date.now().toString(),
        name,
        description,
        createdAt: Date.now()
      };
      const success = await saveAlbum(album);
      if (success) {
        this.albums = await loadAlbums();
      }
      return success;
    },

    async removeAlbum(id: string) {
      await deleteAlbum(id);
      this.albums = await loadAlbums();
    },

    async updateAlbum(album: Album) {
      await saveAlbum(album);
      this.albums = await loadAlbums();
    },

    async importArtwork(file: File, albumId?: string) {
      return new Promise<boolean>((resolve) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64 = e.target?.result as string;
          if (!base64) return resolve(false);

          const img = new Image();
          img.onload = async () => {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            const ctx = tempCanvas.getContext('2d');
            if (!ctx) return resolve(false);
            ctx.drawImage(img, 0, 0);

            const thumbnail = generateThumbnail(tempCanvas);
            const artwork: Artwork = {
              id: Date.now().toString(),
              prompt: '外部导入: ' + file.name,
              thumbnail,
              fullImage: base64,
              createdAt: Date.now(),
              size: file.size,
              albumId,
              title: file.name
            };

            const success = await addArtwork(artwork);
            if (success) {
              this.savedArtworks = await loadArtworks();
            }
            resolve(success);
          };
          img.onerror = () => resolve(false);
          img.src = base64;
        };
        reader.onerror = () => resolve(false);
        reader.readAsDataURL(file);
      });
    },

    downloadImage() {
      if (!this.canvasRef) return;
      const link = document.createElement('a');
      link.download = `artwork-${Date.now()}.png`;
      link.href = this.canvasRef.toDataURL('image/png');
      link.click();
    },

    async updateArtworkInfo(id: string, updates: Partial<Artwork>) {
      const artworks = await loadArtworks();
      const index = artworks.findIndex(art => art.id === id);
      if (index !== -1) {
        const target = artworks[index];
        if (target) {
          Object.assign(target, updates);
          await saveArtworks(artworks);
          this.savedArtworks = await loadArtworks();
        }
      }
    },

    async getUsage() {
      return await getStorageUsage();
    }
  }
});
