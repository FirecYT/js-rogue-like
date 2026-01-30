import { Component } from '../Component';
import { MouseInput } from '../../components/MouseInput';
import { Item } from '../../items/Item';

/**
 * Слот для предмета
 */
export class ItemSlot extends Component {
  /** Предмет в слоте */
  public item: Item | null = null;
  
  /** Индекс слота */
  public slotIndex: number;

  /**
   * Создать слот для предмета
   * @param slotIndex Индекс слота
   * @param width Ширина слота
   * @param height Высота слота
   */
  constructor(slotIndex: number, width: number = 60, height: number = 60) {
    super();
    this.slotIndex = slotIndex;
    this.width = width;
    this.height = height;
  }

  /**
   * Установить предмет в слот
   * @param item Предмет или null для очистки
   */
  setItem(item: Item | null): void {
    this.item = item;
  }

  /**
   * Обновление состояния (наведение)
   * @param mouse Входные данные мыши
   */
  update(mouse: MouseInput): void {
    // Calculate mouse position relative to slot
    const relativeX = mouse.x - (this.x || 0);
    const relativeY = mouse.y - (this.y || 0);

    // Check if mouse is over slot
    const isOverSlot = relativeX >= 0 && relativeX <= this.width && 
                       relativeY >= 0 && relativeY <= this.height;

    this.setHovered(isOverSlot);
  }

  /**
   * Отрисовка слота
   * @param ctx Контекст канваса
   * @param offsetX Смещение по оси X от родителя
   * @param offsetY Смещение по оси Y от родителя
   */
  render(ctx: CanvasRenderingContext2D, offsetX: number = 0, offsetY: number = 0): void {
    // Draw slot background
    ctx.fillStyle = this.hovered ? '#5a5' : '#aaa';
    ctx.fillRect(offsetX + this.x, offsetY + this.y, this.width, this.height);
    
    // Draw slot border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(offsetX + this.x, offsetY + this.y, this.width, this.height);
    
    // Draw item if present
    if (this.item) {
      ctx.fillStyle = '#fff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Draw item name (truncated if too long)
      let itemName = this.item.name;
      if (itemName.length > 8) {
        itemName = itemName.substring(0, 8) + '...';
      }
      
      ctx.fillText(itemName, offsetX + this.x + this.width / 2, offsetY + this.y + this.height / 2);
    }
  }

  /**
   * Получить подсказку для предмета
   * @returns Объект с текстом подсказки и позицией или null
   */
  getTooltip(): { text: string; x: number; y: number } | null {
    if (this.hovered && this.item) {
      return {
        text: this.item.name,
        x: this.x + this.width / 2,
        y: this.y + this.height
      };
    }
    return null;
  }
}