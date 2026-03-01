import { Effect } from "../../effects/Effect";
import { Modifier } from "../Modifier";

/**
 * Модификатор: увеличивает урон эффекта в multiplier раз.
 */
export class DamageBoostModifier implements Modifier {
	id = 'damage_boost';
	name = 'Damage Boost';
	type = 'modifier' as const;

	/**
	 * @param multiplier - Множитель урона (например, 2.0 для удвоения)
	 */
	constructor(private multiplier: number) { }

	/**
	 * Умножает base.damage на multiplier (с округлением вниз).
	 * @param base - Базовый эффект
	 * @returns Тот же эффект с изменённым damage
	 */
	apply(base: Effect): Effect {
		base.damage = Math.floor(base.damage * this.multiplier);
		return base;
	}
}
