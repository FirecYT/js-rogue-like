import { Weapon } from '../Weapon';
import { LaserSpell } from '../spells/projectiles';

/**
 * Лазерное оружие: мгновенный луч, поражающий всех на линии.
 */
export class LaserGunWeapon extends Weapon {
	id = 'laser_gun';
	name = 'Laser Gun';
	fireRate = 30;
	queueLength = 4;

	constructor() {
		super();
		this.setDefaultQueue([new LaserSpell()]);
	}
}
