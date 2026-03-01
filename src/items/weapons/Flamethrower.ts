import { Weapon } from '../Weapon';
import Entity from '../../entities/Entity';
import { EffectSystem } from '../../systems/EffectSystem';
import { FireZone } from '../../effects/FireZone';
import { EffectFactory } from '../../systems/EffectFactory';

/**
 * Огнемёт: создаёт зону огня с применением модификаторов.
 */
export class Flamethrower extends Weapon {
	id = 'flamethrower';
	name = 'Flamethrower';
	type = 'weapon' as const;
	fireRate = 10;
	damage = 1;
	projectileCount = 1;
	modifiersSlots = 1;

	/**
	 * Создаёт FireZone, прогоняет через модификаторы и добавляет в effectSystem.
	 * @param source - Источник
	 * @param angle - Угол
	 * @param effectSystem - Система эффектов
	 */
	fire(source: Entity, angle: number, effectSystem: EffectSystem): void {
		const base = new FireZone(source.x, source.y, angle, source);
		const finalEffect = EffectFactory.create(base, source.inventory.modifiers);
		effectSystem.addEffect(finalEffect);
	}

	onEquip(entity: Entity): void {
		if (entity.inventory.weapon?.cooldown) {
			entity.inventory.weapon.cooldown.setDuration(this.fireRate);
		}
	}
}
