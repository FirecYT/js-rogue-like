import Entity from './Entity';
import type { Controllable, HasPosition, HasSpeed } from '../types/EntityTraits';
import type { IController } from '../controllers/Controller';
import type { EntityDefinition } from '../content/entities/definitions';

/**
 * Универсальная сущность конвейера: всё поведение и внешность описаны
 * декларативно (EntityDefinition); класс не знает о конкретных врагах.
 * Реализует Controllable, поэтому любая сущность конвейера (включая боссов)
 * играбельна через ControlSwitchService.
 */
export class DeclarativeEntity
	extends Entity
	implements HasPosition, HasSpeed, Controllable
{
	public controller: IController | null = null;
	/** Опыт за убийство (из определения, для прогрессии игрока). */
	public readonly experience: number;

	/**
	 * @param definition - Декларативное описание сущности
	 * @param x - Мировая координата X
	 * @param y - Мировая координата Y
	 */
	constructor(
		public readonly definition: EntityDefinition,
		x: number,
		y: number
	) {
		super(x, y, definition.hp);
		this.speed = definition.speed;
		this.width = definition.size;
		this.height = definition.size;
		this.team = definition.team;
		this.experience = definition.experience ?? 0;
		if (definition.solid !== undefined) this.solid = definition.solid;
		if (definition.targetable !== undefined) {
			this.targetable = definition.targetable;
		}
	}

	/**
	 * Отрисовка по спецификации внешности: квадрат или круг, обводка, полоска HP.
	 * @param ctx - Контекст канваса
	 */
	render(ctx: CanvasRenderingContext2D): void {
		const { appearance } = this.definition;
		const half = appearance.size / 2;

		ctx.fillStyle = appearance.color;
		if (appearance.shape === 'rect') {
			ctx.fillRect(this.x - half, this.y - half, appearance.size, appearance.size);
			if (appearance.outline) {
				ctx.strokeStyle = appearance.outline;
				ctx.lineWidth = 1;
				ctx.strokeRect(
					this.x - half - 1,
					this.y - half - 1,
					appearance.size + 2,
					appearance.size + 2
				);
			}
		} else {
			ctx.beginPath();
			ctx.arc(this.x, this.y, half, 0, Math.PI * 2);
			ctx.fill();
			if (appearance.outline) {
				ctx.strokeStyle = appearance.outline;
				ctx.lineWidth = 2;
				ctx.stroke();
			}
		}

		if (appearance.showHpBar) {
			const barWidth = Math.max(appearance.size + 6, 22);
			const hpPercent = this.getHP() / this.maxHP;
			ctx.fillStyle = '#000';
			ctx.fillRect(this.x - barWidth / 2, this.y - half - 9, barWidth, 4);
			ctx.fillStyle = '#0f0';
			ctx.fillRect(
				this.x - barWidth / 2 + 1,
				this.y - half - 8,
				(barWidth - 2) * hpPercent,
				2
			);
		}
	}
}
