/**
 * 获取Canvas在页面中的坐标
 */
export const getCanvasCoordinates = (
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number
): { x: number; y: number } => {
  const rect = canvas.getBoundingClientRect();
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
};

/**
 * 获取触摸事件的坐标
 */
export const getTouchCoordinates = (
  canvas: HTMLCanvasElement,
  touch: Touch
): { x: number; y: number } => {
  const rect = canvas.getBoundingClientRect();
  return {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top
  };
};

/**
 * 清空Canvas
 */
export const clearCanvas = (canvas: HTMLCanvasElement): void => {
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
};

/**
 * 绘制线条
 */
export const drawLine = (
  canvas: HTMLCanvasElement,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  lineWidth: number
): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
};

/**
 * 擦除区域
 */
export const eraseArea = (
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
  lineWidth: number
): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.beginPath();
  ctx.arc(x, y, lineWidth / 2, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
};

/**
 * 获取Canvas的ImageData（用于历史记录）
 */
export const getCanvasState = (canvas: HTMLCanvasElement): ImageData | null => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
};

/**
 * 恢复Canvas的ImageData
 */
export const restoreCanvasState = (
  canvas: HTMLCanvasElement,
  imageData: ImageData
): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.putImageData(imageData, 0, 0);
};

/**
 * 下载Canvas为图片
 */
export const downloadCanvasAsImage = (
  canvas: HTMLCanvasElement,
  filename = 'artwork.png'
): void => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
};

/**
 * 设置Canvas背景色为白色（防止透明背景）
 */
export const setCanvasBackground = (
  canvas: HTMLCanvasElement,
  color = '#FFFFFF'
): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};
