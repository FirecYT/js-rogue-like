import { Effect } from "../../effects/Effect";
import { Modifier } from "../Modifier";

export class DamageBoostModifier implements Modifier {
	id = 'damage_boost';
	name = 'Damage Boost';
	type = 'modifier' as const;
	constructor(private multiplier: number) { }
	apply(base: Effect): Effect {
		base.damage = Math.floor(base.damage * this.multiplier);
		return base;
	}
}
