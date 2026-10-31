import { Effect } from '../../effects/Effect';
import { Modifier } from '../Modifier';

/**
 * Модификатор: снаряд проходит сквозь цели (флаг pierce).
 */
export class PierceModifier implements Modifier {
	id = 'pierce';
	public name = 'Pierce';
	type = 'modifier' as const;

	/**
	 * Помечает эффект как пронзающий: снаряд не останавливается при попадании.
	 * @param base - Базовый эффект
	 * @returns Тот же эффект с флагом pierce
	 */
	apply(base: Effect): Effect {
		base.pierce = true;
		return base;
	}
}
