import { Effect } from "../../effects/Effect";
import { EffectModifier } from "../EffectModifier";

export class PierceModifier implements EffectModifier {
	public name = 'Pierce';
    apply(base: Effect): Effect {
        base.shouldPassThrough = (target) => { void target; return true; }
        return base;
    }
}