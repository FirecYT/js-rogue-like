import Entity from '../entities/Entity';
import { Item } from './Item';
import Cooldown from '../components/Cooldown';
import { eventBus } from '../events/EventBus';
import { Modifier } from './Modifier';

/**
 * Базовый класс оружия: выстрел под углом, перезарядка, слоты модификаторов.
 * Оружие эмитит событие weaponFired через EventBus — EffectSystem реагирует
 * и создаёт соответствующие эффекты с учётом модификаторов.
 */
export abstract class Weapon implements Item {
	abstract id: string;
	abstract name: string;
	type = 'weapon' as const;
	/** Интервал между выстрелами в кадрах. */
	abstract fireRate: number;
	/** Базовый урон одного снаряда (до модификаторов). */
	abstract damage: number;
	/** Количество снарядов за один выстрел. */
	abstract projectileCount: number;
	/** Количество слотов для модификаторов. */
	abstract modifiersSlots: number;
	/**
	 * Тип эффекта для EffectSystem. Если не указан — используется 'bullet'.
	 * Примеры: 'bullet', 'laser', 'fire_zone', 'explosion'.
	 */
	effectType?: string;
	/** Угол разброса снарядов в радианах (для дробовиков и т.п.). */
	spreadAngle?: number;
	cooldown = new Cooldown(0);
	/** Модификаторы, установленные в это оружие. */
	modifiers: (Modifier | null)[] = [];

	/**
	 * Производит выстрел и эмитит событие weaponFired.
	 * EffectSystem подписан на это событие и создаёт соответствующие эффекты.
	 * @param source - Сущность-источник
	 * @param angle - Угол выстрела в радианах
	 */
	fire(source: Entity, angle: number): void {
		eventBus.emit('weaponFired', { source, angle, weapon: this });
	}

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
