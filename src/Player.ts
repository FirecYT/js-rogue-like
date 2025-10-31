import Cooldown from './components/Cooldown';
import GameObject from './components/GameObject';
import Keyboard from './components/Keyboard';

export default class Player extends GameObject {
	public fireCooldown = new Cooldown(120);
	public dashCooldown = new Cooldown(120);

	private move_speed = 6;
	private dash_speed = 12;
	public damage = 1;

	private dashActive = new Cooldown(30);

	constructor() {
		super(0, 0, 3);
	}

	update() {
		this.move();

		this.fireCooldown.update();
		this.dashCooldown.update();
		this.dashActive.update();
	}

	getCooldowns(): {
		name: string;
		val: number;
	}[] {
		const cooldowns: {
			name: string;
			val: number;
		}[] = [];

		if (!this.fireCooldown.isReady()) {
			cooldowns.push({
				name: 'fireCooldown',
				val: this.fireCooldown.progress(),
			});
		}
		if (!this.dashCooldown.isReady()) {
			cooldowns.push({
				name: 'dashCooldown',
				val: this.dashCooldown.progress(),
			});
		}
		if (!this.dashActive.isReady()) {
			cooldowns.push({
				name: 'dashActive',
				val: this.dashActive.progress(),
			});
		}

		return cooldowns;
	}

	render(ctx: CanvasRenderingContext2D): void {
		if (this.dashActive.isReady()) {
			ctx.fillStyle = '#99f';
		} else {
			ctx.fillStyle = '#ccf';
		}

		ctx.fillRect(this.x - 5, this.y - 5, 10, 10);
	}

	move() {
		const keyboard = Keyboard.getInstance();

		let speed = this.move_speed;

		if (this.dashCooldown.isReady() && keyboard.isKeyPressed('ShiftLeft')) {
			this.dashCooldown.start();
			this.dashActive.start();
		}

		if (!this.dashActive.isReady()) {
			speed = this.dash_speed;
		}

		if (keyboard.isKeyPressed('KeyW')) {
			this.y -= speed;
		}

		if (keyboard.isKeyPressed('KeyS')) {
			this.y += speed;
		}

		if (keyboard.isKeyPressed('KeyA')) {
			this.x -= speed;
		}

		if (keyboard.isKeyPressed('KeyD')) {
			this.x += speed;
		}
	}
}
