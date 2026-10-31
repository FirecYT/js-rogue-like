import { Weapon } from '../Weapon';
import { HeavyBulletSpell } from '../spells/projectiles';
import { MulticastSpell, DamageMultSpell } from '../spells/modifiers';

/**
 * Корпусная пушка босса: медленный корпус с длинной очередью заклинаний.
 * Стартовая очередь — усиливающий модификатор и веер тяжёлых снарядов,
 * демонстрация механики очереди заклинаний на боссах.
 */
export class BossCannonWeapon extends Weapon {
	id = 'boss_cannon';
	name = 'Корпусная пушка';
	fireRate = 90;
	queueLength = 4;

	constructor() {
		super();
		this.setDefaultQueue([
			new DamageMultSpell(),
			new MulticastSpell(3, 0.5),
			new HeavyBulletSpell(),
		]);
	}
}
