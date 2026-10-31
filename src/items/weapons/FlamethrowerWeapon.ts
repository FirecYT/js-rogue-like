import { Weapon } from '../Weapon';
import { FireZoneSpell } from '../spells/projectiles';

/**
 * Огнемёт: создаёт зону огня перед стрелком, наносящую периодический урон.
 */
export class FlamethrowerWeapon extends Weapon {
	id = 'flamethrower';
	name = 'Flamethrower';
	fireRate = 20;
	queueLength = 4;

	constructor() {
		super();
		this.setDefaultQueue([new FireZoneSpell()]);
	}
}
