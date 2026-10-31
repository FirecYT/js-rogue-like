import { Weapon } from '../Weapon';

/**
 * Ракетница: собственный снаряд — ракета с взрывом по площади.
 */
export class RocketLauncherWeapon extends Weapon {
	id = 'rocket_launcher';
	name = 'Rocket Launcher';
	fireRate = 90;
	modifierSlotsCount = 4;
	projectileId = 'rocket';
	projectileName = 'Ракета';
	baseDamage = 15;
}
