import { Effect } from "../../effects/Effect";
import { Modifier } from "../Modifier";

/**
 * Модификатор: траектория эффекта колеблется по синусоиде перпендикулярно направлению.
 */
export class SinusoidalModifier implements Modifier {
	id = 'sinusoidal';
	public name = 'Sinusoidal';
	type = 'modifier' as const;
	private amplitude = 5;
	private frequency = 0.5;

	/**
	 * Оборачивает base.update: перед вызовом сдвигает (x, y) эффекта по перпендикуляру к angle.
	 * @param base - Базовый эффект
	 * @returns Тот же эффект с изменённым update
	 */
	apply(base: Effect): Effect {
		let phase = 0;
		const originalUpdate = base.update.bind(base);
		base.update = (enemies, worldManager) => {
			const perpX = -Math.sin(base.angle);
			const perpY = Math.cos(base.angle);
			const offset = Math.cos(phase) * this.amplitude;
			base.x += perpX * offset;
			base.y += perpY * offset;
			phase += this.frequency;
			originalUpdate(enemies, worldManager);
		};
		return base;
	}
}
