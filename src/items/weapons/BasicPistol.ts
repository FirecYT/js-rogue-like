import { Weapon } from '../Weapon';
import Entity from '../../entities/Entity';
import { BulletEffect } from '../../effects/BulletEffect';
import { EffectSystem } from '../../systems/EffectSystem';
import { EffectFactory } from '../../systems/EffectFactory';

/**
 * Базовый пистолет: пули с применением модификаторов инвентаря.
 */
export class BasicPistol extends Weapon {
	id = 'basic_pistol';
	name = 'Basic Pistol';
	type = 'weapon' as const;
	fireRate = 50;
	damage = 10;
	projectileCount = 1;
	modifiersSlots = 5;

	/**
	 * Создаёт BulletEffect, прогоняет через EffectFactory с модификаторами и добавляет в effectSystem.
	 * @param source - Источник выстрела
	 * @param angle - Угол в радианах
	 * @param effectSystem - Система эффектов
	 */
	fire(source: Entity, angle: number, effectSystem: EffectSystem): void {
		const base = new BulletEffect(source.x, source.y, angle, source, this.damage);
		const finalEffect = EffectFactory.create(base, source.inventory.modifiers);
		effectSystem.addEffect(finalEffect);
	}

	onEquip(entity: Entity): void {
		if (entity.inventory.weapon?.cooldown) {
			entity.inventory.weapon.cooldown.setDuration(this.fireRate);
		}
	}
}
