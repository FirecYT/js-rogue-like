import { Weapon } from '../Weapon';

/**
 * Ракетница: создаёт взрыв в точке попадания, наносящий урон по площади.
 * Очень высокий урон, очень медленная перезарядка, нет слотов модификаторов.
 */
export class RocketLauncherWeapon extends Weapon {
	id = 'rocket_launcher';
	name = 'Rocket Launcher';
	fireRate = 90;
	damage = 15;
	projectileCount = 1;
	modifiersSlots = 0;
	effectType = 'rocket';

	constructor() {
		super();
		this.cooldown.setDuration(this.fireRate);
	}
}
