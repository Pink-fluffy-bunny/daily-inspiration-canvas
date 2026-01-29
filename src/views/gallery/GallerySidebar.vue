<template>
  <div class="gallery-sidebar">
    <div class="sidebar-header">
      <button @click="backToCanvas" class="back-btn">
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="2.5" 
          stroke-linecap="round" 
          stroke-linejoin="round"
          style="display: block; flex-shrink: 0;"
        >
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        <span>返回画布</span>
      </button>

      <h1 class="sidebar-title">🖼️ 作品画廊</h1>
    </div>

    <div class="sidebar-section">
      <div class="search-box">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="搜索作品、标签或画册..." 
          @input="onSearch"
        />
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </div>
    </div>

    <div class="sidebar-section">
      <button @click="triggerImport" class="import-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        <span>导入作品</span>
      </button>
      <input 
        type="file" 
        ref="fileInput" 
        style="display: none" 
        accept="image/jpeg,image/png" 
        @change="handleFileChange"
      />
    </div>

    <div class="sidebar-section albums-section">
      <div class="section-title">
        <h3>画册管理</h3>
        <button @click="showAddAlbum = true" class="add-album-btn">+</button>
      </div>
      
      <!-- 新增画册输入框 -->
      <div v-if="showAddAlbum" class="add-album-form">
        <input v-model="newAlbumName" type="text" placeholder="画册名称" />
        <textarea v-model="newAlbumDescription" placeholder="画册介绍 (可选)" rows="2"></textarea>
        <div class="form-actions">
          <button @click="createAlbum">确定</button>
          <button @click="showAddAlbum = false" class="cancel">取消</button>
        </div>
      </div>


      <div class="album-list">
        <div 
          class="album-item" 
          :class="{ active: selectedAlbumId === '' }"
          @click="selectAlbum('')"
        >
          <span>🏠 全部作品</span>
        </div>
        <div 
          v-for="album in albums" 
          :key="album.id" 
          class="album-item"
          :class="{ active: selectedAlbumId === album.id }"
          @click="selectAlbum(album.id)"
        >
          <div class="album-info">
            <span class="album-name">{{ album.name }}</span>
            <span v-if="album.description" class="album-desc">{{ album.description }}</span>
          </div>
          <div class="album-actions">
            <button @click.stop="deleteAlbum(album.id)" class="del-btn">×</button>
          </div>
        </div>
      </div>
    </div>

    <div class="sidebar-footer">
      <div class="storage-info">
        <div class="storage-text">
          <span>存储容量</span>
          <span>{{ usage.count }} / {{ usage.maxCount }}</span>
        </div>
        <div class="storage-bar">
          <div class="storage-fill" :style="{ width: usage.usedPercentage + '%' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useCanvasStore } from '../../stores/canvasStore';

const router = useRouter();
const store = useCanvasStore();

const searchQuery = ref('');
const fileInput = ref<HTMLInputElement | null>(null);
const showAddAlbum = ref(false);
const newAlbumName = ref('');
const newAlbumDescription = ref('');
const selectedAlbumId = ref('');

const usage = ref({ count: 0, maxCount: 1000, usedPercentage: 0 });

const albums = computed(() => store.albums);

const emit = defineEmits(['filter', 'import-success']);

onMounted(async () => {
  await updateUsage();
});

const updateUsage = async () => {
  usage.value = await store.getUsage();
};

const backToCanvas = () => {
  router.push('/canvas');
};

const triggerImport = () => {
  fileInput.value?.click();
};

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    const success = await store.importArtwork(file, selectedAlbumId.value || undefined);
    if (success) {
      await updateUsage();
      emit('import-success');
    }
  }
};

const createAlbum = async () => {
  if (newAlbumName.value.trim()) {
    await store.addAlbum(newAlbumName.value.trim(), newAlbumDescription.value.trim());
    newAlbumName.value = '';
    newAlbumDescription.value = '';
    showAddAlbum.value = false;
  }
};


const deleteAlbum = async (id: string) => {
  if (confirm('确定要删除这个画册吗？（画册中的作品将变为未分类）')) {
    await store.removeAlbum(id);
    if (selectedAlbumId.value === id) {
      selectAlbum('');
    }
  }
};

const selectAlbum = (id: string) => {
  selectedAlbumId.value = id;
  onSearch();
};

const onSearch = () => {
  emit('filter', { query: searchQuery.value, albumId: selectedAlbumId.value });
};

// 监听 store 中的变化以更新用量
watch(() => store.savedArtworks.length, updateUsage);
</script>

<style scoped>
.gallery-sidebar {
  width: 280px;
  flex-shrink: 0;
  background: white;
  border-right: 1px solid #E5E7EB;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-shadow: 4px 0 12px rgba(0, 0, 0, 0.05);
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid #F3F4F6;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #F3F4F6;
  border: none;
  border-radius: 8px;
  color: #4B5563;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 20px;
}

.back-btn:hover {
  background: #E5E7EB;
  color: #1F2937;
}

.sidebar-title {
  font-size: 1.4rem;
  font-weight: 800;
  color: #1F2937;
  margin: 0;
}

.sidebar-section {
  padding: 20px;
  border-bottom: 1px solid #F3F4F6;
}

.search-box {
  position: relative;
}

.search-box input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  background: #F9FAFB;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.search-box input:focus {
  outline: none;
  border-color: #6366F1;
  background: white;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #9CA3AF;
}

.import-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px;
  background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.import-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-title h3 {
  font-size: 0.9rem;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.add-album-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #EEF2FF;
  color: #6366F1;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}

.album-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.album-item {
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;
  color: #4B5563;
}

.album-item:hover {
  background: #F3F4F6;
}

.album-item.active {
  background: #EEF2FF;
  color: #6366F1;
  font-weight: 600;
}

.album-info {
  display: flex;
  flex-direction: column;
}

.album-desc {
  font-size: 0.75rem;
  color: #9CA3AF;
  font-weight: normal;
}

.del-btn {
  background: transparent;
  border: none;
  color: #9CA3AF;
  font-size: 1.2rem;
  line-height: 1;
  padding: 0 4px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.album-item:hover .del-btn {
  opacity: 1;
}

.del-btn:hover {
  color: #EF4444;
}

.add-album-form {
  margin-bottom: 12px;
  padding: 10px;
  background: #F9FAFB;
  border-radius: 8px;
}

.add-album-form input {
  width: 100%;
  padding: 8px;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  margin-bottom: 8px;
}

.add-album-form textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  margin-bottom: 8px;
  resize: vertical;
  font-family: inherit;
  font-size: 0.85rem;
}

.form-actions {

  display: flex;
  gap: 8px;
}

.form-actions button {
  flex: 1;
  padding: 6px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
}

.form-actions button:first-child {
  background: #6366F1;
  color: white;
}

.form-actions button.cancel {
  background: #E5E7EB;
  color: #4B5563;
}

.sidebar-footer {
  margin-top: auto;
  padding: 20px;
  background: #FAFAFA;
}

.storage-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.storage-text {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #6B7280;
}

.storage-bar {
  height: 6px;
  background: #E5E7EB;
  border-radius: 3px;
  overflow: hidden;
}

.storage-fill {
  height: 100%;
  background: #10B981;
  border-radius: 3px;
  transition: width 0.3s ease;
}
</style>
