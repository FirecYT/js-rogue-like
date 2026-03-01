import { Effect } from '../effects/Effect';
import { Modifier } from '../items/Modifier';

/**
 * Фабрика эффектов: применяет цепочку модификаторов к базовому эффекту.
 */
export class EffectFactory {
	/**
	 * Создаёт итоговый эффект, последовательно применяя все ненулевые модификаторы к base.
	 * @param base - Исходный эффект
	 * @param modifiers - Массив модификаторов (null пропускаются)
	 * @returns Эффект после применения всех модификаторов
	 */
	static create(base: Effect, modifiers: (Modifier | null)[]): Effect {
		let current = base;
		for (const mod of modifiers.filter((m): m is Modifier => m !== null)) {
			current = mod.apply(current);
		}
		return current;
	}
}
