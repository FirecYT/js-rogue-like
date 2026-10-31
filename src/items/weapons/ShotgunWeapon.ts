import { Weapon } from '../Weapon';

/**
 * Дробовик: собственный снаряд — веер картечи (5 пуль с разбросом).
 */
export class ShotgunWeapon extends Weapon {
	id = 'shotgun';
	name = 'Shotgun';
	fireRate = 25;
	modifierSlotsCount = 4;
	projectileId = 'bullet';
	projectileName = 'Картечь';
	baseDamage = 4;
	shots = 5;
	shotSpread = 0.8;
}
