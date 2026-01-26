import { Effect } from './Effect';
import Entity from '../entities/Entity';

export class LaserBeam extends Effect {
	private length = 500;
	private duration = 5;

	constructor(x: number, y: number, angle: number, source: Entity) {
		super(x, y, angle, source, 25);
	}

	update(enities: Entity[]): void {
		this.duration--;
		for (const entity of enities) {
			if (entity === this.source || entity.isDead()) continue;
			const dx = entity.x - this.x;
			const dy = entity.y - this.y;
			const distToLine = Math.abs(dx * Math.sin(this.angle) - dy * Math.cos(this.angle));
			const distAlong = dx * Math.cos(this.angle) + dy * Math.sin(this.angle);
			if (distToLine < 10 && distAlong > 0 && distAlong < this.length) {
				entity.takeDamage(this.damage, this.source);
				this.onHit?.(entity);
			}
		}
	}

	render(ctx: CanvasRenderingContext2D): void {
		const endX = this.x + Math.cos(this.angle) * this.length;
		const endY = this.y + Math.sin(this.angle) * this.length;

		ctx.strokeStyle = '#0ff';
		ctx.lineWidth = 3;
		ctx.beginPath();
		ctx.moveTo(this.x, this.y);
		ctx.lineTo(endX, endY);
		ctx.stroke();
	}

	isDead(): boolean {
		return this.duration <= 0;
	}
}
