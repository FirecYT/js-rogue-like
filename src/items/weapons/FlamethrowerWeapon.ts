import { Weapon } from '../Weapon';

/**
 * Огнемёт: создаёт зону огня перед стрелком, наносящую периодический урон.
 * Низкий прямой урон, но постоянный урон по площади.
 */
export class FlamethrowerWeapon extends Weapon {
	id = 'flamethrower';
	name = 'Flamethrower';
	fireRate = 20;
	damage = 3;
	projectileCount = 1;
	modifiersSlots = 2;
	effectType = 'fire_zone';

	constructor() {
		super();
		this.cooldown.setDuration(this.fireRate);
	}
}
