<template>
  <div class="toolbar">
    <!-- 工具选择 -->
    <div class="tool-section">
      <label>工具</label>
      <div class="tool-buttons">
        <button
          :class="['tool-btn', { active: currentTool === 'brush' }]"
          @click="setTool('brush')"
          title="画笔"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13.5c0 2.5-2 4.5-5 4.5h-3c-1.66 0-3-1.34-3-3V9l8-5 8 5v6c0 2.5-2 4.5-5 4.5"></path>
            <path d="M10 9l8-5 8 5"></path>
          </svg>
          <span>画笔</span>
        </button>
        <button
          :class="['tool-btn', { active: currentTool === 'eraser' }]"
          @click="setTool('eraser')"
          title="橡皮擦"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 20H7L3 16C2 15 2 13 3 12L13 2L22 11L20 20Z"></path>
            <path d="M17 17L7 7"></path>
          </svg>
          <span>橡皮</span>
        </button>
      </div>
    </div>

    <!-- 画笔大小 -->
    <div class="tool-section">
      <label>大小: {{ brushSize }}px</label>
      <input
        type="range"
        v-model.number="brushSize"
        min="1"
        max="50"
        class="size-slider"
      />
      <div class="brush-preview" :style="{ width: brushSize + 'px', height: brushSize + 'px' }"></div>
    </div>

    <!-- 颜色选择器 -->
    <div class="tool-section" v-if="currentTool === 'brush'">
      <label>颜色</label>
      <ColorPicker />
    </div>

    <!-- 操作按钮 -->
    <div class="tool-section actions">
      <label>操作</label>
      <div class="action-buttons">
        <button
          class="action-btn"
          @click="undo"
          :disabled="!canUndo"
          title="撤销 (Ctrl+Z)"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 7v6h6"></path>
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path>
          </svg>
        </button>
        <button
          class="action-btn"
          @click="redo"
          :disabled="!canRedo"
          title="重做 (Ctrl+Y)"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 7v6h-6"></path>
            <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"></path>
          </svg>
        </button>
        <button
          class="action-btn danger"
          @click="confirmClear"
          title="清空画布"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18"></path>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- 保存和下载 -->
    <div class="tool-section">
      <label>保存</label>
      <div class="action-buttons">
        <button class="action-btn primary" @click="save" title="保存到画廊">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
          <span>保存</span>
        </button>
        <button class="action-btn success" @click="download" title="下载图片">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <span>下载</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useCanvasStore } from '../../stores/canvasStore';
import ColorPicker from './ColorPicker.vue';

const store = useCanvasStore();

const currentTool = computed(() => store.currentTool);
const brushSize = computed({
  get: () => store.brushSize,
  set: (value) => { store.brushSize = value; }
});
const canUndo = computed(() => store.canUndo);
const canRedo = computed(() => store.canRedo);

const setTool = (tool: 'brush' | 'eraser') => {
  store.currentTool = tool;
};

const undo = () => {
  store.undo();
};

const redo = () => {
  store.redo();
};

const confirmClear = () => {
  if (confirm('确定要清空画布吗？此操作无法撤销。')) {
    store.clearCanvas();
  }
};

const save = async () => {
  const success = await store.saveArtwork();
  if (success) {
    alert('作品已保存到画廊！');
  } else {
    alert('保存失败，请重试或清理一些旧作品。');
  }
};

const download = () => {
  store.downloadImage();
};
</script>


<style scoped>
.toolbar {
  background: transparent;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.tool-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tool-section label {
  font-weight: 600;
  color: #374151;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tool-buttons,
.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tool-btn,
.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 12px;
  border: 2px solid #E5E7EB;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  color: #374151;
  transition: all 0.2s ease;
  flex: 1;
  min-width: 80px;
}

.tool-btn:hover,
.action-btn:hover:not(:disabled) {
  border-color: #667eea;
  /* background: #F9FAFB; */
}

.tool-btn.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.tool-btn svg,
.action-btn svg {
  flex-shrink: 0;
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
}

.action-btn.primary:hover {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.action-btn.success {
  background: linear-gradient(135deg, #6BCB77 0%, #4ECDC4 100%);
  color: white;
  border-color: transparent;
}

.action-btn.success:hover {
  /* opacity: 0.9; */
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(107, 203, 119, 0.3);
}

.action-btn.danger {
  color: #EF4444;
  border-color: #FECACA;
}

.action-btn.danger:hover {
  background: #FEF2F2;
  border-color: #EF4444;
}

.size-slider {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  background: #E5E7EB;
  border-radius: 3px;
  outline: none;
}

.size-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  cursor: pointer;
  transition: all 0.2s ease;
}

.size-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.2);
}

.brush-preview {
  background: #374151;
  border-radius: 50%;
  margin: 0 auto;
  transition: all 0.2s ease;
}
</style>
