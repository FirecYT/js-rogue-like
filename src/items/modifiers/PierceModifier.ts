import { Effect } from "../../effects/Effect";
import { Modifier } from "../Modifier";

/**
 * Модификатор: снаряд проходит сквозь цели (shouldPassThrough всегда true).
 */
export class PierceModifier implements Modifier {
	id = 'pierce';
	public name = 'Pierce';
	type = 'modifier' as const;

	/**
	 * Устанавливает shouldPassThrough так, чтобы снаряд не останавливался при попадании.
	 * @param base - Базовый эффект
	 * @returns Тот же эффект с изменённым shouldPassThrough
	 */
	apply(base: Effect): Effect {
		base.shouldPassThrough = (_target) => true;
		return base;
	}
}
