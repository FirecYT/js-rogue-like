import { Effect } from './Effect';
import Entity from '../entities/Entity';
import { WorldManager } from '../world/WorldManager';

/**
 * Снаряд: движется по прямой, наносит урон при пересечении с сущностями, уничтожается о стены или по времени.
 */
export class BulletEffect extends Effect {
	private speed = 6;
	private lifetime = 100;
	private half_size = 8;

	/**
	 * @param x - Начальная X
	 * @param y - Начальная Y
	 * @param angle - Направление в радианах
	 * @param source - Источник
	 * @param damage - Урон
	 */
	constructor(x: number, y: number, angle: number, source: Entity, damage: number) {
		super(x, y, angle, source, damage);
		this.damage = damage;
	}

	/**
	 * Движение, проверка стен, попадания по сущностям; при попадании — onHit и при необходимости завершение.
	 * @param entities - Список сущностей
	 * @param worldManager - Менеджер мира (проверка проходимости)
	 */
	update(entities: Entity[], worldManager?: WorldManager | null): void {
		this.x += Math.cos(this.angle) * this.speed;
		this.y += Math.sin(this.angle) * this.speed;
		this.lifetime--;

		if (worldManager && !worldManager.isWorldPositionPassable(this.x, this.y)) {
			this.lifetime = 0;
			return;
		}

		for (const entity of entities) {
			if (entity === this.source || entity.isDead()) continue;
			const dx = entity.x - this.x;
			const dy = entity.y - this.y;
			const dist = Math.sqrt(dx * dx + dy * dy);
			if (dist < this.half_size) {
				entity.takeDamage(this.damage, this.source);
				this.onHit?.(entity);
				if (!this.shouldPassThrough(entity)) {
					this.lifetime = 0;
					break;
				}
			}
		}
	}

	/**
	 * Рисует прямоугольник снаряда; в конце жизни — полупрозрачный круг.
	 * @param ctx - Контекст канваса
	 */
	render(ctx: CanvasRenderingContext2D): void {
		ctx.fillStyle = '#f99';
		ctx.fillRect(this.x - this.half_size, this.y - this.half_size, this.half_size * 2, this.half_size * 2);
		if (this.lifetime <= 5) {
			const alpha = this.lifetime / 5;
			ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
			ctx.beginPath();
			ctx.arc(this.x, this.y, this.half_size * 2, 0, Math.PI * 2);
			ctx.fill();
		}
	}

	isDead(): boolean {
		return this.lifetime <= 0;
	}
}
