<template>
  <div v-if="isVisible" class="modal-overlay" @click="closeOnOverlay">
    <div class="editor-modal" @click.stop>
      <div class="modal-header">
        <h3>编辑作品信息</h3>
        <button class="close-btn" @click="close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <!-- 作品名称 -->
        <div class="form-group">
          <label for="title">作品名称</label>
          <input
            id="title"
            v-model="formData.title"
            type="text"
            placeholder="给你的作品起个名字吧"
            maxlength="50"
          />
          <span class="char-count">{{ formData.title?.length || 0 }}/50</span>
        </div>

        <!-- 创作日期 -->
        <div class="form-group">
          <label>创作日期</label>
          <div class="date-display">
            {{ formatDate(artwork.createdAt) }}
          </div>
        </div>

        <!-- 画册归类 -->
        <div class="form-group">
          <label for="album">所属画册</label>
          <select id="album" v-model="formData.albumId">
            <option value="">🏠 未分类 (全部作品)</option>
            <option v-for="album in albums" :key="album.id" :value="album.id">
              {{ album.name }}
            </option>
          </select>
        </div>

        <!-- 完成日期 -->
        <div class="form-group">

          <label for="completedAt">完成日期</label>
          <input
            id="completedAt"
            v-model="formData.completedAtDate"
            type="date"
          />
        </div>

        <!-- 说明 -->
        <div class="form-group">
          <label for="description">作品说明</label>
          <textarea
            id="description"
            v-model="formData.description"
            placeholder="记录创作灵感、想法或故事..."
            rows="4"
            maxlength="500"
          ></textarea>
          <span class="char-count">{{ formData.description?.length || 0 }}/500</span>
        </div>

        <!-- 标签 -->
        <div class="form-group">
          <label for="tags">标签</label>
          <div class="tags-input-container">
            <div class="tags-list">
              <span v-for="(tag, index) in formData.tags" :key="index" class="tag">
                {{ tag }}
                <button @click="removeTag(index)" class="tag-remove">×</button>
              </span>
            </div>
            <input
              id="tags"
              v-model="newTag"
              type="text"
              placeholder="按回车添加标签"
              @keydown.enter.prevent="addTag"
              @keydown.backspace="removeLastTag"
            />
          </div>
          <p class="hint">按 Enter 添加标签，点击 × 删除</p>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" @click="close">取消</button>
        <button class="btn-primary" @click="save">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';
import { useCanvasStore } from '../../stores/canvasStore';
import type { Artwork } from '../../types';

interface Props {
  isVisible: boolean;
  artwork: Artwork;
}

interface Emits {
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const store = useCanvasStore();

const formData = reactive({
  title: '' as string,
  description: '' as string,
  completedAtDate: '' as string,
  tags: [] as string[],
  albumId: '' as string
});


const newTag = ref('');
const albums = computed(() => store.albums);


// 监听作品数据变化，初始化表单
watch(() => props.artwork, (newArtwork) => {
  formData.title = newArtwork.title || '';
  formData.description = newArtwork.description || '';
  formData.tags = newArtwork.tags ? [...newArtwork.tags] : [];
  formData.albumId = newArtwork.albumId || '';
  
  // 将完成时间戳转换为日期字符串

  if (newArtwork.completedAt) {
    const date = new Date(newArtwork.completedAt);
    const dateString = date.toISOString().split('T')[0];
    formData.completedAtDate = dateString || '';
  } else {
    // 默认使用创作日期
    const date = new Date(newArtwork.createdAt);
    const dateString = date.toISOString().split('T')[0];
    formData.completedAtDate = dateString || '';
  }
}, { immediate: true });

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const addTag = () => {
  const tag = newTag.value.trim();
  if (tag && !formData.tags.includes(tag) && formData.tags.length < 10) {
    formData.tags.push(tag);
    newTag.value = '';
  }
};

const removeTag = (index: number) => {
  formData.tags.splice(index, 1);
};

const removeLastTag = () => {
  if (newTag.value === '' && formData.tags.length > 0) {
    formData.tags.pop();
  }
};

const save = () => {
  // 准备更新数据
  const updates: Partial<Artwork> = {
    title: formData.title || undefined,
    description: formData.description || undefined,
    tags: formData.tags.length > 0 ? formData.tags : undefined
  };

  // 将日期字符串转换为时间戳
  if (formData.completedAtDate) {
    const date = new Date(formData.completedAtDate);
    updates.completedAt = date.getTime();
  }

  updates.albumId = formData.albumId || '';


  // 更新作品信息
  store.updateArtworkInfo(props.artwork.id, updates);
  
  // 关闭编辑器
  close();
};

const close = () => {
  // 重置表单
  formData.title = '';
  formData.description = '';
  formData.completedAtDate = '';
  formData.tags = [];
  newTag.value = '';
  
  emit('close');
};

const closeOnOverlay = () => {
  close();
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  padding: 20px;
  animation: fadeIn 0.2s ease;
}

.editor-modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #E5E7EB;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #374151;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #F3F4F6;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6B7280;
  transition: all 0.2s ease;
  padding: 0;
}

.close-btn svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.close-btn:hover {
  background: #E5E7EB;
  color: #374151;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
}

.form-group input[type="text"],
.form-group input[type="date"],
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #D1D5DB;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.form-group input[type="text"]:focus,
.form-group input[type="date"]:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
}

.char-count {
  display: block;
  text-align: right;
  font-size: 0.8rem;
  color: #9CA3AF;
  margin-top: 4px;
}

.date-display {
  padding: 10px 12px;
  background: #F9FAFB;
  border-radius: 8px;
  color: #6B7280;
  font-size: 0.95rem;
}

.tags-input-container {
  border: 1px solid #D1D5DB;
  border-radius: 8px;
  padding: 8px;
  min-height: 50px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  transition: all 0.2s ease;
}

.tags-input-container:focus-within {
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: #EFF6FF;
  color: #3B82F6;
  border-radius: 16px;
  font-size: 0.85rem;
  font-weight: 500;
}

.tag-remove {
  background: none;
  border: none;
  color: #3B82F6;
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.tag-remove:hover {
  opacity: 1;
}

.tags-input-container input {
  flex: 1;
  min-width: 120px;
  border: none;
  outline: none;
  padding: 4px;
  font-size: 0.9rem;
}

.hint {
  margin: 6px 0 0 0;
  font-size: 0.85rem;
  color: #9CA3AF;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid #E5E7EB;
}

.btn-secondary {
  padding: 10px 20px;
  background: white;
  border: 1px solid #D1D5DB;
  color: #374151;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: #F9FAFB;
  border-color: #9CA3AF;
}

.btn-primary {
  padding: 10px 20px;
  background: #3B82F6;
  border: none;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: #2563EB;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 640px) {
  .editor-modal {
    max-width: 100%;
    margin: 10px;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style>
