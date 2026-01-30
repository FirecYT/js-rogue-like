import { Effect } from "../../effects/Effect";
import { Modifier } from "../Modifier";

export class SinusoidalModifier implements Modifier {
	id = 'sinusoidal';
	public name = 'Sinusoidal';
	type = 'modifier' as const;
	private amplitude = 5;
	private frequency = 0.5;

	apply(base: Effect): Effect {
		let phase = 0;
		const originalUpdate = base.update.bind(base);
		base.update = (enemies) => {
			const perpX = -Math.sin(base.angle);
			const perpY = Math.cos(base.angle);
			const offset = Math.cos(phase) * this.amplitude;
			base.x += perpX * offset;
			base.y += perpY * offset;
			phase += this.frequency;
			originalUpdate(enemies);
		};
		return base;
	}
}
