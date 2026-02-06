<template>
  <div class="cover-editor">
    <h4>设置封面</h4>
    
    <!-- 封面预览 -->
    <div class="preview-container">
      <div class="preview-box">
        <div class="cover-area">
          <img 
            v-if="selectedArtwork" 
            :src="selectedArtwork.thumbnail" 
            :alt="selectedArtwork.prompt"
            :style="previewStyle"
          />
          <div v-else class="placeholder">
            请选择封面图片
          </div>
        </div>
        <div class="preview-overlay">
          <span class="preview-label">封面预览</span>
        </div>
      </div>
    </div>

    <!-- 作品选择 -->
    <div class="artwork-selector">
      <label class="selector-label">选择封面作品</label>
      <div class="artwork-grid">
        <div 
          v-for="artwork in albumArtworks" 
          :key="artwork.id"
          class="artwork-option"
          :class="{ selected: selectedArtwork?.id === artwork.id }"
          @click="selectArtwork(artwork)"
        >
          <img :src="artwork.thumbnail" :alt="artwork.prompt" />
        </div>
        <div 
          v-if="albumArtworks.length === 0"
          class="no-artworks"
        >
          画册中暂无作品
        </div>
      </div>
    </div>

    <!-- 调整控制 -->
    <div v-if="selectedArtwork" class="controls">
      <div class="control-group">
        <label class="control-label">
          缩放: {{ (scale * 100).toFixed(0) }}%
        </label>
        <input 
          type="range" 
          v-model="scale" 
          min="0.5" 
          max="3" 
          step="0.1"
          class="slider"
        />
      </div>
      
      <div class="control-group">
        <label class="control-label">位置调整</label>
        <div class="position-controls">
          <button 
            @click="adjustPosition(0, -10)" 
            class="pos-btn"
            title="向上移动"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
          </button>
          <button 
            @click="adjustPosition(0, 10)" 
            class="pos-btn"
            title="向下移动"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          <button 
            @click="adjustPosition(-10, 0)" 
            class="pos-btn"
            title="向左移动"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <button 
            @click="adjustPosition(10, 0)" 
            class="pos-btn"
            title="向右移动"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>

      <button @click="resetPosition" class="reset-btn">
        重置位置和缩放
      </button>
    </div>

    <!-- 操作按钮 -->
    <div class="actions">
      <button @click="saveCover" class="btn-primary">保存封面</button>
      <button @click="removeCover" class="btn-secondary" v-if="album.coverImageId">
        移除封面
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useCanvasStore } from '../../stores/canvasStore';
import type { Album, Artwork } from '../../types';

const props = defineProps<{
  album: Album;
}>();

const emit = defineEmits(['save', 'close']);

const store = useCanvasStore();

const scale = ref(1);
const offsetX = ref(0);
const offsetY = ref(0);
const selectedArtwork = ref<Artwork | null>(null);

// 获取画册中的所有作品
const albumArtworks = computed(() => {
  return store.savedArtworks.filter(art => art.albumId === props.album.id);
});

// 预览样式
const previewStyle = computed(() => {
  return {
    transform: `scale(${scale.value}) translate(${offsetX.value}px, ${offsetY.value}px)`
  };
});

// 初始化选中作品
watch(() => props.album, (newAlbum) => {
  if (newAlbum.coverImageId) {
    const artwork = store.savedArtworks.find(art => art.id === newAlbum.coverImageId);
    if (artwork) {
      selectedArtwork.value = artwork;
      scale.value = newAlbum.coverScale || 1;
      offsetX.value = newAlbum.coverOffsetX || 0;
      offsetY.value = newAlbum.coverOffsetY || 0;
    }
  } else {
    selectedArtwork.value = null;
    scale.value = 1;
    offsetX.value = 0;
    offsetY.value = 0;
  }
}, { immediate: true });

const selectArtwork = (artwork: Artwork) => {
  selectedArtwork.value = artwork;
  scale.value = 1;
  offsetX.value = 0;
  offsetY.value = 0;
};

const adjustPosition = (dx: number, dy: number) => {
  offsetX.value += dx;
  offsetY.value += dy;
};

const resetPosition = () => {
  scale.value = 1;
  offsetX.value = 0;
  offsetY.value = 0;
};

const saveCover = () => {
  if (!selectedArtwork.value) return;
  
  const updatedAlbum: Album = {
    ...props.album,
    coverImageId: selectedArtwork.value.id,
    coverScale: scale.value,
    coverOffsetX: offsetX.value,
    coverOffsetY: offsetY.value
  };
  
  emit('save', updatedAlbum);
};

const removeCover = () => {
  const updatedAlbum: Album = {
    ...props.album,
    coverImageId: undefined,
    coverScale: undefined,
    coverOffsetX: undefined,
    coverOffsetY: undefined
  };
  
  emit('save', updatedAlbum);
};
</script>

<style scoped>
.cover-editor {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cover-editor h4 {
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  color: #1F2937;
}

.preview-container {
  display: flex;
  justify-content: center;
}

.preview-box {
  width: 280px;
  aspect-ratio: 4/3;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  border: 2px solid #E5E7EB;
}

.cover-area {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: #F9FAFB;
}

.cover-area img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
}

.placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9CA3AF;
  font-size: 0.9rem;
}

.preview-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
  padding: 12px;
}

.preview-label {
  color: white;
  font-size: 0.85rem;
  font-weight: 600;
}

.artwork-selector {
  border-top: 1px solid #E5E7EB;
  padding-top: 16px;
}

.selector-label {
  display: block;
  margin-bottom: 12px;
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

.artwork-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.artwork-option {
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
  background: #F3F4F6;
}

.artwork-option:hover {
  border-color: #6366F1;
}

.artwork-option.selected {
  border-color: #6366F1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.artwork-option img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-artworks {
  grid-column: 1 / -1;
  padding: 20px;
  text-align: center;
  color: #9CA3AF;
  font-size: 0.9rem;
}

.controls {
  border-top: 1px solid #E5E7EB;
  padding-top: 16px;
}

.control-group {
  margin-bottom: 16px;
}

.control-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

.slider {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  background: #E5E7EB;
  border-radius: 3px;
  outline: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  background: #6366F1;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
}

.position-controls {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.pos-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  cursor: pointer;
  color: #4B5563;
  transition: all 0.2s;
}

.pos-btn:hover {
  background: #F3F4F6;
  border-color: #6366F1;
  color: #6366F1;
}

.pos-btn svg {
  display: block;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

.reset-btn {
  width: 100%;
  padding: 8px 16px;
  background: #F3F4F6;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  cursor: pointer;
  color: #4B5563;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.reset-btn:hover {
  background: #E5E7EB;
  color: #1F2937;
}

.actions {
  display: flex;
  gap: 12px;
  border-top: 1px solid #E5E7EB;
  padding-top: 16px;
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: 10px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  font-size: 0.9rem;
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
