import { Component } from '../Component';
import { MouseInput } from '../../components/MouseInput';

/**
 * Вертикальный контейнер
 * Располагает дочерние компоненты один под другим
 */
export class VerticalLayout extends Component {
  /** Массив дочерних компонентов */
  public children: Component[] = [];
  
  /** Расстояние между компонентами */
  public spacing: number = 10;
  
  /** Отступы контейнера */
  public padding = { top: 0, right: 0, bottom: 0, left: 0 };

  /**
   * Добавить дочерний компонент
   * @param child Компонент для добавления
   */
  addChild(child: Component): void {
    this.children.push(child);
    this.recalculateLayout();
  }

  /**
   * Удалить дочерний компонент
   * @param child Компонент для удаления
   */
  removeChild(child: Component): void {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      this.children.splice(index, 1);
      this.recalculateLayout();
    }
  }

  /**
   * Пересчитать расположение дочерних компонентов
   */
  private recalculateLayout(): void {
    let currentY = this.padding.top;
    
    for (const child of this.children) {
      child.x = this.padding.left;
      child.y = currentY;
      
      currentY += child.height + this.spacing;
    }
    
    // Update container height based on children
    this.height = currentY - this.spacing + this.padding.bottom;
  }

  /**
   * Обновление всех дочерних компонентов
   * @param mouse Входные данные мыши
   */
  update(mouse: MouseInput): void {
    for (const child of this.children) {
      // Calculate mouse position relative to child
      const relativeX = mouse.x - (this.x || 0);
      const relativeY = mouse.y - (this.y || 0);
      
      // Create a temporary mouse object with relative coordinates
      const relativeMouse = {
        ...mouse,
        x: relativeX,
        y: relativeY
      };
      
      // Update the child component
      child.update(relativeMouse);
    }
  }

  /**
   * Отрисовка всех дочерних компонентов
   * @param ctx Контекст канваса
   * @param offsetX Смещение по оси X от родителя
   * @param offsetY Смещение по оси Y от родителя
   */
  render(ctx: CanvasRenderingContext2D, offsetX: number = 0, offsetY: number = 0): void {
    for (const child of this.children) {
      child.render(ctx, offsetX + (this.x || 0), offsetY + (this.y || 0));
    }
  }
}