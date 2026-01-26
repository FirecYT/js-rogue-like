import Entity from './Entity';
import { Item } from '../items/Item';

export abstract class PickupItem extends Entity {
	public item: Item;

	constructor(
		x: number,
		y: number,
		item: Item
	) {
		super(x, y, 1); // Pickup items have 1 HP (can be destroyed)
		this.item = item;
	}

	render(ctx: CanvasRenderingContext2D): void {
		// Basic rendering for pickup items - could be overridden by subclasses
		ctx.fillStyle = '#ff0';
		ctx.beginPath();
		ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
		ctx.fill();

		// Draw item-specific indicator
		ctx.fillStyle = '#000';
		ctx.font = '10px Arial';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText('?', this.x, this.y);
	}

	abstract onPickup(entity: Entity): boolean;

	takeDamage(damage: number, attacker?: Entity): void {
		void damage;
		void attacker;
	}
}
