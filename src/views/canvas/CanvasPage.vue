<template>
  <div class="page-container">
    <CanvasSidebar />
    <div class="main-content">
      <CanvasBoard />
    </div>
  </div>
</template>

<script setup lang="ts">
import CanvasSidebar from './CanvasSidebar.vue';
import CanvasBoard from './CanvasBoard.vue';
</script>

<style scoped>
.page-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.main-content {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: hidden;
}
</style>
