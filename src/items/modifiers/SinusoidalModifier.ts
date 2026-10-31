import { Effect } from '../../effects/Effect';
import { Modifier } from '../Modifier';

/**
 * Модификатор: траектория эффекта колеблется по синусоиде перпендикулярно направлению.
 * Реализован как данные (поле wave эффекта), а не подменой метода update.
 */
export class SinusoidalModifier implements Modifier {
	id = 'sinusoidal';
	public name = 'Sinusoidal';
	type = 'modifier' as const;
	private amplitude = 5;
	private frequency = 0.5;

	/**
	 * Задаёт эффекту синусоидальное отклонение траектории.
	 * @param base - Базовый эффект
	 * @returns Тот же эффект с полем wave
	 */
	apply(base: Effect): Effect {
		base.wave = {
			amplitude: (base.wave?.amplitude ?? 0) + this.amplitude,
			frequency: this.frequency,
		};
		return base;
	}
}
