import { Weapon } from '../Weapon';

/**
 * Пистолет: быстрый корпус с собственным снарядом «пуля».
 */
export class PistolWeapon extends Weapon {
	id = 'pistol';
	name = 'Pistol';
	fireRate = 15;
	modifierSlotsCount = 4;
	projectileId = 'bullet';
	projectileName = 'Пуля';
	baseDamage = 5;
}
