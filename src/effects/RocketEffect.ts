import { Effect } from './Effect';
import type Entity from '../entities/Entity';
import type { WorldService } from '../services/WorldService';

/**
 * Ракета: летящий снаряд, который детонирует при столкновении со стеной,
 * сущностью или по истечении времени жизни. Детонация обрабатывается
 * снаружи через onDeath (EffectSystem создаёт взрыв в точке гибели).
 */
export class RocketEffect extends Effect {
	private speed = 4.5;
	private lifetime = 150;
	private halfSize = 5;

	/**
	 * Полёт и проверка детонации: стена, поражаемая сущность, конец времени жизни.
	 * @param entities - Список сущностей (read-only) для проверки столкновений
	 * @param world - Сервис мира для проверки коллизий с тайлами
	 */
	update(entities: readonly Entity[], world?: WorldService): void {
		this.x += Math.cos(this.angle) * this.speed;
		this.y += Math.sin(this.angle) * this.speed;
		this.lifetime--;

		if (world && !world.isPassable(this.x, this.y)) {
			this.lifetime = 0;
			return;
		}

		for (const entity of entities) {
			if (!this.canHit(entity)) continue;
			const dx = entity.x - this.x;
			const dy = entity.y - this.y;
			if (dx * dx + dy * dy < this.halfSize * this.halfSize) {
				this.lifetime = 0;
				break;
			}
		}
	}

	/**
	 * Рисует оранжевый прямоугольник ракеты по направлению полёта.
	 * @param ctx - Контекст канваса
	 */
	render(ctx: CanvasRenderingContext2D): void {
		ctx.save();
		ctx.translate(this.x, this.y);
		ctx.rotate(this.angle);
		ctx.fillStyle = '#fa3';
		ctx.fillRect(-this.halfSize, -this.halfSize / 2, this.halfSize * 2, this.halfSize);
		ctx.restore();
	}

	isDead(): boolean {
		return this.lifetime <= 0;
	}
}
