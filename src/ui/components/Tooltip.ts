/**
 * Утилита для отрисовки подсказок
 */
export class Tooltip {
  /**
   * Отрисовать подсказку
   * @param ctx Контекст канваса
   * @param text Текст подсказки (может содержать \n для переноса строк)
   * @param x Позиция по оси X
   * @param y Позиция по оси Y
   * @param offsetX Смещение по оси X от позиции
   * @param offsetY Смещение по оси Y от позиции
   */
  static render(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    offsetX: number = 10,
    offsetY: number = 10
  ): void {
    // Split text into lines
    const lines = text.split('\n');
    
    // Calculate dimensions
    ctx.font = '14px Arial';
    let maxWidth = 0;
    const lineHeight = 16;
    
    // Find the longest line to determine width
    for (const line of lines) {
      const width = ctx.measureText(line).width;
      if (width > maxWidth) {
        maxWidth = width;
      }
    }
    
    // Add padding
    const padding = 5;
    const width = maxWidth + padding * 2;
    const height = lines.length * lineHeight + padding * 2;
    
    // Adjust position to avoid going off screen
    let adjustedX = x + offsetX;
    let adjustedY = y + offsetY;
    
    // Make sure tooltip stays within canvas bounds
    if (adjustedX + width > ctx.canvas.width) {
      adjustedX = x - width - offsetX;
    }
    if (adjustedY + height > ctx.canvas.height) {
      adjustedY = y - height - offsetY;
    }
    
    // Draw tooltip background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(adjustedX, adjustedY, width, height);
    
    // Draw tooltip border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(adjustedX, adjustedY, width, height);
    
    // Draw text
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], adjustedX + padding, adjustedY + padding + i * lineHeight);
    }
  }
}