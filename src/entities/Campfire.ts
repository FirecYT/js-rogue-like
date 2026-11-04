import Entity from './Entity';
import type { EntityWorld } from '../core/EntityWorld';

/** Радиус тепла костра, px. */
const WARMTH_RADIUS = 130;
/** Интервал восстановления (кадры) и его объём. */
const HEAL_INTERVAL = 30;
const HEAL_AMOUNT = 1;

/**
 * Костёр: точка отдыха в диких регионах. Медленно возвращает здоровье
 * всем дружественным сущностям в радиусе тепла. Не атакуется и не
 * удаляется очисткой — мирная структура.
 */
export class Campfire extends Entity {
	public readonly persistent: boolean = true;
	private healTick = 0;
	private frame = 0;

	/**
	 * @param x - Мировая координата X
	 * @param y - Мировая координата Y
	 * @param entityWorld - Контейнер сущностей (кого греть)
	 */
	constructor(
		x: number,
		y: number,
		private readonly entityWorld: EntityWorld
	) {
		super(x, y, 1);
		this.team = 'neutral';
		this.targetable = false;
		this.solid = false;
		this.width = 14;
		this.height = 14;
	}

	/** Каждые 30 кадров лечит дружественные сущности в радиусе тепла. */
	update(): void {
		this.frame++;
		this.healTick++;
		if (this.healTick < HEAL_INTERVAL) return;
		this.healTick = 0;
		for (const entity of this.entityWorld.all) {
			if (entity.isDead() || entity.team !== 'player') continue;
			const dx = entity.x - this.x;
			const dy = entity.y - this.y;
			if (dx * dx + dy * dy < WARMTH_RADIUS * WARMTH_RADIUS) {
				entity.heal(HEAL_AMOUNT);
			}
		}
	}

	/**
	 * Отрисовка: кольцо камней и мерцающее пламя.
	 * @param ctx - Контекст канваса
	 */
	render(ctx: CanvasRenderingContext2D): void {
		ctx.fillStyle = '#57534e';
		for (let i = 0; i < 6; i++) {
			const a = (i / 6) * Math.PI * 2;
			ctx.beginPath();
			ctx.arc(this.x + Math.cos(a) * 8, this.y + Math.sin(a) * 8, 2.5, 0, Math.PI * 2);
			ctx.fill();
		}
		const flicker = 1 + Math.sin(this.frame * 0.3) * 0.2;
		ctx.fillStyle = 'rgba(251, 146, 60, 0.25)';
		ctx.beginPath();
		ctx.arc(this.x, this.y, 22 * flicker, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = '#f97316';
		ctx.beginPath();
		ctx.arc(this.x, this.y - 1, 5 * flicker, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = '#fde047';
		ctx.beginPath();
		ctx.arc(this.x, this.y - 2, 2.5 * flicker, 0, Math.PI * 2);
		ctx.fill();
	}
}
