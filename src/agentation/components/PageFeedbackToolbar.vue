<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { 
  IconListSparkle, IconClose, IconEye, 
  IconCopyAlt, IconTrashAlt, IconSun, IconMoon
} from './Icons';
import AnnotationPopup from './AnnotationPopup.vue';
import { 
  identifyElement, getNearbyText, getElementClasses, 
  getDetailedComputedStyles, getForensicComputedStyles, 
  getFullElementPath, getAccessibilityInfo
} from '../utils/element-identification';
import { loadAnnotations, saveAnnotations } from '../utils/storage';
import { getSourceLocation, formatSourceLocation } from '../utils/source-location';
import type { Annotation, ToolbarSettings } from '../types';
import styles from './PageFeedbackToolbar.module.scss';

// =============================================================================
// Constants & Defaults
// =============================================================================

const DEFAULT_SETTINGS: ToolbarSettings = {
  outputDetail: "standard",
  autoClearAfterCopy: false,
  annotationColor: "#3c82f7",
  blockInteractions: true,
};

// =============================================================================
// Props & Emits
// =============================================================================

interface Props {
  enableDemoMode?: boolean;
  copyToClipboard?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  enableDemoMode: false,
  copyToClipboard: true
});

const emit = defineEmits([
  'annotation-add',
  'annotation-delete', 
  'annotation-update',
  'annotations-clear',
  'copy'
]);

// =============================================================================
// State
// =============================================================================

interface PendingAnnotation {
  x: number;
  y: number;
  clientY: number;
  element: string;
  elementPath: string;
  selectedText?: string;
  boundingBox: { x: number; y: number; width: number; height: number };
  nearbyText: string;
  cssClasses: string;
  isFixed: boolean;
  fullPath: string;
  accessibility: string;
  computedStyles: string;
  computedStylesObj: Record<string, string>;
  sourceInfo: string;
}

const isActive = ref(false);
const annotations = ref<Annotation[]>([]);
const showMarkers = ref(true);
const markersVisible = ref(false);
const markersExiting = ref(false);
const hoverInfo = ref<{ element: string; elementPath: string; rect: DOMRect | null } | null>(null);
const hoverPosition = ref({ x: 0, y: 0 });
const pendingAnnotation = ref<PendingAnnotation | null>(null);
const copied = ref(false);
const settings = ref<ToolbarSettings>(DEFAULT_SETTINGS);
const isDarkMode = ref(true);
const mounted = ref(false);
const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';

// =============================================================================
// Lifecycle
// =============================================================================

onMounted(() => {
  mounted.value = true;
  annotations.value = loadAnnotations<Annotation>(pathname);
  
  // Load settings
  try {
    const storedSettings = localStorage.getItem("feedback-toolbar-settings");
    if (storedSettings) {
      settings.value = { ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) };
    }
    const savedTheme = localStorage.getItem("feedback-toolbar-theme");
    if (savedTheme !== null) {
      isDarkMode.value = savedTheme === "dark";
    }
  } catch (e) {}

  document.addEventListener('mousemove', handleGlobalMouseMove);
  document.addEventListener('click', handleGlobalClick, true);
  window.addEventListener('keydown', handleGlobalKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('mousemove', handleGlobalMouseMove);
  document.removeEventListener('click', handleGlobalClick, true);
  window.removeEventListener('keydown', handleGlobalKeyDown);
});

// =============================================================================
// Watchers
// =============================================================================

watch(annotations, (newVal) => {
  if (mounted.value) {
    saveAnnotations(pathname, newVal);
  }
}, { deep: true });

watch(settings, (newVal) => {
  if (mounted.value) {
    localStorage.setItem("feedback-toolbar-settings", JSON.stringify(newVal));
  }
}, { deep: true });

watch(isDarkMode, (newVal) => {
  if (mounted.value) {
    localStorage.setItem("feedback-toolbar-theme", newVal ? "dark" : "light");
  }
});

watch([isActive, showMarkers], ([active, show]) => {
  if (active && show) {
    markersVisible.value = true;
    markersExiting.value = false;
  } else {
    markersExiting.value = true;
    setTimeout(() => {
      markersVisible.value = false;
      markersExiting.value = false;
    }, 250);
  }
});

// =============================================================================
// Methods
// =============================================================================

const handleGlobalMouseMove = (e: MouseEvent) => {
  if (!isActive.value || pendingAnnotation.value) return;

  const target = e.target as HTMLElement;
  if (target.closest("[data-feedback-toolbar]")) {
    hoverInfo.value = null;
    return;
  }

  const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
  if (!el || el.closest("[data-feedback-toolbar]")) {
    hoverInfo.value = null;
    return;
  }

  const { name, path } = identifyElement(el);
  const rect = el.getBoundingClientRect();
  hoverInfo.value = { element: name, elementPath: path, rect };
  hoverPosition.value = { x: e.clientX, y: e.clientY };
};

const isElementFixed = (el: HTMLElement): boolean => {
  let curr: HTMLElement | null = el;
  while (curr && curr !== document.body) {
    const style = window.getComputedStyle(curr);
    if (style.position === "fixed" || style.position === "sticky") return true;
    curr = curr.parentElement;
  }
  return false;
};

const handleGlobalClick = (e: MouseEvent) => {
  if (!isActive.value) return;

  const target = e.target as HTMLElement;
  if (target.closest("[data-feedback-toolbar]") || 
      target.closest("[data-annotation-popup]") || 
      target.closest("[data-annotation-marker]")) return;

  // Always block interactions with the page when the tool is active
  e.preventDefault();
  e.stopPropagation();

  if (pendingAnnotation.value) return;

  const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
  if (!el) return;

  const { name, path } = identifyElement(el);
  const rect = el.getBoundingClientRect();
  const x = (e.clientX / window.innerWidth) * 100;
  const isFixed = isElementFixed(el);
  const y = isFixed ? e.clientY : e.clientY + window.scrollY;

  const selection = window.getSelection();
  const selectedText = selection?.toString().trim().slice(0, 500);

  // Vue Source Detection
  const sourceResult = getSourceLocation(el);
  const sourceInfo = sourceResult.found ? formatSourceLocation(sourceResult.source!) : "";

  pendingAnnotation.value = {
    x, y, clientY: e.clientY,
    element: name,
    elementPath: path,
    selectedText,
    boundingBox: {
      x: rect.left,
      y: isFixed ? rect.top : rect.top + window.scrollY,
      width: rect.width,
      height: rect.height,
    },
    nearbyText: getNearbyText(el),
    cssClasses: getElementClasses(el),
    isFixed,
    fullPath: getFullElementPath(el),
    accessibility: getAccessibilityInfo(el),
    computedStyles: getForensicComputedStyles(el),
    computedStylesObj: getDetailedComputedStyles(el),
    sourceInfo
  };
  hoverInfo.value = null;
};

const handleGlobalKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isActive.value) {
    if (pendingAnnotation.value) {
      pendingAnnotation.value = null;
    } else {
      isActive.value = false;
    }
  }
};

const submitAnnotation = (comment: string) => {
  if (!pendingAnnotation.value) return;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { clientY, computedStylesObj, sourceInfo, ...rest } = pendingAnnotation.value;
  const newAnnotation: Annotation = {
    id: Date.now().toString(),
    ...rest,
    comment,
    timestamp: Date.now(),
  };
  annotations.value.push(newAnnotation);
  pendingAnnotation.value = null;
  emit('annotation-add', newAnnotation);
};

const deleteAnnotation = (id: string) => {
  const idx = annotations.value.findIndex(a => a.id === id);
  if (idx > -1) {
    const [deleted] = annotations.value.splice(idx, 1);
    emit('annotation-delete', deleted);
  }
};

const clearAll = () => {
  const cleared = [...annotations.value];
  annotations.value = [];
  emit('annotations-clear', cleared);
};

const copyMarkdown = () => {
  const content = generateMarkdown();
  if (props.copyToClipboard) {
    navigator.clipboard.writeText(content).then(() => {
      copied.value = true;
      setTimeout(() => copied.value = false, 2000);
    });
  }
  emit('copy', content);
};

const generateMarkdown = () => {
  let md = `## Page Feedback: ${pathname}\n\n`;
  annotations.value.forEach((a, i) => {
    md += `### ${i + 1}. ${a.element}\n`;
    md += `**Location:** ${a.elementPath}\n`;
    if (a.selectedText) md += `**Selected Text:** "${a.selectedText}"\n`;
    md += `**Feedback:** ${a.comment}\n\n`;
  });
  return md.trim();
};

const toggleActive = () => {
  isActive.value = !isActive.value;
};

</script>

<template>
  <Teleport to="body">
    <div :class="[styles.toolbar, isDarkMode ? '' : styles.lightMode]" data-feedback-toolbar>
      <div :class="[styles.toolbarContainer, isActive ? styles.expanded : styles.collapsed]" @click="!isActive && toggleActive()">
        <template v-if="!isActive">
          <IconListSparkle :size="24" />
          <div v-if="annotations.length > 0" :class="styles.badge">{{ annotations.length }}</div>
        </template>
        
        <template v-else>
          <div :class="styles.controlsContent">
            <button :class="styles.controlButton" @click.stop="toggleActive" title="Close Toolbar">
              <IconClose :size="18" />
            </button>
            <div :class="styles.divider"></div>
            <button 
              :class="styles.controlButton" 
              @click.stop="showMarkers = !showMarkers" 
              :title="showMarkers ? 'Hide Markers' : 'Show Markers'"
              :data-active="showMarkers"
            >
              <IconEye :size="18" />
            </button>
            <button :class="styles.controlButton" @click.stop="copyMarkdown" title="Copy to Markdown">
              <IconCopyAlt :size="18" />
              <div v-if="copied" :class="styles.copyToast">Copied!</div>
            </button>
            <button :class="styles.controlButton" @click.stop="clearAll" title="Clear All" data-danger>
              <IconTrashAlt :size="18" />
            </button>
            <div :class="styles.divider"></div>
            <button :class="styles.controlButton" @click.stop="isDarkMode = !isDarkMode" :title="isDarkMode ? 'Light Mode' : 'Dark Mode'">
              <IconSun v-if="isDarkMode" :size="18" />
              <IconMoon v-else :size="18" />
            </button>
          </div>
        </template>
      </div>
    </div>

    <!-- Hover Highlight -->
    <div 
      v-if="isActive && hoverInfo && hoverInfo.rect" 
      :class="styles.hoverHighlight"
      :style="{
        left: hoverInfo.rect.left + 'px',
        top: hoverInfo.rect.top + 'px',
        width: hoverInfo.rect.width + 'px',
        height: hoverInfo.rect.height + 'px'
      }"
    ></div>
    
    <!-- Hover Tooltip -->
    <div 
      v-if="isActive && hoverInfo" 
      :class="styles.hoverTooltip"
      :style="{
        left: hoverPosition.x + 15 + 'px',
        top: hoverPosition.y + 15 + 'px'
      }"
    >
      {{ hoverInfo.element }}
    </div>

    <!-- Markers -->
    <div v-if="markersVisible" :class="[styles.markersLayer, markersExiting ? styles.exiting : '']">
      <div 
        v-for="(a, i) in annotations" 
        :key="a.id"
        :class="[styles.marker, a.isFixed ? styles.fixed : '']"
        :style="{
          left: a.x + '%',
          top: a.y + 'px',
          backgroundColor: settings.annotationColor
        }"
        data-annotation-marker
        @click="deleteAnnotation(a.id)"
      >
        {{ i + 1 }}
      </div>
    </div>

    <!-- Pending Annotation Popup -->
    <AnnotationPopup
      v-if="pendingAnnotation"
      :element="pendingAnnotation.element"
      :selected-text="pendingAnnotation.selectedText"
      :computed-styles="pendingAnnotation.computedStylesObj"
      :accent-color="settings.annotationColor"
      :style="{
        left: pendingAnnotation.x + '%',
        top: (pendingAnnotation.clientY + 20) + 'px'
      }"
      @cancel="pendingAnnotation = null"
      @submit="submitAnnotation"
    />
  </Teleport>
</template>
