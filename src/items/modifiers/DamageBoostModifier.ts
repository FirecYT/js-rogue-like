import { Effect } from "../../effects/Effect";
import { EffectModifier } from "../EffectModifier";

export class DamageBoostModifier implements EffectModifier {
    public name = 'Damage Boost';
    constructor(private multiplier: number) { }
    apply(base: Effect): Effect {
        base.damage = Math.floor(base.damage * this.multiplier);
        return base;
    }
}