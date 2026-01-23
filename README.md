# 🎨 每日灵感画板

一个简单有趣的创意绘画应用，结合了随机灵感提示和完整的绘图功能。

## ✨ 功能特性

- **随机灵感生成** - 每天/每次刷新都能获得新的创意提示词
- **完整绘图工具** - 画笔、橡皮擦、可调节大小和颜色
- **撤销/重做** - 支持快捷键 Ctrl+Z / Ctrl+Y
- **作品画廊** - 本地保存最多100幅作品
- **图片下载** - 将作品导出为PNG图片
- **响应式设计** - 支持桌面和移动端
- **触摸支持** - 完美支持触屏设备

## 🚀 快速开始

### 开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

然后在浏览器中打开 `http://localhost:5173`

### 构建生产版本

```bash
# 构建项目
npm run build

# 预览构建结果
npm run preview
```

## 📦 分发给其他人使用

构建后，只需分享 `dist` 文件夹：

```bash
# 构建项目
npm run build

# 分享 dist 文件夹给其他人
```

接收者只需：
1. 解压文件
2. 双击打开 `dist/index.html`
3. 在浏览器中使用

**无需安装任何依赖、Node.js或npm！**

## 🎯 如何使用

1. **查看灵感** - 顶部卡片显示今日的创意提示词
2. **点击刷新** - 点击右上角按钮获取新的灵感
3. **开始绘画** - 在画布上自由创作
4. **调整工具** - 使用工具栏调整画笔大小、颜色
5. **保存作品** - 点击"保存"按钮存到画廊
6. **下载图片** - 点击"下载"按钮保存到本地

## ⌨️ 快捷键

- `Ctrl+Z` - 撤销
- `Ctrl+Y` - 重做（或 `Ctrl+Shift+Z`）

## 📝 自定义提示词

提示词配置文件位于：`src/config/prompts.yaml`

你可以：
- 添加新的提示词
- 修改现有提示词
- 调整设置选项
- 创建新的分类

修改后重新构建即可生效。

## 💾 存储说明

- 作品保存在浏览器的 localStorage 中
- 最多保存 100 幅作品
- 超过限制时自动删除最早的作品
- 清除浏览器数据会丢失所有作品

## 🛠️ 技术栈

- **Vue 3** - 渐进式JavaScript框架
- **TypeScript** - 类型安全的JavaScript
- **Vite** - 快速的构建工具
- **Pinia** - Vue状态管理
- **HTML5 Canvas** - 绘图功能
- **YAML** - 提示词配置

## 📁 项目结构

```
daily-inspiration-canvas/
├── src/
│   ├── components/          # Vue组件
│   │   ├── CanvasBoard.vue  # 绘图板
│   │   ├── Toolbar.vue     # 工具栏
│   │   ├── ColorPicker.vue # 颜色选择器
│   │   ├── InspirationCard.vue # 灵感卡片
│   │   └── Gallery.vue    # 画廊
│   ├── config/
│   │   └── prompts.yaml    # 提示词配置
│   ├── stores/
│   │   └── canvasStore.ts # Pinia状态管理
│   ├── utils/
│   │   ├── canvasUtils.ts  # Canvas工具函数
│   │   ├── storageUtils.ts # 存储工具
│   │   └── promptLoader.ts # 提示词加载器
│   ├── types/
│   │   └── index.ts       # TypeScript类型定义
│   ├── App.vue            # 主应用组件
│   └── main.ts            # 应用入口
├── public/                # 静态资源
├── dist/                  # 构建输出（生成后）
└── package.json
```

## 🎨 配置选项

在 `src/config/prompts.yaml` 中可以配置：

```yaml
settings:
  dailyPromptEnabled: true      # 是否启用每日固定提示词
  randomFromAll: true          # 是否从所有类别混合抽取
  dailyPromptSource: date       # 提示词来源：date/随机
```

## 🌟 特色亮点

- **零依赖运行** - 打包后无需任何环境配置
- **智能压缩** - 图片自动压缩以节省存储空间
- **优雅UI** - 现代化设计，流畅动画
- **类型安全** - 完整的TypeScript类型检查
- **易于扩展** - 模块化设计，方便添加新功能

## 📝 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**享受创作的乐趣！** 🎨✨
