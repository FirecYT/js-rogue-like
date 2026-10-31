import { Weapon } from '../Weapon';
import { BulletSpell } from '../spells/projectiles';
import { MulticastSpell } from '../spells/modifiers';

/**
 * Дробовик: мультикаст ×5 широким веером. Эффективен на ближней дистанции.
 * Очередь: [Мультикаст ×5, Пуля] — выстрел каждый второй pull.
 */
export class ShotgunWeapon extends Weapon {
	id = 'shotgun';
	name = 'Shotgun';
	fireRate = 25;
	queueLength = 6;

	constructor() {
		super();
		this.setDefaultQueue([new MulticastSpell(5, 0.8), new BulletSpell()]);
	}
}
