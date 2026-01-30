import { Engine } from '../components/Engine';
import { MouseInput } from '../components/MouseInput';
import { Keyboard } from '../components/Keyboard';
import { Window } from './Window';
import { HudScreen } from './windows/HudScreen';
import { Tooltip } from './components/Tooltip';

/**
 * Менеджер экранов и окон
 * Центральная точка управления всем UI
 */
export class ScreenManager {
  private windows: Window[] = [];
  private hud: HudScreen;
  private mouse: MouseInput;
  private getControlledEntity: () => any;

  /**
   * Создать менеджер экранов
   * @param engine Движок игры
   * @param mouse Входные данные мыши
   * @param getControlledEntity Функция получения управляемой сущности
   */
  constructor(engine: Engine, mouse: MouseInput, getControlledEntity: () => any) {
    this.mouse = mouse;
    this.getControlledEntity = getControlledEntity;
    
    // Initialize HUD
    this.hud = new HudScreen(engine, getControlledEntity);
  }

  /**
   * Открыть окно
   * @param window Окно для открытия
   */
  openWindow(window: Window): void {
    this.windows.push(window);
  }

  /**
   * Закрыть окно
   * @param window Окно для закрытия
   */
  closeWindow(window: Window): void {
    const index = this.windows.indexOf(window);
    if (index !== -1) {
      this.windows.splice(index, 1);
    }
  }

  /**
   * Закрыть верхнее окно
   */
  closeTopWindow(): void {
    if (this.windows.length > 0) {
      this.windows.pop();
    }
  }

  /**
   * Закрыть все окна
   */
  closeAllWindows(): void {
    this.windows = [];
  }

  /**
   * Есть ли активные окна
   * @returns true, если есть хотя бы одно открытое окно
   */
  hasActiveWindows(): boolean {
    return this.windows.length > 0;
  }

  /**
   * Нужно ли ставить игру на паузу
   * @returns true, если открыто хотя бы одно окно с паузой
   */
  isGamePaused(): boolean {
    for (const window of this.windows) {
      if (window.causesPause) {
        return true;
      }
    }
    return false;
  }

  /**
   * Блокирует ли управление игроком
   * @returns true, если открыто хотя бы одно окно
   */
  blocksPlayerInput(): boolean {
    return this.windows.length > 0;
  }

  /**
   * Обновление всех окон и компонентов
   */
  update(): void {
    // Update HUD
    this.hud.update(this.mouse);
    
    // Update windows from bottom to top
    for (const window of this.windows) {
      window.update(this.mouse);
    }
  }

  /**
   * Отрисовка всего UI
   */
  render(): void {
    // Render HUD first (always visible)
    this.hud.render(this.hud.engine.context);
    
    // Render windows from bottom to top
    for (const window of this.windows) {
      window.render(this.hud.engine.context);
    }
    
    // Check for tooltips in windows (from top to bottom to prioritize topmost window)
    for (let i = this.windows.length - 1; i >= 0; i--) {
      const tooltip = this.windows[i].getTooltip();
      if (tooltip) {
        Tooltip.render(
          this.hud.engine.context,
          tooltip.text,
          tooltip.x + this.windows[i].x,  // Adjust tooltip position relative to window
          tooltip.y + this.windows[i].y
        );
        break; // Only show tooltip from topmost window
      }
    }
  }

  /**
   * Получить ссылку на HUD
   * @returns HUD-экран
   */
  getHud(): HudScreen {
    return this.hud;
  }
}