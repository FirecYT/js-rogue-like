import { Weapon } from '../Weapon';
import { RocketSpell } from '../spells/projectiles';

/**
 * Ракетница: ракета с детонацией по площади. Очень медленная перезарядка.
 */
export class RocketLauncherWeapon extends Weapon {
	id = 'rocket_launcher';
	name = 'Rocket Launcher';
	fireRate = 90;
	queueLength = 4;

	constructor() {
		super();
		this.setDefaultQueue([new RocketSpell()]);
	}
}
