import { Effect } from '../effects/Effect';
import { EffectModifier } from '../items/EffectModifier';
// import { ExplosiveModifier } from '../items/modifiers/ExplosiveModifier';
import { EffectSystem } from './EffectSystem';

export class EffectFactory {
	static create(base: Effect, modifiers: EffectModifier[], effectSystem: EffectSystem): Effect {
		void effectSystem;
		let current = base;
		for (const mod of modifiers) {
			// if (mod instanceof ExplosiveModifier) {
			// 	mod.effectSystem = effectSystem;
			// }
			current = mod.apply(current);
		}
		return current;
	}
}
