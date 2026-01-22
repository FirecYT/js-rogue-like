import { Effect } from '../effects/Effect';

export interface EffectModifier {
	name: string;
	apply(base: Effect): Effect;
}
