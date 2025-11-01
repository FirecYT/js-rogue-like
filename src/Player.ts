import Cooldown from './components/Cooldown';
import GameObject from './components/GameObject';
import Keyboard from './components/Keyboard';
import { WorldManager } from './world/WorldManager';

export default class Player extends GameObject {
	public fireCooldown = new Cooldown(120);
	public dashCooldown = new Cooldown(120);

	private move_speed = 3;
	private dash_speed = 6;
	public damage = 1;

	private dashActive = new Cooldown(30);
	private worldManager: WorldManager;

	public width = 10;
	public height = 10;

	constructor(x: number, y: number, worldManager: WorldManager) {
		super(x, y, 3);
		this.worldManager = worldManager;
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

		ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
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
