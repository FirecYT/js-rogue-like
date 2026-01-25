import Entity from "./Entity";
import { HasPosition, HasSpeed } from '../types/EntityTraits';
import { AiController } from '../controllers/AiController';
import { BasicPistol } from '../items/weapons/BasicPistol';

export default class Enemy extends Entity implements HasPosition, HasSpeed {
	public speed = 1;
	public experience = 5;

	constructor(x: number, y: number, private player: Entity) {
		super(x, y, 5);

		if (Math.random() > 0.07) {
			this.inventory.setWeapon(new BasicPistol());
		}

		this.controller = new AiController(this.player);
	}

	render(ctx: CanvasRenderingContext2D): void {
		const color = this.inventory.weapon ? '#f90' : '#f00';
		ctx.fillStyle = color;
		ctx.fillRect(this.x - 4, this.y - 4, 8, 8);

		if (this.inventory.weapon) {
			ctx.strokeStyle = '#ff0';
			ctx.lineWidth = 1;
			ctx.strokeRect(this.x - 5, this.y - 5, 10, 10);
		}

		const hpPercent = this.getHP() / this.maxHP;
		ctx.fillStyle = '#0f0';
		ctx.fillRect(this.x - 10, this.y - 12, hpPercent * 20, 2);
		ctx.strokeStyle = '#000';
		ctx.strokeRect(this.x - 10, this.y - 12, 20, 2);
	}
}
