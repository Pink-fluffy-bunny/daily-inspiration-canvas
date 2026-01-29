# 更新日志

## 2026-01-29

### v0.1.3 修改说明：
1. 实现在画作卡片上展示画作说明的功能
    - 在 GalleryPage.vue 中添加了说明展示：在作品卡片的标题和日期之间插入了说明文字。
    - 实现了字数判断截断逻辑：在脚本层通过 truncateText 函数进行硬截断（当前设定的最大字符数为 45，超过则显示 ...）。
    - 在 UI 层通过 CSS 的 -webkit-line-clamp 实现了多行文本截断（最多显示 2 行），确保卡片布局整齐。
    - 优化了视觉样式：为说明文字添加了专门的 CSS 样式，包括字体大小、行高和颜色，使其与卡片整体风格保持一致。

### v0.1.2 修复说明：
1. 修复有时打开画布时，画布内容显示不完整的问题。
    - 修正视口宽度：将 .gallery-page 的宽度从 100vw 改为 100%。在 Windows 和 Electron 环境下，100vw 渲染时包含滚动条宽度，这在全屏切换瞬间会导致布局计算出现几个像素的偏差，从而把右侧内容挤出屏幕。
    - 强制 Flex 约束：为 .gallery-main 添加了 min-width: 0。在 Flex 布局中，如果容器内有 Grid 等无法轻易缩小的复杂元素，Flex 子项默认不会缩小到比内容更窄。设置 min-width: 0 后，它会严格遵循父容器分配的剩余空间。
    - 锁定侧边栏宽度：为 .gallery-sidebar 添加了 flex-shrink: 0，确保它是固定的 280px，不会在全屏布局重算时因为压力而发生形变，保证了主展示区的空间稳定性。

2. 修复添加标签报错：Uncaught (in promise) DataCloneError: Failed to execute 'put' on 'IDBObjectStore': [object Array] could not be cloned.的问题
    - 修复组件中的数据处理：在 ArtworkInfoEditor.vue中，当保存标签时，通过展开运算符 [...formData.tags] 将响应式数组转换为普通数组。
    - 增强存储工具类的鲁棒性：在 storageUtils.ts 中，为所有写入操作（put, add）添加了对象清洗逻辑。引入了 JSON.parse(JSON.stringify(obj)) 这种简单有效的方法，在数据存入 IndexedDB 之前将其彻底转换为普通的 JavaScript 对象。添加了updateArtwork函数，专门用于高效更新单个作品信息。
    - 优化 Store 调用：更新了 Pinia Store，使其调用更安全、更高效的存储方法。updateArtworkInfo现在使用新增的 updateArtwork工具函数，避免了之前需要批量保存整个列表的操作，提高了性能并彻底杜绝了克隆错误。