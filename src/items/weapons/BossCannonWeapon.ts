import { Weapon } from '../Weapon';
import { DamageMultModifier, MulticastModifier } from '../modifiers/catalog';

/**
 * Корпусная пушка босса: медленный корпус с тяжёлой пулей и стартовыми
 * модификаторами (удвоение урона и веер из трёх копий).
 */
export class BossCannonWeapon extends Weapon {
	id = 'boss_cannon';
	name = 'Корпусная пушка';
	fireRate = 90;
	modifierSlotsCount = 4;
	projectileId = 'bullet';
	projectileName = 'Тяжёлая пуля';
	baseDamage = 12;

	constructor() {
		super();
		this.setDefaultModifiers([
			new DamageMultModifier(),
			new MulticastModifier(3, 0.5),
		]);
	}
}
