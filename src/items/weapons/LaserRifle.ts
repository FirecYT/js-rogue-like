import { Weapon } from '../Weapon';
import Entity from '../../entities/Entity';
import { EffectSystem } from '../../systems/EffectSystem';
import { LaserBeam } from '../../effects/LaserBeam';
import { EffectFactory } from '../../systems/EffectFactory';

/**
 * Лазерная винтовка: луч с применением модификаторов.
 */
export class LaserRifle extends Weapon {
	id = 'laser_rifle';
	name = 'Laser Rifle';
	type = 'weapon' as const;
	fireRate = 1;
	damage = 25;
	projectileCount = 1;
	modifiersSlots = 5;

	/**
	 * Создаёт LaserBeam, прогоняет через модификаторы и добавляет в effectSystem.
	 * @param source - Источник
	 * @param angle - Угол
	 * @param effectSystem - Система эффектов
	 */
	fire(source: Entity, angle: number, effectSystem: EffectSystem): void {
		const base = new LaserBeam(source.x, source.y, angle, source);
		const finalEffect = EffectFactory.create(base, source.inventory.modifiers);
		effectSystem.addEffect(finalEffect);
	}

	onEquip(entity: Entity): void {
		if (entity.inventory.weapon?.cooldown) {
			entity.inventory.weapon.cooldown.setDuration(this.fireRate);
		}
	}
}
