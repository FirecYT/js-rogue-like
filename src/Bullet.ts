import GameObject from './components/GameObject';
import { pir } from './utils';

export default class Bullet extends GameObject {
	protected angle: number;
	public target: GameObject | undefined;

	constructor(
		public x: number,
		public y: number,
		angle: number,
		hp: number
	) {
		super(x, y, hp);

		this.angle = angle; // + Math.PI * (0.25 * Math.random() - 0.125);
	}

	isCollidingWith(enemy: GameObject) {
		const radius = 4;

		return pir(
			{ x: this.x, y: this.y },
			{
				x: enemy.x - radius,
				y: enemy.y - radius,
				width: radius * 2,
				height: radius * 2,
			}
		);
	}

	update() {
		// if (this.target) {
		// 	const targetAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);

		// 	// Нормализуем углы в диапазон [0, 2π]
		// 	const currentAngle = this.angle % (2 * Math.PI);
		// 	const normalizedTargetAngle = targetAngle % (2 * Math.PI);

		// 	// Находим разницу углов, учитывая переход через 0
		// 	let angleDiff = normalizedTargetAngle - currentAngle;

		// 	// Корректируем разницу для выбора кратчайшего пути
		// 	if (angleDiff > Math.PI) {
		// 		angleDiff -= 2 * Math.PI;
		// 	} else if (angleDiff < -Math.PI) {
		// 		angleDiff += 2 * Math.PI;
		// 	}

		// 	const rotationSpeed = 0.01 * Math.abs(1 / angleDiff);

		// 	if (Math.abs(angleDiff) < rotationSpeed) {
		// 		this.angle = targetAngle;
		// 	} else {
		// 		this.angle += Math.sign(angleDiff) * rotationSpeed;
		// 	}

		// 	// Нормализуем угол
		// 	this.angle = this.angle % (2 * Math.PI);
		// }

		this.x += Math.cos(this.angle) * 4;
		this.y += Math.sin(this.angle) * 4;
	}

	render(ctx: CanvasRenderingContext2D): void {
		ctx.fillStyle = '#f99';
		ctx.fillRect(this.x - 2, this.y - 2, 4, 4);
	}
}
