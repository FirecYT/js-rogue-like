import GameObject from './components/GameObject';

export default class Enemy extends GameObject {
	private speed = 1;
	private target: GameObject;
	public experience: number;

	constructor(x: number, y: number, target: GameObject) {
		super(x, y, 100);
		this.target = target;
		this.experience = this.getHP();
	}

	update() {
		const angle = Math.atan2(
			this.target.y - this.y,
			this.target.x - this.x
		);

		this.x += Math.cos(angle) * this.speed;
		this.y += Math.sin(angle) * this.speed;
	}

	render(ctx: CanvasRenderingContext2D): void {
		ctx.fillStyle = '#f00';
		ctx.fillRect(this.x - 2, this.y - 2, 4, 4);
	}
}
