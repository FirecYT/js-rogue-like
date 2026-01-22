import { EffectModifier } from '../EffectModifier';
import { Effect } from '../../effects/Effect';
import { BulletEffect } from '../../effects/BulletEffect';
import { LaserBeam } from '../../effects/LaserBeam';
import { EffectSystem } from '../../systems/EffectSystem';
import { ExplosionEffect } from '../../effects/ExplosionEffect';

export class ExplosiveModifier implements EffectModifier {
	public name = 'Explosive';
	constructor(private effectSystem: EffectSystem) {}

	apply(base: Effect): Effect {
		const originalOnHit = base.onHit;
		base.onHit = (target) => {
			originalOnHit?.(target);
			if (base instanceof BulletEffect || base instanceof LaserBeam) {
				this.effectSystem.addEffect(new ExplosionEffect(base.x, base.y, base.source));
			}
		};
		return base;
	}
}
