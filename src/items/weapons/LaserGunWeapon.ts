import { Weapon } from '../Weapon';

/**
 * Лазерная пушка: собственный снаряд — мгновенный луч.
 */
export class LaserGunWeapon extends Weapon {
	id = 'laser_gun';
	name = 'Laser Gun';
	fireRate = 30;
	modifierSlotsCount = 4;
	projectileId = 'laser';
	projectileName = 'Лазерный луч';
	baseDamage = 25;
}
