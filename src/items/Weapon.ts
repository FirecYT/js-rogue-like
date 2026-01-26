import Entity from '../entities/Entity';
import { EffectSystem } from '../systems/EffectSystem';
import { Item } from './Item';
import Cooldown from '../components/Cooldown';

export abstract class Weapon implements Item {
	abstract id: string;
	abstract name: string;
	type = 'weapon' as const;
	abstract fireRate: number;
	abstract damage: number;
	abstract projectileCount: number;
	abstract modifiersSlots: number;
	cooldown = new Cooldown(0);

	abstract fire(source: Entity, angle: number, effectSystem: EffectSystem): void;

	onEquip?(entity: Entity): void {
		if (entity.inventory.weapon && entity.inventory.weapon.cooldown) {
			entity.inventory.weapon.cooldown.setDuration(this.fireRate);
		}
	}

	onUnequip?(entity: Entity): void;
}
