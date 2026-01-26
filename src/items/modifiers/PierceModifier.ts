import { Effect } from "../../effects/Effect";
import { Modifier } from "../Modifier";

export class PierceModifier implements Modifier {
	id = 'pierce';
	public name = 'Pierce';
	type = 'modifier' as const;
    apply(base: Effect): Effect {
        base.shouldPassThrough = (target) => { void target; return true; }
        return base;
    }
}
