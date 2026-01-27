<template>
  <div class="inspiration-card">
    <div class="card-header">
      <h2>✨ 今日灵感</h2>
    </div>
    <div class="card-content">
      <p class="prompt-text">{{ prompt }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useCanvasStore } from '../stores/canvasStore';

const store = useCanvasStore();

const prompt = computed(() => store.currentPrompt);
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
}

.card-header h2 {
  color: white;
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
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
</style>
