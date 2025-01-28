import Cooldown from "./components/Cooldown";
import GameObject from "./components/GameObject";
import Keyboard from "./components/Keyboard";

export default class Player extends GameObject {
	public fireCooldown = new Cooldown(0.5);
	public dashCooldown = new Cooldown(2);

	private move_speed = 1;
	private dash_speed = 2;

	private dashActive = new Cooldown(0.5);

	constructor() {
		super(320, 240);
	}

	update() {
		this.move();

		this.fireCooldown.update();
		this.dashCooldown.update();
		this.dashActive.update();
	}

	render(ctx: CanvasRenderingContext2D): void {
		if (this.dashActive.get()) {
			ctx.fillStyle = '#99f';
		} else {
			ctx.fillStyle = '#ccf';
		}
		ctx.fillRect(this.x - 5, this.y - 5, 10, 10);

		const cooldowns: {
			name: string,
			val: number
		}[] = [];

		if (this.fireCooldown.val()) {
			cooldowns.push({
				name: 'fireCooldown',
				val: this.fireCooldown.val()
			});
		}
		if (this.dashCooldown.val()) {
			cooldowns.push({
				name: 'dashCooldown',
				val: this.dashCooldown.val()
			});
		}
		if (this.dashActive.val()) {
			cooldowns.push({
				name: 'dashActive',
				val: this.dashActive.val()
			});
		}

		ctx.fillStyle = '#ccc';

		for (let i = 0; i < cooldowns.length; i++) {
			ctx.fillRect(5, 5 + 10 * i, 100, 5);
		}

		ctx.fillStyle = '#f99';

		for (let i = 0; i < cooldowns.length; i++) {
			ctx.fillRect(5, 5 + 10 * i, 100 * cooldowns[i].val, 5);
		}

		ctx.fillStyle = '#000';
		ctx.textBaseline = 'middle';

		for (let i = 0; i < cooldowns.length; i++) {
			ctx.fillText(cooldowns[i].name, 110, 7 + 10 * i);
		}
	}

	move() {
		const keyboard = Keyboard.getInstance();

		let speed = this.move_speed;

		if (this.dashCooldown.get() && keyboard.isKeyPressed('ShiftLeft')) {
			this.dashCooldown.set();
			this.dashActive.set();
		}

		if (!this.dashActive.get()) {
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
