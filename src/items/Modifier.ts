import { Effect } from '../effects/Effect';
import { Item } from './Item';

/**
 * Модификатор эффекта: применяется к базовому эффекту (урон, траектория, onHit и т.д.).
 */
export interface Modifier extends Item {
	type: 'modifier';
	/**
	 * Применяет модификатор к базовому эффекту.
	 * @param base - Исходный эффект
	 * @returns Тот же или изменённый эффект
	 */
	apply(base: Effect): Effect;
}

/**
 * Type guard: проверяет, является ли предмет модификатором.
 * @param item - Предмет
 * @returns true, если item.type === 'modifier'
 */
export function isModifier(item: Item): item is Modifier {
	return item.type === 'modifier';
}
