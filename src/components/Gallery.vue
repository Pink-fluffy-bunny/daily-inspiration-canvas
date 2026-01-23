<template>
  <div class="gallery">
    <div class="gallery-header">
      <h2>🖼️ 作品画廊</h2>
      <div class="gallery-stats">
        <span>{{ artworks.length }} / {{ maxArtworks }} 作品</span>
        <span v-if="storageUsage.totalSize > 0">
          | {{ formatSize(storageUsage.totalSize) }}
        </span>
      </div>
    </div>

    <div v-if="artworks.length === 0" class="empty-state">
      <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 21"></polyline>
      </svg>
      <p>还没有保存的作品</p>
      <p class="hint">完成创作后点击"保存"按钮</p>
    </div>

    <div v-else class="gallery-grid">
      <div
        v-for="artwork in sortedArtworks"
        :key="artwork.id"
        class="artwork-card"
      >
        <div class="artwork-image" @click="viewArtwork(artwork)">
          <img :src="artwork.thumbnail" :alt="artwork.prompt" />
        </div>
        <div class="artwork-info">
          <p class="artwork-prompt">{{ artwork.prompt }}</p>
          <p class="artwork-date">{{ formatDate(artwork.createdAt) }}</p>
        </div>
        <div class="artwork-actions">
          <button @click="viewArtwork(artwork)" class="action-btn" title="查看大图">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
          <button @click="downloadArtwork(artwork)" class="action-btn" title="下载">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
          <button @click="deleteArtwork(artwork)" class="action-btn danger" title="删除">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div v-if="artworks.length > 0" class="gallery-footer">
      <button @click="confirmClearAll" class="clear-all-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 6h18"></path>
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
        </svg>
        清空画廊
      </button>
    </div>

    <!-- 查看大图模态框 -->
    <!-- 查看大图模态框 -->
    <div v-if="selectedArtwork" class="modal" @click="closeModal">
      <div class="modal-content" @click.stop>
        <button class="close-btn" @click="closeModal">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <img :src="selectedArtwork.fullImage" :alt="selectedArtwork.prompt" />
        <div class="modal-info">
          <p class="modal-prompt">{{ selectedArtwork.prompt }}</p>
          <p class="modal-date">{{ formatDate(selectedArtwork.createdAt) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCanvasStore } from '../stores/canvasStore';
import type { Artwork } from '../types';

const store = useCanvasStore();

const artworks = computed(() => store.savedArtworks);
const maxArtworks = computed(() => store.maxArtworks);
const storageUsage = computed(() => store.storageUsage);
const selectedArtwork = ref<Artwork | null>(null);

// 定义 emit
const emit = defineEmits<{
  close: []
}>();

const sortedArtworks = computed(() => {
  return [...artworks.value].sort((a, b) => b.createdAt - a.createdAt);
});

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const viewArtwork = (artwork: Artwork) => {
  selectedArtwork.value = artwork;
};

const closeModal = () => {
  selectedArtwork.value = null;
};

const downloadArtwork = (artwork: Artwork) => {
  const link = document.createElement('a');
  link.download = `artwork-${artwork.id}.png`;
  link.href = artwork.fullImage;
  link.click();
};

const deleteArtwork = (artwork: Artwork) => {
  if (confirm('确定要删除这幅作品吗？')) {
    store.removeArtwork(artwork.id);
  }
};

const confirmClearAll = () => {
  if (confirm('确定要清空所有作品吗？此操作无法撤销。')) {
    store.removeAllArtworks();
    emit('close');
  }
};
</script>

<style scoped>
.gallery {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.gallery-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #374151;
}

.gallery-stats {
  font-size: 0.9rem;
  color: #6B7280;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #9CA3AF;
}

.empty-state svg {
  margin-bottom: 16px;
  color: #D1D5DB;
}

.empty-state p {
  margin: 8px 0;
}

.empty-state .hint {
  font-size: 0.9rem;
  color: #9CA3AF;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.artwork-card {
  background: #F9FAFB;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.artwork-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.artwork-image {
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  cursor: pointer;
  background: white;
}

.artwork-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.artwork-card:hover .artwork-image img {
  transform: scale(1.05);
}

.artwork-info {
  padding: 12px;
}

.artwork-prompt {
  margin: 0 0 4px 0;
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.artwork-date {
  margin: 0;
  font-size: 0.8rem;
  color: #9CA3AF;
}

.artwork-actions {
  display: flex;
  gap: 4px;
  padding: 0 12px 12px;
}

.action-btn {
  flex: 1;
  padding: 6px;
  border: 1px solid #E5E7EB;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  color: #6B7280;
}

.action-btn:hover {
  background: #F3F4F6;
  border-color: #D1D5DB;
}

.action-btn.danger {
  color: #EF4444;
  border-color: #FECACA;
}

.action-btn.danger:hover {
  background: #FEF2F2;
  border-color: #EF4444;
}

.gallery-footer {
  display: flex;
  justify-content: center;
  padding-top: 16px;
  border-top: 1px solid #E5E7EB;
}

.clear-all-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: white;
  border: 1px solid #EF4444;
  color: #EF4444;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.clear-all-btn:hover {
  background: #FEF2F2;
  border-color: #DC2626;
  color: #DC2626;
}

/* Modal - 用于查看单个作品大图 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

.modal-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

.modal-content img {
  max-width: 100%;
  max-height: 80vh;
  display: block;
  object-fit: contain;
}

.modal-info {
  padding: 16px 20px;
  background: white;
}

.modal-prompt {
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  font-weight: 500;
  color: #374151;
}

.modal-date {
  margin: 0;
  font-size: 0.9rem;
  color: #9CA3AF;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.7);
  transform: rotate(90deg);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .gallery-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .artwork-prompt {
    font-size: 0.8rem;
  }
}
</style>
