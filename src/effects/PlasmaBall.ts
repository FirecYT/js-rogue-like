import { BulletEffect } from './BulletEffect';
import type Entity from '../entities/Entity';

/**
 * Плазменный шар: медленный крупный снаряд плазменной винтовки.
 * Поведение полёта/попаданий наследует пуля; отличается скоростью,
 * размером, временем жизни и свечением.
 */
export class PlasmaBall extends BulletEffect {
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
		this.speed = 3.5;
		this.lifetime = 150;
		this.half_size = 11;
	}

	/**
	 * Рисует светящуюся плазменную сферу с пульсирующим гало.
	 * @param ctx - Контекст канваса
	 */
	render(ctx: CanvasRenderingContext2D): void {
		const pulse = 1 + Math.sin(this.lifetime * 0.35) * 0.15;
		ctx.fillStyle = 'rgba(34, 211, 238, 0.22)';
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.half_size * 1.9 * pulse, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = '#67e8f9';
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.half_size * pulse, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = '#ecfeff';
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.half_size * 0.45 * pulse, 0, Math.PI * 2);
		ctx.fill();
	}
}
