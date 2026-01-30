import { Component } from '../Component';
import { MouseInput } from '../../components/MouseInput';

/**
 * Контейнер с абсолютным позиционированием
 * Каждый дочерний компонент имеет свои координаты
 */
export class AbsoluteContainer extends Component {
  /** Массив дочерних компонентов */
  public children: Component[] = [];

  /**
   * Добавить дочерний компонент
   * @param child Компонент для добавления
   */
  addChild(child: Component): void {
    this.children.push(child);
  }

  /**
   * Удалить дочерний компонент
   * @param child Компонент для удаления
   */
  removeChild(child: Component): void {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      this.children.splice(index, 1);
    }
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