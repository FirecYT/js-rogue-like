import GameObject from '../components/GameObject';
import { Inventory } from '../components/Inventory';
import { Controller } from '../controllers/Controller';
import { eventBus } from '../events/EventBus';

export default abstract class Entity extends GameObject {
	public controller: Controller<Entity> | null = null;
	public inventory: Inventory;
	public speed = 2; // Base movement speed

	constructor(
		x: number,
		y: number,
		hp: number
	) {
		super(x, y, hp);
		this.inventory = new Inventory(this);
	}



	takeDamage(damage: number, attacker?: Entity): void {
		this.hp -= damage;

		if (this.hp <= 0 && attacker) {
			eventBus.emit('enemyKilled', { killer: attacker, victim: this });
		}
	}
}
