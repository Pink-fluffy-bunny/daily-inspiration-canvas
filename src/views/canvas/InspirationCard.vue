<template>
  <div class="inspiration-card">
    <div class="card-header">
      <h2>✨ 今日灵感</h2>
      <button class="refresh-button" @click="handleRefresh" title="刷新灵感">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M23 4v6h-6"></path>
          <path d="M1 20v-6h6"></path>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
        </svg>
      </button>
    </div>
    <div class="card-content">
      <p class="prompt-text">{{ prompt }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useCanvasStore } from '../../stores/canvasStore';

const store = useCanvasStore();

const prompt = computed(() => store.currentPrompt);

const handleRefresh = () => {
  store.refreshPrompt();
};
</script>

<style scoped>
.inspiration-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;
}

.inspiration-card::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
}

.card-header {
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  color: white;
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.refresh-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 8px;
  padding: 6px;
  cursor: pointer;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.refresh-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(180deg);
}

.refresh-button:active {
  transform: rotate(180deg) scale(0.95);
}

.refresh-button svg {
  transition: transform 0.5s ease;
}

.card-content {
  position: relative;
  z-index: 1;
}

.prompt-text {
  color: white;
  font-size: 1rem;
  font-weight: 500;
  margin: 0;
  line-height: 1.5;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.prompt-text {
  animation: fadeIn 0.5s ease;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
