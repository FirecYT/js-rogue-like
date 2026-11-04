import { Weapon } from '../Weapon';

/**
 * Плазменная винтовка: тяжёлые светящиеся шары, летящие медленно,
 * но переживающие встречу с большей частью препятствий.
 */
export class PlasmaRifleWeapon extends Weapon {
	id = 'plasma_rifle';
	name = 'Plasma Rifle';
	fireRate = 40;
	modifierSlotsCount = 4;
	projectileId = 'plasma';
	projectileName = 'Плазменный шар';
	baseDamage = 30;
}
