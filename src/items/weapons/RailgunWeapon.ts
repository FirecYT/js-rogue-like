import { Weapon } from '../Weapon';

/**
 * Рельсотрон: редкий и очень тяжёлый луч. Награда за терпение —
 * одна оплавленная дыра в цели (и в стене за ней) за выстрел.
 */
export class RailgunWeapon extends Weapon {
	id = 'railgun';
	name = 'Railgun';
	fireRate = 75;
	modifierSlotsCount = 4;
	projectileId = 'laser';
	projectileName = 'Рельсовый луч';
	baseDamage = 70;
}
