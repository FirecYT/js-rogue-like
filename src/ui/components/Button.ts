import { Component } from '../Component';
import { MouseInput } from '../../components/MouseInput';

/**
 * Кнопка
 */
export class Button extends Component {
  private text: string;
  private onClickCallback: (() => void) | null = null;

  /**
   * Создать кнопку
   * @param text Текст на кнопке
   * @param width Ширина кнопки
   * @param height Высота кнопки
   */
  constructor(text: string, width: number = 100, height: number = 30) {
    super();
    this.text = text;
    this.width = width;
    this.height = height;
  }

  /**
   * Установить обработчик клика
   * @param callback Функция, вызываемая при клике
   */
  setOnClick(callback: () => void): void {
    this.onClickCallback = callback;
  }

  /**
   * Обновить текст кнопки
   * @param text Новый текст
   */
  setText(text: string): void {
    this.text = text;
  }

  /**
   * Проверка и обработка клика
   * @returns true, если был клик по кнопке
   */
  handleClick(): boolean {
    if (this.active && this.onClickCallback) {
      this.onClickCallback();
      return true;
    }
    return false;
  }

  /**
   * Обновление состояния кнопки (наведение, нажатие)
   * @param mouse Входные данные мыши
   */
  update(mouse: MouseInput): void {
    // Calculate mouse position relative to button
    const relativeX = mouse.x - (this.x || 0);
    const relativeY = mouse.y - (this.y || 0);

    // Check if mouse is over button
    const isOverButton = relativeX >= 0 && relativeX <= this.width && 
                         relativeY >= 0 && relativeY <= this.height;

    this.setHovered(isOverButton);

    // Update active state based on mouse press and hover
    if (isOverButton && mouse.pressed) {
      this.setActive(true);
    } else {
      this.setActive(false);
    }

    // Handle click
    if (this.active && !mouse.pressed) {
      this.handleClick();
      this.setActive(false);
    }
  }

  /**
   * Отрисовка кнопки
   * @param ctx Контекст канваса
   * @param offsetX Смещение по оси X от родителя
   * @param offsetY Смещение по оси Y от родителя
   */
  render(ctx: CanvasRenderingContext2D, offsetX: number = 0, offsetY: number = 0): void {
    // Draw button background
    ctx.fillStyle = this.active ? '#5a5' : (this.hovered ? '#6b6' : '#aaa');
    ctx.fillRect(offsetX + this.x, offsetY + this.y, this.width, this.height);
    
    // Draw button border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(offsetX + this.x, offsetY + this.y, this.width, this.height);
    
    // Draw button text
    ctx.fillStyle = '#000';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.text, offsetX + this.x + this.width / 2, offsetY + this.y + this.height / 2);
  }
}