import Entity from '../entities/Entity';
import { EffectSystem } from '../systems/EffectSystem';
import { Item } from './Item';
import Cooldown from '../components/Cooldown';

/**
 * Базовый класс оружия: выстрел под углом, перезарядка, слоты модификаторов.
 */
export abstract class Weapon implements Item {
	abstract id: string;
	abstract name: string;
	type = 'weapon' as const;
	abstract fireRate: number;
	abstract damage: number;
	abstract projectileCount: number;
	abstract modifiersSlots: number;
	cooldown = new Cooldown(0);

	/**
	 * Производит выстрел (создаёт эффект и добавляет в effectSystem).
	 * @param source - Сущность-источник
	 * @param angle - Угол выстрела в радианах
	 * @param effectSystem - Система эффектов
	 */
	abstract fire(source: Entity, angle: number, effectSystem: EffectSystem): void;

	onEquip?(entity: Entity): void {
		if (entity.inventory.weapon?.cooldown) {
			entity.inventory.weapon.cooldown.setDuration(this.fireRate);
		}
	}

	onUnequip?(_entity: Entity): void;
}

/**
 * Type guard: проверяет, является ли предмет оружием.
 * @param item - Предмет
 * @returns true, если item.type === 'weapon'
 */
export function isWeapon(item: Item): item is Weapon {
	return item.type === 'weapon';
}
