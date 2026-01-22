import { Effect } from './Effect';
import Entity from '../entities/Entity';

export class FireZone extends Effect {
	private radius = 30;
	private duration = 180;
	private damageTick = 0;

	constructor(x: number, y: number, angle: number, source: Entity) {
		const offsetX = Math.cos(angle) * 40;
		const offsetY = Math.sin(angle) * 40;
		super(x + offsetX, y + offsetY, angle, source, 3);
	}

	update(enities: Entity[]): void {
		this.duration--;
		this.damageTick++;

		if (this.damageTick % 20 === 0) {
			for (const entity of enities) {
				if (entity === this.source || entity.isDead()) continue;
				const dx = entity.x - this.x;
				const dy = entity.y - this.y;
				const dist = Math.sqrt(dx * dx + dy * dy);
				if (dist < this.radius) {
					entity.takeDamage(3, this.source);
				}
			}
		}
	}

	render(ctx: CanvasRenderingContext2D): void {
		const alpha = Math.min(1, this.duration / 60);
		ctx.fillStyle = `rgba(255, 100, 0, ${alpha})`;
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
		ctx.fill();
	}

	isDead(): boolean {
		return this.duration <= 0;
	}
}
