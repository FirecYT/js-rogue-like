import Entity from '../entities/Entity';
import { Item } from './Item';

/**
 * Чип: активная способность с use и опциональным onUpdate (например, даш).
 */
export interface Chip extends Item {
	type: 'chip';
	/** Можно ли использовать способность (включён ли чип) */
	isActive: boolean;
	/** Использование способности */
	use?(entity: Entity): void;
	/** Вызывается каждый кадр при экипировке (например, для даша — изменение скорости) */
	onUpdate?(entity: Entity): void;
}

/**
 * Type guard: проверяет, является ли предмет чипом.
 * @param item - Предмет
 * @returns true, если item.type === 'chip'
 */
export function isChip(item: Item): item is Chip {
	return item.type === 'chip';
}
