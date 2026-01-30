import { Component } from '../Component';
import { MouseInput } from '../../components/MouseInput';
import { Engine } from '../../components/Engine';
import { PlayerProgression } from '../../systems/PlayerProgression';

/**
 * Основной экран HUD (отображается всегда)
 */
export class HudScreen extends Component {
  public engine: Engine;
  private getControlledEntity: () => any;
  private playerProgression: PlayerProgression | null = null;

  /**
   * Создать экран HUD
   * @param engine Движок игры
   * @param getControlledEntity Функция получения управляемой сущности
   */
  constructor(engine: Engine, getControlledEntity: () => any) {
    super();
    this.engine = engine;
    this.getControlledEntity = getControlledEntity;
  }

  /**
   * Установить систему прогрессии игрока
   * @param progression Система прогрессии
   */
  setPlayerProgression(progression: PlayerProgression): void {
    this.playerProgression = progression;
  }

  /**
   * Обновление состояния HUD
   * @param mouse Входные данные мыши
   */
  update(mouse: MouseInput): void {
    // HUD updates are handled separately since it's always visible
    // We could add interactive elements to HUD if needed later
  }

  /**
   * Отрисовка всего HUD
   * @param ctx Контекст канваса
   */
  render(ctx: CanvasRenderingContext2D): void {
    // Draw score if player progression is available
    if (this.playerProgression) {
      ctx.fillStyle = '#fff';
      ctx.font = '16px Arial';
      ctx.fillText(`Score: ${this.playerProgression.experience}`, 10, 20);
      
      // Draw level
      ctx.fillText(`Level: ${this.playerProgression.level}`, 10, 40);
      
      // Draw progress bar
      ctx.fillStyle = '#060';
      ctx.fillRect(0, 0, this.engine.canvas.width, 5);
      ctx.fillStyle = '#494';
      ctx.fillRect(
        0,
        0,
        this.engine.canvas.width * (this.playerProgression.experience / this.playerProgression.experienceToNext),
        5
      );
    }
    
    // Draw cooldowns
    const entity = this.getControlledEntity();
    if (entity && entity.inventory) {
      const cooldowns = entity.inventory.getCooldowns();
      ctx.fillStyle = '#ccc';
      for (let i = 0; i < cooldowns.length; i++) {
        ctx.fillRect(5, this.engine.canvas.height - 10 - 10 * i, 100, 5);
      }
      ctx.fillStyle = '#f99';
      for (let i = 0; i < cooldowns.length; i++) {
        ctx.fillRect(
          5,
          this.engine.canvas.height - 10 - 10 * i,
          100 * cooldowns[i].val,
          5
        );
      }
      ctx.fillStyle = '#fff';
      ctx.textBaseline = 'middle';
      for (let i = 0; i < cooldowns.length; i++) {
        ctx.fillText(
          cooldowns[i].name,
          110,
          this.engine.canvas.height - 5 - 2 - 10 * i
        );
      }
    }
  }
}