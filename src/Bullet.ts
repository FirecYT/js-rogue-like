import GameObject from "./components/GameObject";
import Enemy from "./Enemy";
import { pir } from "./utils";

export default class Bullet extends GameObject {
	private angle: number;

	constructor(
		public x: number,
		public y: number,
		angle: number
	) {
		super(x, y);

		this.angle = angle;
	}

	isCollidingWith(enemy: Enemy) {
		const radius = 2;

		return pir({ x: this.x, y: this.y }, {
			x: enemy.x - radius,
			y: enemy.y - radius,
			width: radius * 2,
			height: radius * 2,
		});
	}

	update() {
		this.x += Math.cos(this.angle);
		this.y += Math.sin(this.angle);
	}

	render(ctx: CanvasRenderingContext2D): void {
		ctx.fillStyle = '#f99';
		ctx.fillRect(this.x - 2, this.y - 2, 4, 4);
	}
}
