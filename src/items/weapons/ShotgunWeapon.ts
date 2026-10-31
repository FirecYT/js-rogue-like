import { Weapon } from '../Weapon';

/**
 * Дробовик: 5 снарядов с широким разбросом, медленная перезарядка, средний урон.
 * Эффективен на ближней дистанции.
 */
export class ShotgunWeapon extends Weapon {
	id = 'shotgun';
	name = 'Shotgun';
	fireRate = 40;
	damage = 4;
	projectileCount = 5;
	modifiersSlots = 1;
	effectType = 'bullet';
	spreadAngle = 0.8; // ~45 градусов разброса

	constructor() {
		super();
		this.cooldown.setDuration(this.fireRate);
	}
}
