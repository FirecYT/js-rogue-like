import { Modifier } from '../Modifier';
import { Effect } from '../../effects/Effect';
import { EffectSystem } from '../../systems/EffectSystem';
import { ExplosionEffect } from '../../effects/ExplosionEffect';

export class ExplosiveModifier implements Modifier {
	id = 'explosive';
	public name = 'Explosive';
	type = 'modifier' as const;
	constructor(private effectSystem: EffectSystem) { }

	apply(base: Effect): Effect {
		const originalOnHit = base.onHit;
		base.onHit = (target) => {
			originalOnHit?.(target);
			this.effectSystem.addEffect(new ExplosionEffect(base.x, base.y, base.source));
		};
		return base;
	}
}
