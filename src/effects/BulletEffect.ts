import { Effect } from './Effect';
import Entity from '../entities/Entity';

export class BulletEffect extends Effect {
	private speed = 6;
	private lifetime = 100;
	private half_size = 8;

	constructor(x: number, y: number, angle: number, source: Entity, damage: number) {
		super(x, y, angle, source, damage);
		this.damage = damage;
	}

	update(enities: Entity[]): void {
		this.x += Math.cos(this.angle) * this.speed;
		this.y += Math.sin(this.angle) * this.speed;
		this.lifetime--;

		// Проверяем столкновения
		for (const entity of enities) {
			if (entity === this.source || entity.isDead()) continue;
			const dx = entity.x - this.x;
			const dy = entity.y - this.y;
			const dist = Math.sqrt(dx * dx + dy * dy);
			if (dist < this.half_size) {
				entity.takeDamage(this.damage, this.source);
				this.lifetime = 0;
				break;
			}
		}
	}

	render(ctx: CanvasRenderingContext2D): void {
		ctx.fillStyle = '#f99';
		ctx.fillRect(this.x - this.half_size, this.y - this.half_size, this.half_size * 2, this.half_size * 2);
	}

	isDead(): boolean {
		return this.lifetime <= 0;
	}
}
