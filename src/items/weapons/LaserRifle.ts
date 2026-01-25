import { Weapon } from '../Weapon';
import Entity from '../../entities/Entity';
import { EffectSystem } from '../../systems/EffectSystem';
import { LaserBeam } from '../../effects/LaserBeam';
import { EffectFactory } from '../../systems/EffectFactory';

export class LaserRifle extends Weapon {
	id = 'laser_rifle';
	name = 'Laser Rifle';
	type = 'weapon' as const;
	fireRate = 1;
	damage = 25;
	projectileCount = 1;
	modifiersSlots = 5;

	fire(source: Entity, angle: number, effectSystem: EffectSystem): void {
		const base = new LaserBeam(source.x, source.y, angle, source);
		const finalEffect = EffectFactory.create(base, source.inventory.modifiers, effectSystem);
		effectSystem.addEffect(finalEffect);
	}

	onEquip?(entity: Entity): void {
		if (entity.inventory.weapon && entity.inventory.weapon.cooldown) {
			entity.inventory.weapon.cooldown.setDuration(this.fireRate);
		}
	}
}
