import { Effect } from '../effects/Effect';
import { Modifier } from '../items/Modifier';

export class EffectFactory {
	static create(base: Effect, modifiers: (Modifier | null)[]): Effect {
		let current = base;
		for (const mod of modifiers.filter(m => m !== null)) {
			current = mod.apply(current);
		}
		return current;
	}
}
