import { Weapon } from '../Weapon';
import Entity from '../../entities/Entity';
import { EffectSystem } from '../../systems/EffectSystem';
import { LaserBeam } from '../../effects/LaserBeam';

export class LaserRifle implements Weapon {
	id = 'laser_rifle';
	name = 'Laser Rifle';
	type = 'weapon' as const;
	fireRate = 1;
	damage = 25;
	projectileCount = 1;
	modifiersSlots = 5;

	fire(source: Entity, angle: number, effectSystem: EffectSystem): void {
		const beam = new LaserBeam(source.x, source.y, angle, source);
		effectSystem.addEffect(beam);
	}

	onEquip?(entity: Entity): void {
		// Set the weapon's cooldown duration when equipped
		if (entity.inventory.weapon && entity.inventory.weapon.cooldown) {
			entity.inventory.weapon.cooldown.setDuration(this.fireRate);
		}
	}
}
