<template>
  <div class="app">
    <div class="app-container">
      <!-- 侧边栏 -->
      <Sidebar />
      
      <!-- 主画板区域 -->
      <div class="canvas-area">
        <CanvasBoard />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Sidebar from './components/Sidebar.vue';
import CanvasBoard from './components/CanvasBoard.vue';
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  overflow: hidden;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

#app {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.app {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.app-container {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.canvas-area {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: hidden;
}
</style>
