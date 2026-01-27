<template>
  <div class="canvas-board">
    <canvas
      ref="canvasRef"
      @mousedown="startDrawing"
      @mousemove="draw"
      @mouseup="stopDrawing"
      @mouseleave="stopDrawing"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="stopDrawing"
    ></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useCanvasStore } from '../../stores/canvasStore';
import { getCanvasCoordinates, getTouchCoordinates, drawLine, eraseArea, setCanvasBackground } from '../../utils/canvasUtils';

const store = useCanvasStore();
const canvasRef = ref<HTMLCanvasElement | null>(null);
const isDrawing = ref(false);
const lastX = ref(0);
const lastY = ref(0);

onMounted(() => {
  if (canvasRef.value) {
    const canvas = canvasRef.value;
    const parent = canvas.parentElement;
    
    // 设置画布大小以填充父容器
    canvas.width = parent?.offsetWidth || canvas.offsetWidth;
    canvas.height = parent?.offsetHeight || canvas.offsetHeight;
    
    // 设置白色背景
    setCanvasBackground(canvas);
    
    // 初始化store
    store.initCanvas(canvas);
    
    // 保存初始状态到历史记录
    setTimeout(() => {
      store.saveToHistory();
    }, 100);
    
    // 监听窗口大小变化
    window.addEventListener('resize', handleResize);
    
    // 监听键盘快捷键
    window.addEventListener('keydown', handleKeyDown);
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('keydown', handleKeyDown);
});

const handleResize = () => {
  if (canvasRef.value) {
    const parent = canvasRef.value.parentElement;
    
    // 保存当前画布内容
    const imageData = canvasRef.value.getContext('2d')?.getImageData(0, 0, canvasRef.value.width, canvasRef.value.height);
    
    // 调整大小以填充父容器
    canvasRef.value.width = parent?.offsetWidth || canvasRef.value.offsetWidth;
    canvasRef.value.height = parent?.offsetHeight || canvasRef.value.offsetHeight;
    
    // 恢复白色背景
    setCanvasBackground(canvasRef.value);
    
    // 恢复内容（如果有）
    if (imageData) {
      canvasRef.value.getContext('2d')?.putImageData(imageData, 0, 0);
    }
  }
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      store.undo();
    } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
      e.preventDefault();
      store.redo();
    }
  }
};

const startDrawing = (e: MouseEvent) => {
  if (!canvasRef.value) return;
  
  isDrawing.value = true;
  const coords = getCanvasCoordinates(canvasRef.value, e.clientX, e.clientY);
  lastX.value = coords.x;
  lastY.value = coords.y;
};

const draw = (e: MouseEvent) => {
  if (!isDrawing.value || !canvasRef.value) return;
  
  const coords = getCanvasCoordinates(canvasRef.value, e.clientX, e.clientY);
  
  if (store.currentTool === 'brush') {
    drawLine(
      canvasRef.value,
      lastX.value,
      lastY.value,
      coords.x,
      coords.y,
      store.brushColor,
      store.brushSize
    );
  } else if (store.currentTool === 'eraser') {
    eraseArea(canvasRef.value, coords.x, coords.y, store.brushSize);
  }
  
  lastX.value = coords.x;
  lastY.value = coords.y;
};

const stopDrawing = () => {
  if (isDrawing.value) {
    isDrawing.value = false;
    store.saveToHistory();
  }
};

const handleTouchStart = (e: TouchEvent) => {
  e.preventDefault();
  if (!canvasRef.value || e.touches.length === 0) return;
  
  isDrawing.value = true;
  const touch = e.touches[0]!;
  const coords = getTouchCoordinates(canvasRef.value, touch);
  lastX.value = coords.x;
  lastY.value = coords.y;
};

const handleTouchMove = (e: TouchEvent) => {
  e.preventDefault();
  if (!isDrawing.value || !canvasRef.value || e.touches.length === 0) return;
  
  const touch = e.touches[0]!;
  const coords = getTouchCoordinates(canvasRef.value, touch);
  
  if (store.currentTool === 'brush') {
    drawLine(
      canvasRef.value,
      lastX.value,
      lastY.value,
      coords.x,
      coords.y,
      store.brushColor,
      store.brushSize
    );
  } else if (store.currentTool === 'eraser') {
    eraseArea(canvasRef.value, coords.x, coords.y, store.brushSize);
  }
  
  lastX.value = coords.x;
  lastY.value = coords.y;
};
</script>

<style scoped>
.canvas-board {
  background: white;
  overflow: hidden;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

canvas {
  display: block;
  cursor: crosshair;
  touch-action: none;
}

@media (max-width: 768px) {
  canvas {
    cursor: default;
  }
}
</style>
