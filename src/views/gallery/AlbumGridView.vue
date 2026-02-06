<template>
  <div class="album-grid-view">
    <header class="grid-header">
      <h2>我的画册</h2>
      <button @click="createNewAlbum" class="create-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        新建画册
      </button>
    </header>

    <div class="albums-container">
      <!-- 未分类 -->
      <div class="album-card" @click="openAlbum('')">
        <div class="album-cover">
          <div class="cover-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </div>
          <div class="cover-overlay"></div>
        </div>
        <div class="album-info">
          <h3>未分类</h3>
          <p class="album-desc">{{ uncategorizedCount }} 幅作品</p>
        </div>
      </div>

      <!-- 所有画册 -->
      <div 
        v-for="album in albums" 
        :key="album.id" 
        class="album-card"
        @click="openAlbum(album.id)"
      >
        <div class="album-cover">
          <img 
            v-if="coverImage(album)" 
            :src="coverImage(album)!.thumbnail" 
            :alt="album.name"
            :style="getCoverStyle(album)"
          />
          <div v-else class="cover-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          </div>
          <div class="cover-overlay"></div>
        </div>
        <div class="album-info">
          <h3>{{ album.name }}</h3>
          <p class="album-desc" v-if="album.description">{{ album.description }}</p>
          <p class="album-count">{{ getAlbumCount(album.id) }} 幅作品</p>
        </div>
        <button @click.stop="editAlbum(album)" class="edit-btn" title="编辑画册">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- 画册编辑器 -->
    <AlbumEditor
      v-if="editingAlbum"
      :is-visible="isEditorVisible"
      :album="editingAlbum"
      @close="closeEditor"
    />

    <!-- 新建画册模态框 -->
    <div v-if="showCreateModal" class="modal" @click="closeCreateModal">
      <div class="modal-content" @click.stop>
        <h3>新建画册</h3>
        <input 
          v-model="newAlbumName" 
          type="text" 
          placeholder="画册名称" 
          ref="nameInput"
          @keyup.enter="confirmCreateAlbum"
        />
        <textarea 
          v-model="newAlbumDescription" 
          placeholder="画册介绍 (可选)" 
          rows="3"
        ></textarea>
        <div class="modal-actions">
          <button @click="confirmCreateAlbum" class="btn-primary">确定</button>
          <button @click="closeCreateModal" class="btn-secondary">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { useCanvasStore } from '../../stores/canvasStore';
import type { Album } from '../../types';
import AlbumEditor from './AlbumEditor.vue';

const store = useCanvasStore();

const editingAlbum = ref<Album | null>(null);
const isEditorVisible = ref(false);
const showCreateModal = ref(false);
const newAlbumName = ref('');
const newAlbumDescription = ref('');
const nameInput = ref<HTMLInputElement | null>(null);

const albums = computed(() => store.albums);

const uncategorizedArtworks = computed(() => {
  return store.savedArtworks.filter(art => !art.albumId);
});

const uncategorizedCount = computed(() => uncategorizedArtworks.value.length);

const emit = defineEmits(['open-album']);

const openAlbum = (albumId: string) => {
  emit('open-album', albumId);
};

const getAlbumCount = (albumId: string) => {
  return store.savedArtworks.filter(art => art.albumId === albumId).length;
};

const coverImage = (album: Album) => {
  if (!album.coverImageId) {
    // 如果没有设置封面，返回第一幅作品
    const artworks = store.savedArtworks.filter(art => art.albumId === album.id);
    return artworks.length > 0 ? artworks[0] : null;
  }
  return store.savedArtworks.find(art => art.id === album.coverImageId) || null;
};

const getCoverStyle = (album: Album) => {
  return {
    transform: `scale(${album.coverScale || 1}) translate(${album.coverOffsetX || 0}px, ${album.coverOffsetY || 0}px)`
  };
};

const editAlbum = (album: Album) => {
  editingAlbum.value = album;
  isEditorVisible.value = true;
};

const closeEditor = () => {
  isEditorVisible.value = false;
  editingAlbum.value = null;
};

const createNewAlbum = () => {
  showCreateModal.value = true;
  newAlbumName.value = '';
  newAlbumDescription.value = '';
  nextTick(() => {
    nameInput.value?.focus();
  });
};

const closeCreateModal = () => {
  showCreateModal.value = false;
};

const confirmCreateAlbum = async () => {
  if (newAlbumName.value.trim()) {
    await store.addAlbum(newAlbumName.value.trim(), newAlbumDescription.value.trim());
    showCreateModal.value = false;
  }
};
</script>

<style scoped>
.album-grid-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 30px 40px;
  overflow-y: auto;
}

.grid-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.grid-header h2 {
  margin: 0;
  font-size: 1.8rem;
  color: #1F2937;
  font-weight: 700;
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

.albums-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.album-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #F3F4F6;
  position: relative;
}

.album-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.album-cover {
  width: 100%;
  aspect-ratio: 4/3;
  position: relative;
  overflow: hidden;
  background: #F9FAFB;
}

.album-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #D1D5DB;
}

.cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.5) 100%);
}

.album-info {
  padding: 16px;
}

.album-info h3 {
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #111827;
}

.album-desc {
  margin: 0 0 6px 0;
  font-size: 0.85rem;
  color: #6B7280;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.album-count {
  margin: 0;
  font-size: 0.8rem;
  color: #9CA3AF;
}

.edit-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  background: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  color: #6B7280;
  opacity: 0;
  transition: all 0.2s;
}

.album-card:hover .edit-btn {
  opacity: 1;
}

.edit-btn:hover {
  background: #F3F4F6;
  color: #6366F1;
}

.edit-btn svg {
  display: block;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

/* Modal */
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 40px;
}

.modal-content {
  background: white;
  border-radius: 20px;
  padding: 32px;
  max-width: 480px;
  width: 100%;
}

.modal-content h3 {
  margin: 0 0 20px 0;
  font-size: 1.5rem;
  color: #1F2937;
}

.modal-content input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  font-size: 0.95rem;
  margin-bottom: 12px;
  transition: all 0.2s;
}

.modal-content input:focus {
  outline: none;
  border-color: #6366F1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.modal-content textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  font-size: 0.95rem;
  margin-bottom: 20px;
  resize: vertical;
  font-family: inherit;
  transition: all 0.2s;
}

.modal-content textarea:focus {
  outline: none;
  border-color: #6366F1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.modal-actions {
  display: flex;
  gap: 12px;
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-primary {
  background: #6366F1;
  color: white;
}

.btn-primary:hover {
  background: #4F46E5;
}

.btn-secondary {
  background: #E5E7EB;
  color: #4B5563;
}

.btn-secondary:hover {
  background: #D1D5DB;
}
</style>
