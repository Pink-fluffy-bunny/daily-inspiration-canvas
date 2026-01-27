// 画布状态类型
export type ToolType = 'brush' | 'eraser';

// 提示词配置类型
export interface PromptConfig {
  version: string;
  categories: {
    [key: string]: string[];
  };
  settings: {
    dailyPromptEnabled: boolean;
    randomFromAll: boolean;
    dailyPromptSource: 'date' | 'random';
  };
}

// 作品类型
export interface Artwork {
  id: string;
  prompt: string;
  thumbnail: string;
  fullImage: string;
  createdAt: number;
  size: number;
  title?: string; // 作品名称
  description?: string; // 作品说明
  completedAt?: number; // 完成日期
  tags?: string[]; // 标签
}

// 画布状态接口
export interface CanvasState {
  currentTool: ToolType;
  brushSize: number;
  brushColor: string;
  isDrawing: boolean;
  currentPrompt: string;
  history: ImageData[];
  historyIndex: number;
  savedArtworks: Artwork[];
  maxArtworks: number;
}
