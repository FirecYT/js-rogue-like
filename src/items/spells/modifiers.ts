import { ModifierSpell } from './Spell';
import type { CastState } from './Spell';

/** +3 к урону следующего снаряда. */
export class DamagePlusSpell extends ModifierSpell {
	id = 'spell_damage_plus';
	name = 'Урон +3';
	description = 'Следующий снаряд каста получает +3 к урону.';

	applyToCast(state: CastState): void {
		state.damageAdd += 3;
	}
}

/** Удвоение урона следующего снаряда. */
export class DamageMultSpell extends ModifierSpell {
	id = 'spell_damage_mult';
	name = 'Урон ×2';
	description = 'Урон следующего снаряда каста удваивается.';

	applyToCast(state: CastState): void {
		state.damageMult *= 2;
	}
}

/** Следующий снаряд проходит сквозь цели. */
export class PierceSpell extends ModifierSpell {
	id = 'spell_pierce';
	name = 'Пронзание';
	description = 'Следующий снаряд каста проходит сквозь цели.';

	applyToCast(state: CastState): void {
		state.pierce = true;
	}
}

/** Траектория следующего снаряда колеблется по синусоиде. */
export class SinusoidalSpell extends ModifierSpell {
	id = 'spell_sinusoidal';
	name = 'Синусоида';
	description = 'Траектория следующего снаряда колеблется перпендикулярно курсу.';

	applyToCast(state: CastState): void {
		state.wave = {
			amplitude: (state.wave?.amplitude ?? 0) + 5,
			frequency: 0.5,
		};
	}
}

/**
 * Мультикаст: следующий снаряд порождает несколько копий веером.
 * @param count - Количество копий
 * @param spread - Общий угол веера в радианах
 */
export class MulticastSpell extends ModifierSpell {
	id = 'spell_multicast';
	type = 'spell' as const;
	kind = 'modifier' as const;

	/**
	 * @param count - Количество копий снаряда
	 * @param spread - Общий угол веера в радианах
	 */
	constructor(
		public count = 3,
		public spread = 0.4,
		public name = `Мультикаст ×${count}`,
		public description = `Следующий снаряд каста выпускает ${count} копии веером.`
	) {
		super();
	}

	applyToCast(state: CastState): void {
		state.multicast = { count: this.count, spread: this.spread };
	}
}
