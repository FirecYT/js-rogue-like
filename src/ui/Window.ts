import { Component } from './Component';
import { MouseInput } from '../components/MouseInput';
import { AbsoluteContainer } from './containers/AbsoluteContainer';

/**
 * Базовый класс для всех окон
 */
export abstract class Window extends Component {
  /** Корневой контейнер окна */
  public root: AbsoluteContainer;
  
  /** Флаг модальности окна */
  public modal: boolean = false;
  
  /** Флаг, вызывает ли окно паузу игры */
  public causesPause: boolean = false;
  
  /** Заголовок окна */
  public title: string = '';

  constructor() {
    super();
    this.root = new AbsoluteContainer();
  }

  /**
   * Обновление окна и всех дочерних компонентов
   * @param mouse Входные данные мыши
   */
  update(mouse: MouseInput): void {
    // Calculate mouse position relative to window
    const relativeX = mouse.x - this.x;
    const relativeY = mouse.y - this.y;
    
    // Update the root container
    this.root.update(mouse);
    
    // Handle click events
    if (mouse.pressed) {
      this.handleClick(relativeX, relativeY);
    }
  }

  /**
   * Отрисовка окна
   * @param ctx Контекст канваса
   */
  render(ctx: CanvasRenderingContext2D): void {
    // Draw window background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    // Draw window border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    
    // Draw title if exists
    if (this.title) {
      ctx.fillStyle = '#fff';
      ctx.font = '16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(this.title, this.x + 10, this.y + 20);
      
      // Draw title separator line
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + 25);
      ctx.lineTo(this.x + this.width, this.y + 25);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    // Render root container
    this.root.render(ctx, this.x, this.y);
  }

  /**
   * Рекурсивный поиск подсказки в дочерних компонентах
   * @returns Объект с текстом подсказки и позицией или null
   */
  getTooltip(): { text: string; x: number; y: number } | null {
    // Check if any child component has a tooltip
    for (const child of this.root.children) {
      if (child.getTooltip) {
        const tooltip = child.getTooltip();
        if (tooltip) {
          return tooltip;
        }
      }
    }
    return null;
  }

  /**
   * Обработка клика внутри окна
   * @param mouseX Координата клика по оси X
   * @param mouseY Координата клика по оси Y
   */
  handleClick(mouseX: number, mouseY: number): void {
    // Default implementation - can be overridden by subclasses
  }
}