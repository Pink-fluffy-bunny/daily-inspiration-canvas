import yaml from 'js-yaml';
import type { PromptConfig } from '../types';
import promptsConfig from '../config/prompts.yaml?raw';

let cachedConfig: PromptConfig | null = null;

/**
 * 加载提示词配置
 */
export const loadPrompts = (): PromptConfig => {
  if (cachedConfig) {
    return cachedConfig;
  }
  
  try {
    cachedConfig = yaml.load(promptsConfig) as PromptConfig;
    return cachedConfig;
  } catch (error) {
    console.error('Failed to load prompts config:', error);
    throw new Error('Failed to load prompts configuration');
  }
};

/**
 * 获取所有提示词（扁平化数组）
 */
export const getAllPrompts = (): string[] => {
  const { categories } = loadPrompts();
  const allPrompts: string[] = [];
  
  Object.values(categories).forEach(prompts => {
    allPrompts.push(...prompts);
  });
  
  return allPrompts;
};

/**
 * 根据分类获取提示词
 */
export const getPromptsByCategory = (category: string): string[] => {
  const { categories } = loadPrompts();
  return categories[category] || [];
};

/**
 * 获取每日提示词
 * 基于日期生成固定的提示词
 */
export const getDailyPrompt = (): string => {
  const { settings } = loadPrompts();
  
  if (!settings.dailyPromptEnabled) {
    return getRandomPrompt();
  }
  
  const allPrompts = getAllPrompts();
  if (allPrompts.length === 0) {
    return '开始你的创作吧！';
  }
  
  const today = new Date();
  const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  
  // 简单的哈希函数
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    const char = dateString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  const index = Math.abs(hash) % allPrompts.length;
  return allPrompts[index]!;
};

/**
 * 获取随机提示词
 */
export const getRandomPrompt = (): string => {
  const allPrompts = getAllPrompts();
  if (allPrompts.length === 0) {
    return '开始你的创作吧！';
  }
  const randomIndex = Math.floor(Math.random() * allPrompts.length);
  return allPrompts[randomIndex]!;
};

/**
 * 获取随机分类的提示词
 */
export const getRandomCategoryPrompt = (): string => {
  const { categories } = loadPrompts();
  const categoryKeys = Object.keys(categories);
  if (categoryKeys.length === 0) {
    return '开始你的创作吧！';
  }
  const randomCategory = categoryKeys[Math.floor(Math.random() * categoryKeys.length)]!;
  const prompts = getPromptsByCategory(randomCategory);
  if (prompts.length === 0) {
    return '开始你的创作吧！';
  }
  return prompts[Math.floor(Math.random() * prompts.length)]!;
};
