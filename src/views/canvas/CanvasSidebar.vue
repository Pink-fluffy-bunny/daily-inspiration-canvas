<template>
  <div class="sidebar">
    <!-- 顶部：标题和灵感卡片 -->
    <div class="sidebar-header">
      <h1 class="app-title">🎨 每日灵感画板</h1>
      <InspirationCard />
    </div>

    <!-- 中间：工具栏 -->
    <div class="sidebar-main">
      <Toolbar />
    </div>

    <!-- 底部：画廊按钮 -->
    <div class="sidebar-footer">
      <button @click="openGallery" class="gallery-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
        <span>作品画廊</span>
        <span v-if="artworkCount > 0" class="badge">{{ artworkCount }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import InspirationCard from './InspirationCard.vue';
import Toolbar from './Toolbar.vue';
import { useCanvasStore } from '../../stores/canvasStore';

const router = useRouter();
const store = useCanvasStore();

const artworkCount = computed(() => store.savedArtworks.length);

const openGallery = () => {
  router.push('/');
};
</script>



<style scoped>
.sidebar {
  width: 320px;
  min-width: 320px;
  background: white;
  display: flex;
  flex-direction: column;
  height: 100%;
  border-right: 1px solid #E5E7EB;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
}

.sidebar-header {
  flex-shrink: 0;
  padding: 20px;
  border-bottom: 1px solid #E5E7EB;
}

.app-title {
  font-size: 1.3rem;
  margin: 0 0 16px 0;
  color: #374151;
  font-weight: 700;
}

.sidebar-main {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.sidebar-main::-webkit-scrollbar {
  width: 6px;
}

.sidebar-main::-webkit-scrollbar-track {
  background: #F3F4F6;
}

.sidebar-main::-webkit-scrollbar-thumb {
  background: #D1D5DB;
  border-radius: 3px;
}

.sidebar-main::-webkit-scrollbar-thumb:hover {
  background: #9CA3AF;
}

.sidebar-footer {
  flex-shrink: 0;
  padding: 20px;
  border-top: 1px solid #E5E7EB;
  background: #F9FAFB;
}

.gallery-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.gallery-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.gallery-btn:active {
  transform: translateY(0);
}

.gallery-btn svg {
  flex-shrink: 0;
}

.badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #EF4444;
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

@media (max-width: 1024px) {
  .sidebar {
    width: 280px;
    min-width: 280px;
  }
}
</style>

