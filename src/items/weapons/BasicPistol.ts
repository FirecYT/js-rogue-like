import { Weapon } from '../Weapon';
import Entity from '../../entities/Entity';
import { BulletEffect } from '../../effects/BulletEffect';
import { EffectSystem } from '../../systems/EffectSystem';
import { EffectFactory } from '../../systems/EffectFactory';

export class BasicPistol implements Weapon {
	id = 'basic_pistol';
	name = 'Basic Pistol';
	type = 'weapon' as const;
	fireRate = 1;
	damage = 10;
	projectileCount = 1;
	modifiersSlots = 5;

	fire(source: Entity, angle: number, effectSystem: EffectSystem): void {
		const base = new BulletEffect(source.x, source.y, angle /*+ Math.random() * Math.PI / 12 - Math.PI / 24*/, source, this.damage);
		const finalEffect = EffectFactory.create(base, source.inventory.modifiers, effectSystem);
		effectSystem.addEffect(finalEffect);
	}

	onEquip(entity: Entity): void {
		// Set the weapon's cooldown duration when equipped
		if (entity.inventory.weapon && entity.inventory.weapon.cooldown) {
			entity.inventory.weapon.cooldown.setDuration(this.fireRate);
		}
	}
}
