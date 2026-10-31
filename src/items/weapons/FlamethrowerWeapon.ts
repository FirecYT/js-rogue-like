import { Weapon } from '../Weapon';

/**
 * Огнемёт: собственный снаряд — короткоживущая огненная зона.
 */
export class FlamethrowerWeapon extends Weapon {
	id = 'flamethrower';
	name = 'Flamethrower';
	fireRate = 20;
	modifierSlotsCount = 4;
	projectileId = 'fire_zone';
	projectileName = 'Огненная зона';
	baseDamage = 3;
}
