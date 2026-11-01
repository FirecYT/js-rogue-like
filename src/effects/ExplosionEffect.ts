import { Effect } from './Effect';
import Entity from '../entities/Entity';
import type { WorldService } from '../services/WorldService';

/**
 * Взрыв: в середине длительности наносит урон всем сущностям в радиусе, визуально сжимается.
 */
export class ExplosionEffect extends Effect {
	private radius = 40;
	private duration = 12;

	/**
	 * @param x - Центр взрыва X
	 * @param y - Центр взрыва Y
	 * @param source - Источник
	 * @param damage - Урон взрыва (по умолчанию 15)
	 * @param radius - Радиус поражения (по умолчанию 40)
	 */
	constructor(x: number, y: number, source: Entity, damage = 15, radius = 40) {
		super(x, y, 0, source, damage);
		this.radius = radius;
	}

	/**
	 * На 6-м кадре до конца наносит урон сущностям в радиусе.
	 * @param entities - Список сущностей
	 * @param _world - Сервис мира (не используется, но требуется интерфейсом)
	 */
	update(entities: Entity[], _world?: WorldService): void {
		this.duration--;
		if (this.duration === 6) {
			for (const entity of entities) {
				if (!this.canHit(entity)) continue;
				const dx = entity.x - this.x;
				const dy = entity.y - this.y;
				const dist = Math.sqrt(dx * dx + dy * dy);
				if (dist < this.radius) {
					entity.takeDamage(this.damage, this.source);
					this.onHit?.(entity);
				}
			}
		}
	}

	/**
	 * Рисует оранжевый круг с уменьшающимся радиусом и затуханием.
	 * @param ctx - Контекст канваса
	 */
	render(ctx: CanvasRenderingContext2D): void {
		const alpha = this.duration / 12;
		ctx.fillStyle = `rgba(255, 100, 0, ${alpha})`;
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius * (1 - alpha), 0, Math.PI * 2);
		ctx.fill();
	}

	isDead(): boolean {
		return this.duration <= 0;
	}
}
