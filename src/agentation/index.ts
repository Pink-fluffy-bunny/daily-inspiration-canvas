import type { App } from 'vue';
import PageFeedbackToolbar from './components/PageFeedbackToolbar.vue';
import type { Annotation, ToolbarSettings } from './types';

// Export components
export { PageFeedbackToolbar as Agentation };
export { PageFeedbackToolbar };

// Export types
export type { Annotation, ToolbarSettings };

// Export as Vue Plugin
export default {
  install: (app: App) => {
    app.component('Agentation', PageFeedbackToolbar);
  }
};
