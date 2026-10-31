import { Weapon } from '../Weapon';
import { BulletSpell } from '../spells/projectiles';

/**
 * Базовый пистолет: один снаряд за pull, быстрая перезарядка, малый урон.
 * Стартовое оружие игрока.
 */
export class PistolWeapon extends Weapon {
	id = 'pistol';
	name = 'Pistol';
	fireRate = 15;
	queueLength = 4;

	constructor() {
		super();
		this.setDefaultQueue([new BulletSpell()]);
	}
}
