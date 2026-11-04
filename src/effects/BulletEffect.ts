import { Effect } from './Effect';
import Entity from '../entities/Entity';
import type { WorldService } from '../services/WorldService';

/**
 * Снаряд: движется по прямой, наносит урон при пересечении с сущностями, уничтожается о стены или по времени.
 */
export class BulletEffect extends Effect {
	protected speed = 6;
	protected lifetime = 100;
	protected half_size = 8;
	/** Снаряд разрушает непроходимые тайлы на своём пути. */
	public destruct = false;
	/** Взрыв при пронзании цели и в конце полёта. */
	public explodeOnHit = false;
	/** Самонаведение: снаряд доворачивает курс к ближайшей цели. */
	public homing = false;
	/** onDeath вызывается однократно. */
	private deathNotified = false;

	/**
	 * @param x - Начальная X
	 * @param y - Начальная Y
	 * @param angle - Направление в радианах
	 * @param source - Источник
	 * @param damage - Урон
	 */
	constructor(
		x: number,
		y: number,
		angle: number,
		source: Entity,
		damage: number
	) {
		super(x, y, angle, source, damage);
		this.damage = damage;
	}

	/**
	 * Движение, проверка стен, попадания по сущностям; при попадании — onHit и при необходимости завершение.
	 * @param entities - Список сущностей
	 * @param world - Сервис мира для проверки коллизий с тайлами
	 */
	update(entities: readonly Entity[], world?: WorldService): void {
		if (this.homing) {
			this.steer(entities);
		}
		this.x += Math.cos(this.angle) * this.speed;
		this.y += Math.sin(this.angle) * this.speed;
		this.applyWave();
		this.lifetime--;

		// Проверка коллизии со стенами: разрушающий снаряд пробивает тайл
		if (world && !world.isPassable(this.x, this.y)) {
			if (!this.destruct || !world.destroyTile(this.x, this.y)) {
				this.die();
				return;
			}
		}

		for (const entity of entities) {
			if (!this.canHit(entity)) continue;
			const dx = entity.x - this.x;
			const dy = entity.y - this.y;
			const dist = Math.sqrt(dx * dx + dy * dy);
			if (dist < this.half_size) {
				entity.takeDamage(this.damage, this.source);
				this.onHit?.(entity);
				if (!this.pierce) {
					this.die();
					break;
				}
			}
		}

		if (this.lifetime <= 0) {
			this.die();
		}
	}

	/** Радиус поиска цели самонаведения, px. */
	private static readonly HOMING_RANGE = 460;
	/** Максимальный доворот курса за кадр, радианы. */
	private static readonly HOMING_TURN = 0.1;

	/**
	 * Доворачивает курс к ближайшей поражаемой цели в радиусе наведения.
	 * @param entities - Список сущностей
	 */
	private steer(entities: readonly Entity[]): void {
		let best: Entity | null = null;
		let bestDist = BulletEffect.HOMING_RANGE;
		for (const entity of entities) {
			if (!this.canHit(entity)) continue;
			const d = Math.hypot(entity.x - this.x, entity.y - this.y);
			if (d < bestDist) {
				bestDist = d;
				best = entity;
			}
		}
		if (!best) return;
		const desired = Math.atan2(best.y - this.y, best.x - this.x);
		let diff = desired - this.angle;
		while (diff > Math.PI) diff -= Math.PI * 2;
		while (diff < -Math.PI) diff += Math.PI * 2;
		const turn = BulletEffect.HOMING_TURN;
		this.angle += Math.max(-turn, Math.min(turn, diff));
	}

	/**
	 * Завершает жизнь снаряда и однократно вызывает onDeath.
	 */
	private die(): void {
		this.lifetime = 0;
		if (!this.deathNotified) {
			this.deathNotified = true;
			this.onDeath?.();
		}
	}

	/**
	 * Рисует прямоугольник снаряда; в конце жизни — полупрозрачный круг.
	 * @param ctx - Контекст канваса
	 */
	render(ctx: CanvasRenderingContext2D): void {
		ctx.fillStyle = '#f99';
		ctx.fillRect(
			this.x - this.half_size,
			this.y - this.half_size,
			this.half_size * 2,
			this.half_size * 2
		);
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
