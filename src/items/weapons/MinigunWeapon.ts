import { Weapon } from '../Weapon';

/**
 * Миниган: шквальный темп огня при скромном уроне за выстрел.
 * Лёгкий собственный разброс компенсируется плотностью потока.
 */
export class MinigunWeapon extends Weapon {
	id = 'minigun';
	name = 'Minigun';
	fireRate = 4;
	modifierSlotsCount = 4;
	projectileId = 'bullet';
	projectileName = 'Поток пуль';
	baseDamage = 3;
	shotSpread = 0.12;
}
