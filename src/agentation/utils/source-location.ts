// =============================================================================
// Source Location Detection Utilities (Vue Version)
// =============================================================================
//
// This module provides utilities for detecting Vue source file locations from
// DOM elements. It works by accessing Vue's internal instance information
// (__vueParentComponent) that's available in development builds.
//
// Compatibility:
// - Vue 3.x
//
// Limitations:
// - Only works in development builds (production builds strip __file)
// - Requires Access to __vueParentComponent or __vue_app__
// =============================================================================

/**
 * Source location information for a Vue component
 */
export interface SourceLocation {
  /** Absolute file path */
  fileName: string;
  /** Line number (1-indexed) - Note: Vue often only gives file path, not line number for the specific element */
  lineNumber?: number;
  /** Component display name if available */
  componentName?: string;
}

/**
 * Result of source location detection
 */
export interface SourceLocationResult {
  /** Whether source location was found */
  found: boolean;
  /** Source location data (if found) */
  source?: SourceLocation;
  /** Reason if not found */
  reason?: string;
}

/**
 * Internal Vue Instance Type (Partial)
 */
interface VueInternalInstance {
  type?: {
    __file?: string;
    name?: string;
    __name?: string; // <script setup> name
  };
  parent?: VueInternalInstance | null;
  /** Root element */
  vnode?: {
    el?: Node;
  };
}

/**
 * Extended HTMLElement with Vue internal properties
 */
interface VueHTMLElement extends HTMLElement {
  __vueParentComponent?: VueInternalInstance;
  __vue_app__?: unknown;
}

/**
 * Detects if the current page is a Vue application
 */
export function detectVueApp(): boolean {
  if (typeof window === "undefined") return false;

  // Check for Vue DevTools global hook
  const devTools = (window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__;
  if (devTools) return true;

  // Check for common Vue markers
  const allElements = document.querySelectorAll('*');
  for (let i = 0; i < Math.min(allElements.length, 100); i++) {
    if ((allElements[i] as VueHTMLElement).__vueParentComponent) {
      return true;
    }
  }

  return false;
}

/**
 * Gets the source file location for a DOM element in a Vue application
 */
export function getSourceLocation(element: HTMLElement): SourceLocationResult {
  const vueEl = element as VueHTMLElement;

  // 1. Try direct component instance on the element
  let instance = vueEl.__vueParentComponent;

  // 2. If not found, walk up the DOM to find the nearest Vue component boundary
  if (!instance) {
    let current: HTMLElement | null = element.parentElement;
    while (current) {
      const parentVueEl = current as VueHTMLElement;
      if (parentVueEl.__vueParentComponent) {
        instance = parentVueEl.__vueParentComponent;
        break;
      }
      current = current.parentElement;
    }
  }

  if (!instance) {
    return {
      found: false,
      reason: "no-vue-instance"
    };
  }

  // 3. Extract file path from the component type definition
  // Vue 3 development build adds `__file` to the component definition
  if (instance.type && instance.type.__file) {
    const fileName = instance.type.__file;
    // Prefer __name (script setup) or name or infer from filename
    const componentName = instance.type.__name || instance.type.name || fileName.split('/').pop()?.replace(/\.\w+$/, '');
    
    return {
      found: true,
      source: {
        fileName,
        componentName,
        // Vue runtime doesn't easily give us the line number of the specific element within the template
        // without compiler source maps active in the runtime. 
        // We accept file-level granularity for now.
        lineNumber: 1 
      }
    };
  }

  return {
    found: false,
    reason: "no-debug-source"
  };
}

/**
 * Formats a source location as a clickable file path string
 */
export function formatSourceLocation(
  source: SourceLocation,
  format: "path" | "vscode" = "path"
): string {
  const { fileName, lineNumber } = source;
  const location = `${fileName}${lineNumber ? `:${lineNumber}` : ''}`;

  if (format === "vscode") {
    // VSCode URL schema
    return `vscode://file${fileName.startsWith("/") ? "" : "/"}${location}`;
  }

  return location;
}

/**
 * Checks if source location detection is likely to work
 */
export function checkSourceLocationSupport(): {
  supported: boolean;
  reason: string;
} {
  const isVue = detectVueApp();
  if (!isVue) {
    return {
      supported: false,
      reason: "No Vue application detected"
    };
  }

  return {
    supported: true,
    reason: "Vue application detected"
  };
}
