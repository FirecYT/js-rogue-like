import { Weapon } from '../Weapon';

/**
 * Базовый пистолет: один снаряд, быстрая перезарядка, малый урон.
 * Стартовое оружие игрока.
 */
export class PistolWeapon extends Weapon {
	id = 'pistol';
	name = 'Pistol';
	fireRate = 15;
	damage = 5;
	projectileCount = 1;
	modifiersSlots = 2;
	effectType = 'bullet';

	constructor() {
		super();
		this.cooldown.setDuration(this.fireRate);
	}
}
