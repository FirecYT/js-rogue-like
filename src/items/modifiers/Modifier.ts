import type { Item } from '../Item';
import type { CastState } from '../CastState';

/**
 * Карта модификатора: устанавливается в слот модификаторов оружия и изменяет
 * поведение СОБСТВЕННОГО снаряда оружия (урон, копии, траектория, взрыв,
 * разрушение). Сам снаряд модификаторами не заменяется.
 */
export interface Modifier extends Item {
	type: 'modifier';
	/** Описание действия модификатора (для тултипов). */
	description: string;
	/**
	 * Вносит вклад в состояние каста при разрешении выстрела.
	 * @param state - Накопительное состояние каста
	 */
	applyToCast(state: CastState): void;
}

/**
 * Type guard: проверяет, является ли предмет картой модификатора.
 * @param item - Предмет
 * @returns true, если item.type === 'modifier'
 */
export function isModifier(item: Item): item is Modifier {
	return item.type === 'modifier';
}
