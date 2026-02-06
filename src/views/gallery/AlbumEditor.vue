<template>
  <div class="modal" @click="close">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>编辑画册</h3>
        <button @click="close" class="close-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">画册名称</label>
          <input 
            v-model="albumName" 
            type="text" 
            placeholder="输入画册名称"
            ref="nameInput"
          />
        </div>

        <div class="form-group">
          <label class="form-label">画册介绍</label>
          <textarea 
            v-model="albumDescription" 
            placeholder="输入画册介绍（可选）" 
            rows="4"
          ></textarea>
        </div>

        <AlbumCoverEditor 
          :album="currentAlbum"
          @save="onCoverSave"
          @close="onCoverClose"
        />
      </div>

      <div class="modal-footer">
        <button @click="saveAlbum" class="btn-primary">保存</button>
        <button @click="close" class="btn-secondary">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { useCanvasStore } from '../../stores/canvasStore';
import type { Album } from '../../types';
import AlbumCoverEditor from './AlbumCoverEditor.vue';

const props = defineProps<{
  isVisible: boolean;
  album: Album;
}>();

const emit = defineEmits(['close', 'save']);

const store = useCanvasStore();

const albumName = ref('');
const albumDescription = ref('');
const currentAlbum = ref<Album>({ ...props.album });
const nameInput = ref<HTMLInputElement | null>(null);

// 初始化表单数据
const initForm = () => {
  if (props.album) {
    albumName.value = props.album.name;
    albumDescription.value = props.album.description || '';
    currentAlbum.value = { ...props.album };
  }
};

// 组件挂载时初始化
initForm();

// 监听显示状态
watch(() => props.isVisible, (visible) => {
  if (visible) {
    // 每次打开时重新初始化表单数据（从最新的 album 值）
    initForm();
    
    // 自动聚焦名称输入框
    nextTick(() => {
      nameInput.value?.focus();
    });
  }
});

// 监听 album 变化，实时更新 currentAlbum
watch(() => props.album, (newAlbum) => {
  if (newAlbum && props.isVisible) {
    currentAlbum.value = { ...newAlbum };
  }
}, { deep: true });

const close = () => {
  emit('close');
};

const onCoverSave = async (updatedAlbum: Album) => {
  currentAlbum.value = updatedAlbum;
  await store.updateAlbum(updatedAlbum);
};

const onCoverClose = () => {
  // 封面编辑器关闭时的回调
};

const saveAlbum = async () => {
  if (!albumName.value.trim()) {
    alert('请输入画册名称');
    return;
  }

  const updatedAlbum: Album = {
    ...currentAlbum.value,
    name: albumName.value.trim(),
    description: albumDescription.value.trim() || undefined
  };

  await store.updateAlbum(updatedAlbum);
  emit('save', updatedAlbum);
  emit('close');
};
</script>

<style scoped>
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 40px;
}

.modal-content {
  background: white;
  border-radius: 20px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: 24px 24px 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5rem;
  color: #1F2937;
}

.close-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F3F4F6;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: #6B7280;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #E5E7EB;
  color: #1F2937;
}

.close-btn svg {
  display: block;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #374151;
  font-size: 0.95rem;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #6366F1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-group textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  font-size: 0.95rem;
  resize: vertical;
  font-family: inherit;
  transition: all 0.2s;
}

.form-group textarea:focus {
  outline: none;
  border-color: #6366F1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.modal-footer {
  padding: 0 24px 24px 24px;
  display: flex;
  gap: 12px;
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  font-size: 0.95rem;
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
