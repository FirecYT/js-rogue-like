import GameObject from '../components/GameObject';
import { Inventory } from '../components/Inventory';
import { eventBus } from '../events/EventBus';

export default abstract class Entity extends GameObject {
	public inventory: Inventory;
	public speed = 2;

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

		if (this.hp <= 0) {
			if (attacker) {
				eventBus.emit('enemyKilled', { killer: attacker, victim: this });
			}
			eventBus.emit('entityDied', { entity: this });
		}
	}

	getCooldowns(): { name: string; val: number; }[] {
		const cooldowns = [];

		for (const chip of this.inventory.chips) {
			if (chip && chip.cooldown && !chip.cooldown.isReady()) {
				cooldowns.push({
					name: `${chip.name}`,
					val: chip.cooldown.progress(),
				});
			}
		}

		if (this.inventory.weapon && this.inventory.weapon.cooldown && !this.inventory.weapon.cooldown.isReady()) {
			cooldowns.push({
				name: 'fire',
				val: this.inventory.weapon.cooldown.progress(),
			});
		}

		return cooldowns;
	}
}
