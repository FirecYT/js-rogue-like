import { Weapon } from '../Weapon';

/**
 * Лазерное оружие: мгновенный луч, поражающий всех на линии.
 * Высокий урон, средняя перезарядка.
 */
export class LaserGunWeapon extends Weapon {
	id = 'laser_gun';
	name = 'Laser Gun';
	fireRate = 30;
	damage = 25;
	projectileCount = 1;
	modifiersSlots = 3;
	effectType = 'laser';

	constructor() {
		super();
		this.cooldown.setDuration(this.fireRate);
	}
}
