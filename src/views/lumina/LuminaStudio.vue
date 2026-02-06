<template>
  <div class="lumina-studio" :class="{ 'dark-mode': true }">
    <!-- 顶部导航栏 -->
    <header class="studio-header">
      <div class="header-left">
        <button @click="goBack" class="icon-btn" title="返回画廊">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div class="title-container">
          <h1>Magical Lumina</h1>
          <span class="subtitle">魔法光影工作室</span>
        </div>
      </div>
      
      <div class="header-right">
        <button @click="saveArtwork" class="save-btn" :disabled="!hasChanges">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v13a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          保存作品
        </button>
      </div>
    </header>

    <!-- Toolbar for Undo/Redo (Optional placement, putting in header or sidebar) -->
    <!-- Let's put proper Undo/Redo in sidebar or tools -->

    <!-- 主工作区 -->
    <main class="studio-workspace">
      <div class="canvas-container" ref="canvasContainer">
        <canvas 
          ref="canvasEl"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
          @mouseleave="handleMouseUp"
        ></canvas>
        <div v-if="isLoading" class="loading-overlay">
          <div class="spinner"></div>
          <p>正在加载魔法画布...</p>
        </div>
      </div>
      
      <!-- 工具侧边栏 -->
      <aside class="tools-sidebar">
        <!-- 选区/裁剪工具 -->
        <div class="tool-group">
          <h3>相框裁剪</h3>
          <div class="tool-grid">
            <button 
              v-for="shape in shapes" 
              :key="shape.id"
              :class="['tool-btn', { active: currentTool === 'frame' && currentShape === shape.id }]"
              @click="setShape(shape.id)"
              :title="shape.name"
            >
              <component :is="shape.icon" />
            </button>
          </div>
        </div>

        <!-- 魔法画笔 -->
        <div class="tool-group">
          <h3>魔法画笔</h3>
          <div class="tool-grid">
            <button 
              v-for="brush in brushes" 
              :key="brush.id"
              :class="['tool-btn', { active: currentTool === 'brush' && activeBrush === brush.id }]"
              @click="setBrush(brush.id)"
              :title="brush.name"
            >
              <component :is="brush.icon" />
            </button>
          </div>

          <!-- 笔刷大小 (仅在笔刷模式下显示) -->
          <div class="slider-control" v-if="currentTool === 'brush'" style="margin-top: 16px;">
            <div class="slider-header">
              <label>笔刷大小</label>
              <span>{{ brushSize }}px</span>
            </div>
            <input 
              type="range" 
              v-model.number="brushSize" 
              min="5" 
              max="100"
            >
          </div>
          
          <div class="effect-actions">
             <button @click="undo" class="text-btn" :disabled="historyStep <= 0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px">
                    <path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
                </svg>
                撤销 (Ctrl+Z)
             </button>
             <button @click="resetCanvas" class="text-btn">重置画像</button> 
          </div>
        </div>
      </aside>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, h } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCanvasStore } from '../../stores/canvasStore';
import type { Artwork } from '../../types';

const route = useRoute();
const router = useRouter();
const store = useCanvasStore();

const canvasEl = ref<HTMLCanvasElement | null>(null);
const canvasContainer = ref<HTMLDivElement | null>(null);
const isLoading = ref(true);
const hasChanges = ref(false);

const currentTool = ref<'frame' | 'brush'>('frame');
const currentShape = ref('rect');
const activeBrush = ref('light');
const brushSize = ref(30);

// Icons setup using render functions for compatibility
const IconRectComp = { render: () => h('svg', { viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', 'stroke-width':2 }, [h('rect', { x:3, y:3, width:18, height:18, rx:2 })]) };
const IconCircleComp = { render: () => h('svg', { viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', 'stroke-width':2 }, [h('circle', { cx:12, cy:12, r:10 })]) };
const IconTriangleComp = { render: () => h('svg', { viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', 'stroke-width':2 }, [h('path', { d:'M12 2L2 22h20L12 2z' })]) };
const IconHeartComp = { render: () => h('svg', { viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', 'stroke-width':2 }, [h('path', { d:'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' })]) };
const IconCatComp = { render: () => h('svg', { viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', 'stroke-width':2 }, [h('path', { d:'M12 5c-3.87 0-7 3.13-7 7s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z' }), h('path', { d:'M4 6v5l3-2M20 6v5l-3-2' })]) };

const IconBrushLightComp = { render: () => h('svg', { viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', 'stroke-width':2 }, [h('circle', { cx:12, cy:12, r:5 }), h('line', { x1:12, y1:1, x2:12, y2:3 }), h('line', { x1:12, y1:21, x2:12, y2:23 }), h('line', { x1:4.22, y1:4.22, x2:5.64, y2:5.64 }), h('line', { x1:18.36, y1:18.36, x2:19.78, y2:19.78 }), h('line', { x1:1, y1:12, x2:3, y2:12 }), h('line', { x1:21, y1:12, x2:23, y2:12 }), h('line', { x1:4.22, y1:19.78, x2:5.64, y2:18.36 }), h('line', { x1:18.36, y1:5.64, x2:19.78, y2:4.22 })]) };
const IconBrushShadowComp = { render: () => h('svg', { viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', 'stroke-width':2 }, [h('path', { d:'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' })]) };
const IconBrushContrastComp = { render: () => h('svg', { viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', 'stroke-width':2 }, [h('circle', { cx:12, cy:12, r:10 }), h('path', { d:'M12 2a10 10 0 0 1 0 20z' })]) };

const shapes = [
  { id: 'rect', name: '矩形', icon: IconRectComp },
  { id: 'circle', name: '圆形', icon: IconCircleComp },
  { id: 'triangle', name: '三角形', icon: IconTriangleComp },
  { id: 'heart', name: '爱心', icon: IconHeartComp },
  { id: 'cat', name: '猫猫头', icon: IconCatComp },
];

const brushes = [
  { id: 'light', name: '提亮画笔', icon: IconBrushLightComp },
  { id: 'shadow', name: '阴影画笔', icon: IconBrushShadowComp },
  { id: 'contrast', name: '对比度画笔', icon: IconBrushContrastComp },
];

let originalImage: HTMLImageElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let startX = 0;
let startY = 0;
let isDrawing = false;
// selectionPath removed as unused

// Mouse Event Handlers
// History stack
const historyStack: ImageData[] = [];
const historyStep = ref(-1);

const saveState = () => {
    if (!ctx || !canvasEl.value) return;
    // If we are in the middle of history, truncate future
    if (historyStep.value < historyStack.length - 1) {
        historyStack.length = historyStep.value + 1;
    }
    // Limit history size?
    if (historyStack.length > 20) historyStack.shift();
    
    historyStack.push(ctx.getImageData(0, 0, canvasEl.value.width, canvasEl.value.height));
    historyStep.value = historyStack.length - 1;
    hasChanges.value = true;
};

const undo = () => {
    if (historyStep.value > 0 && ctx) {
        historyStep.value--;
        ctx.putImageData(historyStack[historyStep.value]!, 0, 0);
    } else if (historyStep.value === 0 && ctx) {
        // Initial state? Or just reset?
        // If index 0 is the state AFTER first edit, then index -1 is original?
        // We should push original state on load logic.
        historyStep.value--;
        if (originalImage && canvasEl.value) {
           ctx.clearRect(0,0, canvasEl.value.width, canvasEl.value.height);
           ctx.drawImage(originalImage, 0, 0, canvasEl.value.width, canvasEl.value.height);
        }
    }
};

// Keyboard listener for Undo
const handleKeydown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
    }
};

const handleMouseDown = (e: MouseEvent) => {
  if (!canvasEl.value || !ctx || isLoading.value) return;
  
  if (currentTool.value === 'brush') {
      saveState(); // Save BEFORE painting
      isDrawing = true;
      startX = e.offsetX;
      startY = e.offsetY;
      paintAt(startX, startY);
  } else if (currentTool.value === 'frame') {
      isDrawing = true;
      startX = e.offsetX;
      startY = e.offsetY;
      // Snapshot is for preview, not history
      snapshot = ctx.getImageData(0, 0, canvasEl.value.width, canvasEl.value.height);
  }
};

const handleMouseMove = (e: MouseEvent) => {
  if (!isDrawing || !ctx) return;
  
  if (currentTool.value === 'brush') {
      paintAt(e.offsetX, e.offsetY);
      return;
  }
  
  // Frame logic
  const currentX = e.offsetX;
  const currentY = e.offsetY;
  const w = currentX - startX;
  const h = currentY - startY;
  
  redrawCanvas();
  
  // Draw current selection preview
  ctx.save();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  
  // Draw shape outline
  drawShapePath(ctx, startX, startY, w, h, currentShape.value);
  ctx.stroke();
  
  // Outline shadow for visibility
  ctx.strokeStyle = '#000';
  ctx.setLineDash([5, 5]);
  ctx.lineDashOffset = 5;
  drawShapePath(ctx, startX, startY, w, h, currentShape.value);
  ctx.stroke();
  
  ctx.restore();
};

const handleMouseUp = (e: MouseEvent) => {
  if (!isDrawing) return;
  isDrawing = false;
  
  if (currentTool.value === 'brush') {
      // Save state or just keep going?
      hasChanges.value = true;
      return;
  }
  
  // Frame logic
  const currentX = e.offsetX;
  const currentY = e.offsetY;
  const w = currentX - startX;
  const h = currentY - startY;
  
  // Avoid zero-size selections
  if (Math.abs(w) < 5 || Math.abs(h) < 5) {
      redrawCanvas();
      return;
  }
  
  // Apply Clipping Mask
  if (currentTool.value === 'frame') {
     saveState(); // Save BEFORE applying clip? 
     // No, we usually save state BEFORE modification.
     // But wait, if I save state now, it will save the PRE-CLIP state (because I restored snapshot in clipCanvas).
     // Wait, clipCanvas uses `snapshot` to restore first. 
     // So `snapshot` HAS the pre-clip state.
     
     // Correct flow:
     // 1. MouseDown -> Snapshot taken (Pre-clip state).
     // 2. MouseUp -> 
     //    a. Save Pre-clip state to history.
     //    b. Apply Clip.
     
     // But `saveState` grabs CURRENT canvas.
     // If I call saveState() NOW, I need to ensure canvas is in Pre-clip state.
     // `clipCanvas` restores snapshot, so if I call saveState INSIDE clipCanvas or before?
     
     // Let's modify `saveState` manually to push the snapshot? 
     // Or just call saveState() at the START of MouseDown for Frame tool?
     // Yes, `handleMouseDown` for Frame does NOT modify canvas (just preview).
     // But `handleMouseUp` modifies it permanently.
     // So we should save state in `handleMouseDown`? No, because user might just click and not drag.
     // We should save state in `handleMouseUp` right before applying change.
     
     // Actually, let's look at `clipCanvas`. It restores `snapshot` (clean state) then draws.
     // So if we save `snapshot` to history, that's valid.
     if (snapshot) {
         if (historyStep.value < historyStack.length - 1) {
            historyStack.length = historyStep.value + 1;
         }
         if (historyStack.length > 20) historyStack.shift();
         historyStack.push(snapshot);
         historyStep.value = historyStack.length - 1;
     }

     clipCanvas(startX, startY, w, h, currentShape.value);
     hasChanges.value = true;
  }
};


// Only used to clear preview lines for Frame tool
const redrawCanvas = () => {
    if (!canvasEl.value || !ctx || !snapshot) return;
    
    // Restore the clean snapshot (no lines)
    ctx.putImageData(snapshot, 0, 0);
};

// We need a snapshot for previewing frame drag without destroying canvas content
let snapshot: ImageData | null = null;

const clipCanvas = (x: number, y: number, w: number, h: number, shape: string) => {
    if (!ctx || !canvasEl.value) return;
    
    // Restore clean state first (remove preview lines)
    if (snapshot) ctx.putImageData(snapshot, 0, 0);
    
    // Use destination-in to keep only the shape
    ctx.save();
    
    // Create new Path
    const path = new Path2D();
    buildPath(path, x, y, w, h, shape);
    
    // Clip? Or standard composite?
    // destination-in: The existing content is kept where it overlaps the new shape.
    // Everything else becomes transparent.
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = '#000'; // alpha=1
    ctx.fill(path);
    
    ctx.restore();
};

const paintAt = (cx: number, cy: number) => {
    if (!ctx || !canvasEl.value) return;
    
    const r = brushSize.value / 2;
    // Bounding box
    const x = Math.max(0, Math.floor(cx - r));
    const y = Math.max(0, Math.floor(cy - r));
    const wBounds = Math.min(canvasEl.value.width - x, Math.ceil(r * 2));
    const hBounds = Math.min(canvasEl.value.height - y, Math.ceil(r * 2));
    
    if (wBounds <= 0 || hBounds <= 0) return;
    
    const imageData = ctx.getImageData(x, y, wBounds, hBounds);
    const data = imageData.data;
    
    const rSq = r * r;
    
    for (let i = 0; i < data.length; i += 4) {
        // Local coords relative to imageData rect
        const lx = (i / 4) % wBounds;
        const ly = Math.floor((i / 4) / wBounds);
        
        // Global coords (approx) relative to circle center
        // dx = (x + lx) - cx
        const dx = (x + lx) - cx;
        const dy = (y + ly) - cy;
        
        if (dx*dx + dy*dy <= rSq) {
            let red = data[i] ?? 0;
            let green = data[i+1] ?? 0;
            let blue = data[i+2] ?? 0;
            
            // Apply effect
            // Simple accumulation
            const intensity = 5; // Adjustable?
            
            if (activeBrush.value === 'light') {
                red += intensity;
                green += intensity;
                blue += intensity;
            } else if (activeBrush.value === 'shadow') {
                red -= intensity;
                green -= intensity;
                blue -= intensity;
            } else if (activeBrush.value === 'contrast') {
                // Simple contrast per pixel? 
                // factor > 1 increases contrast.
                // New = (Old - 128) * factor + 128
                const factor = 1.05;
                red = (red - 128) * factor + 128;
                green = (green - 128) * factor + 128;
                blue = (blue - 128) * factor + 128;
            }
            
            data[i] = Math.min(255, Math.max(0, red));
            data[i+1] = Math.min(255, Math.max(0, green));
            data[i+2] = Math.min(255, Math.max(0, blue));
        }
    }
    
    ctx.putImageData(imageData, x, y);
};

const resetCanvas = () => {
    if (!canvasEl.value || !ctx || !originalImage) return;
    ctx.clearRect(0, 0, canvasEl.value.width, canvasEl.value.height);
    ctx.drawImage(originalImage, 0, 0, canvasEl.value.width, canvasEl.value.height);
    
    // Reset history
    historyStack.length = 0;
    historyStep.value = -1;
};

const drawShapePath = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, shape: string) => {
    ctx.beginPath();
    
    // Align x,y,w,h to be top-left based (handle negative width/height from drag direction)
    let rx = x;
    let ry = y;
    let rw = w;
    let rh = h;
    
    // Usually easier to normalize to positive width/height
    /* 
       But simpler drawing logic:
       Let the path commands handle it or normalize first.
       Let's normalize.
    */
    if (rw < 0) { rx += rw; rw = -rw; }
    if (rh < 0) { ry += rh; rh = -rh; }

    switch (shape) {
        case 'rect':
            ctx.rect(rx, ry, rw, rh);
            break;
        case 'circle':
            ctx.ellipse(rx + rw/2, ry + rh/2, rw/2, rh/2, 0, 0, 2 * Math.PI);
            break;
        case 'triangle':
            ctx.moveTo(rx + rw/2, ry);
            ctx.lineTo(rx, ry + rh);
            ctx.lineTo(rx + rw, ry + rh);
            ctx.closePath();
            break;
        case 'heart':
            // Heart shape logic (scale to bounding box)
            // Top center cleft
             const topCurveHeight = rh * 0.3;
             ctx.moveTo(rx + rw/2, ry + topCurveHeight);
             ctx.bezierCurveTo(
               rx + rw/2, ry, 
               rx, ry, 
               rx, ry + topCurveHeight
             );
             ctx.bezierCurveTo(
               rx, ry + (rh + topCurveHeight)/2, 
               rx + rw/2, ry + rh, 
               rx + rw/2, ry + rh
             );
             ctx.bezierCurveTo(
               rx + rw/2, ry + rh, 
               rx + rw, ry + (rh + topCurveHeight)/2, 
               rx + rw, ry + topCurveHeight
             );
             ctx.bezierCurveTo(
               rx + rw, ry, 
               rx + rw/2, ry, 
               rx + rw/2, ry + topCurveHeight
             );
            break;
        case 'cat':
            // Cat Head: Circle face + Triangle Ears
            const r = Math.min(rw, rh) / 2;
            const cx = rx + rw/2;
            const cy = ry + rh/2;
            
            // Ears
            const earH = r * 0.5; // Ear height
            
            // Left ear
            ctx.moveTo(cx - r*0.7, cy - r*0.5); 
            ctx.lineTo(cx - r*0.9, cy - r - earH * 0.5);
            ctx.lineTo(cx - r*0.2, cy - r*0.8);
            
            // Right ear
            ctx.moveTo(cx + r*0.7, cy - r*0.5);
            ctx.lineTo(cx + r*0.9, cy - r - earH * 0.5);
            ctx.lineTo(cx + r*0.2, cy - r*0.8);
            
            // Face (Circle)
            // Use arc to close path with ears? Or just draw overlapping shapes.
            // Be strict for a single path:
            // Draw head circle
            ctx.moveTo(cx + r, cy);
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            // Actually ears should be part of the path if we want fill to work properly as one union.
            // For simplicity in Canvas API without complex boolean ops, let's draw ears and head.
            // But 'beginPath' clears.
            // If we want a single selection area, we should trace the outline. 
            // Approximation: Just circle for selection logic? No, user wants cat shape.
            // Let's draw ears separately in the same path?
            // Yes, multiple subpaths are fine for evenodd fill rule usually, or non-zero.
            // Let's just add the ear triangles to the path.
            // Left Ear
            ctx.moveTo(cx - r*0.5, cy - r*0.6);
            ctx.lineTo(cx - r*0.9, cy - r*1.2);
            ctx.lineTo(cx - r*0.1, cy - r*0.8);
            // Right Ear
            ctx.moveTo(cx + r*0.5, cy - r*0.6);
            ctx.lineTo(cx + r*0.9, cy - r*1.2);
            ctx.lineTo(cx + r*0.1, cy - r*0.8);
            // Re-trace circle to ensure it's included
            
            // Better Cat Path:
            // Start left ear tip
            // Down to head
            // Around head
            // Up to right ear...
            // This is complex. Let's stick to "Circle + Triangles added to path".
            // It will result in "union" visually if filled, but "stroke" might show internal lines.
            // Selection overlay is dashed, so internal lines might be visible. That's acceptable for "Magical".
            break;
    }
};

onMounted(async () => {
  const artworkId = route.params.id as string;
  if (!store.isInitialized) await store.loadAllData();
  
  const artwork = store.savedArtworks.find(a => a.id === artworkId);
  if (!artwork) {
    alert('未找到该作品');
    router.push('/');
    return;
  }

  await initCanvas(artwork);
  
  // Register keyboard listener
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown);
});

const initCanvas = (artwork: Artwork) => {
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!canvasEl.value) return;
      
      originalImage = img;
      const canvas = canvasEl.value;
      const container = canvasContainer.value;
      
      if (container) {
        // Fit canvas to container while maintaining aspect ratio
        const maxWidth = container.clientWidth - 40; // padding
        const maxHeight = container.clientHeight - 40;
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
        
        canvas.width = img.width * scale;
        canvas.height = img.height * scale; // Keep logic simple for now, might need high DPI handling
        
        ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
      }
      
      isLoading.value = false;
      resolve();
    };
    img.src = artwork.fullImage;
  });
};

const goBack = () => {
  if (hasChanges.value) {
    if (confirm('是否放弃未保存的修改？')) router.back();
  } else {
    router.back();
  }
};

const setShape = (shapeId: string) => {
  currentTool.value = 'frame';
  currentShape.value = shapeId;
};

const setBrush = (brushId: string) => {
  currentTool.value = 'brush';
  activeBrush.value = brushId;
};

// Apply brightness/contrast to selection
// Redraw logic handled by snapshot/restore now.

const buildPath = (path: Path2D, x: number, y: number, w: number, h: number, shape: string) => {
    let rx = x;
    let ry = y;
    let rw = w;
    let rh = h;
    if (rw < 0) { rx += rw; rw = -rw; }
    if (rh < 0) { ry += rh; rh = -rh; }

    switch (shape) {
        case 'rect':
            path.rect(rx, ry, rw, rh);
            break;
        case 'circle':
            path.ellipse(rx + rw/2, ry + rh/2, rw/2, rh/2, 0, 0, 2 * Math.PI);
            break;
        case 'triangle':
            path.moveTo(rx + rw/2, ry);
            path.lineTo(rx, ry + rh);
            path.lineTo(rx + rw, ry + rh);
            path.closePath();
            break;
        case 'heart':
             const topCurveHeight = rh * 0.3;
             path.moveTo(rx + rw/2, ry + topCurveHeight);
             path.bezierCurveTo(rx + rw/2, ry, rx, ry, rx, ry + topCurveHeight);
             path.bezierCurveTo(rx, ry + (rh + topCurveHeight)/2, rx + rw/2, ry + rh, rx + rw/2, ry + rh);
             path.bezierCurveTo(rx + rw/2, ry + rh, rx + rw, ry + (rh + topCurveHeight)/2, rx + rw, ry + topCurveHeight);
             path.bezierCurveTo(rx + rw, ry, rx + rw/2, ry, rx + rw/2, ry + topCurveHeight);
            break;
        case 'cat':
            const r = Math.min(rw, rh) / 2;
            const cx = rx + rw/2;
            const cy = ry + rh/2;
            const earH = r * 0.5;
            
            // Left Ear Triangle
            path.moveTo(cx - r*0.8, cy - r*0.6);
            path.lineTo(cx - r*1.1, cy - r - earH * 0.8);
            path.lineTo(cx - r*0.2, cy - r*0.9);
            path.closePath();
            
            // Right Ear Triangle (reverse order to match left)
            path.moveTo(cx + r*0.8, cy - r*0.6);
            path.lineTo(cx + r*0.2, cy - r*0.9);
            path.lineTo(cx + r*1.1, cy - r - earH * 0.8);
            path.closePath();
            
            // Face Circle
            path.arc(cx, cy, r, 0, Math.PI * 2);
            break;
    }
};



const saveArtwork = async () => {
  if (!canvasEl.value || !ctx) return; // Ensure ctx is present
  
  const artworkId = route.params.id as string;
  const originalArtwork = store.savedArtworks.find(a => a.id === artworkId);
  const albumId = originalArtwork?.albumId;
  const title = originalArtwork?.title ? `${originalArtwork.title} (Magic)` : 'Magical Artwork';
  
  // Render logic is WYSIWYG now
  // Just save what's on the canvas
  canvasEl.value.toBlob(async (blob) => {
    if (!blob) return;
    const file = new File([blob], `${title}.png`, { type: 'image/png' });
    
    // Use store import
    const success = await store.importArtwork(file, albumId);
    if (success) {
        alert('保存成功！✨');
        hasChanges.value = false;
        router.push('/');
    } else {
        alert('保存失败，请重试');
    }
  }, 'image/png');
};


</script>

<style scoped>
.lumina-studio {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #111827; /* Dark background */
  color: #F9FAFB;
}

.studio-header {
  height: 64px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(17, 24, 39, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.icon-btn {
  background: none;
  border: none;
  color: #9CA3AF;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.title-container h1 {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #818CF8 0%, #C084FC 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  font-size: 0.75rem;
  color: #9CA3AF;
}

.save-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #6366F1;
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn:disabled {
  background: #374151;
  color: #9CA3AF;
  cursor: not-allowed;
}

.studio-workspace {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.canvas-container {
  flex: 1;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: 
    linear-gradient(45deg, #1F2937 25%, transparent 25%), 
    linear-gradient(-45deg, #1F2937 25%, transparent 25%), 
    linear-gradient(45deg, transparent 75%, #1F2937 75%), 
    linear-gradient(-45deg, transparent 75%, #1F2937 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  position: relative;
}

canvas {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  max-width: 100%;
  max-height: 100%;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(17, 24, 39, 0.9);
  color: #818CF8;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(99, 102, 241, 0.3);
  border-top-color: #6366F1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.tools-sidebar {
  width: 280px;
  background: #1F2937;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.tool-group h3 {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #9CA3AF;
  margin: 0 0 16px 0;
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.tool-btn {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid transparent;
  border-radius: 12px;
  color: #E5E7EB;
  cursor: pointer;
  transition: all 0.2s;
}

.tool-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.tool-btn.active {
  background: rgba(99, 102, 241, 0.2);
  border-color: #6366F1;
  color: #818CF8;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.tool-btn svg {
  width: 24px;
  height: 24px;
}

.slider-control {
  margin-bottom: 20px;
}

.slider-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.85rem;
  color: #D1D5DB;
}

input[type=range] {
  width: 100%;
  height: 6px;
  background: #374151;
  border-radius: 3px;
  outline: none;
  -webkit-appearance: none;
}

input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  background: #818CF8;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.1s;
}

input[type=range]::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

.effect-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.text-btn {
  flex: 1;
  background: none;
  border: none;
  color: #9CA3AF;
  cursor: pointer;
  padding: 8px;
  font-size: 0.9rem;
}

.text-btn:hover {
  color: white;
}

.primary-btn {
  flex: 1.5;
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  padding: 10px;
  transition: opacity 0.2s;
}

.primary-btn:hover {
  opacity: 0.9;
}
</style>
