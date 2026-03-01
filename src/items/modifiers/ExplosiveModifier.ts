import { Modifier } from '../Modifier';
import { Effect } from '../../effects/Effect';
import { EffectSystem } from '../../systems/EffectSystem';
import { ExplosionEffect } from '../../effects/ExplosionEffect';

/**
 * Модификатор: при попадании (onHit) создаётся взрыв в позиции эффекта.
 */
export class ExplosiveModifier implements Modifier {
	id = 'explosive';
	public name = 'Explosive';
	type = 'modifier' as const;

	/**
	 * @param effectSystem - Система эффектов для добавления взрыва
	 */
	constructor(private effectSystem: EffectSystem) { }

	/**
	 * Оборачивает onHit: после исходного onHit добавляет ExplosionEffect в (base.x, base.y).
	 * @param base - Базовый эффект
	 * @returns Тот же эффект с обёрнутым onHit
	 */
	apply(base: Effect): Effect {
		const originalOnHit = base.onHit;
		base.onHit = (target) => {
			originalOnHit?.(target);
			this.effectSystem.addEffect(new ExplosionEffect(base.x, base.y, base.source));
		};
		return base;
	}
}
