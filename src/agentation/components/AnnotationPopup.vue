<script setup lang="ts">
import { ref, onMounted, computed, nextTick, type StyleValue } from 'vue';
import styles from './AnnotationPopup.module.scss';

interface Props {
  element: string;
  timestamp?: string;
  selectedText?: string;
  placeholder?: string;
  initialValue?: string;
  submitLabel?: string;
  accentColor?: string;
  lightMode?: boolean;
  computedStyles?: Record<string, string>;
  style?: StyleValue;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: "What should change?",
  initialValue: "",
  submitLabel: "Add",
  accentColor: "#3c82f7",
  lightMode: false
});

const emit = defineEmits<{
  (e: 'submit', text: string): void;
  (e: 'cancel'): void;
}>();

const text = ref(props.initialValue);
const isShaking = ref(false);
const animState = ref<"initial" | "enter" | "entered" | "exit">("initial");
const isFocused = ref(false);
const isStylesExpanded = ref(false);
const textareaRef = ref<HTMLTextAreaElement | null>(null);

// Handle shaking
const shake = () => {
  isShaking.value = true;
  setTimeout(() => {
    isShaking.value = false;
    textareaRef.value?.focus();
  }, 250);
};

defineExpose({ shake });

const popupClasses = computed(() => [
  styles.popup,
  props.lightMode ? styles.light : "",
  animState.value === "enter" ? styles.enter : "",
  animState.value === "entered" ? styles.entered : "",
  animState.value === "exit" ? styles.exit : "",
  isShaking.value ? styles.shake : "",
]);

onMounted(() => {
  requestAnimationFrame(() => {
    animState.value = "enter";
  });
  
  setTimeout(() => {
    animState.value = "entered";
  }, 200);

  setTimeout(() => {
    if (textareaRef.value) {
      textareaRef.value.focus();
      textareaRef.value.selectionStart = textareaRef.value.selectionEnd = textareaRef.value.value.length;
      textareaRef.value.scrollTop = textareaRef.value.scrollHeight;
    }
  }, 50);
});

const handleCancel = () => {
  animState.value = "exit";
  setTimeout(() => {
    emit('cancel');
  }, 150);
};

const handleSubmit = () => {
  if (!text.value.trim()) return;
  emit('submit', text.value.trim());
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSubmit();
  }
  if (e.key === "Escape") {
    handleCancel();
  }
};

const toggleStyles = () => {
  isStylesExpanded.value = !isStylesExpanded.value;
  if (!isStylesExpanded.value) {
    nextTick(() => textareaRef.value?.focus());
  }
};
</script>

<template>
  <div
    :class="popupClasses"
    data-annotation-popup
    :style="style"
    @click.stop
  >
    <div :class="styles.header">
      <template v-if="computedStyles && Object.keys(computedStyles).length > 0">
        <button
          :class="styles.headerToggle"
          @click="toggleStyles"
          type="button"
        >
          <svg
            :class="[styles.chevron, isStylesExpanded ? styles.expanded : '']"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5.5 10.25L9 7.25L5.75 4"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span :class="styles.element">{{ element }}</span>
        </button>
      </template>
      <span v-else :class="styles.element">{{ element }}</span>
      <span v-if="timestamp" :class="styles.timestamp">{{ timestamp }}</span>
    </div>

    <div v-if="computedStyles && Object.keys(computedStyles).length > 0" 
         :class="[styles.stylesWrapper, isStylesExpanded ? styles.expanded : '']">
      <div :class="styles.stylesInner">
        <div :class="styles.stylesBlock">
          <div v-for="(value, key) in computedStyles" :key="key" :class="styles.styleLine">
            <span :class="styles.styleProperty">
              {{ String(key).replace(/([A-Z])/g, "-$1").toLowerCase() }}
            </span>
            : <span :class="styles.styleValue">{{ value }}</span>;
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedText" :class="styles.quote">
      &ldquo;{{ selectedText.slice(0, 80) }}{{ selectedText.length > 80 ? "..." : "" }}&rdquo;
    </div>

    <textarea
      ref="textareaRef"
      :class="styles.textarea"
      :style="{ borderColor: isFocused ? accentColor : undefined, paddingRight: '0px'}"
      :placeholder="placeholder"
      v-model="text"
      @focus="isFocused = true"
      @blur="isFocused = false"
      :rows="2"
      @keydown="handleKeyDown"
    ></textarea>

    <div :class="styles.actions">
      <button :class="styles.cancel" @click="handleCancel">
        Cancel
      </button>
      <button
        :class="styles.submit"
        :style="{
          backgroundColor: accentColor,
          opacity: text.trim() ? 1 : 0.4,
        }"
        @click="handleSubmit"
        :disabled="!text.trim()"
      >
        {{ submitLabel }}
      </button>
    </div>
  </div>
</template>
