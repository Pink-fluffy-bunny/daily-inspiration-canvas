<template>
  <div class="gallery-page">
    <GallerySidebar 
      @filter="handleFilter" 
      @import-success="onImportSuccess"
    />
    
    <!-- 画册宫格视图 -->
    <main v-if="viewMode === 'albums'" class="gallery-main albums-view">
      <AlbumGridView 
        @open-album="handleOpenAlbum"
      />
    </main>
    
    <!-- 作品列表视图 -->
    <main v-else class="gallery-main">
      <header class="gallery-header">
        <div class="header-left">
          <button @click="backToAlbums" class="back-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span>返回画册</span>
          </button>
          <div>
            <h2>{{ currentAlbumName }}</h2>
            <p v-if="currentAlbumDescription" class="album-description">{{ currentAlbumDescription }}</p>
          </div>
          <span class="count-badge">{{ filteredArtworks.length }}</span>
        </div>
        <div class="header-right">
          <button v-if="currentAlbum" @click="editCurrentAlbum" class="edit-album-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            编辑画册
          </button>
        </div>
      </header>

      <div v-if="filteredArtworks.length === 0" class="empty-state">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
        <p>没有找到匹配的作品</p>
      </div>

      <div v-else class="gallery-grid">
        <div
          v-for="artwork in filteredArtworks"
          :key="artwork.id"
          class="artwork-card"
        >
          <div class="artwork-image" @click="viewArtwork(artwork)">
            <img :src="artwork.thumbnail" :alt="artwork.prompt" />
          </div>
          <div class="artwork-info">
            <p class="artwork-title" v-if="artwork.title">{{ artwork.title }}</p>
            <p class="artwork-prompt">{{ artwork.prompt }}</p>
            <p class="artwork-description" v-if="artwork.description">
              {{ truncateText(artwork.description, 45) }}
            </p>
            <p class="artwork-date">{{ formatDate(artwork.createdAt) }}</p>
            <div class="artwork-tags" v-if="artwork.tags && artwork.tags.length > 0">
              <span v-for="tag in artwork.tags.slice(0, 3)" :key="tag" class="mini-tag">{{ tag }}</span>
              <span v-if="artwork.tags.length > 3" class="mini-tag">+{{ artwork.tags.length - 3 }}</span>
            </div>
          </div>
          <div class="artwork-actions">
            <button @click="viewArtwork(artwork)" class="action-btn" title="查看大图">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
            <button @click="editArtworkInfo(artwork)" class="action-btn" title="编辑信息">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
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
    </main>

    <!-- 查看大图模态框 -->
    <div v-if="selectedArtwork" class="modal" @click="closeModal">
      <div class="modal-content" @click.stop>
        <button class="close-btn" @click="closeModal" aria-label="关闭详情">
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2.5" 
            stroke-linecap="round" 
            stroke-linejoin="round"
            class="icon-svg"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="modal-body">
          <img :src="selectedArtwork.fullImage" :alt="selectedArtwork.prompt" />
          <div class="modal-info">
            <h3 v-if="selectedArtwork.title" class="modal-title">{{ selectedArtwork.title }}</h3>
            <p class="modal-prompt">{{ selectedArtwork.prompt }}</p>
            <p class="modal-date">创作于：{{ formatDate(selectedArtwork.createdAt) }}</p>
            <p v-if="selectedArtwork.description" class="modal-description">{{ selectedArtwork.description }}</p>
            <div v-if="selectedArtwork.tags && selectedArtwork.tags.length > 0" class="modal-tags">
              <span v-for="tag in selectedArtwork.tags" :key="tag" class="modal-tag">{{ tag }}</span>
            </div>
            <div class="modal-actions">
              <button @click="enterMagicalLumina(selectedArtwork!)" class="modal-btn magical">
                ✨ 进入魔法光影
              </button>
              <button @click="downloadArtwork(selectedArtwork!)" class="modal-btn primary">
                下载原图
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 作品信息编辑器 -->
    <ArtworkInfoEditor
      v-if="editingArtwork"
      :is-visible="isEditorVisible"
      :artwork="editingArtwork"
      @close="closeEditor"
    />

    <!-- 画册编辑器 -->
    <AlbumEditor
      v-if="editingAlbum"
      :is-visible="isAlbumEditorVisible"
      :album="editingAlbum"
      @close="closeAlbumEditor"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCanvasStore } from '../../stores/canvasStore';
import type { Artwork, Album } from '../../types';
import GallerySidebar from './GallerySidebar.vue';
import ArtworkInfoEditor from '../../components/common/ArtworkInfoEditor.vue';
import AlbumGridView from './AlbumGridView.vue';
import AlbumEditor from './AlbumEditor.vue';

const store = useCanvasStore();
const router = useRouter();

const viewMode = ref<'albums' | 'artworks'>('albums');
const filterCriteria = ref({ query: '', albumId: '' });
const selectedArtwork = ref<Artwork | null>(null);
const editingArtwork = ref<Artwork | null>(null);
const isEditorVisible = ref(false);
const editingAlbum = ref<Album | null>(null);
const isAlbumEditorVisible = ref(false);

onMounted(async () => {
  // 确保数据已加载
  if (!store.isInitialized) {
    await store.loadAllData();
  }
});

const currentAlbum = computed(() => {
  if (!filterCriteria.value.albumId) return null;
  return store.albums.find(a => a.id === filterCriteria.value.albumId) || null;
});

const currentAlbumName = computed(() => {
  if (!filterCriteria.value.albumId) return '全部作品';
  const album = currentAlbum.value;
  return album ? album.name : '全部作品';
});

const currentAlbumDescription = computed(() => {
  const album = currentAlbum.value;
  return album?.description;
});

const filteredArtworks = computed(() => {
  let list = [...store.savedArtworks];
  
  // 按画册过滤
  if (filterCriteria.value.albumId) {
    list = list.filter(art => art.albumId === filterCriteria.value.albumId);
  }
  
  // 未分类视图：只显示没有画册的作品
  if (filterCriteria.value.albumId === '' && viewMode.value === 'artworks') {
    list = list.filter(art => !art.albumId);
  }
  
  // 按搜索词过滤 (标题、提示词、标签)
  if (filterCriteria.value.query) {
    const q = filterCriteria.value.query.toLowerCase();
    list = list.filter(art => 
      (art.title?.toLowerCase().includes(q)) || 
      (art.prompt.toLowerCase().includes(q)) ||
      (art.tags?.some(tag => tag.toLowerCase().includes(q)))
    );
  }
  
  // 排序
  return list.sort((a, b) => b.createdAt - a.createdAt);
});

const handleFilter = (criteria: { query: string, albumId: string }) => {
  filterCriteria.value = criteria;
  // 如果选择了画册，切换到作品视图
  if (criteria.albumId) {
    viewMode.value = 'artworks';
  }
};

const onImportSuccess = () => {
  // 可选：显示成功提示
};

const handleOpenAlbum = (albumId: string) => {
  filterCriteria.value = { query: '', albumId };
  viewMode.value = 'artworks';
};

const backToAlbums = () => {
  filterCriteria.value = { query: '', albumId: '' };
  viewMode.value = 'albums';
};

const editCurrentAlbum = () => {
  if (currentAlbum.value) {
    editingAlbum.value = currentAlbum.value;
    isAlbumEditorVisible.value = true;
  }
};

const closeAlbumEditor = () => {
  isAlbumEditorVisible.value = false;
  editingAlbum.value = null;
};

const viewArtwork = (artwork: Artwork) => {
  selectedArtwork.value = artwork;
};

const closeModal = () => {
  selectedArtwork.value = null;
};

const editArtworkInfo = (artwork: Artwork) => {
  editingArtwork.value = artwork;
  isEditorVisible.value = true;
};

const closeEditor = () => {
  isEditorVisible.value = false;
  editingArtwork.value = null;
};

const enterMagicalLumina = (artwork: Artwork) => {
  router.push({ name: 'Lumina', params: { id: artwork.id } });
};

const downloadArtwork = (artwork: Artwork) => {
  const link = document.createElement('a');
  link.download = `artwork-${artwork.id}.png`;
  link.href = artwork.fullImage;
  link.click();
};

const deleteArtwork = async (artwork: Artwork) => {
  if (confirm('确定要删除这幅作品吗？')) {
    await store.removeArtwork(artwork.id);
  }
};

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const truncateText = (text: string, maxLength: number) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};
</script>

<style scoped>
.gallery-page {
  display: flex;
  height: 100vh;
  width: 100%;
  max-width: 100%;
  background: #F3F4F6;
  overflow: hidden;
}

.gallery-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
  min-width: 0;
}

.gallery-header {
  padding: 24px 40px;
  background: white;
  border-bottom: 1px solid #E5E7EB;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #F3F4F6;
  border: none;
  border-radius: 8px;
  color: #4B5563;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.back-btn:hover {
  background: #E5E7EB;
  color: #1F2937;
}

.header-right {
  display: flex;
  gap: 12px;
}

.edit-album-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  color: #4B5563;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.edit-album-btn svg {
  flex-shrink: 0;
}

.edit-album-btn:hover {
  background: #F3F4F6;
  border-color: #6366F1;
  color: #6366F1;
}

.album-description {
  margin: 0;
  font-size: 0.85rem;
  color: #6B7280;
  max-width: 400px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-left h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #1F2937;
  font-weight: 700;
}

.count-badge {
  background: #EEF2FF;
  color: #6366F1;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.gallery-grid {
  flex: 1;
  overflow-y: auto;
  padding: 30px 40px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 24px;
  align-content: flex-start;
}

.artwork-card {
  background: white;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #F3F4F6;
  position: relative;
}

.artwork-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.artwork-image {
  width: 100%;
  aspect-ratio: 1;
  cursor: pointer;
  background: #F9FAFB;
  overflow: hidden;
  border-radius: 16px 16px 0 0;
}

.artwork-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.artwork-info {
  padding: 16px;
  flex: 1;
}

.artwork-title {
  margin: 0 0 6px 0;
  font-weight: 700;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.artwork-prompt {
  margin: 0 0 8px 0;
  font-size: 0.85rem;
  color: #4B5563;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.artwork-description {
  margin: 0 0 10px 0;
  font-size: 0.8rem;
  color: #6B7280;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
}

.artwork-date {
  font-size: 0.75rem;
  color: #9CA3AF;
  margin-bottom: 10px;
}

.artwork-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.mini-tag {
  background: #F3F4F6;
  color: #6B7280;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
}

.artwork-actions {
  display: flex;
  gap: 6px;
  padding: 0 12px 12px;
}

.action-btn {
  flex: 1;
  min-width: 0;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  cursor: pointer;
  color: #6B7280;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #F9FAFB;
  border-color: #6366F1;
  color: #6366F1;
}

.action-btn.danger:hover {
  background: #FEF2F2;
  border-color: #EF4444;
  color: #EF4444;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9CA3AF;
  background: white;
  margin: 40px;
  border-radius: 20px;
  border: 2px dashed #E5E7EB;
}

/* Modal */
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 40px;
}

.modal-content {
  background: white;
  border-radius: 24px;
  max-width: 1200px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

.modal-body {
  display: flex;
  flex: 1;
  min-height: 0;
}

.modal-body img {
  width: 65%;
  max-height: 100%;
  object-fit: contain;
  background: #F9FAFB;
}

.modal-info {
  flex: 1;
  padding: 40px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.modal-title {
  font-size: 2rem;
  margin: 0 0 16px 0;
  color: #111827;
}

.modal-prompt {
  font-size: 1.1rem;
  color: #4B5563;
  margin-bottom: 24px;
  line-height: 1.6;
}

.modal-description {
  color: #6B7280;
  margin-bottom: 24px;
  white-space: pre-wrap;
}

.modal-btn {
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  border: none;
}

.modal-btn.primary {
  background: #6366F1;
  color: white;
}

.modal-btn.magical {
  background: linear-gradient(135deg, #8B5CF6 0%, #D946EF 100%);
  color: white;
  margin-right: 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
}

.modal-btn.magical:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(217, 70, 239, 0.4);
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: white;
  border: 1px solid #E5E7EB;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  color: #1F2937; /* 加深颜色 */
  z-index: 20;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.icon-svg {
  display: block;
  flex-shrink: 0;
}

.close-btn:hover {
  background: #F3F4F6;
  color: #111827;
  transform: scale(1.1);
}

@media (max-width: 1024px) {
  .modal-body {
    flex-direction: column;
  }
  .modal-body img {
    width: 100%;
    max-height: 50vh;
  }
}
</style>
