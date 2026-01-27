<template>
  <div class="color-picker">
    <div class="color-palette">
      <button
        v-for="color in presetColors"
        :key="color"
        :class="['color-btn', { active: isSelected(color) }]"
        :style="{ backgroundColor: color }"
        @click="selectColor(color)"
        :title="color"
      ></button>
      <div class="custom-color-wrapper">
        <input
          type="color"
          v-model="customColor"
          class="custom-color-input"
          title="自定义颜色"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useCanvasStore } from '../../stores/canvasStore';

const store = useCanvasStore();

const presetColors = [
  '#000000',
  '#FFFFFF',
  '#FF0000',
  '#FF6B6B',
  '#FFA500',
  '#FFD93D',
  '#4ECDC4',
  '#45B7D1',
  '#5B8FF9',
  '#667EEA',
  '#764BA2',
  '#F96666',
  '#6BCB77',
  '#FFD166',
  '#118AB2',
  '#073B4C'
];

const customColor = ref('#000000');

const currentColor = computed(() => store.brushColor);

const isSelected = (color: string) => {
  return currentColor.value.toLowerCase() === color.toLowerCase();
};

const selectColor = (color: string) => {
  store.brushColor = color;
};

watch(customColor, (newColor) => {
  store.brushColor = newColor;
});
</script>

<style scoped>
.color-picker {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.color-palette {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.color-btn {
  width: 40px;
  height: 40px;
  border: 3px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.color-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.color-btn.active {
  border-color: #667eea;
  transform: scale(1.15);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.3);
}

.custom-color-wrapper {
  position: relative;
  width: 40px;
  height: 40px;
}

.custom-color-input {
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: all 0.2s ease;
}

.custom-color-input:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.custom-color-input.active {
  border-color: #667eea;
  transform: scale(1.15);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.3);
}

.custom-color-input::-webkit-color-swatch-wrapper {
  padding: 0;
}

.custom-color-input::-webkit-color-swatch {
  border: none;
  border-radius: 6px;
}
</style>
